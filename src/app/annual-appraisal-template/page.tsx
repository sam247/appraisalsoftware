import {
  ContentSection,
  CtaBand,
  PageHero,
  RelatedLinks,
  TextLink,
  homeCrumb,
} from "@/components/marketing/PageSections";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/metadata";
import { ROUTES } from "@/lib/routes";
import { breadcrumbSchema } from "@/lib/schema";

const TITLE = "Annual Appraisal Template for UK Teams | Appraisal Software";
const DESCRIPTION =
  "A simple annual appraisal template for UK teams. Cover employee details, objectives, performance, development goals, manager comments and next steps.";

const templateBlocks = [
  {
    title: "Employee details",
    items: [
      "Employee name",
      "Job title",
      "Team or department",
      "Manager name",
      "Review period (for example April 2025 – March 2026)",
      "Date of appraisal meeting",
    ],
  },
  {
    title: "Role and objectives",
    items: [
      "What is this person accountable for in this role?",
      "What were the agreed objectives for this review period?",
      "Which objectives were met in full?",
      "Which objectives were partly met, and why?",
      "Which objectives were not met, and what got in the way?",
    ],
  },
  {
    title: "Performance review questions",
    items: [
      "What went well during this review period?",
      "Where did the work fall short of what was needed?",
      "What should this person continue doing?",
      "What should this person do differently next period?",
      "How well did they work with colleagues, customers or stakeholders?",
    ],
  },
  {
    title: "Development goals",
    items: [
      "What skills or knowledge need to grow in the next 12 months?",
      "What support, training or time is required?",
      "What would good progress look like by the next review?",
    ],
  },
  {
    title: "Manager comments",
    items: [
      "Overall summary of the period",
      "Evidence for the strongest contribution",
      "The main development area, with a specific example",
      "Anything the manager will do differently to support this person",
    ],
  },
  {
    title: "Next steps",
    items: [
      "Objectives for the next review period",
      "Agreed actions, owner and date",
      "Date of the next check-in or review",
      "Employee comments on the appraisal",
      "Manager and employee sign-off",
    ],
  },
];

export const metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: ROUTES.annualAppraisalTemplate,
});

export default function AnnualAppraisalTemplatePage() {
  return (
    <SiteChrome>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: ROUTES.home },
          { name: "Annual Appraisal Template", path: ROUTES.annualAppraisalTemplate },
        ])}
      />
      <PageHero
        eyebrow="Template"
        title="Annual appraisal template"
        description="A simple annual appraisal form you can copy for your next cycle. Use it as a Word document if you need to, or create the same structure as a reusable form in Appraisal Software."
        breadcrumbs={[
          homeCrumb(),
          { label: "Annual appraisal template", href: ROUTES.annualAppraisalTemplate },
        ]}
      />

      <ContentSection title="Annual appraisal template">
        <p>
          This template is for a yearly review between an employee and their manager. It is short on
          purpose. Long forms get rushed. Keep the questions the same across the team so reviews are
          easier to compare.
        </p>
        <p>
          For a fuller question bank, see{" "}
          <TextLink href={ROUTES.appraisalQuestions}>appraisal questions</TextLink>. To run the
          template as a cycle rather than a document, use{" "}
          <TextLink href={ROUTES.annualAppraisalSoftware}>annual appraisal software</TextLink>.
        </p>
      </ContentSection>

      {templateBlocks.map((block) => (
        <ContentSection key={block.title} title={block.title}>
          <ul className="list-disc space-y-2 pl-5">
            {block.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </ContentSection>
      ))}

      <ContentSection title="How to use this template">
        <p>
          Send the same sections to the employee first, then to the manager. Meet to discuss the
          answers. Write the next-period objectives while you are still in the room. Keep the
          finished form with the employee record.
        </p>
        <p>
          If you are still chasing last year’s forms by email, the template will help once.{" "}
          <TextLink href={ROUTES.home}>Appraisal Software</TextLink> is for running the cycle every
          year without rebuilding the admin.
        </p>
      </ContentSection>

      <RelatedLinks
        title="Use this template in a cycle"
        links={[
          {
            href: ROUTES.annualAppraisalSoftware,
            label: "Annual appraisal software",
            copy: "Turn this form into a reusable cycle with tracking and records.",
          },
          {
            href: ROUTES.appraisalQuestions,
            label: "Appraisal questions",
            copy: "More questions if you want to extend a section.",
          },
        ]}
      />

      <CtaBand
        title="Create your appraisal cycle"
        copy="Book a walkthrough and use this template as the starting form for your next annual cycle."
        secondaryHref={ROUTES.annualAppraisalSoftware}
        secondaryLabel="Annual appraisal software"
      />
    </SiteChrome>
  );
}
