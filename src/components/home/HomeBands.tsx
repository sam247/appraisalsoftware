import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRIMARY_CTA_LABEL, PRIMARY_CTA_URL } from "@/lib/links";
import { paidPlans } from "@/lib/pricing";
import { ROUTES } from "@/lib/routes";

const reviewSteps = [
  { title: "Build your form", copy: "Choose the questions employees and managers will answer." },
  { title: "Assign people", copy: "Set up each employee's self-assessment and manager response." },
  { title: "Collect responses", copy: "Send invitations and see who has completed their part." },
  { title: "Have the conversation", copy: "Compare both perspectives and agree the next steps together." },
];

const sampleReviews = [
  {
    quote: "The forms made our check-ins easier to prepare for, and the conversations felt more focused.",
    name: "Amelia Price",
    role: "People Manager",
    image: "/marketing/review-amelia.jpg",
  },
  {
    quote: "We finally had one clear place for self-assessments and manager feedback.",
    name: "Daniel Brooks",
    role: "Operations Lead",
    image: "/marketing/review-daniel.jpg",
  },
  {
    quote: "Setting up a review cycle felt straightforward, even with several teams involved.",
    name: "Priya Shah",
    role: "HR Director",
    image: "/marketing/review-priya.jpg",
  },
];

export function ProcessOverview() {
  return (
    <section className="border-t border-border px-5 py-20 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">How it works</p>
        <h2 className="mt-4 max-w-2xl font-display text-[2rem] font-semibold leading-[1.1] tracking-[-0.035em] sm:text-[2.5rem]">From questions to a useful conversation.</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {reviewSteps.map((step, index) => (
            <div key={step.title} className="border-t border-border pt-5">
              <span className="text-sm font-semibold text-primary">0{index + 1}</span>
              <h3 className="mt-4 text-base font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.copy}</p>
            </div>
          ))}
        </div>
        <Link href={ROUTES.howItWorks} className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
          See the full process <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}

export function MidPageCta() {
  return (
    <section className="marketing-contrast px-5 py-20 sm:py-28 lg:px-8">
      <div className="reveal mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">A focused way forward</p>
        <div className="mt-5 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="max-w-3xl font-display text-[2.25rem] font-semibold leading-[1.08] tracking-[-0.04em] text-foreground sm:text-[3.25rem]">
              Make more room for the conversation, less for the admin.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
              Bring the form, the people and the finished review together in one clear process.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:items-center">
            <Button size="lg" className="px-7" asChild>
              <a href={PRIMARY_CTA_URL}>{PRIMARY_CTA_LABEL}<ArrowRight className="size-4" /></a>
            </Button>
            <Link href={ROUTES.pricing} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/35 px-6 text-sm font-medium text-foreground transition-colors hover:border-white hover:bg-white/10">
              See plans <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PricingPreview() {
  return (
    <section className="px-5 py-20 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">A clear way to start</p>
            <h2 className="mt-4 max-w-2xl font-display text-[2rem] font-semibold leading-[1.1] tracking-[-0.035em] sm:text-[2.5rem]">Start free. See what comes next.</h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">Create a workspace now, or compare paid plans for teams ready to grow their review process.</p>
          </div>
          <Link href={ROUTES.pricing} className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-primary hover:underline">Compare all plans <ArrowRight className="size-4" aria-hidden /></Link>
        </div>
        <div className="mt-9 grid gap-4 md:grid-cols-3">
          <div className="marketing-card rounded-2xl border border-border bg-card p-6">
            <p className="text-sm font-semibold">Free workspace</p>
            <p className="mt-5 text-3xl font-semibold tracking-tight">£0</p>
            <p className="mt-2 text-sm text-muted-foreground">A place to get started.</p>
            <a href={PRIMARY_CTA_URL} className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">{PRIMARY_CTA_LABEL} <ArrowRight className="size-4" aria-hidden /></a>
          </div>
          {paidPlans.map((plan) => (
            <div key={plan.name} className="marketing-card rounded-2xl border border-border bg-card p-6">
              <p className="text-sm font-semibold">{plan.name}</p>
              <p className="mt-5 text-3xl font-semibold tracking-tight">{plan.price}<span className="ml-1 text-sm font-normal text-muted-foreground">/month</span></p>
              <p className="mt-2 text-sm text-muted-foreground">per workspace + VAT</p>
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{plan.audience}</p>
              <Link href={ROUTES.pricing} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">See plan details <ArrowRight className="size-4" aria-hidden /></Link>
            </div>
          ))}
        </div>
        <p className="mt-5 text-xs text-muted-foreground">Paid plans are activated with our team. We confirm the details before you commit.</p>
      </div>
    </section>
  );
}

export function ReviewsPlaceholder() {
  return (
    <section className="border-t border-border bg-surface/50 px-5 py-20 sm:py-24 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-20">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Customer reviews</p>
          <h2 className="mt-4 font-display text-[2rem] font-semibold leading-[1.1] tracking-[-0.035em] sm:text-[2.5rem]">What teams are saying.</h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">Design preview: the names, portraits and quotes shown here are fictional.</p>
        </div>
        <div className="review-window min-w-0 overflow-hidden" aria-label="Illustrative customer review cards">
          <div className="review-track">
            {[0, 1].map((copy) => (
              <div key={copy} className="review-group" aria-hidden={copy === 1}>
                {sampleReviews.map((review) => (
                  <article key={review.name} className="review-card flex min-h-72 flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Sample review</p>
                    <blockquote className="mt-6 font-display text-xl font-medium leading-snug tracking-tight text-foreground">“{review.quote}”</blockquote>
                    <div className="mt-auto flex items-center gap-3 pt-7">
                      <Image src={review.image} alt="" width={48} height={48} className="size-12 rounded-full object-cover" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{review.name}</p>
                        <p className="text-xs text-muted-foreground">{review.role}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function GdprCommitment() {
  return (
    <section className="border-y border-border bg-surface-2/70 px-5 py-16 sm:py-20 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Our UK GDPR commitment</p>
          <h2 className="mt-4 max-w-md font-display text-[2rem] font-semibold leading-[1.1] tracking-[-0.035em] text-foreground sm:text-[2.5rem]">
            Privacy belongs in the review process.
          </h2>
          <div className="mt-8 inline-flex items-center gap-4 rounded-2xl border border-primary/20 bg-card px-6 py-5 shadow-sm" aria-label="UK GDPR privacy commitment">
            <ShieldCheck className="size-16 text-primary" strokeWidth={1.5} aria-hidden="true" />
            <span className="font-display text-2xl font-semibold tracking-tight text-foreground">UK GDPR</span>
          </div>
        </div>
        <div className="lg:pt-8">
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
            Appraisals contain personal information. We design for clear respondent context and controlled access. Anonymous 360 results are released only after the campaign closes and at least five reviewers have responded.
          </p>
          <Link href={`${ROUTES.feedback360Software}#privacy`} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            Read our 360 privacy safeguards <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
