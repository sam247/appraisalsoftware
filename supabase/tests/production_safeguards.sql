-- Runs only inside scripts/check-production-safeguards.mjs's disposable database.
INSERT INTO auth.users(id,email) VALUES ('10000000-0000-0000-0000-000000000001','owner@example.test'), ('10000000-0000-0000-0000-000000000002','outsider@example.test');
SET request.jwt.claim.sub='10000000-0000-0000-0000-000000000001';
SET ROLE authenticated;
SELECT (public.bootstrap_organization('Test studio','test-studio')).id AS org_id \gset
RESET ROLE;
INSERT INTO public.organizations(id,name,slug) VALUES ('20000000-0000-0000-0000-000000000002','Other studio','other-studio');
INSERT INTO public.people(id,organization_id,email) VALUES ('30000000-0000-0000-0000-000000000001', :'org_id','employee@example.test'), ('30000000-0000-0000-0000-000000000002', :'org_id','manager@example.test'), ('30000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000002','foreign@example.test');
INSERT INTO public.templates(id,organization_id,name) VALUES ('50000000-0000-0000-0000-000000000001', :'org_id','Annual'), ('50000000-0000-0000-0000-000000000002', :'org_id','Empty');
INSERT INTO public.template_questions(id,template_id,organization_id,type,prompt,required) VALUES ('60000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001', :'org_id','text','Your progress?',true);
SET ROLE authenticated;
INSERT INTO public.campaigns(id,organization_id,name,template_id) VALUES ('40000000-0000-0000-0000-000000000001', :'org_id','Atomic','50000000-0000-0000-0000-000000000001'), ('40000000-0000-0000-0000-000000000002', :'org_id','Empty','50000000-0000-0000-0000-000000000002'), ('40000000-0000-0000-0000-000000000003', :'org_id','Race','50000000-0000-0000-0000-000000000001');
SET ROLE authenticated;
SELECT public.save_appraisal_participants('40000000-0000-0000-0000-000000000001','[{"person_id":"30000000-0000-0000-0000-000000000001","manager_person_id":"30000000-0000-0000-0000-000000000002"}]');
SELECT public.save_appraisal_participants('40000000-0000-0000-0000-000000000002','[{"person_id":"30000000-0000-0000-0000-000000000001"}]');
SELECT public.save_appraisal_participants('40000000-0000-0000-0000-000000000003','[{"person_id":"30000000-0000-0000-0000-000000000001","manager_person_id":"30000000-0000-0000-0000-000000000002"}]');
DO $$ BEGIN
  BEGIN PERFORM public.save_appraisal_participants('40000000-0000-0000-0000-000000000001','[{"person_id":"30000000-0000-0000-0000-000000000003"}]'); RAISE EXCEPTION 'expected foreign-person rejection'; EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'Employee unavailable' THEN RAISE; END IF; END;
  BEGIN PERFORM public.save_appraisal_participants('40000000-0000-0000-0000-000000000001','[{"person_id":"30000000-0000-0000-0000-000000000001"},{"person_id":"30000000-0000-0000-0000-000000000001"}]'); RAISE EXCEPTION 'expected duplicate rejection'; EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'Choose each employee once' THEN RAISE; END IF; END;
  BEGIN PERFORM public.schedule_appraisal_campaign('40000000-0000-0000-0000-000000000001','2000-01-01'); RAISE EXCEPTION 'expected past-date rejection'; EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'Send time must be in the future' THEN RAISE; END IF; END;
  BEGIN PERFORM public.schedule_appraisal_campaign('40000000-0000-0000-0000-000000000002','2999-07-01'); RAISE EXCEPTION 'expected empty-template rejection'; EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'Choose a template containing questions' THEN RAISE; END IF; END;
  ASSERT (SELECT questions_frozen_at IS NULL AND status='draft' FROM public.campaigns WHERE id='40000000-0000-0000-0000-000000000002'), 'Failed scheduling left a frozen campaign';
  ASSERT (SELECT count(*)=2 FROM public.campaign_assignments WHERE campaign_id='40000000-0000-0000-0000-000000000001');
  ASSERT NOT has_table_privilege('authenticated','public.campaign_assignments','UPDATE');
  ASSERT NOT has_column_privilege('authenticated','public.campaigns','status','UPDATE');
  ASSERT NOT has_table_privilege('authenticated','public.email_outbox','SELECT');
  ASSERT NOT has_function_privilege('anon','public.save_appraisal_participants(uuid,jsonb)','EXECUTE');
  ASSERT NOT has_function_privilege('authenticated','public.claim_and_activate_due_campaigns(integer)','EXECUTE');
  ASSERT (SELECT opens_at = timestamptz '2026-03-28 09:00+00' FROM public.campaign_date_instants('2026-03-28','Europe/London'));
  ASSERT (SELECT opens_at = timestamptz '2026-03-29 08:00+00' FROM public.campaign_date_instants('2026-03-29','Europe/London'));
  ASSERT (SELECT opens_at = timestamptz '2026-10-24 08:00+00' FROM public.campaign_date_instants('2026-10-24','Europe/London'));
  ASSERT (SELECT opens_at = timestamptz '2026-10-25 09:00+00' FROM public.campaign_date_instants('2026-10-25','Europe/London'));
  ASSERT (SELECT closes_at = timestamptz '2026-07-01 22:59:59.999+00' FROM public.campaign_date_instants('2026-07-01','Europe/London'));
