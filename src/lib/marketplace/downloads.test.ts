import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type Stripe from "stripe";
import { templatePurchaseArgs } from "@/lib/billing/webhook";
import { packAccess, packBySlug, packs } from "@/lib/marketplace";
import { DOWNLOAD_PURCHASE_KIND, DOWNLOADS, downloadFor, isDownloadPurchasable, type DownloadProduct } from "./downloads";

describe("interactive catalogue is unchanged by the download product", () => {
  it("keeps every interactive price", () => {
    expect(Object.fromEntries(packs.map((p) => [p.slug, p.price]))).toEqual({
      "annual-appraisal-pack": 4900,
      "probation-review-pack": 2900,
      "leadership-360-pack": 5900,
      "engineering-ladder-pack": 6900,
      "sales-performance-pack": 4900,
      "care-worker-appraisal-pack": 5900,
      "childrens-home-appraisal-pack": 6900,
      "eyfs-supervision-pack": 4900,
      "smcr-fitness-propriety-pack": 8900,
      "social-housing-competence-pack": 8900,
    });
  });

  it("keeps slugs and versions stable", () => {
    expect(Object.fromEntries(packs.map((p) => [p.slug, p.version]))).toEqual({
      "annual-appraisal-pack": 1,
      "probation-review-pack": 2,
      "leadership-360-pack": 1,
      "engineering-ladder-pack": 1,
      "sales-performance-pack": 1,
      "care-worker-appraisal-pack": 1,
      "childrens-home-appraisal-pack": 1,
      "eyfs-supervision-pack": 1,
      "smcr-fitness-propriety-pack": 1,
      "social-housing-competence-pack": 1,
    });
  });

  it("keeps interactive entitlements as they were", () => {
    const care = packBySlug("care-worker-appraisal-pack")!;
    expect(packAccess(care, "free", new Set())).toBe("available");
    expect(packAccess(care, "pro", new Set())).toBe("available");
    expect(packAccess(care, "free", new Set([care.slug]))).toBe("owned");
    expect(packAccess(packBySlug("annual-appraisal-pack")!, "pro", new Set())).toBe("included");
  });
});

describe("download configuration", () => {
  it("is configured per pack and only for real packs", () => {
    for (const slug of Object.keys(DOWNLOADS)) expect(packBySlug(slug), slug).toBeDefined();
    // Anonymous 360 relies on the software's aggregation, so it has no paper version.
    expect(downloadFor(packBySlug("leadership-360-pack")!)).toBeNull();
    expect(downloadFor(packBySlug("care-worker-appraisal-pack")!)?.formats).toEqual(["docx", "pdf"]);
  });

  it("takes the pack version from the pack, never its own copy", () => {
    for (const pack of packs) {
      const product = downloadFor(pack);
      if (product) expect(product.packVersion).toBe(pack.version);
    }
  });

  it("has nothing for sale: every download is coming soon with no price", () => {
    for (const pack of packs) {
      const product = downloadFor(pack);
      if (!product) continue;
      expect(product.status).toBe("coming_soon");
      expect(product.price).toBeNull();
      expect(isDownloadPurchasable(product)).toBe(false);
      expect(product.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(product.documentRevision).toBeGreaterThanOrEqual(1);
    }
  });

  it("refuses to sell an 'available' download without an approved price", () => {
    const base = downloadFor(packBySlug("eyfs-supervision-pack")!)!;
    expect(isDownloadPurchasable({ ...base, status: "available", price: null })).toBe(false);
    expect(isDownloadPurchasable({ ...base, status: "retired", price: 1900 })).toBe(false);
    expect(isDownloadPurchasable({ ...base, status: "available", price: 1900, formats: [] } as DownloadProduct)).toBe(false);
    expect(isDownloadPurchasable({ ...base, status: "available", price: 1900 })).toBe(true);
  });

  it("holds no URLs or storage paths", () => {
    expect(JSON.stringify(DOWNLOADS)).not.toMatch(/https?:|\/\/|\.docx|\.pdf|storage|bucket/i);
  });
});

describe("purchase boundaries", () => {
  it("never records a document purchase as an interactive entitlement", () => {
    const session = {
      mode: "payment",
      payment_status: "paid",
      client_reference_id: "00000000-0000-0000-0000-000000000001",
      metadata: { organization_id: "00000000-0000-0000-0000-000000000001", pack_slug: "care-worker-appraisal-pack", kind: DOWNLOAD_PURCHASE_KIND },
      amount_total: 1900,
      currency: "gbp",
      id: "cs_download",
    } as unknown as Stripe.Checkout.Session;
    expect(templatePurchaseArgs(session)).toBeNull();
    expect(templatePurchaseArgs({ ...session, metadata: { ...session.metadata, kind: "template_pack" } } as Stripe.Checkout.Session)).not.toBeNull();
  });

  it("exposes no download checkout, route or URL", () => {
    const actions = readFileSync("src/app/dashboard/marketplace/actions.ts", "utf8");
    expect([...actions.matchAll(/export async function (\w+)/g)].map((m) => m[1]).sort()).toEqual(["buyPack", "usePack"]);
    expect(actions).not.toMatch(/template_download|DOWNLOAD_PURCHASE_KIND/);
    expect(actions).toContain('kind: "template_pack"');

    const routes: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const full = path.join(dir, name);
        if (statSync(full).isDirectory()) walk(full);
        else routes.push(full);
      }
    };
    walk("src/app");
    expect(routes.filter((f) => /download/i.test(path.relative("src/app", f)))).toEqual([]);
  });
});
