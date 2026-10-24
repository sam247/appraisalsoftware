import PricingPage from "@/app/pricing/page";
import { PricingPreview } from "@/components/home/HomeBands";
import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { existsSync, readFileSync } from "node:fs";
import { INDEXABLE_PATHS, LEGAL_ROUTES } from "@/lib/routes";
import { isIndexableDeployment, absoluteUrl } from "@/lib/site";
import sitemap from "@/app/sitemap";
import { resources, resourceListings } from "@/lib/resource-content";
import { pageMetadata } from "@/lib/metadata";
import nextConfig from "../../next.config";
import { metadata as appraisalsMetadata } from "@/app/360-appraisals/page";
import { createHash } from "node:crypto";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ResourceHub } from "@/components/resources/ResourceHub";
import { metadata as privacyMetadata } from "@/app/privacy/page";
import { metadata as cookiesMetadata } from "@/app/cookies/page";
import { COOKIE_POLICY_URL, PRIVACY_URL, PRIMARY_CTA_LABEL } from "@/lib/links";
import { FaqSection } from "@/components/marketing/PageSections";
import { HomeFaqSection } from "@/components/home/Sections";

// These server-rendering checks isolate the client consent controls; browser checks exercise the real provider.
vi.mock("@c15t/nextjs", () => ({ useConsentDialogTrigger: () => ({ openDialog: vi.fn() }) }));

vi.mock("@/lib/supabase/middleware", async () => {
  const { NextResponse } = await import("next/server");
  return {
    updateSession: async () => ({
      user: null,
      supabaseResponse: NextResponse.next(),
    }),
  };
});

