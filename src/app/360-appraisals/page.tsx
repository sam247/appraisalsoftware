import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { PricingPreview } from "@/components/home/HomeBands";
import { CtaBand, FaqSection, RelatedLinks, TextLink } from "@/components/marketing/PageSections";
import { JsonLd } from "@/components/seo/JsonLd";
import { Button } from "@/components/ui/button";
import { PRIMARY_CTA_LABEL, PRIMARY_CTA_URL } from "@/lib/links";
import { marketingType } from "@/lib/marketing-typography";
import { pageMetadata } from "@/lib/metadata";
import { ROUTES } from "@/lib/routes";
import { breadcrumbSchema, softwareApplicationSchema } from "@/lib/schema";

const description = "Run 360 appraisals for UK teams. Invite managers, peers and direct reports, collect anonymous feedback and turn combined results into a useful development conversation.";
export const metadata = pageMetadata({
  title: "360 Appraisals & Feedback Software for UK Teams | Appraisal Software",
  description,
  path: ROUTES.feedback360Software,
});

const steps = [
  ["Build the appraisal", "Choose the person receiving feedback and a reusable template of rating and written questions."],
  ["Invite the right people", "Select managers, peers, direct reports or other reviewers who know the person’s work. Plan for at least five completed responses."],
  ["Collect the feedback", "Send personal invitation links, track completion and use configured reminders to keep the campaign moving."],
  ["Start the conversation", "Close the campaign to release combined results when the privacy minimum is met. Discuss strengths and agree practical next steps."],
];

