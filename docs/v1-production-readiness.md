# V1 production safeguards — 18 September 2026

Baseline: `86be1f0`. Release branch: `codex/v1-production-safeguards`.

This release completes Phase 1 and related annual respondent safeguards. It preserves the established campaign UX and marketing site. It is **not commercially complete V1**: anonymous 360 and subscriptions are not implemented or enabled. The missing separately supplied Cursor audit is not a blocker; the existing implementation and UX report are the current baseline.

## A. Ready status

The annual participant and scheduling changes are implemented and validated locally, with actual PostgreSQL execution as well as browser checks. Production readiness remains conditional on applying both migrations and verifying the deployed environment. No production database, account, email or subscription was changed.

The working annual path is retained: draft → employee/manager assignment → freeze/schedule/send → personal respondent link → Self vs Manager results → close/revoke. Built-in template seeding, authentication architecture, campaign lifecycle RPCs, cron and Resend transport remain in place. Results now display the configured rating maximum and selected choices faithfully.

## B. Backend changes

- Participant replacement is a single authenticated database RPC. It validates tenant ownership, distinct employees, manager availability and editable annual draft state, then replaces people and reviewer rows in one transaction. Archived selections already on a draft can be preserved. Failures leave the previous rows intact.
- Participant saving and scheduling use the parent campaign lock already used by activation and closing. Scheduling checks participants and questions and freezes/updates within one transaction; failed scheduling does not leave newly frozen questions behind.
- Respondent save and submit retain their API contracts. They acquire a shared campaign lock and exclusive reviewer lock, enforce active/open access and reject late saves after submission. Different reviewers can save concurrently; closure waits for a current write and subsequent writes fail.
- Answer writes enforce campaign/organisation ownership, supported answer types, rating bounds and available choices. Submission checks required answers in the database rather than trusting the browser.
- A bearer-scoped saved-answer RPC returns only that reviewer's unfinished answers. The respondent page hydrates them and fails visibly when questions or saved progress cannot load. Autosaving does not disable the Submit button, and transport failures retain answers and show a retry message.

## C. Migrations and release procedure

New migrations, in order:

1. `supabase/migrations/20260918160000_atomic_participants_and_local_scheduling.sql`
2. `supabase/migrations/20260918163000_respondent_write_safeguards.sql`

They add guarded RPCs/triggers, tighten grants and draft-insert policy, and preserve existing rows and absolute schedule timestamps. No bulk timezone rewrite or destructive data migration is included. New writes reject invalid named campaign timezones; historical invalid timezone values should be checked before rollout.

**Neither migration has been applied to production.** The local checkout has no linked Supabase project reference. Do not publish the frontend on its own: it requires these RPCs. Applying the first migration denies older clients' direct participant replacements and scheduling updates, so coordinate the database and application release during a maintenance window.

Release sequence:

1. Verify the intended Supabase project, backup/recovery arrangements and migration history. Inspect existing campaign timezones against PostgreSQL's named zones.
2. Rehearse both migrations and the release against a staging project. Confirm authenticated grants, RLS and public respondent RPC availability through actual Supabase/PostgREST.
3. Apply both migrations together, then deploy this release promptly. Avoid participant editing/scheduling during the deployment gap.
4. Check signup/template seeding, participant saving, future scheduling, personal-link resume/submit, results and close on isolated staging data. Confirm deployed cron, provider settings and production origin without emailing real customers.
5. Merge/push main only as part of this coordinated release. A frontend-only rollback to `86be1f0` is insufficient because its direct writes are now denied; prefer rolling forward or a separately reviewed grant/RPC-compatible rollback.

## D. 360 status

The schema already contains a 360 campaign type, reviewer relationships and question competency metadata. These are useful foundations, but no supported creation/monitoring/results workflow was completed in this release. Annual creation and Self vs Manager results remain the supported product. Existing planned-capability messaging is preserved. The 360 golden path was not exercised because it is not implemented.

## E. Anonymity model and blocker

**No anonymity guarantee exists or is claimed by this release.** Current answers join through responses → assignments → reviewer people, and tenant administrators can read those tables. Hiding names or adding a results threshold would not prevent identification. Administrator-editable JSON anonymity settings are also unsuitable as the sole security boundary. Reviewer-level completion states and response timestamps can create timing/correlation disclosure even after names are hidden.

Before supporting anonymous 360, implement and test:

- An immutable campaign privacy contract, enforced by guarded database transitions; normal administrators must not change anonymous campaigns into identified ones.
- Separation or strict database access controls preventing normal administrators from reading raw anonymous response/answer/identity links. Use a guarded results aggregation endpoint; preserve identified annual access.
- Cohort suppression across reviewer relationships, written feedback and combined results. Decide/document the minimum cohort size rather than inventing an enabled threshold. Consider releasing anonymous results only after closure to reduce incremental/timing inference.
- Anonymous-safe monitoring without person-level response timing, IDs or identifiable exports; audit application/server logs and all token-bearing paths. Outbox bearer payloads are already service-only in this release.
- A clear threat model distinguishing tenant administrators from trusted platform/database operators, plus respondent wording about self-identifying free text.

These are material privacy architecture/product decisions, so this pass stops at the validated annual boundary rather than exposing cosmetic anonymity.

