import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PRIMARY_CTA_LABEL,
  PRIMARY_CTA_URL,
  SEE_HOW_IT_WORKS_HREF,
  SEE_HOW_IT_WORKS_LABEL,
} from "@/lib/links";
import { marketingType } from "@/lib/marketing-typography";
import HeroWizardPreview from "@/components/home/HeroWizardPreview";

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-16 sm:pb-28 sm:pt-20 lg:pt-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left — copy + CTA */}
          <div className="reveal max-w-xl">
            <h1 className={marketingType.h1Home}>
              Appraisal software without the heavyweight HR system.
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

          {/* Right — animated 360 campaign builder preview */}
          <div
            className="reveal relative lg:pl-4"
            style={{ animationDelay: "0.15s" }}
          >
            <HeroWizardPreview />
          </div>
        </div>
      </div>
    </section>
  );
}
