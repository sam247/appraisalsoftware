-- Preserve the public token RPC contracts, but serialize writes with closing
-- and each other. Shared campaign locks allow different reviewers to save together.
CREATE OR REPLACE FUNCTION private.lock_open_appraisal_assignment(p_raw_token text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, private, extensions, pg_temp
AS $$
DECLARE t public.access_tokens; a public.campaign_assignments; c public.campaigns;
BEGIN
  SELECT * INTO t FROM public.access_tokens WHERE token_hash=encode(extensions.digest(trim(p_raw_token),'sha256'),'hex');
  IF NOT FOUND OR t.revoked_at IS NOT NULL OR t.expires_at <= clock_timestamp() THEN RAISE EXCEPTION 'Invalid or expired link' USING ERRCODE='P0002'; END IF;
  SELECT * INTO a FROM public.campaign_assignments WHERE id=t.assignment_id;
  SELECT * INTO c FROM public.campaigns WHERE id=a.campaign_id FOR SHARE;
  IF NOT FOUND OR c.status <> 'active' OR (c.closes_at IS NOT NULL AND c.closes_at <= clock_timestamp()) THEN RAISE EXCEPTION 'Campaign is not currently open'; END IF;
  SELECT * INTO a FROM public.campaign_assignments WHERE id=t.assignment_id FOR UPDATE;
  IF t.expires_at <= clock_timestamp() OR (c.closes_at IS NOT NULL AND c.closes_at <= clock_timestamp()) THEN RAISE EXCEPTION 'This appraisal has closed'; END IF;
  IF a.status IN ('submitted','revoked') THEN RAISE EXCEPTION 'Assignment is not open for responses'; END IF;
END;
$$;
REVOKE ALL ON FUNCTION private.lock_open_appraisal_assignment(text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.validate_response_answer()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE q public.campaign_questions;
BEGIN
  SELECT cq.* INTO q FROM public.campaign_questions cq JOIN public.responses r ON r.id=NEW.response_id
    WHERE cq.id=NEW.campaign_question_id AND cq.campaign_id=r.campaign_id
      AND cq.organization_id=r.organization_id AND r.organization_id=NEW.organization_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Question unavailable in this appraisal'; END IF;
  IF jsonb_typeof(NEW.choice_values) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Choices must be a list'; END IF;
  IF NEW.numeric_value IS NOT NULL AND (q.type NOT IN ('rating','nps') OR NEW.numeric_value < coalesce((q.scale->>'min')::numeric,1) OR NEW.numeric_value > coalesce((q.scale->>'max')::numeric,5)) THEN
    RAISE EXCEPTION 'Choose a valid rating';
  END IF;
  IF nullif(trim(NEW.text_value),'') IS NOT NULL AND q.type <> 'text' THEN RAISE EXCEPTION 'Written answers require a text question'; END IF;
  IF jsonb_array_length(NEW.choice_values) > 0 THEN
    IF q.type NOT IN ('single_choice','multi_choice') OR (q.type='single_choice' AND jsonb_array_length(NEW.choice_values)<>1) OR EXISTS (
      SELECT 1 FROM jsonb_array_elements(NEW.choice_values) choice WHERE NOT q.options @> jsonb_build_array(choice)
    ) THEN RAISE EXCEPTION 'Choose an available option'; END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.validate_response_answer() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER response_answers_validate BEFORE INSERT OR UPDATE ON public.response_answers
FOR EACH ROW EXECUTE FUNCTION private.validate_response_answer();
CREATE OR REPLACE FUNCTION public.respond_save(
  p_raw_token text,
  p_answers jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private', 'extensions'
AS $$
DECLARE
  v_hash text;
  v_token public.access_tokens;
  v_assignment public.campaign_assignments;
  v_response public.responses;
  v_ans jsonb;
  v_total integer;
  v_answered integer;
BEGIN
  PERFORM private.lock_open_appraisal_assignment(p_raw_token);
  v_hash := encode(extensions.digest(trim(p_raw_token), 'sha256'), 'hex');

  SELECT * INTO v_token FROM public.access_tokens WHERE token_hash = v_hash;
  IF NOT FOUND OR v_token.revoked_at IS NOT NULL OR v_token.expires_at < now() THEN
    RAISE EXCEPTION 'Invalid or expired link' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_assignment FROM public.campaign_assignments WHERE id = v_token.assignment_id;
  IF v_assignment.status = 'submitted' OR v_assignment.status = 'revoked' THEN
    RAISE EXCEPTION 'Assignment is not open for responses' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_response FROM public.responses WHERE assignment_id = v_assignment.id;
  IF NOT FOUND THEN
    INSERT INTO public.responses (assignment_id, campaign_id, organization_id)
    VALUES (v_assignment.id, v_assignment.campaign_id, v_assignment.organization_id)
    RETURNING * INTO v_response;
  END IF;

  IF v_response.status = 'submitted' THEN
    RAISE EXCEPTION 'Response already submitted' USING ERRCODE = 'P0001';
  END IF;

  IF v_assignment.status IN ('opened', 'pending', 'sent') THEN
    UPDATE public.campaign_assignments
    SET status = 'started', updated_at = now()
    WHERE id = v_assignment.id;
  END IF;

  FOR v_ans IN SELECT * FROM jsonb_array_elements(p_answers)
  LOOP
    INSERT INTO public.response_answers (
      response_id, organization_id, campaign_question_id,
      numeric_value, text_value, choice_values, saved_at
    ) VALUES (
      v_response.id,
      v_response.organization_id,
      (v_ans->>'campaign_question_id')::uuid,
      CASE WHEN v_ans->>'numeric_value' IS NOT NULL THEN (v_ans->>'numeric_value')::numeric END,
      v_ans->>'text_value',
      COALESCE(v_ans->'choice_values', '[]'::jsonb),
      now()
    )
    ON CONFLICT (response_id, campaign_question_id) DO UPDATE
      SET numeric_value = EXCLUDED.numeric_value,
          text_value = EXCLUDED.text_value,
          choice_values = EXCLUDED.choice_values,
          saved_at = now();
  END LOOP;

  SELECT count(*) INTO v_total
  FROM public.campaign_questions
  WHERE campaign_id = v_assignment.campaign_id;

  SELECT count(*) INTO v_answered
  FROM public.response_answers
  WHERE response_id = v_response.id;

  UPDATE public.responses
  SET progress = CASE WHEN v_total > 0 THEN (v_answered::numeric / v_total * 100) ELSE 0 END,
      updated_at = now()
  WHERE id = v_response.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.respond_submit(
  p_raw_token text,
  p_answers jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private', 'extensions'
AS $$
DECLARE
  v_hash text;
  v_token public.access_tokens;
  v_assignment public.campaign_assignments;
  v_response public.responses;
  v_ans jsonb;
BEGIN
  PERFORM private.lock_open_appraisal_assignment(p_raw_token);
  v_hash := encode(extensions.digest(trim(p_raw_token), 'sha256'), 'hex');

  SELECT * INTO v_token FROM public.access_tokens WHERE token_hash = v_hash;
  IF NOT FOUND OR v_token.revoked_at IS NOT NULL OR v_token.expires_at < now() THEN
    RAISE EXCEPTION 'Invalid or expired link' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_assignment FROM public.campaign_assignments WHERE id = v_token.assignment_id;
  IF v_assignment.status = 'submitted' THEN
    RAISE EXCEPTION 'Already submitted' USING ERRCODE = 'P0001';
  END IF;
  IF v_assignment.status = 'revoked' THEN
    RAISE EXCEPTION 'Assignment has been revoked' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_response FROM public.responses WHERE assignment_id = v_assignment.id;
  IF NOT FOUND THEN
    INSERT INTO public.responses (assignment_id, campaign_id, organization_id)
    VALUES (v_assignment.id, v_assignment.campaign_id, v_assignment.organization_id)
    RETURNING * INTO v_response;
  END IF;

  FOR v_ans IN SELECT * FROM jsonb_array_elements(p_answers)
  LOOP
    INSERT INTO public.response_answers (
      response_id, organization_id, campaign_question_id,
      numeric_value, text_value, choice_values, saved_at
    ) VALUES (
      v_response.id,
      v_response.organization_id,
      (v_ans->>'campaign_question_id')::uuid,
      CASE WHEN v_ans->>'numeric_value' IS NOT NULL THEN (v_ans->>'numeric_value')::numeric END,
      v_ans->>'text_value',
      COALESCE(v_ans->'choice_values', '[]'::jsonb),
      now()
    )
    ON CONFLICT (response_id, campaign_question_id) DO UPDATE
      SET numeric_value = EXCLUDED.numeric_value,
          text_value = EXCLUDED.text_value,
          choice_values = EXCLUDED.choice_values,
          saved_at = now();
  END LOOP;

  IF EXISTS (
    SELECT 1 FROM public.campaign_questions q
    WHERE q.campaign_id=v_assignment.campaign_id AND q.required AND NOT EXISTS (
      SELECT 1 FROM public.response_answers a WHERE a.response_id=v_response.id AND a.campaign_question_id=q.id
      AND CASE q.type
        WHEN 'text' THEN nullif(trim(a.text_value),'') IS NOT NULL
        WHEN 'rating' THEN a.numeric_value IS NOT NULL
        WHEN 'nps' THEN a.numeric_value IS NOT NULL
        WHEN 'single_choice' THEN jsonb_array_length(a.choice_values)=1
        WHEN 'multi_choice' THEN jsonb_array_length(a.choice_values)>0
        ELSE false END
    )
  ) THEN RAISE EXCEPTION 'Please answer every required question'; END IF;

  UPDATE public.responses
  SET status = 'submitted', progress = 100, submitted_at = now(),
      locked_at = now(), updated_at = now()
  WHERE id = v_response.id;

  UPDATE public.campaign_assignments
  SET status = 'submitted', submitted_at = now(), updated_at = now()
  WHERE id = v_assignment.id;
END;
$$;
NOTIFY pgrst, 'reload schema';

-- Resume only the response associated with this personal bearer link.
CREATE OR REPLACE FUNCTION public.respond_get_saved_answers(p_raw_token text)
RETURNS TABLE (campaign_question_id uuid, numeric_value numeric, text_value text, choice_values jsonb)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, private, extensions, pg_temp
AS $$
DECLARE assignment uuid;
BEGIN
  SELECT a.id INTO assignment FROM public.access_tokens t
  JOIN public.campaign_assignments a ON a.id=t.assignment_id
  JOIN public.campaigns c ON c.id=a.campaign_id
  WHERE t.token_hash=encode(extensions.digest(trim(p_raw_token),'sha256'),'hex')
    AND t.revoked_at IS NULL AND t.expires_at>now() AND a.status NOT IN ('submitted','revoked')
    AND c.status='active' AND (c.closes_at IS NULL OR c.closes_at>now());
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid or closed appraisal link' USING ERRCODE='P0002'; END IF;
  RETURN QUERY SELECT ans.campaign_question_id,ans.numeric_value,ans.text_value,ans.choice_values
  FROM public.responses r JOIN public.response_answers ans ON ans.response_id=r.id
  JOIN public.campaign_questions q ON q.id=ans.campaign_question_id AND q.campaign_id=r.campaign_id
  WHERE r.assignment_id=assignment AND r.status='in_progress' AND ans.organization_id=r.organization_id;
END;
$$;
REVOKE ALL ON FUNCTION public.respond_get_saved_answers(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.respond_get_saved_answers(text) TO anon, authenticated;
NOTIFY pgrst, 'reload schema';
