-- Fix annual respondent golden path: respond_get_questions crashed with
-- "column reference id is ambiguous" because RETURNS TABLE(id uuid, ...)
-- made bare `id` in WHERE clauses refer to both the OUT variable and the
-- table column. Resolve succeeded (no OUT named id); questions load failed.
--
-- This function was previously present in production without a repo migration.
-- CREATE OR REPLACE makes fresh installs and existing projects converge.

CREATE OR REPLACE FUNCTION public.respond_get_questions(p_raw_token text)
RETURNS TABLE (
  id uuid,
  campaign_id uuid,
  organization_id uuid,
  sort_order integer,
  type text,
  prompt text,
  help_text text,
  required boolean,
  options jsonb,
  scale jsonb,
  stable_key text,
  source_template_question_id uuid
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'private', 'extensions', 'pg_temp'
AS $$
DECLARE
  v_hash text;
  v_campaign_id uuid;
BEGIN
  v_hash := encode(extensions.digest(trim(p_raw_token), 'sha256'), 'hex');

  SELECT a.campaign_id
  INTO v_campaign_id
  FROM public.access_tokens t
  JOIN public.campaign_assignments a ON a.id = t.assignment_id
  WHERE t.token_hash = v_hash
    AND t.revoked_at IS NULL
    AND t.expires_at > now();

  IF v_campaign_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired link' USING ERRCODE = 'P0002';
  END IF;

  RETURN QUERY
  SELECT
    cq.id,
    cq.campaign_id,
    cq.organization_id,
    cq.sort_order,
    cq.type,
    cq.prompt,
    cq.help_text,
    cq.required,
    cq.options,
    cq.scale,
    cq.stable_key,
    cq.source_template_question_id
  FROM public.campaign_questions cq
  WHERE cq.campaign_id = v_campaign_id
  ORDER BY cq.sort_order, cq.id;
END;
$$;

REVOKE ALL ON FUNCTION public.respond_get_questions(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.respond_get_questions(text) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
