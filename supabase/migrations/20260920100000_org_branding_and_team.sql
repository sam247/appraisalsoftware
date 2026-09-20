-- Organisation branding storage + respondent branding fields + safe team admin RPCs.
-- Reuses organizations.logo_url / brand_color (already present).

-- ---------------------------------------------------------------------------
-- Storage: org-branding (public read, org-admin write, path = {org_id}/…)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'org-branding',
  'org-branding',
  true,
  1048576,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS org_branding_select ON storage.objects;
DROP POLICY IF EXISTS org_branding_insert ON storage.objects;
DROP POLICY IF EXISTS org_branding_update ON storage.objects;
DROP POLICY IF EXISTS org_branding_delete ON storage.objects;

CREATE POLICY org_branding_select ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'org-branding');

CREATE POLICY org_branding_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'org-branding'
    AND (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
    AND public.is_org_admin(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY org_branding_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'org-branding'
    AND (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
    AND public.is_org_admin(((storage.foldername(name))[1])::uuid)
  )
  WITH CHECK (
    bucket_id = 'org-branding'
    AND (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
    AND public.is_org_admin(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY org_branding_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'org-branding'
    AND (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
    AND public.is_org_admin(((storage.foldername(name))[1])::uuid)
  );

-- ---------------------------------------------------------------------------
-- respond_resolve — include logo + accent for respondent surfaces
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
  org_name text,
  org_logo_url text,
  org_brand_color text
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
  v_org public.organizations;
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

  SELECT * INTO v_org
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
  org_name := v_org.name;
  org_logo_url := v_org.logo_url;
  org_brand_color := v_org.brand_color;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.respond_resolve(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.respond_resolve(text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- feedback_360_open — include logo + accent
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.feedback_360_open(p_raw_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private', 'pg_temp'
AS $$
DECLARE
  a public.campaign_assignments;
  response uuid;
  output jsonb;
BEGIN
  a := private.lock_360_reviewer(p_raw_token);
  IF a.status = 'submitted' THEN
    RETURN jsonb_build_object('submitted', true);
  END IF;

  SELECT response_id INTO response
  FROM private.feedback_360_identity
  WHERE assignment_id = a.id;

  IF NOT FOUND THEN
    INSERT INTO private.feedback_360_responses (campaign_id, organization_id)
    VALUES (a.campaign_id, a.organization_id)
    RETURNING id INTO response;
    INSERT INTO private.feedback_360_identity (assignment_id, response_id, campaign_id, organization_id)
    VALUES (a.id, response, a.campaign_id, a.organization_id);
  END IF;

  UPDATE public.campaign_assignments
  SET status = 'opened'
  WHERE id = a.id AND status IN ('pending', 'sent');

  SELECT jsonb_build_object(
    'submitted', false,
    'campaign_name', c.name,
    'subject_name', coalesce(p.full_name, p.email),
    'org_name', o.name,
    'org_logo_url', o.logo_url,
    'org_brand_color', o.brand_color,
    'questions', (
      SELECT coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', q.id,
            'prompt', q.prompt,
            'type', q.type,
            'required', q.required,
            'help_text', q.help_text,
            'scale', q.scale
          )
          ORDER BY q.sort_order, q.id
        ),
        '[]'::jsonb
      )
      FROM public.campaign_questions q
      WHERE q.campaign_id = c.id
    ),
    'answers', (
      SELECT coalesce(
        jsonb_agg(
          jsonb_build_object(
            'campaign_question_id', ans.question_id,
            'numeric_value', ans.numeric_value,
            'text_value', ans.text_value
          )
        ),
        '[]'::jsonb
      )
      FROM private.feedback_360_answers ans
      WHERE ans.response_id = response
    )
  )
  INTO output
  FROM public.campaigns c
  JOIN private.feedback_360_contracts f ON f.campaign_id = c.id
  JOIN public.people p ON p.id = f.subject_person_id
  JOIN public.organizations o ON o.id = c.organization_id
  WHERE c.id = a.campaign_id;

  RETURN output;
END;
$$;

REVOKE ALL ON FUNCTION public.feedback_360_open(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.feedback_360_open(text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Team: revoke pending invite
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.revoke_organization_invitation(p_invitation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private', 'pg_temp'
AS $$
DECLARE
  v_inv public.organization_invitations;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_inv
  FROM public.organization_invitations
  WHERE id = p_invitation_id;

  IF NOT FOUND OR NOT private.is_org_admin(v_inv.organization_id) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  IF v_inv.accepted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Invitation already accepted' USING ERRCODE = 'P0001';
  END IF;

  IF v_inv.revoked_at IS NOT NULL THEN
    RETURN;
  END IF;

  UPDATE public.organization_invitations
  SET revoked_at = now()
  WHERE id = p_invitation_id;
END;
$$;

REVOKE ALL ON FUNCTION public.revoke_organization_invitation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.revoke_organization_invitation(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Team: remove admin — never orphan the last owner
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.remove_organization_member(p_member_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private', 'pg_temp'
AS $$
DECLARE
  v_member public.organization_members;
  v_owner_count integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_member
  FROM public.organization_members
  WHERE id = p_member_id;

  IF NOT FOUND OR NOT private.is_org_admin(v_member.organization_id) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  IF v_member.role = 'owner' THEN
    SELECT count(*)::integer INTO v_owner_count
    FROM public.organization_members
    WHERE organization_id = v_member.organization_id
      AND role = 'owner';

    IF v_owner_count <= 1 THEN
      RAISE EXCEPTION 'Cannot remove the last owner' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  -- Admins may remove other admins; only owners may remove an owner.
  IF v_member.role = 'owner' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = v_member.organization_id
        AND m.user_id = auth.uid()
        AND m.role = 'owner'
    ) THEN
      RAISE EXCEPTION 'Only an owner can remove another owner' USING ERRCODE = '42501';
    END IF;
  END IF;

  DELETE FROM public.organization_members WHERE id = p_member_id;
END;
$$;

REVOKE ALL ON FUNCTION public.remove_organization_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.remove_organization_member(uuid) TO authenticated;
