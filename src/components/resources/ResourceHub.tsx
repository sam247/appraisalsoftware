import Link from "next/link";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { ContentSection, PageHero, homeCrumb } from "@/components/marketing/PageSections";
import { JsonLd } from "@/components/seo/JsonLd";
import { resources } from "@/lib/resource-content";
import { breadcrumbSchema } from "@/lib/schema";

export function ResourceHub({ templates = false }: { templates?: boolean }) {
  const title = templates ? "Free Appraisal Templates" : "Appraisal Resources";
  const path = templates ? "/templates" : "/resources";
  const groups = templates ? [
    { title: "Appraisal and development forms", slugs: ["annual-appraisal-template", "self-appraisal-template", "probation-review-template", "personal-development-plan-template"] },
    { title: "Multi-rater feedback forms", slugs: ["360-feedback-template"] },
  ] : [
    { title: "Plan and run an appraisal", slugs: ["annual-appraisal-guide", "annual-appraisal-template", "appraisal-objectives", "personal-development-plan-template"] },
    { title: "Prepare your answers or manager comments", slugs: ["self-appraisal-template", "appraisal-answers", "appraisal-comments", "probation-review-template"] },
    { title: "Understand and prepare 360 feedback", slugs: ["360-degree-feedback", "360-feedback-template", "360-feedback-questions", "360-feedback-examples"] },
  ];
  return <SiteChrome>
    <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: title, path }])} />
    <PageHero title={title} eyebrow="Free resources for UK teams" description={templates ? "Choose a complete form, copy it into your own document, or print it and save as a PDF. No account required." : "Practical guides, original examples and usable forms for employees, managers and small HR teams. Choose the task you are working on."} breadcrumbs={[homeCrumb(), { label: title, href: path }]} />
    <section className="border-b border-border bg-surface/50 py-10 sm:py-12">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-16 lg:px-8">
        <div>
          <p className="text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-primary">
            {templates ? "Choose a form" : "Choose your next step"}
          </p>
          <h2 className="mt-3 font-display text-2xl font-semibold leading-[1.12] tracking-[-0.025em] text-foreground sm:text-[1.75rem]">
            {templates ? "Start with the review you need to run" : "Practical structure for the work around a review"}
          </h2>
          <p className="mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-muted-foreground sm:text-base">
            {templates
              ? "Each form is free to copy, print or adapt. Open the closest fit, then remove prompts that will not help your conversation."
              : "Use a guide to plan the process, a template to structure the form, or an example to improve the wording before you begin."}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <p className="text-sm font-semibold text-foreground">How to use the library</p>
          <ol className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              ["01", "Choose", "Pick the task or review stage you are working on."],
              ["02", "Adapt", "Use the questions and examples as a proportionate starting point."],
              ["03", "Run", "Use the structure in your process or in Appraisal Software."],
            ].map(([number, step, copy]) => (
              <li key={step} className="border-t border-border pt-3">
                <span className="text-xs font-semibold tabular-nums text-primary">{number}</span>
                <p className="mt-2 text-sm font-medium text-foreground">{step}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
    {groups.map((group) => (
      <section key={group.title} className="border-b border-border py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-display text-[1.5rem] font-semibold leading-[1.15] tracking-[-0.025em] text-foreground sm:text-[1.75rem]">
              {group.title}
            </h2>
            <span className="shrink-0 text-xs text-muted-foreground">
              {group.slugs.length} {group.slugs.length === 1 ? "resource" : "resources"}
            </span>
          </div>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {group.slugs.map((slug) => {
              const resource = resources.find((entry) => entry.slug === slug)!;
              return (
                <li key={slug}>
                  <Link
                    href={`/${slug}`}
                    className="group block h-full rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-sm sm:p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary">
                        {resource.title}
                      </p>
                      <span className="text-xs text-muted-foreground" aria-hidden>
                        ↗
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {resource.description}
                    </p>
                    <p className="mt-5 text-xs font-medium text-primary">
                      {resource.kind === "template" ? "Open template" : "Read guide"}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    ))}
    <section className="border-b border-border py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <p className="text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-primary">
            More focused prompts
          </p>
          <h2 className="mt-3 font-display text-[1.5rem] font-semibold leading-[1.15] tracking-[-0.025em] text-foreground sm:text-[1.75rem]">
            Build the questions before you build the form
          </h2>
          <p className="mt-4 max-w-2xl text-[0.9375rem] leading-relaxed text-muted-foreground sm:text-base">
            Use the appraisal question bank to choose prompts for employee reflection and manager discussion, then take the finished structure into a template or appraisal campaign.
          </p>
          <Link href="/appraisal-questions" className="mt-6 inline-flex text-sm font-medium text-foreground underline decoration-border underline-offset-4 hover:text-primary">
            Browse appraisal questions →
          </Link>
        </div>
      </div>
    </section>
    <ContentSection title="Use the structure, adapt the detail"><p>These resources are starting points for your own process. Choose prompts that fit the role, use real evidence and agree how completed reviews will be stored and shared. Fictional examples illustrate wording; they are not facts to copy into someone’s appraisal.</p></ContentSection>
  </SiteChrome>;
}
