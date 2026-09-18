-- Disposable cluster only. Operator-created fixtures do not enable public 360.
SET request.jwt.claim.sub='';
RESET ROLE;
SELECT organization_id AS org_id FROM public.people WHERE id='30000000-0000-0000-0000-000000000001' \gset
INSERT INTO public.campaigns(id,organization_id,name,campaign_type,questions_frozen_at) VALUES ('70000000-0000-0000-0000-000000000001', :'org_id','Private 360 fixture','feedback_360',now());
INSERT INTO public.campaign_questions(id,campaign_id,organization_id,prompt,type,required,sort_order) VALUES
 ('71000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001', :'org_id','Clarity','rating',true,0),
 ('71000000-0000-0000-0000-000000000002','70000000-0000-0000-0000-000000000001', :'org_id','Helpful feedback','text',true,1),
 ('71000000-0000-0000-0000-000000000003','70000000-0000-0000-0000-000000000001', :'org_id','Optional feedback','text',false,2);
INSERT INTO private.feedback_360_contracts(campaign_id,organization_id,subject_person_id) VALUES ('70000000-0000-0000-0000-000000000001', :'org_id','30000000-0000-0000-0000-000000000001');
DO $$ DECLARE org uuid; person uuid; assignment uuid; response uuid; i integer; BEGIN
 SELECT organization_id INTO org FROM public.campaigns WHERE id='70000000-0000-0000-0000-000000000001';
 FOR i IN 1..5 LOOP
  INSERT INTO public.people(organization_id,email) VALUES (org,'reviewer'||i||'@example.test') RETURNING id INTO person;
  INSERT INTO public.campaign_assignments(campaign_id,organization_id,respondent_person_id,subject_person_id,relationship,status) VALUES ('70000000-0000-0000-0000-000000000001',org,person,'30000000-0000-0000-0000-000000000001',CASE WHEN i=1 THEN 'manager' ELSE 'peer' END,'submitted') RETURNING id INTO assignment;
  INSERT INTO private.feedback_360_responses(campaign_id,organization_id) VALUES ('70000000-0000-0000-0000-000000000001',org) RETURNING id INTO response;
  INSERT INTO private.feedback_360_identity(assignment_id,response_id,campaign_id,organization_id) VALUES (assignment,response,'70000000-0000-0000-0000-000000000001',org);
  BEGIN UPDATE private.feedback_360_responses SET submitted=true WHERE id=response; RAISE EXCEPTION 'expected required rejection'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Please answer every required question' THEN RAISE; END IF; END;
  BEGIN INSERT INTO private.feedback_360_answers(response_id,campaign_id,organization_id,question_id,numeric_value) VALUES (response,'70000000-0000-0000-0000-000000000001',org,'71000000-0000-0000-0000-000000000001',99); RAISE EXCEPTION 'expected scale rejection'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Choose a valid rating' THEN RAISE; END IF; END;
  BEGIN INSERT INTO private.feedback_360_answers(response_id,campaign_id,organization_id,question_id,text_value) SELECT response,'70000000-0000-0000-0000-000000000001',org,id,'Foreign answer' FROM public.campaign_questions WHERE campaign_id='40000000-0000-0000-0000-000000000001' LIMIT 1; RAISE EXCEPTION 'expected campaign-question rejection'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Question unavailable in this feedback campaign' THEN RAISE; END IF; END;
  INSERT INTO private.feedback_360_answers(response_id,campaign_id,organization_id,question_id,numeric_value) VALUES (response,'70000000-0000-0000-0000-000000000001',org,'71000000-0000-0000-0000-000000000001',i);
  INSERT INTO private.feedback_360_answers(response_id,campaign_id,organization_id,question_id,text_value) VALUES (response,'70000000-0000-0000-0000-000000000001',org,'71000000-0000-0000-0000-000000000002','Helpful comment '||(6-i));
  IF i=1 THEN INSERT INTO private.feedback_360_answers(response_id,campaign_id,organization_id,question_id,text_value) VALUES (response,'70000000-0000-0000-0000-000000000001',org,'71000000-0000-0000-0000-000000000003','One-person optional comment'); END IF;
  IF i<5 THEN
   UPDATE private.feedback_360_responses SET submitted=true WHERE id=response;
   BEGIN
    UPDATE public.campaigns SET status='closed' WHERE id='70000000-0000-0000-0000-000000000001';
    PERFORM set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
    ASSERT public.feedback_360_report('70000000-0000-0000-0000-000000000001')->>'state'='insufficient_responses';
    RAISE EXCEPTION 'fixture snapshot rollback';
   EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'fixture snapshot rollback' THEN RAISE; END IF;
   END;
  END IF;
 END LOOP;
 BEGIN
  SELECT respondent_person_id INTO person FROM public.campaign_assignments WHERE campaign_id='70000000-0000-0000-0000-000000000001' LIMIT 1;
  INSERT INTO public.campaign_assignments(campaign_id,organization_id,respondent_person_id,subject_person_id,relationship) VALUES ('70000000-0000-0000-0000-000000000001',org,person,'30000000-0000-0000-0000-000000000001','other') RETURNING id INTO assignment;
  INSERT INTO private.feedback_360_responses(campaign_id,organization_id) VALUES ('70000000-0000-0000-0000-000000000001',org) RETURNING id INTO response;
  INSERT INTO private.feedback_360_identity(assignment_id,response_id,campaign_id,organization_id) VALUES (assignment,response,'70000000-0000-0000-0000-000000000001',org);
  RAISE EXCEPTION 'expected duplicate reviewer rejection';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Choose each reviewer once' THEN RAISE; END IF;
 END;
 BEGIN UPDATE private.feedback_360_contracts SET minimum_responses=1; RAISE EXCEPTION 'expected immutable privacy'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'360 privacy contracts are immutable' THEN RAISE; END IF; END;
 BEGIN UPDATE private.feedback_360_answers SET numeric_value=1 WHERE response_id IN (SELECT id FROM private.feedback_360_responses WHERE submitted) AND question_id='71000000-0000-0000-0000-000000000001'; RAISE EXCEPTION 'expected immutable answer'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Submitted feedback cannot be changed' THEN RAISE; END IF; END;
 BEGIN INSERT INTO public.responses(assignment_id,campaign_id,organization_id) SELECT assignment_id,campaign_id,organization_id FROM private.feedback_360_identity LIMIT 1; RAISE EXCEPTION 'expected legacy response rejection'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'360 cannot use the identified response pipeline' THEN RAISE; END IF; END;
 ASSERT (SELECT count(*)=0 FROM public.responses WHERE campaign_id='70000000-0000-0000-0000-000000000001');
