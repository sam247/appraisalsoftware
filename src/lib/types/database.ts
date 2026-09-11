/**
 * Hand-authored types derived from the Supabase schema.
 * Regenerate with: npx supabase gen types typescript --linked > src/lib/types/database.ts
 */

export type OrgRole = "owner" | "admin" | "member";
export type QuestionType =
  | "rating"
  | "single_choice"
  | "multi_choice"
  | "text"
  | "nps";

// Phase 2 enums
export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "closed"
  | "archived";
export type CampaignType =
  | "annual_appraisal"
  | "feedback_360"
  | "self_assessment"
  | "manager_review"
  | "probation_review"
  | "employee_feedback"
  | "custom";
export type AssignmentStatus =
  | "pending"
  | "sent"
  | "opened"
  | "started"
  | "submitted"
  | "bounced"
  | "revoked";
export type AssignmentRelationship =
  | "self"
  | "manager"
  | "peer"
  | "direct_report"
  | "other";
export type ResponseStatus = "in_progress" | "submitted";
export type OutboxStatus = "pending" | "sending" | "sent" | "failed";

// ─── Row types ───────────────────────────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  brand_color: string;
  timezone: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrgRole;
  invited_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationInvitation {
  id: string;
  organization_id: string;
  email: string;
  role: OrgRole;
  token_hash: string;
  invited_by: string | null;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

export interface Person {
  id: string;
  organization_id: string;
  email: string;
  full_name: string | null;
  job_title: string | null;
  manager_person_id: string | null;
  external_id: string | null;
  user_id: string | null;
  archived_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  campaign_type_default: string;
  settings: Record<string, unknown>;
  archived_at: string | null;
  cloned_from_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TemplateQuestion {
  id: string;
  template_id: string;
  organization_id: string;
  sort_order: number;
  type: QuestionType;
  prompt: string;
  help_text: string | null;
  required: boolean;
  options: unknown[];
  scale: Record<string, unknown>;
  stable_key: string | null;
  competency_key: string | null;
  competency_label: string | null;
  section_key: string | null;
  section_label: string | null;
  created_at: string;
}

// ─── Phase 2 Row types ───────────────────────────────────────────────────────

export interface Campaign {
  id: string;
  organization_id: string;
  name: string;
  campaign_type: CampaignType;
  status: CampaignStatus;
  template_id: string | null;
  settings: Record<string, unknown>;
  reminder_settings: Record<string, unknown>;
  opens_at: string | null;
  closes_at: string | null;
  timezone: string;
  questions_frozen_at: string | null;
  send_claimed_at: string | null;
  schedule_error: string | null;
  schedule_attempts: number;
  cloned_from_campaign_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignQuestion {
  id: string;
  campaign_id: string;
  organization_id: string;
  sort_order: number;
  type: string;
  prompt: string;
  help_text: string | null;
  required: boolean;
  options: unknown[];
  scale: Record<string, unknown>;
  stable_key: string | null;
  competency_key: string | null;
  competency_label: string | null;
  section_key: string | null;
  section_label: string | null;
  source_template_question_id: string | null;
  created_at: string;
}

export interface CampaignSubject {
  id: string;
  campaign_id: string;
  organization_id: string;
  person_id: string;
  created_at: string;
}

export interface CampaignAssignment {
  id: string;
  campaign_id: string;
  organization_id: string;
  respondent_person_id: string;
  subject_person_id: string | null;
  relationship: AssignmentRelationship | null;
  status: AssignmentStatus;
  sent_at: string | null;
  submitted_at: string | null;
  last_reminded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AccessToken {
  id: string;
  assignment_id: string;
  organization_id: string;
  token_hash: string;
  expires_at: string;
  revoked_at: string | null;
  last_used_at: string | null;
  use_count: number;
  created_at: string;
}

export interface Response {
  id: string;
  assignment_id: string;
  campaign_id: string;
  organization_id: string;
  status: ResponseStatus;
  progress: number;
  submitted_at: string | null;
  locked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResponseAnswer {
  id: string;
  response_id: string;
  organization_id: string;
  campaign_question_id: string;
  numeric_value: number | null;
  text_value: string | null;
  choice_values: unknown[];
  saved_at: string;
}

export interface EmailOutbox {
  id: string;
  organization_id: string;
  kind: string;
  to_email: string;
  subject: string;
  payload: Record<string, unknown>;
  idempotency_key: string;
  status: OutboxStatus;
  provider_id: string | null;
  attempts: number;
  last_error: string | null;
  scheduled_for: string;
  created_at: string;
  updated_at: string;
}

// ─── Database shape (for createServerClient / createBrowserClient) ─────────
// Insert types use explicit optional fields matching DB schema defaults.

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: Organization;
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          brand_color?: string;
          timezone?: string;
          settings?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          logo_url?: string | null;
          brand_color?: string;
          timezone?: string;
          settings?: Record<string, unknown>;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      organization_members: {
        Row: OrganizationMember;
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role: OrgRole;
          invited_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          role?: OrgRole;
          invited_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      organization_invitations: {
        Row: OrganizationInvitation;
        Insert: {
          id?: string;
          organization_id: string;
          email: string;
          role: OrgRole;
          token_hash: string;
          invited_by?: string | null;
          expires_at: string;
          accepted_at?: string | null;
          revoked_at?: string | null;
          created_at?: string;
        };
        Update: {
          accepted_at?: string | null;
          revoked_at?: string | null;
        };
        Relationships: [];
      };
      people: {
        Row: Person;
        Insert: {
          id?: string;
          organization_id: string;
          email: string;
          full_name?: string | null;
          job_title?: string | null;
          manager_person_id?: string | null;
          external_id?: string | null;
          user_id?: string | null;
          archived_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          job_title?: string | null;
          manager_person_id?: string | null;
          external_id?: string | null;
          user_id?: string | null;
          archived_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      templates: {
        Row: Template;
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          description?: string | null;
          campaign_type_default?: string;
          settings?: Record<string, unknown>;
          archived_at?: string | null;
          cloned_from_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          campaign_type_default?: string;
          settings?: Record<string, unknown>;
          archived_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      template_questions: {
        Row: TemplateQuestion;
        Insert: {
          id?: string;
          template_id: string;
          organization_id: string;
          sort_order?: number;
          type: QuestionType;
          prompt: string;
          help_text?: string | null;
          required?: boolean;
          options?: unknown[];
          scale?: Record<string, unknown>;
          stable_key?: string | null;
          competency_key?: string | null;
          competency_label?: string | null;
          section_key?: string | null;
          section_label?: string | null;
          created_at?: string;
        };
        Update: {
          sort_order?: number;
          type?: QuestionType;
          prompt?: string;
          help_text?: string | null;
          required?: boolean;
          options?: unknown[];
          scale?: Record<string, unknown>;
          stable_key?: string | null;
          competency_key?: string | null;
          competency_label?: string | null;
          section_key?: string | null;
          section_label?: string | null;
        };
        Relationships: [];
      };
      campaigns: {
        Row: Campaign;
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          campaign_type?: CampaignType;
          status?: CampaignStatus;
          template_id?: string | null;
          settings?: Record<string, unknown>;
          reminder_settings?: Record<string, unknown>;
          opens_at?: string | null;
          closes_at?: string | null;
          timezone?: string;
          questions_frozen_at?: string | null;
          cloned_from_campaign_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          campaign_type?: CampaignType;
          status?: CampaignStatus;
          template_id?: string | null;
          settings?: Record<string, unknown>;
          reminder_settings?: Record<string, unknown>;
          opens_at?: string | null;
          closes_at?: string | null;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      campaign_questions: {
        Row: CampaignQuestion;
        Insert: {
          id?: string;
          campaign_id: string;
          organization_id: string;
          sort_order?: number;
          type: string;
          prompt: string;
          help_text?: string | null;
          required?: boolean;
          options?: unknown[];
          scale?: Record<string, unknown>;
          stable_key?: string | null;
          competency_key?: string | null;
          competency_label?: string | null;
          section_key?: string | null;
          section_label?: string | null;
          source_template_question_id?: string | null;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      campaign_subjects: {
        Row: CampaignSubject;
        Insert: {
          id?: string;
          campaign_id: string;
          organization_id: string;
          person_id: string;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      campaign_assignments: {
        Row: CampaignAssignment;
        Insert: {
          id?: string;
          campaign_id: string;
          organization_id: string;
          respondent_person_id: string;
          subject_person_id?: string | null;
          relationship?: AssignmentRelationship | null;
          status?: AssignmentStatus;
          sent_at?: string | null;
          submitted_at?: string | null;
          last_reminded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: AssignmentStatus;
          sent_at?: string | null;
          submitted_at?: string | null;
          last_reminded_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      responses: {
        Row: Response;
        Insert: {
          id?: string;
          assignment_id: string;
          campaign_id: string;
          organization_id: string;
          status?: ResponseStatus;
          progress?: number;
          submitted_at?: string | null;
          locked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: ResponseStatus;
          progress?: number;
          submitted_at?: string | null;
          locked_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      response_answers: {
        Row: ResponseAnswer;
        Insert: {
          id?: string;
          response_id: string;
          organization_id: string;
          campaign_question_id: string;
          numeric_value?: number | null;
          text_value?: string | null;
          choice_values?: unknown[];
          saved_at?: string;
        };
        Update: {
          numeric_value?: number | null;
          text_value?: string | null;
          choice_values?: unknown[];
          saved_at?: string;
        };
        Relationships: [];
      };
      email_outbox: {
        Row: EmailOutbox;
        Insert: {
          id?: string;
          organization_id: string;
          kind: string;
          to_email: string;
          subject: string;
          payload?: Record<string, unknown>;
          idempotency_key: string;
          status?: OutboxStatus;
          provider_id?: string | null;
          attempts?: number;
          last_error?: string | null;
          scheduled_for?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: OutboxStatus;
          provider_id?: string | null;
          attempts?: number;
          last_error?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      bootstrap_organization: {
        Args: { org_name: string };
        Returns: string;
      };
      is_org_admin: {
        Args: { p_organization_id: string };
        Returns: boolean;
      };
      is_org_member: {
        Args: { p_organization_id: string };
        Returns: boolean;
      };
      is_org_owner: {
        Args: { p_organization_id: string };
        Returns: boolean;
      };
      freeze_campaign_questions: {
        Args: { p_campaign_id: string };
        Returns: void;
      };
      activate_campaign: {
        Args: { p_campaign_id: string };
        Returns: void;
      };
      respond_resolve: {
        Args: { p_raw_token: string };
        Returns: Array<{
          assignment_id: string;
          campaign_id: string;
          organization_id: string;
          respondent_person_id: string;
          subject_person_id: string | null;
          relationship: string | null;
          assignment_status: string;
          campaign_name: string;
          campaign_status: string;
          closes_at: string | null;
          response_id: string;
          response_status: string;
        }>;
      };
      respond_save: {
        Args: { p_raw_token: string; p_answers: unknown[] };
        Returns: void;
      };
      respond_submit: {
        Args: { p_raw_token: string; p_answers: unknown[] };
        Returns: void;
      };
      respond_get_questions: {
        Args: { p_raw_token: string };
        Returns: Array<CampaignQuestion>;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
