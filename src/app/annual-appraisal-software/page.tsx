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
import { RespondentProof } from "@/components/product-marketing/RespondentProof";
import { ResultsProof } from "@/components/product-marketing/ResultsProof";

const TITLE = "Annual Appraisal Software for UK Teams | Appraisal Software";
const DESCRIPTION =
  "Annual appraisal software for UK SMEs. Create yearly appraisal campaigns, collect employee and manager responses, track completion with reminders, and keep one clear record per review — without buying a full HR suite.";

const faqs = [
  {
    question: "What is annual appraisal software?",
    answer:
      "It is software for running a yearly review cycle: the same forms, the right people, a way to see who has finished, and a record you can find again next year.",
  },
  {
    question: "Can we run annual appraisals without a full HR system?",
    answer:
      "Yes. Appraisal Software is built for that. It does not replace payroll, holidays or recruitment. It runs the appraisal cycle: campaigns, forms, employee and manager responses, completion tracking and records.",
  },
  {
    question: "How is this different from the Appraisal Software homepage?",
    answer:
      "The homepage explains the overall product. This page is specifically for running the yearly cycle — campaign dates, who is in scope, employee and manager forms, reminders and the finished annual record.",
  },
  {
    question: "Can we reuse last year’s appraisal form?",
    answer:
      "Yes. Save the questions as a reusable form and use them again, with small changes if your objectives or competencies have moved on.",
  },
  {
    question: "How do we know who has completed their appraisal?",
    answer:
      "Each cycle shows completed and outstanding responses. Configured reminders help follow up outstanding forms instead of chasing managers one by one in email.",
  },
  {
    question: "Can 360° feedback sit inside the annual cycle?",
    answer:
      "The current product is focused on employee and manager annual appraisals. If you are planning a 360 exercise, use the 360 feedback guide, questions, examples and template as a separate resource set.",
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
        eyebrow="Yearly review cycles"
        title="Annual Appraisal Software"
        description="Run your company’s annual appraisal cycle in one place: create the campaign, collect employee and manager responses, track who is still outstanding, and keep a findable record for each person — without buying a full HR suite."
        breadcrumbs={[
          homeCrumb(),
          { label: "Annual Appraisal Software", href: ROUTES.annualAppraisalSoftware },
        ]}
      />

      <ContentSection title="What is annual appraisal software?">
        <p>
          Annual appraisal software is the process layer for the yearly review. You create a
          campaign for a review period, choose a reusable form, assign employees and their managers,
          collect both perspectives, then close the cycle with a record you can find next year.
        </p>
        <p>
          Appraisal Software is built for that job for UK SMEs. It is not payroll, absence or
          recruitment software, and it is not a wide performance platform. If you already know you
          need annual reviews, this page is the dedicated path for running that cycle. For the wider
          product overview, see the{" "}
          <TextLink href={ROUTES.home}>Appraisal Software homepage</TextLink>.
        </p>
      </ContentSection>

      <ContentSection title="Why annual appraisal cycles stall">
        <p>
          The review meeting is rarely the hard part. The admin around it is. Forms live in email.
          Completion lives in a spreadsheet someone last updated in March. Last year’s comments are
          in a shared drive — or they are not.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Each manager writes slightly different questions, so reviews are hard to compare.</li>
          <li>Nobody can see, in one place, who still owes a response.</li>
          <li>Reminders become personal chase emails from the owner or sole HR person.</li>
          <li>When someone asks for last year’s appraisal, finding it takes a hunt.</li>
        </ul>
        <p>
          If you want a starting form first, use the{" "}
          <TextLink href={ROUTES.annualAppraisalTemplate}>annual appraisal template</TextLink> and
          the <TextLink href={ROUTES.appraisalQuestions}>appraisal questions</TextLink> list, then
          run the same structure as a campaign.
        </p>
      </ContentSection>

      <ContentSection title="Annual appraisal software without a full HR suite">
        <p>
          Many UK teams already know how their appraisals should work. They do not want to buy
          payroll, recruitment and absence modules just to send forms and track completion.
        </p>
        <p>
          Appraisal Software focuses on the annual cycle: reusable questions, employee
          self-assessment, manager response, completion tracking, reminders and one organised record
          per person. That is enough for most 20–150 person teams that need a proportionate process,
          not another heavyweight system.
        </p>
      </ContentSection>

      <ContentSection title="See who has finished — without chasing by spreadsheet">
        <p>
          Open the campaign and answer a simple question: who is still outstanding? Completion
          tracking shows finished and open responses. Configured reminders follow up from the
          campaign, rather than from your personal inbox.
        </p>
        <p>
          Employee and manager answers sit on the same record, so you are not merging two documents
          later. Self vs Manager results help you prepare the conversation from both perspectives.
        </p>
      </ContentSection>

      <section className="border-b border-border bg-surface/50 py-12 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8">
          <div>
            <h2 className="font-display text-[1.5rem] font-semibold leading-[1.15] tracking-[-0.025em] text-foreground sm:text-[1.75rem]">
              A respondent experience people can finish
            </h2>
            <p className="mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-muted-foreground sm:text-base">
              Employees and managers answer focused questions through the same
              structured appraisal experience, with progress visible as they
              work.
            </p>
          </div>
          <RespondentProof />
        </div>
      </section>

      <ContentSection title="Plan the cycle before sending invitations">
        <p>
          Agree the review period, who is in the cycle and which managers will respond. Share the
          questions before the meetings so employees have time to prepare evidence. Set a realistic
          collection window and leave time for discussion afterwards.
        </p>
        <p>
          A useful cycle is more than completed forms. Arrange the meetings, agree next-period
          actions and book a progress check. The{" "}
          <TextLink href={ROUTES.annualAppraisalGuide}>annual appraisal guide</TextLink> covers that
          preparation and follow-up.
        </p>
      </ContentSection>

      <ContentSection title="Annual appraisal campaign workflow">
        <ol className="list-decimal space-y-3 pl-5">
          <li>
            <span className="font-medium text-foreground">Create the campaign.</span> Name it, set
            open and close dates, and choose the form.
          </li>
          <li>
            <span className="font-medium text-foreground">Add employees and managers.</span> Each
            person has a self-assessment and a manager response to complete.
          </li>
          <li>
            <span className="font-medium text-foreground">Send the forms.</span> Respondents open a
            structured question form for the current employee and manager flow.
          </li>
          <li>
            <span className="font-medium text-foreground">Track and close.</span> Remind people who
            have not responded, then keep the finished appraisal as the record for that year — with
            employee and manager answers available in the results view.
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
          <li>Organisation branding for a more recognisable respondent experience.</li>
          <li>Team administrator controls for shared workspace ownership.</li>
          <li>A focused annual workflow without payroll, absence or recruitment modules.</li>
        </ul>
        <p>
          If you also run probation or mid-year reviews with the same approach, see{" "}
          <TextLink href={ROUTES.employeeAppraisalSoftware}>employee appraisal software</TextLink>{" "}
          for the broader review process. This page stays focused on the yearly cycle.
        </p>
      </ContentSection>

      <section className="border-b border-border py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <ResultsProof />
        </div>
      </section>

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
            copy: "A free yearly form covering objectives, employee reflection, manager comments and next steps.",
          },
          {
            href: ROUTES.annualAppraisalGuide,
            label: "Annual appraisal guide",
            copy: "How to prepare, run and follow up the yearly review conversation.",
          },
          {
            href: ROUTES.appraisalQuestions,
            label: "Appraisal questions",
            copy: "A practical list of questions grouped for UK annual reviews.",
          },
          {
            href: ROUTES.appraisalObjectives,
            label: "Appraisal objectives",
            copy: "Examples of clear objectives to discuss and review.",
          },
          {
            href: ROUTES.home,
            label: "Appraisal Software homepage",
            copy: "The overall product for focused appraisal cycles.",
          },
        ]}
      />

      <CtaBand
        title="Set up your next annual cycle"
        copy="Create a reusable form, assign employees and managers, and collect both perspectives for your next annual review — without buying a full HR suite."
        secondaryHref={ROUTES.annualAppraisalTemplate}
        secondaryLabel="Start from the template"
      />
    </SiteChrome>
  );
}