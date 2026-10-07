import {
  CtaBand,
  FaqSection,
  RelatedLinks,
  TextLink,
} from "@/components/marketing/PageSections";
import Image from "next/image";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reviews } from "@/components/home/Reviews";
import { PricingPreview } from "@/components/home/HomeBands";
import { PRIMARY_CTA_LABEL, PRIMARY_CTA_URL } from "@/lib/links";
import { marketingType } from "@/lib/marketing-typography";
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
  "Free employee appraisal software for up to 10 people. Run structured employee and manager reviews with completion tracking and retained results. No card required.";

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
      <section className="overflow-hidden pb-16 pt-12 sm:pb-24 sm:pt-16 lg:pt-20">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[3fr_2fr] lg:gap-16">
            <div>
              <h1 className="font-display text-[2.5rem] font-semibold leading-[1.06] tracking-[-0.045em] text-ink sm:text-[3.5rem] lg:text-[3.75rem]"><span className="block text-primary">Employee appraisal</span>{" "}software.</h1>
              <p className={`mt-6 max-w-xl ${marketingType.lead}`}>Give employees and managers a clear starting point for the review. Collect both perspectives, track completion and keep a record you can return to when it is time for the next conversation.</p>
              <div className="mt-8"><Button size="lg" className="px-7" asChild><a href={PRIMARY_CTA_URL}>{PRIMARY_CTA_LABEL}<ArrowRight className="size-4" aria-hidden /></a></Button></div>
              <p className="mt-5 text-xs leading-relaxed text-muted-foreground">Free for up to 10 employees · No card required</p>
            </div>
            <figure className="min-w-0">
              <div className="relative aspect-[5/4] overflow-hidden rounded-2xl bg-surface-2">
                <Image src="/marketing/one-to-one.jpg" alt="An employee and manager talking through a review together" fill preload sizes="(min-width: 1152px) 410px, (min-width: 1024px) 38vw, calc(100vw - 40px)" className="object-cover" />
              </div>
              <div className="relative mx-3 -mt-[70px] rounded-2xl border border-border bg-card p-5 shadow-[0_24px_55px_-40px_rgb(21_38_29_/_0.5)] sm:mx-6 sm:p-6">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold">Employee review</p>
                  <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-medium text-primary"><CheckCircle2 className="size-3" aria-hidden />Both complete</span>
                </div>
                <p className="mt-4 text-[11px] text-muted-foreground">What went well this period?</p>
                <div className="mt-3 grid grid-cols-2 gap-4 text-xs leading-relaxed">
                  <div><p className="font-semibold">Employee</p><p className="mt-2 text-muted-foreground">I delivered the launch on time.</p></div>
                  <div className="border-l border-border pl-4"><p className="font-semibold">Manager</p><p className="mt-2 text-muted-foreground">Strong delivery and team support.</p></div>
                </div>
                <p className="mt-4 border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">Both perspectives, one conversation.</p>
              </div>
              <figcaption className="mt-4 text-center text-[11px] text-muted-foreground">Illustrative employee review · fictional data</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface/50 px-5 py-20 sm:py-24 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div><p className={marketingType.eyebrow}>Both sides of the review</p><h2 className={`mt-4 ${marketingType.h2}`}>A shared process.<br />Two useful perspectives.</h2></div>
          <div className="space-y-5 leading-relaxed text-muted-foreground">
            <p>Employee appraisal software brings the review process together: a reusable form, employee self-assessment, manager response, a way to see who is still outstanding, and one record you can find again. Many UK teams also call this performance appraisal software.</p>
            <p>The employee can reflect on achievements, challenges and support needs. The manager can add observations and concrete examples. Keep those voices distinct before discussing the review together.</p>
            <p>Annual, mid-year and other review periods use the same employee and manager workflow. Appraisal Software focuses on that cycle, without adding payroll, recruitment or a wider HR suite.</p>
            <TextLink href={ROUTES.home}>Explore Appraisal Software</TextLink>
          </div>
        </div>
      </section>

      <section id="annual-appraisals" className="scroll-mt-24 px-5 py-20 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className={marketingType.eyebrow}>A clear process, every review period</p>
          <h2 className={`mt-4 max-w-2xl ${marketingType.h2}`}>From the first prompt<br />to the next conversation.</h2>
          <p className="mt-5 max-w-2xl leading-relaxed text-muted-foreground">Run your annual appraisal cycle with a clear review period, campaign dates and a reusable form. Share the prompts before the meetings so both people have time to prepare.</p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Choose the questions", "Build a reusable form with focused rating and written questions for the review period."],
              ["Assign employees and managers", "Set up each employee’s self-assessment and the manager response that belongs alongside it."],
              ["Collect both perspectives", "Send personal links, track completed and outstanding forms, and use configured reminders to follow up."],
              ["Have the conversation", "Read the responses together, discuss what changed and agree practical next steps. Keep the finished review for the next period."],
            ].map(([title, copy], index) => <div key={title} className="border-t border-border pt-5"><span className="text-sm font-semibold text-primary">0{index + 1}</span><h3 className="mt-4 text-base font-semibold">{title}</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{copy}</p></div>)}
          </div>
          <p className="mt-8 text-sm leading-relaxed text-muted-foreground">Use the <TextLink href={ROUTES.annualAppraisalGuide}>annual appraisal guide</TextLink> to plan the cycle, or the <TextLink href={ROUTES.annualAppraisalTemplate}>annual appraisal template</TextLink> as a starting form.</p>
        </div>
      </section>

      <section className="marketing-contrast px-5 py-20 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className={marketingType.eyebrow}>Less chasing, a clearer record</p>
          <h2 className={`mt-4 max-w-2xl ${marketingType.h2}`}>Keep the review moving.</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              ["One consistent form", "Write the questions once. Use the same structure across the team, then reuse it next time with only the changes you need."],
              ["Completion you can see", "Keep completed and outstanding responses in one campaign. Follow up from there, instead of maintaining a separate spreadsheet."],
              ["A record you can return to", "Keep employee and manager responses together by person and review period. Find the finished appraisal when you prepare the next review."],
            ].map(([title, copy]) => <div key={title} className="border-t border-border pt-5"><h3 className="text-xl font-semibold">{title}</h3><p className="mt-3 leading-relaxed text-muted-foreground">{copy}</p></div>)}
          </div>
          <a href={PRIMARY_CTA_URL} className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">{PRIMARY_CTA_LABEL}<ArrowRight className="size-4" aria-hidden /></a>
        </div>
      </section>

      <section className="border-b border-border bg-surface-2/70 px-5 py-20 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center"><p className={marketingType.eyebrow}>Help both people prepare</p><h2 className={`mt-4 ${marketingType.h2}`}>Make room for the conversation.</h2></div>
          <div className="mt-10 grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
            <div className="space-y-5 leading-relaxed text-muted-foreground">
              <p>A useful appraisal has both voices: what the employee thinks happened in the period, and what the manager observed. Collect those responses before the meeting so you can spend the conversation on what they mean.</p>
              <p>Use <TextLink href={ROUTES.appraisalAnswers}>employee self-appraisal examples</TextLink> to help employees prepare, and <TextLink href={ROUTES.appraisalComments}>manager comment examples</TextLink> for observations grounded in evidence. The <TextLink href={ROUTES.appraisalQuestions}>appraisal questions</TextLink> guide can help you choose focused prompts.</p>
              <p>Leave time to agree the next steps and book a shorter progress check after the review. Our <TextLink href={ROUTES.appraisalObjectives}>appraisal objectives</TextLink> guide offers practical examples.</p>
              <p className="text-sm">Employee appraisals use identified responses. If you also need anonymous input from peers and direct reports, explore <TextLink href={ROUTES.feedback360Software}>360 appraisals</TextLink>, available on Pro and Organisation.</p>
            </div>
            <div className="relative mx-auto aspect-[4/3] w-full max-w-xl overflow-hidden rounded-2xl bg-surface-2">
              <Image src="/marketing/team-conversation.jpg" alt="Colleagues listening and sharing perspectives in a review conversation" fill sizes="(min-width: 1152px) 428px, (min-width: 1024px) 38vw, (min-width: 640px) 576px, calc(100vw - 40px)" className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border px-5 py-20 sm:py-24 lg:px-8">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div>
            <p className={marketingType.eyebrow}>A focused respondent experience</p>
            <h2 className={`mt-4 ${marketingType.h2}`}>A clear form instead of a document chase.</h2>
            <p className="mt-5 leading-relaxed text-muted-foreground">Employees and managers open a structured question form, with one question at a time and visible progress. Keep prompts focused so people can prepare useful answers.</p>
            <p className="mt-5 text-sm text-muted-foreground">Try this sample form. Nothing you enter is saved or submitted.</p>
          </div>
          <RespondentProof />
        </div>
      </section>

      <Reviews />
      <PricingPreview />
      <RelatedLinks title="Prepare your next employee appraisal" links={[
        { href: ROUTES.annualAppraisalTemplate, label: "Annual appraisal template", copy: "Start with a clear employee and manager form." },
        { href: ROUTES.selfAppraisalTemplate, label: "Self-appraisal template", copy: "Help employees reflect before the review conversation." },
        { href: ROUTES.annualAppraisalGuide, label: "Annual appraisal guide", copy: "Plan the yearly cycle and follow up the review conversation." },
      ]} />

      <FaqSection
        items={faqs.map((faq) => ({
          question: faq.question,
          answer: faq.answer,
        }))}
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
