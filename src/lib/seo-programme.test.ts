import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getAllPosts, getPublishedPosts } from "./blog/posts";
import { INDEXABLE_PATHS } from "./routes";
import sitemap from "@/app/sitemap";

describe("SEO publication discipline", () => {
 it("keeps six staged articles outside public discovery and validates their local links", () => {
  const all = getAllPosts();
  const drafts = all.filter(p => p.draft);
  expect(drafts).toHaveLength(6);
  for (const post of drafts) {
   expect(getPublishedPosts().some(p => p.slug === post.slug)).toBe(false);
   expect(sitemap().some(entry => entry.url.endsWith(`/blog/${post.slug}`))).toBe(false);
   for (const match of post.body.matchAll(/\]\((\/[^)]+)\)/g)) {
    const destination = match[1].split(/[?#]/)[0];
    expect(INDEXABLE_PATHS.includes(destination as typeof INDEXABLE_PATHS[number]) || all.some(p => `/blog/${p.slug}` === destination), `${post.slug}: ${destination}`).toBe(true);
   }
  }
 });
 it("accounts for all 50 keyword rows with no fabricated UK volume", () => {
  const register = fs.readFileSync(path.join(process.cwd(), "docs/seo/keyword-register.csv"), "utf8");
  expect(register.trim().split(/\r?\n/)).toHaveLength(51);
  expect(register).not.toContain("research pending");
  expect(register).toContain("Global/other market estimate");
  expect(register).toContain("Unverified; not SEO difficulty");
 });
});
