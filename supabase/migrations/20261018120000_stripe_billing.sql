-- Self-serve billing: Stripe subscriptions drive Pro / Organisation entitlements.
-- Additive. Manual activation (activate_workspace_plan) keeps working; workspaces
-- with no Stripe subscription are never touched by webhooks.
BEGIN;

CREATE TABLE private.workspace_billing (
 organization_id uuid PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
 stripe_customer_id text UNIQUE,
 stripe_subscription_id text UNIQUE,
 subscription_status text,
 plan text CHECK (plan IN ('pro','organisation')),
 billing_interval text CHECK (billing_interval IN ('month','year')),
 current_period_end timestamptz,
 cancel_at_period_end boolean NOT NULL DEFAULT false,
 last_event_at timestamptz,
 updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON private.workspace_billing FROM PUBLIC, anon, authenticated;

-- Server-only: the Stripe customer for a workspace, if one exists.
CREATE OR REPLACE FUNCTION public.workspace_stripe_customer(p_organization_id uuid) RETURNS text
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=private,pg_temp AS $$
BEGIN
 IF NOT private.is_service_role() THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 RETURN (SELECT stripe_customer_id FROM private.workspace_billing WHERE organization_id=p_organization_id);
END $$;
REVOKE ALL ON FUNCTION public.workspace_stripe_customer(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.workspace_stripe_customer(uuid) TO service_role;

-- Server-only: remember the customer. First writer wins, so concurrent checkouts
-- converge on one customer; the stored id is returned.
CREATE OR REPLACE FUNCTION public.set_workspace_stripe_customer(p_organization_id uuid, p_customer text) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path=private,pg_temp AS $$
DECLARE stored text;
BEGIN
 IF NOT private.is_service_role() THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 IF p_customer IS NULL OR p_customer !~ '^cus_' THEN RAISE EXCEPTION 'Invalid Stripe customer' USING ERRCODE='22023'; END IF;
 INSERT INTO private.workspace_billing(organization_id, stripe_customer_id) VALUES (p_organization_id, p_customer)
 ON CONFLICT (organization_id) DO UPDATE
   SET stripe_customer_id=coalesce(private.workspace_billing.stripe_customer_id, excluded.stripe_customer_id), updated_at=now();
 SELECT stripe_customer_id INTO stored FROM private.workspace_billing WHERE organization_id=p_organization_id;
 RETURN stored;
END $$;
REVOKE ALL ON FUNCTION public.set_workspace_stripe_customer(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_workspace_stripe_customer(uuid,text) TO service_role;

-- Server-only, called by the Stripe webhook. Returns 'applied', 'stale' or 'ignored'.
-- Entitled statuses keep the paid plan; anything else returns the workspace to Free.
-- Legacy workspaces are never downgraded by billing.
CREATE OR REPLACE FUNCTION public.apply_stripe_subscription(
 p_organization_id uuid, p_customer text, p_subscription text, p_status text,
 p_plan text, p_interval text, p_period_end timestamptz, p_cancel_at_period_end boolean, p_event_at timestamptz
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private,pg_temp AS $$
DECLARE org uuid; b private.workspace_billing; entitled boolean;
BEGIN
 IF NOT private.is_service_role() THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 IF p_plan IS NOT NULL AND p_plan NOT IN ('pro','organisation') THEN RAISE EXCEPTION 'Unknown plan %', p_plan USING ERRCODE='22023'; END IF;
 org := coalesce(p_organization_id, (SELECT organization_id FROM private.workspace_billing WHERE stripe_customer_id=p_customer));
 IF org IS NULL THEN RAISE EXCEPTION 'Unknown Stripe customer' USING ERRCODE='P0002'; END IF;
 PERFORM 1 FROM private.workspace_entitlements WHERE organization_id=org FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Workspace unavailable' USING ERRCODE='P0002'; END IF;

 INSERT INTO private.workspace_billing(organization_id, stripe_customer_id) VALUES (org, p_customer)
 ON CONFLICT (organization_id) DO NOTHING;
 SELECT * INTO b FROM private.workspace_billing WHERE organization_id=org FOR UPDATE;
 IF b.stripe_customer_id IS DISTINCT FROM p_customer THEN RAISE EXCEPTION 'Customer does not match workspace' USING ERRCODE='22023'; END IF;

 entitled := p_status IN ('active','trialing','past_due');
 -- Events can arrive out of order; never let an older event overwrite a newer one.
 IF b.last_event_at IS NOT NULL AND p_event_at < b.last_event_at THEN RETURN 'stale'; END IF;
 -- A replaced subscription ending must not cancel the workspace's current one.
 IF NOT entitled AND b.stripe_subscription_id IS NOT NULL AND b.stripe_subscription_id <> p_subscription
    AND b.subscription_status IN ('active','trialing','past_due') THEN RETURN 'ignored'; END IF;

 UPDATE private.workspace_billing SET
   stripe_subscription_id=p_subscription, subscription_status=p_status,
   plan=coalesce(p_plan, plan), billing_interval=coalesce(p_interval, billing_interval),
   current_period_end=p_period_end, cancel_at_period_end=coalesce(p_cancel_at_period_end,false),
   last_event_at=p_event_at, updated_at=now()
 WHERE organization_id=org;

 IF entitled AND p_plan IS NOT NULL THEN
   UPDATE private.workspace_entitlements SET plan=p_plan, needs_review=false WHERE organization_id=org;
 ELSIF NOT entitled THEN
   UPDATE private.workspace_entitlements SET plan='free' WHERE organization_id=org AND plan IN ('pro','organisation');
 END IF;
 RETURN 'applied';
END $$;
REVOKE ALL ON FUNCTION public.apply_stripe_subscription(uuid,text,text,text,text,text,timestamptz,boolean,timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_stripe_subscription(uuid,text,text,text,text,text,timestamptz,boolean,timestamptz) TO service_role;

-- Admin-readable billing summary (no Stripe ids leave the server).
CREATE OR REPLACE FUNCTION public.get_workspace_billing(p_organization_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,private,pg_temp AS $$
DECLARE b private.workspace_billing;
BEGIN
 IF NOT private.is_org_admin(p_organization_id) THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 SELECT * INTO b FROM private.workspace_billing WHERE organization_id=p_organization_id;
 RETURN jsonb_build_object(
  'has_customer', b.stripe_customer_id IS NOT NULL,
  'status', b.subscription_status,
  'plan', b.plan,
  'interval', b.billing_interval,
  'current_period_end', b.current_period_end,
  'cancel_at_period_end', coalesce(b.cancel_at_period_end,false));
END $$;
REVOKE ALL ON FUNCTION public.get_workspace_billing(uuid) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_workspace_billing(uuid) TO authenticated;

NOTIFY pgrst,'reload schema';
COMMIT;
