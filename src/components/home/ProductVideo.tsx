import { ArrowRight } from "lucide-react";
import { VideoPlayer } from "@/components/marketing/VideoPlayer";
import { Button } from "@/components/ui/button";
import { PRIMARY_CTA_LABEL, PRIMARY_CTA_URL } from "@/lib/links";
import { PRODUCT_VIDEO } from "@/lib/video";

const tourSteps = ["Ready-made templates", "Questions", "People", "Launch", "Response tracking"];

export function ProductVideo() {
  return (
    <section id="product-tour" className="border-t border-border px-5 py-20 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Product tour</p>
          <h2 className="mt-4 font-display text-[2rem] font-semibold leading-[1.1] tracking-[-0.035em] text-foreground sm:text-[2.5rem]">
            Meet Appraisal Software.
          </h2>
        </div>

        <div className="mt-12 grid overflow-hidden rounded-3xl border border-border bg-card shadow-[0_24px_60px_-32px_rgb(0_0_0/0.25)] lg:grid-cols-[1.9fr_1fr]">
          <VideoPlayer video={PRODUCT_VIDEO} sizes="(min-width: 1024px) 65vw, 100vw" />

          <div className="flex flex-col border-t border-border p-7 sm:p-8 lg:border-t-0 lg:border-l">
            <h3 className="font-display text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.03em] text-foreground">
              See how it works.
            </h3>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              From your first campaign to meaningful feedback, all in one place.
            </p>

            <div className="my-6 h-px bg-border" />

            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Inside the tour</p>
            <ol className="mt-4 space-y-2.5">
              {tourSteps.map((step, index) => (
                <li key={step} className="flex items-center gap-3 text-foreground">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-primary">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>

            <div className="mt-7 lg:mt-auto lg:pt-7">
              <Button size="lg" className="w-full px-7 sm:w-auto" asChild>
                <a href={PRIMARY_CTA_URL}>
                  {PRIMARY_CTA_LABEL} <ArrowRight className="size-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

