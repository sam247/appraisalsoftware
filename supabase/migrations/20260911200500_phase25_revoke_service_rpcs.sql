-- Harden: service-only RPCs must not be executable by anon/authenticated.
-- Internal is_service_role() guard remains; this removes PostgREST exposure.

CREATE OR REPLACE FUNCTION private.is_service_role()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path TO 'private'
AS $$
  SELECT coalesce(auth.jwt() ->> 'role', '') = 'service_role';
$$;

REVOKE ALL ON FUNCTION private.is_service_role() FROM PUBLIC;

REVOKE ALL ON FUNCTION public.claim_email_outbox_batch(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_email_outbox_batch(integer) TO service_role;

REVOKE ALL ON FUNCTION public.mark_email_outbox_result(uuid, boolean, text, text, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_email_outbox_result(uuid, boolean, text, text, timestamptz) TO service_role;

REVOKE ALL ON FUNCTION public.claim_and_activate_due_campaigns(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_and_activate_due_campaigns(integer) TO service_role;

REVOKE ALL ON FUNCTION public.close_due_campaigns(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.close_due_campaigns(integer) TO service_role;

REVOKE ALL ON FUNCTION public.enqueue_appraisal_reminders(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_appraisal_reminders(integer) TO service_role;

REVOKE ALL ON FUNCTION public.drain_email_outbox(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.drain_email_outbox(integer) TO service_role;
