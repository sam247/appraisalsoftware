export const SITE_URL = "https://appraisalsoftware.co.uk/";

export const SITE_NAME = "Appraisal Software";

export const SITE_TITLE = "Employee Appraisal Software & 360 Feedback | Disclosurely";

export const SITE_DESCRIPTION =
  "Employee appraisal software for running structured performance reviews, 360 feedback and appraisal cycles. Simple, reusable and built for UK teams.";

export const isProductionDeployment =
  process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
