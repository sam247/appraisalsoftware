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

const TITLE = "360 Feedback Template for UK Teams | Appraisal Software";
const DESCRIPTION =
  "A practical 360 feedback template with example questions for managers, peers and direct reports, covering communication, leadership, teamwork and areas for improvement.";

const groups = [
  {
    title: "Manager feedback",
    questions: [
      "What should this person continue doing because it helps the team?",
      "Where do they need clearer direction, decisions or follow-through?",
      "How well do they set priorities when the work competes?",
      "What is one specific example of strong management from this period?",
      "What is one specific example of a gap from this period?",
    ],
  },
  {
    title: "Peer feedback",
    questions: [
      "How easy is this person to work with on shared work?",
      "Do they share information in time for others to use it?",
      "When work is difficult, do they help or do they protect their own task list?",
      "What should they keep doing?",
      "What should they do differently?",
    ],
  },
  {
    title: "Direct report feedback",
    questions: [
      "How clear are you about what your manager expects?",
      "Do you get useful feedback during the year, not only at review time?",
      "Does your manager make time for you when you need a decision?",
      "What does your manager do that helps you do the job?",
      "What would you like your manager to change?",
    ],
  },
  {
    title: "Communication",
    questions: [
      "How clearly does this person explain what they need from others?",
      "Do they listen, or do they wait to speak?",
      "How well do they handle disagreement without making it personal?",
    ],
  },
  {
    title: "Leadership",
    questions: [
      "Do people know what good looks like after speaking to this person?",
      "Do they take responsibility when something goes wrong?",
      "Do they give credit for other people’s work?",
    ],
  },
  {
    title: "Teamwork",
    questions: [
      "Do they consider the effect of their work on the rest of the team?",
      "Are they reliable when someone else is depending on them?",
      "Do they help new colleagues get up to speed?",
    ],
  },
  {
    title: "Areas for improvement",
    questions: [
      "What is the one change that would make the biggest difference?",
      "Give an example from this period, not a general trait.",
      "What would you notice in three months if this improved?",
    ],
  },
];

export const metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: ROUTES.feedback360Template,
});

export default function Feedback360TemplatePage() {
  return (
    <SiteChrome>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: ROUTES.home },
          { name: "360 Feedback Template", path: ROUTES.feedback360Template },
        ])}
      />
      <PageHero
        eyebrow="Template"
        title="360 feedback template"
        description="Example 360° questions for managers, peers and direct reports. Keep the form short, ask for examples, and be clear about whether responses are anonymous."
        breadcrumbs={[
          homeCrumb(),
          { label: "360 feedback template", href: ROUTES.feedback360Template },
        ]}
      />

      <ContentSection title="How to use this 360 feedback template">
        <p>
          Do not send every question to every respondent. Give managers, peers and direct reports a
          short set that matches what they can actually see. Eight to twelve questions is enough.
        </p>
        <p>
          Run the form with{" "}
          <TextLink href={ROUTES.feedback360Software}>360 feedback software</TextLink> if you want
          reusable questions, response tracking and optional anonymity. 360° feedback is a supporting
          use case in{" "}
          <TextLink href={ROUTES.home}>Appraisal Software</TextLink>, not the main product.
        </p>
      </ContentSection>

      {groups.map((group) => (
        <ContentSection key={group.title} title={group.title}>
          <ul className="list-disc space-y-2 pl-5">
            {group.questions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        </ContentSection>
      ))}

      <ContentSection title="Anonymity and sharing">
        <p>
          Tell respondents, before they start, whether their comments will be named. Peer and
          direct-report answers are often more useful when they are anonymous in the shared report.
          Manager comments are usually attributed.
        </p>
        <p>
          Share a summary with the employee, not a dump of every line. The aim is a useful review
          record, not a pile of comments.
        </p>
      </ContentSection>

      <RelatedLinks
        links={[
          {
            href: ROUTES.feedback360Software,
            label: "360 feedback software",
            copy: "Collect responses, track completion and keep the record with the review.",
          },
          {
            href: ROUTES.annualAppraisalSoftware,
            label: "Annual appraisal software",
            copy: "Use 360° feedback inside a yearly appraisal cycle.",
          },
        ]}
      />

      <CtaBand
        title="Run a 360 feedback cycle"
        copy="Request early access to send this template as a reusable form and track who has responded."
        secondaryHref={ROUTES.feedback360Software}
        secondaryLabel="360 feedback software"
      />
    </SiteChrome>
  );
}
