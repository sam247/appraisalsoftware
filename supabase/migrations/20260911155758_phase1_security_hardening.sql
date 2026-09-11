-- Phase 1 security hardening (applied remotely; kept in repo for drift parity)

CREATE OR REPLACE FUNCTION private.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public', 'private'
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.bootstrap_organization(text);

REVOKE ALL ON FUNCTION public.bootstrap_organization(text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_organization_invitation(uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.accept_organization_invitation(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_org_member(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_org_admin(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_org_owner(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.bootstrap_organization(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_organization_invitation(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_organization_invitation(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_org_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_org_owner(uuid) TO authenticated, service_role;
