-- Campaign forms are draft-owned questionnaires. The existing campaign_questions
-- rows remain the respondent/results source after the existing freeze boundary.
ALTER TABLE public.campaigns
  ADD COLUMN form_started_at timestamptz,
  ADD COLUMN form_revision bigint NOT NULL DEFAULT 0;

-- A deleted source template clears provenance only; it must never erase the
-- organisation ID or the copied questionnaire.
ALTER TABLE public.campaigns DROP CONSTRAINT campaigns_template_org_fk;
ALTER TABLE public.campaigns ADD CONSTRAINT campaigns_template_org_fk
  FOREIGN KEY (template_id, organization_id) REFERENCES public.templates(id, organization_id)
  ON DELETE SET NULL (template_id);

-- Existing unfrozen drafts with a selected template become independent copies.
-- Already frozen campaigns and their respondent question IDs are untouched.
INSERT INTO public.campaign_questions (
  campaign_id, organization_id, sort_order, type, prompt, help_text, required,
  options, scale, stable_key, competency_key, competency_label, section_key,
  section_label, source_template_question_id
)
SELECT c.id, c.organization_id, tq.sort_order, tq.type, tq.prompt, tq.help_text,
  tq.required, tq.options, tq.scale, tq.stable_key, tq.competency_key,
  tq.competency_label, tq.section_key, tq.section_label, tq.id
FROM public.campaigns c
JOIN public.template_questions tq ON tq.template_id = c.template_id AND tq.organization_id = c.organization_id
WHERE c.status = 'draft' AND c.questions_frozen_at IS NULL
  AND c.campaign_type IN ('annual_appraisal', 'feedback_360')
  AND NOT EXISTS (SELECT 1 FROM public.campaign_questions q WHERE q.campaign_id = c.id);
UPDATE public.campaigns c SET form_started_at = clock_timestamp(), form_revision = 1
WHERE c.status = 'draft' AND c.questions_frozen_at IS NULL
  AND c.campaign_type IN ('annual_appraisal', 'feedback_360')
  AND EXISTS (SELECT 1 FROM public.campaign_questions q WHERE q.campaign_id = c.id);

CREATE FUNCTION private.guard_campaign_form_questions()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private, pg_temp AS $$
DECLARE c public.campaigns; target_id uuid;
BEGIN
  target_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.campaign_id ELSE NEW.campaign_id END;
  SELECT * INTO c FROM public.campaigns WHERE id = target_id FOR UPDATE;
  IF NOT FOUND THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF; -- parent campaign cascade
    RAISE EXCEPTION 'Campaign unavailable';
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF c.status NOT IN ('draft', 'scheduled') OR c.questions_frozen_at IS NOT NULL THEN
      RAISE EXCEPTION 'Campaign questions are frozen';
    END IF;
    RETURN NEW;
  END IF;
  IF c.status <> 'draft' OR c.questions_frozen_at IS NOT NULL
    OR (c.campaign_type = 'feedback_360' AND EXISTS (
      SELECT 1 FROM private.feedback_360_contracts WHERE campaign_id = c.id)) THEN
    RAISE EXCEPTION 'Campaign questions are frozen';
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF NEW.campaign_id <> OLD.campaign_id OR NEW.organization_id <> OLD.organization_id OR NEW.id <> OLD.id THEN
      RAISE EXCEPTION 'Question identity cannot change';
    END IF;
    RETURN NEW;
  END IF;
  RETURN OLD;
END $$;
REVOKE ALL ON FUNCTION private.guard_campaign_form_questions() FROM PUBLIC, anon, authenticated, service_role;
CREATE TRIGGER campaign_questions_guard_form BEFORE INSERT OR UPDATE OR DELETE ON public.campaign_questions
FOR EACH ROW EXECUTE FUNCTION private.guard_campaign_form_questions();

