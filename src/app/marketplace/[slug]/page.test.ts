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
        // No download price is shown: the only prices are interactive ones.
        expect(body).not.toMatch(/£(1[0-9]|2[0-9])\b(?! one-off)/);
      } else {
        expect(body).not.toContain("Word + PDF");
      }
    }
  });

  it("publish no Product or Offer data, so unavailable downloads are never advertised", async () => {
    for (const pack of packs) {
      const markup = await html(pack.slug);
      const blocks = [...markup.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
      expect(blocks.length).toBeGreaterThan(0);
      const json = JSON.stringify(blocks);
      expect(json).not.toMatch(/"@type":"(Product|Offer|AggregateOffer|AggregateRating|Review)"/);
      expect(json).not.toMatch(/download|\.docx|\.pdf/i);
      expect(blocks.map((b) => b["@type"])).toEqual(["BreadcrumbList"]);
    }
  });
});
