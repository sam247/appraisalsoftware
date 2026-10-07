# Live page and URL review — 7 October 2026

All 24 URLs in the production sitemap were checked, along with their same-origin public page links and the proposed /360-appraisals replacement. Recommendations are for Sam’s review; no further pages have been removed, redirected or hidden.

## Technical findings

- All 24 live sitemap URLs return 200, have one H1, a description, unique titles and H1s, self-canonicals and `index, follow` metadata.
- All same-origin page links point into the checked inventory; no broken page links or fragment anchors were found in returned HTML. External links, private app screens and form submissions were not tested.
- Production still serves /360-feedback-software as a 200 page. /360-appraisals returns 404 on production: the local replacement and permanent redirect have not been deployed.
- All 24 corresponding local public pages return 200. Local development intentionally blocks indexing.
- This is an HTTP/content audit, not Search Console URL Inspection. Crawlable metadata does not establish Google indexing or ranking. No fresh query, backlink or conversion data was used for trimming recommendations.

## First pages to review

1. **Annual versus employee software:** strongest overlap. Both sell identified employee/manager forms, reusable questions, reminders, tracking and records. The annual page has a narrower yearly-cycle angle, but the sales structure and product previews repeat. If trimming, retain /employee-appraisal-software as the broad destination, move worthwhile annual-cycle content into it, and permanently redirect /annual-appraisal-software. Keep the annual guide and template. Alternatively, keep both with a useful content distinction.
2. **Templates versus resources:** different browsing intentions, but overlapping featured cards and forms. Simplify navigation around /resources first, with templates clearly available inside it. If a single hub is preferred, merge the template catalogue into resources and redirect /templates; preserve individual template pages.
3. **Blog hub:** one published article gives the archive limited browsing value. Reduce its navigation prominence until the collection grows. Keep the useful published article.
4. **How it works:** retain for now as a practical cross-product walkthrough. Reassess if the finished commercial pages later answer the same setup, collection and reporting questions completely.

## Full live inventory

“Review” is a consolidation candidate, not evidence of ranking cannibalisation. “Keep” means a distinct visitor task or business purpose, not that every paragraph must remain.

