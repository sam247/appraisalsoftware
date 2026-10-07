> 7 October architecture update: historical URL-preservation guidance below is superseded by `public-url-architecture.md` and `url-ownership.md`. The approved annual/360 commercial consolidations use direct 301 redirects; distinct supporting content remains.

# Reviewable release runbook — 4 October 2026

Analytics update: production GA4 now runs after measurement consent without an environment enable flag. Sam confirmed Enhanced measurement is disabled. `NEXT_PUBLIC_GA4_ENABLED` only enables local-development testing; the permanent Free plan replaces the old trial gate.

Implementation is local. No production migration, deployment or article publication has occurred. The checkout also contains the separate dashboard overhaul; isolate its changes with its owner before assembling release commits. Preserve existing migrations and public URLs.

## A — ownership and audit

`keyword-register.csv` covers 50 terms, including two property exclusions. Volumes are global estimates; competition is unverified. UK evidence is family-level interpretation, not a Google UK rank check or UK demand estimate. Sources checked 4 October:
- https://www.breathehr.com/en-gb/hr-software/performance-appraisal-software
- https://www.appraisal360.co.uk/
- https://prod.cipd.org/uk/topics/performance-management/
- https://www.acas.org.uk/templates
- https://talos360.co.uk/resources/best-360-degree-feedback-tools/

GSC baseline and protected pages are recorded in `programme.md`. URL Inspection is still required for `/annual-appraisal-software`: coverage absence alone is not an indexation diagnosis. Inspect Google-selected canonical, last crawl and rendered content before rewriting. Save dated query/page exports for the homepage, annual, employee, 360 software and signal-bearing resource pages before and after release. No attribution can be made before post-release data exists.

BR memories: approved reset `32d226ec-8e06-44cc-bf0b-9ce222a2e405`; corrected ownership `736ee317-ec68-48a8-8054-d3b2449a227e`; superseded cadence `45241bbb-21ae-4208-b471-91a8fd2e0151`. Bots remain paused; these records do not resume schedulers.

## B — entitlement and measurement

1. Apply historical migrations followed by `20261007120000_permanent_free_plan.sql` to isolated staging first. New workspaces receive permanent `free`; no release flag or trial countdown is used. Preserve migration history.
2. Existing `pro` and `organisation` entitlements remain unchanged. Existing `legacy` and old trial entitlements become preserved `legacy` with `needs_review=true`; original timestamps remain audit data. Do not infer access from editable organisation settings. No employee, campaign, template, response or history is deleted or hidden.
3. Review flagged workspaces using a trusted service connection: `SELECT organization_id,plan FROM private.workspace_entitlements WHERE needs_review;`. Explicitly classify paid customers with the service-only `activate_workspace_plan` RPC (`pro` or `organisation`) after confirming their arrangement. Leave unclassified customers grandfathered. No automatic downgrade path is introduced.
4. Verify Free bootstrap/retry, active employee 10/11, atomic CSV rejection, archive/restore, scheduled+active campaign 1/2, close/results/next cycle, owner+pending admin reservations 1/2, and 360 creation/activation rejection. Legacy access and paid capacities must remain usable. Standard templates, questions, invitations, reminders and annual results stay complete. Current logo/accent settings were never Pro-only; preserve them with platform branding retained.
5. Database migration must precede matching app deployment. The old expiry RPC is a service-only no-op for rolling deployment compatibility. The scheduler no longer calls it. Manual paid activation stays with our team; no checkout, payment card collection or Stripe is added.
6. GA4 uses `signup_start`, `sign_up`, `campaign_activation`, `generate_lead` and `support_enquiry`. Keep measurement consent, fixed payloads, excluded app/respondent page views and origin-only referrers. First activation is claimed once per workspace after consent; this remains a best-effort metric. No identity, content, organisation ID or tokens leave the browser.
7. Verify consent rejection/acceptance/withdrawal with actual network requests on staging. Enhanced measurement stays disabled. Confirm first activation, successful workspace creation and qualified contact enquiry without sensitive payloads. `NEXT_PUBLIC_GA4_ENABLED` only opts local development into measurement; remove obsolete `NEXT_PUBLIC_TRIAL_READY` configuration.
8. Run `npm test`, `npm run typecheck`, `npm run lint`, `node scripts/check-production-safeguards.mjs`, `npm run build` and the public architecture check against the local production preview. Verify hosted PostgREST, cron and real email/analytics delivery on staging before any production deployment.

Rollback must preserve entitlement records and collected data. Keep the additive migration; do not redeploy countdown/expiry UI. The compatibility RPC cannot close campaigns because of historical trial dates.

## C — existing pages

Narrow changes: accurate 360 privacy boundaries, manager-feedback examples, two resource reading paths, balanced homepage copy, shared Free/paid pricing and permanent Free signup copy. No synonym URLs, historical redirects, taxonomy pages or substantial annual-product rewrite. Verify existing anchors and canonicals, internal links, structured data, copy/print actions, keyboard use and layouts at 390/768/1440px before publishing the marketing refresh.

## D / E — supporting content

Six Markdown articles are drafts. `content-batches.md` records the distinct-task gate. D: reviewer selection and results discussion. E1: software selection and spreadsheet transition. E2: manager preparation and follow-up. For each batch review sources/product claims, remove `draft: true` only for its selected articles, set real publication dates, add discoverable parent/sibling links and verify sitemap/routes. Release later batches roughly a week apart when readiness/evidence support it. Do not create four articles to fill D.

For every actual release, record date, changed URLs, query families, reason, validation and baseline in BR. No release annotation has been created for local implementation. Review discovery/canonicals at +2 weeks, acquisition/conversions at +6/+12 weeks; no automations were created.

## Remaining hosted checks

Staging and production migration verification; authorised delivered contact email (local Resend credential is absent); Search Console URL Inspection; real GA4 network/DebugView and key-event configuration; live post-release SEO checks and mobile performance measurement. Local tests cannot establish these outcomes.
