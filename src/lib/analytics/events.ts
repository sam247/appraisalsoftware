import { INDEXABLE_PATHS } from "@/lib/routes";

export const GA_ID = "G-3LFNBQEPDF";
// Production measurement is released; the consent manager controls tag loading.
// The environment flag only opts local development into measurement.
export const analyticsReleased = process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_GA4_ENABLED === "true";
export type AnalyticsEvent = "signup_start" | "sign_up" | "campaign_activation" | "generate_lead" | "support_enquiry";
declare global {
  interface Window { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; appraisalMeasurementConsent?: boolean; }
}
export function publicAnalyticsPath(path: string): string | null {
  if (path.includes("?") || path.includes("#")) return null;
  return INDEXABLE_PATHS.includes(path as typeof INDEXABLE_PATHS[number]) || path === "/signup" || /^\/blog\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path) ? path : null;
}
export function safeReferrer(value: string): string {
  try { return new URL(value).origin; } catch { return ""; }
}
export function trackEvent(event: AnalyticsEvent): boolean {
  if (!analyticsReleased || typeof window === "undefined" || !window.appraisalMeasurementConsent || !window.gtag) return false;
  // No caller-supplied parameters: identity, content, tokens and app URLs cannot enter this contract.
  window.gtag("event", event, { send_to: GA_ID, page_location: window.location.origin + "/", page_referrer: "", page_title: "Appraisal Software" });
  return true;
}
