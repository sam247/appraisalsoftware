# SEO frontend release

Prepared and reviewed: 18 September 2026. Implementation is local; publication date is not yet recorded.

## GSC baseline

Property: `sc-domain:appraisalsoftware.co.uk`. Source: Better Ranking live GSC overview, captured 18 September 2026, with its two-day reporting lag.

Period: 20 August–16 September 2026. Clicks: **0**. Impressions: **430**. CTR: **0%**. Average position: **51.1**.

Previous period: 23 July–19 August 2026. Clicks: 0. Impressions: 14. Average position: 75.71. Low volumes and the domain relaunch prevent treating this movement as evidence of a successful intervention.

The 90-day page sample to 16 September contains the homepage (322 impressions), annual appraisal template (96), 360 feedback software (21) and 360 feedback template (11). Performance samples do not establish whether absent pages are indexed.

Early query signals: annual appraisal software (7 impressions, position 19.14, currently through the homepage); appraisal software UK (39, 27.1); annual appraisal template (8, 34); annual appraisal form template (5, 33.4). No search-volume estimates were obtained.

No active SEO experiments or ownership restrictions were returned by the project context. The historical domain document remains background evidence, not a restoration instruction.

## Page-to-intent map

Each page was assessed for audience, primary intent and unique material before drafting. The 20 routes below have distinct tasks; the number is an outcome of that assessment, not a future quota. Existing public routes are retained.

| URL | Audience and primary intent | Unique material and relationship |
| --- | --- | --- |
| `/` | UK small teams choosing appraisal software | Overall product proposition; connects commercial pages and resources |
| `/employee-appraisal-software` | Managers and employees evaluating reviews | Preparation and paired employee/manager perspectives; broader than the annual cycle |
| `/annual-appraisal-software` | Organisers evaluating yearly cycle administration | Campaign planning, assignments, collection and follow-up |
| `/360-feedback-software` | Buyers investigating multi-rater software | Explicit planned capability status and intended workflow; no collection promise |
| `/annual-appraisal-template` | Managers and employees needing a form | Complete blank yearly form, usage and fictional completed example |
| `/self-appraisal-template` | Employees preparing self-assessment | Blank reflection form; links to completed employee answers |
| `/probation-review-template` | Managers reviewing new starters | Expectations, induction support and progress form; not a formal outcome decision tool |
| `/personal-development-plan-template` | Employees and managers planning learning | Practice, support and capability evidence; distinct from work-result objectives |
| `/360-feedback-template` | Facilitators needing a short form | Blank multi-rater form, sample scale and instructions; broader bank is separate |
| `/appraisal-questions` | Employees and managers choosing prompts | Grouped appraisal question bank; complements annual form |
| `/annual-appraisal-guide` | Managers planning the process | Preparation, meeting and follow-up steps; links to forms |
| `/appraisal-answers` | Employees writing self-assessment | First-person answer examples, evidence and adaptation advice |
| `/appraisal-comments` | Managers writing observations | Manager-written comments against role expectations; deliberately separate from employee answers |
| `/appraisal-objectives` | Employees and managers agreeing work outcomes | Measurable result examples with support and deadlines; development plan remains separate |
| `/360-degree-feedback` | Facilitators learning the method | Purpose, reviewer choice, privacy expectations and limitations |
| `/360-feedback-questions` | Facilitators choosing prompts | Behaviour and relationship question bank; links to ready-to-use form |
| `/360-feedback-examples` | Reviewers and facilitators interpreting feedback | Fictional comments, summary and development action; no actual product report |
| `/templates` | Visitors finding blank forms | Concise discovery hub, not another long guide |
| `/resources` | Visitors finding task-based guidance | Groups process, writing and 360 resources |
| `/how-it-works` | Prospective users evaluating product flow | Illustrated employee/manager workflow and current versus planned capabilities |