export default function Page() {
  return (
    <SiteChrome>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "360 Appraisals", path: ROUTES.feedback360Software }])} />
      <JsonLd data={softwareApplicationSchema({ path: ROUTES.feedback360Software, name: "360 Appraisals", description })} />
      <section className="overflow-hidden pb-16 pt-12 sm:pb-24 sm:pt-16 lg:pt-20">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <div className="max-w-xl">
              <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">360 appraisal software for UK teams</p>
              <h1 className={marketingType.h1Home}>360 appraisals.<br /><span className="marketing-editorial text-primary">A fuller picture of their work.</span></h1>
              <p className={`mt-6 ${marketingType.lead}`}>Bring managers, peers and direct reports into the conversation. Collect anonymous feedback in one clear process, then use the combined results to help people develop.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" className="px-7" asChild><a href={PRIMARY_CTA_URL}>{PRIMARY_CTA_LABEL}<ArrowRight className="size-4" aria-hidden /></a></Button>
                <Button size="lg" variant="outline" className="px-7" asChild><a href="#how-it-works">See how 360 appraisals work</a></Button>
              </div>
              <p className="mt-5 text-xs leading-relaxed text-muted-foreground">Reusable questions · Personal reviewer links · Combined results</p>
            </div>
            <figure className="min-w-0">
              <div className="relative aspect-[5/4] overflow-hidden rounded-2xl bg-surface-2">
                <Image src="/marketing/team-conversation.jpg" alt="Three colleagues sharing perspectives around a table" fill priority sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
              </div>
              <div className="relative mx-3 -mt-14 rounded-2xl border border-border bg-card p-5 shadow-[0_24px_55px_-40px_rgb(21_38_29_/_0.5)] sm:mx-6 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold">360 feedback summary</p>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary"><CheckCircle2 className="size-3.5" aria-hidden />Closed · 8 reviewers</span>
                </div>
                <dl className="mt-4 space-y-3">
                  {[["Explains priorities clearly", "4.2", 84], ["Follows through on commitments", "4.5", 90], ["Supports colleagues", "4.0", 80]].map(([label, score, width]) => (
                    <div key={label}>
                      <div className="flex justify-between gap-3 text-xs"><dt>{label}</dt><dd className="shrink-0 font-semibold tabular-nums">{score} / 5</dd></div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden><div className="h-full rounded-full bg-primary/65" style={{ width: `${width}%` }} /></div>
                    </div>
                  ))}
                </dl>
                <p className="mt-4 border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">Combined reviewer ratings. Individual identities are not shown.</p>
              </div>
              <figcaption className="mt-4 text-center text-[11px] text-muted-foreground">Illustrative feedback summary · fictional data</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface/50 px-5 py-20 sm:py-24 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div><p className={marketingType.eyebrow}>Beyond the manager’s view</p><h2 className={`mt-4 ${marketingType.h2}`}>Different people see different strengths.</h2></div>
          <div className="space-y-5 leading-relaxed text-muted-foreground">
            <p>A 360 degree appraisal gathers feedback from people who work with someone in different ways. A manager sees progress against expectations. Peers see collaboration. Direct reports experience their leadership and support.</p>
            <p>Also called a 360 review or multi-rater feedback, it helps bring those observations into a development conversation. Use it for leadership development, team relationships or a broader view of how someone works.</p>
            <p>It complements an <TextLink href={ROUTES.employeeAppraisalSoftware}>annual appraisal</TextLink>. An average rating is a starting point for discussion, rather than a verdict on someone’s performance.</p>
            <Link href={ROUTES.feedback360Guide} className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">Read the 360 degree feedback guide <ArrowRight className="size-4" aria-hidden /></Link>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 px-5 py-20 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className={marketingType.eyebrow}>A clear process, start to finish</p>
          <h2 className={`mt-4 max-w-2xl ${marketingType.h2}`}>From a circle of reviewers<br />to a useful conversation.</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(([title, copy], index) => <div key={title} className="border-t border-border pt-5"><span className="text-sm font-semibold text-primary">0{index + 1}</span><h3 className="mt-4 text-base font-semibold">{title}</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{copy}</p></div>)}
          </div>
        </div>
      </section>

      <section className="marketing-contrast px-5 py-20 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className={marketingType.eyebrow}>Make the feedback useful</p>
          <h2 className={`mt-4 max-w-2xl ${marketingType.h2}`}>More than another form to fill in.</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              ["Questions with a purpose", "Save reusable rating and written questions. Ask about observable behaviour so reviewers can give specific, relevant feedback."],
              ["One view of progress", "Keep invitations and completion together in the campaign. See who has responded while individual answers remain hidden until closure."],
              ["Feedback to work with", "Read combined question ratings and anonymous written responses. Use the report to prepare a discussion and agree one or two development actions."],
            ].map(([title, copy]) => <div key={title} className="border-t border-border pt-5"><h3 className="text-xl font-semibold">{title}</h3><p className="mt-3 leading-relaxed text-muted-foreground">{copy}</p></div>)}
          </div>
          <a href={PRIMARY_CTA_URL} className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">{PRIMARY_CTA_LABEL}<ArrowRight className="size-4" aria-hidden /></a>
        </div>
      </section>

      <section id="privacy" className="scroll-mt-24 border-b border-border bg-surface-2/70 px-5 py-20 sm:py-24 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div><ShieldCheck className="mb-5 size-10 text-primary" strokeWidth={1.5} aria-hidden /><p className={marketingType.eyebrow}>Clear privacy expectations</p><h2 className={`mt-4 ${marketingType.h2}`}>Give reviewers clarity before they give feedback.</h2></div>
          <div className="space-y-5 leading-relaxed text-muted-foreground">
            <p>Results unlock after campaign closure and at least five completed reviewer responses. Each displayed question also needs five valid answers; questions below that threshold are suppressed.</p>
            <p>Reviewers form one combined group. Reports show no reviewer names or response times, and do not compare managers, peers and direct reports as separate groups.</p>
            <p>Written comments can still reveal their author through a distinctive situation or phrasing. Explain this before sending invitations, and choose reviewers with recent, relevant experience of the person’s work.</p>
            <p className="text-sm">Ordinary workspace administrators cannot query the private reviewer-to-answer mapping. Trusted platform and database operators can access operational records. Shared invitation links and outside knowledge can also affect anonymity.</p>
          </div>
        </div>
      </section>

      <PricingPreview />
      <RelatedLinks title="Prepare your first 360 appraisal" links={[
        { href: ROUTES.feedback360Questions, label: "360 feedback questions", copy: "Choose prompts about behaviours reviewers can observe." },
        { href: ROUTES.feedback360Examples, label: "360 feedback examples", copy: "See how to write specific comments and discuss feedback." },
        { href: ROUTES.feedback360Template, label: "360 feedback template", copy: "Copy or print a form to plan your appraisal." },
      ]} />
      <FaqSection items={[
        { question: "What is a 360 appraisal?", answer: "A 360 appraisal collects observations from several people who work with the subject, such as managers, peers and direct reports. It gives a broader starting point for discussing strengths and development needs." },
        { question: "Is a 360 appraisal the same as 360 degree feedback?", answer: "The terms are often used for the same multi-rater process. Be clear about the purpose of your exercise: development feedback and a formal assessment of performance can have different implications for reviewers." },
        { question: "How many reviewers do we need?", answer: "At least five reviewers must complete their responses before results can be released. Invite a relevant cohort with room for non-completion. Each displayed question must also have at least five valid answers." },
        { question: "Are 360 appraisal responses anonymous?", answer: <>Reports combine reviewer responses without names or response times. Comments can still identify their author. Read the <TextLink href="#privacy">privacy safeguards</TextLink> before explaining anonymity to reviewers.</> },
        { question: "Can we choose our own questions?", answer: <>Yes. Use reusable templates with rating and written questions. Our <TextLink href={ROUTES.feedback360Questions}>360 question bank</TextLink> can help you choose practical prompts.</> },
        { question: "Can we run annual appraisals in the same workspace?", answer: "Yes. Annual appraisals use identified employee and manager responses. The 360 workflow collects anonymous multi-rater feedback. Both are available in the same workspace, with capacity determined by your plan." },
      ]} />
      <CtaBand title="Start with a fuller picture." copy="Bring the right reviewers together and make your next 360 appraisal a useful development conversation." secondaryHref={ROUTES.pricing} secondaryLabel="See plans and pricing" />
    </SiteChrome>
  );
}
