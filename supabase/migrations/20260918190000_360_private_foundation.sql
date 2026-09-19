-- Foundation only: customer-facing 360 is deliberately not enabled.
CREATE TABLE private.feedback_360_contracts (
  campaign_id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,
  subject_person_id uuid NOT NULL,
  minimum_responses integer NOT NULL DEFAULT 5 CHECK (minimum_responses = 5),
  UNIQUE (campaign_id, organization_id),
  FOREIGN KEY (campaign_id, organization_id) REFERENCES public.campaigns(id, organization_id) ON DELETE CASCADE,
  FOREIGN KEY (subject_person_id, organization_id) REFERENCES public.people(id, organization_id)
);
CREATE TABLE private.feedback_360_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  submitted boolean NOT NULL DEFAULT false,
  UNIQUE (id, campaign_id, organization_id),
  FOREIGN KEY (campaign_id, organization_id) REFERENCES private.feedback_360_contracts(campaign_id, organization_id) ON DELETE CASCADE
);
CREATE TABLE private.feedback_360_identity (
  assignment_id uuid PRIMARY KEY REFERENCES public.campaign_assignments(id) ON DELETE CASCADE,
  response_id uuid UNIQUE NOT NULL,
  campaign_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  FOREIGN KEY (response_id, campaign_id, organization_id) REFERENCES private.feedback_360_responses(id, campaign_id, organization_id) ON DELETE CASCADE
);
CREATE TABLE private.feedback_360_answers (
  response_id uuid NOT NULL,
  campaign_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  question_id uuid NOT NULL REFERENCES public.campaign_questions(id) ON DELETE CASCADE,
  numeric_value numeric,
  text_value text,
  PRIMARY KEY (response_id, question_id),
  FOREIGN KEY (response_id, campaign_id, organization_id) REFERENCES private.feedback_360_responses(id, campaign_id, organization_id) ON DELETE CASCADE
);
-- No client policies; explicit grants prevent access even with schema exposure.
ALTER TABLE private.feedback_360_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.feedback_360_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.feedback_360_identity ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.feedback_360_answers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.feedback_360_contracts, private.feedback_360_responses, private.feedback_360_identity, private.feedback_360_answers FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO service_role;
GRANT ALL ON private.feedback_360_contracts, private.feedback_360_responses, private.feedback_360_identity, private.feedback_360_answers TO service_role;

CREATE FUNCTION private.validate_360_contract()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private, pg_temp AS $$
BEGIN
  IF TG_OP='UPDATE' THEN RAISE EXCEPTION '360 privacy contracts are immutable'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id=NEW.campaign_id AND c.organization_id=NEW.organization_id
    AND c.campaign_type='feedback_360' AND c.questions_frozen_at IS NOT NULL) THEN
    RAISE EXCEPTION '360 requires a frozen feedback campaign';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.campaign_questions WHERE campaign_id=NEW.campaign_id AND organization_id=NEW.organization_id)
    OR EXISTS (SELECT 1 FROM public.campaign_questions WHERE campaign_id=NEW.campaign_id AND type NOT IN ('rating','text')) THEN
    RAISE EXCEPTION '360 requires a non-empty rating/text questionnaire';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER feedback_360_contract_validate BEFORE INSERT OR UPDATE ON private.feedback_360_contracts FOR EACH ROW EXECUTE FUNCTION private.validate_360_contract();