Resource copy and template blocks are maintained in `src/lib/resource-content.ts`; explicit page wrappers preserve readable routes. Question-bank content stays in its existing page. Hubs are concise by design. Avoid duplicating substantial text across these destinations.

## Conversion and product accuracy

Start free links to the existing `/signup`; no account was created during verification. Shared navigation has the product CTA; the footer has no signup promotion. Templates open with the usable form and copy/print actions. Most appraisal resources have one contextual product bridge after the useful material. Hubs have no body signup CTA. 360 resources link to product status instead of promising collection.

Current product evidence was read from the phase records and results/respondent code: annual campaigns, reusable questions, identified self/manager assignments, invitations/reminders, completion and Self vs Manager answers. 360 collection, anonymity, advanced analytics and app PDF/CSV exports remain planned. Browser printing of resource forms is independent of those app exports. Marketing form/report panels are labelled as illustrations or planned designs. No plan prices, unlimited allowances or guaranteed anonymity are asserted.

## Adjacent commercial research: performance review software

Search checked 18 September 2026: “performance review software UK standalone employee reviews”. Primary provider evidence includes:

- [Personio performance review software guide](https://www.personio.com/hr-lexicon/performance-review-software/): buyer-oriented selection criteria and structured employee reviews.
- [Cogendo PerformanceHub](https://www.cogendo.com/): a commercial employee performance review product covering objectives and appraisal lifecycle.
- [Factorial performance management](https://factorialhr.co.uk/performance-management): employee reviews within a broader performance platform.

Inference: this is an adjacent commercial-investigation/product term, with substantial overlap with employee appraisal software. Some results expect broader objectives and performance-management capabilities than the current app offers. These search results are a snapshot, not a keyword-volume or difficulty measurement.

Recommendation: do not add `/performance-review-software` in this release. First assess future UK GSC query/page evidence and search-result overlap with `/employee-appraisal-software`; use that existing page for relevant review-language coverage where accurate. Consider a separate page only when distinct buyer intent and supported product material justify it. Do not create a synonym-only commercial page.

## Publication and measurement handoff

After deployment, record the publication date and recheck the live sitemap, canonical URLs, sharing images, production robots and signup destination. Preserve parked domains and historical redirect policy.

At publication +2 weeks, review discovery and Google-selected canonicals using Search Console; missing performance rows are not an indexing diagnosis. At +6 and +12 weeks compare impressions, clicks, position distributions and assigned query families, prioritising annual software and templates. Account for GSC lag, low volume and unrelated changes. No monitoring automation or analytics system was created.

## Public route guard correction

The final HTTP audit discovered that the existing proxy used `pathname.startsWith("/app")` to identify private app URLs. That also redirected public `/appraisal-*` pages to login. The boundary now matches only `/app` and `/app/*`; authentication and session handling for actual app routes are unchanged. The marketing regression check verifies all public paths pass through and unauthenticated app paths still redirect with their `next` destination.

## Local verification

- Production build and TypeScript checks pass; all 20 marketing routes are statically rendered.
- All 17 tests pass, including the public-route/private-app boundary and indexability checks.
- Changed frontend files pass lint. Repository-wide lint still reports a pre-existing anchor-navigation error in `src/app/app/campaigns/new/page.tsx:141` and unused-variable warnings in app/auth files; these were left outside this frontend release.
- HTTP audit confirms 20 successful public routes, unique titles, self-canonicals, valid sharing-image URLs, sitemap alignment, internal links, contents anchors and no 360 collection signup bridge.
- All 20 pages were checked at a 390px viewport: no horizontal overflow or error overlay, and one H1 per page. Desktop template layout and mobile navigation were also checked.
- Browser checks confirm copy success, blocked-clipboard manual fallback and print-button invocation. A browser-generated template PDF was rendered and inspected for readability and absence of navigation/promotion.
- Start free reaches the existing signup form; signup and login return noindex metadata. No account was created, no backend data was changed and nothing was deployed.
