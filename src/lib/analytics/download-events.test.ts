import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("download analytics", () => {
  const gtag = vi.fn();
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_GA4_ENABLED", "true");
    gtag.mockReset();
    vi.stubGlobal("window", { location: { origin: "https://appraisalsoftware.co.uk" }, appraisalMeasurementConsent: true, gtag });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("sends only a catalogue slug and the product type", async () => {
    const { trackDownloadEvent, GA_ID } = await import("./events");
    expect(trackDownloadEvent("download_option_viewed", "eyfs-supervision-pack")).toBe(true);
    expect(gtag).toHaveBeenCalledWith("event", "download_option_viewed", {
      send_to: GA_ID,
      pack_slug: "eyfs-supervision-pack",
      product_type: "download",
      page_location: "https://appraisalsoftware.co.uk/",
      page_referrer: "",
      page_title: "Appraisal Software",
    });
  });

  it("drops anything that isn't a configured download pack, and respects consent", async () => {
    const { trackDownloadEvent } = await import("./events");
    expect(trackDownloadEvent("download_option_viewed", "someone@example.com")).toBe(false);
    expect(trackDownloadEvent("download_option_viewed", "leadership-360-pack")).toBe(false);
    expect(trackDownloadEvent("download_option_viewed", "__proto__")).toBe(false);
    // Future events are not callable at all (a type error); at runtime they are refused too.
    expect(trackDownloadEvent("download_purchase_completed" as never, "eyfs-supervision-pack")).toBe(false);
    (window as unknown as { appraisalMeasurementConsent: boolean }).appraisalMeasurementConsent = false;
    expect(trackDownloadEvent("download_option_viewed", "eyfs-supervision-pack")).toBe(false);
    expect(gtag).not.toHaveBeenCalled();
  });

  it("fires no purchase or delivery event anywhere in the app yet", () => {
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const full = path.join(dir, name);
        if (statSync(full).isDirectory()) walk(full);
        else if (/\.(ts|tsx)$/.test(name) && !/\.test\.ts$/.test(name)) files.push(full);
      }
    };
    walk("src");
    const users = files.filter((f) => f !== path.join("src/lib/analytics/events.ts") && /download_(purchase_started|purchase_completed|delivered|coming_soon_clicked)/.test(readFileSync(f, "utf8")));
    expect(users).toEqual([]);
  });
});
