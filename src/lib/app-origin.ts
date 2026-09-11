/**
 * Environment-aware public app origin for respondent / invite URLs.
 *
 * Never derive security-sensitive destinations from the request Host header.
 * Prefer an explicit env var; fall back carefully for local/dev only.
 */

const PRODUCTION_ORIGIN = "https://app.appraisalsoftware.co.uk";

export function getAppOrigin(): string {
  const explicit =
    process.env.NEXT_PUBLIC_APP_ORIGIN?.trim() ||
    process.env.APP_ORIGIN?.trim();

  if (explicit) {
    return stripTrailingSlash(explicit);
  }

  // Vercel preview / production — use the deployment URL only when explicit
  // origin is unset. Prefer production canonical host when VERCEL_ENV=production.
  if (process.env.VERCEL_ENV === "production") {
    return PRODUCTION_ORIGIN;
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    const host = vercelUrl.replace(/^https?:\/\//, "");
    return `https://${host}`;
  }

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  // Safe default for misconfigured production-like environments
  return PRODUCTION_ORIGIN;
}

export function respondentUrl(rawToken: string): string {
  if (!rawToken || rawToken.includes("/") || rawToken.includes("?")) {
    throw new Error("Invalid respondent token for URL generation");
  }
  return `${getAppOrigin()}/r/${rawToken}`;
}

function stripTrailingSlash(origin: string): string {
  return origin.replace(/\/+$/, "");
}
