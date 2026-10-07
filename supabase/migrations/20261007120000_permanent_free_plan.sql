-- Permanent Free replaces acquisition trials. Apply after the historical migration.
-- Preserve paid/manual entitlements exactly. Never infer paid status from editable settings.
BEGIN;
-- Serialize workspace creation with the default change so no late trial can escape review.
LOCK TABLE public.organizations IN SHARE ROW EXCLUSIVE MODE;
ALTER TABLE private.workspace_entitlements ADD COLUMN needs_review boolean NOT NULL DEFAULT false;
ALTER TABLE private.workspace_entitlements DROP CONSTRAINT workspace_entitlements_plan_check;
ALTER TABLE private.workspace_entitlements ADD CONSTRAINT workspace_entitlements_plan_check CHECK(plan IN ('legacy','trial','free','pro','organisation'));
UPDATE private.workspace_entitlements SET plan='legacy', needs_review=true WHERE plan IN ('legacy','trial');
-- Original trial timestamps remain audit data; no runtime expiry uses them.
UPDATE private.trial_release SET enabled=false;

CREATE OR REPLACE FUNCTION private.start_workspace_entitlement() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private,pg_temp AS $$
BEGIN
 INSERT INTO private.workspace_entitlements(organization_id,plan) VALUES(NEW.id,'free');
 RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION private.workspace_can_operate(org uuid) RETURNS boolean
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path=private,pg_temp AS $$
 SELECT EXISTS(SELECT 1 FROM private.workspace_entitlements WHERE organization_id=org);
$$;
CREATE OR REPLACE FUNCTION private.require_workspace_access(org uuid, exclusive_lock boolean DEFAULT false) RETURNS private.workspace_entitlements
LANGUAGE plpgsql SECURITY DEFINER SET search_path=private,pg_temp AS $$
DECLARE e private.workspace_entitlements;
BEGIN
 -- ponytail: serialize capacity writes per workspace; use counters if contention becomes material.
 IF exclusive_lock THEN SELECT * INTO e FROM private.workspace_entitlements WHERE organization_id=org FOR UPDATE;
 ELSE SELECT * INTO e FROM private.workspace_entitlements WHERE organization_id=org FOR SHARE; END IF;
 IF e.organization_id IS NULL THEN RAISE EXCEPTION 'Workspace access is unavailable' USING ERRCODE='42501'; END IF;
 RETURN e;
END $$;

