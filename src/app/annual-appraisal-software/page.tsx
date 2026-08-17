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

const TITLE = "Annual Appraisal Software for UK Teams | Appraisal Software";
const DESCRIPTION =
  "Annual appraisal software for UK teams. Set up forms, invite employees and managers, track completion and keep a clear record of each review.";

const faqs = [
  {
    question: "What is annual appraisal software?",
    answer:
      "It is software for running a yearly review cycle: the same forms, the right people, a way to see who has finished, and a record you can find again next year.",
  },
  {
    question: "Can we run annual appraisals without a full HR system?",
    answer:
      "Yes. Appraisal Software is built for that. It does not replace payroll, holidays or recruitment. It runs the appraisal cycle.",
  },
  {
    question: "Can we reuse last year’s appraisal form?",
    answer:
      "Yes. Save the questions as a reusable form and use them again, with small changes if your objectives or competencies have moved on.",
  },
  {
    question: "How do we know who has completed their appraisal?",
    answer:
      "Each cycle shows who has finished, who has started and who has not responded. You can send a reminder for outstanding forms instead of chasing by email.",
  },
  {
    question: "Can 360° feedback sit inside the annual cycle?",
    answer:
      "Yes, if you want it. Most teams run a manager and employee form first. Add peer or direct-report feedback where it is useful, not as the default for every role.",
  },
];

export const metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: ROUTES.annualAppraisalSoftware,
});

export default function AnnualAppraisalSoftwarePage() {
  return (
    <SiteChrome>
      <JsonLd
        data={softwareApplicationSchema({
          path: ROUTES.annualAppraisalSoftware,
          name: "Annual Appraisal Software",
          description: DESCRIPTION,
        })}
      />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: ROUTES.home },
          { name: "Annual Appraisal Software", path: ROUTES.annualAppraisalSoftware },
        ])}
      />
      <PageHero
        eyebrow="For UK teams"
        title="Annual Appraisal Software"
        description="Set up an annual appraisal cycle, send the same forms to employees and managers, track completion and keep a review record you can find again."
        breadcrumbs={[
          homeCrumb(),
          { label: "Annual Appraisal Software", href: ROUTES.annualAppraisalSoftware },
        ]}
      />

      <ContentSection title="What is annual appraisal software?">
        <p>
          Annual appraisal software is a place to run the yearly review, rather than a folder of Word
          documents and a spreadsheet of names. You create a cycle, choose the form, add employees
          and managers, then collect responses until the cycle is closed.
        </p>
        <p>
          Appraisal Software is built for that job. It is{" "}
          <TextLink href={ROUTES.home}>simple annual appraisal software for UK teams</TextLink> — not
          a full HR system and not a wide performance platform. If you already know you need annual
          reviews, this is the process around them.
        </p>
      </ContentSection>

      <ContentSection title="Why annual appraisals break down in spreadsheets">
        <p>
          The review itself is usually fine. The admin around it is not. Forms live in email. The
          tracker is a spreadsheet someone last updated in March. Last year’s comments are in a
          shared drive, or they are not.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Each manager writes slightly different questions.</li>
          <li>You cannot see, in one place, who still owes a response.</li>
          <li>Reminders become personal chase emails.</li>
          <li>When someone asks for last year’s appraisal, it takes a hunt to find it.</li>
        </ul>
        <p>
          If you want a starting form, use the{" "}
          <TextLink href={ROUTES.annualAppraisalTemplate}>annual appraisal template</TextLink> and
          the <TextLink href={ROUTES.appraisalQuestions}>appraisal questions</TextLink> list, then
          run the same structure as a cycle.
        </p>
      </ContentSection>

      <ContentSection title="How Appraisal Software helps">
        <p>
          Create the cycle once. Everyone in it gets the same form. Employee and manager responses
          sit on the same record. Completion is visible, so you are not guessing who is left.
        </p>
        <p>
          That is the whole point: run annual appraisals, employee reviews and 360° feedback without
          spreadsheets, Word forms or email chasing.{" "}
          <TextLink href={ROUTES.employeeAppraisalSoftware}>
            Employee appraisal software
          </TextLink>{" "}
          covers the broader review process if you also run probation or mid-year reviews in the same
          way.
        </p>
      </ContentSection>

      <ContentSection title="Annual appraisal cycle workflow">
        <ol className="list-decimal space-y-3 pl-5">
          <li>
            <span className="font-medium text-foreground">Create the cycle.</span> Name it, set the
            review period and choose the form.
          </li>
          <li>
            <span className="font-medium text-foreground">Add employees and managers.</span> Each
            person has a reviewer and a form to complete.
          </li>
          <li>
            <span className="font-medium text-foreground">Send the forms.</span> Include 360°
            feedback only where you want extra input from peers or direct reports.
          </li>
          <li>
            <span className="font-medium text-foreground">Track and close.</span> Remind people who
            have not responded, then keep the finished appraisal as the record for that year.
          </li>
        </ol>
      </ContentSection>

      <ContentSection title="Features for annual reviews">
        <ul className="list-disc space-y-2 pl-5">
          <li>Reusable appraisal forms so next year starts from last year’s questions.</li>
          <li>Manager and employee responses on one record.</li>
          <li>Completion tracking across the cycle.</li>
          <li>Email reminders for outstanding forms.</li>
          <li>Reporting and export when you need a copy of the cycle.</li>
          <li>Secure storage of the review, instead of a shared inbox.</li>
          <li>Optional anonymous 360° feedback where it is appropriate.</li>
        </ul>
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
            href: ROUTES.annualAppraisalTemplate,
            label: "Annual appraisal template",
            copy: "A simple form covering employee details, objectives, performance, development and next steps.",
          },
          {
            href: ROUTES.appraisalQuestions,
            label: "Appraisal questions",
            copy: "A practical list of questions grouped for UK annual reviews.",
          },
          {
            href: ROUTES.home,
            label: "Appraisal Software homepage",
            copy: "Simple annual appraisal software for UK teams.",
          },
        ]}
      />

      <CtaBand
        title="Create your appraisal cycle"
        copy="Request early access and we will help you set up the first annual cycle for your team."
        secondaryHref={ROUTES.home}
        secondaryLabel="Back to homepage"
      />
    </SiteChrome>
  );
}
