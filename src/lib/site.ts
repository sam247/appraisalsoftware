import type { RoutePath } from "@/lib/routes";

export const SITE_URL = "https://appraisalsoftware.co.uk/";

export const SITE_NAME = "Appraisal Software";

export const SITE_TITLE =
  "Appraisal Software for UK Teams | Appraisals & 360 Feedback";

export const SITE_DESCRIPTION =
  "Appraisal software for UK teams. Run employee and manager reviews with reusable forms and completion tracking, and explore free appraisal and 360 feedback resources.";

export function isIndexableDeployment(environment: string | undefined, nodeEnvironment: string | undefined): boolean {
  return environment ? environment === "production" : nodeEnvironment === "production";
}

export const isProductionDeployment = isIndexableDeployment(process.env.VERCEL_ENV, process.env.NODE_ENV);

export function absoluteUrl(path: RoutePath | string = "/"): string {
  const origin = SITE_URL.replace(/\/$/, "");
  if (!path || path === "/") return origin;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}
