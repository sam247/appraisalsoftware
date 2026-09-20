import fs from "node:fs";
import path from "node:path";

import {
  parseFrontmatter,
  readingMinutes,
  validateFrontmatter,
} from "./parse";
import type { BlogPost } from "./types";

const CONTENT_DIR = path.join(process.cwd(), "content/blog");

function loadAllPosts(): BlogPost[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((name) => name.endsWith(".md"))
    .sort();

  const posts: BlogPost[] = [];
  const slugs = new Set<string>();

  for (const file of files) {
    const filename = path.join(CONTENT_DIR, file);
    const source = fs.readFileSync(filename, "utf8");
    const { data, body } = parseFrontmatter(source);
    const meta = validateFrontmatter(data, file);

    if (slugs.has(meta.slug)) {
      throw new Error(`Duplicate blog slug "${meta.slug}" in ${file}`);
    }
    slugs.add(meta.slug);

    const expected = `${meta.slug}.md`;
    if (file !== expected) {
      throw new Error(
        `${file}: filename must match slug (expected "${expected}")`,
      );
    }

    posts.push({
      ...meta,
      body: body.trim(),
      readingMinutes: readingMinutes(body),
    });
  }

  return posts.sort((a, b) => {
    if (a.publishedAt === b.publishedAt) return a.title.localeCompare(b.title);
    return a.publishedAt < b.publishedAt ? 1 : -1;
  });
}

let cache: BlogPost[] | null = null;

export function getAllPosts(): BlogPost[] {
  if (process.env.NODE_ENV === "development") return loadAllPosts();
  if (!cache) cache = loadAllPosts();
  return cache;
}

export function getPublishedPosts(): BlogPost[] {
  const now = new Date().toISOString().slice(0, 10);
  return getAllPosts().filter(
    (post) => !post.draft && post.publishedAt <= now,
  );
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return getPublishedPosts().find((post) => post.slug === slug);
}

export function getFeaturedPost(): BlogPost | undefined {
  const published = getPublishedPosts();
  return published.find((post) => post.featured) ?? published[0];
}

export function getRelatedPosts(post: BlogPost, limit = 3): BlogPost[] {
  const published = getPublishedPosts().filter((p) => p.slug !== post.slug);
  const picked: BlogPost[] = [];
  const seen = new Set<string>();

  for (const slug of post.related ?? []) {
    const match = published.find((p) => p.slug === slug);
    if (match && !seen.has(match.slug)) {
      picked.push(match);
      seen.add(match.slug);
    }
  }

  for (const candidate of published) {
    if (picked.length >= limit) break;
    if (seen.has(candidate.slug)) continue;
    if (candidate.category === post.category) {
      picked.push(candidate);
      seen.add(candidate.slug);
    }
  }

  for (const candidate of published) {
    if (picked.length >= limit) break;
    if (seen.has(candidate.slug)) continue;
    picked.push(candidate);
    seen.add(candidate.slug);
  }

  return picked.slice(0, limit);
}

export function blogPath(slug: string): string {
  return `/blog/${slug}`;
}

export function formatBlogDate(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
