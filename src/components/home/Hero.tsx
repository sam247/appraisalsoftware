import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  StatusChip,
} from "@/components/product/primitives";
import {
  PRIMARY_CTA_LABEL,
  PRIMARY_CTA_URL,
  SEE_HOW_IT_WORKS_HREF,
  SEE_HOW_IT_WORKS_LABEL,
} from "@/lib/links";
import { marketingType } from "@/lib/marketing-typography";
import CreationLauncher from "@/app/dashboard/home/creation-launcher";
import { ProductFrame } from "@/components/product-marketing/ProductFrame";

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-16 sm:pb-28 sm:pt-24 lg:pt-28">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        {/* Copy block */}
        <div className="reveal mx-auto max-w-[42rem] text-center">
          <h1 className={marketingType.h1Home}>
            Appraisal software without
            <br className="hidden sm:block" />
            {" "}the heavyweight HR system.
          </h1>
          <p className={`mx-auto mt-5 max-w-lg ${marketingType.lead}`}>
            Built for UK small teams that need a repeatable appraisal process, not a wider HR platform. Run employee and manager reviews in one place, with free templates and practical guidance when you need them.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
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

        {/* Real creation launcher — marketing preview of available workflows */}
        <div className="reveal relative mx-auto mt-16 sm:mt-20" style={{ animationDelay: "0.15s" }}>
          <ProductFrame
            title="What would you like to do?"
            description="Start with the review your team needs, then keep current campaigns and templates close at hand."
          >
            <div className="p-4 sm:p-6">
              <CreationLauncher
                interactive={false}
                actions={[
                  {
                    href: "/dashboard/campaigns/new",
                    title: "Annual appraisal",
                    description: "Self and manager review",
                    icon: "annual",
                  },
                  {
                    href: "/dashboard/campaigns/new?type=360",
                    title: "360 feedback",
                    description: "Anonymous multi-reviewer feedback",
                    icon: "feedback",
                  },
                  {
                    href: "/dashboard/templates",
                    title: "Start from a template",
                    description: "Use a reusable question set",
                    icon: "template",
                  },
                ]}
              />
              <div className="mt-5 border-t border-border pt-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-xs font-semibold text-foreground">Your work</p>
                  <span className="text-[10px] text-muted-foreground">Annual Appraisal 2026</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface/60 px-3 py-2.5">
                  <div>
                    <p className="text-xs font-medium text-foreground">2026 Annual Appraisals</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">24 people · 75% complete</p>
                  </div>
                  <StatusChip status="Collecting" />
                </div>
              </div>
            </div>
          </ProductFrame>
        </div>
      </div>
    </section>
  );
}
