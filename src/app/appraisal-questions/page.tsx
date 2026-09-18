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
import { articleSchema, breadcrumbSchema } from "@/lib/schema";

const TITLE = "Appraisal Questions for UK Teams | Appraisal Software";
const DESCRIPTION =
  "Practical appraisal questions for UK teams, grouped by performance, objectives, strengths, development, manager support, career and the next review period.";

const groups = [
  {
    title: "Performance",
    intro: "Ask for evidence from this review period, not a general impression of the person.",
    questions: [
      "What were the most important pieces of work you delivered in this period?",
      "Where did the quality of the work meet the standard needed?",
      "Where did it fall short, and what was the effect?",
      "How reliably did you meet agreed deadlines?",
      "What would you do differently if you ran the same work again?",
    ],
  },
  {
    title: "Objectives",
    intro: "Keep this tied to what was actually agreed at the last review, not a new wish list.",
    questions: [
      "Which objectives were met in full?",
      "Which objectives changed during the year, and why?",
      "What stopped an objective being met?",
      "Were the original objectives still the right ones by the end of the period?",
      "What should the next set of objectives be, in plain language?",
    ],
  },
  {
    title: "Strengths",
    intro: "Name the strength and the situation. Vague praise is hard to repeat.",
    questions: [
      "What should this person keep doing because it clearly helps the team?",
      "When were they at their most effective this year?",
      "What do colleagues rely on them for?",
      "Which part of the role do they do better than they did a year ago?",
    ],
  },
  {
    title: "Development areas",
    intro: "One or two specific areas are more useful than a long list.",
    questions: [
      "What is the main thing that needs to improve in the next period?",
      "Give one example from this year where that gap showed up.",
      "What would ‘better’ look like in six months?",
      "Is this a skill gap, a time gap, or a clarity gap?",
    ],
  },
  {
    title: "Manager support",
    intro: "Appraisals go wrong when the manager’s part of the job is left out.",
    questions: [
      "What support did you need from your manager this year that you did not get?",
      "What did your manager do that helped you do the job?",
      "How clear were priorities when the work got busy?",
      "What should your manager do differently next period?",
    ],
  },
  {
    title: "Career development",
    intro: "Keep this honest. Not every role has a promotion waiting.",
    questions: [
      "What do you want to be better at in 12 months’ time?",
      "Are you looking for more depth in this role, or a different type of work?",
      "What experience would help, that you do not have yet?",
      "Is there a constraint we should be honest about (budget, headcount, timing)?",
    ],
  },
  {
    title: "Next review period",
    intro: "Leave the meeting with actions, not only comments.",
    questions: [
      "What are the three objectives for the next period?",
      "What will the employee do, and by when?",
      "What will the manager do, and by when?",
      "When will you check progress before the next annual review?",
      "Is there anything either of you wants on the record that has not been said yet?",
    ],
  },
];

export const metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: ROUTES.appraisalQuestions,
});

export default function AppraisalQuestionsPage() {
  return (
    <SiteChrome>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: ROUTES.home },
          { name: "Appraisal Questions", path: ROUTES.appraisalQuestions },
        ])}
      />
      <JsonLd data={articleSchema({ title: "Appraisal Questions for UK Teams", description: DESCRIPTION, path: ROUTES.appraisalQuestions, dateModified: "2026-09-18" })} />
      <PageHero
        eyebrow="Question bank"
        title="Appraisal questions"
        description="A practical list of appraisal questions for UK teams. Pick a few from each group rather than using the whole list in one form."
        breadcrumbs={[
          homeCrumb(),
          { label: "Appraisal questions", href: ROUTES.appraisalQuestions },
        ]}
      />

      <nav aria-label="Question groups" className="no-print mx-auto max-w-6xl px-5 py-8 lg:px-8">
        <p className="text-xs text-muted-foreground">Written and reviewed by the Appraisal Software team · 18 September 2026</p>
        <ul className="mt-4 flex flex-wrap gap-4 text-sm">{groups.map((group, index) => <li key={group.title}><a className="underline underline-offset-4" href={`#question-group-${index + 1}`}>{group.title}</a></li>)}</ul>
      </nav>
      <ContentSection title="How to use these questions">
        <p>
          Ten to fifteen questions is enough for an annual appraisal. Repeat the same set across the
          team. Mix employee questions and manager questions, then meet to discuss the answers.
        </p>
        <p>
          Put the chosen questions into the{" "}
          <TextLink href={ROUTES.annualAppraisalTemplate}>annual appraisal template</TextLink>, or
          run them as a reusable form with{" "}
          <TextLink href={ROUTES.annualAppraisalSoftware}>annual appraisal software</TextLink>.
        </p>
      </ContentSection>

      <ContentSection title="Separate employee prompts from manager observations">
        <p>Employees can explain their contribution, what they learned and the support they need. Managers should describe what they observed against the agreed expectations. Ask both sides for examples; do not turn the form into a list of personality ratings.</p>
        <p>For wording, see <TextLink href="/appraisal-answers">employee self-appraisal answers</TextLink> and <TextLink href="/appraisal-comments">manager appraisal comments</TextLink>.</p>
      </ContentSection>

      {groups.map((group, index) => (
        <ContentSection key={group.title} id={`question-group-${index + 1}`} title={group.title}>
          <p>{group.intro}</p>
          <ul className="list-disc space-y-2 pl-5">
            {group.questions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        </ContentSection>
      ))}

      <RelatedLinks
        links={[
          {
            href: ROUTES.annualAppraisalSoftware,
            label: "Annual appraisal software",
            copy: "Turn a question set into a cycle with tracking and records.",
          },
          {
            href: ROUTES.home,
            label: "Appraisal Software homepage",
            copy: "Simple annual appraisal software for UK teams.",
          },
          {
            href: ROUTES.annualAppraisalTemplate,
            label: "Annual appraisal template",
            copy: "The form structure these questions sit inside.",
          },
        ]}
      />

      <CtaBand
        title="Use these questions in your next cycle"
        copy="Give employees and managers a focused set of prompts in Appraisal Software, then collect both perspectives before the review."
        secondaryHref={ROUTES.annualAppraisalSoftware}
        secondaryLabel="Annual appraisal software"
      />
    </SiteChrome>
  );
}
