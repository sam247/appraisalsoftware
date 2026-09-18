-- One transaction and the same parent-row lock used by activation/closing.
CREATE OR REPLACE FUNCTION public.save_appraisal_participants(p_campaign_id uuid, p_participants jsonb)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  c public.campaigns;
  r record;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501'; END IF;
  SELECT * INTO c FROM public.campaigns WHERE id = p_campaign_id FOR UPDATE;
  IF NOT FOUND OR NOT private.is_org_admin(c.organization_id) THEN
    RAISE EXCEPTION 'Campaign unavailable' USING ERRCODE = '42501';
  END IF;
  IF c.status <> 'draft' OR c.questions_frozen_at IS NOT NULL OR c.campaign_type <> 'annual_appraisal' THEN
    RAISE EXCEPTION 'Only an editable annual appraisal draft can change participants';
  END IF;
  IF p_participants IS NULL OR jsonb_typeof(p_participants) <> 'array' THEN
    RAISE EXCEPTION 'Participants must be a list';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(p_participants) x WHERE jsonb_typeof(x) <> 'object') THEN
    RAISE EXCEPTION 'Invalid participant';
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_to_recordset(p_participants) AS x(person_id uuid, manager_person_id uuid)
    GROUP BY person_id HAVING person_id IS NULL OR count(*) > 1
  ) THEN RAISE EXCEPTION 'Choose each employee once'; END IF;

  FOR r IN SELECT * FROM jsonb_to_recordset(p_participants) AS x(person_id uuid, manager_person_id uuid)
  LOOP
    -- Preserve archived people already saved on this draft; do not add new ones.
    IF NOT EXISTS (SELECT 1 FROM public.people p WHERE p.id = r.person_id AND p.organization_id = c.organization_id
      AND (p.archived_at IS NULL OR EXISTS (SELECT 1 FROM public.campaign_subjects s WHERE s.campaign_id = c.id AND s.person_id = p.id))) THEN
      RAISE EXCEPTION 'Employee unavailable';
    END IF;
    IF r.manager_person_id IS NOT NULL AND (r.manager_person_id = r.person_id OR NOT EXISTS (
      SELECT 1 FROM public.people p WHERE p.id = r.manager_person_id AND p.organization_id = c.organization_id
      AND (p.archived_at IS NULL OR EXISTS (SELECT 1 FROM public.campaign_assignments a WHERE a.campaign_id = c.id
        AND a.subject_person_id = r.person_id AND a.respondent_person_id = p.id AND a.relationship = 'manager'))
    )) THEN RAISE EXCEPTION 'Choose an available manager other than the employee'; END IF;
  END LOOP;

  DELETE FROM public.campaign_assignments WHERE campaign_id = c.id AND organization_id = c.organization_id;
  DELETE FROM public.campaign_subjects WHERE campaign_id = c.id AND organization_id = c.organization_id;
  INSERT INTO public.campaign_subjects (campaign_id, organization_id, person_id)
    SELECT c.id, c.organization_id, x.person_id FROM jsonb_to_recordset(p_participants) AS x(person_id uuid, manager_person_id uuid);
  INSERT INTO public.campaign_assignments (campaign_id, organization_id, respondent_person_id, subject_person_id, relationship)
    SELECT c.id, c.organization_id, x.person_id, x.person_id, 'self' FROM jsonb_to_recordset(p_participants) AS x(person_id uuid, manager_person_id uuid)
    UNION ALL
    SELECT c.id, c.organization_id, x.manager_person_id, x.person_id, 'manager' FROM jsonb_to_recordset(p_participants) AS x(person_id uuid, manager_person_id uuid) WHERE x.manager_person_id IS NOT NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.save_appraisal_participants(uuid, jsonb) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.save_appraisal_participants(uuid, jsonb) TO authenticated;
-- Normal clients cannot bypass the transactional participant boundary or forge completion.
REVOKE INSERT, UPDATE, DELETE ON public.campaign_subjects, public.campaign_assignments, public.campaign_questions FROM authenticated, anon;

-- Outbox payloads contain bearer respondent links; tenant admins do not need
-- raw provider records to monitor completion. Keep this a service-only boundary.
REVOKE ALL ON public.email_outbox FROM authenticated, anon;

CREATE OR REPLACE FUNCTION private.validate_campaign_timezone()
RETURNS trigger LANGUAGE plpgsql
SET search_path = pg_catalog, pg_temp
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = NEW.timezone) THEN
    RAISE EXCEPTION 'Choose a valid named campaign timezone';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.validate_campaign_timezone() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER campaigns_validate_timezone BEFORE INSERT OR UPDATE OF timezone ON public.campaigns
