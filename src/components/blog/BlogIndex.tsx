import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { SiteChrome } from "@/components/layout/SiteChrome";
import { PageHero, homeCrumb } from "@/components/marketing/PageSections";
import { JsonLd } from "@/components/seo/JsonLd";
import { blogPath, formatBlogDate, getPublishedPosts } from "@/lib/blog/posts";
import type { BlogPost } from "@/lib/blog/types";
import { breadcrumbSchema } from "@/lib/schema";
import { ROUTES } from "@/lib/routes";

function PostCard({ post }: { post: BlogPost }) {
  return (
    <li className="h-full">
      <Link
        href={blogPath(post.slug)}
        className="flex h-full flex-col rounded-lg border border-border/80 bg-card p-5 transition-colors hover:border-border-strong"
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
  const featured = posts[0];

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

      <section className="border-b border-border py-16 lg:py-24">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          {posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              New articles will appear here soon.
            </p>
          ) : (
            <div>
              {featured ? (
                <Link
                  href={blogPath(featured.slug)}
                  className="marketing-card group grid overflow-hidden rounded-2xl border border-border bg-surface-2/60 lg:grid-cols-2"
                >
                  <div className="relative min-h-64 lg:min-h-96">
                    <Image
                      src="/marketing/one-to-one.jpg"
                      alt="Colleagues talking through a review"
                      fill
                      sizes="(min-width: 1024px) 45vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-col justify-center p-7 sm:p-10">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                      Featured · {featured.category}
                    </p>
                    <h2 className="mt-4 text-3xl font-semibold leading-tight group-hover:text-primary">
                      {featured.title}
                    </h2>
                    <p className="mt-4 leading-relaxed text-muted-foreground">
                      {featured.excerpt}
                    </p>
                    <p className="mt-5 text-xs text-muted-foreground">
                      <time dateTime={featured.publishedAt}>
                        {formatBlogDate(featured.publishedAt)}
                      </time>{" "}
                      · {featured.readingMinutes} min read
                    </p>
                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                      Read the article
                      <ArrowRight className="size-4" aria-hidden />
                    </span>
                  </div>
                </Link>
              ) : null}
              {posts.length > 1 ? (
                <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {posts.slice(1).map((post) => (
                    <PostCard key={post.slug} post={post} />
                  ))}
                </ul>
              ) : null}
            </div>
          )}
        </div>
      </section>
    </SiteChrome>
  );
}
