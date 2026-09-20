import Link from "next/link";

import { SiteChrome } from "@/components/layout/SiteChrome";
import { PageHero, homeCrumb } from "@/components/marketing/PageSections";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  blogPath,
  formatBlogDate,
  getPublishedPosts,
} from "@/lib/blog/posts";
import type { BlogPost } from "@/lib/blog/types";
import { breadcrumbSchema } from "@/lib/schema";
import { ROUTES } from "@/lib/routes";

function PostCard({ post }: { post: BlogPost }) {
  return (
    <li className="h-full">
      <Link
        href={blogPath(post.slug)}
        className="flex h-full flex-col rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-sm"
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="font-medium text-primary">{post.category}</span>
          <time dateTime={post.publishedAt}>
            {formatBlogDate(post.publishedAt)}
          </time>
          <span>{post.readingMinutes} min read</span>
        </div>
        <h2 className="mt-3 font-display text-lg font-semibold leading-snug tracking-tight text-foreground">
          {post.title}
        </h2>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
          {post.excerpt}
        </p>
      </Link>
    </li>
  );
}

export function BlogIndex() {
  const posts = getPublishedPosts();

  return (
    <SiteChrome>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Blog", path: ROUTES.blog },
        ])}
      />
      <PageHero
        eyebrow="Blog"
        title="Practical notes on appraisals"
        description="Clear guidance for managers and small HR teams running employee reviews — without the heavyweight HR platform theatre."
        breadcrumbs={[homeCrumb(), { label: "Blog", href: ROUTES.blog }]}
      />

      <section className="border-b border-border py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          {posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              New articles will appear here soon.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
              {posts.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </ul>
          )}
        </div>
      </section>
    </SiteChrome>
  );
}
