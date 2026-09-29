import { ArrowRight } from "lucide-react";
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
        <div className="grid items-center gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:gap-12">
          {/* Left — copy + CTA */}
          <div className="reveal max-w-xl">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">For UK teams that want a clearer review process</p>
            <h1 className={marketingType.h1Home}>
              Appraisal software without the <span className="marketing-editorial text-primary">heavyweight HR system.</span>
            </h1>
            <p className={`mt-5 ${marketingType.lead}`}>
              Run employee appraisals and anonymous 360 feedback in one place —
              with free templates and practical guidance when you need them.
              Built for UK small teams that need a repeatable process, not a
              wider HR platform.
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
          </div>

          <div className="flex items-center justify-center">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-surface-2 shadow-[0_24px_55px_-40px_rgb(21_38_29_/_0.5)] sm:aspect-[3/2] lg:aspect-[6/5] lg:w-4/5">
              <Image
                src="/marketing/one-to-one.jpg"
                alt="Two colleagues talking through a review in a naturally lit workspace"
                fill
                priority
                sizes="(min-width: 1024px) 34vw, (min-width: 640px) 90vw, 100vw"
                className="object-cover object-center"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
