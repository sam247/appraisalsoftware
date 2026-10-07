-- Disposable local database only; checks authenticated and direct database boundaries.
RESET ROLE;
SET request.jwt.claims='{}';
DO $$ BEGIN
 ASSERT (SELECT plan='legacy' AND needs_review AND trial_ends_at<now() FROM private.workspace_entitlements WHERE organization_id=(SELECT id FROM public.organizations WHERE name='Existing expiring'));
 ASSERT private.workspace_can_operate((SELECT id FROM public.organizations WHERE name='Existing expiring'));
 ASSERT (SELECT plan='pro' AND NOT needs_review FROM private.workspace_entitlements WHERE organization_id=(SELECT id FROM public.organizations WHERE name='Trial test'));
 ASSERT (SELECT bool_and(needs_review) FROM private.workspace_entitlements WHERE plan='legacy');
 ASSERT NOT has_table_privilege('authenticated','private.workspace_entitlements','UPDATE');
 ASSERT NOT has_function_privilege('authenticated','public.activate_workspace_plan(uuid,text)','EXECUTE');
 ASSERT EXISTS(SELECT 1 FROM public.response_answers WHERE text_value='Retained annual answer');
 ASSERT EXISTS(SELECT 1 FROM private.feedback_360_answers WHERE text_value='Retained trial feedback');
END $$;
INSERT INTO auth.users(id,email) VALUES('b0000000-0000-0000-0000-000000000001','free-owner@example.test'),('b0000000-0000-0000-0000-000000000002','free-member@example.test');
SET request.jwt.claim.sub='b0000000-0000-0000-0000-000000000001';
SET ROLE authenticated;
SELECT (public.bootstrap_organization('Free test')).id AS free_org \gset
DO $$ DECLARE org uuid; BEGIN
 SELECT id INTO org FROM public.organizations WHERE name='Free test';
 ASSERT public.get_workspace_entitlement(org)->>'plan'='free';
 ASSERT (public.get_workspace_entitlement(org)->>'can_operate')::boolean;
 ASSERT NOT (public.get_workspace_entitlement(org)->>'needs_review')::boolean;
END $$;
-- 10 succeeds; 11 and a multi-row import fail without partial employee writes.
INSERT INTO public.people(organization_id,email,full_name) SELECT :'free_org','free-'||i||'@example.test','Free person '||i FROM generate_series(1,10) i;
DO $$ DECLARE org uuid; BEGIN
 SELECT id INTO org FROM public.organizations WHERE name='Free test';
 BEGIN INSERT INTO public.people(organization_id,email) VALUES(org,'eleven@example.test'); RAISE EXCEPTION 'Expected employee cap'; EXCEPTION WHEN raise_exception THEN ASSERT SQLERRM LIKE 'Employee capacity reached%'; END;
 UPDATE public.people SET archived_at=now() WHERE organization_id=org AND email='free-10@example.test';
 BEGIN INSERT INTO public.people(organization_id,email) VALUES(org,'csv-one@example.test'),(org,'csv-two@example.test'); RAISE EXCEPTION 'Expected atomic import cap'; EXCEPTION WHEN raise_exception THEN ASSERT SQLERRM LIKE 'Employee capacity reached%'; END;
 ASSERT NOT EXISTS(SELECT 1 FROM public.people WHERE organization_id=org AND email LIKE 'csv-%');
 INSERT INTO public.people(organization_id,email) VALUES(org,'replacement@example.test');
 BEGIN UPDATE public.people SET archived_at=NULL WHERE organization_id=org AND email='free-10@example.test'; RAISE EXCEPTION 'Expected restore cap'; EXCEPTION WHEN raise_exception THEN ASSERT SQLERRM LIKE 'Employee capacity reached%'; END;
 UPDATE public.people SET job_title='Still editable' WHERE organization_id=org;
 ASSERT (SELECT count(*)=10 FROM public.people WHERE organization_id=org AND archived_at IS NULL AND NOT reviewer_only);
 ASSERT (SELECT count(*)=11 FROM public.people WHERE organization_id=org);
 -- Ordinary membership and external participants do not use admin seats.
 INSERT INTO public.organization_members(organization_id,user_id,role) VALUES(org,'b0000000-0000-0000-0000-000000000002','member');
 BEGIN UPDATE public.organization_members SET role='admin' WHERE organization_id=org AND user_id='b0000000-0000-0000-0000-000000000002'; RAISE EXCEPTION 'Expected member promotion cap'; EXCEPTION WHEN raise_exception THEN ASSERT SQLERRM LIKE 'Admin capacity reached%'; END;
 BEGIN PERFORM public.create_organization_invitation(org,'second-admin@example.test'); RAISE EXCEPTION 'Expected invite cap'; EXCEPTION WHEN raise_exception THEN ASSERT SQLERRM LIKE 'Admin capacity reached%'; END;
END $$;
INSERT INTO public.people(organization_id,email,reviewer_only) SELECT :'free_org','free-external-'||i||'@example.test',true FROM generate_series(1,6) i;
INSERT INTO public.templates(organization_id,name) VALUES(:'free_org','Free annual template') RETURNING id AS free_template \gset
INSERT INTO public.template_questions(organization_id,template_id,type,prompt,required,scale) VALUES(:'free_org',:'free_template','text','What went well?',false,'{}');
DO $$ DECLARE org uuid; subject uuid; template uuid; BEGIN
 SELECT id INTO org FROM public.organizations WHERE name='Free test';
 SELECT id INTO subject FROM public.people WHERE organization_id=org AND email='free-1@example.test';
 SELECT id INTO template FROM public.templates WHERE organization_id=org AND name='Free annual template';
 BEGIN PERFORM public.create_feedback_360('Free 360',subject,(SELECT jsonb_agg(jsonb_build_object('person_id',id,'relationship','peer')) FROM public.people WHERE organization_id=org AND reviewer_only),template); RAISE EXCEPTION 'Expected 360 RPC cap'; EXCEPTION WHEN raise_exception THEN ASSERT SQLERRM LIKE 'Anonymous 360 appraisals are available on Pro%'; END;
 BEGIN INSERT INTO public.campaigns(organization_id,name,campaign_type) VALUES(org,'Direct 360','feedback_360'); RAISE EXCEPTION 'Expected direct 360 cap'; EXCEPTION WHEN raise_exception THEN ASSERT SQLERRM LIKE 'Anonymous 360 appraisals are available on Pro%'; END;
