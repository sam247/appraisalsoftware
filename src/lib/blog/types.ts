export const BLOG_CATEGORIES = [
  "Appraisal Process",
  "Managers",
  "HR Teams",
  "Performance Reviews",
  "360 Feedback",
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export type BlogFrontmatter = {
  title: string;
  slug: string;
  description: string;
  excerpt: string;
  publishedAt: string;
  updatedAt?: string;
  category: BlogCategory;
  featured?: boolean;
  draft?: boolean;
  related?: string[];
};

export type BlogPost = BlogFrontmatter & {
  body: string;
  readingMinutes: number;
};
