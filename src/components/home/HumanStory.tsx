import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ROUTES } from "@/lib/routes";

export function HumanStory() {
  return (
    <section className="border-y border-border bg-surface/70 py-16 sm:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16 lg:px-8">
        <figure className="flex min-h-72 flex-col justify-end bg-surface-2 p-6 sm:min-h-96 sm:p-8">
          <figcaption className="max-w-xs border-t border-foreground/20 pt-4 text-xs leading-relaxed text-muted-foreground">
            Photography to source: a candid employee and manager conversation in a naturally lit UK workspace.
          </figcaption>
        </figure>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">The human part</p>
          <h2 className="mt-4 max-w-md font-display text-[2rem] font-semibold leading-[1.1] tracking-[-0.035em] text-foreground sm:text-[2.5rem]">
            Better preparation makes room for a better conversation.
          </h2>
          <p className="mt-6 max-w-md leading-relaxed text-muted-foreground">
            Appraisal Software gives each person time to reflect before the meeting, then keeps both perspectives together when it is time to talk.
          </p>
          <Link href={ROUTES.howItWorks} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            See how it works <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
