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
import {
  breadcrumbSchema,
  faqPageSchema,
  softwareApplicationSchema,
} from "@/lib/schema";
import { RespondentProof } from "@/components/product-marketing/RespondentProof";

const TITLE = "Employee Appraisal Software for UK Teams | Appraisal Software";
const DESCRIPTION =
  "Employee appraisal software for UK SMEs. Run employee and performance appraisals with structured forms, manager and employee feedback, completion tracking and a clear record — without buying a full HR suite.";

const faqs = [
  {
    question: "What does employee appraisal software do?",
    answer:
      "It gives you a consistent form, a way to collect manager and employee comments, and a record of each review. You can see which appraisals are done and which are still open.",
  },
  {
    question:
      "Is employee appraisal software the same as performance appraisal software?",
    answer:
      "For most UK teams, yes — the same product. This page covers employee and performance appraisals: structured forms, both perspectives, completion tracking and a findable record. It is not a wider performance management suite.",
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
    question: "Can we run annual appraisal cycles?",
    answer:
      "Yes. Annual appraisals are one use of the employee and manager workflow. Set the review period and campaign dates, choose reusable questions, assign employees and managers, then track responses and keep each finished review together.",
  },
];

export const metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: ROUTES.employeeAppraisalSoftware,
});

export default function EmployeeAppraisalSoftwarePage() {
  return (
    <SiteChrome commercial>
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
          {
            name: "Employee Appraisal Software",
            path: ROUTES.employeeAppraisalSoftware,
          },
        ])}
      />
      <PageHero
        visual={
          <>
            <RespondentProof />
            <p className="mt-3 text-xs text-muted-foreground">
              Illustrative product preview · fictional data
            </p>
          </>
        }
        showCta
        eyebrow="Employee & performance reviews"
        title="Employee Appraisal Software"
        description="Run employee and performance appraisals for UK teams with structured question forms, manager and employee feedback, completion tracking and a clear record of each review — without buying a full HR suite."
        breadcrumbs={[
          homeCrumb(),
          {
            label: "Employee Appraisal Software",
            href: ROUTES.employeeAppraisalSoftware,
          },
        ]}
      />

      <ContentSection
        layout="split"
        title="What is employee appraisal software?"
      >
        <p>
          Employee appraisal software is the process layer for reviewing people
          at work: a reusable form, employee self-assessment, manager response,
          a way to see who is still outstanding, and one record you can find
          again. Many UK teams also call this performance appraisal software —
          same job, same page.
        </p>
        <p>
          Appraisal Software is built for that job for UK SMEs. It is not
          payroll, absence or recruitment software, and it is not a wide
          performance platform. For the overall product overview, see the{" "}
          <TextLink href={ROUTES.home}>Appraisal Software homepage</TextLink>.{" "}
          Annual appraisals use this same employee and manager workflow.
        </p>
      </ContentSection>

      <ContentSection id="annual-appraisals" layout="split" title="Run your annual appraisal cycle">
        <p>
          Annual appraisals are a common use of employee appraisal software.
          Agree the review period, the people in scope and the managers who will
          respond. Set campaign dates and choose a reusable form so next year’s
          cycle starts from questions your team already understands.
        </p>
        <p>
          Share the prompts before the meetings, collect employee and manager
          responses, and use completion tracking and configured reminders to
          follow up outstanding forms. Keep the finished review together so
          it is easy to find for the next period.
        </p>
        <p>
          Leave time for the conversation and book a shorter progress check
          after it. Use the <TextLink href={ROUTES.annualAppraisalGuide}>annual appraisal guide</TextLink>
          {" "}to plan the cycle, or the <TextLink href={ROUTES.annualAppraisalTemplate}>annual appraisal template</TextLink>
          {" "}as a starting form.
        </p>
      </ContentSection>

      <ContentSection title="Why employee appraisals stall">
        <p>
          The review conversation is rarely the hard part. The admin around it
          is. Forms live in Word and email. Completion lives in a spreadsheet
          someone last updated months ago. Last period’s comments are hard to
          find — or they are gone.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Each manager writes slightly different questions, so reviews are
            hard to compare.
          </li>
          <li>Nobody can see, in one place, who still owes a response.</li>
          <li>
            Reminders become personal chase emails from the owner or sole HR
            person.
          </li>
          <li>
            When someone asks for the last appraisal, finding it takes a hunt.
          </li>
        </ul>
        <p>
          If you want a starting form first, use the{" "}
          <TextLink href={ROUTES.annualAppraisalTemplate}>
            annual appraisal template
          </TextLink>{" "}
          or the{" "}
          <TextLink href={ROUTES.appraisalQuestions}>
            appraisal questions
          </TextLink>{" "}
          list, then run the same structure as a campaign.
        </p>
      </ContentSection>

      <ContentSection
        layout="split"
        title="Employee appraisal software without a full HR suite"
      >
        <p>
          Many UK teams already know how their appraisals should work. They need
          a proportionate process for employee and manager input, not another
          heavyweight system around payroll and recruitment.
        </p>
        <p>
          Appraisal Software focuses on the review cycle: reusable questions,
          employee self-assessment, manager response, completion tracking,
          reminders and one organised record per person. That is enough for most
          20–150 person teams that need employee appraisal software they will
          actually finish.
        </p>
      </ContentSection>

      <ContentSection title="A respondent experience people finish">
        <p>
          Employees and managers open a structured question form instead of a
          long Word document or a form buried in email. Keep prompts focused so
          people can prepare clear, useful answers.
        </p>
        <p>
          Write the questions once. Use the same form across the team so reviews
          are comparable, and reuse it next time with only the changes you
          actually need.
        </p>
      </ContentSection>

      <section className="border-b border-border bg-surface/50 py-12 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:gap-16 lg:px-8">
          <div>
            <h2 className="font-display text-[1.5rem] font-semibold leading-[1.15] tracking-[-0.025em] text-foreground sm:text-[1.75rem]">
              A clear form instead of a document chase
            </h2>
            <p className="mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-muted-foreground sm:text-base">
              The respondent journey is focused on one question at a time, keeps
              progress visible and gives employees and managers space to provide
              useful answers.
            </p>
          </div>
          <RespondentProof />
        </div>
      </section>

      <ContentSection
        layout="split"
        title="Collect manager and employee feedback"
      >
        <p>
          A useful appraisal has both voices: what the employee thinks happened
          in the period, and what the manager observed. Keep those responses
          together instead of merging two documents later.
        </p>
        <p>
          If you also need input from peers or direct reports, use{" "}
          <TextLink href={ROUTES.feedback360Software}>
            360 appraisals
          </TextLink>{" "}
          to run an anonymous multi-rater campaign alongside the appraisal
          cycle.
        </p>
      </ContentSection>

      <ContentSection title="Help both people prepare">
        <p>
          Employees need prompts that help them explain achievements,
          difficulties and support needs. Managers need space for observed
          results and concrete examples. Keep those voices distinct before
          discussing the review together.
        </p>
        <p>
          Use{" "}
          <TextLink href="/appraisal-answers">
            employee self-appraisal examples
          </TextLink>{" "}
          to help employees prepare, and{" "}
          <TextLink href="/appraisal-comments">
            manager comment examples
          </TextLink>{" "}
          for observations grounded in evidence.
        </p>
      </ContentSection>

      <ContentSection layout="split" title="Track completion">
        <p>
          Open a campaign and you should be able to answer a simple question:
          who is still outstanding? Completion tracking shows completed and
          outstanding responses. Reminders go from there, rather than from a
          personal email thread.
        </p>
      </ContentSection>

      <ContentSection title="Keep a clear record of each appraisal">
        <p>
          When the cycle closes, the appraisal should still be findable. That
          means one record per person, per review period: questions, comments,
          scores if you use them, and the next steps you agreed.
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
            href: ROUTES.annualAppraisalGuide,
            label: "Annual appraisal guide",
            copy: "Plan the yearly cycle and follow up the review conversation.",
          },
          {
            href: ROUTES.home,
            label: "Appraisal Software homepage",
            copy: "What the product is, who it is for, and how a cycle works.",
          },
          {
            href: ROUTES.appraisalObjectives,
            label: "Appraisal objectives",
            copy: "Examples to help employees and managers agree useful next steps.",
          },
        ]}
      />

      <CtaBand
        title="Run employee appraisals without the spreadsheet"
        copy="Prepare your questions and collect employee and manager responses in Appraisal Software — without buying a full HR suite."
        secondaryHref={ROUTES.annualAppraisalTemplate}
        secondaryLabel="Start from the annual template"
      />
    </SiteChrome>
  );
}
