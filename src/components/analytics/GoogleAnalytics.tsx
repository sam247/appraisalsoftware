"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useConsentManager } from "@c15t/nextjs";
import { analyticsReleased, GA_ID, publicAnalyticsPath, safeReferrer } from "@/lib/analytics/events";

export function GoogleAnalytics() {
  const { has } = useConsentManager();
  const consent = has("measurement");
  const path = usePathname();
  const lastPage = useRef<string | null>(null);
  useEffect(() => {
    if (!analyticsReleased) return;
    const host = window as unknown as Record<string, unknown>;
    window.appraisalMeasurementConsent = consent;
    host[`ga-disable-${GA_ID}`] = !consent;
    if (!consent) {
      lastPage.current = null;
      window.gtag?.("consent", "update", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
      for (const cookie of document.cookie.split(";")) {
        const name = cookie.trim().split("=")[0];
        if (!name.startsWith("_ga")) continue;
        for (const domain of ["", window.location.hostname, "." + window.location.hostname, ".appraisalsoftware.co.uk"])
          document.cookie = `${name}=; Max-Age=0; path=/;${domain ? ` domain=${domain};` : ""}`;
      }
      return;
    }
    if (!window.gtag) {
      window.dataLayer = window.dataLayer || [];
      // Google’s queue expects an Arguments object.
      // eslint-disable-next-line prefer-rest-params
      window.gtag = function () { window.dataLayer!.push(arguments); };
      window.gtag("consent", "default", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
      window.gtag("js", new Date());
      window.gtag("config", GA_ID, { send_page_view: false, page_location: window.location.origin + "/", page_referrer: safeReferrer(document.referrer), page_title: "Appraisal Software", linker: { domains: ["appraisalsoftware.co.uk", "app.appraisalsoftware.co.uk"] }, allow_google_signals: false, allow_ad_personalization_signals: false });
      const script = document.createElement("script");
      script.id = "appraisal-google-tag";
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
      document.head.appendChild(script);
    } else window.gtag("consent", "update", { analytics_storage: "granted" });
    const safePath = publicAnalyticsPath(path);
    if (safePath && safePath !== lastPage.current) {
      window.gtag("event", "page_view", { send_to: GA_ID, page_location: window.location.origin + safePath, page_referrer: safeReferrer(document.referrer), page_title: safePath });
      lastPage.current = safePath;
    } else if (!safePath) lastPage.current = null;
  }, [consent, path]);
  return null;
}
