import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { ROUTES } from "@/lib/routes";

export function HumanStory() {
  return (
    <section className="border-y border-border bg-surface/70 py-16 sm:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16 lg:px-8">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src="/marketing/team-conversation.jpg"
            alt="Three colleagues listening and talking together around a table"
            fill
            sizes="(min-width: 1024px) 48vw, 100vw"
            className="object-cover"
          />
        </div>
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
