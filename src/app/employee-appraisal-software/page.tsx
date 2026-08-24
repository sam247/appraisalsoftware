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

const TITLE = "Employee Appraisal Software for UK Teams | Appraisal Software";
const DESCRIPTION =
  "Employee appraisal software for UK teams. Run employee reviews with branded one-question forms, manager and employee feedback, completion tracking and a clear record of each appraisal.";

const faqs = [
  {
    question: "What does employee appraisal software do?",
    answer:
      "It gives you a consistent form, a way to collect manager and employee comments, and a record of each review. You can see which appraisals are done and which are still open.",
  },
  {
    question: "Is this a performance management suite?",
    answer:
      "No. It is employee appraisal software. You get cycles, forms, responses, tracking and records. You do not get a wider HR product around it.",
  },
  {
    question: "Can employees complete their own appraisal form?",
    answer:
      "Yes. A typical cycle includes a self-assessment and a manager response, kept on the same record.",
  },
  {
    question: "Can we keep previous appraisals?",
    answer:
      "Yes. Each finished review stays as a record for that person and that period, instead of living in email or a shared folder.",
  },
  {
    question: "How is this different from annual appraisal software?",
    answer:
      "The annual page is for the yearly cycle. This page covers employee reviews more broadly — including teams that also run probation or mid-year reviews with the same forms.",
  },
];

export const metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: ROUTES.employeeAppraisalSoftware,
});

export default function EmployeeAppraisalSoftwarePage() {
  return (
    <SiteChrome>
      <JsonLd
        data={softwareApplicationSchema({
          path: ROUTES.employeeAppraisalSoftware,
          name: "Employee Appraisal Software",
          description: DESCRIPTION,
        })}
      />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: ROUTES.home },
          { name: "Employee Appraisal Software", path: ROUTES.employeeAppraisalSoftware },
        ])}
      />
      <PageHero
        eyebrow="Employee reviews"
        title="Employee Appraisal Software"
        description="Run employee appraisals with branded one-question forms, manager and employee feedback, completion tracking and a record of each review."
        breadcrumbs={[
          homeCrumb(),
          { label: "Employee Appraisal Software", href: ROUTES.employeeAppraisalSoftware },
        ]}
      />

      <ContentSection title="Run employee appraisals without manual admin">
        <p>
          Employee appraisals stall when the process lives in Word, email and a tracker nobody
          trusts. The review meeting is not the hard part. Finding the form, chasing the manager and
          storing the result is.
        </p>
        <p>
          Appraisal Software is{" "}
          <TextLink href={ROUTES.home}>simple annual appraisal software for UK teams</TextLink> that
          also covers employee reviews more generally. Create a campaign, send a branded form, collect
          both sides of the conversation, and keep the finished appraisal.
        </p>
      </ContentSection>

      <ContentSection title="A respondent experience people finish">
        <p>
          Employees and managers open a modern form — your organisation branding, one question at a
          time — instead of a long Word document or a form buried in email. That is where completion
          actually improves.
        </p>
        <p>
          Write the questions once. Use the same form across the team so reviews are comparable, and
          reuse it next time with only the changes you actually need. Start from the{" "}
          <TextLink href={ROUTES.appraisalQuestions}>appraisal questions</TextLink> list or the{" "}
          <TextLink href={ROUTES.annualAppraisalTemplate}>annual appraisal template</TextLink>.
        </p>
      </ContentSection>

      <ContentSection title="Collect manager and employee feedback">
        <p>
          A useful appraisal has both voices: what the employee thinks happened in the period, and
          what the manager observed. Keep those responses together instead of merging two documents
          later.
        </p>
        <p>
          If you also want input from peers or direct reports, that is a{" "}
          <TextLink href={ROUTES.feedback360Software}>360° feedback</TextLink> step — optional, not
          the main process.
        </p>
      </ContentSection>

      <ContentSection title="Track completion">
        <p>
          Open a campaign and you should be able to answer a simple question: who is still
          outstanding? Completion tracking shows who has finished, who has started and who has not
          opened the form. Reminders go from there, rather than from a personal email thread.
        </p>
      </ContentSection>

      <ContentSection title="Keep a clear record of each appraisal">
        <p>
          When the cycle closes, the appraisal should still be findable. That means one record per
          person, per review period: questions, comments, scores if you use them, and the next steps
          you agreed.
        </p>
        <p>
          For the yearly version of this process, use{" "}
          <TextLink href={ROUTES.annualAppraisalSoftware}>annual appraisal software</TextLink>. That
          page is the dedicated path for running the annual cycle.
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
            href: ROUTES.annualAppraisalSoftware,
            label: "Annual appraisal software",
            copy: "The dedicated page for running a yearly appraisal cycle.",
          },
          {
            href: ROUTES.home,
            label: "Appraisal Software homepage",
            copy: "What the product is, who it is for, and how a cycle works.",
          },
        ]}
      />

      <CtaBand
        title="Run employee appraisals without the spreadsheet"
        copy="Book a walkthrough to see the respondent experience, campaign tracking and review records."
        secondaryHref={ROUTES.annualAppraisalSoftware}
        secondaryLabel="See annual appraisals"
      />
    </SiteChrome>
  );
}
