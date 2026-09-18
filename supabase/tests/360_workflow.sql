-- Complete workflow against real PostgreSQL; release enabled only in disposable DB.
RESET ROLE;
SET request.jwt.claim.sub='';
SELECT organization_id AS org_id FROM public.people WHERE id='30000000-0000-0000-0000-000000000001' \gset
INSERT INTO public.templates(id,organization_id,name) VALUES('80000000-0000-0000-0000-000000000001', :'org_id','360 workflow');
INSERT INTO public.template_questions(template_id,organization_id,type,prompt,required,sort_order) VALUES
 ('80000000-0000-0000-0000-000000000001', :'org_id','rating','Communication',true,0),
 ('80000000-0000-0000-0000-000000000001', :'org_id','text','Helpful suggestions',true,1),
 ('80000000-0000-0000-0000-000000000001', :'org_id','text','Optional comment',false,2);
INSERT INTO public.people(organization_id,email,full_name) SELECT :'org_id','workflow'||i||'@example.test','Reviewer '||i FROM generate_series(1,6) i;
SET request.jwt.claim.sub='10000000-0000-0000-0000-000000000001';
DO $$ BEGIN
 BEGIN PERFORM public.create_feedback_360('Disabled','30000000-0000-0000-0000-000000000001','[]','80000000-0000-0000-0000-000000000001'); RAISE EXCEPTION 'expected release denial'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'360 feedback is not enabled' THEN RAISE; END IF; END;
END $$;
UPDATE private.feedback_360_release SET enabled=true;
SET ROLE authenticated;
DO $$ DECLARE reviewers jsonb; BEGIN
 SELECT jsonb_agg(jsonb_build_object('person_id',id,'relationship','peer')) INTO reviewers FROM public.people WHERE email LIKE 'workflow%@example.test';
 BEGIN PERFORM public.create_feedback_360('Short','30000000-0000-0000-0000-000000000001',jsonb_build_array(reviewers->0),'80000000-0000-0000-0000-000000000001'); RAISE EXCEPTION 'expected threshold denial'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Choose at least five distinct reviewers' THEN RAISE; END IF; END;
 BEGIN PERFORM public.create_feedback_360('Duplicate','30000000-0000-0000-0000-000000000001',jsonb_build_array(reviewers->0,reviewers->0,reviewers->0,reviewers->0,reviewers->0),'80000000-0000-0000-0000-000000000001'); RAISE EXCEPTION 'expected duplicate denial'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Choose each reviewer once' THEN RAISE; END IF; END;
 PERFORM public.create_feedback_360('360 Golden Path','30000000-0000-0000-0000-000000000001',reviewers,'80000000-0000-0000-0000-000000000001','2999-07-02');
