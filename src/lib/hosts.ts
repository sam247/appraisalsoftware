/**
 * Production host split:
 * - Marketing: appraisalsoftware.co.uk
 * - Product (auth, dashboard, invites, respondents): app.appraisalsoftware.co.uk
 *
 * Email/respondent URLs already use getAppOrigin() → app subdomain.
 * Keep auth cookies on one host by never completing login on the apex.
 */

export const MARKETING_HOST = "appraisalsoftware.co.uk";
export const APP_HOST = "app.appraisalsoftware.co.uk";

/** Paths that belong on the app host in production. */
const APP_PATH_PREFIX =
  /^\/(dashboard|app|onboarding|login|signup|logout|invite|r)(\/|$)/;

export function isAppProductPath(pathname: string): boolean {
  return APP_PATH_PREFIX.test(pathname);
}

export function hostnameOf(hostHeader: string | null): string {
  return (hostHeader ?? "").split(":")[0]?.toLowerCase() ?? "";
}

export function isMarketingHostname(hostname: string): boolean {
  return (
    hostname === MARKETING_HOST ||
    hostname === `www.${MARKETING_HOST}`
  );
}

export function isAppHostname(hostname: string): boolean {
  return hostname === APP_HOST;
}
