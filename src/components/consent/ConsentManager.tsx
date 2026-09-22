"use client";

import type { ReactNode } from "react";
import {
  ConsentBanner,
  ConsentDialog,
  ConsentManagerProvider,
  policyPackPresets,
} from "@c15t/nextjs";

import { PRIVACY_URL } from "@/lib/links";

const c15tBackendURL = process.env.NEXT_PUBLIC_C15T_BACKEND_URL;

export function ConsentManager({ children }: { children: ReactNode }) {
  return (
    <ConsentManagerProvider
      options={{
        ...(c15tBackendURL
          ? {
              mode: "hosted" as const,
              backendURL: c15tBackendURL,
            }
          : {
              mode: "offline" as const,
              offlinePolicy: {
                policyPacks: [
                  policyPackPresets.europeOptIn(),
                  policyPackPresets.californiaOptOut(),
                  policyPackPresets.worldNoBanner(),
                ],
              },
            }),
        consentCategories: ["necessary", "measurement", "marketing"],
        legalLinks: {
          privacyPolicy: {
            href: PRIVACY_URL,
            target: "_blank",
            rel: "noopener noreferrer",
          },
        },
        theme: {
          colors: {
            primary: "oklch(0.46 0.12 158)",
            primaryHover: "oklch(0.4 0.1 158)",
            surface: "oklch(0.985 0.005 85)",
            surfaceHover: "oklch(0.955 0.005 85)",
            border: "oklch(0.92 0.006 85)",
            text: "oklch(0.14 0.01 75)",
            textMuted: "oklch(0.44 0.012 75)",
            overlay: "oklch(0.14 0.01 75 / 0.5)",
          },
          typography: {
            fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
            fontSize: { base: "0.75rem" },
            lineHeight: { normal: "1.4" },
          },
          radius: {
            sm: "0.5rem",
            md: "0.75rem",
            lg: "1rem",
          },
          shadows: {
            lg: "0 16px 40px oklch(0.14 0.01 75 / 0.14)",
          },
          consentActions: {
            default: { mode: "stroke" },
            accept: { variant: "primary", mode: "filled" },
            reject: { variant: "neutral", mode: "ghost" },
            customize: { variant: "neutral", mode: "stroke" },
          },
          slots: {
            consentBannerCard:
              "max-w-[15.5rem] rounded-lg border p-3 shadow-lg sm:max-w-[17rem]",
            consentBannerHeader: "gap-0.5",
            consentBannerTitle: "text-xs font-semibold tracking-tight",
            consentBannerDescription: "text-[11px] leading-snug",
            consentBannerFooter: "gap-1.5 pt-0.5",
            consentDialogCard: "rounded-2xl border shadow-lg",
            consentDialogHeader: "gap-2",
            consentDialogTitle: "font-semibold tracking-tight",
            consentDialogFooter: "border-t",
          },
        },
      }}
    >
      <ConsentBanner
        hideBranding
        legalLinks={["privacyPolicy"]}
        title="Cookies"
        description="Essential cookies to run the site, plus optional ones to measure usage."
        layout={["customize", ["reject", "accept"]]}
        primaryButton="accept"
      />
      <ConsentDialog hideBranding showTrigger />
      {children}
    </ConsentManagerProvider>
  );
}
