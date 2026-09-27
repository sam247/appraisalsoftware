-- Editable anonymous drafts. Private respondent data remains behind the
-- existing contract; conversion is possible only before any send or response.
CREATE OR REPLACE FUNCTION private.guard_identified_campaign_pipeline()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private,pg_temp AS $$
DECLARE c public.campaigns;
BEGIN
 IF TG_TABLE_NAME='campaigns' THEN
  c:=NEW;
  IF TG_OP='UPDATE' AND OLD.status IN ('closed','archived') AND NEW.status NOT IN ('closed','archived') THEN RAISE EXCEPTION 'Closed campaigns cannot reopen'; END IF;
  IF c.campaign_type='feedback_360' THEN
   IF TG_OP='UPDATE' AND NEW.settings IS DISTINCT FROM OLD.settings AND NEW.settings #>> '{anonymity,mode}' IS DISTINCT FROM 'anonymous' THEN RAISE EXCEPTION '360 anonymity policy cannot change'; END IF;
   IF TG_OP='UPDATE' AND (NEW.campaign_type<>OLD.campaign_type OR NEW.organization_id<>OLD.organization_id) THEN RAISE EXCEPTION '360 setup is locked'; END IF;
   IF TG_OP='UPDATE' AND NEW.template_id IS DISTINCT FROM OLD.template_id AND
     (OLD.status<>'draft' OR OLD.questions_frozen_at IS NOT NULL OR EXISTS(SELECT 1 FROM private.feedback_360_contracts WHERE campaign_id=OLD.id)) THEN
     RAISE EXCEPTION '360 questions are locked after finalisation';
   END IF;
   IF NEW.status IN ('closed','archived') THEN RETURN NEW; END IF;
   IF NEW.status='draft' THEN RETURN NEW; END IF;
   PERFORM private.require_360_release();
   IF NOT EXISTS (SELECT 1 FROM private.feedback_360_contracts WHERE campaign_id=c.id AND organization_id=c.organization_id) THEN RAISE EXCEPTION '360 privacy setup is required'; END IF;
   RETURN NEW;
  END IF;
 ELSE SELECT * INTO c FROM public.campaigns WHERE id=NEW.campaign_id;
 END IF;
 IF c.campaign_type<>'annual_appraisal' OR coalesce(c.settings #>> '{anonymity,mode}','identified')<>'identified' THEN RAISE EXCEPTION '360 cannot use the identified response pipeline'; END IF;
 RETURN NEW;
END $$;

CREATE FUNCTION public.create_feedback_360_draft(p_name text, p_organization_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private,pg_temp AS $$
DECLARE c uuid; zone text;
BEGIN
 PERFORM private.require_360_release();
 IF auth.uid() IS NULL OR NOT private.is_org_admin(p_organization_id) THEN RAISE EXCEPTION 'Campaign unavailable' USING ERRCODE='42501'; END IF;
 IF nullif(trim(p_name),'') IS NULL THEN RAISE EXCEPTION 'Name the campaign'; END IF;
 SELECT timezone INTO zone FROM public.organizations WHERE id=p_organization_id;
 IF zone IS NULL THEN RAISE EXCEPTION 'Organisation unavailable'; END IF;
 INSERT INTO public.campaigns(organization_id,name,campaign_type,timezone,created_by,settings,reminder_settings)
 VALUES(p_organization_id,trim(p_name),'feedback_360',zone,auth.uid(),'{"anonymity":{"mode":"anonymous"}}','{"enabled":true,"strategy":"cadence","cadenceDays":3}')
 RETURNING id INTO c;
 RETURN c;
END $$;
REVOKE ALL ON FUNCTION public.create_feedback_360_draft(text,uuid) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.create_feedback_360_draft(text,uuid) TO authenticated;

CREATE FUNCTION private.assert_360_unstarted(p_campaign_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private,pg_temp AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM public.access_tokens t JOIN public.campaign_assignments a ON a.id=t.assignment_id WHERE a.campaign_id=p_campaign_id)
   OR EXISTS(SELECT 1 FROM public.email_outbox o WHERE o.payload->>'campaign_id'=p_campaign_id::text
     OR EXISTS(SELECT 1 FROM public.campaign_assignments a WHERE a.campaign_id=p_campaign_id AND (o.payload->>'assignment_id'=a.id::text OR o.idempotency_key='invite:'||a.id::text)))
   OR EXISTS(SELECT 1 FROM private.feedback_360_identity WHERE campaign_id=p_campaign_id)
   OR EXISTS(SELECT 1 FROM private.feedback_360_responses WHERE campaign_id=p_campaign_id)
   OR EXISTS(SELECT 1 FROM private.feedback_360_answers WHERE campaign_id=p_campaign_id)
   OR EXISTS(SELECT 1 FROM public.responses WHERE campaign_id=p_campaign_id)
   OR EXISTS(SELECT 1 FROM public.campaign_assignments WHERE campaign_id=p_campaign_id AND status<>'pending')
 THEN RAISE EXCEPTION 'This 360 draft has delivery or private feedback data and cannot be converted'; END IF;
END $$;
REVOKE ALL ON FUNCTION private.assert_360_unstarted(uuid) FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION private.convert_unused_360_draft(p_campaign_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private,pg_temp AS $$
DECLARE c public.campaigns;
BEGIN
 SELECT * INTO c FROM public.campaigns WHERE id=p_campaign_id FOR UPDATE;
 IF NOT FOUND OR c.campaign_type<>'feedback_360' OR c.status<>'draft' THEN RAISE EXCEPTION 'Only an editable 360 draft can change setup'; END IF;
 PERFORM private.assert_360_unstarted(c.id);
 IF c.questions_frozen_at IS NOT NULL OR EXISTS(SELECT 1 FROM private.feedback_360_contracts WHERE campaign_id=c.id) THEN
   DELETE FROM private.feedback_360_contracts WHERE campaign_id=c.id;
   DELETE FROM public.campaign_questions WHERE campaign_id=c.id;
   UPDATE public.campaigns SET questions_frozen_at=NULL WHERE id=c.id;
 END IF;
END $$;
REVOKE ALL ON FUNCTION private.convert_unused_360_draft(uuid) FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.save_feedback_360_cohort(p_campaign_id uuid,p_subject uuid,p_reviewers jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private,pg_temp AS $$
DECLARE c public.campaigns; r record;
BEGIN
 PERFORM private.require_360_release();
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE='42501'; END IF;
 SELECT * INTO c FROM public.campaigns WHERE id=p_campaign_id FOR UPDATE;
 IF NOT FOUND OR NOT private.is_org_admin(c.organization_id) THEN RAISE EXCEPTION 'Campaign unavailable' USING ERRCODE='42501'; END IF;
 IF c.campaign_type<>'feedback_360' OR c.status<>'draft' THEN RAISE EXCEPTION 'Only a 360 draft can change reviewers'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.people WHERE id=p_subject AND organization_id=c.organization_id AND archived_at IS NULL) THEN RAISE EXCEPTION 'Choose an available subject'; END IF;
 IF p_reviewers IS NULL OR jsonb_typeof(p_reviewers)<>'array' THEN RAISE EXCEPTION 'Choose reviewers'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_reviewers) x WHERE jsonb_typeof(x)<>'object') THEN RAISE EXCEPTION 'Invalid reviewer'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_to_recordset(p_reviewers) x(person_id uuid,relationship text) GROUP BY person_id HAVING person_id IS NULL OR count(*)>1) THEN RAISE EXCEPTION 'Choose each reviewer once'; END IF;
 FOR r IN SELECT * FROM jsonb_to_recordset(p_reviewers) x(person_id uuid,relationship text) LOOP
   IF r.person_id=p_subject OR r.relationship IS NULL OR r.relationship NOT IN ('manager','peer','direct_report','other') OR NOT EXISTS(SELECT 1 FROM public.people WHERE id=r.person_id AND organization_id=c.organization_id AND archived_at IS NULL)
   THEN RAISE EXCEPTION 'Choose available reviewers other than the subject'; END IF;
 END LOOP;
 PERFORM private.convert_unused_360_draft(c.id);
 DELETE FROM public.campaign_assignments WHERE campaign_id=c.id;
 DELETE FROM public.campaign_subjects WHERE campaign_id=c.id;
 INSERT INTO public.campaign_subjects(campaign_id,organization_id,person_id) VALUES(c.id,c.organization_id,p_subject);
 INSERT INTO public.campaign_assignments(campaign_id,organization_id,subject_person_id,respondent_person_id,relationship)
 SELECT c.id,c.organization_id,p_subject,person_id,relationship FROM jsonb_to_recordset(p_reviewers) x(person_id uuid,relationship text);
