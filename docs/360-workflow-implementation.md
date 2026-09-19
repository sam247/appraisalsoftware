# 360 workflow implementation — 18 September 2026

Baseline: `fcc3204`, branch `codex/360-privacy-foundation`. The approved private-plane architecture is preserved. **360 remains disabled; do not enable it in production yet.**

## A. Golden path

Implemented: atomic draft creation with one subject, five or more distinct reviewers and a rating/text template; frozen questionnaire and immutable privacy contract; UK-local scheduling; secure invitation token minting through the existing outbox; private reviewer saves/resume; final idempotent submission; public operational completion updates; closing/revocation; five-response closed-only aggregate reporting.

The complete path passes disposable PostgreSQL integration tests. Customer-facing browser verification was interrupted by the Mac crash: its temporary fixtures disappeared. The annual/360 browser paths must be recreated and verified before release; database success is not a substitute.

## B. Screens/routes

- `/dashboard/campaigns/new?type=360`: subject, reviewers/relationship labels, compatible template, deadline and fixed anonymity acknowledgement. Server action and database validate the setup.
- `/dashboard/campaigns/[id]`: 360 draft review, saved reviewer/question preview, scheduling/sending, completion, automatic reminder explanation and closing. Setup is locked after creating the draft; create a fresh draft to change subject/reviewers/questions.
- `/dashboard/campaigns/[id]/results`: dedicated anonymous aggregate results, open-campaign and insufficient-response states. No identified result queries run for 360.
- `/r/[token]`: dedicated private-plane anonymous context, saved answers, explicit privacy/free-text warning and final-submission acknowledgement.
- `/api/respond`: token-derived campaign dispatch; no client-supplied campaign type is trusted. Database errors on the anonymous path are presented without internal linkage details.
- Campaign lists distinguish anonymous 360. Overview does not offer live anonymous responses.

## C. Invitations/email

360 activation validates the private contract, at least five distinct pending reviewers, future deadline and available reviewers. It creates hashed personal tokens and existing `appraisal_invite` outbox rows atomically. 360 copy names the subject and explains the five-reviewer/closed-only policy, written-comment risks and trusted-operator limit. Original annual activation is preserved in a private function behind the unchanged public RPC. Existing outbox/provider delivery is reused; no production email was sent.

The existing three-day cadence reminder engine is reused. The outbox trigger adds authoritative campaign type/timezone and correct 360 reminder subject/copy. Completed reviewers are excluded. No anonymous payload is placed in the outbox.

## D. Respondents

`feedback_360_open` returns only the campaign/subject/organisation display names, question fields and this personal token's saved answers. It returns no assignment, reviewer, mapping or feedback IDs or response timestamps. `feedback_360_write` uses shared campaign and exclusive reviewer locks, rechecks token validity after waiting, writes only private answers, and atomically finalises private feedback and operational completion. Required/type/bounds/campaign checks remain database-enforced. Submission retries while still open are idempotent; late saves fail. Closed, expired and revoked links fail. A reviewer can access their own draft using their bearer link; keeping that link secret remains essential.

## E–H. Monitoring, closure, thresholds and results

Administrators see identity/delivery/completion information without feedback linkage. The cockpit omits operational timestamps from its assignment projection. Ordinary database assignment queries may still contain operational times; anonymous feedback has no exposed times or open result stream to correlate with them.

Existing close/deadline cron functions remain responsible for closing and revoking outstanding links. Results stay unavailable before closure. Five distinct external reviewers are required; each reported question separately needs five non-empty valid answers. No relationship-level results or self comparison are implemented. Insufficient responses cannot be released by lowering a setting. Available results show combined rating averages/counts and lexical, independently ordered text comments; suppressed question material is absent.

## I–J. Guarantee and limitations

Ordinary administrators, subjects, managers, members, other reviewers and cross-tenant users cannot query private feedback or its invitation mapping. Administrator reports contain no system-added identity linkage, individual rating records, response IDs or response chronology. Reviewer endpoints expose only the bearer-holder's own draft. The identified annual response pipeline refuses 360 records.

Trusted service/database/infrastructure operators can join identity and feedback and remain outside the anonymity guarantee. Arbitrary written text, collusion, fake reviewer identities, crafted questions, shared invitation links and outside knowledge may identify authors. Five is a documented product floor against trivial small-group disclosure, not mathematical anonymity. No claims of protection against platform operators or semantic identification are made.

## K–L. Validation

After the crash, rerun results: typecheck passed; changed-file/new-file lint passed; 30 application tests and the production build passed. The PostgreSQL runner passed with all migrations and both privacy-foundation and full-workflow suites. It verifies private ACL/RLS even after simulated accidental grants, role/tenant denial, immutable privacy/submitted data, duplicate reviewers, answer validity, threshold suppression, report sanitisation, real creation/scheduling/token minting, save/resume isolation, required fields, cross-campaign question denial, identified-pipeline refusal, duplicate submission, completion, outstanding-only reminder enqueue, closure and result release. Existing annual signup/bootstrap, participant rollback/tenancy, GMT/BST, activation, identified responses/results, outbox acknowledgement, close/revoke and actual annual concurrency checks pass.

The database uses real PostgreSQL with local Supabase auth emulation. Hosted PostgREST/auth, real provider delivery and the new 360 browser path remain unverified. Explicit anonymous concurrency races, individual revocation and expiry scenarios should be added before enabling; the implemented lock/expiry checks are not sufficient evidence on their own.

## M. Migration/deployment order

Apply pending migrations in this order after checking the target project's migration history:

1. Previous annual safeguards `20260918160000` and `20260918163000` (user reports previously deployed).
2. Privacy foundation `20260918190000_360_private_foundation.sql`.
3. Workflow `20260918210000_360_campaign_workflow.sql`.

Do not apply production migrations automatically. Rehearse against staging first. The new respondent routing requires the workflow RPCs even for annual personal links, so **apply both pending 360 migrations before deploying this frontend**. The workflow migration defaults `private.feedback_360_release.enabled` to false; ordinary roles cannot change it. `ENABLE_360_FEEDBACK` must also remain unset/false in the application. Enable both only after every release check succeeds; keep them off while rehearsing annual compatibility.

Original annual activation/scheduling functions are moved into private schema and exposed through public dispatch wrappers with the existing signatures. A frontend-only rollback does not reverse this migration; retain database privacy controls and plan a reviewed roll-forward/recovery. Do not drop private data as a routine rollback. Main is not updated and no production data/migration was changed by this task.

## N–O. Enablement decision and blockers

**Not safe to enable yet.** The user-facing implementation is present, but the release validation is incomplete. Required next checks: recreate persistent isolated browser fixtures and verify complete annual/360 desktop and mobile paths, keyboard navigation, save/resume failures and actual browser/RSC/API identifier contents; add dedicated anonymous submission/closure concurrency and revoked/expired-token tests; verify hosted Supabase/PostgREST privileges and RPC contracts; verify staged email delivery/cron configuration without emailing production customers. Confirm staging release order before enabling. Stripe and marketing are unchanged.