FOR EACH ROW EXECUTE FUNCTION private.validate_campaign_timezone();

-- Resolve a calendar date using the existing named timezone, never a fixed offset.
CREATE OR REPLACE FUNCTION public.campaign_date_instants(p_date date, p_timezone text)
RETURNS TABLE (opens_at timestamptz, closes_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY INVOKER
SET search_path = pg_catalog, pg_temp
AS $$
BEGIN
  IF p_date IS NULL OR NOT isfinite(p_date) OR p_timezone IS NULL OR NOT EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = p_timezone) THEN
    RAISE EXCEPTION 'Choose a valid date and named timezone';
  END IF;
  RETURN QUERY SELECT (p_date + time '09:00') AT TIME ZONE p_timezone,
    ((p_date + 1)::timestamp AT TIME ZONE p_timezone) - interval '1 millisecond';
END;
$$;
REVOKE ALL ON FUNCTION public.campaign_date_instants(date, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.campaign_date_instants(date, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.schedule_appraisal_campaign(p_campaign_id uuid, p_send_date date)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  c public.campaigns;
  send_at timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501'; END IF;
  SELECT * INTO c FROM public.campaigns WHERE id = p_campaign_id FOR UPDATE;
  IF NOT FOUND OR NOT private.is_org_admin(c.organization_id) THEN
    RAISE EXCEPTION 'Campaign unavailable' USING ERRCODE = '42501';
  END IF;
  IF c.status NOT IN ('draft', 'scheduled') OR c.campaign_type <> 'annual_appraisal' THEN
    RAISE EXCEPTION 'Only draft or scheduled annual appraisals can be scheduled';
  END IF;
  SELECT opens_at INTO send_at FROM public.campaign_date_instants(p_send_date, c.timezone);
  IF send_at <= now() THEN RAISE EXCEPTION 'Send time must be in the future'; END IF;
  IF c.closes_at IS NOT NULL AND c.closes_at <= send_at THEN RAISE EXCEPTION 'Close time must be after the send time'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.campaign_assignments WHERE campaign_id = c.id AND organization_id = c.organization_id AND status = 'pending') THEN
    RAISE EXCEPTION 'Save participants before scheduling';
  END IF;
  PERFORM public.freeze_campaign_questions(c.id);
  IF NOT EXISTS (SELECT 1 FROM public.campaign_questions WHERE campaign_id = c.id AND organization_id = c.organization_id) THEN
    RAISE EXCEPTION 'Choose a template containing questions';
  END IF;
  UPDATE public.campaigns SET status = 'scheduled', opens_at = send_at, send_claimed_at = NULL, schedule_error = NULL WHERE id = c.id;
END;
$$;
REVOKE ALL ON FUNCTION public.schedule_appraisal_campaign(uuid, date) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.schedule_appraisal_campaign(uuid, date) TO authenticated;
-- Send times and lifecycle transitions must use the existing/new guarded RPCs.
REVOKE UPDATE ON public.campaigns FROM authenticated, anon;
GRANT UPDATE (name, template_id, settings, reminder_settings) ON public.campaigns TO authenticated;

-- New campaigns cannot skip draft setup through the generic table endpoint.
DROP POLICY campaigns_insert ON public.campaigns;
CREATE POLICY campaigns_insert ON public.campaigns FOR INSERT TO authenticated
WITH CHECK (public.is_org_admin(organization_id) AND status = 'draft'
  AND questions_frozen_at IS NULL AND send_claimed_at IS NULL);

-- Snapshot the campaign timezone into new invite/reminder payloads. Existing
-- payloads retain their historic timestamps and use the UK default formatter.
CREATE OR REPLACE FUNCTION private.stamp_outbox_timezone()
RETURNS trigger LANGUAGE plpgsql
SET search_path = public, private, pg_temp
AS $$
DECLARE zone text;
BEGIN
  IF NEW.kind IN ('appraisal_invite', 'appraisal_reminder', 'campaign_invite') AND NEW.payload ? 'campaign_id' THEN
    SELECT timezone INTO zone FROM public.campaigns WHERE id = (NEW.payload ->> 'campaign_id')::uuid AND organization_id = NEW.organization_id;
    IF zone IS NOT NULL THEN NEW.payload := NEW.payload || jsonb_build_object('timezone', zone); END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.stamp_outbox_timezone() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER email_outbox_stamp_timezone BEFORE INSERT ON public.email_outbox
FOR EACH ROW EXECUTE FUNCTION private.stamp_outbox_timezone();
NOTIFY pgrst, 'reload schema';
