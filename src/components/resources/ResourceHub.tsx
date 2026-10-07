import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { PageHero, TextLink, homeCrumb } from "@/components/marketing/PageSections";
import { JsonLd } from "@/components/seo/JsonLd";
import { resourceBySlug, resourceListings } from "@/lib/resource-content";
import { breadcrumbSchema } from "@/lib/schema";
import { blogPath, getPublishedPosts } from "@/lib/blog/posts";
import { PRIMARY_CTA_LABEL, PRIMARY_CTA_URL } from "@/lib/links";
import { ROUTES } from "@/lib/routes";

const templateGroups = [
  {
    id: "employee-appraisals",
    title: "Employee appraisals",
    copy: "A complete review form for employee and manager input, or focused preparation for the employee’s own reflection.",
    slugs: ["annual-appraisal-template", "self-appraisal-template"],
  },
  {
    id: "360-feedback",
    title: "360 feedback",
    copy: "Give reviewers a consistent set of behavioural prompts and explain the feedback process.",
    slugs: ["360-feedback-template"],
  },
  {
    id: "probation-development",
    title: "Probation and development",
    copy: "Prepare a review at the end of probation, or agree practical development actions after a conversation.",
    slugs: ["probation-review-template", "personal-development-plan-template"],
  },
];
const templateCompleters: Record<string, string> = {
  "annual-appraisal-template": "Employee and manager",
  "self-appraisal-template": "Employee",
  "360-feedback-template": "Facilitator and selected reviewers",
  "probation-review-template": "Employee and manager",
  "personal-development-plan-template": "Employee and supporting manager",
};
const learningPaths = [
  {
    id: "employee-appraisals",
    title: "Employee Appraisals",
    copy: "Plan the review, prepare both perspectives and agree what comes next. Annual appraisals are one use of the employee and manager workflow.",
    slugs: ["annual-appraisal-guide", "appraisal-questions", "appraisal-answers", "appraisal-comments", "appraisal-objectives"],
    template: ROUTES.annualAppraisalTemplate,
    templateLabel: "Need a form? Start with the annual appraisal template",
    commercial: ROUTES.employeeAppraisalSoftware,
    commercialLabel: "Explore employee appraisal software",
  },
  {
    id: "360-appraisals",
    title: "360 Appraisals",
    copy: "Understand multi-rater feedback, choose questions people can answer and prepare a useful development conversation.",
    slugs: ["360-degree-feedback", "360-feedback-questions", "360-feedback-examples"],
    template: ROUTES.feedback360Template,
    templateLabel: "Need a form? Start with the 360 feedback template",
    commercial: ROUTES.feedback360Software,
    commercialLabel: "Explore 360 appraisals",
  },
];

