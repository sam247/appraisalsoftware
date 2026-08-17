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
  "360 feedback software for UK teams. Collect manager, peer and direct-report feedback with reusable forms, response tracking and optional anonymity.";

const faqs = [
  {
    question: "What is 360 feedback software?",
    answer:
      "It is a way to collect structured comments from more than one person — typically a manager, peers and direct reports — and keep those responses with the review.",
  },
  {
    question: "Can 360° feedback be anonymous?",
    answer:
      "Yes, where you choose it. Anonymity is optional. Use it when people need space to be specific, and keep named manager comments where accountability matters.",
  },
  {
    question: "Is 360° feedback the main product?",
    answer:
      "No. Appraisal Software is annual appraisal software first. 360° feedback is available when a review needs extra input, not as a separate platform.",
  },
  {
    question: "Who can we collect feedback from?",
    answer:
      "Managers, peers, direct reports and the employee themselves. You choose the respondents for each person in the cycle.",
  },
  {
    question: "Can we reuse the same 360° form?",
    answer:
      "Yes. Save the question set and send it again. Start from the 360 feedback template if you do not want to write questions from scratch.",
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
        eyebrow="Supporting use case"
        title="360 Feedback Software"
        description="Collect feedback from managers, peers and direct reports, track who has responded, and keep the comments with the review record."
        breadcrumbs={[
          homeCrumb(),
          { label: "360 Feedback Software", href: ROUTES.feedback360Software },
        ]}
      />

      <ContentSection title="Collect feedback from managers, peers and direct reports">
        <p>
          360° feedback is useful when a manager form is not enough — for team leads, people managers
          and anyone whose work is hard to see from one angle. The software part is simple: choose
          the respondents, send the same questions, and wait for the responses to come in.
        </p>
        <p>
          This sits next to{" "}
          <TextLink href={ROUTES.annualAppraisalSoftware}>annual appraisal software</TextLink>, not
          instead of it. Most teams still run a yearly employee and manager review. Add 360° input
          where it changes the quality of the conversation.
        </p>
      </ContentSection>

      <ContentSection title="Use reusable 360° feedback forms">
        <p>
          Write a short, specific question set and reuse it. Long forms get abandoned. Vague forms
          produce vague comments. Keep questions about observed behaviour, not personality.
        </p>
        <p>
          Start with the{" "}
          <TextLink href={ROUTES.feedback360Template}>360 feedback template</TextLink> if you want
          example questions for managers, peers and direct reports.
        </p>
      </ContentSection>

      <ContentSection title="Track responses">
        <p>
          A 360° cycle fails in the same way a spreadsheet appraisal fails: you cannot see who still
          owes a response. Track completion by person and by respondent so you know when the set is
          complete enough to share.
        </p>
      </ContentSection>

      <ContentSection title="Optional anonymity">
        <p>
          Peers and direct reports often write more useful comments when the response is not named
          in the shared report. Managers usually stay attributed. Choose anonymity per cycle, and
          be honest with respondents about what they can expect.
        </p>
      </ContentSection>

      <ContentSection title="Turn feedback into a useful review record">
        <p>
          The point of 360° feedback is not a stack of comments. It is a record the employee and
          manager can use: strengths that show up more than once, a development area that is
          specific, and a next step for the following period.
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
        title="Run a 360 feedback cycle"
        copy="Request early access if you want reusable 360° forms, response tracking and a record you can keep with the appraisal."
        secondaryHref={ROUTES.feedback360Template}
        secondaryLabel="View the 360 template"
      />
    </SiteChrome>
  );
}