-- Existing 360 cohort/template saves still discard their old pre-send snapshot.
-- Clear the unused freeze flag before deletion so the new question guard applies.
CREATE OR REPLACE FUNCTION private.convert_unused_360_draft(p_campaign_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private,pg_temp AS $$
DECLARE c public.campaigns;
BEGIN
  SELECT * INTO c FROM public.campaigns WHERE id=p_campaign_id FOR UPDATE;
  IF NOT FOUND OR c.campaign_type<>'feedback_360' OR c.status<>'draft' THEN RAISE EXCEPTION 'Only an editable 360 draft can change setup'; END IF;
  PERFORM private.assert_360_unstarted(c.id);
  IF c.questions_frozen_at IS NOT NULL OR EXISTS(SELECT 1 FROM private.feedback_360_contracts WHERE campaign_id=c.id) THEN
    DELETE FROM private.feedback_360_contracts WHERE campaign_id=c.id;
    UPDATE public.campaigns SET questions_frozen_at=NULL WHERE id=c.id;
    DELETE FROM public.campaign_questions WHERE campaign_id=c.id;
  END IF;
END $$;

-- A form edit keeps the safely converted legacy 360 question IDs and metadata.
CREATE FUNCTION private.unlock_unused_360_form(p_campaign_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private,pg_temp AS $$
DECLARE c public.campaigns;
BEGIN
  SELECT * INTO c FROM public.campaigns WHERE id=p_campaign_id FOR UPDATE;
  IF c.campaign_type <> 'feedback_360' OR c.status <> 'draft' THEN RAISE EXCEPTION 'Only a 360 draft can change its form'; END IF;
  PERFORM private.assert_360_unstarted(c.id);
  IF c.questions_frozen_at IS NOT NULL OR EXISTS (SELECT 1 FROM private.feedback_360_contracts WHERE campaign_id=c.id) THEN
    DELETE FROM private.feedback_360_contracts WHERE campaign_id=c.id;
    UPDATE public.campaigns SET questions_frozen_at=NULL, form_started_at=coalesce(form_started_at,clock_timestamp()) WHERE id=c.id;
  END IF;
END $$;
REVOKE ALL ON FUNCTION private.unlock_unused_360_form(uuid) FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION public.start_campaign_form(p_campaign_id uuid, p_template_id uuid DEFAULT NULL)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private,pg_temp AS $$
DECLARE c public.campaigns; next_revision bigint;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE='42501'; END IF;
  SELECT * INTO c FROM public.campaigns WHERE id=p_campaign_id FOR UPDATE;
  IF NOT FOUND OR NOT private.is_org_admin(c.organization_id) THEN RAISE EXCEPTION 'Campaign unavailable' USING ERRCODE='42501'; END IF;
  IF c.campaign_type NOT IN ('annual_appraisal','feedback_360') OR c.status <> 'draft' OR c.questions_frozen_at IS NOT NULL
    OR c.form_started_at IS NOT NULL OR EXISTS(SELECT 1 FROM public.campaign_questions WHERE campaign_id=c.id)
    OR (c.campaign_type='feedback_360' AND EXISTS(SELECT 1 FROM private.feedback_360_contracts WHERE campaign_id=c.id))
  THEN RAISE EXCEPTION 'This form is already configured or locked'; END IF;
  IF c.campaign_type='feedback_360' THEN PERFORM private.require_360_release(); PERFORM private.assert_360_unstarted(c.id); END IF;
  IF p_template_id IS NOT NULL THEN
    IF NOT EXISTS(SELECT 1 FROM public.templates t WHERE t.id=p_template_id AND t.organization_id=c.organization_id AND t.archived_at IS NULL)
      OR NOT EXISTS(SELECT 1 FROM public.template_questions q WHERE q.template_id=p_template_id AND q.organization_id=c.organization_id)
      OR (c.campaign_type='feedback_360' AND EXISTS(SELECT 1 FROM public.template_questions q WHERE q.template_id=p_template_id AND q.type NOT IN ('rating','text')))
    THEN RAISE EXCEPTION 'Choose a compatible template containing questions'; END IF;
  END IF;
  UPDATE public.campaigns SET template_id=p_template_id, form_started_at=clock_timestamp(), form_revision=form_revision+1
  WHERE id=c.id RETURNING form_revision INTO next_revision;
  IF p_template_id IS NOT NULL THEN
    INSERT INTO public.campaign_questions(campaign_id,organization_id,sort_order,type,prompt,help_text,required,options,scale,stable_key,competency_key,competency_label,section_key,section_label,source_template_question_id)
    SELECT c.id,c.organization_id,q.sort_order,q.type,q.prompt,q.help_text,q.required,q.options,q.scale,q.stable_key,q.competency_key,q.competency_label,q.section_key,q.section_label,q.id
    FROM public.template_questions q WHERE q.template_id=p_template_id AND q.organization_id=c.organization_id ORDER BY q.sort_order,q.id;
    IF NOT EXISTS(SELECT 1 FROM public.campaign_questions WHERE campaign_id=c.id)
      OR (c.campaign_type='feedback_360' AND EXISTS(SELECT 1 FROM public.campaign_questions WHERE campaign_id=c.id AND type NOT IN ('rating','text')))
    THEN RAISE EXCEPTION 'Choose a compatible template containing questions'; END IF;
  END IF;
  RETURN next_revision;
END $$;
REVOKE ALL ON FUNCTION public.start_campaign_form(uuid,uuid) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.start_campaign_form(uuid,uuid) TO authenticated;

CREATE FUNCTION public.save_campaign_form(p_campaign_id uuid,p_expected_revision bigint,p_questions jsonb)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private,pg_temp AS $$
DECLARE c public.campaigns; item jsonb; q_id uuid; q_type text; q_prompt text; q_help text;
  q_options jsonb; q_scale jsonb; min_value integer; max_value integer; ordinal integer := 0; next_revision bigint;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE='42501'; END IF;
  SELECT * INTO c FROM public.campaigns WHERE id=p_campaign_id FOR UPDATE;
  IF NOT FOUND OR NOT private.is_org_admin(c.organization_id) THEN RAISE EXCEPTION 'Campaign unavailable' USING ERRCODE='42501'; END IF;
  IF c.campaign_type NOT IN ('annual_appraisal','feedback_360') OR c.status <> 'draft' THEN RAISE EXCEPTION 'Only a draft campaign form can be edited'; END IF;
  IF c.campaign_type='feedback_360' THEN PERFORM private.require_360_release(); END IF;
  IF c.form_revision <> p_expected_revision THEN RAISE EXCEPTION 'This form changed elsewhere. Reload before saving'; END IF;
  IF p_questions IS NULL OR jsonb_typeof(p_questions)<>'array' OR jsonb_array_length(p_questions)>100 THEN RAISE EXCEPTION 'Form must contain at most 100 questions'; END IF;
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_questions) x WHERE jsonb_typeof(x)<>'object') THEN RAISE EXCEPTION 'Invalid question'; END IF;
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_questions) x GROUP BY x->>'id' HAVING x->>'id' IS NULL OR count(*)>1) THEN RAISE EXCEPTION 'Question IDs must be unique'; END IF;
  IF c.campaign_type='feedback_360' THEN
    PERFORM private.unlock_unused_360_form(c.id);
    SELECT * INTO c FROM public.campaigns WHERE id=p_campaign_id;
  ELSIF c.questions_frozen_at IS NOT NULL THEN RAISE EXCEPTION 'Campaign questions are frozen'; END IF;
  IF c.form_started_at IS NULL THEN
    IF EXISTS(SELECT 1 FROM public.campaign_questions WHERE campaign_id=c.id) THEN RAISE EXCEPTION 'Start this form before editing'; END IF;
    UPDATE public.campaigns SET form_started_at=clock_timestamp() WHERE id=c.id;
  END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(p_questions) LOOP
    q_id := (item->>'id')::uuid;
    q_type := item->>'type';
    q_prompt := trim(coalesce(item->>'prompt',''));
    q_help := nullif(trim(coalesce(item->>'help_text','')),'');
    q_options := coalesce(item->'options','[]'::jsonb);
    q_scale := coalesce(item->'scale','{}'::jsonb);
    IF q_id IS NULL OR q_prompt='' OR length(q_prompt)>500 OR length(coalesce(q_help,''))>1000
      OR q_type NOT IN ('rating','text','single_choice','multi_choice','nps') OR q_type IS NULL
      OR (c.campaign_type='feedback_360' AND q_type NOT IN ('rating','text'))
      OR jsonb_typeof(q_options)<>'array' OR jsonb_typeof(q_scale)<>'object'
    THEN RAISE EXCEPTION 'Choose supported questions with valid text'; END IF;
    IF q_type IN ('single_choice','multi_choice') THEN
      IF jsonb_array_length(q_options)<2 OR jsonb_array_length(q_options)>20
        OR EXISTS(SELECT 1 FROM jsonb_array_elements(q_options) x WHERE jsonb_typeof(x)<>'string' OR nullif(trim(x #>> '{}'),'') IS NULL)
        OR EXISTS(SELECT 1 FROM jsonb_array_elements_text(q_options) x GROUP BY lower(trim(x)) HAVING count(*)>1)
      THEN RAISE EXCEPTION 'Choice questions need two to twenty distinct options'; END IF;
    END IF;
    IF q_type IN ('rating','nps') THEN
      min_value := coalesce((q_scale->>'min')::integer,CASE WHEN q_type='nps' THEN 0 ELSE 1 END);
      max_value := coalesce((q_scale->>'max')::integer,CASE WHEN q_type='nps' THEN 10 ELSE 5 END);
      IF min_value<0 OR max_value>10 OR max_value<=min_value THEN RAISE EXCEPTION 'Choose a valid rating scale'; END IF;
    END IF;
    IF EXISTS(SELECT 1 FROM public.campaign_questions WHERE id=q_id AND campaign_id<>c.id) THEN RAISE EXCEPTION 'Question belongs to another campaign'; END IF;
    UPDATE public.campaign_questions SET sort_order=ordinal,type=q_type,prompt=q_prompt,help_text=q_help,
      required=coalesce((item->>'required')::boolean,true),options=q_options,scale=q_scale
    WHERE id=q_id AND campaign_id=c.id;
    IF NOT FOUND THEN
      INSERT INTO public.campaign_questions(id,campaign_id,organization_id,sort_order,type,prompt,help_text,required,options,scale)
      VALUES(q_id,c.id,c.organization_id,ordinal,q_type,q_prompt,q_help,coalesce((item->>'required')::boolean,true),q_options,q_scale);
    END IF;
    ordinal := ordinal+1;
  END LOOP;
  DELETE FROM public.campaign_questions q WHERE q.campaign_id=c.id AND NOT EXISTS(
    SELECT 1 FROM jsonb_array_elements(p_questions) x WHERE (x->>'id')::uuid=q.id);
  UPDATE public.campaigns SET form_revision=form_revision+1 WHERE id=c.id RETURNING form_revision INTO next_revision;
  RETURN next_revision;
END $$;
REVOKE ALL ON FUNCTION public.save_campaign_form(uuid,bigint,jsonb) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.save_campaign_form(uuid,bigint,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.freeze_campaign_questions(p_campaign_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private,extensions,pg_temp AS $$
DECLARE c public.campaigns;
BEGIN
  SELECT * INTO c FROM public.campaigns WHERE id=p_campaign_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Campaign not found' USING ERRCODE='P0002'; END IF;
  IF NOT private.is_service_role() AND (auth.uid() IS NULL OR NOT private.is_org_admin(c.organization_id)) THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
  IF c.questions_frozen_at IS NOT NULL THEN RETURN; END IF;
  IF c.status NOT IN ('draft','scheduled') THEN RAISE EXCEPTION 'Can only freeze draft or scheduled campaigns'; END IF;
  IF c.form_started_at IS NOT NULL THEN
    IF NOT EXISTS(SELECT 1 FROM public.campaign_questions WHERE campaign_id=c.id AND organization_id=c.organization_id) THEN RAISE EXCEPTION 'Add at least one question'; END IF;
    IF c.campaign_type='feedback_360' AND EXISTS(SELECT 1 FROM public.campaign_questions WHERE campaign_id=c.id AND type NOT IN ('rating','text')) THEN RAISE EXCEPTION '360 supports rating and text questions'; END IF;
  ELSE
    IF c.template_id IS NULL THEN RAISE EXCEPTION 'Campaign has no form or template'; END IF;
    INSERT INTO public.campaign_questions(campaign_id,organization_id,sort_order,type,prompt,help_text,required,options,scale,stable_key,competency_key,competency_label,section_key,section_label,source_template_question_id)
    SELECT c.id,c.organization_id,q.sort_order,q.type,q.prompt,q.help_text,q.required,q.options,q.scale,q.stable_key,q.competency_key,q.competency_label,q.section_key,q.section_label,q.id
    FROM public.template_questions q WHERE q.template_id=c.template_id AND q.organization_id=c.organization_id ORDER BY q.sort_order,q.id;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM public.campaign_questions WHERE campaign_id=c.id) THEN RAISE EXCEPTION 'Add at least one question'; END IF;
  UPDATE public.campaigns SET questions_frozen_at=clock_timestamp() WHERE id=c.id;
END $$;

CREATE OR REPLACE FUNCTION private.validate_annual_send(p_campaign_id uuid,p_scheduled boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private,pg_temp AS $$
DECLARE c public.campaigns;
BEGIN
  SELECT * INTO c FROM public.campaigns WHERE id=p_campaign_id FOR UPDATE;
  IF NOT FOUND OR c.campaign_type<>'annual_appraisal' OR c.status NOT IN ('draft','scheduled') THEN RAISE EXCEPTION 'Only a draft or scheduled annual appraisal can be sent'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.campaign_assignments WHERE campaign_id=c.id AND organization_id=c.organization_id AND status='pending') THEN RAISE EXCEPTION 'Save participants before sending'; END IF;
  IF c.questions_frozen_at IS NULL AND NOT EXISTS(SELECT 1 FROM public.campaign_questions WHERE campaign_id=c.id)
    AND (c.form_started_at IS NOT NULL OR c.template_id IS NULL OR NOT EXISTS(SELECT 1 FROM public.template_questions WHERE template_id=c.template_id AND organization_id=c.organization_id))
  THEN
    IF c.form_started_at IS NOT NULL THEN RAISE EXCEPTION 'Add at least one question'; END IF;
    RAISE EXCEPTION 'Choose a template containing questions';
  END IF;
  IF c.closes_at IS NOT NULL AND c.closes_at<=clock_timestamp() THEN RAISE EXCEPTION 'Close time must be in the future'; END IF;
  IF p_scheduled AND c.opens_at IS NOT NULL AND (c.opens_at<=clock_timestamp() OR (c.closes_at IS NOT NULL AND c.closes_at<=c.opens_at)) THEN RAISE EXCEPTION 'Choose a future send date before the deadline'; END IF;
END $$;

-- Local forms must not regain a live template link via older mutation paths.
CREATE FUNCTION private.guard_form_template_change()
RETURNS trigger LANGUAGE plpgsql SET search_path=public,private,pg_temp AS $$
BEGIN
  IF OLD.form_started_at IS NOT NULL AND NEW.template_id IS DISTINCT FROM OLD.template_id AND NEW.template_id IS NOT NULL THEN
    RAISE EXCEPTION 'Edit the campaign form instead of replacing its template';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.guard_form_template_change() FROM PUBLIC, anon, authenticated, service_role;
CREATE TRIGGER campaigns_guard_form_template BEFORE UPDATE OF template_id ON public.campaigns
FOR EACH ROW EXECUTE FUNCTION private.guard_form_template_change();

-- Finalisation keeps the existing 360 lock, contract and dispatch sequence. A
-- started form is checked from its campaign-owned rows; untouched legacy drafts
-- retain the template fallback during rollout.
CREATE OR REPLACE FUNCTION public.finalize_feedback_360_draft(p_campaign_id uuid,p_acknowledged boolean)
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
   IF c.form_started_at IS NOT NULL THEN
     IF NOT EXISTS(SELECT 1 FROM public.campaign_questions WHERE campaign_id=c.id AND organization_id=c.organization_id)
       OR EXISTS(SELECT 1 FROM public.campaign_questions WHERE campaign_id=c.id AND type NOT IN ('rating','text'))
     THEN RAISE EXCEPTION 'Add a non-empty rating/text form'; END IF;
   ELSIF c.template_id IS NULL OR NOT EXISTS(SELECT 1 FROM public.templates WHERE id=c.template_id AND organization_id=c.organization_id AND archived_at IS NULL)
     OR NOT EXISTS(SELECT 1 FROM public.template_questions WHERE template_id=c.template_id AND organization_id=c.organization_id)
     OR EXISTS(SELECT 1 FROM public.template_questions WHERE template_id=c.template_id AND type NOT IN ('rating','text'))
   THEN RAISE EXCEPTION 'Choose a non-empty rating/text template'; END IF;
   PERFORM public.freeze_campaign_questions(c.id);
   IF NOT EXISTS(SELECT 1 FROM public.campaign_questions WHERE campaign_id=c.id)
     OR EXISTS(SELECT 1 FROM public.campaign_questions WHERE campaign_id=c.id AND type NOT IN ('rating','text'))
   THEN RAISE EXCEPTION 'Add a non-empty rating/text form'; END IF;
   INSERT INTO private.feedback_360_contracts(campaign_id,organization_id,subject_person_id) VALUES(c.id,c.organization_id,subject_id);
 END IF;
 IF c.settings->>'draft_delivery_mode'='later' THEN PERFORM public.schedule_feedback_360(c.id,send_date);
 ELSE PERFORM public.activate_campaign(c.id); END IF;
END $$;

NOTIFY pgrst,'reload schema';
