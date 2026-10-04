import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { SiteChrome } from "@/components/layout/SiteChrome";
import {
  CtaBand,
  PageHero,
  homeCrumb,
} from "@/components/marketing/PageSections";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  resourceListings as resources,
  type ResourceContent,
} from "@/lib/resource-content";
import { breadcrumbSchema } from "@/lib/schema";
import { blogPath, getPublishedPosts } from "@/lib/blog/posts";

function ResourceCard({
  resource,
  featured = false,
}: {
  resource: Pick<
    ResourceContent,
    "slug" | "title" | "description" | "audience" | "kind"
  >;
  featured?: boolean;
}) {
  return (
    <Link
      href={`/${resource.slug}`}
      className="marketing-card group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card hover:border-primary/40"
    >
      <div
        aria-hidden
        className={`relative flex min-h-40 flex-col justify-center overflow-hidden border-b border-border p-6 ${resource.slug.startsWith("360") ? "bg-primary/10" : "bg-surface-2"}`}
      >
        <div className="mx-auto w-full max-w-xs rotate-[-2deg] rounded-lg border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold text-primary">
            {resource.kind === "template"
              ? "Your review, ready to shape"
              : "A useful next step"}
          </p>
          <p className="mt-3 text-lg font-semibold leading-snug">
            {resource.title}
          </p>
          <div className="mt-4 space-y-2">
            <div className="h-1.5 w-4/5 rounded bg-border" />
            <div className="h-1.5 w-3/5 rounded bg-border" />
          </div>
        </div>
      </div>
      <div className={`flex flex-1 flex-col ${featured ? "p-7" : "p-6"}`}>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
          {resource.kind === "template"
            ? "Free template · copy or print"
            : "Practical guide"}
        </p>
        <h3 className="mt-3 text-xl font-semibold leading-snug group-hover:text-primary">
          {resource.title}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {resource.description}
        </p>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">For:</span>{" "}
          {resource.audience}
        </p>
        <span className="mt-auto flex items-center gap-2 pt-6 text-sm font-semibold text-primary">
          {resource.kind === "template"
            ? "Open and adapt this template"
            : "Read the practical guide"}
          <ArrowRight className="size-4" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
export function ResourceHub({ templates = false }: { templates?: boolean }) {
  const title = templates ? "Free Appraisal Templates" : "Appraisal Resources";
  const path = templates ? "/templates" : "/resources";
  const groups = templates
    ? [
        {
          id: "appraisal",
          title: "Appraisal and development forms",
          copy: "Prepare a consistent review form, then adapt it to the role and the conversation.",
          slugs: [
            "annual-appraisal-template",
            "self-appraisal-template",
            "probation-review-template",
            "personal-development-plan-template",
          ],
        },
        {
          id: "360",
          title: "Multi-rater feedback forms",
          copy: "Give reviewers the same prompts and explain the process before collecting feedback.",
          slugs: ["360-feedback-template"],
        },
      ]
    : [
        {
          id: "plan",
          title: "Plan a review",
          copy: "Choose your questions, prepare the cycle and agree useful next steps.",
          slugs: [
            "annual-appraisal-guide",
            "annual-appraisal-template",
            "appraisal-questions",
            "appraisal-objectives",
            "personal-development-plan-template",
          ],
        },
        {
          id: "answers",
          title: "Prepare answers",
          copy: "Help employees reflect on achievements, challenges and support needs with evidence.",
          slugs: ["self-appraisal-template", "appraisal-answers"],
        },
        {
          id: "manager",
          title: "Write manager feedback",
          copy: "Turn observations into specific comments and a focused review conversation.",
          slugs: ["appraisal-comments", "probation-review-template"],
        },
        {
          id: "360",
          title: "Run 360 feedback",
          copy: "Understand the method, choose prompts and set clear privacy expectations.",
          slugs: [
            "360-degree-feedback",
            "360-feedback-template",
            "360-feedback-questions",
            "360-feedback-examples",
          ],
        },
      ];
  const featured = resources.filter((r) =>
    templates
      ? ["annual-appraisal-template", "360-feedback-template"].includes(r.slug)
      : ["annual-appraisal-guide", "annual-appraisal-template"].includes(
          r.slug,
        ),
  );
  const post = getPublishedPosts()[0];
  return (
    <SiteChrome>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: title, path },
        ])}
      />
      <PageHero
        title={
          templates ? (
            <>
              A useful form for{" "}
              <span className="marketing-editorial text-primary">
                a better review.
              </span>
            </>
          ) : (
            <>
              Better reviews start{" "}
              <span className="marketing-editorial text-primary">
                with preparation.
              </span>
            </>
          )
        }
        eyebrow="Free resources for UK teams"
        description={
          templates
            ? "Complete forms for annual appraisals, self-assessments, probation reviews, development plans and 360 feedback. Copy, print or adapt them. No account required."
            : "Practical guides, original examples and usable forms for employees, managers and small HR teams. Find the next step that helps your conversation."
        }
        breadcrumbs={[homeCrumb(), { label: title, href: path }]}
        visual={
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
            <Image
              src="/marketing/team-conversation.jpg"
              alt="Colleagues preparing for a conversation together"
              fill
              priority
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
        }
      />
      <section className="px-5 py-16 lg:px-0 lg:py-24">
        <div className="mx-auto max-w-6xl lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                Start here
              </p>
              <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">
                {templates
                  ? "Two ways to structure your next review."
                  : "Your annual review, from plan to form."}
              </h2>
            </div>
            <Link
              href={templates ? "/resources" : "/templates"}
              className="flex items-center gap-2 text-sm font-semibold text-primary"
            >
              {templates ? "Browse all resources" : "See all templates"}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <div className="mt-9 grid gap-6 md:grid-cols-2">
            {featured.map((resource) => (
              <ResourceCard key={resource.slug} resource={resource} featured />
            ))}
          </div>
        </div>
      </section>
      <section className="border-y border-border bg-surface-2/60 px-5 py-10 lg:px-0">
        <nav
          aria-label="Browse resources by task"
          className="mx-auto max-w-6xl lg:px-8"
        >
          <p className="text-sm font-semibold">
            {templates ? "Choose a form" : "What are you working on?"}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {groups.map((group) => (
              <a
                key={group.id}
                href={`#${group.id}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-medium hover:border-primary hover:text-primary"
              >
                {group.title}
                <ArrowRight className="size-4" aria-hidden />
              </a>
            ))}
          </div>
        </nav>
      </section>
      {groups.map((group, index) => (
        <section
          key={group.id}
          id={group.id}
          className={`border-b border-border px-5 py-16 lg:px-0 lg:py-24 ${index % 2 ? "bg-surface/50" : ""}`}
        >
          <div className="mx-auto max-w-6xl lg:px-8">
            <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
              <h2 className="text-3xl font-semibold sm:text-4xl">
                {group.title}
              </h2>
              <p className="max-w-xl leading-relaxed text-muted-foreground">
                {group.copy}
              </p>
            </div>
            <ul
              className={`mt-9 grid gap-5 sm:grid-cols-2 ${group.slugs.length > 2 ? "lg:grid-cols-3" : ""}`}
            >
              {group.slugs.map((slug) => {
                const resource = resources.find((r) => r.slug === slug)!;
                return (
                  <li key={slug}>
                    <ResourceCard resource={resource} />
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ))}
      {!templates && post ? (
        <section className="px-5 py-16 lg:px-0 lg:py-24">
          <div className="mx-auto grid max-w-6xl lg:px-8 items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                From the blog
              </p>
              <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">
                Keep the conversation practical.
              </h2>
              <p className="mt-5 leading-relaxed text-muted-foreground">
                Short notes for managers and small HR teams preparing employee
                reviews.
              </p>
              <Link
                href="/blog"
                className="mt-5 inline-block text-sm font-semibold text-primary underline underline-offset-4"
              >
                Explore the blog
              </Link>
            </div>
            <Link
              href={blogPath(post.slug)}
              className="marketing-card rounded-2xl border border-border bg-surface-2/60 p-8"
            >
              <p className="text-xs font-semibold text-primary">
                {post.category} · {post.readingMinutes} min read
              </p>
              <h3 className="mt-4 text-2xl font-semibold leading-tight">
                {post.title}
              </h3>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {post.excerpt}
              </p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                Read the article
                <ArrowRight className="size-4" aria-hidden />
              </span>
            </Link>
          </div>
        </section>
      ) : null}
      {!templates ? <section className="border-t border-border px-5 py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-3xl font-semibold">Choose the workflow, then prepare the conversation.</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-border p-6"><h3 className="text-xl font-semibold">Employee and annual appraisals</h3><p className="mt-3 text-muted-foreground">Prepare identified employee and manager responses, then discuss work, expectations and next steps.</p><p className="mt-5"><Link className="underline underline-offset-4" href="/annual-appraisal-guide">Plan the cycle</Link>{" · "}<Link className="underline underline-offset-4" href="/employee-appraisal-software">Explore the software</Link></p>
            {getPublishedPosts().filter(p => ["preparing-managers-for-an-appraisal-cycle","moving-appraisals-from-spreadsheets","following-up-after-a-performance-review"].includes(p.slug)).map(p => <p key={p.slug} className="mt-3"><Link className="underline underline-offset-4" href={blogPath(p.slug)}>{p.title}</Link></p>)}</div>
            <div className="rounded-xl border border-border p-6"><h3 className="text-xl font-semibold">Anonymous 360 feedback</h3><p className="mt-3 text-muted-foreground">Choose a relevant reviewer cohort and questionnaire, then interpret combined feedback under clear privacy rules.</p><p className="mt-5"><Link className="underline underline-offset-4" href="/360-degree-feedback">Understand the method</Link>{" · "}<Link className="underline underline-offset-4" href="/360-feedback-software">Explore the software</Link></p>
            {getPublishedPosts().filter(p => ["choosing-reviewers-for-a-360-review","discussing-360-feedback-results"].includes(p.slug)).map(p => <p key={p.slug} className="mt-3"><Link className="underline underline-offset-4" href={blogPath(p.slug)}>{p.title}</Link></p>)}</div>
          </div>
        </div>
      </section> : null}
      <CtaBand
        title="Bring your preparation into one clear process."
        copy="Use these free resources on their own, or organise questions, invitations and results in Appraisal Software."
        secondaryHref="/how-it-works"
        secondaryLabel="Follow the workflow"
      />
    </SiteChrome>
  );
}