CREATE FUNCTION private.validate_360_identity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private, pg_temp AS $$
BEGIN
  -- Serialize enrolment so different relationship rows cannot count one person twice.
  PERFORM 1 FROM private.feedback_360_contracts WHERE campaign_id=NEW.campaign_id FOR UPDATE;
  IF NOT EXISTS (SELECT 1 FROM public.campaign_assignments a JOIN private.feedback_360_contracts c ON c.campaign_id=a.campaign_id AND c.organization_id=a.organization_id
    WHERE a.id=NEW.assignment_id AND a.campaign_id=NEW.campaign_id AND a.organization_id=NEW.organization_id
      AND a.subject_person_id=c.subject_person_id AND a.respondent_person_id<>c.subject_person_id AND a.relationship<>'self') THEN
    RAISE EXCEPTION 'Reviewer unavailable in this anonymous cohort';
  END IF;
  IF EXISTS (
    SELECT 1 FROM private.feedback_360_identity i
    JOIN public.campaign_assignments existing ON existing.id=i.assignment_id
    JOIN public.campaign_assignments incoming ON incoming.id=NEW.assignment_id
    WHERE i.campaign_id=NEW.campaign_id AND existing.respondent_person_id=incoming.respondent_person_id
  ) THEN RAISE EXCEPTION 'Choose each reviewer once'; END IF;
  IF TG_OP='UPDATE' THEN RAISE EXCEPTION 'Anonymous identity links are immutable'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER feedback_360_identity_validate BEFORE INSERT OR UPDATE ON private.feedback_360_identity FOR EACH ROW EXECUTE FUNCTION private.validate_360_identity();

CREATE FUNCTION private.validate_360_answer()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private, pg_temp AS $$
DECLARE q public.campaign_questions; final boolean;
BEGIN
  SELECT submitted INTO final FROM private.feedback_360_responses WHERE id=NEW.response_id FOR UPDATE;
  IF final THEN RAISE EXCEPTION 'Submitted feedback cannot be changed'; END IF;
  SELECT * INTO q FROM public.campaign_questions WHERE id=NEW.question_id AND campaign_id=NEW.campaign_id AND organization_id=NEW.organization_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Question unavailable in this feedback campaign'; END IF;
  IF q.type NOT IN ('rating','text') THEN RAISE EXCEPTION '360 foundation supports only rating and text questions'; END IF;
  IF NEW.numeric_value IS NOT NULL AND (q.type<>'rating' OR NEW.numeric_value < coalesce((q.scale->>'min')::numeric,1) OR NEW.numeric_value > coalesce((q.scale->>'max')::numeric,5)) THEN RAISE EXCEPTION 'Choose a valid rating'; END IF;
  IF NEW.text_value IS NOT NULL AND q.type<>'text' THEN RAISE EXCEPTION 'Written answers require a text question'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER feedback_360_answer_validate BEFORE INSERT OR UPDATE ON private.feedback_360_answers FOR EACH ROW EXECUTE FUNCTION private.validate_360_answer();

