-- Phase 2: campaign engine golden path (annual appraisal)
-- Adds multi-subject campaigns, assignments, tokens, responses, outbox.

-- People need composite uniqueness for org-scoped FKs
CREATE UNIQUE INDEX IF NOT EXISTS people_id_org_uidx
  ON public.people (id, organization_id);

-- ---------------------------------------------------------------------------
-- Campaigns
-- ---------------------------------------------------------------------------
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  name text NOT NULL,
  campaign_type text NOT NULL DEFAULT 'annual_appraisal'
    CHECK (campaign_type IN (
      'annual_appraisal', 'feedback_360', 'self_assessment', 'manager_review',
      'probation_review', 'employee_feedback', 'custom'
    )),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'active', 'closed', 'archived')),
  template_id uuid,
  settings jsonb NOT NULL DEFAULT '{"anonymity":{"mode":"identified"}}'::jsonb,
  reminder_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  opens_at timestamptz,
  closes_at timestamptz,
  timezone text NOT NULL DEFAULT 'Europe/London',
  questions_frozen_at timestamptz,
  send_claimed_at timestamptz,
  schedule_error text,
  schedule_attempts integer NOT NULL DEFAULT 0,
  cloned_from_campaign_id uuid,
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT campaigns_name_not_blank CHECK (length(trim(name)) > 0),
  UNIQUE (id, organization_id),
  CONSTRAINT campaigns_template_org_fk
    FOREIGN KEY (template_id, organization_id)
    REFERENCES public.templates (id, organization_id)
    ON DELETE SET NULL
);

CREATE INDEX campaigns_org_status_idx ON public.campaigns (organization_id, status);

CREATE TRIGGER campaigns_set_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Campaign questions (immutable after freeze)
-- ---------------------------------------------------------------------------
CREATE TABLE public.campaign_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL,
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
  source_template_question_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT campaign_questions_prompt_not_blank CHECK (length(trim(prompt)) > 0),
  CONSTRAINT campaign_questions_campaign_org_fk
    FOREIGN KEY (campaign_id, organization_id)
    REFERENCES public.campaigns (id, organization_id)
    ON DELETE CASCADE
);

CREATE INDEX campaign_questions_campaign_idx
  ON public.campaign_questions (campaign_id, sort_order);

-- ---------------------------------------------------------------------------
-- Subjects
-- ---------------------------------------------------------------------------
CREATE TABLE public.campaign_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL,
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  person_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, person_id),
  CONSTRAINT campaign_subjects_campaign_org_fk
    FOREIGN KEY (campaign_id, organization_id)
    REFERENCES public.campaigns (id, organization_id)
    ON DELETE CASCADE,
  CONSTRAINT campaign_subjects_person_org_fk
    FOREIGN KEY (person_id, organization_id)
    REFERENCES public.people (id, organization_id)
    ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- Assignments
-- ---------------------------------------------------------------------------
CREATE TABLE public.campaign_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL,
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  respondent_person_id uuid NOT NULL,
  subject_person_id uuid,
  relationship text CHECK (
    relationship IS NULL OR relationship IN ('self', 'manager', 'peer', 'direct_report', 'other')
  ),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'opened', 'started', 'submitted', 'bounced', 'revoked')),
  sent_at timestamptz,
  submitted_at timestamptz,
  last_reminded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT campaign_assignments_campaign_org_fk
    FOREIGN KEY (campaign_id, organization_id)
    REFERENCES public.campaigns (id, organization_id)
    ON DELETE CASCADE,
  CONSTRAINT campaign_assignments_respondent_org_fk
    FOREIGN KEY (respondent_person_id, organization_id)
    REFERENCES public.people (id, organization_id)
    ON DELETE CASCADE,
  CONSTRAINT campaign_assignments_subject_org_fk
    FOREIGN KEY (subject_person_id, organization_id)
    REFERENCES public.people (id, organization_id)
    ON DELETE CASCADE
);

CREATE UNIQUE INDEX campaign_assignments_unique_idx
  ON public.campaign_assignments (
    campaign_id,
    respondent_person_id,
    subject_person_id,
    relationship
  ) NULLS NOT DISTINCT;

CREATE INDEX campaign_assignments_campaign_status_idx
  ON public.campaign_assignments (campaign_id, status);

CREATE TRIGGER campaign_assignments_set_updated_at
  BEFORE UPDATE ON public.campaign_assignments
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Access tokens (no authenticated client access)
-- ---------------------------------------------------------------------------
CREATE TABLE public.access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.campaign_assignments (id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  last_used_at timestamptz,
  use_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (token_hash)
);

CREATE INDEX access_tokens_assignment_idx ON public.access_tokens (assignment_id);

-- ---------------------------------------------------------------------------
-- Responses
-- ---------------------------------------------------------------------------
CREATE TABLE public.responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.campaign_assignments (id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL,
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted')),
  progress numeric(5,2) NOT NULL DEFAULT 0,
  submitted_at timestamptz,
  locked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assignment_id),
  CONSTRAINT responses_campaign_org_fk
    FOREIGN KEY (campaign_id, organization_id)
    REFERENCES public.campaigns (id, organization_id)
    ON DELETE CASCADE
);

CREATE TRIGGER responses_set_updated_at
  BEFORE UPDATE ON public.responses
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TABLE public.response_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid NOT NULL REFERENCES public.responses (id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  campaign_question_id uuid NOT NULL REFERENCES public.campaign_questions (id) ON DELETE CASCADE,
  numeric_value numeric,
  text_value text,
  choice_values jsonb NOT NULL DEFAULT '[]'::jsonb,
  saved_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (response_id, campaign_question_id)
);

-- ---------------------------------------------------------------------------
-- Email outbox
-- ---------------------------------------------------------------------------
CREATE TABLE public.email_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  kind text NOT NULL,
  to_email text NOT NULL,
  subject text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
  provider_id text,
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (idempotency_key)
);

CREATE INDEX email_outbox_pending_idx
  ON public.email_outbox (scheduled_for)
  WHERE status IN ('pending', 'failed');

CREATE TRIGGER email_outbox_set_updated_at
  BEFORE UPDATE ON public.email_outbox
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.response_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_outbox ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'campaigns', 'campaign_questions', 'campaign_subjects', 'campaign_assignments',
    'responses', 'response_answers', 'email_outbox'
  ]
  LOOP
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.is_org_admin(organization_id))',
      t || '_select', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_org_admin(organization_id))',
      t || '_insert', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.is_org_admin(organization_id)) WITH CHECK (public.is_org_admin(organization_id))',
      t || '_update', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.is_org_admin(organization_id))',
      t || '_delete', t
    );
  END LOOP;
END $$;

-- Respondents must not write responses via client RLS — RPCs only
DROP POLICY responses_insert ON public.responses;
DROP POLICY responses_update ON public.responses;
DROP POLICY responses_delete ON public.responses;
DROP POLICY response_answers_insert ON public.response_answers;
DROP POLICY response_answers_update ON public.response_answers;
DROP POLICY response_answers_delete ON public.response_answers;

CREATE POLICY access_tokens_deny_authenticated ON public.access_tokens
  FOR ALL TO authenticated
  USING (false)
  WITH CHECK (false);
