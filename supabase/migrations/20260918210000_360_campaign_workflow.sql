-- Complete private-plane workflow; operator release switch remains OFF by default.
CREATE TABLE private.feedback_360_release (singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton), enabled boolean NOT NULL DEFAULT false);
INSERT INTO private.feedback_360_release DEFAULT VALUES;
ALTER TABLE private.feedback_360_release ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.feedback_360_release FROM PUBLIC, anon, authenticated;
GRANT ALL ON private.feedback_360_release TO service_role;
CREATE FUNCTION private.require_360_release() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=private,pg_temp AS $$
BEGIN IF NOT coalesce((SELECT enabled FROM private.feedback_360_release WHERE singleton),false) THEN RAISE EXCEPTION '360 feedback is not enabled'; END IF; END $$;
REVOKE ALL ON FUNCTION private.require_360_release() FROM PUBLIC,anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION private.guard_identified_campaign_pipeline()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private,pg_temp AS $$
DECLARE c public.campaigns;
BEGIN
 IF TG_TABLE_NAME='campaigns' THEN
  c:=NEW;
  IF TG_OP='UPDATE' AND OLD.status IN ('closed','archived') AND NEW.status NOT IN ('closed','archived') THEN RAISE EXCEPTION 'Closed campaigns cannot reopen'; END IF;
  IF c.campaign_type='feedback_360' THEN
   IF TG_OP='UPDATE' AND NEW.settings IS DISTINCT FROM OLD.settings AND NEW.settings #>> '{anonymity,mode}' IS DISTINCT FROM 'anonymous' THEN RAISE EXCEPTION '360 anonymity policy cannot change'; END IF;
   IF TG_OP='UPDATE' AND (NEW.campaign_type<>OLD.campaign_type OR NEW.template_id IS DISTINCT FROM OLD.template_id OR NEW.organization_id<>OLD.organization_id) THEN RAISE EXCEPTION '360 setup is locked'; END IF;
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
DROP POLICY campaigns_insert ON public.campaigns;
CREATE POLICY campaigns_insert ON public.campaigns FOR INSERT TO authenticated WITH CHECK(public.is_org_admin(organization_id) AND campaign_type='annual_appraisal' AND status='draft' AND questions_frozen_at IS NULL AND send_claimed_at IS NULL);

