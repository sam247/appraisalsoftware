# Product imagery handoff

## Published product proof

The public site now reuses the live respondent form and the live annual
Self-vs-Manager comparison track:

- `src/components/product-marketing/RespondentProof.tsx`
- `src/components/product-marketing/ResultsProof.tsx`
- `src/components/product-marketing/ProductFrame.tsx`

These components use sanitized fictional preview data (`Northstar Studio`,
Alex Morgan) and are explicitly presented as product previews. They do not
connect to production data or submit anything.

Published placements:

- Homepage: workspace/creation launcher, respondent form, annual results
- Annual appraisal software: respondent form and results
- Employee appraisal software: respondent form

The source components are imported from the real authenticated respondent and
results surfaces where practical. Keep the preview data generic and never use
customer, personal, test or fixture data.

## Deferred 360 imagery

The following authenticated surfaces were inspected but deliberately not
published:

- 360 campaign creation
- 360 campaign management
- anonymous 360 results
- Self-vs-Others reporting

The 360 release gate is disabled in the repository. When it is enabled and
validated for customers, the strongest future candidates are:

- `src/app/dashboard/campaigns/new/create-campaign-form.tsx`
- `src/app/dashboard/campaigns/[id]/feedback-360-draft-review.tsx`
- `src/app/dashboard/campaigns/[id]/results/feedback-results.tsx`

Do not expose these as current product proof until the release gate and
production workflow are enabled.

## Presentation rules

- Keep the product surface readable on mobile; do not shrink a full desktop
  dashboard into an unreadable thumbnail.
- Use `ProductFrame` for new proof moments rather than inventing browser chrome
  or device mockups.
- Use descriptive alt text when an image asset is introduced. Interactive
  product previews should be labelled as previews and must not perform real
  submissions.
- Keep resource pages content-first. Add product proof only where the live
  workflow directly answers the page intent.
