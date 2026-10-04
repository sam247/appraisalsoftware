-- Durable commercial access; existing workspaces are grandfathered.
-- Deployment gate stays OFF until hosted staging has passed the release checklist.
CREATE TABLE private.trial_release (singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton), enabled boolean NOT NULL DEFAULT false);
INSERT INTO private.trial_release DEFAULT VALUES;
CREATE TABLE private.workspace_entitlements (
 organization_id uuid PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
 plan text NOT NULL CHECK(plan IN ('legacy','trial','pro','organisation')),
 trial_started_at timestamptz,
 trial_ends_at timestamptz,
 first_activated_at timestamptz,
 activation_measured_at timestamptz,
 CHECK ((trial_started_at IS NULL AND trial_ends_at IS NULL) OR trial_ends_at=trial_started_at+interval '14 days'),
 CHECK (plan<>'trial' OR trial_started_at IS NOT NULL)
);
ALTER TABLE private.trial_release ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.workspace_entitlements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.trial_release, private.workspace_entitlements FROM PUBLIC,anon,authenticated;
GRANT ALL ON private.trial_release, private.workspace_entitlements TO service_role;
INSERT INTO private.workspace_entitlements(organization_id,plan) SELECT id,'legacy' FROM public.organizations;

CREATE OR REPLACE FUNCTION private.start_workspace_entitlement() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private,pg_temp AS $$
DECLARE started timestamptz:=clock_timestamp();
BEGIN
 IF (SELECT enabled FROM private.trial_release WHERE singleton) THEN
  INSERT INTO private.workspace_entitlements(organization_id,plan,trial_started_at,trial_ends_at)
  VALUES(NEW.id,'trial',started,started+interval '14 days');
 ELSE INSERT INTO private.workspace_entitlements(organization_id,plan) VALUES(NEW.id,'legacy'); END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER organizations_start_entitlement AFTER INSERT ON public.organizations FOR EACH ROW EXECUTE FUNCTION private.start_workspace_entitlement();

CREATE FUNCTION private.workspace_can_operate(org uuid) RETURNS boolean
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path=private,pg_temp AS $$
 SELECT EXISTS(SELECT 1 FROM private.workspace_entitlements WHERE organization_id=org AND (plan<>'trial' OR trial_ends_at>clock_timestamp()));
$$;
CREATE FUNCTION private.require_workspace_access(org uuid, exclusive_lock boolean DEFAULT false) RETURNS private.workspace_entitlements
LANGUAGE plpgsql SECURITY DEFINER SET search_path=private,pg_temp AS $$
DECLARE e private.workspace_entitlements;
BEGIN
 -- ponytail: capacity changes serialize per workspace; move to dedicated counters if directory-write contention becomes material.
 IF exclusive_lock THEN SELECT * INTO e FROM private.workspace_entitlements WHERE organization_id=org FOR UPDATE;
 ELSE SELECT * INTO e FROM private.workspace_entitlements WHERE organization_id=org FOR SHARE; END IF;
 IF e.organization_id IS NULL THEN RAISE EXCEPTION 'Workspace access is unavailable' USING ERRCODE='42501'; END IF;
 IF e.plan='trial' AND e.trial_ends_at<=clock_timestamp() THEN
  RAISE EXCEPTION 'Your workspace trial has ended. Collection is closed; existing results remain available. Contact us to upgrade.' USING ERRCODE='42501';
 END IF;
 RETURN e;
END $$;

