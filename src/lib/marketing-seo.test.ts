import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { existsSync, readFileSync } from "node:fs";
import { INDEXABLE_PATHS } from "@/lib/routes";
import { isIndexableDeployment, absoluteUrl } from "@/lib/site";
import sitemap from "@/app/sitemap";
import { resources } from "@/lib/resource-content";
import { pageMetadata } from "@/lib/metadata";

vi.mock("@/lib/supabase/middleware", async () => {
  const { NextResponse } = await import("next/server");
  return { updateSession: async () => ({ user: null, supabaseResponse: NextResponse.next() }) };
});

describe("marketing routes and indexability", () => {
  it("allows public appraisal URLs while protecting the actual app namespace", async () => {
    for (const path of INDEXABLE_PATHS) {
      const response = await proxy(new NextRequest(`https://appraisalsoftware.co.uk${path}`));
      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    }
    for (const path of ["/dashboard", "/dashboard/campaigns", "/dashboard/people"]) {
      const response = await proxy(new NextRequest(`https://appraisalsoftware.co.uk${path}`));
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
      expect(existsSync(`src/app${path === "/" ? "" : path}/page.tsx`)).toBe(true);
      const slug = path === "/" ? "home" : path.slice(1);
      expect(existsSync(`public/social/${slug}.png`)).toBe(true);
      expect(pageMetadata({ title: slug, description: slug, path }).alternates?.canonical).toBe(absoluteUrl(path));
    }
    for (const resource of resources) {
      expect(INDEXABLE_PATHS).toContain(`/${resource.slug}`);
      for (const related of resource.related) expect(INDEXABLE_PATHS).toContain(`/${related}`);
      if (resource.slug.startsWith("360")) expect(resource.bridge).toBeUndefined();
    }
  });

  it("does not let a production build index an explicitly non-production deployment", () => {
    expect(isIndexableDeployment("preview", "production")).toBe(false);
    expect(isIndexableDeployment("development", "production")).toBe(false);
    expect(isIndexableDeployment("production", "production")).toBe(true);
    expect(isIndexableDeployment(undefined, "production")).toBe(true);
    expect(isIndexableDeployment(undefined, "development")).toBe(false);
    for (const folder of ["(auth)", "dashboard", "onboarding", "r", "invite"]) {
      expect(readFileSync(`src/app/${folder}/layout.tsx`, "utf8")).toContain("index: false");
      expect(INDEXABLE_PATHS.some((path) => path === `/${folder}` || path.startsWith(`/${folder}/`))).toBe(false);
    }
  });
});
