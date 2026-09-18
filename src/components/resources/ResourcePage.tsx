import Link from "next/link";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { ContentSection, CtaBand, PageHero, RelatedLinks, homeCrumb } from "@/components/marketing/PageSections";
import { JsonLd } from "@/components/seo/JsonLd";
import { TemplateActions } from "@/components/resources/TemplateActions";
import { RESOURCE_REVIEW_DATE, resources, type ResourceContent } from "@/lib/resource-content";
import { articleSchema, breadcrumbSchema } from "@/lib/schema";

const commercialLinks: Record<string, { label: string; copy: string }> = {
  "appraisal-questions": { label: "Appraisal questions", copy: "Choose focused prompts for employee reflection and manager discussion." },
  "annual-appraisal-software": { label: "Annual appraisal software", copy: "Coordinate the yearly employee and manager review cycle." },
  "employee-appraisal-software": { label: "Employee appraisal software", copy: "Prepare employee and manager responses in one place." },
  "360-feedback-software": { label: "360 feedback software", copy: "See the planned workflow and current capability status." },
};

export function ResourcePage({ resource }: { resource: ResourceContent }) {
  const path = `/${resource.slug}`;
  const crumbs = [homeCrumb(), { label: resource.kind === "template" ? "Templates" : "Resources", href: resource.kind === "template" ? "/templates" : "/resources" }, { label: resource.title, href: path }];
  const templateText = resource.template?.map((block) => `${block.title}\n${block.fields.join("\n\n")}\n`).join("\n") ?? "";

  return <SiteChrome>
    <article className={resource.template ? "resource-page template-page" : "resource-page"}>
      <JsonLd data={breadcrumbSchema(crumbs.map((crumb) => ({ name: crumb.label, path: crumb.href })))} />
      {resource.kind === "guide" ? <JsonLd data={articleSchema({ title: resource.title, description: resource.description, path, dateModified: RESOURCE_REVIEW_DATE })} /> : null}
      <PageHero compact={Boolean(resource.template)} eyebrow={resource.kind === "template" ? "Free template" : "Practical guide"} title={resource.title} description={resource.description} breadcrumbs={crumbs} />
      {resource.template ? <section id="template" className="border-b border-border py-10 sm:py-12">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="max-w-3xl">
            <TemplateActions text={`${resource.title}\n\n${templateText}`} />
            <h2 className="mb-6 font-display text-2xl font-semibold">The template</h2>
            <div className="space-y-5">
              {resource.template.map((block) => <section key={block.title} className="template-block rounded-xl border border-border bg-card p-5 sm:p-7">
                <h3 className="mb-5 text-lg font-semibold">{block.title}</h3>
                <dl className="space-y-5">{block.fields.map((field) => <div key={field}>
                  <dt className="text-sm leading-relaxed text-foreground">{field}</dt>
                  <dd className="mt-3 min-h-6 border-b border-border"><span className="sr-only">Space for your response</span></dd>
                </div>)}</dl>
              </section>)}
            </div>
          </div>
        </div>
      </section> : null}
      <div className="no-print mx-auto max-w-6xl px-5 py-8 lg:px-8">
        <p className="text-xs text-muted-foreground">Written and reviewed by the Appraisal Software team · <time dateTime={RESOURCE_REVIEW_DATE}>18 September 2026</time></p>
        <nav aria-label="On this page" className="mt-5 max-w-3xl rounded-xl border border-border p-5">
          <p className="text-sm font-semibold">On this page</p>
          <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">{resource.sections.map((section, index) => <li key={section.title}><a className="underline underline-offset-4 hover:text-primary" href={`#section-${index + 1}`}>{section.title}</a></li>)}</ul>
        </nav>
      </div>
      <div className={resource.template ? "template-support" : ""}>
        {resource.sections.map((section, index) => <ContentSection key={section.title} id={`section-${index + 1}`} title={section.title}>
          {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          {section.items ? <ul className="list-disc space-y-2 pl-5">{section.items.map((item) => <li key={item}>{item}</li>)}</ul> : null}
        </ContentSection>)}
        {resource.sources ? <ContentSection title="Further reading"><ul className="list-disc space-y-2 pl-5">{resource.sources.map((source) => <li key={source.href}><a className="underline underline-offset-4" href={source.href}>{source.label}</a></li>)}</ul></ContentSection> : null}
      </div>
      <div className="no-print">
        <RelatedLinks title="Continue with a useful next step" links={resource.related.map((slug) => {
          const sibling = resources.find((entry) => entry.slug === slug);
          const commercial = commercialLinks[slug];
          return { href: `/${slug}`, label: sibling?.title ?? commercial.label, copy: sibling?.description ?? commercial.copy };
        })} />
        {resource.bridge ? <CtaBand title={resource.bridge.title} copy={resource.bridge.copy} secondaryHref={resource.slug === "annual-appraisal-template" || resource.slug === "annual-appraisal-guide" ? "/annual-appraisal-software" : "/employee-appraisal-software"} secondaryLabel="See the appraisal workflow" /> : resource.slug.startsWith("360") ? <ContentSection title="Planning to collect responses through the product?">
          <p>360 collection, anonymity controls and Self vs Others reporting are planned for Appraisal Software. These resources can help you prepare now; they do not mean those features are available in the app.</p>
          <Link href="/360-feedback-software" className="font-medium text-foreground underline underline-offset-4">Read the 360 product status</Link>
        </ContentSection> : null}
      </div>
    </article>
  </SiteChrome>;
}