CREATE FUNCTION public.create_feedback_360(p_name text,p_subject uuid,p_reviewers jsonb,p_template uuid,p_close_date date DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private,pg_temp AS $$
DECLARE org uuid; zone text; campaign uuid; closing timestamptz; r record;
BEGIN
 PERFORM private.require_360_release();
 SELECT organization_id INTO org FROM public.people WHERE id=p_subject AND archived_at IS NULL;
 IF org IS NULL OR auth.uid() IS NULL OR NOT private.is_org_admin(org) THEN RAISE EXCEPTION 'Subject unavailable' USING ERRCODE='42501'; END IF;
 IF nullif(trim(p_name),'') IS NULL THEN RAISE EXCEPTION 'Name the campaign'; END IF;
 IF jsonb_typeof(p_reviewers) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Choose reviewers'; END IF;
 IF jsonb_array_length(p_reviewers)<5 THEN RAISE EXCEPTION 'Choose at least five distinct reviewers'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_to_recordset(p_reviewers) x(person_id uuid,relationship text) GROUP BY person_id HAVING person_id IS NULL OR count(*)>1) THEN RAISE EXCEPTION 'Choose each reviewer once'; END IF;
 FOR r IN SELECT * FROM jsonb_to_recordset(p_reviewers) x(person_id uuid,relationship text) LOOP
  IF r.person_id=p_subject OR r.relationship NOT IN ('manager','peer','direct_report','other') OR r.relationship IS NULL OR NOT EXISTS(SELECT 1 FROM public.people WHERE id=r.person_id AND organization_id=org AND archived_at IS NULL) THEN RAISE EXCEPTION 'Choose available reviewers other than the subject'; END IF;
 END LOOP;
 IF NOT EXISTS(SELECT 1 FROM public.templates WHERE id=p_template AND organization_id=org AND archived_at IS NULL) OR NOT EXISTS(SELECT 1 FROM public.template_questions WHERE template_id=p_template AND organization_id=org) OR EXISTS(SELECT 1 FROM public.template_questions WHERE template_id=p_template AND type NOT IN ('text','rating')) THEN RAISE EXCEPTION 'Choose a non-empty rating/text template'; END IF;
 SELECT coalesce(timezone,'Europe/London') INTO zone FROM public.organizations WHERE id=org;
 IF p_close_date IS NOT NULL THEN SELECT closes_at INTO closing FROM public.campaign_date_instants(p_close_date,zone); IF closing<=now() THEN RAISE EXCEPTION 'Choose a future deadline'; END IF; END IF;
 INSERT INTO public.campaigns(organization_id,name,campaign_type,template_id,timezone,closes_at,created_by,settings,reminder_settings)
 VALUES(org,trim(p_name),'feedback_360',p_template,zone,closing,auth.uid(),'{"anonymity":{"mode":"anonymous"}}','{"enabled":true,"strategy":"cadence","cadenceDays":3}') RETURNING id INTO campaign;
 INSERT INTO public.campaign_subjects(campaign_id,organization_id,person_id) VALUES(campaign,org,p_subject);
 INSERT INTO public.campaign_assignments(campaign_id,organization_id,subject_person_id,respondent_person_id,relationship)
 SELECT campaign,org,p_subject,person_id,relationship FROM jsonb_to_recordset(p_reviewers) x(person_id uuid,relationship text);
 PERFORM public.freeze_campaign_questions(campaign);
 INSERT INTO private.feedback_360_contracts(campaign_id,organization_id,subject_person_id) VALUES(campaign,org,p_subject);
 RETURN campaign;
END $$;
REVOKE ALL ON FUNCTION public.create_feedback_360(text,uuid,jsonb,uuid,date) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.create_feedback_360(text,uuid,jsonb,uuid,date) TO authenticated;

