import Link from "next/link";
import { ArrowRight, Check, ListChecks } from "lucide-react";
import { formatPackPrice, packBySlug, type TemplatePack } from "@/lib/marketplace";
import { ROUTES } from "@/lib/routes";

const anchor = (pack: TemplatePack) => `${ROUTES.marketplace}#${pack.slug}`;

function Arrow({ inverse = false }: { inverse?: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex size-8 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none ${
        inverse ? "bg-white text-primary" : "bg-primary text-primary-foreground"
      }`}
    >
      <ArrowRight className="size-4" />
    </span>
  );
}

/** Compact bento teaser for the template marketplace. */
export function MarketplaceTeaser() {
  const featured = packBySlug("annual-appraisal-pack")!;
  const side = [packBySlug("probation-review-pack")!, packBySlug("leadership-360-pack")!];

  return (
    <section className="border-t border-border bg-surface/50 px-5 py-20 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-content">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Template marketplace</p>
            <h2 className="mt-4 max-w-2xl font-display text-[2rem] font-semibold leading-[1.1] tracking-[-0.035em] sm:text-[2.5rem]">
              Start from a proven review pack.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              Ready-to-run question sets for annual reviews, probation and 360 feedback. Buy once and launch it as a campaign in a click.
            </p>
          </div>
          <Link href={ROUTES.marketplace} className="group inline-flex shrink-0 items-center gap-3 text-sm font-semibold text-foreground">
            Browse the marketplace <Arrow />
          </Link>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
          <Link
            href={anchor(featured)}
            className="group flex flex-col rounded-[1.75rem] bg-primary p-8 text-white transition-shadow hover:shadow-[0_24px_48px_-28px_var(--primary)] sm:p-10"
          >
            <p className="w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]">Featured pack</p>
            <h3 className="mt-6 font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] sm:text-[2.25rem]">{featured.name}</h3>
            <p className="mt-3 max-w-md text-[0.9375rem] leading-relaxed text-white/85">{featured.summary}</p>
            <ul className="mt-6 space-y-2.5">
              {featured.benefits.map((b) => (
                <li key={b} className="flex gap-2.5 text-[0.9375rem]">
                  <span aria-hidden className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white text-primary">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
            <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-10">
              <p className="text-sm text-white/85">
                <span className="font-display text-2xl font-semibold text-white">{formatPackPrice(featured.price)}</span> one-off · Included with Pro
              </p>
              <span className="inline-flex items-center gap-3 font-semibold">
                See the pack <Arrow inverse />
              </span>
            </div>
          </Link>

          <div className="grid gap-5">
            {side.map((pack) => (
              <Link
                key={pack.slug}
                href={anchor(pack)}
                className="group flex flex-col rounded-[1.75rem] border border-border bg-card p-7 transition-shadow hover:shadow-[0_24px_48px_-32px_rgb(28_24_18/0.4)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{pack.category}</p>
                <h3 className="mt-3 font-display text-xl font-semibold tracking-[-0.025em] text-foreground">{pack.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pack.summary}</p>
                <div className="mt-auto flex items-center justify-between gap-4 pt-6">
                  <p className="inline-flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="font-display text-lg font-semibold text-foreground">{formatPackPrice(pack.price)}</span>
                    <span className="inline-flex items-center gap-1.5">
                      <ListChecks className="size-4" aria-hidden /> {pack.questions.length} questions
                    </span>
                  </p>
                  <Arrow />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
