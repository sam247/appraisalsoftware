-- New and legacy 360 assembly against a disposable database.
RESET ROLE;
SET request.jwt.claims='{}';
UPDATE private.feedback_360_release SET enabled=true;
SET request.jwt.claim.sub='10000000-0000-0000-0000-000000000001';
SELECT organization_id AS org_id FROM public.people WHERE id='30000000-0000-0000-0000-000000000001' \gset
SET ROLE authenticated;
SELECT public.create_feedback_360_draft('New private draft', :'org_id') AS draft_id \gset
RESET ROLE;
DO $$ BEGIN
 ASSERT (SELECT status='draft' AND template_id IS NULL AND questions_frozen_at IS NULL AND settings #>> '{anonymity,mode}'='anonymous' FROM public.campaigns WHERE name='New private draft');
 ASSERT NOT EXISTS (SELECT 1 FROM private.feedback_360_contracts WHERE campaign_id=(SELECT id FROM public.campaigns WHERE name='New private draft'));
 ASSERT NOT EXISTS (SELECT 1 FROM public.campaign_assignments WHERE campaign_id=(SELECT id FROM public.campaigns WHERE name='New private draft'));
END $$;
SET ROLE authenticated;
DO $$ DECLARE c uuid; subject uuid:='30000000-0000-0000-0000-000000000001'; reviewers jsonb; BEGIN
 SELECT id INTO c FROM public.campaigns WHERE name='New private draft';
 SELECT jsonb_agg(jsonb_build_object('person_id',id,'relationship','peer')) INTO reviewers FROM public.people WHERE email LIKE 'workflow%@example.test';
 BEGIN PERFORM public.save_feedback_360_cohort(c,subject,jsonb_build_array(jsonb_build_object('person_id',subject,'relationship','peer'))); RAISE EXCEPTION 'expected self rejection'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Choose available reviewers other than the subject' THEN RAISE; END IF; END;
 BEGIN PERFORM public.save_feedback_360_cohort(c,subject,jsonb_build_array(reviewers->0,reviewers->0)); RAISE EXCEPTION 'expected duplicate rejection'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Choose each reviewer once' THEN RAISE; END IF; END;
 BEGIN PERFORM public.save_feedback_360_cohort(c,subject,jsonb_build_array(jsonb_build_object('person_id','30000000-0000-0000-0000-000000000003','relationship','peer'))); RAISE EXCEPTION 'expected foreign rejection'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Choose available reviewers other than the subject' THEN RAISE; END IF; END;
 PERFORM public.save_feedback_360_cohort(c,subject,jsonb_build_array(reviewers->0,reviewers->1));
 ASSERT (SELECT count(*)=2 FROM public.campaign_assignments WHERE campaign_id=c);
 PERFORM public.save_feedback_360_timing(c,'now',NULL,NULL);
 BEGIN PERFORM public.finalize_feedback_360_draft(c,true); RAISE EXCEPTION 'expected cohort threshold'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'At least five available reviewers are required' THEN RAISE; END IF; END;
 PERFORM public.save_feedback_360_cohort(c,subject,reviewers);
 ASSERT (SELECT count(*)=6 FROM public.campaign_assignments WHERE campaign_id=c);
 BEGIN PERFORM public.save_feedback_360_template(c,'50000000-0000-0000-0000-000000000002'); RAISE EXCEPTION 'expected empty template'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Choose a non-empty rating/text template' THEN RAISE; END IF; END;
 PERFORM public.save_feedback_360_template(c,'80000000-0000-0000-0000-000000000001');
 BEGIN PERFORM public.save_feedback_360_timing(c,'later','2000-01-01',NULL); RAISE EXCEPTION 'expected past time'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Send time must be in the future' THEN RAISE; END IF; END;
 PERFORM public.save_feedback_360_timing(c,'now',NULL,NULL);
 BEGIN PERFORM public.finalize_feedback_360_draft(c,false); RAISE EXCEPTION 'expected acknowledgment'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Acknowledge the anonymity policy before sending' THEN RAISE; END IF; END;
 PERFORM public.finalize_feedback_360_draft(c,true);
END $$;
RESET ROLE;
DO $$ DECLARE c uuid; token text; view jsonb; BEGIN
 SELECT id INTO c FROM public.campaigns WHERE name='New private draft';
 ASSERT (SELECT status='active' AND questions_frozen_at IS NOT NULL FROM public.campaigns WHERE id=c);
 ASSERT (SELECT count(*)=6 FROM public.campaign_assignments WHERE campaign_id=c);
 ASSERT (SELECT count(*)=6 FROM public.email_outbox WHERE payload->>'campaign_id'=c::text);
 ASSERT (SELECT count(*)=6 FROM public.access_tokens t JOIN public.campaign_assignments a ON a.id=t.assignment_id WHERE a.campaign_id=c);
 ASSERT (SELECT minimum_responses=5 FROM private.feedback_360_contracts WHERE campaign_id=c);
 SELECT payload->>'raw_token' INTO token FROM public.email_outbox WHERE payload->>'campaign_id'=c::text LIMIT 1;
 view:=public.feedback_360_open(token);
 ASSERT view->>'campaign_name'='New private draft';
 ASSERT view::text !~ '(assignment_id|response_id|respondent_person_id|relationship|Reviewer [1-6])';
END $$;
INSERT INTO public.templates(id,organization_id,name) VALUES('80000000-0000-0000-0000-000000000002', :'org_id','Unsafe 360 questions');
INSERT INTO public.template_questions(template_id,organization_id,type,prompt) VALUES('80000000-0000-0000-0000-000000000002', :'org_id','single_choice','Identify the reviewer');
SET ROLE authenticated;
SELECT public.create_feedback_360_draft('Unsafe template draft', :'org_id');
DO $$ BEGIN
 BEGIN PERFORM public.save_feedback_360_template((SELECT id FROM public.campaigns WHERE name='Unsafe template draft'),'80000000-0000-0000-0000-000000000002'); RAISE EXCEPTION 'expected 360 type rejection';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Choose a non-empty rating/text template' THEN RAISE; END IF; END;
END $$;
RESET ROLE;
SET ROLE authenticated;
SELECT public.create_feedback_360_draft('Scheduled private draft', :'org_id') AS scheduled_id \gset
DO $$ DECLARE reviewers jsonb; BEGIN
 SELECT jsonb_agg(jsonb_build_object('person_id',id,'relationship','peer')) INTO reviewers FROM public.people WHERE email LIKE 'workflow%@example.test';
 PERFORM public.save_feedback_360_cohort((SELECT id FROM public.campaigns WHERE name='Scheduled private draft'),'30000000-0000-0000-0000-000000000001',reviewers);
 PERFORM public.save_feedback_360_template((SELECT id FROM public.campaigns WHERE name='Scheduled private draft'),'80000000-0000-0000-0000-000000000001');
 PERFORM public.save_feedback_360_timing((SELECT id FROM public.campaigns WHERE name='Scheduled private draft'),'later','2999-07-01','2999-07-02');
 PERFORM public.finalize_feedback_360_draft((SELECT id FROM public.campaigns WHERE name='Scheduled private draft'),true);
END $$;
RESET ROLE;
DO $$ BEGIN
 ASSERT (SELECT status='scheduled' AND questions_frozen_at IS NOT NULL FROM public.campaigns WHERE id=(SELECT id FROM public.campaigns WHERE name='Scheduled private draft'));
 ASSERT (SELECT count(*)=0 FROM public.email_outbox WHERE payload->>'campaign_id'=(SELECT id::text FROM public.campaigns WHERE name='Scheduled private draft'));
 ASSERT (SELECT count(*)=0 FROM public.access_tokens t JOIN public.campaign_assignments a ON a.id=t.assignment_id WHERE a.campaign_id=(SELECT id FROM public.campaigns WHERE name='Scheduled private draft'));
END $$;
SET ROLE authenticated;
SELECT public.activate_campaign((SELECT id FROM public.campaigns WHERE name='Scheduled private draft'));
RESET ROLE;
DO $$ DECLARE c uuid; token text; BEGIN
 SELECT id INTO c FROM public.campaigns WHERE name='Scheduled private draft';
 ASSERT (SELECT status='active' FROM public.campaigns WHERE id=c);
 ASSERT (SELECT count(*)=6 FROM public.email_outbox WHERE payload->>'campaign_id'=c::text);
 SELECT payload->>'raw_token' INTO token FROM public.email_outbox WHERE payload->>'campaign_id'=c::text LIMIT 1;
 ASSERT public.feedback_360_open(token)->>'campaign_name'='Scheduled private draft';
END $$;
SET ROLE authenticated;
SELECT public.create_feedback_360_draft('Failed finalisation', :'org_id');
DO $$ DECLARE reviewers jsonb; c uuid; BEGIN
 SELECT id INTO c FROM public.campaigns WHERE name='Failed finalisation';
 SELECT jsonb_agg(jsonb_build_object('person_id',id,'relationship','peer')) INTO reviewers FROM public.people WHERE email LIKE 'workflow%@example.test';
 PERFORM public.save_feedback_360_cohort(c,'30000000-0000-0000-0000-000000000001',reviewers);
 PERFORM public.save_feedback_360_template(c,'80000000-0000-0000-0000-000000000001');
 PERFORM public.save_feedback_360_timing(c,'now',NULL,NULL);
END $$;
RESET ROLE;
CREATE FUNCTION private.fail_360_outbox() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NEW.payload->>'campaign_name'='Failed finalisation' THEN RAISE EXCEPTION 'forced 360 outbox failure'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER fail_360_outbox BEFORE INSERT ON public.email_outbox FOR EACH ROW EXECUTE FUNCTION private.fail_360_outbox();
SET ROLE authenticated;
DO $$ BEGIN
 BEGIN PERFORM public.finalize_feedback_360_draft((SELECT id FROM public.campaigns WHERE name='Failed finalisation'),true); RAISE EXCEPTION 'expected finalisation failure';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'forced 360 outbox failure' THEN RAISE; END IF; END;
END $$;
RESET ROLE;
DROP TRIGGER fail_360_outbox ON public.email_outbox;
DO $$ DECLARE c uuid; BEGIN
 SELECT id INTO c FROM public.campaigns WHERE name='Failed finalisation';
 ASSERT (SELECT status='draft' AND questions_frozen_at IS NULL FROM public.campaigns WHERE id=c);
 ASSERT NOT EXISTS(SELECT 1 FROM private.feedback_360_contracts WHERE campaign_id=c);
 ASSERT NOT EXISTS(SELECT 1 FROM public.campaign_questions WHERE campaign_id=c);
 ASSERT NOT EXISTS(SELECT 1 FROM public.access_tokens t JOIN public.campaign_assignments a ON a.id=t.assignment_id WHERE a.campaign_id=c);
 ASSERT NOT EXISTS(SELECT 1 FROM public.email_outbox WHERE payload->>'campaign_id'=c::text);
END $$;
UPDATE public.people SET archived_at=now() WHERE email='workflow6@example.test';
SET ROLE authenticated;
DO $$ BEGIN
 BEGIN PERFORM public.finalize_feedback_360_draft((SELECT id FROM public.campaigns WHERE name='Failed finalisation'),true); RAISE EXCEPTION 'expected archived reviewer denial';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'At least five available reviewers are required' THEN RAISE; END IF; END;
END $$;
RESET ROLE;
UPDATE public.people SET archived_at=NULL WHERE email='workflow6@example.test';
DO $$ BEGIN
 ASSERT NOT EXISTS(SELECT 1 FROM private.feedback_360_contracts WHERE campaign_id=(SELECT id FROM public.campaigns WHERE name='Failed finalisation'));
END $$;
SET ROLE authenticated;
SELECT public.create_feedback_360('Legacy convertible','30000000-0000-0000-0000-000000000001',
 (SELECT jsonb_agg(jsonb_build_object('person_id',id,'relationship','peer')) FROM public.people WHERE email LIKE 'workflow%@example.test'),
 '80000000-0000-0000-0000-000000000001') AS legacy_id \gset
RESET ROLE;
DO $$ BEGIN
 ASSERT (SELECT questions_frozen_at IS NOT NULL FROM public.campaigns WHERE id=(SELECT id FROM public.campaigns WHERE name='Legacy convertible'));
 ASSERT EXISTS(SELECT 1 FROM private.feedback_360_contracts WHERE campaign_id=(SELECT id FROM public.campaigns WHERE name='Legacy convertible'));
END $$;
SET ROLE authenticated;
SELECT public.save_feedback_360_template((SELECT id FROM public.campaigns WHERE name='Legacy convertible'),'80000000-0000-0000-0000-000000000001');
RESET ROLE;
DO $$ BEGIN
 ASSERT (SELECT questions_frozen_at IS NULL FROM public.campaigns WHERE id=(SELECT id FROM public.campaigns WHERE name='Legacy convertible'));
 ASSERT NOT EXISTS(SELECT 1 FROM private.feedback_360_contracts WHERE campaign_id=(SELECT id FROM public.campaigns WHERE name='Legacy convertible'));
 ASSERT NOT EXISTS(SELECT 1 FROM public.campaign_questions WHERE campaign_id=(SELECT id FROM public.campaigns WHERE name='Legacy convertible'));
 ASSERT (SELECT count(*)=6 FROM public.campaign_assignments WHERE campaign_id=(SELECT id FROM public.campaigns WHERE name='Legacy convertible'));
END $$;
-- Failure after conversion begins must restore the private contract and snapshot.
SET ROLE authenticated;
SELECT public.create_feedback_360('Legacy rollback','30000000-0000-0000-0000-000000000001',
 (SELECT jsonb_agg(jsonb_build_object('person_id',id,'relationship','peer')) FROM public.people WHERE email LIKE 'workflow%@example.test'),
 '80000000-0000-0000-0000-000000000001');
RESET ROLE;
CREATE FUNCTION private.fail_360_replacement() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'forced 360 replacement failure'; END $$;
CREATE TRIGGER fail_360_replacement BEFORE INSERT ON public.campaign_assignments FOR EACH ROW EXECUTE FUNCTION private.fail_360_replacement();
SET ROLE authenticated;
DO $$ DECLARE reviewers jsonb; BEGIN
 SELECT jsonb_agg(jsonb_build_object('person_id',id,'relationship','peer')) INTO reviewers FROM public.people WHERE email LIKE 'workflow%@example.test';
 BEGIN PERFORM public.save_feedback_360_cohort((SELECT id FROM public.campaigns WHERE name='Legacy rollback'),'30000000-0000-0000-0000-000000000001',reviewers); RAISE EXCEPTION 'expected replacement failure';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'forced 360 replacement failure' THEN RAISE; END IF; END;
END $$;
RESET ROLE;
DROP TRIGGER fail_360_replacement ON public.campaign_assignments;
DO $$ BEGIN
 ASSERT (SELECT questions_frozen_at IS NOT NULL FROM public.campaigns WHERE name='Legacy rollback');
 ASSERT EXISTS(SELECT 1 FROM private.feedback_360_contracts WHERE campaign_id=(SELECT id FROM public.campaigns WHERE name='Legacy rollback'));
 ASSERT (SELECT count(*)=3 FROM public.campaign_questions WHERE campaign_id=(SELECT id FROM public.campaigns WHERE name='Legacy rollback'));
 ASSERT (SELECT count(*)=6 FROM public.campaign_assignments WHERE campaign_id=(SELECT id FROM public.campaigns WHERE name='Legacy rollback'));
END $$;
DO $$ DECLARE c uuid; org uuid; response uuid; assignment uuid; BEGIN
 SELECT id,organization_id INTO c,org FROM public.campaigns WHERE name='Legacy rollback';
 SELECT id INTO assignment FROM public.campaign_assignments WHERE campaign_id=c LIMIT 1;
 INSERT INTO private.feedback_360_responses(campaign_id,organization_id) VALUES(c,org) RETURNING id INTO response;
 INSERT INTO private.feedback_360_identity(assignment_id,response_id,campaign_id,organization_id) VALUES(assignment,response,c,org);
END $$;
SET ROLE authenticated;
DO $$ BEGIN
 BEGIN PERFORM public.save_feedback_360_template((SELECT id FROM public.campaigns WHERE name='Legacy rollback'),'80000000-0000-0000-0000-000000000001'); RAISE EXCEPTION 'expected private mapping denial';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'This 360 draft has delivery or private feedback data and cannot be converted' THEN RAISE; END IF; END;
END $$;
RESET ROLE;
DO $$ BEGIN
 ASSERT EXISTS(SELECT 1 FROM private.feedback_360_identity WHERE campaign_id=(SELECT id FROM public.campaigns WHERE name='Legacy rollback'));
 ASSERT EXISTS(SELECT 1 FROM private.feedback_360_contracts WHERE campaign_id=(SELECT id FROM public.campaigns WHERE name='Legacy rollback'));
END $$;
SET ROLE authenticated;
SELECT public.create_feedback_360('Legacy protected','30000000-0000-0000-0000-000000000001',
 (SELECT jsonb_agg(jsonb_build_object('person_id',id,'relationship','peer')) FROM public.people WHERE email LIKE 'workflow%@example.test'),
 '80000000-0000-0000-0000-000000000001') AS protected_id \gset
RESET ROLE;
INSERT INTO public.access_tokens(assignment_id,organization_id,token_hash,expires_at)
 SELECT a.id,a.organization_id,encode(extensions.digest('protected-fixture','sha256'),'hex'),now()+interval '1 day'
 FROM public.campaign_assignments a WHERE a.campaign_id=(SELECT id FROM public.campaigns WHERE name='Legacy protected') LIMIT 1;
SET ROLE authenticated;
DO $$ BEGIN
 BEGIN PERFORM public.save_feedback_360_template((SELECT id FROM public.campaigns WHERE name='Legacy protected'),'80000000-0000-0000-0000-000000000001'); RAISE EXCEPTION 'expected conversion denial'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'This 360 draft has delivery or private feedback data and cannot be converted' THEN RAISE; END IF; END;
END $$;
RESET ROLE;
DO $$ BEGIN
 ASSERT (SELECT questions_frozen_at IS NOT NULL FROM public.campaigns WHERE id=(SELECT id FROM public.campaigns WHERE name='Legacy protected'));
 ASSERT EXISTS(SELECT 1 FROM private.feedback_360_contracts WHERE campaign_id=(SELECT id FROM public.campaigns WHERE name='Legacy protected'));
 ASSERT (SELECT count(*)>0 FROM public.campaign_questions WHERE campaign_id=(SELECT id FROM public.campaigns WHERE name='Legacy protected'));
END $$;
UPDATE private.feedback_360_release SET enabled=true;
SET request.jwt.claim.sub='';
