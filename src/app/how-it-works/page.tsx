import Link from "next/link";
import { SiteChrome } from "@/components/layout/SiteChrome";
import {
  CtaBand,
  PageHero,
  FaqSection,
  RelatedLinks,
  homeCrumb,
} from "@/components/marketing/PageSections";
import { ProcessRail } from "@/components/resources/ResourceVisual";
import { RespondentProof } from "@/components/product-marketing/RespondentProof";
import { ResultsProof } from "@/components/product-marketing/ResultsProof";
import HeroWizardPreview from "@/components/home/HeroWizardPreview";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/metadata";
import { breadcrumbSchema } from "@/lib/schema";

export const metadata = pageMetadata({
  title: "How Appraisal Software Works | Annual and 360 Reviews",
  description:
    "Follow the annual appraisal and anonymous 360 workflows, from reusable questions and invitations to completion tracking and review results.",
  path: "/how-it-works",
});
const annual = [
  [
    "Build a reusable form",
    "Choose focused questions for the review period. Use text, ratings and supported question types to give employees and managers a consistent structure.",
  ],
  [
    "Set dates and assign people",
    "Create the campaign, add employees and assign each self-assessment and manager response. Check the assignments before activation.",
  ],
  [
    "Invite and track",
    "Send personal invitation links, schedule the campaign and configure reminders. See completed and outstanding responses together.",
  ],
  [
    "Read both perspectives",
    "Bring Self vs Manager answers into the conversation. Differences are prompts to explore with evidence, rather than an automatic judgement.",
  ],
];
const feedback = [
  [
    "Choose the subject and cohort",
    "Create a campaign for one person and invite at least five distinct reviewers. Explain the purpose and privacy limits before collecting feedback.",
  ],
  [
    "Prepare the questionnaire",
    "Use reusable rating and text questions. Keep prompts relevant to behaviours reviewers can actually observe.",
  ],
  [
    "Send personal links",
    "Reviewers answer through their own invitation links. Track overall completion without displaying individual response chronology.",
  ],
  [
    "Close and release results",
    "Combined results unlock after closure and five completed reviewers. Each question needs five valid answers; material below that threshold is suppressed.",
  ],
];
export default function Page() {
  return (
    <SiteChrome>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "How it works", path: "/how-it-works" },
        ])}
      />
      <PageHero
        showCta
        eyebrow="From preparation to conversation"
        title={
          <>
            A clearer review,{" "}
            <span className="marketing-editorial text-primary">
              step by step.
            </span>
          </>
        }
        description="Bring questions, people, invitations and results into one focused process. Run an employee and manager appraisal, or gather anonymous feedback from a wider reviewer group."
        breadcrumbs={[
          homeCrumb(),
          { label: "How it works", href: "/how-it-works" },
        ]}
        visual={
          <>
            <HeroWizardPreview />
            <p className="mt-3 text-xs text-muted-foreground">
              Illustrative 360 campaign builder · fictional people
            </p>
          </>
        }
      />
      <ProcessRail
        title="Four steps. One organised cycle."
        copy="The core rhythm stays the same for annual reviews and multi-rater feedback."
        steps={[
          { title: "Prepare", copy: "Choose the questions and review period." },
          {
            title: "Assign",
            copy: "Select the people and the right respondents.",
          },
          {
            title: "Collect",
            copy: "Invite participants and track completion.",
          },
          {
            title: "Discuss",
            copy: "Use the results to prepare a useful conversation.",
          },
        ]}
      />
      <section
        id="annual"
        className="border-b border-border px-5 py-16 lg:px-0 lg:py-24"
      >
        <div className="mx-auto grid max-w-6xl lg:px-8 items-start gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Annual appraisals
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">
              Give both sides space to prepare.
            </h2>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              Employee self-assessments and manager responses use identified
              answers. Keep them distinct, then read them together when you
              meet.
            </p>
            <ol className="mt-8 divide-y divide-border border-t border-border">
              {annual.map(([title, copy], i) => (
                <li key={title} className="py-5">
                  <h3 className="flex gap-3 text-base font-semibold">
                    <span className="text-primary">0{i + 1}</span>
                    {title}
                  </h3>
                  <p className="mt-2 pl-8 text-sm leading-relaxed text-muted-foreground">
                    {copy}
                  </p>
                </li>
              ))}
            </ol>
            <Link
              href="/employee-appraisal-software"
              className="font-semibold text-primary underline underline-offset-4"
            >
              Explore annual appraisals
            </Link>
          </div>
          <div className="min-w-0 lg:sticky lg:top-28">
            <ResultsProof />
            <p className="mt-3 text-xs text-muted-foreground">
              Illustrative annual results · fictional answers
            </p>
          </div>
        </div>
      </section>
      <section
        id="360"
        className="border-b border-border bg-surface-2/50 px-5 py-16 lg:px-0 lg:py-24"
      >
        <div className="mx-auto grid max-w-6xl lg:px-8 items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div className="min-w-0 lg:order-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Anonymous 360 feedback
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">
              Bring more perspectives into focus.
            </h2>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              Use a separate multi-rater campaign for development feedback from
              peers, managers and direct reports.
            </p>
            <ol className="mt-8 divide-y divide-border border-t border-border">
              {feedback.map(([title, copy], i) => (
                <li key={title} className="py-5">
                  <h3 className="flex gap-3 text-base font-semibold">
                    <span className="text-primary">0{i + 1}</span>
                    {title}
                  </h3>
                  <p className="mt-2 pl-8 text-sm leading-relaxed text-muted-foreground">
                    {copy}
                  </p>
                </li>
              ))}
            </ol>
          </div>
          <div className="min-w-0">
            <HeroWizardPreview />
            <div className="mt-5 rounded-2xl border border-border bg-card p-6">
              <p className="text-sm font-semibold">
                Set privacy expectations before you send.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Combined results omit reviewer names and response times. Written
                comments can still identify their author. The release threshold
                cannot be lowered to reveal a smaller group.
              </p>
              <Link
                href="/360-appraisals#privacy"
                className="mt-4 inline-block text-sm font-semibold text-primary underline"
              >
                Read the privacy safeguards
              </Link>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Illustrative campaign · fictional people
            </p>
          </div>
        </div>
      </section>
      <section className="px-5 py-16 lg:px-0 lg:py-24">
        <div className="mx-auto grid max-w-6xl lg:px-8 items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              The participant experience
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">
              A focused form, with room for a useful answer.
            </h2>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              Participants follow their invitation link into a structured form.
              Clear prompts, progress and required-question guidance help them
              prepare their responses.
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Try this sanitised annual-review preview. Preview answers are not
              sent to a campaign.
            </p>
          </div>
          <div className="min-w-0">
            <RespondentProof />
            <p className="mt-3 text-xs text-muted-foreground">
              Interactive product preview · sample questions
            </p>
          </div>
        </div>
      </section>
      <section className="marketing-contrast px-5 py-16 lg:px-0 lg:py-24">
        <div className="mx-auto grid max-w-6xl lg:px-8 gap-10 lg:grid-cols-2 lg:gap-16">
          <h2 className="max-w-md text-3xl font-semibold leading-tight sm:text-4xl">
            The software prepares the evidence. You agree the next step.
          </h2>
          <div>
            <p className="leading-relaxed text-muted-foreground">
              Use annual comparisons or combined 360 feedback to discuss
              achievements, difficulties and support needs. Agree objectives and
              development actions in the meeting, then record them in your
              organisation’s chosen process.
            </p>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              Appraisal Software organises questions, collection and results. It
              does not make performance decisions for you.
            </p>
          </div>
        </div>
      </section>
      <FaqSection
        items={[
          {
            question: "How are annual and 360 reviews different?",
            answer:
              "Annual appraisals pair identified employee and manager responses. A 360 campaign gathers anonymous combined feedback about one person from several reviewers.",
          },
          {
            question: "When can we read 360 results?",
            answer:
              "After the campaign closes and at least five reviewers finish. Each question separately needs five valid answers. Results below those thresholds stay unavailable.",
          },
          {
            question: "Do we need a wider HR platform?",
            answer:
              "No. This is a focused review workflow for reusable questions, assignments, invitations, reminders, completion and results.",
          },
          {
            question: "Can we prepare with free templates first?",
            answer: (
              <>
                Yes.{" "}
                <Link href="/templates" className="text-primary underline">
                  Copy or print a free template
                </Link>{" "}
                to agree your questions before setting up a campaign.
              </>
            ),
          },
        ]}
      />
      <RelatedLinks
        title="Prepare for your first cycle"
        links={[
          {
            href: "/annual-appraisal-template",
            label: "Annual appraisal template",
            copy: "A complete starting form for both sides of the review.",
          },
          {
            href: "/appraisal-questions",
            label: "Appraisal questions",
            copy: "Focused prompts for employee and manager reflection.",
          },
          {
            href: "/360-feedback-questions",
            label: "360 feedback questions",
            copy: "Choose prompts around observable behaviours.",
          },
        ]}
      />
      <CtaBand
        title="Make room for your next review conversation."
        copy="Bring annual appraisals and anonymous 360 feedback into one focused workspace."
        secondaryHref="/pricing"
        secondaryLabel="Compare plans"
      />
    </SiteChrome>
  );
}
