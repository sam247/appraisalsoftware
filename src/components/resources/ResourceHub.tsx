import { SiteChrome } from "@/components/layout/SiteChrome";
import { ContentSection, PageHero, RelatedLinks, homeCrumb } from "@/components/marketing/PageSections";
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
    {groups.map((group) => <RelatedLinks key={group.title} title={group.title} links={group.slugs.map((slug) => {
      const resource = resources.find((entry) => entry.slug === slug)!;
      return { href: `/${slug}`, label: resource.title, copy: resource.description };
    })} />)}
    <RelatedLinks title="Choose questions for your form" links={[{ href: "/appraisal-questions", label: "Appraisal questions", copy: "Questions for employee reflection and manager discussion, grouped by purpose." }, { href: templates ? "/resources" : "/templates", label: templates ? "All appraisal resources" : "All free templates", copy: "Find the next practical guide or form for your review." }]} />
    <ContentSection title="Use the structure, adapt the detail"><p>These resources are starting points for your own process. Choose prompts that fit the role, use real evidence and agree how completed reviews will be stored and shared. Fictional examples illustrate wording; they are not facts to copy into someone’s appraisal.</p></ContentSection>
  </SiteChrome>;
}