## F. Timezones

Existing `timestamptz` storage remains the source of truth for cron and outbox timing. New campaigns copy the organisation's named timezone, with `Europe/London` as the safe default. A calendar send date resolves to **09:00 in the campaign timezone** in PostgreSQL, using its timezone rules: 09:00 GMT is 09:00 UTC; 09:00 BST is 08:00 UTC. Close dates include the entire local calendar day, ending one millisecond before the next local midnight.

The UI explains local scheduling and displays campaign dates in that timezone rather than the browser/server default. New invite/reminder outbox rows snapshot the campaign timezone, and deadline email formatting uses it. Legacy payloads use the UK default. Existing stored send/close instants are unchanged. Cron still compares absolute instants and its existing cadence can introduce normal delivery delay; this does not promise email arrival at exactly 09:00. Reminder cadence remains elapsed-time based.

## G. Stripe/billing

Not implemented or enabled. The repository has no launch subscription model, Stripe integration, price IDs or defined entitlements. This phase follows the requested order: billing comes after a sound appraisal and 360 workflow.

Future integration should attach subscription state to the organisation and use hosted Checkout/Customer Portal, signature-verified idempotent webhooks and a durable local billing-state projection. Keep existing app data independent of Stripe and define outage/grace behaviour explicitly. Required product/configuration decisions: prices/currency/intervals, free/trial policy, annual/360 entitlements and limits, cancellation/past-due grace, Stripe product/price IDs, webhook secret and portal configuration. No prices or limits were invented.

## H. Security fixes and limits

- Direct authenticated/anonymous writes to campaign participant/question rows are denied; lifecycle and schedule columns cannot be updated through generic table endpoints. Guarded RPCs retain service/admin boundaries. Campaign insert policy requires an unfrozen draft.
- Tenant administrators no longer have access to outbox payloads containing raw personal bearer links. Service email delivery retains access.
- A valid token cannot write an answer against a question from another campaign or organisation. Invalid choices/ratings fail rather than silently converting values.
- Required answers are enforced server-side. Respondent writes are serialized against submission and closing, preventing stale saves from overwriting submitted responses.
- Saved-answer access requires the personal active, unexpired, unrevoked token and returns only its unfinished response; invalid/closed links fail.

Existing hashed token generation, email infrastructure, auth and identified annual result access are preserved. This is a focused review, not a claim that every production attack surface has been independently audited. True anonymous response protection remains a launch blocker.

## I. Validation

- `npm run typecheck`: passed.
- Changed-file ESLint, including new checks: passed.
- `npm test`: **30 tests across five files passed**, including action/RPC wiring and UK transition/email formatting tests.
- `npm run build`: passed. Existing Supabase warning recommends upgrading the Node runtime beyond Node 20; no dependency/runtime upgrade was bundled.
- `node scripts/check-production-safeguards.mjs`: passed against a disposable **PostgreSQL 17** cluster loading all repository migrations. Checks cover forced mid-replacement rollback retaining original rows, tenancy/grants, GMT/BST boundaries, full local close dates, failed scheduling rollback, freeze/activation, actual hashed-token responses, cross-campaign rejection, required fields, choices, saved-answer isolation, public-token access, closing/revocation, due activation/closure, outbox acknowledgement and real concurrent activation/edit and submit/save races.
- Browser verification used the real Next application with an isolated local Supabase-compatible fixture: empty/active workspaces; desktop and 390px mobile navigation; People create/edit/archive; template selection; campaign creation; saved participant hydration; unsaved-send protection; schedule/send; self/manager submissions; saved-answer reload; Submit immediately after a rating interaction; displayed results; preserved archived history; closing. No browser exceptions or horizontal overflow. Desktop/mobile screenshots were inspected.

The database check uses locally emulated Supabase auth functions/roles and real PostgreSQL RLS/RPCs. The browser fixture simulates API/database effects. Neither proves live GoTrue authentication, hosted PostgREST behaviour or actual external email delivery. Signup/bootstrap SQL is covered locally; live signup and provider delivery need staging verification. No production test data or real email was generated.

Runnable database check requires PostgreSQL binaries (default Homebrew PostgreSQL 17 path, or set `PG_BIN` to their directory). It creates and destroys its own loopback-only cluster and never accepts a production database URL. No new package dependency was added.

## J. Remaining launch blockers

1. Coordinate/apply both migrations and deploy; verify hosted Supabase grants/RPCs and the staging annual golden path, including auth/signup and email delivery.
2. Implement the security-backed anonymity model and full 360 creation, reviewer assignment, monitoring, closure and suppressed/grouped results; exercise the real 360 golden path with tenant/admin disclosure tests.
3. Decide the commercial rules and integrate/test Stripe, entitlements and subscription lifecycle once both core workflows are sound.
4. Confirm production cron/secrets/provider/domain settings, recovery procedures and runtime support as part of deployment verification.

## K. Post-V1 backlog

Activity feeds, advanced/trend/organisation-wide analytics, AI summaries, benchmarking, advanced template editing, HRIS/hierarchy, goals/OKRs and unrelated integrations remain deferred. No working screen was redesigned for aesthetic preference.