describe("marketing routes and indexability", () => {
  it("renders permanent Free with self-serve paid CTAs and a compact accurate comparison", () => {
    const pricing = renderToStaticMarkup(createElement(PricingPage));
    const preview = renderToStaticMarkup(createElement(PricingPreview));
    for (const html of [pricing, preview]) {
      expect(html).toContain("Start Free");
      expect(html).toContain("£0");
      expect(html).toContain("£39.99");
      expect(html).toContain("£89.99");
      expect(html).toContain("Forever");
      expect(html).not.toMatch(/trial|14.day|read.only/i);
    }
    expect(pricing).toContain("10 active employees");
    expect(pricing).toContain("1 active campaign");
    expect(pricing).toContain("1 admin, including the owner");
    expect(pricing).toContain("Available on Pro");
    expect(pricing).toContain("/signup?plan=pro");
    expect(pricing).toContain("/signup?plan=organisation");
    expect(pricing).toContain("Choose Pro");
    expect(pricing).not.toContain("Paid activation is handled by our team");
    expect(pricing.match(/<tr/g)).toHaveLength(10);
  });
  it("renders collapsed native FAQs with their full answers on home and shared sections", () => {
    const shared = renderToStaticMarkup(createElement(FaqSection, { items: [{ question: "Example question", answer: "Complete answer" }] }));
    expect(shared).toContain("<details");
    expect(shared).toContain("<summary");
    expect(shared).toContain("Complete answer");
    expect(shared).not.toMatch(/<details[^>]*\bopen\b/);
    const home = renderToStaticMarkup(createElement(HomeFaqSection));
    expect(home.match(/<details/g)).toHaveLength(4);
    expect(home).not.toMatch(/<details[^>]*\bopen\b/);
  });
  it("keeps first-party legal destinations self-canonical and outside the SEO inventory", () => {
    for (const [path, metadata, href] of [
      [LEGAL_ROUTES.privacy, privacyMetadata, PRIVACY_URL],
      [LEGAL_ROUTES.cookies, cookiesMetadata, COOKIE_POLICY_URL],
    ] as const) {
      expect(metadata.alternates?.canonical).toBe(absoluteUrl(path));
      expect(href).toBe(absoluteUrl(path));
      expect(metadata.robots).toEqual({ index: false, follow: true });
      expect(sitemap().map((entry) => entry.url)).not.toContain(href);
    }
    expect(PRIMARY_CTA_LABEL).toBe("Start Free");
  });
  it("consolidates retired pages directly with 301 redirects", async () => {
    const redirects = await nextConfig.redirects!();
    for (const [source, destination] of [
      ["/annual-appraisal-software", "/employee-appraisal-software"],
      ["/360-feedback-software", "/360-appraisals"],
      ["/360-feedback-examples", "/360-feedback-template"],
    ]) {
      expect(redirects).toContainEqual({ source, destination, statusCode: 301 });
      expect(sitemap().map((entry) => entry.url)).not.toContain(absoluteUrl(source));
      expect(redirects.some((redirect) => redirect.source === destination)).toBe(false);
    }
    expect(appraisalsMetadata.alternates?.canonical).toBe(
      absoluteUrl("/360-appraisals"),
    );
  });
  it("preserves the proven answer and 360 template content and intent", () => {
    // Pages with proven traffic may gain sections, but their title, description,
    // intent, form and original sections stay exactly as they were.
    const sha = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
    const preserved: Record<string, { core: string; sections: string[] }> = {
      "appraisal-answers": {
        core: "fbb1660e7a8219c72ac10f6dfdf1f6499fd41239890193308e598edd5373ce7f",
        sections: [
          "320b9ea18056c161b1f8808ae9b70ba83df93fbe4368f7fa16e4bb99446de54c",
          "6d0778011e4059f898581a5f796bfb31d411aaa8499c4fc401f2190ee6804145",
          "1d9ccf4a3a51452c1ae4357dabc174468ded81d773e40c9793f4e3dd4c68e985",
          "9c94e3552e7e47ebd0d5597ffa927c3ca6cb3f4284c43e53e9e87545c218f391",
          "f4cda4011c9b7b242634ce0af9d558a792aaa72de5d40c78d4788181f932617f",
          "0103e9ed0ca6fd9d3bc49b070036bd7f45688d287193852fb1c2c3e0fa64f97a",
        ],
      },
      "360-feedback-template": {
        core: "4eafa3d70add91271b3d829e2dcb292f87dd7dc77b625c0eff17dd62996e6b2a",
        sections: [
          "5a6538827f6af8286de1710c9f4c4d9e1e26f02ec18ff681c1a57f73d351030c",
          "effbfa21666c1956510b055bf3fa026a008b4644a2467262d82dc203c0b3eec5",
          "189ac066a82b97c2bc2dce620d57332cfc99cdda06c584e641ac3261bc27c2d8",
          "f8f9892539f4cdf59efb0ceaf89523fbbdad912508180f06fe762d603d2503d1",
        ],
      },
    };
    for (const [slug, expected] of Object.entries(preserved)) {
      const resource = resources.find((entry) => entry.slug === slug)!;
      expect(sha({ title: resource.title, description: resource.description, intent: resource.intent, template: resource.template ?? null })).toBe(expected.core);
      const sectionDigests = resource.sections.map(sha);
      const positions = expected.sections.map((digest) => sectionDigests.indexOf(digest));
      expect(positions).not.toContain(-1);
      expect([...positions].sort((a, b) => a - b)).toEqual(positions);
      expect(INDEXABLE_PATHS).toContain(`/${slug}`);
    }
  });
  it("gives templates and resources different content and covers every page in ownership", () => {
    const catalogue = renderToStaticMarkup(createElement(ResourceHub, { templates: true }));
    const guidance = renderToStaticMarkup(createElement(ResourceHub));
    const templateSlugs = resources.filter((resource) => resource.kind === "template").map((resource) => resource.slug);
    for (const slug of templateSlugs) {
      expect(catalogue).toContain(`href="/${slug}#template"`);
      expect(guidance).not.toContain(`href="/${slug}#template"`);
    }
    expect(guidance).toContain('id="employee-appraisals"');
    expect(guidance).toContain('id="360-appraisals"');
    // The blog is a separate archive: the learning hub links to guides, not articles
    // (the site footer still links to the blog index).
    expect(guidance.slice(guidance.indexOf("<main>"), guidance.indexOf("</main>"))).not.toContain('href="/blog');
    expect(catalogue).toContain("not automatically imported");
    const ownership = readFileSync("docs/seo/url-ownership.md", "utf8");
    for (const entry of sitemap()) {
      const path = new URL(entry.url).pathname;
      expect(ownership).toContain(`| ${path} |`);
    }
  });
  it("allows public appraisal URLs while protecting the actual app namespace", async () => {
    for (const path of INDEXABLE_PATHS) {
      const response = await proxy(
        new NextRequest(`https://appraisalsoftware.co.uk${path}`),
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    }
    for (const path of [
      "/dashboard",
      "/dashboard/campaigns",
      "/dashboard/people",
    ]) {
      const response = await proxy(
        new NextRequest(`https://appraisalsoftware.co.uk${path}`),
      );
      expect(response.status).toBe(308);
      const destination = new URL(response.headers.get("location")!);
      expect(destination.host).toBe("app.appraisalsoftware.co.uk");
      expect(destination.pathname).toBe(path);
    }
  });

  it("keeps product surfaces on the app host after the apex hop", async () => {
    const response = await proxy(
      new NextRequest("https://app.appraisalsoftware.co.uk/dashboard"),
    );
    expect(response.status).toBe(307);
    const destination = new URL(response.headers.get("location")!);
    expect(destination.host).toBe("app.appraisalsoftware.co.uk");
    expect(destination.pathname).toBe("/login");
    expect(destination.searchParams.get("next")).toBe("/dashboard");
  });

  it("redirects legacy /app paths to /dashboard", async () => {
    const response = await proxy(
      new NextRequest("https://app.appraisalsoftware.co.uk/app/campaigns"),
    );
    expect(response.status).toBe(308);
    const destination = new URL(response.headers.get("location")!);
    expect(destination.pathname).toBe("/dashboard/campaigns");
  });
  it("keeps public routes, canonical metadata and sharing images aligned", () => {
    expect(new Set(INDEXABLE_PATHS).size).toBe(INDEXABLE_PATHS.length);
    const sitemapUrls = sitemap().map((entry) => entry.url);
    expect(sitemapUrls).toEqual(
      expect.arrayContaining(INDEXABLE_PATHS.map(absoluteUrl)),
    );
    for (const path of INDEXABLE_PATHS) {
      expect(existsSync(`src/app${path === "/" ? "" : path}/page.tsx`)).toBe(
        true,
      );
      const slug = path === "/" ? "home" : path.slice(1);
      expect(existsSync(`public/social/${slug}.png`)).toBe(true);
      expect(
        pageMetadata({ title: slug, description: slug, path }).alternates
          ?.canonical,
      ).toBe(absoluteUrl(path));
    }
    expect(resourceListings.map((resource) => resource.slug)).toContain(
      "appraisal-answers",
    );
    for (const resource of resourceListings)
      expect(INDEXABLE_PATHS).toContain(`/${resource.slug}`);
    for (const resource of resources) {
      expect(INDEXABLE_PATHS).toContain(`/${resource.slug}`);
      for (const related of resource.related)
        expect(INDEXABLE_PATHS).toContain(`/${related}`);
      if (resource.slug.startsWith("360"))
        expect(resource.bridge).toBeDefined();
    }
  });

  it("does not let a production build index an explicitly non-production deployment", () => {
    expect(isIndexableDeployment("preview", "production")).toBe(false);
    expect(isIndexableDeployment("development", "production")).toBe(false);
    expect(isIndexableDeployment("production", "production")).toBe(true);
    expect(isIndexableDeployment(undefined, "production")).toBe(true);
    expect(isIndexableDeployment(undefined, "development")).toBe(false);
    for (const folder of ["(auth)", "dashboard", "onboarding", "r", "invite"]) {
      expect(readFileSync(`src/app/${folder}/layout.tsx`, "utf8")).toContain(
        "index: false",
      );
      expect(
        INDEXABLE_PATHS.some(
          (path) => path === `/${folder}` || path.startsWith(`/${folder}/`),
        ),
      ).toBe(false);
    }
  });
});
