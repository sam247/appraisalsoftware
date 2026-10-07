import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { existsSync, readFileSync } from "node:fs";
import { INDEXABLE_PATHS } from "@/lib/routes";
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
  it("consolidates both retired commercial pages directly with 301 redirects", async () => {
    const redirects = await nextConfig.redirects!();
    for (const [source, destination] of [
      ["/annual-appraisal-software", "/employee-appraisal-software"],
      ["/360-feedback-software", "/360-appraisals"],
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
    for (const [slug, digest] of [
      ["appraisal-answers", "5accc5d95c2ee5d24757183066e737e46011561371a4da6b0da7fe73364902aa"],
      ["360-feedback-template", "c664974b855d20d63170970d60e23e3adda9941d1c134e07180a6bf66a6822f8"],
    ]) {
      const resource = resources.find((entry) => entry.slug === slug)!;
      const content = { title: resource.title, description: resource.description, intent: resource.intent, sections: resource.sections, template: resource.template ?? null };
      expect(createHash("sha256").update(JSON.stringify(content)).digest("hex")).toBe(digest);
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
    expect(guidance).toContain('href="/blog/when-self-and-manager-ratings-differ"');
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
      "appraisal-questions",
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