-- External reviewer-only records do not consume employee capacity, and cannot
-- become review subjects or annual participants while classified as external.
ALTER TABLE public.people ADD COLUMN reviewer_only boolean NOT NULL DEFAULT false;
CREATE FUNCTION private.guard_workspace_write() RETURNS trigger
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
  IF NOT NEW.reviewer_only AND (TG_OP='INSERT' OR OLD.reviewer_only) THEN
   maximum:=CASE WHEN e.plan='organisation' THEN 250 ELSE 75 END;
   SELECT count(*) INTO used FROM public.people WHERE organization_id=org AND NOT reviewer_only AND id<>NEW.id;
   IF used>=maximum THEN RAISE EXCEPTION 'Employee capacity reached (%). Contact us to upgrade.',maximum; END IF;
  END IF;
 ELSIF TG_TABLE_NAME='campaigns' AND TG_OP<>'DELETE' THEN
  IF NEW.status IN ('active','scheduled') AND (TG_OP='INSERT' OR OLD.status NOT IN ('active','scheduled')) THEN
   maximum:=CASE WHEN e.plan='organisation' THEN 20 ELSE 5 END;
   SELECT count(*) INTO used FROM public.campaigns WHERE organization_id=org AND status IN ('active','scheduled') AND id<>NEW.id;
   IF used>=maximum THEN RAISE EXCEPTION 'Active campaign capacity reached (%)',maximum; END IF;
  END IF;
  IF NEW.status='active' AND (TG_OP='INSERT' OR OLD.status<>'active') THEN
   UPDATE private.workspace_entitlements SET first_activated_at=coalesce(first_activated_at,clock_timestamp()) WHERE organization_id=org;
  END IF;
 ELSIF TG_TABLE_NAME='organization_members' AND TG_OP<>'DELETE' THEN
  IF NEW.role IN ('owner','admin') AND (TG_OP='INSERT' OR OLD.role NOT IN ('owner','admin')) THEN
   maximum:=CASE WHEN e.plan='organisation' THEN 10 ELSE 3 END;
   SELECT count(*) INTO used FROM public.organization_members WHERE organization_id=org AND role IN ('owner','admin') AND user_id<>NEW.user_id;
   SELECT count(*) INTO reserve FROM public.organization_invitations WHERE organization_id=org AND role='admin' AND revoked_at IS NULL AND accepted_at IS NULL AND expires_at>clock_timestamp() AND lower(email) IS DISTINCT FROM (SELECT lower(email) FROM public.profiles WHERE id=NEW.user_id);
   IF used+reserve>=maximum THEN RAISE EXCEPTION 'Admin capacity reached (%)',maximum; END IF;
  END IF;
 ELSIF TG_TABLE_NAME='organization_invitations' AND TG_OP<>'DELETE' AND rowdata->>'role'='admin' AND rowdata->>'revoked_at' IS NULL AND rowdata->>'accepted_at' IS NULL AND (rowdata->>'expires_at')::timestamptz>clock_timestamp() AND (TG_OP='INSERT' OR olddata->>'role'<>'admin' OR olddata->>'revoked_at' IS NOT NULL OR olddata->>'accepted_at' IS NOT NULL OR (olddata->>'expires_at')::timestamptz<=clock_timestamp()) THEN
  maximum:=CASE WHEN e.plan='organisation' THEN 10 ELSE 3 END;
  SELECT count(*) INTO used FROM public.organization_members WHERE organization_id=org AND role IN ('owner','admin');
  SELECT count(*) INTO reserve FROM public.organization_invitations WHERE organization_id=org AND id<>NEW.id AND role='admin' AND revoked_at IS NULL AND accepted_at IS NULL AND expires_at>clock_timestamp();
  IF used+reserve>=maximum THEN RAISE EXCEPTION 'Admin capacity reached (%)',maximum; END IF;

 END IF;
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END $$;
DO $$ DECLARE target text; BEGIN
 FOREACH target IN ARRAY ARRAY['people','departments','templates','template_questions','campaigns','campaign_subjects','campaign_assignments','campaign_questions','responses','response_answers','access_tokens','organization_members','organization_invitations','email_outbox'] LOOP
  EXECUTE format('CREATE TRIGGER workspace_entitlement_guard BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION private.guard_workspace_write()',target);
 END LOOP;
 FOREACH target IN ARRAY ARRAY['feedback_360_contracts','feedback_360_responses','feedback_360_identity','feedback_360_answers'] LOOP
  EXECUTE format('CREATE TRIGGER workspace_entitlement_guard BEFORE INSERT OR UPDATE OR DELETE ON private.%I FOR EACH ROW EXECUTE FUNCTION private.guard_workspace_write()',target);
 END LOOP;
END $$;

