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

## 360 imagery candidates

360 product capability is released. Prefer these authenticated surfaces when
adding product proof for multi-rater pages:

- `src/app/dashboard/campaigns/new/create-campaign-form.tsx`
- `src/app/dashboard/campaigns/[id]/feedback-360-draft-review.tsx`
- `src/app/dashboard/campaigns/[id]/results/feedback-results.tsx`

Until those are adapted into sanitized marketing previews, keep 360 commercial
copy accurate about the live campaign workflow and use educational process
visuals on resource pages. Do not invent Self-vs-Others charts or anonymous
report screenshots that do not match the shipped UI.

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
