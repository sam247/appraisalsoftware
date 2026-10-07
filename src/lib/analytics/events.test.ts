import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ consent: false, path: "/", ref: { current: null as string | null } }));
vi.mock("react", () => ({ useEffect: (effect: () => void) => effect(), useRef: () => state.ref }));
vi.mock("next/navigation", () => ({ usePathname: () => state.path }));
vi.mock("@c15t/nextjs", () => ({ useConsentManager: () => ({ has: () => state.consent }) }));

describe("consent-aware analytics", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_GA4_ENABLED", "true");
    state.consent = false; state.path = "/"; state.ref.current = null;
    vi.stubGlobal("window", { location: { origin: "https://appraisalsoftware.co.uk", hostname: "appraisalsoftware.co.uk" } });
    vi.stubGlobal("document", { cookie: "_ga=sample", referrer: "https://example.com/path?email=private@example.com", createElement: () => ({}), head: { appendChild: vi.fn() } });
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
  it("does not load before consent; initialises once and counts safe navigation once", async () => {
    const { GoogleAnalytics } = await import("@/components/analytics/GoogleAnalytics");
    GoogleAnalytics();
    expect(document.head.appendChild).not.toHaveBeenCalled();
    state.consent = true; GoogleAnalytics(); GoogleAnalytics();
    expect(document.head.appendChild).toHaveBeenCalledTimes(1);
    state.path = "/pricing"; GoogleAnalytics(); GoogleAnalytics();
    state.path = "/r/private-token"; GoogleAnalytics();
    state.path = "/dashboard/campaigns/private-id"; GoogleAnalytics();
    const calls = window.dataLayer!.map((args) => Array.from(args as ArrayLike<unknown>));
    expect(calls.filter((args) => args[1] === "page_view")).toHaveLength(2);
    const payload = JSON.stringify(calls);
    expect(payload).not.toContain("private-token"); expect(payload).not.toContain("private-id"); expect(payload).not.toContain("private@example.com");
    state.consent = false; GoogleAnalytics();
    const { trackEvent, GA_ID } = await import("./events");
    expect(trackEvent("sign_up")).toBe(false);
    expect((window as unknown as Record<string, unknown>)[`ga-disable-${GA_ID}`]).toBe(true);
  });
  it("uses a fixed event contract and strips referral/query data", async () => {
    const { GoogleAnalytics } = await import("@/components/analytics/GoogleAnalytics");
    state.consent = true; GoogleAnalytics();
    const { trackEvent, publicAnalyticsPath, safeReferrer } = await import("./events");
    for (const event of ["signup_start", "sign_up", "campaign_activation", "generate_lead", "support_enquiry"] as const) expect(trackEvent(event)).toBe(true);
    expect(publicAnalyticsPath("/signup?token=secret")).toBeNull();
    expect(publicAnalyticsPath("/dashboard")).toBeNull();
    expect(safeReferrer("https://example.com/a?email=x@y.com")).toBe("https://example.com");
    expect(safeReferrer("invalid")).toBe("");
    expect(JSON.stringify(window.dataLayer)).not.toContain("email=");
  });
  it("keeps local measurement off without an explicit opt-in", async () => {
    vi.stubEnv("NEXT_PUBLIC_GA4_ENABLED", "false");
    state.consent = true;
    const { GoogleAnalytics } = await import("@/components/analytics/GoogleAnalytics");
    GoogleAnalytics();
    expect(document.head.appendChild).not.toHaveBeenCalled();
  });
  it.each([undefined, "false"])("loads in production with consent when the old enable flag is %s", async (flag) => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_GA4_ENABLED", flag);
    state.consent = true;
    const { GoogleAnalytics } = await import("@/components/analytics/GoogleAnalytics");
    GoogleAnalytics(); GoogleAnalytics();
    expect(document.head.appendChild).toHaveBeenCalledTimes(1);
  });
  it("still blocks production loading when consent is rejected", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_GA4_ENABLED", undefined);
    const { GoogleAnalytics } = await import("@/components/analytics/GoogleAnalytics");
    GoogleAnalytics();
    expect(document.head.appendChild).not.toHaveBeenCalled();
  });

});