END $$;
REVOKE ALL ON FUNCTION public.save_feedback_360_cohort(uuid,uuid,jsonb) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.save_feedback_360_cohort(uuid,uuid,jsonb) TO authenticated;

CREATE FUNCTION public.save_feedback_360_template(p_campaign_id uuid,p_template uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private,pg_temp AS $$
DECLARE c public.campaigns;
BEGIN
 PERFORM private.require_360_release();
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE='42501'; END IF;
 SELECT * INTO c FROM public.campaigns WHERE id=p_campaign_id FOR UPDATE;
 IF NOT FOUND OR NOT private.is_org_admin(c.organization_id) THEN RAISE EXCEPTION 'Campaign unavailable' USING ERRCODE='42501'; END IF;
 IF c.campaign_type<>'feedback_360' OR c.status<>'draft' THEN RAISE EXCEPTION 'Only a 360 draft can change questions'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.templates WHERE id=p_template AND organization_id=c.organization_id AND archived_at IS NULL)
 OR NOT EXISTS(SELECT 1 FROM public.template_questions WHERE template_id=p_template AND organization_id=c.organization_id)
 OR EXISTS(SELECT 1 FROM public.template_questions WHERE template_id=p_template AND type NOT IN ('rating','text'))
 THEN RAISE EXCEPTION 'Choose a non-empty rating/text template'; END IF;
 PERFORM private.convert_unused_360_draft(c.id);
 UPDATE public.campaigns SET template_id=p_template WHERE id=c.id;