END $$;
UPDATE public.campaign_assignments SET status='pending' WHERE id=(SELECT assignment_id FROM private.feedback_360_identity LIMIT 1);
-- Simulate accidental private schema exposure: table grants still deny access.
GRANT USAGE ON SCHEMA private TO authenticated, anon;
SET request.jwt.claim.sub='10000000-0000-0000-0000-000000000001';
SET ROLE authenticated;
DO $$ DECLARE t text; report jsonb; BEGIN
 FOREACH t IN ARRAY ARRAY['feedback_360_contracts','feedback_360_responses','feedback_360_identity','feedback_360_answers'] LOOP
  ASSERT NOT has_table_privilege('authenticated','private.'||t,'SELECT');
  ASSERT NOT has_table_privilege('anon','private.'||t,'SELECT');
  BEGIN EXECUTE 'SELECT * FROM private.'||t; RAISE EXCEPTION 'expected private access denial'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 END LOOP;
 report := public.feedback_360_report('70000000-0000-0000-0000-000000000001'); ASSERT report='{"state":"not_closed"}'::jsonb;
 BEGIN INSERT INTO public.campaigns(organization_id,name,campaign_type) SELECT organization_id,'Bypass','feedback_360' FROM public.campaigns LIMIT 1; RAISE EXCEPTION 'expected creation denial'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN UPDATE public.campaigns SET settings='{"anonymity":{"mode":"anonymous"}}' WHERE id='40000000-0000-0000-0000-000000000002'; RAISE EXCEPTION 'expected anonymous settings denial'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'360 cannot use the identified response pipeline' THEN RAISE; END IF; END;
 BEGIN PERFORM public.activate_campaign('70000000-0000-0000-0000-000000000001'); RAISE EXCEPTION 'expected activation denial'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'360 feedback is not enabled' THEN RAISE; END IF; END;
 -- Anonymous plane does not hide identified annual results.
 ASSERT (SELECT count(*)=2 FROM public.responses WHERE campaign_id='40000000-0000-0000-0000-000000000001');
 ASSERT (SELECT count(*)=2 FROM public.response_answers a JOIN public.responses r ON r.id=a.response_id WHERE r.campaign_id='40000000-0000-0000-0000-000000000001');
 PERFORM public.close_campaign('70000000-0000-0000-0000-000000000001');
 ASSERT public.feedback_360_report('70000000-0000-0000-0000-000000000001')='{"state":"insufficient_responses","minimum_responses":5}'::jsonb;
END $$;
RESET ROLE;
DO $$ BEGIN
 ASSERT NOT EXISTS (SELECT 1 FROM public.email_outbox WHERE payload->>'campaign_id'='70000000-0000-0000-0000-000000000001');
 ASSERT NOT EXISTS (SELECT 1 FROM public.access_tokens WHERE assignment_id IN (SELECT assignment_id FROM private.feedback_360_identity));
