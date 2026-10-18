import { DOWNLOADS } from "@/lib/marketplace/downloads";
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
  return INDEXABLE_PATHS.includes(path as typeof INDEXABLE_PATHS[number]) || path === "/signup" || /^\/(?:blog|marketplace)\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path) ? path : null;
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

/**
 * Downloadable-template events. Only events for capabilities that exist are
 * callable; purchase and delivery events are reserved names until those ship.
 */
export type DownloadAnalyticsEvent =
  | "download_option_viewed"
  | "download_coming_soon_clicked"
  | "download_purchase_started"
  | "download_purchase_completed"
  | "download_delivered";
export const ACTIVE_DOWNLOAD_EVENTS = ["download_option_viewed"] as const satisfies readonly DownloadAnalyticsEvent[];
export type ActiveDownloadEvent = (typeof ACTIVE_DOWNLOAD_EVENTS)[number];

/** Sends only a catalogue pack slug and a fixed product type: nothing a visitor types reaches GA4. */
export function trackDownloadEvent(event: ActiveDownloadEvent, packSlug: string): boolean {
  if (!(ACTIVE_DOWNLOAD_EVENTS as readonly string[]).includes(event) || !Object.hasOwn(DOWNLOADS, packSlug)) return false;
  if (!analyticsReleased || typeof window === "undefined" || !window.appraisalMeasurementConsent || !window.gtag) return false;
  window.gtag("event", event, {
    send_to: GA_ID,
    pack_slug: packSlug,
    product_type: "download",
    page_location: window.location.origin + "/",
    page_referrer: "",
    page_title: "Appraisal Software",
  });
  return true;
}
