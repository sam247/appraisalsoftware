-- Template marketplace: one-off pack purchases per workspace. Additive.
BEGIN;

CREATE TABLE private.template_purchases (
 id bigserial PRIMARY KEY,
 organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
 pack_slug text NOT NULL CHECK (pack_slug ~ '^[a-z0-9-]{3,64}$'),
 stripe_session_id text NOT NULL UNIQUE,
 amount_total integer,
 currency text,
 purchased_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (organization_id, pack_slug)
);
REVOKE ALL ON private.template_purchases FROM PUBLIC, anon, authenticated;

-- Server-only, called by the Stripe webhook. Idempotent on session and pack.
CREATE OR REPLACE FUNCTION public.record_template_purchase(
 p_organization_id uuid, p_pack_slug text, p_session text, p_amount integer, p_currency text
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path=private,public,pg_temp AS $$
DECLARE inserted integer;
BEGIN
 IF NOT private.is_service_role() THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE id=p_organization_id) THEN
   RAISE EXCEPTION 'Workspace unavailable' USING ERRCODE='P0002';
 END IF;
 INSERT INTO private.template_purchases(organization_id, pack_slug, stripe_session_id, amount_total, currency)
 VALUES (p_organization_id, p_pack_slug, p_session, p_amount, p_currency)
 ON CONFLICT DO NOTHING;
 GET DIAGNOSTICS inserted = ROW_COUNT;
 RETURN CASE WHEN inserted > 0 THEN 'recorded' ELSE 'duplicate' END;
END $$;
REVOKE ALL ON FUNCTION public.record_template_purchase(uuid,text,text,integer,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_template_purchase(uuid,text,text,integer,text) TO service_role;

-- Admin-readable: which packs this workspace owns.
CREATE OR REPLACE FUNCTION public.list_template_purchases(p_organization_id uuid) RETURNS text[]
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=private,public,pg_temp AS $$
BEGIN
 IF NOT private.is_org_admin(p_organization_id) THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 RETURN coalesce((SELECT array_agg(pack_slug ORDER BY purchased_at) FROM private.template_purchases WHERE organization_id=p_organization_id), '{}');
END $$;
REVOKE ALL ON FUNCTION public.list_template_purchases(uuid) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.list_template_purchases(uuid) TO authenticated;

NOTIFY pgrst,'reload schema';
COMMIT;
