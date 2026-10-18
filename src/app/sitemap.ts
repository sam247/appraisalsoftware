import type { MetadataRoute } from "next";

import { blogPath, getPublishedPosts } from "@/lib/blog/posts";
import { isIndexablePack, packPublicPath, packs } from "@/lib/marketplace";
import { INDEXABLE_PATHS } from "@/lib/routes";
import { absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const marketing = INDEXABLE_PATHS.map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: (path === "/" ? "weekly" : "monthly") as
      | "weekly"
      | "monthly",
    priority: path === "/" ? 1 : 0.8,
  }));

  const articles = getPublishedPosts().map((post) => ({
    url: absoluteUrl(blogPath(post.slug)),
    lastModified: post.updatedAt ?? post.publishedAt,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const packPages = packs.filter(isIndexablePack).map((pack) => ({
    url: absoluteUrl(packPublicPath(pack.slug)),
    lastModified: pack.reviewed,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...marketing, ...articles, ...packPages];
}
