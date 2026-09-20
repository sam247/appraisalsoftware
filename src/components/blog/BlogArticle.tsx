import Link from "next/link";

import { BlogCta } from "@/components/blog/BlogCta";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { homeCrumb } from "@/components/marketing/PageSections";
import { JsonLd } from "@/components/seo/JsonLd";
import { renderBlogMarkdown } from "@/lib/blog/markdown";
import {
  blogPath,
  formatBlogDate,
  getRelatedPosts,
} from "@/lib/blog/posts";
import type { BlogPost } from "@/lib/blog/types";
import { articleSchema, breadcrumbSchema } from "@/lib/schema";
import { ROUTES } from "@/lib/routes";

export function BlogArticle({ post }: { post: BlogPost }) {
  const path = blogPath(post.slug);
  const related = getRelatedPosts(post);
  const crumbs = [
    homeCrumb(),
    { label: "Blog", href: ROUTES.blog },
    { label: post.title, href: path },
  ];
  const modified = post.updatedAt ?? post.publishedAt;

  return (
    <SiteChrome>
      <article>
        <JsonLd
          data={breadcrumbSchema(
            crumbs.map((crumb) => ({ name: crumb.label, path: crumb.href })),
          )}
        />
        <JsonLd
          data={articleSchema({
            title: post.title,
            description: post.description,
            path,
            datePublished: post.publishedAt,
            dateModified: modified,
          })}
        />

        <header className="border-b border-border">
          <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8 lg:py-14">
            <nav aria-label="Breadcrumb" className="mb-6">
              <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                {crumbs.map((crumb, index) => (
                  <li key={crumb.href} className="flex items-center gap-1.5">
                    {index > 0 ? <span aria-hidden>/</span> : null}
                    {index === crumbs.length - 1 ? (
                      <span className="text-foreground">{crumb.label}</span>
                    ) : (
                      <Link href={crumb.href} className="hover:text-foreground">
                        {crumb.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </nav>

            <p className="text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-primary">
              {post.category}
            </p>
            <h1 className="mt-3 max-w-3xl font-display text-[2rem] font-semibold leading-[1.12] tracking-[-0.035em] text-foreground sm:text-[2.5rem] lg:text-[2.75rem]">
              {post.title}
            </h1>
            <p className="mt-5 max-w-2xl text-[1.025rem] leading-relaxed text-muted-foreground">
              {post.description}
            </p>
            <p className="mt-5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <time dateTime={post.publishedAt}>
                {formatBlogDate(post.publishedAt)}
              </time>
              {post.updatedAt ? (
                <span>
                  Updated{" "}
                  <time dateTime={post.updatedAt}>
                    {formatBlogDate(post.updatedAt)}
                  </time>
                </span>
              ) : null}
              <span>{post.readingMinutes} min read</span>
            </p>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8 lg:py-14">
          <div className="mx-auto max-w-[42rem]">
            {renderBlogMarkdown(post.body)}
          </div>
        </div>

        <div className="no-print">
          <BlogCta />
          {related.length > 0 ? (
            <section className="border-t border-border py-12 sm:py-16">
              <div className="mx-auto max-w-6xl px-5 lg:px-8">
                <h2 className="font-display text-[1.5rem] font-semibold leading-[1.15] tracking-[-0.025em] text-foreground sm:text-[1.75rem]">
                  Related reading
                </h2>
                <ul className="mt-6 grid gap-3">
                  {related.map((item) => (
                    <li key={item.slug}>
                      <Link
                        href={blogPath(item.slug)}
                        className="block rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-sm"
                      >
                        <p className="text-xs font-medium text-primary">
                          {item.category}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {item.title}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {item.excerpt}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ) : null}
        </div>
      </article>
    </SiteChrome>
  );
}