END $$;
UPDATE private.feedback_360_responses SET submitted=true WHERE NOT submitted;
SET ROLE authenticated;
DO $$ DECLARE report jsonb; BEGIN
 report := public.feedback_360_report('70000000-0000-0000-0000-000000000001');
 ASSERT report->>'state'='available'; ASSERT report->>'completed'='5';
 ASSERT jsonb_array_length(report->'questions')=2, 'Optional question with one answer must be suppressed';
 ASSERT report->'questions'->0->>'average'='3.00';
 ASSERT report->'questions'->1->'comments'='["Helpful comment 1","Helpful comment 2","Helpful comment 3","Helpful comment 4","Helpful comment 5"]'::jsonb;
 ASSERT report::text !~ '(assignment_id|respondent_person_id|response_id|submitted_at|reviewer[1-5]|relationship|One-person)', 'Report leaked identity, chronology or suppressed comments';
END $$;
RESET ROLE;
-- Subject with a normal member account has no privileged feedback access.
UPDATE public.people SET user_id='10000000-0000-0000-0000-000000000002' WHERE id='30000000-0000-0000-0000-000000000001';
INSERT INTO public.organization_members(organization_id,user_id,role) VALUES (:'org_id','10000000-0000-0000-0000-000000000002','member');
SET request.jwt.claim.sub='10000000-0000-0000-0000-000000000002';
SET ROLE authenticated;
DO $$ BEGIN
 BEGIN PERFORM public.feedback_360_report('70000000-0000-0000-0000-000000000001'); RAISE EXCEPTION 'expected member denial'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 ASSERT (SELECT count(*)=0 FROM public.responses WHERE campaign_id='70000000-0000-0000-0000-000000000001');
 BEGIN SELECT * FROM private.feedback_360_identity; RAISE EXCEPTION 'expected identity denial'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
UPDATE public.people SET user_id=NULL WHERE user_id='10000000-0000-0000-0000-000000000002';
-- The same ordinary account linked to the manager-reviewer remains denied.
UPDATE public.people SET user_id='10000000-0000-0000-0000-000000000002' WHERE email='reviewer1@example.test';
SET ROLE authenticated;
DO $$ BEGIN
 BEGIN PERFORM public.feedback_360_report('70000000-0000-0000-0000-000000000001'); RAISE EXCEPTION 'expected manager denial'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN SELECT * FROM private.feedback_360_identity; RAISE EXCEPTION 'expected manager identity denial'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
UPDATE public.people SET user_id=NULL WHERE user_id='10000000-0000-0000-0000-000000000002';
UPDATE public.people SET user_id='10000000-0000-0000-0000-000000000002' WHERE email='reviewer2@example.test';
SET ROLE authenticated;
DO $$ BEGIN
 BEGIN SELECT * FROM private.feedback_360_answers; RAISE EXCEPTION 'expected reviewer feedback denial'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM public.feedback_360_report('70000000-0000-0000-0000-000000000001'); RAISE EXCEPTION 'expected reviewer report denial'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
UPDATE public.people SET user_id=NULL WHERE user_id='10000000-0000-0000-0000-000000000002';
DELETE FROM public.organization_members WHERE user_id='10000000-0000-0000-0000-000000000002';
SET ROLE authenticated;
DO $$ BEGIN
 BEGIN PERFORM public.feedback_360_report('70000000-0000-0000-0000-000000000001'); RAISE EXCEPTION 'expected cross-tenant denial'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SET ROLE anon;
DO $$ BEGIN
 BEGIN PERFORM public.feedback_360_report('70000000-0000-0000-0000-000000000001'); RAISE EXCEPTION 'expected anonymous client denial'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN SELECT * FROM private.feedback_360_answers; RAISE EXCEPTION 'expected anonymous data denial'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SET request.jwt.claim.sub='';
-- Simulate accidental table grants too: RLS still denies every ordinary role.
GRANT SELECT ON private.feedback_360_contracts, private.feedback_360_identity, private.feedback_360_responses, private.feedback_360_answers TO authenticated, anon;
SET request.jwt.claim.sub='10000000-0000-0000-0000-000000000001';
SET ROLE authenticated;
DO $$ BEGIN
 ASSERT (SELECT count(*)=0 FROM private.feedback_360_identity);
 ASSERT (SELECT count(*)=0 FROM private.feedback_360_responses);
 ASSERT (SELECT count(*)=0 FROM private.feedback_360_answers);
END $$;
RESET ROLE;
SET ROLE anon;
DO $$ BEGIN ASSERT (SELECT count(*)=0 FROM private.feedback_360_answers); END $$;
RESET ROLE;
REVOKE ALL ON private.feedback_360_contracts, private.feedback_360_identity, private.feedback_360_responses, private.feedback_360_answers FROM authenticated, anon;
REVOKE USAGE ON SCHEMA private FROM authenticated, anon;
-- Tenant deletion clears private mapping and payload rows through campaign cascades.
DELETE FROM public.campaigns WHERE id='70000000-0000-0000-0000-000000000001';
DO $$ BEGIN
 ASSERT NOT EXISTS (SELECT 1 FROM private.feedback_360_contracts);
 ASSERT NOT EXISTS (SELECT 1 FROM private.feedback_360_identity);
 ASSERT NOT EXISTS (SELECT 1 FROM private.feedback_360_responses);
 ASSERT NOT EXISTS (SELECT 1 FROM private.feedback_360_answers);
END $$;
