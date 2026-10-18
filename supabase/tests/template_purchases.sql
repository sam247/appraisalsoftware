-- Disposable local database only; checks template purchase boundaries.
RESET ROLE;
SET request.jwt.claims='{}';
INSERT INTO auth.users(id,email) VALUES('d0000000-0000-0000-0000-000000000001','packs-owner@example.test'),('d0000000-0000-0000-0000-000000000002','packs-other@example.test');
SET request.jwt.claim.sub='d0000000-0000-0000-0000-000000000001';
SET ROLE authenticated;
SELECT (public.bootstrap_organization('Packs test')).id AS packs_org \gset
DO $$ DECLARE org uuid; BEGIN
 SELECT id INTO org FROM public.organizations WHERE name='Packs test';
 ASSERT cardinality(public.list_template_purchases(org)) = 0;
 BEGIN PERFORM public.record_template_purchase(org,'annual-appraisal-pack','cs_x',4900,'gbp'); RAISE EXCEPTION 'Expected forbidden'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
-- Another workspace's admin cannot list this workspace's purchases.
RESET ROLE;
SET request.jwt.claim.sub='d0000000-0000-0000-0000-000000000002';
SET ROLE authenticated;
SELECT (public.bootstrap_organization('Other packs')).id AS other_org \gset
DO $$ BEGIN
 BEGIN PERFORM public.list_template_purchases((SELECT id FROM public.organizations WHERE name='Packs test')); RAISE EXCEPTION 'Expected forbidden'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
DO $$ BEGIN
 ASSERT NOT has_table_privilege('authenticated','private.template_purchases','SELECT');
 ASSERT NOT has_function_privilege('authenticated','public.record_template_purchase(uuid,text,text,integer,text)','EXECUTE');
END $$;
SET request.jwt.claims='{"role":"service_role"}';
SET ROLE service_role;
DO $$ DECLARE org uuid; BEGIN
 SELECT id INTO org FROM public.organizations WHERE name='Packs test';
 ASSERT public.record_template_purchase(org,'annual-appraisal-pack','cs_1',4900,'gbp')='recorded';
 -- Stripe retries the same session: no duplicate.
 ASSERT public.record_template_purchase(org,'annual-appraisal-pack','cs_1',4900,'gbp')='duplicate';
 -- Buying the same pack twice in one workspace keeps a single entitlement.
 ASSERT public.record_template_purchase(org,'annual-appraisal-pack','cs_2',4900,'gbp')='duplicate';
 ASSERT public.record_template_purchase(org,'sales-performance-pack','cs_3',4900,'gbp')='recorded';
 BEGIN PERFORM public.record_template_purchase(org,'Bad Slug!','cs_4',1,'gbp'); RAISE EXCEPTION 'Expected check'; EXCEPTION WHEN check_violation THEN NULL; END;
 BEGIN PERFORM public.record_template_purchase('00000000-0000-0000-0000-000000000000','sales-performance-pack','cs_5',1,'gbp'); RAISE EXCEPTION 'Expected unknown'; EXCEPTION WHEN no_data_found THEN NULL; END;
END $$;
RESET ROLE;
SET request.jwt.claims='{}';
SET request.jwt.claim.sub='d0000000-0000-0000-0000-000000000001';
SET ROLE authenticated;
DO $$ BEGIN
 ASSERT public.list_template_purchases((SELECT id FROM public.organizations WHERE name='Packs test')) = ARRAY['annual-appraisal-pack','sales-performance-pack'];
END $$;
RESET ROLE;
