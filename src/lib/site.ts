import type { RoutePath } from "@/lib/routes";

export const SITE_URL = "https://appraisalsoftware.co.uk/";

export const SITE_NAME = "Appraisal Software";

export const SITE_TITLE = "Annual Appraisal Software for UK Teams | Appraisal Software";

export const SITE_DESCRIPTION =
  "Simple annual appraisal software for UK teams. Run annual appraisals, employee reviews and 360° feedback without spreadsheets, Word forms or email chasing.";

export const isProductionDeployment =
  process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";

export function absoluteUrl(path: RoutePath | string = "/"): string {
  const origin = SITE_URL.replace(/\/$/, "");
  if (!path || path === "/") return origin;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}
