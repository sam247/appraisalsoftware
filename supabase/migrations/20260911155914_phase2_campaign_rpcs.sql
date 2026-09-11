-- Phase 2 RPCs: freeze questions, activate campaign, respond path
-- All admin RPCs are SECURITY DEFINER with is_org_admin guard.
-- Respond RPCs are SECURITY DEFINER granted to anon (token-based auth only).

-- ---------------------------------------------------------------------------
-- freeze_campaign_questions
-- Snapshot template questions into campaign_questions; idempotent.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.freeze_campaign_questions(p_campaign_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private', 'extensions'
AS $$
DECLARE
  v_campaign public.campaigns;
BEGIN
  SELECT * INTO v_campaign
  FROM public.campaigns c
  WHERE c.id = p_campaign_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campaign not found' USING ERRCODE = 'P0002';
  END IF;

  IF NOT private.is_org_admin(v_campaign.organization_id) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  IF v_campaign.questions_frozen_at IS NOT NULL THEN
    RETURN; -- Already frozen, idempotent
  END IF;

  IF v_campaign.status NOT IN ('draft', 'scheduled') THEN
    RAISE EXCEPTION 'Can only freeze questions on draft or scheduled campaigns' USING ERRCODE = 'P0001';
  END IF;

  IF v_campaign.template_id IS NULL THEN
    RAISE EXCEPTION 'Campaign has no template — cannot freeze questions' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.campaign_questions (
    campaign_id, organization_id, sort_order, type, prompt, help_text,
    required, options, scale, stable_key, competency_key, competency_label,
    section_key, section_label, source_template_question_id
  )
  SELECT
    p_campaign_id,
    v_campaign.organization_id,
    tq.sort_order,
    tq.type,
    tq.prompt,
    tq.help_text,
    tq.required,
    tq.options,
    tq.scale,
    tq.stable_key,
    tq.competency_key,
    tq.competency_label,
    tq.section_key,
    tq.section_label,
    tq.id
  FROM public.template_questions tq
  WHERE tq.template_id = v_campaign.template_id
    AND tq.organization_id = v_campaign.organization_id
  ORDER BY tq.sort_order;

  UPDATE public.campaigns
  SET questions_frozen_at = now(), updated_at = now()
  WHERE id = p_campaign_id;
END;
$$;

REVOKE ALL ON FUNCTION public.freeze_campaign_questions(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.freeze_campaign_questions(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- activate_campaign
-- Freeze questions if needed, mint tokens for pending assignments,
-- enqueue email_outbox entries, set campaign to active.
-- Idempotent: safe to call again if partially done.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.activate_campaign(p_campaign_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private', 'extensions'
AS $$
DECLARE
  v_campaign public.campaigns;
  v_assignment public.campaign_assignments;
  v_raw_token text;
  v_token_hash text;
  v_respondent public.people;
BEGIN
  SELECT * INTO v_campaign
  FROM public.campaigns c
  WHERE c.id = p_campaign_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campaign not found' USING ERRCODE = 'P0002';
  END IF;

  IF NOT private.is_org_admin(v_campaign.organization_id) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  IF v_campaign.status NOT IN ('draft', 'scheduled') THEN
    RAISE EXCEPTION 'Campaign is already % — cannot activate', v_campaign.status USING ERRCODE = 'P0001';
  END IF;

  -- Freeze questions if not done yet
  IF v_campaign.questions_frozen_at IS NULL THEN
    PERFORM public.freeze_campaign_questions(p_campaign_id);
    SELECT * INTO v_campaign FROM public.campaigns WHERE id = p_campaign_id;
  END IF;

  -- Mint tokens and enqueue outbox for each pending assignment
  FOR v_assignment IN
    SELECT * FROM public.campaign_assignments
    WHERE campaign_id = p_campaign_id
      AND status = 'pending'
    FOR UPDATE
  LOOP
    v_raw_token := encode(extensions.gen_random_bytes(32), 'hex');
    v_token_hash := encode(extensions.digest(v_raw_token, 'sha256'), 'hex');

    INSERT INTO public.access_tokens (
      assignment_id, organization_id, token_hash, expires_at
    ) VALUES (
      v_assignment.id,
      v_campaign.organization_id,
      v_token_hash,
      COALESCE(v_campaign.closes_at, now() + interval '90 days')
    )
    ON CONFLICT DO NOTHING;

    SELECT * INTO v_respondent
    FROM public.people
    WHERE id = v_assignment.respondent_person_id
      AND organization_id = v_campaign.organization_id;

    INSERT INTO public.email_outbox (
      organization_id, kind, to_email, subject, payload, idempotency_key
    ) VALUES (
      v_campaign.organization_id,
      'appraisal_invite',
      v_respondent.email,
      'You have an appraisal to complete',
      jsonb_build_object(
        'campaign_id', v_campaign.id,
        'campaign_name', v_campaign.name,
        'assignment_id', v_assignment.id,
        'relationship', v_assignment.relationship,
        'raw_token', v_raw_token
      ),
      'invite:' || v_assignment.id::text
    )
    ON CONFLICT (idempotency_key) DO NOTHING;
  END LOOP;

  UPDATE public.campaigns
  SET status = 'active', updated_at = now()
  WHERE id = p_campaign_id;
END;
$$;

REVOKE ALL ON FUNCTION public.activate_campaign(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activate_campaign(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- respond_resolve
-- Given raw token: hash, validate, update access_token, return assignment context.
-- Granted to anon so Next.js route can call with anon key.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.respond_resolve(p_raw_token text)
RETURNS TABLE (
  assignment_id uuid,
  campaign_id uuid,
  organization_id uuid,
  respondent_person_id uuid,
  subject_person_id uuid,
  relationship text,
  assignment_status text,
  campaign_name text,
  campaign_status text,
  closes_at timestamptz,
  response_id uuid,
  response_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private', 'extensions'
AS $$
DECLARE
  v_hash text;
  v_token public.access_tokens;
  v_assignment public.campaign_assignments;
  v_campaign public.campaigns;
  v_response public.responses;
BEGIN
  v_hash := encode(extensions.digest(trim(p_raw_token), 'sha256'), 'hex');

  SELECT * INTO v_token
  FROM public.access_tokens t
  WHERE t.token_hash = v_hash
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired link' USING ERRCODE = 'P0002';
  END IF;

  IF v_token.revoked_at IS NOT NULL THEN
    RAISE EXCEPTION 'This link has been revoked' USING ERRCODE = 'P0002';
  END IF;

  IF v_token.expires_at < now() THEN
    RAISE EXCEPTION 'This link has expired' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.access_tokens
  SET last_used_at = now(), use_count = use_count + 1
  WHERE id = v_token.id;

  SELECT * INTO v_assignment
  FROM public.campaign_assignments a
  WHERE a.id = v_token.assignment_id;

  IF v_assignment.status = 'submitted' THEN
    RAISE EXCEPTION 'This appraisal has already been submitted' USING ERRCODE = 'P0001';
  END IF;

  IF v_assignment.status = 'revoked' THEN
    RAISE EXCEPTION 'This assignment has been revoked' USING ERRCODE = 'P0002';
  END IF;

  IF v_assignment.status IN ('pending', 'sent') THEN
    UPDATE public.campaign_assignments
    SET status = 'opened', updated_at = now()
    WHERE id = v_assignment.id;
    v_assignment.status := 'opened';
  END IF;

  SELECT * INTO v_campaign
  FROM public.campaigns c
  WHERE c.id = v_assignment.campaign_id;

  IF v_campaign.status NOT IN ('active') THEN
    RAISE EXCEPTION 'Campaign is not currently active' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_response
  FROM public.responses r
  WHERE r.assignment_id = v_assignment.id;

  IF NOT FOUND THEN
    INSERT INTO public.responses (assignment_id, campaign_id, organization_id)
    VALUES (v_assignment.id, v_assignment.campaign_id, v_assignment.organization_id)
    RETURNING * INTO v_response;
  END IF;

  assignment_id := v_assignment.id;
  campaign_id := v_campaign.id;
  organization_id := v_campaign.organization_id;
  respondent_person_id := v_assignment.respondent_person_id;
  subject_person_id := v_assignment.subject_person_id;
  relationship := v_assignment.relationship;
  assignment_status := v_assignment.status;
  campaign_name := v_campaign.name;
  campaign_status := v_campaign.status;
  closes_at := v_campaign.closes_at;
  response_id := v_response.id;
  response_status := v_response.status;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.respond_resolve(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.respond_resolve(text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- respond_save
-- Upsert answers for a response (in_progress only).
-- ---------------------------------------------------------------------------
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

REVOKE ALL ON FUNCTION public.respond_save(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.respond_save(text, jsonb) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- respond_submit
-- Final submit: lock response, mark assignment submitted.
-- ---------------------------------------------------------------------------
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

  UPDATE public.responses
  SET status = 'submitted', progress = 100, submitted_at = now(),
      locked_at = now(), updated_at = now()
  WHERE id = v_response.id;

  UPDATE public.campaign_assignments
  SET status = 'submitted', submitted_at = now(), updated_at = now()
  WHERE id = v_assignment.id;
END;
$$;

REVOKE ALL ON FUNCTION public.respond_submit(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.respond_submit(text, jsonb) TO anon, authenticated;