END $$;
RESET ROLE;
-- Force an insertion failure AFTER replacement has deleted the original rows.
CREATE FUNCTION private.fail_test_manager() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.relationship='manager' THEN RAISE EXCEPTION 'forced insertion failure'; END IF; RETURN NEW; END $$;
CREATE TRIGGER fail_test_manager BEFORE INSERT ON public.campaign_assignments FOR EACH ROW EXECUTE FUNCTION private.fail_test_manager();
SET ROLE authenticated;
DO $$ DECLARE old_ids uuid[]; BEGIN
  SELECT array_agg(id ORDER BY id) INTO old_ids FROM public.campaign_assignments WHERE campaign_id='40000000-0000-0000-0000-000000000001';
  BEGIN PERFORM public.save_appraisal_participants('40000000-0000-0000-0000-000000000001','[{"person_id":"30000000-0000-0000-0000-000000000001","manager_person_id":"30000000-0000-0000-0000-000000000002"}]'); RAISE EXCEPTION 'expected forced failure'; EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'forced insertion failure' THEN RAISE; END IF; END;
  ASSERT old_ids = (SELECT array_agg(id ORDER BY id) FROM public.campaign_assignments WHERE campaign_id='40000000-0000-0000-0000-000000000001'), 'Replacement did not roll back original rows';
  ASSERT (SELECT count(*)=1 FROM public.campaign_subjects WHERE campaign_id='40000000-0000-0000-0000-000000000001');
END $$;
RESET ROLE;
DROP TRIGGER fail_test_manager ON public.campaign_assignments;
SET request.jwt.claim.sub='10000000-0000-0000-0000-000000000002';
SET ROLE authenticated;
DO $$ BEGIN
  ASSERT (SELECT count(*)=0 FROM public.campaigns), 'RLS leaked another organisation';
  BEGIN PERFORM public.save_appraisal_participants('40000000-0000-0000-0000-000000000001','[]'); RAISE EXCEPTION 'expected tenant rejection'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SET request.jwt.claim.sub='10000000-0000-0000-0000-000000000001';
SET ROLE authenticated;
SELECT public.schedule_appraisal_campaign('40000000-0000-0000-0000-000000000001','2999-07-01');
DO $$ BEGIN
  ASSERT (SELECT opens_at = timestamptz '2999-07-01 08:00+00' AND status='scheduled' FROM public.campaigns WHERE id='40000000-0000-0000-0000-000000000001');
  BEGIN PERFORM public.save_appraisal_participants('40000000-0000-0000-0000-000000000001','[]'); RAISE EXCEPTION 'expected scheduled-edit rejection'; EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'Only an editable annual appraisal draft can change participants' THEN RAISE; END IF; END;
END $$;
SELECT public.activate_campaign('40000000-0000-0000-0000-000000000001');
RESET ROLE;
-- Tokens cannot attach answers to a different campaign or bypass required fields.
DO $$ DECLARE token text; foreign_question uuid; choice_question uuid; BEGIN
  SELECT payload->>'raw_token' INTO token FROM public.email_outbox WHERE payload->>'campaign_id'='40000000-0000-0000-0000-000000000001' LIMIT 1;
  INSERT INTO public.campaign_questions(campaign_id,organization_id,type,prompt) SELECT '40000000-0000-0000-0000-000000000002',organization_id,'text','Other campaign question' FROM public.campaigns WHERE id='40000000-0000-0000-0000-000000000002' RETURNING id INTO foreign_question;
  BEGIN PERFORM public.respond_save(token,jsonb_build_array(jsonb_build_object('campaign_question_id',foreign_question,'text_value','Wrong campaign'))); RAISE EXCEPTION 'expected question rejection'; EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'Question unavailable in this appraisal' THEN RAISE; END IF; END;
  BEGIN PERFORM public.respond_submit(token,'[]'); RAISE EXCEPTION 'expected required-field rejection'; EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'Please answer every required question' THEN RAISE; END IF; END;
  ASSERT (SELECT count(*)=0 FROM public.response_answers);
  INSERT INTO public.campaign_questions(campaign_id,organization_id,type,prompt,options,required) SELECT '40000000-0000-0000-0000-000000000001',organization_id,'single_choice','Choice', '["Yes","No"]',false FROM public.campaigns WHERE id='40000000-0000-0000-0000-000000000001' RETURNING id INTO choice_question;
  PERFORM public.respond_save(token,jsonb_build_array(jsonb_build_object('campaign_question_id',choice_question,'choice_values',jsonb_build_array('Yes'))));
  BEGIN PERFORM public.respond_save(token,jsonb_build_array(jsonb_build_object('campaign_question_id',choice_question,'choice_values',jsonb_build_array('Unavailable')))); RAISE EXCEPTION 'expected invalid-option rejection'; EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'Choose an available option' THEN RAISE; END IF; END;
  ASSERT (SELECT choice_values='["Yes"]'::jsonb FROM public.response_answers WHERE campaign_question_id=choice_question);
  ASSERT (SELECT choice_values='["Yes"]'::jsonb FROM public.respond_get_saved_answers(token));
  ASSERT NOT EXISTS (SELECT 1 FROM public.respond_get_saved_answers((SELECT payload->>'raw_token' FROM public.email_outbox WHERE payload->>'campaign_id'='40000000-0000-0000-0000-000000000001' AND payload->>'raw_token' <> token LIMIT 1)));
  BEGIN PERFORM public.respond_get_saved_answers('unknown-token'); RAISE EXCEPTION 'expected token rejection'; EXCEPTION WHEN no_data_found THEN NULL; END;

  DELETE FROM public.campaign_questions WHERE id=choice_question;