CREATE FUNCTION public.get_workspace_entitlement(p_organization_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private,pg_temp AS $$
DECLARE e private.workspace_entitlements;
BEGIN
 IF NOT private.is_org_admin(p_organization_id) THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 SELECT * INTO e FROM private.workspace_entitlements WHERE organization_id=p_organization_id;
 RETURN jsonb_build_object('plan',e.plan,'trial_ends_at',e.trial_ends_at,'can_operate',private.workspace_can_operate(p_organization_id),'first_activated',e.first_activated_at IS NOT NULL);
END $$;
REVOKE ALL ON FUNCTION public.get_workspace_entitlement(uuid) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.get_workspace_entitlement(uuid) TO authenticated;

CREATE FUNCTION public.claim_first_activation_measurement(p_organization_id uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private,pg_temp AS $$
DECLARE claimed uuid;
BEGIN
 IF NOT private.is_org_admin(p_organization_id) THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 UPDATE private.workspace_entitlements SET activation_measured_at=clock_timestamp()
 WHERE organization_id=p_organization_id AND plan<>'legacy' AND first_activated_at IS NOT NULL AND activation_measured_at IS NULL RETURNING organization_id INTO claimed;
 RETURN claimed IS NOT NULL;
END $$;
REVOKE ALL ON FUNCTION public.claim_first_activation_measurement(uuid) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.claim_first_activation_measurement(uuid) TO authenticated;

CREATE FUNCTION public.activate_workspace_plan(p_organization_id uuid,p_plan text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private,pg_temp AS $$
DECLARE employees integer; campaigns integer; admins integer;
BEGIN
 IF NOT private.is_service_role() THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 IF p_plan NOT IN ('pro','organisation') OR p_plan IS NULL THEN RAISE EXCEPTION 'Choose Pro or Organisation'; END IF;
 PERFORM 1 FROM private.workspace_entitlements WHERE organization_id=p_organization_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Workspace unavailable'; END IF;
 employees:=CASE WHEN p_plan='organisation' THEN 250 ELSE 75 END; campaigns:=CASE WHEN p_plan='organisation' THEN 20 ELSE 5 END; admins:=CASE WHEN p_plan='organisation' THEN 10 ELSE 3 END;
 IF ((SELECT count(*) FROM public.people WHERE organization_id=p_organization_id AND NOT reviewer_only)>employees OR (SELECT count(*) FROM public.campaigns WHERE organization_id=p_organization_id AND status IN ('active','scheduled'))>campaigns OR (SELECT count(*) FROM public.organization_members WHERE organization_id=p_organization_id AND role IN ('owner','admin'))+(SELECT count(*) FROM public.organization_invitations WHERE organization_id=p_organization_id AND role='admin' AND revoked_at IS NULL AND accepted_at IS NULL AND expires_at>clock_timestamp())>admins) THEN RAISE EXCEPTION 'Workspace exceeds selected plan capacity'; END IF;
 UPDATE private.workspace_entitlements SET plan=p_plan WHERE organization_id=p_organization_id;
END $$;
REVOKE ALL ON FUNCTION public.activate_workspace_plan(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.activate_workspace_plan(uuid,text) TO service_role;

CREATE FUNCTION public.workspace_delivery_allowed(p_organization_id uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=private,pg_temp AS $$
BEGIN
 IF NOT private.is_service_role() THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 RETURN private.workspace_can_operate(p_organization_id);
END $$;
REVOKE ALL ON FUNCTION public.workspace_delivery_allowed(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.workspace_delivery_allowed(uuid) TO service_role;

CREATE FUNCTION public.expire_trial_campaigns() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private,pg_temp AS $$
DECLARE c record; locked public.campaigns; total integer:=0;
BEGIN
 IF NOT private.is_service_role() THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 FOR c IN SELECT id FROM public.campaigns WHERE status IN ('active','scheduled') AND NOT private.workspace_can_operate(organization_id) LOOP
  SELECT * INTO locked FROM public.campaigns WHERE id=c.id FOR UPDATE;
  PERFORM 1 FROM private.workspace_entitlements WHERE organization_id=locked.organization_id FOR SHARE;
  IF locked.status NOT IN ('active','scheduled') OR private.workspace_can_operate(locked.organization_id) THEN CONTINUE; END IF;
  IF locked.status='active' THEN PERFORM public.close_campaign(c.id);
  ELSE UPDATE public.campaigns SET status='draft',opens_at=NULL,send_claimed_at=NULL,schedule_error='Trial ended before scheduled sending' WHERE id=c.id; END IF;
  total:=total+1;
 END LOOP;
 RETURN total;
END $$;
REVOKE ALL ON FUNCTION public.expire_trial_campaigns() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.expire_trial_campaigns() TO service_role;
CREATE OR REPLACE FUNCTION private.lock_open_appraisal_assignment(p_raw_token text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, private, extensions, pg_temp
AS $$
DECLARE t public.access_tokens; a public.campaign_assignments; c public.campaigns;
BEGIN
  SELECT * INTO t FROM public.access_tokens WHERE token_hash=encode(extensions.digest(trim(p_raw_token),'sha256'),'hex');
  IF NOT FOUND OR t.revoked_at IS NOT NULL OR t.expires_at <= clock_timestamp() THEN RAISE EXCEPTION 'Invalid or expired link' USING ERRCODE='P0002'; END IF;
  SELECT * INTO a FROM public.campaign_assignments WHERE id=t.assignment_id;
  SELECT * INTO c FROM public.campaigns WHERE id=a.campaign_id FOR SHARE;
 PERFORM private.require_workspace_access(c.organization_id);
  IF NOT FOUND OR c.status <> 'active' OR (c.closes_at IS NOT NULL AND c.closes_at <= clock_timestamp()) THEN RAISE EXCEPTION 'Campaign is not currently open'; END IF;
  SELECT * INTO a FROM public.campaign_assignments WHERE id=t.assignment_id FOR UPDATE;
  IF t.expires_at <= clock_timestamp() OR (c.closes_at IS NOT NULL AND c.closes_at <= clock_timestamp()) THEN RAISE EXCEPTION 'This appraisal has closed'; END IF;
  IF a.status IN ('submitted','revoked') THEN RAISE EXCEPTION 'Assignment is not open for responses'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION private.lock_360_reviewer(p_token text)
RETURNS public.campaign_assignments LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private,extensions,pg_temp AS $$
DECLARE a public.campaign_assignments; c public.campaigns; token public.access_tokens;
BEGIN
 PERFORM private.require_360_release();
 SELECT * INTO token FROM public.access_tokens WHERE token_hash=encode(extensions.digest(trim(p_token),'sha256'),'hex');
 IF NOT FOUND THEN RAISE EXCEPTION 'Invalid personal link'; END IF;
 SELECT * INTO a FROM public.campaign_assignments WHERE id=token.assignment_id;
 SELECT * INTO c FROM public.campaigns WHERE id=a.campaign_id FOR SHARE;
 PERFORM private.require_workspace_access(c.organization_id);
 SELECT * INTO a FROM public.campaign_assignments WHERE id=token.assignment_id FOR UPDATE;
 SELECT * INTO token FROM public.access_tokens WHERE id=token.id;
 IF token.id IS NULL OR a.id IS NULL OR c.id IS NULL OR c.campaign_type<>'feedback_360' OR c.status<>'active' OR (c.closes_at IS NOT NULL AND c.closes_at<=clock_timestamp()) OR token.revoked_at IS NOT NULL OR token.expires_at<=clock_timestamp() OR a.status='revoked' THEN RAISE EXCEPTION 'This feedback request is closed or expired'; END IF;
 RETURN a;
END $$;

CREATE OR REPLACE FUNCTION public.claim_and_activate_due_campaigns(p_limit integer DEFAULT 20)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_limit integer := least(greatest(coalesce(p_limit, 20), 1), 50);
  r record;
  n integer := 0;
BEGIN
  IF NOT private.is_service_role() THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  FOR r IN
    SELECT c.id
    FROM public.campaigns c
    WHERE private.workspace_can_operate(c.organization_id) AND c.status = 'scheduled'
      AND c.opens_at IS NOT NULL
      AND c.opens_at <= now()
      AND c.send_claimed_at IS NULL
    ORDER BY c.opens_at
    LIMIT v_limit
    FOR UPDATE OF c SKIP LOCKED
  LOOP
    UPDATE public.campaigns
    SET send_claimed_at = now(), updated_at = now()
    WHERE id = r.id;

    BEGIN
      PERFORM public.activate_campaign(r.id);
      n := n + 1;
    EXCEPTION WHEN OTHERS THEN
      UPDATE public.campaigns
      SET
        send_claimed_at = NULL,
        schedule_error = left(SQLERRM, 1000),
        schedule_attempts = schedule_attempts + 1,
        updated_at = now()
      WHERE id = r.id;
    END;
  END LOOP;

  RETURN n;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_email_outbox_batch(p_limit integer DEFAULT 50)
RETURNS SETOF public.email_outbox
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_limit integer := least(greatest(coalesce(p_limit, 50), 1), 100);
BEGIN
  IF NOT private.is_service_role() THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH picked AS (
    SELECT e.id
    FROM public.email_outbox e
    WHERE private.workspace_can_operate(e.organization_id) AND ((
        e.status IN ('pending', 'failed')
        AND e.scheduled_for <= now()
        AND e.attempts < 5
      )
      OR (
        e.status = 'sending'
        AND e.updated_at < now() - interval '10 minutes'
        AND e.attempts < 5
      )
    )
    ORDER BY e.scheduled_for
    LIMIT v_limit
    FOR UPDATE OF e SKIP LOCKED
  )
  UPDATE public.email_outbox o
  SET
    status = 'sending',
    attempts = o.attempts + 1,
    last_error = NULL,
    updated_at = now()
  FROM picked
  WHERE o.id = picked.id
  RETURNING o.*;
END;
$$;

CREATE OR REPLACE FUNCTION public.enqueue_appraisal_reminders(p_limit integer DEFAULT 100)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_limit integer := least(greatest(coalesce(p_limit, 100), 1), 200);
  r record;
  n integer := 0;
  v_settings jsonb;
  v_enabled boolean;
  v_strategy text;
  v_cadence_days numeric;
  v_baseline timestamptz;
  v_since timestamptz;
  v_raw_token text;
  v_org_name text;
  v_subject_name text;
  v_respondent_name text;
  v_bucket text;
  v_subject_line text;
BEGIN
  IF NOT private.is_service_role() THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  FOR r IN
    SELECT
      a.id AS assignment_id,
      a.organization_id,
      a.campaign_id,
      a.relationship,
      a.status AS assignment_status,
      a.sent_at,
      a.last_reminded_at,
      a.respondent_person_id,
      a.subject_person_id,
      c.name AS campaign_name,
      c.closes_at,
      c.opens_at,
      c.reminder_settings,
      c.status AS campaign_status
    FROM public.campaign_assignments a
    JOIN public.campaigns c ON c.id = a.campaign_id
    WHERE private.workspace_can_operate(c.organization_id) AND c.status = 'active'
      AND a.status IN ('sent', 'opened', 'started')
      AND (c.closes_at IS NULL OR c.closes_at > now())
    ORDER BY a.updated_at
    LIMIT v_limit
    FOR UPDATE OF a SKIP LOCKED
  LOOP
    v_settings := coalesce(r.reminder_settings, '{}'::jsonb);
    v_enabled := coalesce((v_settings ->> 'enabled')::boolean, false);
    IF NOT v_enabled THEN
      CONTINUE;
    END IF;

    v_strategy := coalesce(v_settings ->> 'strategy', 'cadence');
    IF v_strategy <> 'cadence' THEN
      CONTINUE; -- MVP: cadence only in SQL; before_close can be added later
    END IF;

    v_cadence_days := nullif(v_settings ->> 'cadenceDays', '')::numeric;
    IF v_cadence_days IS NULL OR v_cadence_days <= 0 THEN
      CONTINUE;
    END IF;

    v_baseline := coalesce(r.sent_at, r.opens_at);
    IF v_baseline IS NULL THEN
      CONTINUE;
    END IF;

    v_since := coalesce(r.last_reminded_at, v_baseline);
    IF now() < v_since + (v_cadence_days || ' days')::interval THEN
      CONTINUE;
    END IF;

    -- Recover respond token from original invite outbox (never log this).
    SELECT payload ->> 'raw_token' INTO v_raw_token
    FROM public.email_outbox
    WHERE idempotency_key = 'invite:' || r.assignment_id::text
    LIMIT 1;

    IF v_raw_token IS NULL OR length(v_raw_token) = 0 THEN
      CONTINUE;
    END IF;

    SELECT name INTO v_org_name FROM public.organizations WHERE id = r.organization_id;
    SELECT full_name INTO v_respondent_name FROM public.people WHERE id = r.respondent_person_id;
    SELECT full_name INTO v_subject_name FROM public.people WHERE id = r.subject_person_id;

    v_bucket := to_char(timezone('utc', now()), 'YYYY-MM-DD');

    IF r.relationship = 'self' THEN
      v_subject_line := 'Reminder: complete your self-appraisal';
    ELSIF r.relationship = 'manager' THEN
      v_subject_line := 'Reminder: manager appraisal for ' || coalesce(v_subject_name, 'a team member');
    ELSE
      v_subject_line := 'Reminder: appraisal still open';
    END IF;

    INSERT INTO public.email_outbox (
      organization_id, kind, to_email, subject, payload, idempotency_key
    )
    SELECT
      r.organization_id,
      'appraisal_reminder',
      p.email,
      v_subject_line,
      jsonb_build_object(
        'campaign_id', r.campaign_id,
        'campaign_name', r.campaign_name,
        'assignment_id', r.assignment_id,
        'relationship', r.relationship,
        'raw_token', v_raw_token,
        'org_name', v_org_name,
        'respondent_name', v_respondent_name,
        'subject_name', v_subject_name,
        'closes_at', r.closes_at,
        'is_reminder', true
      ),
      'reminder:' || r.assignment_id::text || ':' || v_bucket
    FROM public.people p
    WHERE p.id = r.respondent_person_id
    ON CONFLICT (idempotency_key) DO NOTHING;

    IF FOUND THEN
      n := n + 1;
    END IF;
  END LOOP;

  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION private.start_workspace_entitlement(),private.workspace_can_operate(uuid),private.require_workspace_access(uuid,boolean),private.guard_workspace_write() FROM PUBLIC,anon,authenticated,service_role;
NOTIFY pgrst,'reload schema';

CREATE TRIGGER workspace_entitlement_guard BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION private.guard_workspace_write();

CREATE OR REPLACE FUNCTION public.bootstrap_organization(
  p_name text,
  p_slug text DEFAULT NULL
)
RETURNS public.organizations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_slug text;
  v_org public.organizations;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  IF length(trim(COALESCE(p_name, ''))) = 0 THEN
    RAISE EXCEPTION 'Organisation name is required' USING ERRCODE = '22023';
  END IF;

  -- Serialize concurrent bootstrap retries for the same account.
  PERFORM 1 FROM auth.users WHERE id=v_uid FOR UPDATE;

  IF EXISTS (
    SELECT 1 FROM public.organization_members m WHERE m.user_id = v_uid
  ) THEN
    RAISE EXCEPTION 'User already belongs to an organisation' USING ERRCODE = 'P0001';
  END IF;

  v_slug := lower(trim(COALESCE(NULLIF(trim(p_slug), ''), p_name)));
  v_slug := regexp_replace(v_slug, '[^a-z0-9]+', '-', 'g');
  v_slug := trim(both '-' from v_slug);
  IF v_slug = '' THEN
    v_slug := 'org';
  END IF;

  IF EXISTS (SELECT 1 FROM public.organizations o WHERE o.slug = v_slug) THEN
    v_slug := v_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  END IF;

  INSERT INTO public.organizations (name, slug)
  VALUES (trim(p_name), v_slug)
  RETURNING * INTO v_org;

  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (v_org.id, v_uid, 'owner');

  PERFORM private.copy_builtin_templates_to_org(v_org.id, v_uid);

  RETURN v_org;
END;
$$;