END $$;
REVOKE ALL ON FUNCTION public.save_feedback_360_template(uuid,uuid) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.save_feedback_360_template(uuid,uuid) TO authenticated;

CREATE FUNCTION public.save_feedback_360_timing(p_campaign_id uuid,p_mode text,p_send_date date DEFAULT NULL,p_close_date date DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private,pg_temp AS $$
DECLARE c public.campaigns; sending timestamptz; closing timestamptz;
BEGIN
 PERFORM private.require_360_release();
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE='42501'; END IF;
 SELECT * INTO c FROM public.campaigns WHERE id=p_campaign_id FOR UPDATE;
 IF NOT FOUND OR NOT private.is_org_admin(c.organization_id) THEN RAISE EXCEPTION 'Campaign unavailable' USING ERRCODE='42501'; END IF;
 IF c.campaign_type<>'feedback_360' OR c.status<>'draft' THEN RAISE EXCEPTION 'Only a 360 draft can change timing'; END IF;
 PERFORM private.assert_360_unstarted(c.id);
 IF p_mode IS NULL OR p_mode NOT IN ('now','later') OR (p_mode='now' AND p_send_date IS NOT NULL) OR (p_mode='later' AND p_send_date IS NULL) THEN RAISE EXCEPTION 'Choose send now or a send date'; END IF;
 IF p_mode='later' THEN SELECT opens_at INTO sending FROM public.campaign_date_instants(p_send_date,c.timezone);
   IF sending<=clock_timestamp() THEN RAISE EXCEPTION 'Send time must be in the future'; END IF;
 END IF;
 IF p_close_date IS NOT NULL THEN SELECT closes_at INTO closing FROM public.campaign_date_instants(p_close_date,c.timezone);
   IF closing<=clock_timestamp() OR (sending IS NOT NULL AND closing<=sending) THEN RAISE EXCEPTION 'Close time must follow the send time'; END IF;
 END IF;
 UPDATE public.campaigns SET settings=coalesce(settings,'{}'::jsonb)||jsonb_build_object('draft_delivery_mode',p_mode),opens_at=sending,closes_at=closing WHERE id=c.id;
END $$;
REVOKE ALL ON FUNCTION public.save_feedback_360_timing(uuid,text,date,date) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.save_feedback_360_timing(uuid,text,date,date) TO authenticated;

CREATE FUNCTION public.finalize_feedback_360_draft(p_campaign_id uuid,p_acknowledged boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private,pg_temp AS $$
DECLARE c public.campaigns; subject_id uuid; reviewer_count integer; send_date date; expected_send timestamptz;
BEGIN
 PERFORM private.require_360_release();
 IF p_acknowledged IS DISTINCT FROM true THEN RAISE EXCEPTION 'Acknowledge the anonymity policy before sending'; END IF;
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE='42501'; END IF;
 SELECT * INTO c FROM public.campaigns WHERE id=p_campaign_id FOR UPDATE;
 IF NOT FOUND OR NOT private.is_org_admin(c.organization_id) THEN RAISE EXCEPTION 'Campaign unavailable' USING ERRCODE='42501'; END IF;
 IF c.campaign_type<>'feedback_360' OR c.status<>'draft' OR c.settings #>> '{anonymity,mode}'<>'anonymous' THEN RAISE EXCEPTION 'Only an anonymous 360 draft can be finalised'; END IF;
 IF c.settings->>'draft_delivery_mode' NOT IN ('now','later') OR c.settings->>'draft_delivery_mode' IS NULL THEN RAISE EXCEPTION 'Save delivery timing first'; END IF;
 SELECT person_id INTO subject_id FROM public.campaign_subjects WHERE campaign_id=c.id AND organization_id=c.organization_id;
 IF subject_id IS NULL OR (SELECT count(*) FROM public.campaign_subjects WHERE campaign_id=c.id)<>1
   OR NOT EXISTS(SELECT 1 FROM public.people WHERE id=subject_id AND organization_id=c.organization_id AND archived_at IS NULL)
 THEN RAISE EXCEPTION 'Choose one available subject'; END IF;
 SELECT count(DISTINCT respondent_person_id) INTO reviewer_count FROM public.campaign_assignments WHERE campaign_id=c.id AND status='pending';
 IF reviewer_count<5 OR reviewer_count<>(SELECT count(*) FROM public.campaign_assignments WHERE campaign_id=c.id) OR EXISTS(SELECT 1 FROM public.campaign_assignments a LEFT JOIN public.people p ON p.id=a.respondent_person_id AND p.organization_id=c.organization_id
   WHERE a.campaign_id=c.id AND (a.status<>'pending' OR p.id IS NULL OR p.archived_at IS NOT NULL OR a.respondent_person_id=subject_id OR a.subject_person_id<>subject_id OR a.relationship NOT IN ('manager','peer','direct_report','other')))
 THEN RAISE EXCEPTION 'At least five available reviewers are required'; END IF;
 IF c.closes_at IS NOT NULL AND c.closes_at<=clock_timestamp() THEN RAISE EXCEPTION 'Close time must be in the future'; END IF;
 IF c.settings->>'draft_delivery_mode'='later' THEN
   IF c.opens_at IS NULL OR c.opens_at<=clock_timestamp() OR (c.closes_at IS NOT NULL AND c.closes_at<=c.opens_at) THEN RAISE EXCEPTION 'Choose a future send date before the deadline'; END IF;
   send_date := (c.opens_at AT TIME ZONE c.timezone)::date;
   SELECT opens_at INTO expected_send FROM public.campaign_date_instants(send_date,c.timezone);
   IF expected_send<>c.opens_at THEN RAISE EXCEPTION 'Saved send time is invalid'; END IF;
 ELSE
   IF c.opens_at IS NOT NULL THEN RAISE EXCEPTION 'Send now cannot have a scheduled date'; END IF;
 END IF;
 IF EXISTS(SELECT 1 FROM private.feedback_360_contracts WHERE campaign_id=c.id) THEN
   IF c.questions_frozen_at IS NULL OR NOT EXISTS(SELECT 1 FROM public.campaign_questions WHERE campaign_id=c.id)
     OR EXISTS(SELECT 1 FROM public.campaign_questions WHERE campaign_id=c.id AND type NOT IN ('rating','text'))
   THEN RAISE EXCEPTION '360 privacy setup is incomplete'; END IF;
 ELSE
   PERFORM private.assert_360_unstarted(c.id);
   IF c.template_id IS NULL OR NOT EXISTS(SELECT 1 FROM public.templates WHERE id=c.template_id AND organization_id=c.organization_id AND archived_at IS NULL)
     OR NOT EXISTS(SELECT 1 FROM public.template_questions WHERE template_id=c.template_id AND organization_id=c.organization_id)
     OR EXISTS(SELECT 1 FROM public.template_questions WHERE template_id=c.template_id AND type NOT IN ('rating','text'))
   THEN RAISE EXCEPTION 'Choose a non-empty rating/text template'; END IF;
   PERFORM public.freeze_campaign_questions(c.id);
   IF NOT EXISTS(SELECT 1 FROM public.campaign_questions WHERE campaign_id=c.id)
     OR EXISTS(SELECT 1 FROM public.campaign_questions WHERE campaign_id=c.id AND type NOT IN ('rating','text'))
   THEN RAISE EXCEPTION 'Choose a non-empty rating/text template'; END IF;
   INSERT INTO private.feedback_360_contracts(campaign_id,organization_id,subject_person_id) VALUES(c.id,c.organization_id,subject_id);
 END IF;
 IF c.settings->>'draft_delivery_mode'='later' THEN PERFORM public.schedule_feedback_360(c.id,send_date);
 ELSE PERFORM public.activate_campaign(c.id); END IF;
END $$;
REVOKE ALL ON FUNCTION public.finalize_feedback_360_draft(uuid,boolean) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.finalize_feedback_360_draft(uuid,boolean) TO authenticated;
NOTIFY pgrst,'reload schema';
