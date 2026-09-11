/**
 * Phase 1 architecture decisions — blockers resolved before build.
 * Update this file at each phase boundary; do NOT delete old entries.
 */

export const PHASE_1_DECISIONS = {
  /**
   * Region: Accept the current Appraisal Supabase project (EU region).
   * No migration needed in Phase 1; revisit if latency becomes a concern.
   */
  region: "eu-west — existing project accepted for Phase 1",

  /**
   * Host: App lives at /app/* on the same Next.js origin.
   * No subdomain, no separate deployment. Simplifies auth cookies.
   */
  host: "/app on same origin — no subdomain for Phase 1",

  /**
   * Auth: Email + password (+ optional magic link on login page).
   * No OAuth providers in Phase 1.
   */
  auth: "email/password (magic link optional on login)",

  /**
   * Roles: owner and admin roles shown in UI; member enum exists in schema
   * but is not surfaced in Phase 1 UI. Invite flow creates admin members only.
   */
  memberRole: "schema: owner | admin | member — UI: owner + admin only",

  /**
   * Org model: single org per user enforced by bootstrap_organization RPC
   * (raises 'already_has_org' if membership row already exists for user).
   */
  orgModel: "single org per user — enforced in bootstrap_organization RPC",
} as const;

/**
 * Phase 1 security / RLS review (gate before Phase 2).
 * Verified against live Appraisal Supabase project advisors + schema inspection.
 */
export const PHASE_1_SECURITY_REVIEW = {
  reviewedAt: "2026-09-11",
  rlsEnabledOnAllPublicTables: true,
  tables: [
    "organizations",
    "profiles",
    "organization_members",
    "organization_invitations",
    "people",
    "templates",
    "template_questions",
  ] as const,
  accessModel: "owner/admin only via is_org_admin(); member role not granted product SELECT",
  anonCannotExecuteDefinerRpcs: true,
  authenticatedDefinerRpcsIntentional: [
    "bootstrap_organization",
    "create_organization_invitation",
    "accept_organization_invitation",
    "is_org_admin",
    "is_org_member",
    "is_org_owner",
  ] as const,
  lastOwnerProtected: true,
  organizationIdOnNestedTables: ["template_questions"],
  advisorResidualWarnings:
    "Supabase linter warns that authenticated users can execute SECURITY DEFINER RPCs — intentional for signup/invite helpers; functions check auth.uid() internally.",
  signOff: "Phase 1 RLS/security accepted — proceed to Phase 2 golden path",
} as const;

export const PHASE_2_STATUS = {
  shippedAt: "2026-09-11",
  goldenPath:
    "Annual appraisal: multi-subject → self+manager assignments → freeze → activate → outbox fake-send → /r/[token] respond → Self vs Manager results",
  email: "Outbox queued; drain_email_outbox marks sent without Resend (Phase 2)",
  notIncluded: [
    "360 / anonymity modes",
    "groups",
    "competency analytics",
    "Resend delivery",
    "scheduler cron automation",
  ],
} as const;