END $$;
-- No external email is delivered. Test the existing real token and RPC engine.
DO $$ DECLARE entry record; token text; BEGIN
  FOR entry IN SELECT payload FROM public.email_outbox WHERE payload->>'campaign_id'='40000000-0000-0000-0000-000000000001' LOOP
    ASSERT entry.payload->>'timezone'='Europe/London';
    token := entry.payload->>'raw_token';
    PERFORM public.respond_resolve(token);
    PERFORM public.respond_submit(token, ('[{"campaign_question_id":"' || (SELECT id::text FROM public.campaign_questions WHERE campaign_id='40000000-0000-0000-0000-000000000001') || '","text_value":"Useful reflection"}]')::jsonb);
  END LOOP;
  ASSERT (SELECT count(*)=2 FROM public.responses WHERE campaign_id='40000000-0000-0000-0000-000000000001' AND status='submitted');
  ASSERT (SELECT count(*)=2 FROM public.response_answers);
END $$;
SET ROLE authenticated;
SELECT public.close_campaign('40000000-0000-0000-0000-000000000001');
RESET ROLE;
DO $$ BEGIN
  ASSERT (SELECT count(*)=0 FROM public.access_tokens WHERE revoked_at IS NULL AND assignment_id IN (SELECT id FROM public.campaign_assignments WHERE campaign_id='40000000-0000-0000-0000-000000000001'));
END $$;

-- Service cron uses absolute instants; no browser/server timezone is involved.
INSERT INTO public.campaigns(id,organization_id,name,template_id) VALUES ('40000000-0000-0000-0000-000000000004', :'org_id','Cron','50000000-0000-0000-0000-000000000001');
SET ROLE authenticated;
SELECT public.save_appraisal_participants('40000000-0000-0000-0000-000000000004','[{"person_id":"30000000-0000-0000-0000-000000000001"}]');
SELECT public.schedule_appraisal_campaign('40000000-0000-0000-0000-000000000004','2999-07-01');
RESET ROLE;
UPDATE public.campaigns SET opens_at=now()-interval '1 minute' WHERE id='40000000-0000-0000-0000-000000000004';
SET request.jwt.claims='{"role":"service_role"}';
SET ROLE service_role;
DO $$ DECLARE row record; BEGIN
  ASSERT public.claim_and_activate_due_campaigns(20)=1;
  FOR row IN SELECT * FROM public.claim_email_outbox_batch(50) LOOP
    PERFORM public.mark_email_outbox_result(row.id,true,'fixture-provider',NULL,NULL);
    PERFORM public.mark_email_outbox_result(row.id,true,'duplicate-provider',NULL,NULL);
  END LOOP;
  ASSERT (SELECT count(*)=2 FROM public.campaign_assignments WHERE campaign_id='40000000-0000-0000-0000-000000000001' AND status='submitted'), 'Email acknowledgement changed submitted responses';
END $$;
RESET ROLE;
UPDATE public.campaigns SET closes_at=now()-interval '1 minute' WHERE id='40000000-0000-0000-0000-000000000004';
SET ROLE service_role;
DO $$ BEGIN
  ASSERT public.close_due_campaigns(50)=1;
  ASSERT (SELECT status='revoked' FROM public.campaign_assignments WHERE campaign_id='40000000-0000-0000-0000-000000000004');
  ASSERT NOT EXISTS (SELECT 1 FROM public.access_tokens WHERE revoked_at IS NULL AND assignment_id IN (SELECT id FROM public.campaign_assignments WHERE campaign_id='40000000-0000-0000-0000-000000000004'));
END $$;
RESET ROLE;
SET request.jwt.claims='{}';
