import {
  ContentSection,
  CtaBand,
  FaqSection,
  PageHero,
  RelatedLinks,
  TextLink,
  homeCrumb,
} from "@/components/marketing/PageSections";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/metadata";
import { ROUTES } from "@/lib/routes";
import { breadcrumbSchema, faqPageSchema, softwareApplicationSchema } from "@/lib/schema";

const TITLE = "360 Feedback Software for UK Teams | Appraisal Software";
const DESCRIPTION =
  "360 feedback software for UK teams. Subject-based reviews with self, manager, peer and direct-report input, Self vs Others reporting, reminders and privacy-conscious anonymity.";

const faqs = [
  {
    question: "What is 360 feedback software?",
    answer:
      "It is a way to collect structured comments about a person from more than one relationship — typically self, manager, peers and direct reports — then aggregate those responses into a report.",
  },
  {
    question: "Can 360° feedback be anonymous?",
    answer:
      "Yes. Feedback collection is privacy-conscious and can run anonymously by default where you choose it. Be clear with respondents about what they can expect before they start.",
  },
  {
    question: "What is Self vs Others reporting?",
    answer:
      "When a self-assessment is included, results can compare how someone rated themselves with how others rated them — by overall score and by competency or question area.",
  },
  {
    question: "Is 360° feedback the main product?",
    answer:
      "No. Appraisal Software is annual appraisal software first. 360° feedback is a meaningful part of the product when a review needs multi-rater input, not a separate platform.",
  },
  {
    question: "Who can we collect feedback from?",
    answer:
      "Self, manager, peers, direct reports and other relationships you assign for each subject in the campaign.",
  },
];

export const metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: ROUTES.feedback360Software,
});

export default function Feedback360SoftwarePage() {
  return (
    <SiteChrome>
      <JsonLd
        data={softwareApplicationSchema({
          path: ROUTES.feedback360Software,
          name: "360 Feedback Software",
          description: DESCRIPTION,
        })}
      />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: ROUTES.home },
          { name: "360 Feedback Software", path: ROUTES.feedback360Software },
        ])}
      />
      <PageHero
        eyebrow="Multi-rater feedback"
        title="360 Feedback Software"
        description="Run subject-based 360 reviews with self-assessment and feedback from managers, peers and direct reports — then see Self vs Others results, completion and downloadable reports."
        breadcrumbs={[
          homeCrumb(),
          { label: "360 Feedback Software", href: ROUTES.feedback360Software },
        ]}
      />

      <ContentSection title="Subject-based 360 reviews">
        <p>
          360° feedback is useful when a manager form is not enough — for team leads, people managers
          and anyone whose work is hard to see from one angle. Choose the subject, assign reviewers by
          relationship, send the same questions, and wait for responses to come in.
        </p>
        <p>
          This sits next to{" "}
          <TextLink href={ROUTES.annualAppraisalSoftware}>annual appraisal software</TextLink>, not
          instead of it. Most teams still run a yearly employee and manager review. Add 360° input
          where it changes the quality of the conversation.
        </p>
      </ContentSection>

      <ContentSection title="Self-assessment and relationship-aware reviewers">
        <p>
          Include a self-assessment when you want Self vs Others comparison. Invite managers, peers,
          direct reports and other reviewers with the relationship that matches how they know the
          subject — so the report stays interpretable.
        </p>
        <p>
          Start with the{" "}
          <TextLink href={ROUTES.feedback360Template}>360 feedback template</TextLink> if you want
          example questions for different relationships.
        </p>
      </ContentSection>

      <ContentSection title="Completion, reminders and anonymity">
        <p>
          A 360° campaign fails in the same way a spreadsheet appraisal fails: you cannot see who
          still owes a response. Track completion by subject and by respondent, and send reminders
          for outstanding forms.
        </p>
        <p>
          Collection can be anonymous by default where you choose it, so peers and direct reports
          can speak plainly. Reporting respects privacy states — share what is safe to share.
        </p>
      </ContentSection>

      <ContentSection title="Self vs Others reporting">
        <p>
          Aggregated results show overall scores, competency or area scoring, and how self-assessment
          compares with feedback from others. Export PDF or CSV when you need a copy outside the
          product.
        </p>
        <p>
          Keep that record with the appraisal, then return to{" "}
          <TextLink href={ROUTES.home}>Appraisal Software</TextLink> when you want the wider annual
          cycle rather than a one-off 360° request.
        </p>
      </ContentSection>

      <FaqSection
        items={faqs.map((faq) => ({
          question: faq.question,
          answer: faq.answer,
        }))}
      />

      <RelatedLinks
        links={[
          {
            href: ROUTES.feedback360Template,
            label: "360 feedback template",
            copy: "Example questions for managers, peers and direct reports.",
          },
          {
            href: ROUTES.annualAppraisalSoftware,
            label: "Annual appraisal software",
            copy: "Run the yearly review cycle that 360° feedback can sit inside.",
          },
          {
            href: ROUTES.home,
            label: "Appraisal Software homepage",
            copy: "Simple annual appraisal software for UK teams.",
          },
        ]}
      />

      <CtaBand
        title="Run a 360 feedback campaign"
        copy="Book a walkthrough to see subject setup, anonymous collection, Self vs Others reporting and downloadable results."
        secondaryHref={ROUTES.feedback360Template}
        secondaryLabel="View the 360 template"
      />
    </SiteChrome>
  );
}
