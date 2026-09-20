import { BLOG_CATEGORIES, type BlogCategory, type BlogFrontmatter } from "./types";

const REQUIRED = [
  "title",
  "slug",
  "description",
  "excerpt",
  "publishedAt",
  "category",
] as const;

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isCategory(value: string): value is BlogCategory {
  return (BLOG_CATEGORIES as readonly string[]).includes(value);
}

function parseScalar(raw: string): string | boolean | string[] {
  const value = raw.trim();
  if (value === "true") return true;
  if (value === "false") return false;
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  if (value.startsWith("[") && value.endsWith("]")) {
    const inner = value.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(",").map((part) => {
      const item = part.trim();
      if (
        (item.startsWith('"') && item.endsWith('"')) ||
        (item.startsWith("'") && item.endsWith("'"))
      ) {
        return item.slice(1, -1);
      }
      return item;
    });
  }
  return value;
}

/** Minimal YAML-ish frontmatter for the fixed blog schema. */
export function parseFrontmatter(source: string): {
  data: Record<string, unknown>;
  body: string;
} {
  const trimmed = source.replace(/^\uFEFF/, "");
  if (!trimmed.startsWith("---")) {
    throw new Error("Article must start with YAML frontmatter (---)");
  }
  const end = trimmed.indexOf("\n---", 3);
  if (end === -1) {
    throw new Error("Frontmatter closing --- not found");
  }
  const yaml = trimmed.slice(3, end).replace(/^\n/, "");
  const body = trimmed.slice(end + 4).replace(/^\n/, "");
  const data: Record<string, unknown> = {};

  for (const line of yaml.split("\n")) {
    const cleaned = line.trim();
    if (!cleaned || cleaned.startsWith("#")) continue;
    const sep = cleaned.indexOf(":");
    if (sep === -1) {
      throw new Error(`Invalid frontmatter line: ${line}`);
    }
    const key = cleaned.slice(0, sep).trim();
    const value = parseScalar(cleaned.slice(sep + 1));
    data[key] = value;
  }

  return { data, body };
}

export function validateFrontmatter(
  data: Record<string, unknown>,
  filename: string,
): BlogFrontmatter {
  for (const key of REQUIRED) {
    if (typeof data[key] !== "string" || !(data[key] as string).trim()) {
      throw new Error(`${filename}: missing required field "${key}"`);
    }
  }

  const title = (data.title as string).trim();
  const slug = (data.slug as string).trim();
  const description = (data.description as string).trim();
  const excerpt = (data.excerpt as string).trim();
  const publishedAt = (data.publishedAt as string).trim();
  const category = (data.category as string).trim();

  if (!SLUG.test(slug)) {
    throw new Error(
      `${filename}: slug must be lowercase kebab-case (got "${slug}")`,
    );
  }
  if (!DATE.test(publishedAt) || Number.isNaN(Date.parse(publishedAt))) {
    throw new Error(
      `${filename}: publishedAt must be YYYY-MM-DD (got "${publishedAt}")`,
    );
  }
  if (!isCategory(category)) {
    throw new Error(
      `${filename}: category must be one of ${BLOG_CATEGORIES.join(", ")}`,
    );
  }

  let updatedAt: string | undefined;
  if (data.updatedAt !== undefined && data.updatedAt !== null && data.updatedAt !== "") {
    if (typeof data.updatedAt !== "string" || !DATE.test(data.updatedAt.trim())) {
      throw new Error(`${filename}: updatedAt must be YYYY-MM-DD when set`);
    }
    updatedAt = data.updatedAt.trim();
  }

  if (data.featured !== undefined && typeof data.featured !== "boolean") {
    throw new Error(`${filename}: featured must be true or false`);
  }
  if (data.draft !== undefined && typeof data.draft !== "boolean") {
    throw new Error(`${filename}: draft must be true or false`);
  }

  let related: string[] | undefined;
  if (data.related !== undefined) {
    if (!Array.isArray(data.related) || data.related.some((r) => typeof r !== "string")) {
      throw new Error(`${filename}: related must be an array of slugs`);
    }
    related = data.related.map((r) => r.trim()).filter(Boolean);
    for (const r of related) {
      if (!SLUG.test(r)) {
        throw new Error(`${filename}: related slug "${r}" is invalid`);
      }
    }
  }

  return {
    title,
    slug,
    description,
    excerpt,
    publishedAt,
    updatedAt,
    category,
    featured: data.featured === true,
    draft: data.draft === true,
    related,
  };
}

export function readingMinutes(body: string): number {
  const words = body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`\[\]()|-]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