CREATE OR REPLACE FUNCTION private.guard_workspace_write() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private,pg_temp AS $$
DECLARE rowdata jsonb; olddata jsonb; org uuid; e private.workspace_entitlements; maximum integer; used integer; reserve integer;
BEGIN
 rowdata:=CASE WHEN TG_OP='DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
 olddata:=CASE WHEN TG_OP='UPDATE' THEN to_jsonb(OLD) ELSE '{}'::jsonb END;
 org:=CASE WHEN TG_TABLE_NAME='organizations' THEN (rowdata->>'id')::uuid ELSE (rowdata->>'organization_id')::uuid END;
 IF TG_OP='UPDATE' AND TG_TABLE_NAME<>'organizations' AND org IS DISTINCT FROM (olddata->>'organization_id')::uuid THEN RAISE EXCEPTION 'Workspace ownership cannot change'; END IF;
 -- Account security and completion of an already-accepted provider send stay available.
 IF TG_TABLE_NAME='organization_members' AND TG_OP='DELETE' THEN RETURN OLD; END IF;
 IF TG_TABLE_NAME='email_outbox' AND TG_OP='UPDATE' AND rowdata->>'status' IN ('sent','failed','skipped') THEN RETURN NEW; END IF;
 IF TG_TABLE_NAME='campaigns' AND TG_OP='UPDATE' AND rowdata->>'status' IN ('closed','archived') AND olddata->>'status' IS DISTINCT FROM rowdata->>'status' AND (rowdata - ARRAY['status','closed_at','updated_at']) = (olddata - ARRAY['status','closed_at','updated_at']) THEN RETURN NEW; END IF;
 IF private.is_service_role() AND TG_OP='UPDATE' AND (
   (TG_TABLE_NAME='campaign_assignments' AND rowdata->>'status'='revoked') OR
   (TG_TABLE_NAME='access_tokens' AND rowdata->>'revoked_at' IS NOT NULL) OR
   (TG_TABLE_NAME='campaigns' AND olddata->>'status'='scheduled' AND rowdata->>'status'='draft')
 ) THEN RETURN NEW; END IF;
 e:=private.require_workspace_access(org,TG_TABLE_NAME IN ('people','campaigns','organization_members','organization_invitations'));
 IF TG_TABLE_NAME='campaign_subjects' AND TG_OP<>'DELETE' THEN
  IF EXISTS(SELECT 1 FROM public.people WHERE id=NEW.person_id AND reviewer_only) THEN RAISE EXCEPTION 'External reviewers cannot be appraisal subjects'; END IF;
 ELSIF TG_TABLE_NAME='campaign_assignments' AND TG_OP<>'DELETE' THEN
  IF EXISTS(SELECT 1 FROM public.people WHERE id=NEW.subject_person_id AND reviewer_only) OR (NEW.campaign_id IN (SELECT id FROM public.campaigns WHERE campaign_type='annual_appraisal') AND EXISTS(SELECT 1 FROM public.people WHERE id=NEW.respondent_person_id AND reviewer_only)) THEN RAISE EXCEPTION 'External reviewers cannot be annual appraisal participants'; END IF;
 END IF;
 IF TG_TABLE_NAME='people' AND TG_OP<>'DELETE' THEN
  IF NEW.reviewer_only AND (NEW.manager_person_id IS NOT NULL OR EXISTS(SELECT 1 FROM public.campaign_subjects WHERE person_id=NEW.id) OR EXISTS(SELECT 1 FROM public.campaign_assignments WHERE respondent_person_id=NEW.id AND relationship IN ('self','manager') AND campaign_id IN (SELECT id FROM public.campaigns WHERE campaign_type='annual_appraisal')) OR EXISTS(SELECT 1 FROM public.people WHERE manager_person_id=NEW.id)) THEN RAISE EXCEPTION 'A subject or annual participant cannot be reviewer-only'; END IF;
 END IF;
 IF e.plan='legacy' THEN RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END; END IF;
 IF TG_TABLE_NAME='people' AND TG_OP<>'DELETE' THEN
  IF NOT NEW.reviewer_only AND NEW.archived_at IS NULL AND (TG_OP='INSERT' OR OLD.reviewer_only OR OLD.archived_at IS NOT NULL) THEN
   maximum:=CASE WHEN e.plan='free' THEN 10 WHEN e.plan='organisation' THEN 250 ELSE 75 END;
   SELECT count(*) INTO used FROM public.people WHERE organization_id=org AND NOT reviewer_only AND archived_at IS NULL AND id<>NEW.id;
   IF used>=maximum THEN RAISE EXCEPTION 'Employee capacity reached (% active employees). Free includes 10; Pro includes 75 at £39.99/month + VAT. Visit /dashboard/upgrade.',maximum; END IF;
  END IF;
 ELSIF TG_TABLE_NAME='campaigns' AND TG_OP<>'DELETE' THEN
  IF e.plan='free' AND NEW.campaign_type='feedback_360' AND (TG_OP='INSERT' OR OLD.campaign_type IS DISTINCT FROM NEW.campaign_type OR (NEW.status IN ('active','scheduled') AND OLD.status NOT IN ('active','scheduled'))) THEN
   RAISE EXCEPTION 'Anonymous 360 appraisals are available on Pro at £39.99/month + VAT. Free includes employee appraisals. Visit /dashboard/upgrade.';
  END IF;
  IF NEW.status IN ('active','scheduled') AND (TG_OP='INSERT' OR OLD.status NOT IN ('active','scheduled')) THEN
   maximum:=CASE WHEN e.plan='free' THEN 1 WHEN e.plan='organisation' THEN 20 ELSE 5 END;
   SELECT count(*) INTO used FROM public.campaigns WHERE organization_id=org AND status IN ('active','scheduled') AND id<>NEW.id;
   IF used>=maximum THEN RAISE EXCEPTION 'Active campaign capacity reached (%). Free includes 1 scheduled or active campaign; close it to run the next. Pro includes 5 at £39.99/month + VAT. Visit /dashboard/upgrade.',maximum; END IF;
  END IF;
  IF NEW.status='active' AND (TG_OP='INSERT' OR OLD.status<>'active') THEN
   UPDATE private.workspace_entitlements SET first_activated_at=coalesce(first_activated_at,clock_timestamp()) WHERE organization_id=org;
  END IF;
 ELSIF TG_TABLE_NAME='organization_members' AND TG_OP<>'DELETE' THEN
  IF NEW.role IN ('owner','admin') AND (TG_OP='INSERT' OR OLD.role NOT IN ('owner','admin')) THEN
   maximum:=CASE WHEN e.plan='free' THEN 1 WHEN e.plan='organisation' THEN 10 ELSE 3 END;
   SELECT count(*) INTO used FROM public.organization_members WHERE organization_id=org AND role IN ('owner','admin') AND user_id<>NEW.user_id;
   SELECT count(*) INTO reserve FROM public.organization_invitations WHERE organization_id=org AND role='admin' AND revoked_at IS NULL AND accepted_at IS NULL AND expires_at>clock_timestamp() AND lower(email) IS DISTINCT FROM (SELECT lower(email) FROM public.profiles WHERE id=NEW.user_id);
   IF used+reserve>=maximum THEN RAISE EXCEPTION 'Admin capacity reached (% including the owner and pending invites). Free includes 1; Pro includes 3 at £39.99/month + VAT. Visit /dashboard/upgrade.',maximum; END IF;
  END IF;
 ELSIF TG_TABLE_NAME='organization_invitations' AND TG_OP<>'DELETE' AND rowdata->>'role'='admin' AND rowdata->>'revoked_at' IS NULL AND rowdata->>'accepted_at' IS NULL AND (rowdata->>'expires_at')::timestamptz>clock_timestamp() AND (TG_OP='INSERT' OR olddata->>'role'<>'admin' OR olddata->>'revoked_at' IS NOT NULL OR olddata->>'accepted_at' IS NOT NULL OR (olddata->>'expires_at')::timestamptz<=clock_timestamp()) THEN
  maximum:=CASE WHEN e.plan='free' THEN 1 WHEN e.plan='organisation' THEN 10 ELSE 3 END;
  SELECT count(*) INTO used FROM public.organization_members WHERE organization_id=org AND role IN ('owner','admin');
  SELECT count(*) INTO reserve FROM public.organization_invitations WHERE organization_id=org AND id<>NEW.id AND role='admin' AND revoked_at IS NULL AND accepted_at IS NULL AND expires_at>clock_timestamp();
  IF used+reserve>=maximum THEN RAISE EXCEPTION 'Admin capacity reached (% including the owner and pending invites). Free includes 1; Pro includes 3 at £39.99/month + VAT. Visit /dashboard/upgrade.',maximum; END IF;

 END IF;
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END $$;
CREATE OR REPLACE FUNCTION public.get_workspace_entitlement(p_organization_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private,pg_temp AS $$
DECLARE e private.workspace_entitlements;
BEGIN
 IF NOT private.is_org_admin(p_organization_id) THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 SELECT * INTO e FROM private.workspace_entitlements WHERE organization_id=p_organization_id;
 RETURN jsonb_build_object('plan',e.plan,'needs_review',e.needs_review,'can_operate',private.workspace_can_operate(p_organization_id),'first_activated',e.first_activated_at IS NOT NULL);
END $$;
REVOKE ALL ON FUNCTION public.get_workspace_entitlement(uuid) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.get_workspace_entitlement(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.activate_workspace_plan(p_organization_id uuid,p_plan text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private,pg_temp AS $$
DECLARE employees integer; campaigns integer; admins integer;
BEGIN
 IF NOT private.is_service_role() THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 IF p_plan NOT IN ('pro','organisation') OR p_plan IS NULL THEN RAISE EXCEPTION 'Choose Pro or Organisation'; END IF;
 PERFORM 1 FROM private.workspace_entitlements WHERE organization_id=p_organization_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Workspace unavailable'; END IF;
 employees:=CASE WHEN p_plan='organisation' THEN 250 ELSE 75 END; campaigns:=CASE WHEN p_plan='organisation' THEN 20 ELSE 5 END; admins:=CASE WHEN p_plan='organisation' THEN 10 ELSE 3 END;
 IF ((SELECT count(*) FROM public.people WHERE organization_id=p_organization_id AND NOT reviewer_only AND archived_at IS NULL)>employees OR (SELECT count(*) FROM public.campaigns WHERE organization_id=p_organization_id AND status IN ('active','scheduled'))>campaigns OR (SELECT count(*) FROM public.organization_members WHERE organization_id=p_organization_id AND role IN ('owner','admin'))+(SELECT count(*) FROM public.organization_invitations WHERE organization_id=p_organization_id AND role='admin' AND revoked_at IS NULL AND accepted_at IS NULL AND expires_at>clock_timestamp())>admins) THEN RAISE EXCEPTION 'Workspace exceeds selected plan capacity'; END IF;
 UPDATE private.workspace_entitlements SET plan=p_plan,needs_review=false WHERE organization_id=p_organization_id;
END $$;
REVOKE ALL ON FUNCTION public.activate_workspace_plan(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.activate_workspace_plan(uuid,text) TO service_role;

CREATE OR REPLACE FUNCTION public.expire_trial_campaigns() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=private,pg_temp AS $$
BEGIN
 IF NOT private.is_service_role() THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 RETURN 0;
END $$;
NOTIFY pgrst,'reload schema';
COMMIT;