END $$;
-- Real annual workflow: activate, anonymous token save/submit, close, retain results, run next.
INSERT INTO public.campaigns(organization_id,name,campaign_type,template_id) VALUES(:'free_org','Free annual','annual_appraisal',:'free_template') RETURNING id AS free_campaign \gset
SELECT public.save_appraisal_participants(:'free_campaign',jsonb_build_array(jsonb_build_object('person_id',(SELECT id FROM public.people WHERE email='free-1@example.test'),'manager_person_id',(SELECT id FROM public.people WHERE email='free-2@example.test'))));
SELECT public.activate_campaign(:'free_campaign');
DO $$ DECLARE org uuid; BEGIN
 SELECT id INTO org FROM public.organizations WHERE name='Free test';
 BEGIN INSERT INTO public.campaigns(organization_id,name,campaign_type,status) VALUES(org,'Second operational campaign','annual_appraisal','scheduled'); RAISE EXCEPTION 'Expected campaign cap'; EXCEPTION WHEN raise_exception THEN ASSERT SQLERRM LIKE 'Active campaign capacity reached%'; END;
 ASSERT public.claim_first_activation_measurement(org);
 ASSERT NOT public.claim_first_activation_measurement(org);
END $$;
RESET ROLE;
SELECT payload->>'raw_token' AS free_token FROM public.email_outbox WHERE payload->>'campaign_id'=:'free_campaign' LIMIT 1 \gset
SELECT id AS free_question FROM public.campaign_questions WHERE campaign_id=:'free_campaign' LIMIT 1 \gset
SET ROLE anon;
SELECT public.respond_submit(:'free_token',jsonb_build_array(jsonb_build_object('campaign_question_id',:'free_question','text_value','Free retained answer')));
RESET ROLE;
SET ROLE authenticated;
SELECT public.close_campaign(:'free_campaign');
INSERT INTO public.campaigns(organization_id,name,campaign_type,template_id) VALUES(:'free_org','Free next cycle','annual_appraisal',:'free_template') RETURNING id AS next_campaign \gset
SELECT public.save_appraisal_participants(:'next_campaign',jsonb_build_array(jsonb_build_object('person_id',(SELECT id FROM public.people WHERE email='free-1@example.test'),'manager_person_id',(SELECT id FROM public.people WHERE email='free-2@example.test'))));
SELECT public.schedule_appraisal_campaign(:'next_campaign',current_date+2);
DO $$ DECLARE org uuid; BEGIN
 SELECT id INTO org FROM public.organizations WHERE name='Free test';
 ASSERT EXISTS(SELECT 1 FROM public.response_answers WHERE organization_id=org AND text_value='Free retained answer');
 ASSERT EXISTS(SELECT 1 FROM public.campaigns WHERE organization_id=org AND name='Free annual' AND status='closed');
 BEGIN INSERT INTO public.campaigns(organization_id,name,campaign_type,status) VALUES(org,'Third campaign','annual_appraisal','scheduled'); RAISE EXCEPTION 'Expected scheduled cap'; EXCEPTION WHEN raise_exception THEN ASSERT SQLERRM LIKE 'Active campaign capacity reached%'; END;
END $$;
RESET ROLE;
SET request.jwt.claims='{"role":"service_role"}';
SET ROLE service_role;
SELECT public.activate_workspace_plan(:'free_org','pro');
SELECT public.activate_workspace_plan(:'free_org','organisation');
DO $$ DECLARE org uuid; BEGIN
 SELECT id INTO org FROM public.organizations WHERE name='Free test';
 ASSERT public.workspace_delivery_allowed(org);
 ASSERT public.expire_trial_campaigns()=0;
END $$;
RESET ROLE;
DO $$ DECLARE org uuid; BEGIN
 SELECT id INTO org FROM public.organizations WHERE name='Free test';
 ASSERT (SELECT plan='organisation' AND NOT needs_review FROM private.workspace_entitlements WHERE organization_id=org);
 INSERT INTO public.people(organization_id,email) SELECT org,'paid-'||i||'@example.test' FROM generate_series(1,65) i;
 ASSERT (SELECT count(*)=75 FROM public.people WHERE organization_id=org AND NOT reviewer_only AND archived_at IS NULL);
END $$;
SET ROLE service_role;
SELECT public.activate_workspace_plan(:'free_org','pro');
RESET ROLE;
SET request.jwt.claims='{}';
SET ROLE authenticated;
SELECT public.create_feedback_360('Paid 360',(SELECT id FROM public.people WHERE email='free-1@example.test'),(SELECT jsonb_agg(jsonb_build_object('person_id',id,'relationship','peer')) FROM public.people WHERE organization_id=:'free_org' AND reviewer_only),:'free_template') AS paid_campaign \gset
SELECT public.activate_campaign(:'paid_campaign');
RESET ROLE;
SET request.jwt.claim.sub='10000000-0000-0000-0000-000000000001';
