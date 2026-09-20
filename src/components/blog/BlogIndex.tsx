import Link from "next/link";

import { SiteChrome } from "@/components/layout/SiteChrome";
import { PageHero, homeCrumb } from "@/components/marketing/PageSections";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  blogPath,
  formatBlogDate,
  getFeaturedPost,
  getPublishedPosts,
} from "@/lib/blog/posts";
import type { BlogPost } from "@/lib/blog/types";
import { breadcrumbSchema } from "@/lib/schema";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

function PostCard({
  post,
  featured = false,
}: {
  post: BlogPost;
  featured?: boolean;
}) {
  return (
    <li>
      <Link
        href={blogPath(post.slug)}
        className={cn(
          "block rounded-xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-sm",
          featured ? "p-6 sm:p-8" : "p-5",
        )}
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="font-medium text-primary">{post.category}</span>
          <time dateTime={post.publishedAt}>
            {formatBlogDate(post.publishedAt)}
          </time>
          <span>{post.readingMinutes} min read</span>
        </div>
        <h2
          className={cn(
            "mt-3 font-display font-semibold tracking-tight text-foreground",
            featured
              ? "text-[1.5rem] leading-[1.2] sm:text-[1.75rem]"
              : "text-lg leading-snug",
          )}
        >
          {post.title}
        </h2>
        <p
          className={cn(
            "mt-2 leading-relaxed text-muted-foreground",
            featured ? "max-w-2xl text-[0.975rem]" : "text-sm",
          )}
        >
          {post.excerpt}
        </p>
      </Link>
    </li>
  );
}

export function BlogIndex() {
  const posts = getPublishedPosts();
  const featured = getFeaturedPost();
  const rest = featured
    ? posts.filter((post) => post.slug !== featured.slug)
    : posts;

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
            <ul className="space-y-4">
              {featured ? <PostCard post={featured} featured /> : null}
              {rest.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </ul>
          )}
        </div>
      </section>
    </SiteChrome>
  );
}
