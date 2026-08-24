/** Parent product — Appraisal Software is powered by Disclosurely. */
export const DISCLOSURELY_URL = "https://disclosurely.com";

/** Live Appraisals product page on Disclosurely (ownership / learn more). */
export const PRODUCT_PAGE_URL = `${DISCLOSURELY_URL}/solutions/appraisals`;

/**
 * Live primary commercial CTA.
 * Destination is the Disclosurely walkthrough/demo flow — label must stay truthful.
 */
export const PRIMARY_CTA_URL = `${DISCLOSURELY_URL}/demo`;
export const PRIMARY_CTA_LABEL = "Book a walkthrough";

/** Short note shown near external primary CTAs so the domain change is expected. */
export const PRIMARY_CTA_TRANSITION =
  "Continues on Disclosurely — where Appraisal Software is built and hosted.";

/** In-page secondary CTA. */
export const SEE_HOW_IT_WORKS_HREF = "/#how-it-works";
export const SEE_HOW_IT_WORKS_LABEL = "See how it works";

/**
 * Reserved for when genuine self-serve Appraisals onboarding/trial exists.
 * Do NOT use in UI while PRIMARY_CTA_URL is still the demo/walkthrough form.
 */
export const TRY_APPRAISAL_URL = ""; // set when self-serve onboarding is live
export const TRY_APPRAISAL_LABEL = "Try appraisal software";

/** App login (existing customers), not a try/signup path for Appraisals. */
export const SIGN_IN_URL = "https://app.disclosurely.com/auth/login";

export const PRIVACY_URL = `${DISCLOSURELY_URL}/privacy`;
export const TERMS_URL = `${DISCLOSURELY_URL}/terms`;
export const CONTACT_URL = `${DISCLOSURELY_URL}/contact`;
