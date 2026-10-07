import type { RoutePath } from "@/lib/routes";

export const SITE_URL = "https://appraisalsoftware.co.uk/";

export const SITE_NAME = "Appraisal Software";

export const SITE_TITLE =
  "Appraisal Software for UK Teams | Employee Appraisals";

export const SITE_DESCRIPTION =
  "Free appraisal software for small UK teams. Run employee appraisals for up to 10 people with retained results. Upgrade for more capacity or anonymous 360 feedback.";

export function isIndexableDeployment(environment: string | undefined, nodeEnvironment: string | undefined): boolean {
  return environment ? environment === "production" : nodeEnvironment === "production";
}

export const isProductionDeployment = isIndexableDeployment(process.env.VERCEL_ENV, process.env.NODE_ENV);

export function absoluteUrl(path: RoutePath | string = "/"): string {
  const origin = SITE_URL.replace(/\/$/, "");
  if (!path || path === "/") return origin;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}
