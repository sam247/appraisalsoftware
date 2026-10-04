# Reviewable release runbook — 4 October 2026

Analytics update: production GA4 now runs after measurement consent without an environment enable flag. Sam confirmed Enhanced measurement is disabled. `NEXT_PUBLIC_GA4_ENABLED` only enables local-development testing; the trial gate remains separate. Prior gated-release notes below record the original implementation.

Implementation is local. No production migration, deployment, trial enablement or article publication has occurred. The checkout also contains the separate dashboard overhaul; isolate its changes with its owner before assembling release commits. Preserve existing migrations and public URLs.

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

1. Apply `20261004120000_workspace_trial_entitlements.sql` to an isolated staging database with the existing migrations. Existing organisations become `legacy`; never blanket-update them to trial. Newly created organisations also remain legacy until the private release switch is enabled.
2. Deploy the matching server/cron/participant code with `NEXT_PUBLIC_TRIAL_READY=false` and `NEXT_PUBLIC_GA4_ENABLED=false`. Database migration must precede the new People classification fields and cron RPCs. Do not roll the database back after trial workspaces exist.
3. Enable staging trials with `UPDATE private.trial_release SET enabled=true;`. Exercise workspace bootstrap/retry, 75/76 employees, external reviewers, 5/6 active or scheduled campaigns, 3/4 admins including pending invitations, both collection workflows, exact expiry, retained results and manual activation. Cron must be configured and authenticated. Expiry write guards apply immediately; cleanup closes/revokes campaigns on the next scheduler tick.
4. Manual activation uses a trusted service-role call to `activate_workspace_plan(p_organization_id,p_plan)` with `pro` or `organisation`. It preserves original trial dates and checks selected capacity. Existing closed campaigns are not silently reopened; an administrator deliberately resumes/replaces the appropriate campaign through its existing supported lifecycle.
5. GA4 stream `G-3LFNBQEPDF`: Sam confirmed Enhanced measurement disabled on 4 October. Disable it for every relevant stream/host. Set signup (`sign_up`) and qualified enquiry (`generate_lead`) as key events when events become available; support enquiries remain separate. No event carries caller-provided metadata, identity or content. Dashboard/respondent page views are excluded. Referrers are origin-only and campaign query strings are deliberately discarded to protect data. Marketing/app hosts use consent-aware cross-domain linking.
6. Verify staging consent rejection, acceptance, withdrawal and fresh navigation using network requests. Check only one initialisation and one page view per public navigation; no app/respondent URL, token or user data in requests. Test successful signup/bootstrap and first activation, plus contact success/failure with Resend mocked. Consent-off users must generate no events. First activation is claimed once per workspace after consent; it is a best-effort metric, not a durable delivery guarantee if the browser closes after claiming.
7. Enable production database trial switch only at the coordinated release, then rebuild/deploy with `NEXT_PUBLIC_TRIAL_READY=true`. This flag controls the proposition, not access enforcement. Enable `NEXT_PUBLIC_GA4_ENABLED=true` only after network verification. All public env flags are build-time values.

External email delivery cannot be held atomically across database expiry and a provider network request. The worker rechecks access immediately before sending; a request already accepted by the provider can finish after expiry. Collection remains blocked at the database boundary.

Rollback: keep the entitlement migration and enforcement; turn the private release switch off to grandfather only future organisations, and rebuild with public flags false. Preserve already issued trials. Turning off marketing cannot extend them. Do not delete entitlement state or collected responses.

## C — existing pages

Narrow changes: accurate 360 privacy boundaries, manager-feedback examples, two resource reading paths, balanced homepage copy, shared paid pricing and gated trial/signup copy. No synonym URLs, historical redirects, taxonomy pages or substantial annual-product rewrite. Verify existing anchors and canonicals, internal links, structured data, copy/print actions, keyboard use and layouts at 390/768/1440px before publishing the marketing refresh.

## D / E — supporting content

Six Markdown articles are drafts. `content-batches.md` records the distinct-task gate. D: reviewer selection and results discussion. E1: software selection and spreadsheet transition. E2: manager preparation and follow-up. For each batch review sources/product claims, remove `draft: true` only for its selected articles, set real publication dates, add discoverable parent/sibling links and verify sitemap/routes. Release later batches roughly a week apart when readiness/evidence support it. Do not create four articles to fill D.

For every actual release, record date, changed URLs, query families, reason, validation and baseline in BR. No release annotation has been created for local implementation. Review discovery/canonicals at +2 weeks, acquisition/conversions at +6/+12 weeks; no automations were created.

## Remaining hosted checks

Staging and production migration verification; authorised delivered contact email (local Resend credential is absent); Search Console URL Inspection; real GA4 network/DebugView and key-event configuration; live post-release SEO checks and mobile performance measurement. Local tests cannot establish these outcomes.
