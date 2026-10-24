import { ArrowRight, CheckCircle2 } from "lucide-react";
import { VideoPlayer } from "@/components/marketing/VideoPlayer";
import { Button } from "@/components/ui/button";
import { PRIMARY_CTA_LABEL, PRIMARY_CTA_URL } from "@/lib/links";
import { marketingType } from "@/lib/marketing-typography";
import type { ProductVideoConfig } from "@/lib/video";

/**
 * Commercial-page counterpart to the homepage product tour: copy and a short
 * checklist on the left, the video in the offset photo frame on the right.
 */
export function FeatureVideo({
  video,
  eyebrow,
  title,
  copy,
  points,
}: {
  video: ProductVideoConfig;
  eyebrow: string;
  title: string;
  copy: string;
  points: string[];
}) {
  return (
    <section id="video" className="scroll-mt-24 border-t border-border px-5 py-20 sm:py-24 lg:px-8">
      <div className="mx-auto grid max-w-content items-center gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div>
          <p className={marketingType.eyebrow}>{eyebrow}</p>
          <h2 className={`mt-4 ${marketingType.h2}`}>{title}</h2>
          <p className={`mt-5 ${marketingType.body}`}>{copy}</p>
          <ul className="mt-6 space-y-3">
            {points.map((point) => (
              <li key={point} className="flex gap-3 text-sm leading-relaxed text-foreground sm:text-base">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                {point}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Button size="lg" className="px-7" asChild>
              <a href={PRIMARY_CTA_URL}>
                {PRIMARY_CTA_LABEL} <ArrowRight className="size-4" aria-hidden />
              </a>
            </Button>
          </div>
        </div>
        <div className="photo-frame mr-3 mb-3 min-w-0 sm:mr-4 sm:mb-4">
          <div className="overflow-hidden rounded-2xl border border-border shadow-[0_24px_55px_-40px_rgb(21_38_29_/_0.5)]">
            <VideoPlayer video={video} sizes="(min-width: 1088px) 620px, (min-width: 1024px) 57vw, calc(100vw - 52px)" />
          </div>
        </div>
      </div>
    </section>
  );
}
