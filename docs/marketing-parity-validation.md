# Public marketing refresh validation

Implemented 4 October 2026. The existing homepage anchors the public typography, colours, spacing, photography and contrasting CTA bands. Dashboard changes already present in the working tree were preserved.

The subsequent SEO programme supersedes the permanent Free offer and commercial-only allowances described below. See `docs/seo/release.md` for the current gated trial and server enforcement release. This document records the earlier parity pass.

## Coverage

- Detailed Free / Pro / Organisation comparison, shared employee/campaign/admin allowances and preselected contact enquiries. Prices remain £0 / £39.99 / £89.99 per workspace per month; paid prices exclude VAT.
- Annual and 360 walkthroughs, participant preview, results, release thresholds and question-level suppression explanations.
- Resource and template discovery by task, including the separately authored appraisal-questions page; featured blog article and preserved copy/print actions.
- Native contact form, same-origin JSON endpoint, bounded request body, validated fields, escaped email, honeypot, bounded per-instance limiter, provider idempotency and optional reply-to support. Existing invitation delivery is unchanged.
- Public navigation and footer contact links, /contact metadata, sitemap and social sharing image. Fictional testimonials and their carousel styles removed.

## Automated checks

- `npm test`: 110 tests across 16 files passed. Contact tests cover successful mocked delivery, escaping/reply address, stable retry keys, edited payloads, invalid inputs, honeypot, wrong origins, malformed JSON, body limits, missing configuration, provider failures and rate-limit expiry. Pricing tests lock approved prices/capacity and enquiry links. Existing SEO coverage includes /contact and all resource listings.
- `npm run typecheck`: passed.
- `npm run lint`: no errors; one existing unused `searchParams` warning in the login page.
- `npm run build`: passed, including /contact and /api/contact. The installed Supabase package emits an existing Node 20 deprecation warning.
- `git diff --check`: passed.

## Browser checks

All 23 indexable marketing routes plus the published blog article were checked in the production build at 390, 768 and 1440 CSS pixels: **72 checks**. Each had one main H1, meaningful content, no document-level horizontal overflow, no framework error overlay, no broken local section anchors and no completed image-load failures. Full-page screenshots were captured and reviewed as contact sheets, with closer review of the priority pages.

Interactive checks confirmed mobile navigation opens from the keyboard, contact validation focuses the first invalid input, paid enquiries preselect Pricing and the correct plan, and template copying reports success. A real local request returned the expected missing-configuration error with entered values preserved. A locally simulated successful contact response replaced the form with an announced confirmation and focused the status region. No real email was sent.

The template print preview contains all five annual-review form sections and hides navigation, CTAs, supporting article text, the template overview and the privacy-settings trigger. Screenshots, the browser route report and the sample PDF are temporary verification artifacts under /tmp/marketing-parity and /tmp/annual-appraisal-print.pdf.

## Configuration and remaining release check

`CONTACT_TO_EMAIL=sampettiford@googlemail.com` is configured in local and example environment files. Configure it on the deployment together with the existing verified `RESEND_FROM` and `RESEND_API_KEY`. The local Resend key is empty, so live provider acceptance/inbox delivery could not be verified; send one authorised test enquiry after configuring the key, then verify receipt before release. No response-time guarantee or automatic acknowledgement email is promised.

Plan capacities are commercial allowances managed through manual activation; this change does not implement automatic quotas or checkout. The limiter is intentionally local to each server instance, capped at 1,000 IPs and five attempts per IP per ten minutes; a shared limiter is the upgrade path for a deployment needing global enforcement.