| Live URL | Visitor task | Recommendation | Review note |
| --- | --- | --- | --- |
| [/](https://appraisalsoftware.co.uk) | Product/category introduction | Keep | Broad product proposition; link to employee and 360 product pages. |
| [/pricing](https://appraisalsoftware.co.uk/pricing) | Compare plans and capacity | Keep | Essential purchase decision page. |
| [/contact](https://appraisalsoftware.co.uk/contact) | Enquiries and paid activation | Keep | Returns 200 now; older contact-404 notes are stale. |
| [/annual-appraisal-software](https://appraisalsoftware.co.uk/annual-appraisal-software) | Yearly appraisal administration | Review first | Strong overlap with employee software: same forms, reminders, tracking and records. Merge useful annual content into employee page if trimming. |
| [/employee-appraisal-software](https://appraisalsoftware.co.uk/employee-appraisal-software) | Employee/staff/performance software | Keep / rework | Preferred broad product destination if annual content is consolidated. Reduce repeated respondent previews. |
| [/360-feedback-software](https://appraisalsoftware.co.uk/360-feedback-software) | Anonymous multi-rater software | Replacement ready locally | Consolidate into /360-appraisals with the prepared permanent redirect on release. |
| [/annual-appraisal-template](https://appraisalsoftware.co.uk/annual-appraisal-template) | Copy/print a full annual form | Keep | A usable deliverable, not a software synonym page. |
| [/appraisal-questions](https://appraisalsoftware.co.uk/appraisal-questions) | Choose review questions | Keep | Question bank, distinct from a complete form. |
| [/360-feedback-template](https://appraisalsoftware.co.uk/360-feedback-template) | Copy/print a multi-rater form | Keep | Concrete form and scale; distinct from questions and examples. |
| [/templates](https://appraisalsoftware.co.uk/templates) | Browse usable forms | Review second | Distinct browsing intent, but overlaps resources. Could merge into resources if one hub is preferred; keep individual forms. |
| [/resources](https://appraisalsoftware.co.uk/resources) | Find guides, examples and forms | Keep / simplify | Preferred main resource hub. Reduce repeated featured items and navigation weight. |
| [/blog](https://appraisalsoftware.co.uk/blog) | Browse deeper articles | De-emphasise | Only one published article and about 72 words of main content. Reduce navigation prominence; no need to delete the article. |
| [/how-it-works](https://appraisalsoftware.co.uk/how-it-works) | Setup, collection and reporting walkthrough | Keep | Useful cross-product conversion path; reassess after product-page consolidation. |
| [/annual-appraisal-guide](https://appraisalsoftware.co.uk/annual-appraisal-guide) | Prepare, run and follow up a review | Keep | Informational process, distinct from software selection or downloading a form. |
| [/self-appraisal-template](https://appraisalsoftware.co.uk/self-appraisal-template) | Prepare employee self-reflection | Keep | Employee-specific preparation; distinct from the full annual review. |
| [/appraisal-answers](https://appraisalsoftware.co.uk/appraisal-answers) | Write employee self-appraisal answers | Keep | Employee voice; distinct from manager feedback. |
| [/appraisal-comments](https://appraisalsoftware.co.uk/appraisal-comments) | Write manager feedback | Keep | Manager voice, evidence and support; avoid merging just because both pages contain examples. |
| [/appraisal-objectives](https://appraisalsoftware.co.uk/appraisal-objectives) | Agree measurable work objectives | Keep; lower priority | Work outcomes rather than development skills. Optional scope review; not a duplicate of PDP. |
| [/personal-development-plan-template](https://appraisalsoftware.co.uk/personal-development-plan-template) | Agree development actions and support | Keep; lower priority | Further from software selection, but a useful post-review deliverable. Optional editorial scope review. |
| [/360-degree-feedback](https://appraisalsoftware.co.uk/360-degree-feedback) | Understand the method and limitations | Keep | Informational guide supporting commercial /360-appraisals. |
| [/360-feedback-questions](https://appraisalsoftware.co.uk/360-feedback-questions) | Choose behavioural prompts | Keep | Question bank, not a blank form or completed answer. |
| [/360-feedback-examples](https://appraisalsoftware.co.uk/360-feedback-examples) | Write feedback and interpret themes | Keep | Completed examples. Educational reviewer-group comparisons must remain clearly separate from the product’s combined report. |
| [/probation-review-template](https://appraisalsoftware.co.uk/probation-review-template) | Structure a probation review | Keep | Different review stage and form requirements. |
| [/blog/when-self-and-manager-ratings-differ](https://appraisalsoftware.co.uk/blog/when-self-and-manager-ratings-differ) | Handle differing review perspectives | Keep | Specific useful conversation task; can stay with a less prominent blog hub. |

## Local replacement and excluded routes

[/360-appraisals](http://localhost:3010/360-appraisals) is the local commercial 360 replacement. Publish with the prepared permanent redirect, revised internal links, sitemap, canonical and sharing image. Preserve #privacy. Treat this as a replacement for the old commercial page.

Six staged blog drafts remain unpublished and excluded from this live inventory. Login/signup, dashboard, onboarding, invitations and respondent screens are product/utility routes rather than editorial trim candidates. Their local layouts carry indexing restrictions; this audit did not access private app data or submit responses.

## Link structure

- Homepage → employee software and 360 appraisals; secondary paths to pricing and how-it-works.
- Resources → annual preparation, employee answers, manager comments and 360 preparation.
- Each guide, template or example → its relevant product page and most useful next resource.
- Keep links to specific resources even if hubs are consolidated.

The existing pages already connect these groups. The main opportunity is reducing duplication and navigation weight, rather than fixing orphaned pages or deep URLs. Retain short resource URLs unless their pages are actually being merged.

## Dark CTA colour pass

The shared `.marketing-contrast` palette deliberately substituted lighter green for the main brand green. Its primary and hover colours are now warm white / soft off-white with dark button text. This removes mint-coloured buttons, links and small headings from the homepage and /360-appraisals, and updates all existing shared dark CTA bands consistently. Green on light backgrounds is unchanged.

Calculated contrast from the OKLCH tokens: text on the dark section ≈17.8:1; button text on its fill ≈18.5:1; hovered button ≈14.9:1. Eight targeted marketing/SEO checks pass. Browser visual inspection was blocked by the browser tool’s URL policy, so this pass has no fresh screenshot verification. The local preview runs at http://localhost:3010.