export function ResourceHub({ templates = false }: { templates?: boolean }) {
  const title = templates ? "Free Appraisal Templates" : "Appraisal Resources";
  const path = templates ? ROUTES.templates : ROUTES.resources;
  const groups = templates ? templateGroups : learningPaths;
  const posts = getPublishedPosts();

  return (
    <SiteChrome>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: title, path }])} />
      <PageHero
        title={templates ? <>A useful form for <span className="marketing-editorial text-primary">your next review.</span></> : <>Help for <span className="marketing-editorial text-primary">a better conversation.</span></>}
        eyebrow={templates ? "The Appraisal Software template library" : "Practical guidance for UK teams"}
        description={templates ? "Five free first-party templates for employee appraisals, 360 feedback, probation and development. Preview a form, then copy, print or adapt it. No account required." : "Understand the process, choose your questions and prepare useful answers. Follow the learning path for employee appraisals or 360 feedback."}
        breadcrumbs={[homeCrumb(), { label: title, href: path }]}
      />
      <section className="border-b border-border bg-surface/50 px-5 py-8 lg:px-8">
        <nav aria-label={templates ? "Template groups" : "Learning paths"} className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold">{templates ? "Choose the task you need a form for" : "What are you preparing for?"}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {groups.map((group) => <a key={group.id} href={`#${group.id}`} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-medium hover:border-primary hover:text-primary">{group.title}<ArrowRight className="size-4" aria-hidden /></a>)}
          </div>
        </nav>
      </section>

      {templates ? templateGroups.map((group) => (
        <section key={group.id} id={group.id} className="border-b border-border px-5 py-16 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-display text-3xl font-semibold">{group.title}</h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">{group.copy}</p>
            <ul className="mt-8 grid gap-6 md:grid-cols-2">
              {group.slugs.map((slug) => {
                const resource = resourceBySlug(slug);
                const blocks = resource.template!;
                const count = blocks.reduce((total, block) => total + block.fields.length, 0);
                const preview = blocks.find((block) => block.fields.some((field) => field.endsWith("?"))) ?? blocks[1];
                return (
                  <li key={slug} className="marketing-card flex flex-col rounded-2xl border border-border bg-card p-6 sm:p-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Free · Appraisal Software template</p>
                    <h3 className="mt-3 text-xl font-semibold"><Link href={`/${slug}`} className="hover:text-primary hover:underline">{resource.title}</Link></h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{resource.description}</p>
                    <dl className="mt-5 space-y-2 text-sm">
                      <div><dt className="inline font-semibold">Completes it: </dt><dd className="inline text-muted-foreground">{templateCompleters[slug]}</dd></div>
                      <div><dt className="inline font-semibold">Inside: </dt><dd className="inline text-muted-foreground">{count} fields and prompts · {blocks.length} sections</dd></div>
                    </dl>
                    <div className="mt-5 rounded-xl border border-border bg-surface/50 p-4">
                      <p className="text-xs font-semibold text-muted-foreground">Preview · {preview.title}</p>
                      <ul className="mt-3 space-y-2 text-sm">{preview.fields.slice(0, 2).map((field) => <li key={field}>{field}</li>)}</ul>
                    </div>
                    <Link href={`/${slug}#template`} className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-primary hover:underline">Preview, copy or print<ArrowRight className="size-4" aria-hidden /></Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )) : learningPaths.map((journey) => (
        <section key={journey.id} id={journey.id} className="border-b border-border px-5 py-16 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-display text-3xl font-semibold">{journey.title}</h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">{journey.copy}</p>
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {journey.slugs.map((slug) => {
                const resource = resourceListings.find((entry) => entry.slug === slug)!;
                return <li key={slug}><Link href={`/${slug}`} className="marketing-card block h-full rounded-xl border border-border bg-card p-6 hover:border-primary/40"><h3 className="text-lg font-semibold">{resource.title}</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{resource.description}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">Read the guidance<ArrowRight className="size-4" aria-hidden /></span></Link></li>;
              })}
            </ul>
            {posts.filter((post) => (post.category === "360 Feedback") === (journey.id === "360-appraisals")).map((post) => (
              <div key={post.slug} className="mt-6 rounded-xl border border-border bg-surface/50 p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Further guidance · {post.readingMinutes} min read</p>
                <h3 className="mt-3 text-lg font-semibold"><Link href={blogPath(post.slug)} className="hover:text-primary hover:underline">{post.title}</Link></h3>
                <p className="mt-3 text-sm text-muted-foreground">{post.excerpt}</p>
              </div>
            ))}
            <div className="mt-8 flex flex-col gap-4 border-t border-border pt-6 sm:items-start">
              <TextLink href={journey.template}>{journey.templateLabel}</TextLink>
              <Link href={journey.commercial} className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">{journey.commercialLabel}<ArrowRight className="size-4" aria-hidden /></Link>
            </div>
          </div>
        </section>
      ))}
      <section className="px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-2xl font-semibold">{templates ? "Use the prompts in your own process." : "Looking for a form you can use?"}</h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">{templates ? "These forms work on their own. To run a campaign in Appraisal Software, create a workspace and copy the relevant prompts into a reusable question template. Public forms are not automatically imported." : "Our first-party template library has complete forms for annual reviews, self-appraisals, probation, development plans and 360 feedback."}</p>
          <a href={templates ? PRIMARY_CTA_URL : ROUTES.templates} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">{templates ? PRIMARY_CTA_LABEL : "Browse the template library"}<ArrowRight className="size-4" aria-hidden /></a>
          {!templates ? <p className="mt-6 text-sm text-muted-foreground">More practical notes are available in the <TextLink href={ROUTES.blog}>appraisal blog</TextLink>.</p> : null}
        </div>
      </section>
    </SiteChrome>
  );
}
