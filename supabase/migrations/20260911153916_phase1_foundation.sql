-- Appraisal Software Phase 1 foundation
-- Tables: organizations, profiles, membership, people, templates
-- No campaigns, billing columns, or email outbox.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE SCHEMA IF NOT EXISTS private;

-- ---------------------------------------------------------------------------
-- Organizations (commercially neutral — no Stripe/billing columns)
-- ---------------------------------------------------------------------------
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  logo_url text,
  brand_color text NOT NULL DEFAULT '#0d9488',
  timezone text NOT NULL DEFAULT 'Europe/London',
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organizations_name_not_blank CHECK (length(trim(name)) > 0),
  CONSTRAINT organizations_slug_not_blank CHECK (length(trim(slug)) > 0),
  CONSTRAINT organizations_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE UNIQUE INDEX organizations_slug_uidx ON public.organizations (slug);

-- ---------------------------------------------------------------------------
-- Profiles (1:1 auth.users)
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_email_not_blank CHECK (length(trim(email)) > 0)
);

-- ---------------------------------------------------------------------------
-- Membership
-- ---------------------------------------------------------------------------
CREATE TABLE public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  invited_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

CREATE INDEX organization_members_user_idx
  ON public.organization_members (user_id);

CREATE INDEX organization_members_org_role_idx
  ON public.organization_members (organization_id, role);

CREATE TABLE public.organization_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'member')),
  token_hash text NOT NULL,
  invited_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organization_invitations_email_not_blank CHECK (length(trim(email)) > 0)
);

CREATE UNIQUE INDEX organization_invitations_token_hash_uidx
  ON public.organization_invitations (token_hash);

CREATE INDEX organization_invitations_org_email_idx
  ON public.organization_invitations (organization_id, lower(email));

-- ---------------------------------------------------------------------------
-- People directory
-- ---------------------------------------------------------------------------
CREATE TABLE public.people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  job_title text,
  manager_person_id uuid,
  external_id text,
  user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  archived_at timestamptz,
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT people_email_not_blank CHECK (length(trim(email)) > 0),
  CONSTRAINT people_manager_fk FOREIGN KEY (manager_person_id) REFERENCES public.people (id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX people_org_email_active_uidx
  ON public.people (organization_id, lower(trim(email)))
  WHERE archived_at IS NULL;

CREATE INDEX people_org_idx ON public.people (organization_id)
  WHERE archived_at IS NULL;

-- ---------------------------------------------------------------------------
-- Templates (unique on id, organization_id for composite child FKs)
-- ---------------------------------------------------------------------------
CREATE TABLE public.templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  campaign_type_default text NOT NULL DEFAULT 'custom'
    CHECK (campaign_type_default IN (
      'annual_appraisal',
      'feedback_360',
      'self_assessment',
      'manager_review',
      'probation_review',
      'employee_feedback',
      'custom'
    )),
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  archived_at timestamptz,
  cloned_from_id uuid,
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT templates_name_not_blank CHECK (length(trim(name)) > 0),
  UNIQUE (id, organization_id)
);

CREATE INDEX templates_org_idx
  ON public.templates (organization_id)
  WHERE archived_at IS NULL;

CREATE TABLE public.template_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL,
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  type text NOT NULL CHECK (type IN ('rating', 'single_choice', 'multi_choice', 'text', 'nps')),
  prompt text NOT NULL,
  help_text text,
  required boolean NOT NULL DEFAULT true,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  scale jsonb NOT NULL DEFAULT '{}'::jsonb,
  stable_key text,
  competency_key text,
  competency_label text,
  section_key text,
  section_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT template_questions_prompt_not_blank CHECK (length(trim(prompt)) > 0),
  CONSTRAINT template_questions_template_org_fk
    FOREIGN KEY (template_id, organization_id)
    REFERENCES public.templates (id, organization_id)
    ON DELETE CASCADE
);

CREATE INDEX template_questions_template_idx
  ON public.template_questions (template_id, sort_order);

