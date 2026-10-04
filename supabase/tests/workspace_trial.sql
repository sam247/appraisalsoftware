-- Runs only in the disposable PostgreSQL harness; never a production URL.
RESET ROLE;
SET request.jwt.claims='{}';
UPDATE private.trial_release SET enabled=true;
INSERT INTO auth.users(id,email) VALUES('a0000000-0000-0000-0000-000000000001','trial-owner@example.test');
SET request.jwt.claim.sub='a0000000-0000-0000-0000-000000000001';
SET ROLE authenticated;
SELECT (public.bootstrap_organization('Trial test')).id AS trial_org \gset
RESET ROLE;
DO $$ DECLARE org uuid; BEGIN
 SELECT id INTO org FROM public.organizations WHERE name='Trial test';
 ASSERT (SELECT plan='trial' AND trial_ends_at-trial_started_at=interval '14 days' FROM private.workspace_entitlements WHERE organization_id=org);
 ASSERT NOT has_table_privilege('authenticated','private.workspace_entitlements','UPDATE');
 ASSERT NOT has_function_privilege('authenticated','public.activate_workspace_plan(uuid,text)','EXECUTE');
 ASSERT (SELECT bool_and(plan='legacy') FROM private.workspace_entitlements WHERE organization_id<>org);
END $$;
SET ROLE authenticated;
DO $$ BEGIN
 BEGIN PERFORM public.bootstrap_organization('Retry'); RAISE EXCEPTION 'Expected retry rejection';
 EXCEPTION WHEN raise_exception THEN ASSERT SQLERRM='User already belongs to an organisation'; END;
END $$;
RESET ROLE;
INSERT INTO public.people(organization_id,email,full_name) SELECT :'trial_org','trial-'||i||'@example.test','Person '||i FROM generate_series(1,75) i;
DO $$ DECLARE org uuid; BEGIN
 SELECT id INTO org FROM public.organizations WHERE name='Trial test';
 BEGIN INSERT INTO public.people(organization_id,email) VALUES(org,'over-capacity@example.test'); RAISE EXCEPTION 'Expected employee cap'; EXCEPTION WHEN raise_exception THEN ASSERT SQLERRM LIKE 'Employee capacity reached%'; END;
END $$;
INSERT INTO public.people(organization_id,email,reviewer_only) SELECT :'trial_org','external-'||i||'@example.test',true FROM generate_series(1,6) i;
SELECT id AS subject FROM public.people WHERE email='trial-1@example.test' \gset
INSERT INTO public.templates(organization_id,name) VALUES(:'trial_org','Trial 360') RETURNING id AS trial_template \gset
INSERT INTO public.template_questions(organization_id,template_id,type,prompt,required,scale) VALUES(:'trial_org',:'trial_template','text','What should continue?',false,'{}');
SET ROLE authenticated;
SELECT public.create_feedback_360('Trial 360 campaign', :'subject', (SELECT jsonb_agg(jsonb_build_object('person_id',id,'relationship','peer')) FROM public.people WHERE organization_id=:'trial_org' AND reviewer_only), :'trial_template') AS trial_360 \gset
SELECT public.activate_campaign(:'trial_360');
SELECT public.claim_first_activation_measurement(:'trial_org');
DO $$ DECLARE org uuid; BEGIN
 SELECT id INTO org FROM public.organizations WHERE name='Trial test';
 ASSERT NOT public.claim_first_activation_measurement(org);
END $$;
RESET ROLE;
SELECT payload->>'raw_token' AS trial_token FROM public.email_outbox WHERE payload->>'campaign_id'=:'trial_360' LIMIT 1 \gset
SELECT id AS trial_question FROM public.campaign_questions WHERE campaign_id=:'trial_360' LIMIT 1 \gset
SET ROLE anon;
SELECT public.feedback_360_write(:'trial_token',jsonb_build_array(jsonb_build_object('campaign_question_id',:'trial_question','text_value','Retained trial feedback')),false);
RESET ROLE;
SET ROLE authenticated;
INSERT INTO public.campaigns(organization_id,name,campaign_type,template_id) VALUES(:'trial_org','Trial annual','annual_appraisal',:'trial_template') RETURNING id AS trial_annual \gset
SELECT public.save_appraisal_participants(:'trial_annual',jsonb_build_array(jsonb_build_object('person_id',:'subject','manager_person_id',(SELECT id FROM public.people WHERE email='trial-2@example.test'))));
SELECT public.activate_campaign(:'trial_annual');
RESET ROLE;
SELECT payload->>'raw_token' AS annual_token FROM public.email_outbox WHERE payload->>'campaign_id'=:'trial_annual' LIMIT 1 \gset
SELECT id AS annual_question FROM public.campaign_questions WHERE campaign_id=:'trial_annual' LIMIT 1 \gset
SET ROLE anon;
SELECT public.respond_save(:'annual_token',jsonb_build_array(jsonb_build_object('campaign_question_id',:'annual_question','text_value','Retained annual answer')));
RESET ROLE;
INSERT INTO public.campaigns(organization_id,name,campaign_type,status) SELECT :'trial_org','Trial scheduled '||i,'annual_appraisal','scheduled' FROM generate_series(1,3) i;
DO $$ DECLARE org uuid; BEGIN
 SELECT id INTO org FROM public.organizations WHERE name='Trial test';
 BEGIN INSERT INTO public.campaigns(organization_id,name,campaign_type,status) VALUES(org,'Over capacity','annual_appraisal','scheduled'); RAISE EXCEPTION 'Expected campaign cap'; EXCEPTION WHEN raise_exception THEN ASSERT SQLERRM LIKE 'Active campaign capacity reached%'; END;
 BEGIN UPDATE public.people SET reviewer_only=true WHERE organization_id=org AND email='trial-1@example.test'; RAISE EXCEPTION 'Expected external subject rejection'; EXCEPTION WHEN raise_exception THEN ASSERT SQLERRM LIKE 'A subject or annual participant%'; END;
