-- Align with Disclosurely Feedback close model:
-- closing a campaign revokes outstanding respondent tokens and marks
-- incomplete assignments revoked so links stop working immediately.

CREATE OR REPLACE FUNCTION public.close_campaign(p_campaign_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
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

  IF v_campaign.status = 'closed' THEN
    RETURN; -- idempotent
  END IF;

  IF v_campaign.status NOT IN ('active', 'scheduled', 'draft') THEN
    RAISE EXCEPTION 'Cannot close campaign in status %', v_campaign.status
      USING ERRCODE = 'P0001';
  END IF;

  -- Revoke all live respondent tokens for this campaign
  UPDATE public.access_tokens t
  SET revoked_at = now()
  FROM public.campaign_assignments a
  WHERE a.id = t.assignment_id
    AND a.campaign_id = p_campaign_id
    AND a.organization_id = v_campaign.organization_id
    AND t.revoked_at IS NULL;

  -- Incomplete assignments become revoked (submitted stay submitted)
  UPDATE public.campaign_assignments
  SET status = 'revoked', updated_at = now()
  WHERE campaign_id = p_campaign_id
    AND organization_id = v_campaign.organization_id
    AND status NOT IN ('submitted', 'revoked');

  UPDATE public.campaigns
  SET status = 'closed', updated_at = now()
  WHERE id = p_campaign_id;
END;
$$;

REVOKE ALL ON FUNCTION public.close_campaign(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.close_campaign(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.close_campaign(uuid) TO service_role;

-- Scheduler close path: same revoke semantics via close_campaign
CREATE OR REPLACE FUNCTION public.close_due_campaigns(p_limit integer DEFAULT 50)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_limit integer := least(greatest(coalesce(p_limit, 50), 1), 100);
  r record;
  n integer := 0;
BEGIN
  IF NOT private.is_service_role() THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  FOR r IN
    SELECT c.id
    FROM public.campaigns c
    WHERE c.status = 'active'
      AND c.closes_at IS NOT NULL
      AND c.closes_at <= now()
    ORDER BY c.closes_at
    LIMIT v_limit
    FOR UPDATE OF c SKIP LOCKED
  LOOP
    PERFORM public.close_campaign(r.id);
    n := n + 1;
  END LOOP;

  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.close_due_campaigns(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.close_due_campaigns(integer) TO service_role;
