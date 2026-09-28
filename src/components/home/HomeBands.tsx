import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRIMARY_CTA_LABEL, PRIMARY_CTA_URL } from "@/lib/links";
import { paidPlans } from "@/lib/pricing";
import { ROUTES } from "@/lib/routes";

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
            <a href={PRIMARY_CTA_URL} className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">Create your workspace <ArrowRight className="size-4" aria-hidden /></a>
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

export function GdprCommitment() {
  return (
    <section className="border-y border-border bg-surface-2/70 px-5 py-16 sm:py-20 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Our UK GDPR commitment</p>
          <h2 className="mt-4 max-w-md font-display text-[2rem] font-semibold leading-[1.1] tracking-[-0.035em] text-foreground sm:text-[2.5rem]">
            Privacy belongs in the review process.
          </h2>
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
