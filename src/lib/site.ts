import type { RoutePath } from "@/lib/routes";

export const SITE_URL = "https://appraisalsoftware.co.uk/";

export const SITE_NAME = "Appraisal Software";

export const SITE_TITLE =
  "Appraisal Software — Appraisals Without the HR System";

export const SITE_DESCRIPTION =
  "Simple appraisal and 360° feedback software for UK organisations. Create, send, collect and understand — without spreadsheets, paperwork or a heavyweight HR system.";

export const isProductionDeployment =
  process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";

export function absoluteUrl(path: RoutePath | string = "/"): string {
  const origin = SITE_URL.replace(/\/$/, "");
  if (!path || path === "/") return origin;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}