CREATE INDEX template_questions_org_idx
  ON public.template_questions (organization_id);

-- ---------------------------------------------------------------------------
-- Builtin seed definitions (not tenant data; service/RPC only)
-- ---------------------------------------------------------------------------
CREATE TABLE private.builtin_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stable_key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  campaign_type_default text NOT NULL,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE private.builtin_template_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  builtin_template_id uuid NOT NULL REFERENCES private.builtin_templates (id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  type text NOT NULL,
  prompt text NOT NULL,
  help_text text,
  required boolean NOT NULL DEFAULT true,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  scale jsonb NOT NULL DEFAULT '{}'::jsonb,
  stable_key text,
  competency_key text,
  competency_label text,
  section_key text,
  section_label text
);

REVOKE ALL ON TABLE private.builtin_templates FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE private.builtin_template_questions FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE private.builtin_templates TO postgres, service_role;
GRANT ALL ON TABLE private.builtin_template_questions TO postgres, service_role;

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER organizations_set_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TRIGGER organization_members_set_updated_at
  BEFORE UPDATE ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TRIGGER people_set_updated_at
  BEFORE UPDATE ON public.people
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TRIGGER templates_set_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auth helpers (private schema — SECURITY DEFINER)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.is_org_member(p_organization_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.organization_id = p_organization_id
      AND m.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION private.is_org_admin(p_organization_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.organization_id = p_organization_id
      AND m.user_id = auth.uid()
      AND m.role IN ('owner', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION private.is_org_owner(p_organization_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.organization_id = p_organization_id
      AND m.user_id = auth.uid()
      AND m.role = 'owner'
  );
$$;

CREATE OR REPLACE FUNCTION private.org_owner_count(p_organization_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
  SELECT count(*)::integer
  FROM public.organization_members m
  WHERE m.organization_id = p_organization_id
    AND m.role = 'owner';
$$;

REVOKE ALL ON FUNCTION private.is_org_member(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_org_admin(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_org_owner(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.org_owner_count(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION private.is_org_member(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_org_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_org_owner(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.org_owner_count(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_org_member(p_organization_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
  SELECT private.is_org_member(p_organization_id);
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin(p_organization_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
  SELECT private.is_org_admin(p_organization_id);
$$;

CREATE OR REPLACE FUNCTION public.is_org_owner(p_organization_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
  SELECT private.is_org_owner(p_organization_id);
$$;

REVOKE ALL ON FUNCTION public.is_org_member(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_org_admin(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_org_owner(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_org_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_org_owner(uuid) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Profile bootstrap on auth.users insert
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')), '')
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION private.handle_new_user();

-- ---------------------------------------------------------------------------
-- Copy builtin templates into an organisation
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.copy_builtin_templates_to_org(
  p_organization_id uuid,
  p_created_by uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  r record;
  v_template_id uuid;
BEGIN
  FOR r IN
    SELECT * FROM private.builtin_templates ORDER BY sort_order, name
  LOOP
    INSERT INTO public.templates (
      organization_id, name, description, campaign_type_default, settings, created_by
    ) VALUES (
      p_organization_id, r.name, r.description, r.campaign_type_default, r.settings, p_created_by
    )
    RETURNING id INTO v_template_id;

    INSERT INTO public.template_questions (
      template_id, organization_id, sort_order, type, prompt, help_text, required,
      options, scale, stable_key, competency_key, competency_label, section_key, section_label
    )
    SELECT
      v_template_id,
      p_organization_id,
      q.sort_order,
      q.type,
      q.prompt,
      q.help_text,
      q.required,
      q.options,
      q.scale,
      q.stable_key,
      q.competency_key,
      q.competency_label,
      q.section_key,
      q.section_label
    FROM private.builtin_template_questions q
    WHERE q.builtin_template_id = r.id
    ORDER BY q.sort_order;
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- Signup: create organisation + owner + builtins
-- Phase 1: one org per user (blocks if already a member anywhere)
-- ---------------------------------------------------------------------------
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

REVOKE ALL ON FUNCTION public.bootstrap_organization(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bootstrap_organization(text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Create admin invitation (returns raw token once)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_organization_invitation(
  p_organization_id uuid,
  p_email text,
  p_role text DEFAULT 'admin'
)
RETURNS TABLE (invitation_id uuid, raw_token text, expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private', 'extensions'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text := lower(trim(p_email));
  v_role text := lower(trim(p_role));
  v_raw text;
  v_hash text;
  v_expires timestamptz := now() + interval '14 days';
  v_id uuid;
BEGIN
  IF v_uid IS NULL OR NOT private.is_org_admin(p_organization_id) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  IF v_role <> 'admin' THEN
    RAISE EXCEPTION 'Only admin invitations are supported' USING ERRCODE = '22023';
  END IF;

  IF v_email = '' OR v_email !~ '^[^@]+@[^@]+\.[^@]+$' THEN
    RAISE EXCEPTION 'Valid email required' USING ERRCODE = '22023';
  END IF;

  v_raw := encode(extensions.gen_random_bytes(32), 'hex');
  v_hash := encode(extensions.digest(v_raw, 'sha256'), 'hex');

  UPDATE public.organization_invitations i
  SET revoked_at = now()
  WHERE i.organization_id = p_organization_id
    AND lower(i.email) = v_email
    AND i.accepted_at IS NULL
    AND i.revoked_at IS NULL;

  INSERT INTO public.organization_invitations (
    organization_id, email, role, token_hash, invited_by, expires_at
  ) VALUES (
    p_organization_id, v_email, v_role, v_hash, v_uid, v_expires
  )
  RETURNING id INTO v_id;

  invitation_id := v_id;
  raw_token := v_raw;
  expires_at := v_expires;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.create_organization_invitation(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_organization_invitation(uuid, text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Accept invitation
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.accept_organization_invitation(p_raw_token text)
RETURNS public.organization_members
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private', 'extensions'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_hash text;
  v_inv public.organization_invitations;
  v_member public.organization_members;
  v_email text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  v_hash := encode(extensions.digest(trim(p_raw_token), 'sha256'), 'hex');

  SELECT * INTO v_inv
  FROM public.organization_invitations i
  WHERE i.token_hash = v_hash
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid invitation' USING ERRCODE = 'P0002';
  END IF;

  IF v_inv.revoked_at IS NOT NULL OR v_inv.accepted_at IS NOT NULL OR v_inv.expires_at < now() THEN
    RAISE EXCEPTION 'Invitation is no longer valid' USING ERRCODE = 'P0002';
  END IF;

  SELECT email INTO v_email FROM public.profiles WHERE id = v_uid;
  IF lower(trim(COALESCE(v_email, ''))) <> lower(trim(v_inv.email)) THEN
    RAISE EXCEPTION 'Invitation email does not match signed-in user' USING ERRCODE = '42501';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.organization_members m
    WHERE m.user_id = v_uid AND m.organization_id <> v_inv.organization_id
  ) THEN
    RAISE EXCEPTION 'User already belongs to another organisation' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.organization_members (organization_id, user_id, role, invited_by)
  VALUES (v_inv.organization_id, v_uid, v_inv.role, v_inv.invited_by)
  ON CONFLICT (organization_id, user_id) DO UPDATE
    SET role = EXCLUDED.role,
        updated_at = now()
  RETURNING * INTO v_member;

  UPDATE public.organization_invitations
  SET accepted_at = now()
  WHERE id = v_inv.id;

  RETURN v_member;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_organization_invitation(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_organization_invitation(text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Last-owner protection
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.prevent_last_owner_loss()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.role = 'owner' AND private.org_owner_count(OLD.organization_id) <= 1 THEN
      RAISE EXCEPTION 'Cannot remove the last owner' USING ERRCODE = 'P0001';
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.role = 'owner' AND NEW.role IS DISTINCT FROM 'owner'
       AND private.org_owner_count(OLD.organization_id) <= 1 THEN
      RAISE EXCEPTION 'Cannot demote the last owner' USING ERRCODE = 'P0001';
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER organization_members_protect_last_owner
  BEFORE UPDATE OR DELETE ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION private.prevent_last_owner_loss();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY organizations_select ON public.organizations
  FOR SELECT TO authenticated
  USING (public.is_org_admin(id));

CREATE POLICY organizations_update ON public.organizations
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(id))
  WITH CHECK (public.is_org_admin(id));

CREATE POLICY profiles_select_self ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY profiles_select_org_admins ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.organization_members me
      JOIN public.organization_members them
        ON them.organization_id = me.organization_id
      WHERE me.user_id = auth.uid()
        AND me.role IN ('owner', 'admin')
        AND them.user_id = profiles.id
    )
  );

CREATE POLICY profiles_update_self ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY organization_members_select ON public.organization_members
  FOR SELECT TO authenticated
  USING (public.is_org_admin(organization_id));

CREATE POLICY organization_members_insert ON public.organization_members
  FOR INSERT TO authenticated
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY organization_members_update ON public.organization_members
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY organization_members_delete ON public.organization_members
  FOR DELETE TO authenticated
  USING (public.is_org_admin(organization_id));

CREATE POLICY organization_invitations_select ON public.organization_invitations
  FOR SELECT TO authenticated
  USING (public.is_org_admin(organization_id));

CREATE POLICY organization_invitations_insert ON public.organization_invitations
  FOR INSERT TO authenticated
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY organization_invitations_update ON public.organization_invitations
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY organization_invitations_delete ON public.organization_invitations
  FOR DELETE TO authenticated
  USING (public.is_org_admin(organization_id));

CREATE POLICY people_select ON public.people
  FOR SELECT TO authenticated
  USING (public.is_org_admin(organization_id));

CREATE POLICY people_insert ON public.people
  FOR INSERT TO authenticated
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY people_update ON public.people
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY people_delete ON public.people
  FOR DELETE TO authenticated
  USING (public.is_org_admin(organization_id));

CREATE POLICY templates_select ON public.templates
  FOR SELECT TO authenticated
  USING (public.is_org_admin(organization_id));

CREATE POLICY templates_insert ON public.templates
  FOR INSERT TO authenticated
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY templates_update ON public.templates
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY templates_delete ON public.templates
  FOR DELETE TO authenticated
  USING (public.is_org_admin(organization_id));

CREATE POLICY template_questions_select ON public.template_questions
  FOR SELECT TO authenticated
  USING (public.is_org_admin(organization_id));

CREATE POLICY template_questions_insert ON public.template_questions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY template_questions_update ON public.template_questions
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY template_questions_delete ON public.template_questions
  FOR DELETE TO authenticated
  USING (public.is_org_admin(organization_id));

-- ---------------------------------------------------------------------------
-- Builtin template seed (copy-on-signup)
-- ---------------------------------------------------------------------------
INSERT INTO private.builtin_templates (stable_key, name, description, campaign_type_default, settings, sort_order)
VALUES
  (
    'annual_appraisal',
    'Annual appraisal',
    'Yearly review covering objectives, performance, and development.',
    'annual_appraisal',
    '{"intro_message":"Please complete this appraisal thoughtfully.","thank_you_message":"Thank you — your responses have been saved."}'::jsonb,
    1
  ),
  (
    'self_assessment',
    'Self-assessment',
    'Employee reflection before a review meeting.',
    'self_assessment',
    '{"intro_message":"Reflect on your performance and goals.","thank_you_message":"Thank you for completing your self-assessment."}'::jsonb,
    2
  ),
  (
    'manager_review',
    'Manager review',
    'Manager assessment of an employee''s performance.',
    'manager_review',
    '{"intro_message":"Please assess this employee''s performance.","thank_you_message":"Thank you — your review has been saved."}'::jsonb,
    3
  ),
  (
    'probation_review',
    'Probation review',
    'Focused review at the end of a probation period.',
    'probation_review',
    '{"intro_message":"Complete this probation review.","thank_you_message":"Thank you — the probation review is complete."}'::jsonb,
    4
  );

INSERT INTO private.builtin_template_questions (
  builtin_template_id, sort_order, type, prompt, help_text, required, options, scale,
  stable_key, competency_key, competency_label, section_key, section_label
)
SELECT t.id, v.sort_order, v.type, v.prompt, v.help_text, v.required, v.options::jsonb, v.scale::jsonb,
       v.q_stable_key, v.competency_key, v.competency_label, v.section_key, v.section_label
FROM private.builtin_templates t
JOIN (
  VALUES
    ('annual_appraisal', 1, 'rating', 'How well were agreed objectives met?', NULL::text, true, '[]', '{"min":1,"max":5,"min_label":"Not met","max_label":"Exceeded"}', 'objectives_met', 'delivery', 'Delivery', 'performance', 'Performance'),
    ('annual_appraisal', 2, 'rating', 'Quality of work delivered this period', NULL, true, '[]', '{"min":1,"max":5,"min_label":"Needs improvement","max_label":"Excellent"}', 'work_quality', 'quality', 'Quality', 'performance', 'Performance'),
    ('annual_appraisal', 3, 'text', 'What went well this period?', 'Share specific examples where possible.', true, '[]', '{}', 'went_well', NULL, NULL, 'reflection', 'Reflection'),
    ('annual_appraisal', 4, 'text', 'What should be a focus for the next period?', NULL, true, '[]', '{}', 'next_focus', NULL, NULL, 'development', 'Development'),
    ('annual_appraisal', 5, 'text', 'Any other comments?', NULL, false, '[]', '{}', 'other_comments', NULL, NULL, 'development', 'Development'),
    ('self_assessment', 1, 'rating', 'How effectively did you meet your objectives?', NULL, true, '[]', '{"min":1,"max":5,"min_label":"Not met","max_label":"Exceeded"}', 'self_objectives', 'delivery', 'Delivery', 'self', 'Self-assessment'),
    ('self_assessment', 2, 'text', 'What are you most proud of?', NULL, true, '[]', '{}', 'self_proud', NULL, NULL, 'self', 'Self-assessment'),
    ('self_assessment', 3, 'text', 'Where do you want to develop next?', NULL, true, '[]', '{}', 'self_develop', NULL, NULL, 'self', 'Self-assessment'),
    ('manager_review', 1, 'rating', 'Overall performance this period', NULL, true, '[]', '{"min":1,"max":5,"min_label":"Below expectations","max_label":"Outstanding"}', 'mgr_overall', 'delivery', 'Delivery', 'manager', 'Manager review'),
    ('manager_review', 2, 'text', 'Key strengths demonstrated', NULL, true, '[]', '{}', 'mgr_strengths', NULL, NULL, 'manager', 'Manager review'),
    ('manager_review', 3, 'text', 'Development areas and support needed', NULL, true, '[]', '{}', 'mgr_development', NULL, NULL, 'manager', 'Manager review'),
    ('probation_review', 1, 'rating', 'Has the employee met the requirements of the role?', NULL, true, '[]', '{"min":1,"max":5,"min_label":"No","max_label":"Fully"}', 'probation_fit', 'delivery', 'Delivery', 'probation', 'Probation'),
    ('probation_review', 2, 'single_choice', 'Recommended outcome', NULL, true, '["Confirm in role","Extend probation","Do not confirm"]', '{}', 'probation_outcome', NULL, NULL, 'probation', 'Probation'),
    ('probation_review', 3, 'text', 'Comments supporting this recommendation', NULL, true, '[]', '{}', 'probation_comments', NULL, NULL, 'probation', 'Probation')
) AS v(
  tpl_key, sort_order, type, prompt, help_text, required, options, scale,
  q_stable_key, competency_key, competency_label, section_key, section_label
) ON t.stable_key = v.tpl_key;
