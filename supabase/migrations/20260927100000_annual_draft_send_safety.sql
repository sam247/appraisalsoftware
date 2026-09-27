-- Keep the existing public send signatures. Validate Annual under the same row
-- lock as activation/scheduling so UI readiness can never authorise a send.
ALTER FUNCTION private.activate_identified_campaign(uuid) RENAME TO activate_identified_campaign_legacy;
REVOKE ALL ON FUNCTION private.activate_identified_campaign_legacy(uuid) FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION private.validate_annual_send(p_campaign_id uuid, p_scheduled boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private, pg_temp AS $$
DECLARE c public.campaigns;
BEGIN
  SELECT * INTO c FROM public.campaigns WHERE id = p_campaign_id FOR UPDATE;
  IF NOT FOUND OR c.campaign_type <> 'annual_appraisal' OR c.status NOT IN ('draft', 'scheduled') THEN
    RAISE EXCEPTION 'Only a draft or scheduled annual appraisal can be sent';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.campaign_assignments a WHERE a.campaign_id = c.id AND a.organization_id = c.organization_id AND a.status = 'pending') THEN
    RAISE EXCEPTION 'Save participants before sending';
  END IF;
  IF c.questions_frozen_at IS NULL AND (c.template_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.template_questions q WHERE q.template_id = c.template_id AND q.organization_id = c.organization_id)) THEN
    RAISE EXCEPTION 'Choose a template containing questions';
  END IF;
  IF c.closes_at IS NOT NULL AND c.closes_at <= clock_timestamp() THEN
    RAISE EXCEPTION 'Close time must be in the future';
  END IF;
  IF p_scheduled AND c.opens_at IS NOT NULL AND (c.opens_at <= clock_timestamp() OR (c.closes_at IS NOT NULL AND c.closes_at <= c.opens_at)) THEN
    RAISE EXCEPTION 'Choose a future send date before the deadline';
  END IF;
END $$;
REVOKE ALL ON FUNCTION private.validate_annual_send(uuid, boolean) FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION private.activate_identified_campaign(p_campaign_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private, pg_temp AS $$
DECLARE c public.campaigns;
BEGIN
  SELECT * INTO c FROM public.campaigns WHERE id = p_campaign_id FOR UPDATE;
  IF NOT FOUND OR (NOT private.is_service_role() AND (auth.uid() IS NULL OR NOT private.is_org_admin(c.organization_id))) THEN
    RAISE EXCEPTION 'Campaign unavailable' USING ERRCODE = '42501';
  END IF;
  PERFORM private.validate_annual_send(p_campaign_id);
  PERFORM public.freeze_campaign_questions(p_campaign_id);
  IF NOT EXISTS (SELECT 1 FROM public.campaign_questions q WHERE q.campaign_id = p_campaign_id AND q.organization_id = c.organization_id) THEN
    RAISE EXCEPTION 'Choose a template containing questions';
  END IF;
  PERFORM private.activate_identified_campaign_legacy(p_campaign_id);
END $$;
REVOKE ALL ON FUNCTION private.activate_identified_campaign(uuid) FROM PUBLIC, anon, authenticated, service_role;

ALTER FUNCTION private.schedule_identified_appraisal(uuid, date) RENAME TO schedule_identified_appraisal_legacy;
REVOKE ALL ON FUNCTION private.schedule_identified_appraisal_legacy(uuid, date) FROM PUBLIC, anon, authenticated, service_role;
CREATE FUNCTION private.schedule_identified_appraisal(p_campaign_id uuid, p_send_date date)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private, pg_temp AS $$
DECLARE c public.campaigns;
BEGIN
  SELECT * INTO c FROM public.campaigns WHERE id = p_campaign_id FOR UPDATE;
  IF NOT FOUND OR auth.uid() IS NULL OR NOT private.is_org_admin(c.organization_id) THEN
    RAISE EXCEPTION 'Campaign unavailable' USING ERRCODE = '42501';
  END IF;
  PERFORM private.validate_annual_send(p_campaign_id);
  PERFORM private.schedule_identified_appraisal_legacy(p_campaign_id, p_send_date);
  IF NOT EXISTS (SELECT 1 FROM public.campaign_questions q WHERE q.campaign_id = p_campaign_id AND q.organization_id = c.organization_id) THEN
    RAISE EXCEPTION 'Choose a template containing questions';
  END IF;
END $$;
REVOKE ALL ON FUNCTION private.schedule_identified_appraisal(uuid, date) FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION public.save_annual_draft_timing(p_campaign_id uuid, p_mode text, p_send_date date DEFAULT NULL, p_close_date date DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private, pg_temp AS $$
DECLARE c public.campaigns; sending timestamptz; closing timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501'; END IF;
  SELECT * INTO c FROM public.campaigns WHERE id = p_campaign_id FOR UPDATE;
  IF NOT FOUND OR NOT private.is_org_admin(c.organization_id) THEN RAISE EXCEPTION 'Campaign unavailable' USING ERRCODE = '42501'; END IF;
  IF c.campaign_type <> 'annual_appraisal' OR c.status <> 'draft' OR c.questions_frozen_at IS NOT NULL THEN RAISE EXCEPTION 'Only an editable annual draft can change timing'; END IF;
  IF p_mode NOT IN ('now', 'later') OR p_mode IS NULL OR (p_mode = 'now' AND p_send_date IS NOT NULL) OR (p_mode = 'later' AND p_send_date IS NULL) THEN RAISE EXCEPTION 'Choose send now or a send date'; END IF;
  IF p_mode = 'later' THEN
    SELECT opens_at INTO sending FROM public.campaign_date_instants(p_send_date, c.timezone);
    IF sending <= clock_timestamp() THEN RAISE EXCEPTION 'Send time must be in the future'; END IF;
  END IF;
  IF p_close_date IS NOT NULL THEN
    SELECT closes_at INTO closing FROM public.campaign_date_instants(p_close_date, c.timezone);
    IF closing <= clock_timestamp() OR (sending IS NOT NULL AND closing <= sending) THEN RAISE EXCEPTION 'Close time must follow the send time'; END IF;
  END IF;
  UPDATE public.campaigns SET settings = coalesce(settings, '{}'::jsonb) || jsonb_build_object('draft_delivery_mode', p_mode), opens_at = sending, closes_at = closing WHERE id = c.id;
END $$;
REVOKE ALL ON FUNCTION public.save_annual_draft_timing(uuid, text, date, date) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.save_annual_draft_timing(uuid, text, date, date) TO authenticated;

CREATE FUNCTION private.guard_annual_template_change()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, private, pg_temp AS $$
BEGIN
  IF OLD.campaign_type = 'annual_appraisal' AND NEW.template_id IS NOT NULL AND NEW.template_id IS DISTINCT FROM OLD.template_id
    AND (OLD.status <> 'draft' OR OLD.questions_frozen_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Annual questions are locked after send or schedule';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.guard_annual_template_change() FROM PUBLIC, anon, authenticated, service_role;
CREATE TRIGGER campaigns_guard_annual_template BEFORE UPDATE OF template_id ON public.campaigns
FOR EACH ROW EXECUTE FUNCTION private.guard_annual_template_change();

NOTIFY pgrst, 'reload schema';
