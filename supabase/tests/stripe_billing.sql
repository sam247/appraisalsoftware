-- Disposable local database only; checks Stripe billing RPC boundaries and plan transitions.
RESET ROLE;
SET request.jwt.claims='{}';
INSERT INTO auth.users(id,email) VALUES('c0000000-0000-0000-0000-000000000001','billing-owner@example.test'),('c0000000-0000-0000-0000-000000000002','billing-other@example.test');
SET request.jwt.claim.sub='c0000000-0000-0000-0000-000000000001';
SET ROLE authenticated;
SELECT (public.bootstrap_organization('Billing test')).id AS billing_org \gset
-- Admins can read a summary but never touch billing state or Stripe ids.
DO $$ DECLARE org uuid; BEGIN
 SELECT id INTO org FROM public.organizations WHERE name='Billing test';
 ASSERT NOT (public.get_workspace_billing(org)->>'has_customer')::boolean;
 BEGIN PERFORM public.apply_stripe_subscription(org,'cus_x','sub_x','active','pro','month',now(),false,now()); RAISE EXCEPTION 'Expected forbidden'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
DO $$ BEGIN
 ASSERT NOT has_table_privilege('authenticated','private.workspace_billing','SELECT');
 ASSERT NOT has_function_privilege('authenticated','public.apply_stripe_subscription(uuid,text,text,text,text,text,timestamptz,boolean,timestamptz)','EXECUTE');
 ASSERT NOT has_function_privilege('authenticated','public.set_workspace_stripe_customer(uuid,text)','EXECUTE');
 ASSERT NOT has_function_privilege('anon','public.workspace_stripe_customer(uuid)','EXECUTE');
END $$;
SET request.jwt.claims='{"role":"service_role"}';
SET ROLE service_role;
DO $$ DECLARE org uuid; BEGIN
 SELECT id INTO org FROM public.organizations WHERE name='Billing test';
 -- First customer wins; a racing second customer converges on the first.
 ASSERT public.set_workspace_stripe_customer(org,'cus_first')='cus_first';
 ASSERT public.set_workspace_stripe_customer(org,'cus_second')='cus_first';
 ASSERT public.workspace_stripe_customer(org)='cus_first';
 -- Checkout completes: Pro becomes active immediately.
 ASSERT public.apply_stripe_subscription(org,'cus_first','sub_1','active','pro','month','2026-11-18',false,'2026-10-18 10:00')='applied';
 ASSERT (SELECT plan='pro' AND NOT needs_review FROM private.workspace_entitlements WHERE organization_id=org);
 -- Customer-only lookup works (subscription.updated events carry no workspace id).
 ASSERT public.apply_stripe_subscription(NULL,'cus_first','sub_1','active','organisation','year','2027-10-18',false,'2026-10-18 11:00')='applied';
 ASSERT (SELECT plan='organisation' FROM private.workspace_entitlements WHERE organization_id=org);
 -- An older event arriving late is ignored.
 ASSERT public.apply_stripe_subscription(NULL,'cus_first','sub_1','active','pro','month','2026-11-18',false,'2026-10-18 10:30')='stale';
 ASSERT (SELECT plan='organisation' FROM private.workspace_entitlements WHERE organization_id=org);
 -- Scheduled cancellation keeps access; recorded for the UI.
 ASSERT public.apply_stripe_subscription(NULL,'cus_first','sub_1','active','organisation','year','2027-10-18',true,'2026-10-18 12:00')='applied';
END $$;
-- service_role cannot read the private table directly; check as the owner.
RESET ROLE;
DO $$ BEGIN
 ASSERT (SELECT cancel_at_period_end FROM private.workspace_billing WHERE organization_id=(SELECT id FROM public.organizations WHERE name='Billing test'));
END $$;
SET ROLE service_role;
DO $$ DECLARE org uuid; BEGIN
 SELECT id INTO org FROM public.organizations WHERE name='Billing test';
 -- An old, replaced subscription ending does not downgrade the current one.
 ASSERT public.apply_stripe_subscription(NULL,'cus_first','sub_old','canceled','pro','month',NULL,false,'2026-10-18 12:30')='ignored';
 ASSERT (SELECT plan='organisation' FROM private.workspace_entitlements WHERE organization_id=org);
 -- The current subscription ending returns the workspace to Free; data stays.
 ASSERT public.apply_stripe_subscription(NULL,'cus_first','sub_1','canceled','organisation','year',NULL,false,'2026-10-18 13:00')='applied';
 ASSERT (SELECT plan='free' FROM private.workspace_entitlements WHERE organization_id=org);
 -- Mismatched customer for a known workspace and unknown customers are rejected.
 BEGIN PERFORM public.apply_stripe_subscription(org,'cus_other','sub_2','active','pro','month',now(),false,now()); RAISE EXCEPTION 'Expected mismatch'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 BEGIN PERFORM public.apply_stripe_subscription(NULL,'cus_unknown','sub_3','active','pro','month',now(),false,now()); RAISE EXCEPTION 'Expected unknown'; EXCEPTION WHEN no_data_found THEN NULL; END;
END $$;
-- Legacy workspaces are never downgraded by billing.
RESET ROLE;
UPDATE private.workspace_entitlements SET plan='legacy' WHERE organization_id=:'billing_org';
SET ROLE service_role;
DO $$ DECLARE org uuid; BEGIN
 SELECT id INTO org FROM public.organizations WHERE name='Billing test';
 ASSERT public.apply_stripe_subscription(NULL,'cus_first','sub_1','unpaid','organisation','year',NULL,false,'2026-10-18 14:00')='applied';
 ASSERT (SELECT plan='legacy' FROM private.workspace_entitlements WHERE organization_id=org);
END $$;
RESET ROLE;
