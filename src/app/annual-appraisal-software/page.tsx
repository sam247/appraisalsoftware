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
  "Annual appraisal software for UK teams. Set up campaigns, invite employees and managers, track completion with reminders, and keep a clear record of each review.";

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
      "Each cycle shows completed and outstanding responses. Configured reminders help follow up outstanding forms.",
  },
  {
    question: "Can 360° feedback sit inside the annual cycle?",
    answer:
      "The current product collects employee and manager responses. Peer and direct-report collection and anonymity are planned. Prepare the questions now, but do not rely on those features for the current cycle.",
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
        description="Set up an annual appraisal campaign, send structured forms to employees and managers, track completion with reminders, and keep a review record you can find again."
        breadcrumbs={[
          homeCrumb(),
          { label: "Annual Appraisal Software", href: ROUTES.annualAppraisalSoftware },
        ]}
      />

      <ContentSection title="What is annual appraisal software?">
        <p>
          Annual appraisal software is a place to run the yearly review, rather than a folder of Word
          documents and a spreadsheet of names. You create a campaign, choose the form, add employees
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
          Create the campaign once. Everyone in it gets the same form — structured questions,
          tailored to your review. Employee and manager responses sit on the same record.
          Completion is visible, so you are not guessing who is left.
        </p>
        <p>
          That is the whole point: run annual appraisals and employee reviews without
          spreadsheets, paperwork or a heavyweight HR system.{" "}
          <TextLink href={ROUTES.employeeAppraisalSoftware}>
            Employee appraisal software
          </TextLink>{" "}
          covers the broader review process if you also run probation or mid-year reviews in the same
          way.
        </p>
      </ContentSection>

      <ContentSection title="Plan the cycle before sending invitations">
        <p>Agree the review period, who is in the cycle and which managers will respond. Share the questions before the meetings so employees have time to prepare evidence. Set a realistic collection window and leave time for discussion afterwards.</p>
        <p>A useful cycle is more than completed forms. Arrange the meetings, agree next-period actions and book a progress check. The <TextLink href="/annual-appraisal-guide">annual appraisal guide</TextLink> covers that preparation and follow-up.</p>
      </ContentSection>

      <ContentSection title="Annual appraisal campaign workflow">
        <ol className="list-decimal space-y-3 pl-5">
          <li>
            <span className="font-medium text-foreground">Create the campaign.</span> Name it, set
            open and close dates, and choose the form.
          </li>
          <li>
            <span className="font-medium text-foreground">Add employees and managers.</span> Each
            person has a reviewer and a form to complete.
          </li>
          <li>
            <span className="font-medium text-foreground">Send the forms.</span> Respondents open a
            structured question form for the current employee and manager flow.
          </li>
          <li>
            <span className="font-medium text-foreground">Track and close.</span> Remind people who
            have not responded, then keep the finished appraisal as the record for that year —
            with employee and manager answers available in the results view.
          </li>
        </ol>
      </ContentSection>

      <ContentSection title="What you get for annual reviews">
        <ul className="list-disc space-y-2 pl-5">
          <li>Reusable appraisal forms so next year starts from last year’s questions.</li>
          <li>Structured employee and manager response forms.</li>
          <li>Manager and employee responses on one record.</li>
          <li>Completion tracking and configured campaign reminders.</li>
          <li>Self vs Manager results by subject and question.</li>
          <li>360 collection, anonymity and exports are planned additions.</li>
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
        title="Set up your next annual cycle"
        copy="Create a reusable form, assign employees and managers, and collect both perspectives for your next annual review."
        secondaryHref={ROUTES.home}
        secondaryLabel="Back to homepage"
      />
    </SiteChrome>
  );
}
