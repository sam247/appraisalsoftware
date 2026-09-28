import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardCheck, ListChecks, UsersRound } from "lucide-react";

import { SiteChrome } from "@/components/layout/SiteChrome";
import { Button } from "@/components/ui/button";
import { CONTACT_URL, PRIMARY_CTA_URL } from "@/lib/links";
import { pageMetadata } from "@/lib/metadata";
import { paidPlans } from "@/lib/pricing";
import { ROUTES } from "@/lib/routes";

export const metadata = pageMetadata({
  title: "Pricing | Appraisal Software",
  description: "Start with a free appraisal workspace. Compare Pro at £39.99 and Organisation at £89.99 per workspace per month, plus VAT. Paid plans are activated with our team.",
  path: ROUTES.pricing,
});

export default function PricingPage() {
  return (
    <SiteChrome>
      <section className="border-b border-border px-5 pb-20 pt-16 sm:pt-24 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
            <Link href={ROUTES.home} className="hover:text-primary">Home</Link> <span aria-hidden>/</span> <span className="text-foreground">Pricing</span>
          </nav>
          <p className="mt-10 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Straightforward starting points</p>
          <h1 className="mt-4 max-w-3xl font-display text-[2.75rem] font-semibold leading-[1.06] tracking-[-0.045em] text-foreground sm:text-[4rem]">
            A plan for <span className="marketing-editorial text-primary">your next review cycle.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Begin with a free workspace. When you need more capacity, talk to us about the paid plan that fits your team. We confirm the details before you commit.
          </p>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            <article className="marketing-card flex flex-col rounded-2xl border border-border bg-card p-7">
              <h2 className="text-sm font-semibold text-primary">Free workspace</h2>
              <p className="mt-4 text-3xl font-semibold tracking-tight">£0</p>
              <p className="mt-2 text-sm text-muted-foreground">Start without a payment card.</p>
              <p className="mt-6 text-[15px] leading-relaxed text-foreground">A place to set up your appraisal process and explore the workspace.</p>
              <ul className="mt-7 space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />Create your workspace online</li>
                <li className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />No timed trial to manage</li>
              </ul>
              <Button size="lg" className="mt-10 w-full lg:mt-auto" asChild>
                <a href={PRIMARY_CTA_URL}>Create a free workspace <ArrowRight className="size-4" aria-hidden /></a>
              </Button>
            </article>
            {paidPlans.map((plan) => (
              <article key={plan.name} className="marketing-card flex flex-col rounded-2xl border border-border bg-card p-7">
                <h2 className="text-sm font-semibold text-primary">{plan.name}</h2>
                <p className="mt-4 text-3xl font-semibold tracking-tight">{plan.price}<span className="ml-1 text-sm font-normal text-muted-foreground">/month</span></p>
                <p className="mt-2 text-sm text-muted-foreground">per workspace + VAT</p>
                <p className="mt-6 text-[15px] leading-relaxed text-foreground">{plan.audience}</p>
                <p className="mt-7 text-sm leading-relaxed text-muted-foreground">{plan.detail}</p>
                <p className="mt-4 text-xs text-muted-foreground">Plan capacity and activation are confirmed with our team.</p>
                <Button size="lg" variant="outline" className="mt-10 w-full lg:mt-auto" asChild>
                  <a href={CONTACT_URL}>Talk to us about {plan.name} <ArrowRight className="size-4" aria-hidden /></a>
                </Button>
              </article>
            ))}
          </div>
          <p className="mt-5 text-xs text-muted-foreground">The Disclosurely team behind Appraisal Software handles paid-plan enquiries.</p>
        </div>
      </section>

      <section className="border-b border-border px-5 py-16 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">The work stays focused</p>
          <h2 className="mt-4 max-w-2xl font-display text-3xl font-semibold tracking-tight">Built around useful review conversations.</h2>
          <div className="mt-9 grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-6"><ClipboardCheck className="size-6 text-primary" aria-hidden /><h3 className="mt-5 font-semibold">Annual appraisals</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Collect employee and manager perspectives in a repeatable review process.</p><Link href={ROUTES.annualAppraisalSoftware} className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">Explore appraisals <ArrowRight className="size-4" aria-hidden /></Link></div>
            <div className="rounded-2xl border border-border bg-card p-6"><UsersRound className="size-6 text-primary" aria-hidden /><h3 className="mt-5 font-semibold">Anonymous 360</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Bring several perspectives together, with results held until closure and five responses.</p><Link href={ROUTES.feedback360Software} className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">Explore 360 feedback <ArrowRight className="size-4" aria-hidden /></Link></div>
            <div className="rounded-2xl border border-border bg-card p-6"><ListChecks className="size-6 text-primary" aria-hidden /><h3 className="mt-5 font-semibold">Reusable questions</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Keep the prompts consistent from one review cycle to the next.</p><Link href={ROUTES.howItWorks} className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">See how it works <ArrowRight className="size-4" aria-hidden /></Link></div>
          </div>
        </div>
      </section>

      <section className="bg-surface/60 px-5 py-16 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Before you choose</p>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight">The useful details, up front.</h2>
          </div>
          <dl className="divide-y divide-border border-t border-border text-sm">
            <div className="py-5"><dt className="font-semibold">Is there a timed free trial?</dt><dd className="mt-2 leading-relaxed text-muted-foreground">No. You can create a free workspace; it is not a time-limited trial.</dd></div>
            <div className="py-5"><dt className="font-semibold">Can I buy a paid plan online?</dt><dd className="mt-2 leading-relaxed text-muted-foreground">Paid plans are activated by our team. Contact us and we will confirm the right capacity, terms and next step.</dd></div>
            <div className="py-5"><dt className="font-semibold">Do the paid prices include VAT?</dt><dd className="mt-2 leading-relaxed text-muted-foreground">The monthly prices shown are per workspace and exclude VAT.</dd></div>
          </dl>
        </div>
      </section>
    </SiteChrome>
  );
}
