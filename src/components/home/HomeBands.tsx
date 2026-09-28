import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRIMARY_CTA_LABEL, PRIMARY_CTA_URL } from "@/lib/links";
import { ROUTES } from "@/lib/routes";

export function MidPageCta() {
  return (
    <section className="marketing-contrast px-5 py-20 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-6xl">
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
          <Button size="lg" className="shrink-0 px-7" asChild>
            <a href={PRIMARY_CTA_URL}>{PRIMARY_CTA_LABEL}<ArrowRight className="size-4" /></a>
          </Button>
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
        </div>
        <div className="lg:pt-8">
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
            Appraisals contain personal information. We design for clear respondent context and controlled access. Anonymous 360 results are released only after the campaign closes and at least five reviewers have responded.
          </p>
          <Link href={ROUTES.feedback360Software} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            See how 360 privacy works <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
