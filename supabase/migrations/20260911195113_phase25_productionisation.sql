-- Phase 2.5: productionisation — enriched invites, service-role outbox claim,
-- scheduled activate/close, reminder enqueue. Real Resend lives in the Next.js drain.

-- ---------------------------------------------------------------------------
-- Service-role helper (JWT role from PostgREST / supabase-js service key)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.is_service_role()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(auth.jwt() ->> 'role', '') = 'service_role';
$$;

REVOKE ALL ON FUNCTION private.is_service_role() FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- freeze_campaign_questions — allow service_role for scheduled activation
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

  IF private.is_service_role() THEN
    NULL;
  ELSIF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  ELSIF NOT private.is_org_admin(v_campaign.organization_id) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  IF v_campaign.questions_frozen_at IS NOT NULL THEN
    RETURN;
  END IF;

  IF v_campaign.status NOT IN ('draft', 'scheduled') THEN
    RAISE EXCEPTION 'Can only freeze questions on draft or scheduled campaigns'
      USING ERRCODE = 'P0001';
  END IF;

  IF v_campaign.template_id IS NULL THEN
    RAISE EXCEPTION 'Campaign has no template — cannot freeze questions'
      USING ERRCODE = 'P0001';
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
GRANT EXECUTE ON FUNCTION public.freeze_campaign_questions(uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- activate_campaign — enrich payload; allow org admin OR service_role
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
  v_subject public.people;
  v_org public.organizations;
  v_subject_line text;
  v_existing_token uuid;
BEGIN
  SELECT * INTO v_campaign
  FROM public.campaigns c
  WHERE c.id = p_campaign_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campaign not found' USING ERRCODE = 'P0002';
  END IF;

  IF private.is_service_role() THEN
    NULL; -- scheduler / automation
  ELSIF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  ELSIF NOT private.is_org_admin(v_campaign.organization_id) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  IF v_campaign.status NOT IN ('draft', 'scheduled') THEN
    RAISE EXCEPTION 'Campaign is already % — cannot activate', v_campaign.status
      USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_org FROM public.organizations WHERE id = v_campaign.organization_id;

  IF v_campaign.questions_frozen_at IS NULL THEN
    PERFORM public.freeze_campaign_questions(p_campaign_id);
    SELECT * INTO v_campaign FROM public.campaigns WHERE id = p_campaign_id;
  END IF;

  FOR v_assignment IN
    SELECT * FROM public.campaign_assignments
    WHERE campaign_id = p_campaign_id
      AND status = 'pending'
    FOR UPDATE
  LOOP
    SELECT id INTO v_existing_token
    FROM public.access_tokens
    WHERE assignment_id = v_assignment.id
      AND revoked_at IS NULL
      AND expires_at > now()
    LIMIT 1;

    IF v_existing_token IS NULL THEN
      v_raw_token := encode(extensions.gen_random_bytes(32), 'hex');
      v_token_hash := encode(extensions.digest(v_raw_token, 'sha256'), 'hex');

      INSERT INTO public.access_tokens (
        assignment_id, organization_id, token_hash, expires_at
      ) VALUES (
        v_assignment.id,
        v_campaign.organization_id,
        v_token_hash,
        COALESCE(v_campaign.closes_at, now() + interval '90 days')
      );
    ELSE
      -- Token already minted; recover raw_token from existing invite outbox if present.
      SELECT payload ->> 'raw_token' INTO v_raw_token
      FROM public.email_outbox
      WHERE idempotency_key = 'invite:' || v_assignment.id::text
      LIMIT 1;

      IF v_raw_token IS NULL OR length(v_raw_token) = 0 THEN
        -- Cannot recover; mint a fresh token (revoke old ones for this assignment).
        UPDATE public.access_tokens
        SET revoked_at = now()
        WHERE assignment_id = v_assignment.id AND revoked_at IS NULL;

        v_raw_token := encode(extensions.gen_random_bytes(32), 'hex');
        v_token_hash := encode(extensions.digest(v_raw_token, 'sha256'), 'hex');

        INSERT INTO public.access_tokens (
          assignment_id, organization_id, token_hash, expires_at
        ) VALUES (
          v_assignment.id,
          v_campaign.organization_id,
          v_token_hash,
          COALESCE(v_campaign.closes_at, now() + interval '90 days')
        );
      END IF;
    END IF;

    SELECT * INTO v_respondent
    FROM public.people
    WHERE id = v_assignment.respondent_person_id
      AND organization_id = v_campaign.organization_id;

    SELECT * INTO v_subject
    FROM public.people
    WHERE id = v_assignment.subject_person_id
      AND organization_id = v_campaign.organization_id;

    IF v_assignment.relationship = 'self' THEN
      v_subject_line := 'Your self-appraisal for ' || coalesce(v_org.name, 'your organisation');
    ELSIF v_assignment.relationship = 'manager' THEN
      v_subject_line := 'Manager appraisal: ' || coalesce(v_subject.full_name, 'team member');
    ELSE
      v_subject_line := 'Appraisal to complete — ' || coalesce(v_campaign.name, 'Appraisal Software');
    END IF;

    INSERT INTO public.email_outbox (
      organization_id, kind, to_email, subject, payload, idempotency_key
    ) VALUES (
      v_campaign.organization_id,
      'appraisal_invite',
      v_respondent.email,
      v_subject_line,
      jsonb_build_object(
        'campaign_id', v_campaign.id,
        'campaign_name', v_campaign.name,
        'assignment_id', v_assignment.id,
        'relationship', v_assignment.relationship,
        'raw_token', v_raw_token,
        'org_name', v_org.name,
        'respondent_name', v_respondent.full_name,
        'subject_name', v_subject.full_name,
        'closes_at', v_campaign.closes_at
      ),
      'invite:' || v_assignment.id::text
    )
    ON CONFLICT (idempotency_key) DO NOTHING;
  END LOOP;

  UPDATE public.campaigns
  SET
    status = 'active',
    opens_at = coalesce(opens_at, now()),
    send_claimed_at = coalesce(send_claimed_at, now()),
    schedule_error = NULL,
    updated_at = now()
  WHERE id = p_campaign_id;
END;
$$;

REVOKE ALL ON FUNCTION public.activate_campaign(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activate_campaign(uuid) TO authenticated;
-- service_role bypasses GRANT restrictions in Supabase; keep explicit for clarity
GRANT EXECUTE ON FUNCTION public.activate_campaign(uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- claim_email_outbox_batch — atomic claim for concurrent drains (service only)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_email_outbox_batch(p_limit integer DEFAULT 50)
RETURNS SETOF public.email_outbox
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_limit integer := least(greatest(coalesce(p_limit, 50), 1), 100);
BEGIN
  IF NOT private.is_service_role() THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH picked AS (
    SELECT e.id
    FROM public.email_outbox e
    WHERE (
        e.status IN ('pending', 'failed')
        AND e.scheduled_for <= now()
        AND e.attempts < 5
      )
      OR (
        e.status = 'sending'
        AND e.updated_at < now() - interval '10 minutes'
        AND e.attempts < 5
      )
    ORDER BY e.scheduled_for
    LIMIT v_limit
    FOR UPDATE OF e SKIP LOCKED
  )
  UPDATE public.email_outbox o
  SET
    status = 'sending',
    attempts = o.attempts + 1,
    last_error = NULL,
    updated_at = now()
  FROM picked
  WHERE o.id = picked.id
  RETURNING o.*;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_email_outbox_batch(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_email_outbox_batch(integer) TO service_role;

-- ---------------------------------------------------------------------------
-- mark_email_outbox_result — sent / failed (+ optional retry schedule)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mark_email_outbox_result(
  p_id uuid,
  p_ok boolean,
  p_provider_id text DEFAULT NULL,
  p_error text DEFAULT NULL,
  p_retry_at timestamptz DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_row public.email_outbox;
  v_assignment_id uuid;
BEGIN
  IF NOT private.is_service_role() THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_row FROM public.email_outbox WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Outbox row not found' USING ERRCODE = 'P0002';
  END IF;

  -- Idempotent: already sent wins
  IF v_row.status = 'sent' THEN
    RETURN;
  END IF;

  IF p_ok THEN
    UPDATE public.email_outbox
    SET
      status = 'sent',
      provider_id = coalesce(p_provider_id, provider_id),
      last_error = NULL,
      updated_at = now()
    WHERE id = p_id;

    IF v_row.kind IN ('appraisal_invite', 'campaign_invite') THEN
      v_assignment_id := (v_row.payload ->> 'assignment_id')::uuid;
      IF v_assignment_id IS NOT NULL THEN
        UPDATE public.campaign_assignments
        SET status = 'sent', sent_at = coalesce(sent_at, now()), updated_at = now()
        WHERE id = v_assignment_id AND status = 'pending';
      END IF;
    ELSIF v_row.kind = 'appraisal_reminder' THEN
      v_assignment_id := (v_row.payload ->> 'assignment_id')::uuid;
      IF v_assignment_id IS NOT NULL THEN
        UPDATE public.campaign_assignments
        SET last_reminded_at = now(), updated_at = now()
        WHERE id = v_assignment_id
          AND status NOT IN ('submitted', 'revoked');
      END IF;
    END IF;
  ELSE
    -- p_retry_at NULL => terminal / no automatic retry (e.g. bad config).
    -- Otherwise schedule backoff retry while attempts remain below 5.
    UPDATE public.email_outbox
    SET
      status = 'failed',
      last_error = left(coalesce(p_error, 'send failed'), 2000),
      scheduled_for = CASE
        WHEN p_retry_at IS NOT NULL AND attempts < 5 THEN p_retry_at
        ELSE scheduled_for
      END,
      attempts = CASE
        WHEN p_retry_at IS NULL THEN greatest(attempts, 5)
        ELSE attempts
      END,
      updated_at = now()
    WHERE id = p_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_email_outbox_result(uuid, boolean, text, text, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_email_outbox_result(uuid, boolean, text, text, timestamptz) TO service_role;

-- ---------------------------------------------------------------------------
-- Retire authenticated fake drain — real delivery is HTTP + Resend
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.drain_email_outbox(p_limit integer DEFAULT 50)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
BEGIN
  RAISE EXCEPTION
    'drain_email_outbox is retired — use /api/cron/drain-outbox with service role'
    USING ERRCODE = 'P0001';
END;
$$;

REVOKE ALL ON FUNCTION public.drain_email_outbox(integer) FROM PUBLIC;
-- Keep callable only by service_role for accidental callers (still errors)
GRANT EXECUTE ON FUNCTION public.drain_email_outbox(integer) TO service_role;

-- ---------------------------------------------------------------------------
-- claim_and_activate_due_campaigns — scheduled opens_at
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_and_activate_due_campaigns(p_limit integer DEFAULT 20)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_limit integer := least(greatest(coalesce(p_limit, 20), 1), 50);
  r record;
  n integer := 0;
BEGIN
  IF NOT private.is_service_role() THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  FOR r IN
    SELECT c.id
    FROM public.campaigns c
    WHERE c.status = 'scheduled'
      AND c.opens_at IS NOT NULL
      AND c.opens_at <= now()
      AND c.send_claimed_at IS NULL
    ORDER BY c.opens_at
    LIMIT v_limit
    FOR UPDATE OF c SKIP LOCKED
  LOOP
    UPDATE public.campaigns
    SET send_claimed_at = now(), updated_at = now()
    WHERE id = r.id;

    BEGIN
      PERFORM public.activate_campaign(r.id);
      n := n + 1;
    EXCEPTION WHEN OTHERS THEN
      UPDATE public.campaigns
      SET
        send_claimed_at = NULL,
        schedule_error = left(SQLERRM, 1000),
        schedule_attempts = schedule_attempts + 1,
        updated_at = now()
      WHERE id = r.id;
    END;
  END LOOP;

  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_and_activate_due_campaigns(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_and_activate_due_campaigns(integer) TO service_role;

-- ---------------------------------------------------------------------------
-- close_due_campaigns
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.close_due_campaigns(p_limit integer DEFAULT 50)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_limit integer := least(greatest(coalesce(p_limit, 50), 1), 100);
  n integer;
BEGIN
  IF NOT private.is_service_role() THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  WITH due AS (
    SELECT c.id
    FROM public.campaigns c
    WHERE c.status = 'active'
      AND c.closes_at IS NOT NULL
      AND c.closes_at <= now()
    ORDER BY c.closes_at
    LIMIT v_limit
    FOR UPDATE OF c SKIP LOCKED
  )
  UPDATE public.campaigns c
  SET status = 'closed', updated_at = now()
  FROM due
  WHERE c.id = due.id;

  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN coalesce(n, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.close_due_campaigns(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.close_due_campaigns(integer) TO service_role;

-- ---------------------------------------------------------------------------
-- enqueue_appraisal_reminders — cadence only (MVP)
-- Idempotency: reminder:{assignment_id}:{yyyy-mm-dd of due bucket}
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enqueue_appraisal_reminders(p_limit integer DEFAULT 100)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_limit integer := least(greatest(coalesce(p_limit, 100), 1), 200);
  r record;
  n integer := 0;
  v_settings jsonb;
  v_enabled boolean;
  v_strategy text;
  v_cadence_days numeric;
  v_baseline timestamptz;
  v_since timestamptz;
  v_raw_token text;
  v_org_name text;
  v_subject_name text;
  v_respondent_name text;
  v_bucket text;
  v_subject_line text;
BEGIN
  IF NOT private.is_service_role() THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  FOR r IN
    SELECT
      a.id AS assignment_id,
      a.organization_id,
      a.campaign_id,
      a.relationship,
      a.status AS assignment_status,
      a.sent_at,
      a.last_reminded_at,
      a.respondent_person_id,
      a.subject_person_id,
      c.name AS campaign_name,
      c.closes_at,
      c.opens_at,
      c.reminder_settings,
      c.status AS campaign_status
    FROM public.campaign_assignments a
    JOIN public.campaigns c ON c.id = a.campaign_id
    WHERE c.status = 'active'
      AND a.status IN ('sent', 'opened', 'started')
      AND (c.closes_at IS NULL OR c.closes_at > now())
    ORDER BY a.updated_at
    LIMIT v_limit
    FOR UPDATE OF a SKIP LOCKED
  LOOP
    v_settings := coalesce(r.reminder_settings, '{}'::jsonb);
    v_enabled := coalesce((v_settings ->> 'enabled')::boolean, false);
    IF NOT v_enabled THEN
      CONTINUE;
    END IF;

    v_strategy := coalesce(v_settings ->> 'strategy', 'cadence');
    IF v_strategy <> 'cadence' THEN
      CONTINUE; -- MVP: cadence only in SQL; before_close can be added later
    END IF;

    v_cadence_days := nullif(v_settings ->> 'cadenceDays', '')::numeric;
    IF v_cadence_days IS NULL OR v_cadence_days <= 0 THEN
      CONTINUE;
    END IF;

    v_baseline := coalesce(r.sent_at, r.opens_at);
    IF v_baseline IS NULL THEN
      CONTINUE;
    END IF;

    v_since := coalesce(r.last_reminded_at, v_baseline);
    IF now() < v_since + (v_cadence_days || ' days')::interval THEN
      CONTINUE;
    END IF;

    -- Recover respond token from original invite outbox (never log this).
    SELECT payload ->> 'raw_token' INTO v_raw_token
    FROM public.email_outbox
    WHERE idempotency_key = 'invite:' || r.assignment_id::text
    LIMIT 1;

    IF v_raw_token IS NULL OR length(v_raw_token) = 0 THEN
      CONTINUE;
    END IF;

    SELECT name INTO v_org_name FROM public.organizations WHERE id = r.organization_id;
    SELECT full_name INTO v_respondent_name FROM public.people WHERE id = r.respondent_person_id;
    SELECT full_name INTO v_subject_name FROM public.people WHERE id = r.subject_person_id;

    v_bucket := to_char(timezone('utc', now()), 'YYYY-MM-DD');

    IF r.relationship = 'self' THEN
      v_subject_line := 'Reminder: complete your self-appraisal';
    ELSIF r.relationship = 'manager' THEN
      v_subject_line := 'Reminder: manager appraisal for ' || coalesce(v_subject_name, 'a team member');
    ELSE
      v_subject_line := 'Reminder: appraisal still open';
    END IF;

    INSERT INTO public.email_outbox (
      organization_id, kind, to_email, subject, payload, idempotency_key
    )
    SELECT
      r.organization_id,
      'appraisal_reminder',
      p.email,
      v_subject_line,
      jsonb_build_object(
        'campaign_id', r.campaign_id,
        'campaign_name', r.campaign_name,
        'assignment_id', r.assignment_id,
        'relationship', r.relationship,
        'raw_token', v_raw_token,
        'org_name', v_org_name,
        'respondent_name', v_respondent_name,
        'subject_name', v_subject_name,
        'closes_at', r.closes_at,
        'is_reminder', true
      ),
      'reminder:' || r.assignment_id::text || ':' || v_bucket
    FROM public.people p
    WHERE p.id = r.respondent_person_id
    ON CONFLICT (idempotency_key) DO NOTHING;

    IF FOUND THEN
      n := n + 1;
    END IF;
  END LOOP;

  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_appraisal_reminders(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enqueue_appraisal_reminders(integer) TO service_role;

-- ---------------------------------------------------------------------------
-- respond_resolve — include org_name for respondent branding
-- (return type change requires drop)
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.respond_resolve(text);

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
  response_status text,
  org_name text
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
  v_org_name text;
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

  IF v_campaign.status <> 'active' THEN
    RAISE EXCEPTION 'Campaign is not currently active' USING ERRCODE = 'P0001';
  END IF;

  SELECT name INTO v_org_name
  FROM public.organizations
  WHERE id = v_campaign.organization_id;

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
  org_name := v_org_name;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.respond_resolve(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.respond_resolve(text) TO anon, authenticated;
