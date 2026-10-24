# Resource page photos

Resource pages can include photo slots (`figure: { type: "photo", id, brief, alt }` in `src/lib/resource-content.ts`).
Until a photo exists, the page shows a dashed "Photo to come" placeholder with the brief and the expected filename.

To add a photo, save a 1600×900 (16:9) JPEG at `public/resources/photos/{id}.jpg` and redeploy. The placeholder is replaced automatically; no code change is needed.

| Page | Photo id | Brief |
| --- | --- | --- |
| /appraisal-answers | `appraisal-answers-preparing` | An employee preparing their self-appraisal at a desk or kitchen table, laptop and notes, thoughtful rather than stressed. |
| /self-appraisal-template | `self-appraisal-template-reflection` | An employee quietly completing a printed self-appraisal form or laptop, pen in hand, in a real UK workplace. |
| /annual-appraisal-guide | `annual-appraisal-guide-meeting` | Manager and employee in an appraisal meeting, sitting at a table corner rather than across a desk, relaxed and open. |
| /probation-review-template | `probation-review-template-new-starter` | Manager and recently hired employee in a supportive check-in, in a shop, warehouse, care home or office. |
| /appraisal-objectives | `appraisal-objectives-planning` | Manager and employee planning together at a whiteboard or over a printed plan, collaborative mood. |
| /360-feedback-template | `360-feedback-conversation` | Manager and employee in a relaxed one-to-one reviewing feedback together; faces not the focus. |
