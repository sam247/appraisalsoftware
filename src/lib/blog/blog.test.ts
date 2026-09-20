import { describe, expect, it } from "vitest";

import {
  parseFrontmatter,
  readingMinutes,
  validateFrontmatter,
} from "@/lib/blog/parse";
import {
  blogPath,
  getPostBySlug,
  getPublishedPosts,
} from "@/lib/blog/posts";
import { articleSchema, breadcrumbSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/metadata";
import { absoluteUrl } from "@/lib/site";
import sitemap from "@/app/sitemap";
import { INDEXABLE_PATHS, ROUTES } from "@/lib/routes";

const STARTER = `---
title: When Self and Manager Ratings Differ
slug: when-self-and-manager-ratings-differ
description: A practical guide for managers.
excerpt: Differences between ratings are common.
publishedAt: 2026-09-20
category: Managers
featured: true
---

## Heading

Paragraph with a [link](/how-it-works).
`;

describe("blog content system", () => {
  it("loads the published starter article", () => {
    const posts = getPublishedPosts();
    expect(posts.length).toBeGreaterThan(0);
    const starter = getPostBySlug("when-self-and-manager-ratings-differ");
    expect(starter?.title).toContain("Self and Manager");
    expect(starter?.category).toBe("Managers");
    expect(starter?.readingMinutes).toBeGreaterThan(0);
    expect(starter?.draft).toBeFalsy();
  });

  it("returns undefined for unknown slugs", () => {
    expect(getPostBySlug("does-not-exist")).toBeUndefined();
  });

  it("generates article metadata with canonical and social fields", () => {
    const post = getPostBySlug("when-self-and-manager-ratings-differ")!;
    const meta = pageMetadata({
      title: `${post.title} | Appraisal Software`,
      description: post.description,
      path: blogPath(post.slug),
      ogType: "article",
      imagePath: "/social/blog.png",
    });
    expect(meta.alternates?.canonical).toBe(
      absoluteUrl(blogPath(post.slug)),
    );
    expect(meta.openGraph).toMatchObject({
      type: "article",
      url: absoluteUrl(blogPath(post.slug)),
    });
    const images = meta.openGraph?.images;
    const first = Array.isArray(images) ? images[0] : images;
    expect(first).toMatchObject({
      url: absoluteUrl("/social/blog.png"),
    });
  });

  it("includes /blog and published articles in the sitemap", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toContain(absoluteUrl(ROUTES.blog));
    expect(urls).toContain(
      absoluteUrl(blogPath("when-self-and-manager-ratings-differ")),
    );
    for (const path of INDEXABLE_PATHS) {
      expect(urls).toContain(absoluteUrl(path));
    }
  });

  it("builds Article and breadcrumb structured data with known fields only", () => {
    const path = blogPath("when-self-and-manager-ratings-differ");
    const article = articleSchema({
      title: "Example",
      description: "Desc",
      path,
      datePublished: "2026-09-20",
      dateModified: "2026-09-20",
    });
    expect(article["@type"]).toBe("Article");
    expect(article.datePublished).toBe("2026-09-20");
    expect(article.image).toBe(absoluteUrl("/social/blog.png"));

    const crumbs = breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Blog", path: "/blog" },
      { name: "Example", path },
    ]);
    expect(crumbs.itemListElement).toHaveLength(3);
    expect(crumbs.itemListElement[1].name).toBe("Blog");
  });

  it("rejects malformed required frontmatter", () => {
    const { data } = parseFrontmatter(STARTER);
    delete data.title;
    expect(() => validateFrontmatter(data, "bad.md")).toThrow(/title/);
    expect(() =>
      validateFrontmatter(
        { ...data, title: "x", slug: "Bad Slug" },
        "bad.md",
      ),
    ).toThrow(/slug/);
    expect(() =>
      validateFrontmatter(
        {
          title: "x",
          slug: "ok-slug",
          description: "d",
          excerpt: "e",
          publishedAt: "20-09-2026",
          category: "Managers",
        },
        "bad.md",
      ),
    ).toThrow(/publishedAt/);
    expect(() =>
      validateFrontmatter(
        {
          title: "x",
          slug: "ok-slug",
          description: "d",
          excerpt: "e",
          publishedAt: "2026-09-20",
          category: "Not A Category",
        },
        "bad.md",
      ),
    ).toThrow(/category/);
  });

  it("hides draft posts from the public catalogue", () => {
    const { data, body } = parseFrontmatter(`---
title: Draft Piece
slug: draft-piece
description: Hidden
excerpt: Hidden
publishedAt: 2026-09-20
category: Managers
draft: true
---

Body
`);
    const meta = validateFrontmatter(data, "draft-piece.md");
    expect(meta.draft).toBe(true);
    expect(readingMinutes(body)).toBe(1);
    expect(
      getPublishedPosts().some((post) => post.slug === "draft-piece"),
    ).toBe(false);
  });
});
