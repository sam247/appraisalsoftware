# Local verification — 4 October 2026

## Implementation evidence

- All 50 CSV terms have ownership or exclusion. UK intent is supported at family level by dated sources in the release runbook; neither UK volume nor Google UK positions were manufactured.
- Six articles remain drafts. Tests verify exclusion from published posts/sitemap and validate their internal destinations. Existing URLs and article anchors are preserved.
- Shared pricing is Trial 75/5/3, Pro 75/5/3 and Organisation 250/20/10. Public trial wording is gated; paid pricing is unchanged. Existing workspaces are grandfathered by the migration.
- Database guards cover operational tables, both respondent write pipelines, campaign activation/scheduling, invitation seat reservations, reminders and outbox claiming. Worker delivery rechecks immediately before Resend. Manual activation validates capacity and retains original trial dates.
- GA4 has a fixed event-only contract without caller metadata. Consent controls tag loading; public page views omit queries and referrer paths. Dashboard/respondent page views are excluded. Cross-domain linking uses the marketing/app hosts.

## Product-claim audit

| Claim | Authoritative implementation / boundary |
|---|---|
| Identified annual reviews and Self vs Manager results | Annual campaign/assignment/response pipeline and annual results UI; no claim of anonymous annual reviews |
| Anonymous 360 reporting | `20260918190000_360_private_foundation.sql` separates answers/identity in private tables; ordinary users have no private grants, trusted service operators do |
| Five-response release | `feedback_360_report` requires closed/archived campaign and at least five submitted responses |
| Question-level suppression | Report includes only questions with at least five valid rating or nonblank text answers; no demographic/reviewer-group comparison promised |
| Reviewer completion visibility | Assignments retain invitation/completion state; reports omit identity links. Comments can still identify their author through wording/context |
| Personal links, scheduling and reminders | Existing annual/360 workflow migrations and cron/outbox; campaign dates, closing and incomplete assignments govern delivery |
| Reusable templates | Existing workspace template copying/local campaign form architecture; resources copy/print remain ungated |
| Trial dates/capacity/expiry | New private entitlement migration and service-only manual activation; UI flags never enforce access |
| Follow-up actions/objectives | Agreed outside the collected review/report workflow; supporting content does not imply a new goal-tracking system |

## Checks performed

- `npm test`: 115 tests in 18 files passed, including consent acceptance/rejection/withdrawal, duplicate prevention, safe payloads, release gates, draft publication discipline, contact-handler cases and existing product checks.
- `node scripts/check-production-safeguards.mjs`: passed against disposable local PostgreSQL. Includes all existing annual/360 workflow/privacy/concurrency checks plus trial bootstrap retry, 14-day interval, permissions, employee/active-campaign/admin boundaries, external reviewers, exact expiry, blocked participant writes, retained answers, background claiming, campaign cleanup and manual restoration. A two-session race for the last employee seat admits exactly one insert.
- Typecheck and production build passed. Lint has no errors and one existing unused login `searchParams` warning. Supabase emits its existing Node 20 deprecation warning. `git diff --check` passed.
- Production preview priority routes: homepage, pricing, resources, how-it-works, contact and three product pages had one H1, self-canonicals, no document overflow and no completed image failures at 390 CSS pixels. Exact 768 and 1440 checks passed for homepage, pricing, resources, how-it-works, contact and 360 software. Earlier parity verification covers every public route and template copy/print; see `docs/marketing-parity-validation.md`.
- Separate local development preview with trial/GA4 flags enabled verified the three-plan trial proposition. Google tag/collection requests were blocked through browser network controls throughout consent testing. Before consent no tag existed; Analytics consent saved through keyboard controls loaded exactly one tag with one sanitised pricing page view. Rejection persisted across navigation and prevented tag loading. Temporary device/network controls and the test preview were removed afterwards.

## Publication status and remaining evidence

A is recorded locally and in BR. B is implemented and locally verified; hosted staging verification is outstanding. C is local. D/E articles remain excluded drafts. No production migration, deployment, public trial activation, GA4 enablement or article release has occurred.

Hosted checks are enumerated in `release.md`: staging entitlement paths, configured cron, real provider/inbox contact delivery, Search Console selected-canonical inspection, actual GA4 request/DebugView checks and key-event settings, live post-release performance/query comparison. Enhanced measurement was confirmed disabled by Sam. No real analytics event was sent during the local browser checks. No review automations were created.