END $$;
SELECT id AS campaign_id FROM public.campaigns WHERE name='360 Golden Path' \gset
SELECT public.schedule_feedback_360(:'campaign_id','2999-07-01');
SELECT public.activate_campaign(:'campaign_id');
RESET ROLE;
DO $$ DECLARE c uuid; entry record; token text; second text; question uuid; rating uuid; view jsonb; i integer:=0; BEGIN
 SELECT id INTO c FROM public.campaigns WHERE name='360 Golden Path';
 ASSERT (SELECT status='active' AND opens_at=timestamptz '2999-07-01 08:00+00' FROM public.campaigns WHERE id=c);
 ASSERT (SELECT count(*)=6 FROM public.email_outbox WHERE payload->>'campaign_id'=c::text);
 SELECT id INTO question FROM public.campaign_questions WHERE campaign_id=c AND prompt='Helpful suggestions';
 SELECT id INTO rating FROM public.campaign_questions WHERE campaign_id=c AND type='rating';
 SELECT payload->>'raw_token' INTO token FROM public.email_outbox WHERE payload->>'campaign_id'=c::text LIMIT 1;
 SELECT payload->>'raw_token' INTO second FROM public.email_outbox WHERE payload->>'campaign_id'=c::text AND payload->>'raw_token'<>token LIMIT 1;
 ASSERT public.respond_campaign_kind(token)='feedback_360';
 view:=public.feedback_360_open(token); ASSERT view->>'subject_name' IS NOT NULL;
 ASSERT view::text !~ '(assignment_id|response_id|respondent_person_id|submitted_at|relationship|Reviewer [1-6])';
 PERFORM public.feedback_360_write(token,jsonb_build_array(jsonb_build_object('campaign_question_id',question,'text_value','Saved private draft')),false);
 ASSERT public.feedback_360_open(token)->'answers'->0->>'text_value'='Saved private draft';
 ASSERT public.feedback_360_open(second)->'answers'='[]'::jsonb;
 BEGIN PERFORM public.feedback_360_write(token,'[]',true); RAISE EXCEPTION 'expected required denial'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Please answer every required question' THEN RAISE; END IF; END;
 BEGIN PERFORM public.feedback_360_write(token,jsonb_build_array(jsonb_build_object('campaign_question_id',(SELECT id FROM public.campaign_questions WHERE campaign_id='40000000-0000-0000-0000-000000000001' LIMIT 1),'text_value','Foreign question')),false); RAISE EXCEPTION 'expected question isolation'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Question unavailable in this feedback campaign' THEN RAISE; END IF; END;
 BEGIN PERFORM public.respond_save(token,'[]'); RAISE EXCEPTION 'expected annual pipeline refusal'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'360 cannot use the identified response pipeline' THEN RAISE; END IF; END;
 FOR entry IN SELECT payload FROM public.email_outbox WHERE payload->>'campaign_id'=c::text LIMIT 5 LOOP
  ASSERT entry.payload->>'campaign_type'='feedback_360'; ASSERT entry.payload->>'timezone'='Europe/London';
  i:=i+1; token:=entry.payload->>'raw_token';
  PERFORM public.feedback_360_write(token,jsonb_build_array(jsonb_build_object('campaign_question_id',question,'text_value','Useful feedback '||i),jsonb_build_object('campaign_question_id',rating,'numeric_value',4)),true);
  PERFORM public.feedback_360_write(token,'[]',true); -- idempotent final submission
  ASSERT public.feedback_360_open(token)='{"submitted":true}'::jsonb;
  BEGIN PERFORM public.feedback_360_write(token,'[]',false); RAISE EXCEPTION 'expected final save denial'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Feedback is already submitted' THEN RAISE; END IF; END;
 END LOOP;
 ASSERT (SELECT count(*)=5 FROM private.feedback_360_responses WHERE campaign_id=c AND submitted);
 ASSERT (SELECT count(*)=5 FROM public.campaign_assignments WHERE campaign_id=c AND status='submitted');
 ASSERT (SELECT count(*)=0 FROM public.responses WHERE campaign_id=c);
 ASSERT public.feedback_360_report(c)->>'state'='not_closed';
 -- Queue an automatic reminder only for the sixth outstanding reviewer.
 UPDATE public.campaign_assignments SET status='sent',sent_at=now()-interval '4 days' WHERE campaign_id=c AND status<>'submitted';
END $$;
SET request.jwt.claims='{"role":"service_role"}';
SET ROLE service_role;
SELECT public.enqueue_appraisal_reminders(100);
RESET ROLE;
DO $$ DECLARE c uuid; BEGIN
 SELECT id INTO c FROM public.campaigns WHERE name='360 Golden Path';
 ASSERT (SELECT count(*)=1 FROM public.email_outbox WHERE kind='appraisal_reminder' AND payload->>'campaign_id'=c::text);
 ASSERT (SELECT bool_and(payload->>'campaign_type'='feedback_360' AND subject LIKE 'Reminder: 360 feedback%') FROM public.email_outbox WHERE kind='appraisal_reminder' AND payload->>'campaign_id'=c::text);
END $$;
SET request.jwt.claims='{}';
SET ROLE authenticated;
DO $$ BEGIN
 ASSERT NOT has_table_privilege('authenticated','public.email_outbox','SELECT');
 ASSERT (SELECT count(*)=0 FROM public.responses r JOIN public.campaigns c ON c.id=r.campaign_id WHERE c.name='360 Golden Path');
 PERFORM public.close_campaign((SELECT id FROM public.campaigns WHERE name='360 Golden Path'));
END $$;
RESET ROLE;
DO $$ DECLARE c uuid; token text; report jsonb; BEGIN
 SELECT id INTO c FROM public.campaigns WHERE name='360 Golden Path';
 report:=public.feedback_360_report(c);
 ASSERT report->>'state'='available'; ASSERT report->>'completed'='5'; ASSERT jsonb_array_length(report->'questions')=2;
 ASSERT report::text !~ '(assignment_id|response_id|respondent_person_id|submitted_at|relationship|Reviewer [1-6])';
 SELECT payload->>'raw_token' INTO token FROM public.email_outbox WHERE payload->>'campaign_id'=c::text LIMIT 1;
 BEGIN PERFORM public.feedback_360_write(token,'[]',true); RAISE EXCEPTION 'expected closed denial'; EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT IN ('This feedback request is closed or expired','Invalid personal link') THEN RAISE; END IF; END;
 ASSERT NOT EXISTS(SELECT 1 FROM public.access_tokens t JOIN public.campaign_assignments a ON a.id=t.assignment_id WHERE a.campaign_id=c AND a.status='revoked' AND t.revoked_at IS NULL);
END $$;
UPDATE private.feedback_360_release SET enabled=false;
SET request.jwt.claim.sub='';
SET request.jwt.claims='{}';