-- Retain annual activation byte-for-byte behind the existing public contract.
ALTER FUNCTION public.activate_campaign(uuid) SET SCHEMA private;
ALTER FUNCTION private.activate_campaign(uuid) RENAME TO activate_identified_campaign;
REVOKE ALL ON FUNCTION private.activate_identified_campaign(uuid) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.activate_campaign(p_campaign_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private,extensions,pg_temp AS $$
DECLARE c public.campaigns; a public.campaign_assignments; raw text; subject text; orgname text;
BEGIN
 SELECT * INTO c FROM public.campaigns WHERE id=p_campaign_id FOR UPDATE;
 IF NOT FOUND OR (NOT private.is_service_role() AND (auth.uid() IS NULL OR NOT private.is_org_admin(c.organization_id))) THEN RAISE EXCEPTION 'Campaign unavailable' USING ERRCODE='42501'; END IF;
 IF c.campaign_type='annual_appraisal' THEN PERFORM private.activate_identified_campaign(c.id); RETURN; END IF;
 PERFORM private.require_360_release();
 IF c.campaign_type<>'feedback_360' OR c.status NOT IN ('draft','scheduled') OR (c.closes_at IS NOT NULL AND c.closes_at<=clock_timestamp()) THEN RAISE EXCEPTION 'Campaign cannot be sent'; END IF;
 IF NOT EXISTS(SELECT 1 FROM private.feedback_360_contracts WHERE campaign_id=c.id AND organization_id=c.organization_id) OR (SELECT count(DISTINCT respondent_person_id) FROM public.campaign_assignments WHERE campaign_id=c.id AND status='pending')<5 THEN RAISE EXCEPTION 'At least five available reviewers are required'; END IF;
 IF EXISTS(SELECT 1 FROM public.campaign_assignments candidate JOIN public.people p ON p.id=candidate.respondent_person_id WHERE candidate.campaign_id=c.id AND p.archived_at IS NOT NULL) THEN RAISE EXCEPTION 'A reviewer has been archived; create a fresh campaign'; END IF;
 SELECT coalesce(p.full_name,p.email) INTO subject FROM private.feedback_360_contracts f JOIN public.people p ON p.id=f.subject_person_id WHERE f.campaign_id=c.id;
 SELECT name INTO orgname FROM public.organizations WHERE id=c.organization_id;
 FOR a IN SELECT * FROM public.campaign_assignments WHERE campaign_id=c.id AND status='pending' FOR UPDATE LOOP
  raw:=encode(extensions.gen_random_bytes(32),'hex');
  INSERT INTO public.access_tokens(assignment_id,organization_id,token_hash,expires_at) VALUES(a.id,c.organization_id,encode(extensions.digest(raw,'sha256'),'hex'),coalesce(c.closes_at,now()+interval '90 days'));
  INSERT INTO public.email_outbox(organization_id,kind,to_email,subject,payload,idempotency_key)
  SELECT c.organization_id,'appraisal_invite',p.email,'360 feedback for '||coalesce(subject,'your colleague'),jsonb_build_object('campaign_id',c.id,'campaign_name',c.name,'campaign_type','feedback_360','raw_token',raw,'assignment_id',a.id,'subject_name',subject,'respondent_name',p.full_name,'org_name',orgname,'closes_at',c.closes_at,'timezone',c.timezone),'invite:'||a.id FROM public.people p WHERE p.id=a.respondent_person_id;
 END LOOP;
 UPDATE public.campaigns SET status='active' WHERE id=c.id;
END $$;
REVOKE ALL ON FUNCTION public.activate_campaign(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.activate_campaign(uuid) TO authenticated,service_role;

CREATE FUNCTION public.schedule_feedback_360(p_campaign_id uuid,p_send_date date)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private,pg_temp AS $$
DECLARE c public.campaigns; sending timestamptz;
BEGIN
 PERFORM private.require_360_release();
 SELECT * INTO c FROM public.campaigns WHERE id=p_campaign_id FOR UPDATE;
 IF NOT FOUND OR auth.uid() IS NULL OR NOT private.is_org_admin(c.organization_id) THEN RAISE EXCEPTION 'Campaign unavailable' USING ERRCODE='42501'; END IF;
 IF c.campaign_type<>'feedback_360' OR c.status NOT IN ('draft','scheduled') OR NOT EXISTS(SELECT 1 FROM private.feedback_360_contracts WHERE campaign_id=c.id) OR (SELECT count(DISTINCT respondent_person_id) FROM public.campaign_assignments WHERE campaign_id=c.id AND status='pending')<5 THEN RAISE EXCEPTION 'Complete the five-reviewer setup first'; END IF;
 SELECT opens_at INTO sending FROM public.campaign_date_instants(p_send_date,c.timezone);
 IF sending<=clock_timestamp() OR (c.closes_at IS NOT NULL AND c.closes_at<=sending) THEN RAISE EXCEPTION 'Choose a future send date before the deadline'; END IF;
 UPDATE public.campaigns SET status='scheduled',opens_at=sending,send_claimed_at=NULL,schedule_error=NULL WHERE id=c.id;
END $$;
REVOKE ALL ON FUNCTION public.schedule_feedback_360(uuid,date) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.schedule_feedback_360(uuid,date) TO authenticated;

ALTER FUNCTION public.schedule_appraisal_campaign(uuid,date) SET SCHEMA private;
ALTER FUNCTION private.schedule_appraisal_campaign(uuid,date) RENAME TO schedule_identified_appraisal;
REVOKE ALL ON FUNCTION private.schedule_identified_appraisal(uuid,date) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.schedule_appraisal_campaign(p_campaign_id uuid,p_send_date date)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private,pg_temp AS $$
BEGIN
 IF (SELECT campaign_type FROM public.campaigns WHERE id=p_campaign_id)='feedback_360' THEN PERFORM public.schedule_feedback_360(p_campaign_id,p_send_date);
 ELSE PERFORM private.schedule_identified_appraisal(p_campaign_id,p_send_date); END IF;
END $$;
REVOKE ALL ON FUNCTION public.schedule_appraisal_campaign(uuid,date) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.schedule_appraisal_campaign(uuid,date) TO authenticated;

CREATE FUNCTION public.respond_campaign_kind(p_raw_token text)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,extensions,pg_temp AS $$
DECLARE kind text;
BEGIN
 SELECT c.campaign_type INTO kind FROM public.access_tokens t JOIN public.campaign_assignments a ON a.id=t.assignment_id JOIN public.campaigns c ON c.id=a.campaign_id
 WHERE t.token_hash=encode(extensions.digest(trim(p_raw_token),'sha256'),'hex') AND t.revoked_at IS NULL AND t.expires_at>now();
 IF NOT FOUND THEN RAISE EXCEPTION 'Invalid or expired personal link'; END IF;
 RETURN kind;
END $$;
REVOKE ALL ON FUNCTION public.respond_campaign_kind(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.respond_campaign_kind(text) TO anon,authenticated;

CREATE FUNCTION private.lock_360_reviewer(p_token text)
RETURNS public.campaign_assignments LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private,extensions,pg_temp AS $$
DECLARE a public.campaign_assignments; c public.campaigns; token public.access_tokens;
BEGIN
 PERFORM private.require_360_release();
 SELECT * INTO token FROM public.access_tokens WHERE token_hash=encode(extensions.digest(trim(p_token),'sha256'),'hex');
 IF NOT FOUND THEN RAISE EXCEPTION 'Invalid personal link'; END IF;
 SELECT * INTO a FROM public.campaign_assignments WHERE id=token.assignment_id;
 SELECT * INTO c FROM public.campaigns WHERE id=a.campaign_id FOR SHARE;
 SELECT * INTO a FROM public.campaign_assignments WHERE id=token.assignment_id FOR UPDATE;
 SELECT * INTO token FROM public.access_tokens WHERE id=token.id;
 IF token.id IS NULL OR a.id IS NULL OR c.id IS NULL OR c.campaign_type<>'feedback_360' OR c.status<>'active' OR (c.closes_at IS NOT NULL AND c.closes_at<=clock_timestamp()) OR token.revoked_at IS NOT NULL OR token.expires_at<=clock_timestamp() OR a.status='revoked' THEN RAISE EXCEPTION 'This feedback request is closed or expired'; END IF;
 RETURN a;
END $$;
REVOKE ALL ON FUNCTION private.lock_360_reviewer(text) FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.feedback_360_open(p_raw_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private,pg_temp AS $$
DECLARE a public.campaign_assignments; response uuid; output jsonb;
BEGIN
 a:=private.lock_360_reviewer(p_raw_token);
 IF a.status='submitted' THEN RETURN jsonb_build_object('submitted',true); END IF;
 SELECT response_id INTO response FROM private.feedback_360_identity WHERE assignment_id=a.id;
 IF NOT FOUND THEN
  INSERT INTO private.feedback_360_responses(campaign_id,organization_id) VALUES(a.campaign_id,a.organization_id) RETURNING id INTO response;
  INSERT INTO private.feedback_360_identity(assignment_id,response_id,campaign_id,organization_id) VALUES(a.id,response,a.campaign_id,a.organization_id);
 END IF;
 UPDATE public.campaign_assignments SET status='opened' WHERE id=a.id AND status IN ('pending','sent');
 SELECT jsonb_build_object('submitted',false,'campaign_name',c.name,'subject_name',coalesce(p.full_name,p.email),'org_name',o.name,
 'questions',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',q.id,'prompt',q.prompt,'type',q.type,'required',q.required,'help_text',q.help_text,'scale',q.scale) ORDER BY q.sort_order,q.id),'[]') FROM public.campaign_questions q WHERE q.campaign_id=c.id),
 'answers',(SELECT coalesce(jsonb_agg(jsonb_build_object('campaign_question_id',ans.question_id,'numeric_value',ans.numeric_value,'text_value',ans.text_value)),'[]') FROM private.feedback_360_answers ans WHERE ans.response_id=response)) INTO output
 FROM public.campaigns c JOIN private.feedback_360_contracts f ON f.campaign_id=c.id JOIN public.people p ON p.id=f.subject_person_id JOIN public.organizations o ON o.id=c.organization_id WHERE c.id=a.campaign_id;
 RETURN output;
END $$;
REVOKE ALL ON FUNCTION public.feedback_360_open(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.feedback_360_open(text) TO anon,authenticated;

CREATE FUNCTION public.feedback_360_write(p_raw_token text,p_answers jsonb,p_submit boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private,pg_temp AS $$
DECLARE a public.campaign_assignments; response uuid; answer jsonb;
BEGIN
 a:=private.lock_360_reviewer(p_raw_token);
 IF a.status='submitted' THEN IF p_submit THEN RETURN; ELSE RAISE EXCEPTION 'Feedback is already submitted'; END IF; END IF;
 IF jsonb_typeof(p_answers) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Answers must be a list'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_answers) x GROUP BY x->>'campaign_question_id' HAVING count(*)>1) THEN RAISE EXCEPTION 'Answer each question once'; END IF;
 PERFORM public.feedback_360_open(p_raw_token);
 SELECT response_id INTO response FROM private.feedback_360_identity WHERE assignment_id=a.id;
 FOR answer IN SELECT * FROM jsonb_array_elements(p_answers) LOOP
  IF coalesce(jsonb_array_length(answer->'choice_values'),0)>0 THEN RAISE EXCEPTION 'Unsupported answer type'; END IF;
  INSERT INTO private.feedback_360_answers(response_id,campaign_id,organization_id,question_id,numeric_value,text_value)
  VALUES(response,a.campaign_id,a.organization_id,(answer->>'campaign_question_id')::uuid,(answer->>'numeric_value')::numeric,answer->>'text_value')
  ON CONFLICT(response_id,question_id) DO UPDATE SET numeric_value=excluded.numeric_value,text_value=excluded.text_value;
 END LOOP;
 IF p_submit THEN
  UPDATE private.feedback_360_responses SET submitted=true WHERE id=response;
  UPDATE public.campaign_assignments SET status='submitted',submitted_at=now() WHERE id=a.id;
 ELSE UPDATE public.campaign_assignments SET status='started' WHERE id=a.id; END IF;
END $$;
REVOKE ALL ON FUNCTION public.feedback_360_write(text,jsonb,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.feedback_360_write(text,jsonb,boolean) TO anon,authenticated;

-- Existing reminders acquire the accurate campaign type/copy in the same outbox.
CREATE OR REPLACE FUNCTION private.stamp_outbox_timezone()
RETURNS trigger LANGUAGE plpgsql SET search_path=public,private,pg_temp AS $$
DECLARE c public.campaigns;
BEGIN
 IF NEW.payload ? 'campaign_id' THEN
  SELECT * INTO c FROM public.campaigns WHERE id=(NEW.payload->>'campaign_id')::uuid AND organization_id=NEW.organization_id;
  IF FOUND THEN
   NEW.payload:=NEW.payload||jsonb_build_object('timezone',c.timezone,'campaign_type',c.campaign_type);
   IF c.campaign_type='feedback_360' THEN NEW.subject:=CASE WHEN NEW.kind='appraisal_reminder' THEN 'Reminder: ' ELSE '' END||'360 feedback for '||coalesce(NEW.payload->>'subject_name','your colleague'); END IF;
  END IF;
 END IF;
 RETURN NEW;
END $$;
NOTIFY pgrst,'reload schema';