CREATE FUNCTION private.validate_360_submission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private, pg_temp AS $$
BEGIN
  IF TG_OP='INSERT' AND NEW.submitted THEN RAISE EXCEPTION 'Save feedback before submitting'; END IF;
  IF TG_OP='UPDATE' THEN
    IF OLD.submitted OR NEW.id<>OLD.id OR NEW.campaign_id<>OLD.campaign_id OR NEW.organization_id<>OLD.organization_id THEN RAISE EXCEPTION 'Feedback identity and submitted state are immutable'; END IF;
    IF NEW.submitted THEN
      IF NOT EXISTS (SELECT 1 FROM private.feedback_360_identity WHERE response_id=NEW.id) THEN RAISE EXCEPTION 'Feedback requires an invitation'; END IF;
      IF EXISTS (SELECT 1 FROM public.campaign_questions q WHERE q.campaign_id=NEW.campaign_id AND q.required AND NOT EXISTS (
        SELECT 1 FROM private.feedback_360_answers a WHERE a.response_id=NEW.id AND a.question_id=q.id
          AND ((q.type='rating' AND a.numeric_value IS NOT NULL) OR (q.type='text' AND nullif(trim(a.text_value),'') IS NOT NULL))
      )) THEN RAISE EXCEPTION 'Please answer every required question'; END IF;
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER feedback_360_submission_validate BEFORE INSERT OR UPDATE ON private.feedback_360_responses FOR EACH ROW EXECUTE FUNCTION private.validate_360_submission();
REVOKE ALL ON FUNCTION private.validate_360_contract(), private.validate_360_identity(), private.validate_360_answer(), private.validate_360_submission() FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.feedback_360_report(p_campaign_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, private, pg_temp AS $$
DECLARE c public.campaigns; minimum integer; total integer; questions jsonb;
BEGIN
  SELECT * INTO c FROM public.campaigns WHERE id=p_campaign_id;
  IF NOT FOUND OR auth.uid() IS NULL OR NOT private.is_org_admin(c.organization_id) THEN RAISE EXCEPTION 'Feedback report unavailable' USING ERRCODE='42501'; END IF;
  SELECT minimum_responses INTO minimum FROM private.feedback_360_contracts WHERE campaign_id=c.id AND organization_id=c.organization_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('state','unavailable'); END IF;
  IF c.status NOT IN ('closed','archived') THEN RETURN jsonb_build_object('state','not_closed'); END IF;
  SELECT count(*) INTO total FROM private.feedback_360_responses WHERE campaign_id=c.id AND submitted;
  IF total<minimum THEN RETURN jsonb_build_object('state','insufficient_responses','minimum_responses',minimum); END IF;
  SELECT coalesce(jsonb_agg(row.payload ORDER BY row.sort_order,row.question_id),'[]') INTO questions FROM (
    SELECT q.sort_order,q.id question_id,jsonb_build_object('question_id',q.id,'prompt',q.prompt,'type',q.type,'answer_count',count(*),
      'average',CASE WHEN q.type='rating' THEN round(avg(a.numeric_value),2) END,
      'comments',CASE WHEN q.type='text' THEN jsonb_agg(a.text_value ORDER BY a.text_value COLLATE "C") END) payload
    FROM public.campaign_questions q JOIN private.feedback_360_answers a ON a.question_id=q.id AND a.campaign_id=q.campaign_id AND a.organization_id=q.organization_id
    JOIN private.feedback_360_responses r ON r.id=a.response_id AND r.campaign_id=q.campaign_id AND r.organization_id=q.organization_id AND r.submitted
    WHERE q.campaign_id=c.id AND ((q.type='rating' AND a.numeric_value IS NOT NULL) OR (q.type='text' AND nullif(trim(a.text_value),'') IS NOT NULL))
    GROUP BY q.id HAVING count(*)>=minimum
  ) row;
  RETURN jsonb_build_object('state','available','minimum_responses',minimum,'completed',total,'questions',questions);
END $$;
REVOKE ALL ON FUNCTION public.feedback_360_report(uuid) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.feedback_360_report(uuid) TO authenticated;

-- Fail closed until a dedicated 360 respondent/invitation engine is complete.
CREATE FUNCTION private.guard_identified_campaign_pipeline()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private, pg_temp AS $$
DECLARE c public.campaigns;
BEGIN
  IF TG_TABLE_NAME='campaigns' THEN
    IF NEW.status IN ('closed','archived') AND TG_OP='UPDATE' THEN RETURN NEW; END IF;
    c := NEW;
    -- Trusted operators may prepare inert drafts; clients may not enable them.
    IF c.campaign_type='feedback_360' AND c.status='draft' AND auth.uid() IS NULL THEN RETURN NEW; END IF;
  ELSE
    SELECT * INTO c FROM public.campaigns WHERE id=NEW.campaign_id;
  END IF;
  IF c.campaign_type <> 'annual_appraisal' OR coalesce(c.settings #>> '{anonymity,mode}','identified')<>'identified' THEN
    RAISE EXCEPTION '360 and anonymous collection are not enabled';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.guard_identified_campaign_pipeline() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER campaigns_guard_collection BEFORE INSERT OR UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION private.guard_identified_campaign_pipeline();
CREATE TRIGGER responses_guard_collection BEFORE INSERT OR UPDATE ON public.responses FOR EACH ROW EXECUTE FUNCTION private.guard_identified_campaign_pipeline();
NOTIFY pgrst, 'reload schema';
