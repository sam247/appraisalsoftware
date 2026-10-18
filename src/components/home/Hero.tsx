import { ArrowRight, Check } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  PRIMARY_CTA_LABEL,
  PRIMARY_CTA_URL,
  SEE_HOW_IT_WORKS_HREF,
  SEE_HOW_IT_WORKS_LABEL,
} from "@/lib/links";
import { marketingType } from "@/lib/marketing-typography";

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-16 pt-14 sm:pb-24 sm:pt-20 lg:pt-20">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          {/* Left — copy + CTA */}
          <div className="reveal max-w-xl">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">For UK teams that want a clearer review process</p>
            <h1 className={marketingType.h1Home}>
              Appraisal software without the <span className="marketing-editorial text-primary">heavyweight HR system.</span>
            </h1>
            <p className={`mt-5 ${marketingType.lead}`}>
              Run employee appraisals for up to 10 people free, with templates and retained results. No card required. Upgrade when you need more capacity or anonymous 360 feedback.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="w-full px-7 sm:w-auto" asChild>
                <a href={PRIMARY_CTA_URL}>
                  {PRIMARY_CTA_LABEL}
                  <ArrowRight className="size-4" />
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full px-7 sm:w-auto"
                asChild
              >
                <a href={SEE_HOW_IT_WORKS_HREF}>{SEE_HOW_IT_WORKS_LABEL}</a>
              </Button>
            </div>
            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {["Free for up to 10 people", "No card required", "Upgrade or cancel any time"].map((fact) => (
                <li key={fact} className="inline-flex items-center gap-2">
                  <Check className="size-4 text-primary" strokeWidth={2.5} aria-hidden />
                  {fact}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-md py-6 sm:max-w-lg lg:max-w-none lg:py-0">
            {/* Jade panel behind the photo: anchors it in the brand and fills the column. */}
            <div
              aria-hidden
              className="absolute inset-x-6 inset-y-0 translate-x-3 rotate-[4deg] rounded-[2rem] bg-primary sm:inset-x-10 lg:-inset-y-4 lg:inset-x-8 lg:translate-x-8"
            >
              <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(rgb(255_255_255/0.14)_1.2px,transparent_1.2px)] [background-size:18px_18px]" />
            </div>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.75rem] bg-surface-2 shadow-[0_30px_60px_-30px_rgb(21_38_29/0.55)] lg:aspect-[5/6]">
              <Image
                src="/marketing/one-to-one.jpg"
                alt="Two colleagues talking through a review in a naturally lit workspace"
                fill
                priority
                sizes="(min-width: 1024px) 42vw, (min-width: 640px) 512px, 100vw"
                className="object-cover object-center lg:object-[62%_center]"
              />
            </div>

            {/* Floating moments from a real review cycle. */}
            <div className="hero-float absolute -left-3 top-[14%] hidden items-center gap-3 rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-[0_18px_40px_-24px_rgb(21_38_29/0.55)] backdrop-blur sm:flex lg:-left-10">
              <span className="flex size-9 items-center justify-center rounded-full bg-accent text-primary" aria-hidden>
                <Check className="size-4" strokeWidth={3} />
              </span>
              <span>
                <span className="block text-sm font-semibold text-foreground">Self-review submitted</span>
                <span className="block text-xs text-muted-foreground">Ready for Thursday&apos;s one-to-one</span>
              </span>
            </div>
            <div className="hero-float hero-float-delay absolute -right-3 bottom-[12%] hidden w-56 rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-[0_18px_40px_-24px_rgb(21_38_29/0.55)] backdrop-blur sm:block lg:-right-8">
              <p className="text-xs font-medium text-muted-foreground">Communication</p>
              <div className="mt-2 space-y-1.5" aria-hidden>
                {[
                  { label: "Self", value: 4, tone: "bg-foreground/70" },
                  { label: "Manager", value: 5, tone: "bg-primary" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-2 text-xs">
                    <span className="w-14 text-muted-foreground">{row.label}</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                      <span className={`block h-full rounded-full ${row.tone}`} style={{ width: `${row.value * 20}%` }} />
                    </span>
                    <span className="w-3 tabular-nums text-foreground">{row.value}</span>
                  </div>
                ))}
              </div>
              <p className="sr-only">Example rating: Communication, self 4, manager 5.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
