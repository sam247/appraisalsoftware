# Public URL architecture — 7 October 2026

## Approved map

- Software: / → /employee-appraisal-software and /360-appraisals. Supporting commercial pages: /pricing, /how-it-works and /contact.
- Templates: /templates → /annual-appraisal-template, /self-appraisal-template, /probation-review-template, /personal-development-plan-template and /360-feedback-template.
- Resources: /resources → /annual-appraisal-guide, /appraisal-questions, /appraisal-answers, /appraisal-comments, /appraisal-objectives, /360-degree-feedback, /360-feedback-questions and /360-feedback-examples.
- Articles: /blog and /blog/when-self-and-manager-ratings-differ. Staged drafts stay unpublished; published articles are surfaced within their relevant resource journey.

## Redirects and affected references

| Retired URL | Final destination | Treatment |
| --- | --- | --- |
| /annual-appraisal-software | /employee-appraisal-software | Server-side 301; annual cycle is a use case of identified employee/manager reviews. |
| /360-feedback-software | /360-appraisals | Server-side 301; retain #privacy on the destination. |

Direct redirects only; query strings pass through and the browser retains a fragment when the Location header supplies no replacement fragment. Retired URLs leave the sitemap, structured data and current internal links.

Annual references affected: shared route register; homepage workflow section; footer; employee page; 360 commercial page; how-it-works; appraisal questions; resource related links and commercial bridges; staged follow-up and manager-preparation articles; keyword register. Existing 360 references were updated in the earlier local replacement pass.

The annual page’s useful material to retain is campaign period/dates, review population and manager assignment, reusable yearly questions, completion/reminders, finished records and planned follow-up. Keep this as one focused annual-cycle section in the employee page rather than copying its duplicate sales sections or product previews.

## Hub responsibilities

/templates owns usable first-party forms: intended use, who completes them, actual field/prompt counts, a preview and copy/print access. Creating a workspace does not import a public template; say so wherever a product-use action could imply import. Five forms need grouped discovery, not category URLs or marketplace infrastructure.

/resources owns two learning paths: Employee Appraisals and 360 Appraisals. Display guides, examples and questions here; link to relevant forms contextually. Display published articles within their topic path. /blog remains available in the footer rather than primary navigation.

Homepage exposes the two product pillars directly. Templates and Resources are separate primary navigation entries. Commercial destinations point to relevant forms/guides, and each supporting destination has one natural commercial path.

## Protected assets

/appraisal-answers and /360-feedback-template retain their URLs, titles, fundamental intent and existing useful content. Improvements are additive navigation/contextual links and truthful product-use guidance. No new SEO landing pages or category routes.

## Ownership and release

The surviving page ownership register is docs/seo/url-ownership.md. User-reported meaningful organic traffic is recorded for the two protected assets. Other pages use dated historical evidence where available, or explicitly state that fresh performance data was not checked.

Release checks: actual redirects and query passthrough, protected-content regression, current internal links/fragments, sitemap membership, self-canonicals, metadata/social URLs, structured data/breadcrumbs, staged-draft exclusion, lint/typecheck and production build.

## Validation and remaining review

Implemented locally; production deployment remains outstanding. The production build passed. Fifteen targeted marketing/blog tests passed, including protected-content preservation. Lint passed with the existing unused `searchParams` warning in the login page.

The runnable check `node scripts/check-public-architecture.mjs http://localhost:3011` passed against the production preview: 23 indexable pages, 825 internal links/fragments, self-canonicals, descriptions, sharing assets, structured data and both direct 301 redirects with query passthrough. The new 360 destination retains `#privacy`. No extra SEO pages or template categories were introduced.

Left for later review:

- The employee commercial page still has repeated product-preview/sales sections. Keep its annual-cycle content, then polish the page as a whole.
- How It Works shares process explanations with the two product pages. It currently serves a supporting conversion task; reassess its unique contribution after those pages are polished.
- Blog has one published article. Retain the useful article, surface it through Resources and keep the archive out of primary navigation.
- Template use currently requires copying prompts into a workspace. Automatic import needs real product support before it can be advertised.
- Performance outside the two user-reported proven URLs needs a fresh Search Console export; this pass does not establish current rankings or zero traffic.
