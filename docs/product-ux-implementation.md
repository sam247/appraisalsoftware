# Annual appraisal product UX phase

Implemented 18 September 2026 against the supplied Product UX Audit. The audit’s campaign-shaped domain model and annual golden path remain the foundation.

## A. What changed

- Redesigned the branded application shell, Overview and campaign detail. Warm neutral surfaces, jade actions and existing typography/logo are retained.
- Empty Overview explains adding people, creating an appraisal with a template, reviewing and sending. Active Overview uses actual campaign and response data, dates, delivery issues and a relevant next action. No invented activity feed or analytics.
- Creation progresses through details/template → participants → review/send across existing routes. Drafts remain unsent until the user chooses delivery.
- Campaign detail uses People, Participants, Responses and Results. Counts explicitly distinguish employees being reviewed from expected self/manager responses. Sending has one primary control with a now/later choice; early sending and closing are secondary disclosed actions.
- People now exposes existing name/job-title editing and soft archiving. Template and results presentation received focused refinements rather than a rebuild.
- Added shared application loading/error screens and pending form controls.

## B. Screens/routes changed

`/app`, application navigation/layout, `/app/campaigns`, `/app/campaigns/new`, `/app/campaigns/[id]`, `/app/campaigns/[id]/results`, `/app/people`, `/app/templates`, `/app/templates/[id]`, and administrator invitation presentation in `/app/settings`.

Marketing, signup/login, respondent UI, APIs, database migrations, authentication, cron jobs and email infrastructure are unchanged.

## C. Functionality preserved

The existing draft → employee self/manager selection → freeze/schedule/activation → secure respondent form → Self vs Manager results path is retained. Existing database RPCs remain responsible for freezing questions, activating campaigns and closing/revoking outstanding access. Activation retains its best-effort outbox nudge. Built-in template seeding, outbox/Resend, scheduling and respondent token/security behaviour are untouched. Archived people remain identifiable in campaign history and results.

## D. Bugs fixed

- Participant editor hydrates saved employees and manager selections instead of starting empty.
- Unsaved participant changes hide sending controls until saved.
- Creation requires an organisation-owned, available template containing questions; existing incomplete drafts can choose a usable template before sending.
- Unsupported template types produce an error instead of silently becoming text. New-question controls offer the fully configured text/rating paths; existing built-in question types are retained.
- Schedule dates reject malformed/impossible/past values and dates after the close date. Invalid input no longer falls back to the current time.
- Scheduling checks saved reviewers before freezing. UTC send timing is explicit in the interface rather than relying on the server’s local timezone.
- Participant input is checked before replacement; deletion errors are no longer ignored.
- People write failures are reported rather than silently ignored.
- Settings reads the actual `inviteUrl` returned by the existing invitation action. Copy/share instructions accurately describe administrator invitations without obsolete Phase 1 email messaging.
- Data loading failures on redesigned screens show an error state instead of masquerading as an empty workspace.

## E. Mobile

A labelled, accessible application drawer replaces the logo-only mobile header. It uses the existing dialog component for focus trapping, Escape handling and focus restoration, closes after navigation, and includes sign out. Campaign headers/actions wrap; participant controls remain usable; Self/Manager answers stack on narrow screens. Checked at 390×844 and desktop 1440×1000; checked screens had no horizontal overflow.

## F. Validation

- Typecheck: passed.
- Changed-file lint, including newly added application files: passed.
- Existing tests plus nine focused UX safeguard checks: 26 tests passed across four files.
- Production build: passed.
- Browser verification against the real local Next application and an isolated in-memory Supabase-compatible service: empty/active Overview, mobile drawer navigation, People create/edit/archive, campaign creation, template selection, employee/manager selection, saved-state hydration, unsaved-send protection, scheduling, activation, both respondent submissions, displayed Self vs Manager results, archived-person history and closing passed. No browser exceptions; desktop/mobile screenshots inspected.

The local service simulated database RPC effects. This verifies UI/action wiring, not live PostgreSQL execution, token cryptography, scheduler execution or external email delivery. Production accounts, organisations, campaigns and emails were not created or changed. Production lifecycle SQL and respondent/API implementations were inspected and preserved. The runnable regression checks are in `src/app/app/campaigns/ux.test.ts` and run with `npm test`.

## G. Intentionally deferred

Advanced question editing/reordering/deletion UI, choice/scale configuration, richer template previews, persistent manager defaults on People profiles, activity feeds, additional results analytics and broader Settings redesign. These should receive their own coherent implementation pass. Billing, 360 backend and anonymity remain out of scope and planned; the application makes no availability claim for them.

## H. Future backend requirements

The existing participant save action replaces rows in several requests. A database transaction with a campaign row lock is needed to guarantee atomic replacement and prevent a concurrent activation/edit race. This phase validates inputs before replacement and stops on errors, but intentionally does not introduce a migration or claim rollback guarantees.

Organisation-local scheduling requires a timezone-aware send-time contract across configuration and scheduling. This phase preserves a single explicit 09:00 UTC send time. Activity history, campaign attention workflows beyond existing delivery statuses, and richer analytics need supporting data contracts before being presented as available capabilities.
