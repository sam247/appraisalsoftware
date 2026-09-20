-- Campaign index actions: archive + manual reminders for outstanding respondents.
-- Automatic cadence reminders remain enqueue_appraisal_reminders (service/cron).

CREATE OR REPLACE FUNCTION public.archive_campaign(p_campaign_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private', pg_temp
AS $$
DECLARE
  c public.campaigns;
BEGIN
  SELECT * INTO c FROM public.campaigns WHERE id = p_campaign_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campaign not found' USING ERRCODE = 'P0002';
  END IF;
  IF auth.uid() IS NULL OR NOT private.is_org_admin(c.organization_id) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;
  IF c.status = 'archived' THEN
    RETURN;
  END IF;
  UPDATE public.campaigns
  SET status = 'archived', updated_at = now()
  WHERE id = p_campaign_id;
END;
$$;

REVOKE ALL ON FUNCTION public.archive_campaign(uuid) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.archive_campaign(uuid) TO authenticated;

-- Manual reminders for respondents who have not submitted.
-- Bypasses cadence timing; still limited to once per assignment per UTC day.
CREATE OR REPLACE FUNCTION public.send_campaign_reminders(p_campaign_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private', pg_temp
AS $$
DECLARE
  c public.campaigns;
  r record;
  n integer := 0;
  v_raw_token text;
  v_org_name text;
  v_subject_name text;
  v_respondent_name text;
  v_bucket text;
  v_subject_line text;
BEGIN
  SELECT * INTO c FROM public.campaigns WHERE id = p_campaign_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campaign not found' USING ERRCODE = 'P0002';
  END IF;
  IF auth.uid() IS NULL OR NOT private.is_org_admin(c.organization_id) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;
  IF c.status <> 'active' THEN
    RAISE EXCEPTION 'Reminders can only be sent while the campaign is collecting responses';
  END IF;
  IF c.closes_at IS NOT NULL AND c.closes_at <= now() THEN
    RAISE EXCEPTION 'This campaign has already reached its close date';
  END IF;

  SELECT name INTO v_org_name FROM public.organizations WHERE id = c.organization_id;
  v_bucket := to_char(timezone('utc', now()), 'YYYY-MM-DD');

  FOR r IN
    SELECT
      a.id AS assignment_id,
      a.organization_id,
      a.relationship,
      a.respondent_person_id,
      a.subject_person_id
    FROM public.campaign_assignments a
    WHERE a.campaign_id = c.id
      AND a.organization_id = c.organization_id
      AND a.status IN ('sent', 'opened', 'started')
    ORDER BY a.updated_at
    FOR UPDATE OF a
  LOOP
    SELECT payload ->> 'raw_token' INTO v_raw_token
    FROM public.email_outbox
    WHERE idempotency_key = 'invite:' || r.assignment_id::text
    LIMIT 1;

    IF v_raw_token IS NULL OR length(v_raw_token) = 0 THEN
      CONTINUE;
    END IF;

    SELECT full_name INTO v_respondent_name FROM public.people WHERE id = r.respondent_person_id;
    SELECT full_name INTO v_subject_name FROM public.people WHERE id = r.subject_person_id;

    IF c.campaign_type = 'feedback_360' THEN
      v_subject_line := 'Reminder: 360 feedback for ' || coalesce(v_subject_name, 'your colleague');
    ELSIF r.relationship = 'self' THEN
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
        'campaign_id', c.id,
        'campaign_name', c.name,
        'campaign_type', c.campaign_type,
        'assignment_id', r.assignment_id,
        'relationship', r.relationship,
        'raw_token', v_raw_token,
        'org_name', v_org_name,
        'respondent_name', v_respondent_name,
        'subject_name', v_subject_name,
        'closes_at', c.closes_at,
        'timezone', c.timezone,
        'is_reminder', true
      ),
      'reminder:manual:' || r.assignment_id::text || ':' || v_bucket
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

REVOKE ALL ON FUNCTION public.send_campaign_reminders(uuid) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.send_campaign_reminders(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