END $$;
SET ROLE authenticated;
SELECT public.create_organization_invitation(:'trial_org','admin1@example.test');
SELECT public.create_organization_invitation(:'trial_org','admin2@example.test');
DO $$ DECLARE org uuid; BEGIN
 SELECT id INTO org FROM public.organizations WHERE name='Trial test';
 BEGIN PERFORM public.create_organization_invitation(org,'admin3@example.test'); RAISE EXCEPTION 'Expected admin cap'; EXCEPTION WHEN raise_exception THEN ASSERT SQLERRM LIKE 'Admin capacity reached%'; END;
END $$;
RESET ROLE;
UPDATE private.workspace_entitlements SET trial_started_at=now()-interval '14 days',trial_ends_at=now() WHERE organization_id=:'trial_org';
-- Use a single timestamp to preserve the exact duration.
UPDATE private.workspace_entitlements SET trial_started_at=trial_ends_at-interval '14 days' WHERE organization_id=:'trial_org';
DO $$ DECLARE org uuid; BEGIN
 SELECT id INTO org FROM public.organizations WHERE name='Trial test';
 ASSERT NOT private.workspace_can_operate(org);
 BEGIN INSERT INTO public.people(organization_id,email,reviewer_only) VALUES(org,'expired@example.test',true); RAISE EXCEPTION 'Expected expiry'; EXCEPTION WHEN insufficient_privilege THEN ASSERT SQLERRM LIKE 'Your workspace trial has ended%'; END;
 BEGIN UPDATE public.templates SET name='Expired edit' WHERE organization_id=org; RAISE EXCEPTION 'Expected template expiry'; EXCEPTION WHEN insufficient_privilege THEN ASSERT SQLERRM LIKE 'Your workspace trial has ended%'; END;
END $$;
DO $$ DECLARE token text; question uuid; BEGIN
 SELECT e.payload->>'raw_token' INTO token FROM public.email_outbox e JOIN public.campaigns c ON c.id=(e.payload->>'campaign_id')::uuid WHERE c.name='Trial 360 campaign' LIMIT 1;
 SELECT id INTO question FROM public.campaign_questions WHERE campaign_id=(SELECT id FROM public.campaigns WHERE name='Trial 360 campaign') LIMIT 1;
 BEGIN PERFORM public.feedback_360_write(token,jsonb_build_array(jsonb_build_object('campaign_question_id',question,'text_value','Must fail')),true); RAISE EXCEPTION 'Expected 360 expiry'; EXCEPTION WHEN insufficient_privilege THEN ASSERT SQLERRM LIKE 'Your workspace trial has ended%'; END;
 ASSERT EXISTS(SELECT 1 FROM private.feedback_360_answers WHERE text_value='Retained trial feedback');
END $$;
DO $$ DECLARE token text; question uuid; BEGIN
 SELECT e.payload->>'raw_token' INTO token FROM public.email_outbox e JOIN public.campaigns c ON c.id=(e.payload->>'campaign_id')::uuid WHERE c.name='Trial annual' LIMIT 1;
 SELECT id INTO question FROM public.campaign_questions WHERE campaign_id=(SELECT id FROM public.campaigns WHERE name='Trial annual') LIMIT 1;
 BEGIN PERFORM public.respond_submit(token,jsonb_build_array(jsonb_build_object('campaign_question_id',question,'text_value','Must fail'))); RAISE EXCEPTION 'Expected annual expiry'; EXCEPTION WHEN insufficient_privilege THEN ASSERT SQLERRM LIKE 'Your workspace trial has ended%'; END;
 ASSERT EXISTS(SELECT 1 FROM public.response_answers WHERE text_value='Retained annual answer');
END $$;
SET request.jwt.claims='{"role":"service_role"}';
SET ROLE service_role;
DO $$ DECLARE org uuid; BEGIN
 SELECT id INTO org FROM public.organizations WHERE name='Trial test';
 ASSERT NOT public.workspace_delivery_allowed(org);
 ASSERT NOT EXISTS(SELECT 1 FROM public.claim_email_outbox_batch(100) WHERE organization_id=org);
 PERFORM public.enqueue_appraisal_reminders(100);
 ASSERT public.expire_trial_campaigns()=5;
 ASSERT (SELECT count(*)=2 FROM public.campaigns WHERE organization_id=org AND status='closed');
 ASSERT (SELECT count(*)=3 FROM public.campaigns WHERE organization_id=org AND status='draft');
 PERFORM public.activate_workspace_plan(org,'pro');
 ASSERT public.workspace_delivery_allowed(org);
END $$;
RESET ROLE;

DO $$ DECLARE org uuid; ended timestamptz; BEGIN
 SELECT id INTO org FROM public.organizations WHERE name='Trial test';
 SELECT trial_ends_at INTO ended FROM private.workspace_entitlements WHERE organization_id=org;
 ASSERT ended<=clock_timestamp();
 ASSERT (SELECT plan='pro' FROM private.workspace_entitlements WHERE organization_id=org);
 UPDATE public.templates SET description='Paid edit restored' WHERE organization_id=org;
END $$;
UPDATE private.trial_release SET enabled=false;
SET request.jwt.claims='{}';
SET request.jwt.claim.sub='10000000-0000-0000-0000-000000000001';
