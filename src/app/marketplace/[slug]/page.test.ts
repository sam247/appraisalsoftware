import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { isIndexablePack, packs, REGULATORY_DISCLAIMER } from "@/lib/marketplace";
import { downloadFor } from "@/lib/marketplace/downloads";
import { absoluteUrl } from "@/lib/site";

vi.mock("next/navigation", () => ({
  usePathname: () => "/marketplace",
  useRouter: () => ({ push: () => undefined, refresh: () => undefined }),
  useSearchParams: () => new URLSearchParams(),
  notFound: () => {
    throw new Error("not found");
  },
}));

// The chrome (header, consent manager) isn't under test here; the page content is.
vi.mock("@/components/layout/SiteChrome", () => ({ SiteChrome: ({ children }: { children: unknown }) => children }));

const page = await import("./page");
const params = (slug: string) => ({ params: Promise.resolve({ slug }) });
async function html(slug: string): Promise<string> {
  return renderToStaticMarkup(await page.default(params(slug)));
}
const text = (markup: string) =>
  markup
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ");

describe("public pack pages", () => {
  it("keep canonical URLs, titles and indexing", async () => {
    for (const pack of packs) {
      const meta = await page.generateMetadata(params(pack.slug));
      expect(meta.alternates?.canonical).toBe(absoluteUrl(`/marketplace/${pack.slug}`));
      expect(meta.title).toBe(`${pack.seoTitle ?? `${pack.name} Template`} | Appraisal Software`);
      if (isIndexablePack(pack)) expect(meta.robots).toBeUndefined();
      else expect(meta.robots).toEqual({ index: false, follow: true });
    }
  });

  it("server-render the full question list, version, nations and disclaimer", async () => {
    for (const pack of packs) {
      const body = text(await html(pack.slug));
      expect(body).toContain(`All ${pack.questions.length} questions`);
      for (const q of pack.questions) expect(body).toContain(q.prompt);
      expect(body).toContain(`Version ${pack.version}`);
      expect(body).toContain("Get this pack");
      if (pack.basis) {
        expect(body).toContain(pack.basis);
        expect(body).toContain(REGULATORY_DISCLAIMER);
      }
    }
  });

  it("show downloads as coming soon only, with no way to buy or fetch a file", async () => {
    for (const pack of packs) {
      const markup = await html(pack.slug);
      const body = text(markup);
      const hrefs = [...markup.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
      expect(hrefs.filter((h) => /download|\.docx|\.pdf/i.test(h))).toEqual([]);
      if (downloadFor(pack)) {
        expect(body).toContain("Editable Word + printable PDF");
        expect(body).toContain("Coming soon");
        expect(body).toContain("Not available to buy yet");
        expect(body).toContain("Word and printable PDF versions");
        const option = markup.slice(markup.indexOf("Downloadable template") - 400, markup.indexOf("Not available to buy yet"));
        expect(option).toContain('aria-disabled="true"');
        expect(option).not.toMatch(/<a\b|<button\b|<form\b/);
        // The indicative download price is never shown.
        expect(markup).not.toMatch(/24\.99|2499/);
      } else {
        expect(body).not.toContain("Word + PDF");
      }
    }
  });

  const jsonLd = (markup: string) =>
    [...markup.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]) as Record<string, unknown>);

  it("publish no Product markup when packs can't be bought online", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    for (const pack of packs) expect(jsonLd(await html(pack.slug)).map((b) => b["@type"])).toEqual(["BreadcrumbList"]);
    vi.unstubAllEnvs();
  });

  it("describe only the interactive offer, at its real price, and never a download", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_schema");
    for (const pack of packs) {
      const blocks = jsonLd(await html(pack.slug));
      const products = blocks.filter((b) => b["@type"] === "Product");
      if (pack.campaignType === "feedback_360") {
        // Needs Pro before it can be bought, so no InStock offer is advertised.
        expect(products).toEqual([]);
        continue;
      }
      expect(products).toHaveLength(1);
      const product = products[0] as { name: string; sku: string; url: string; offers: Record<string, unknown> };
      expect(product.name).toBe(pack.name);
      expect(product.sku).toBe(pack.slug);
      expect(product.url).toBe(absoluteUrl(`/marketplace/${pack.slug}`));
      expect(product.offers).toMatchObject({
        "@type": "Offer",
        price: (pack.price / 100).toFixed(2),
        priceCurrency: "GBP",
        availability: "https://schema.org/InStock",
        priceSpecification: { "@type": "UnitPriceSpecification", valueAddedTaxIncluded: false },
      });
      const json = JSON.stringify(blocks);
      expect(json).not.toMatch(/AggregateOffer|AggregateRating|"Review"|download|\.docx|\.pdf|24\.99/i);
      expect(validateSchema(product)).toEqual([]);
    }
    vi.unstubAllEnvs();
  });
});

/**
 * Property → types it is defined on, from the Schema.org vocabulary
 * (schemaorg-current-https.jsonld, checked 18 Oct 2026), for the properties we emit.
 */
const SCHEMA_DOMAINS: Record<string, string[]> = {
  name: ["Thing"],
  description: ["Thing"],
  image: ["Thing"],
  url: ["Thing"],
  sku: ["Offer", "Product", "Demand"],
  category: ["Offer", "Product", "Service"],
  brand: ["Product", "Service", "Organization", "Person"],
  offers: ["Product", "Service", "CreativeWork", "Event"],
  price: ["Offer", "PriceSpecification"],
  priceCurrency: ["Offer", "PriceSpecification"],
  priceSpecification: ["Offer", "Demand"],
  valueAddedTaxIncluded: ["PriceSpecification"],
  availability: ["Offer", "Demand"],
  seller: ["Offer", "Demand"],
};
/** Subtype → supertypes, for the types we emit. */
const SUPERTYPES: Record<string, string[]> = {
  Product: ["Thing"],
  Offer: ["Intangible", "Thing"],
  Brand: ["Intangible", "Thing"],
  Organization: ["Thing"],
  UnitPriceSpecification: ["PriceSpecification", "StructuredValue", "Intangible", "Thing"],
};

function validateSchema(node: Record<string, unknown>, problems: string[] = []): string[] {
  const type = node["@type"] as string;
  const types = [type, ...(SUPERTYPES[type] ?? [])];
  if (!SUPERTYPES[type]) problems.push(`unknown type ${type}`);
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("@")) continue;
    const domains = SCHEMA_DOMAINS[key];
    if (!domains || !domains.some((d) => types.includes(d))) problems.push(`${type}.${key} is not a Schema.org property of ${type}`);
    if (value && typeof value === "object" && !Array.isArray(value)) validateSchema(value as Record<string, unknown>, problems);
  }
  return problems;
}
