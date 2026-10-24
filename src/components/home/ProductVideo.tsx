"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowRight, Play } from "lucide-react";
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
          <VideoPlayer />

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

/**
 * Click-to-play: YouTube is only contacted once the visitor presses play, and
 * then through the privacy-enhanced youtube-nocookie.com domain.
 */
function VideoPlayer() {
  const [playing, setPlaying] = useState(false);

  // The poster already carries its own headline, so it is shown uncropped
  // (object-contain on a matching background) with only the play control on top.
  return (
    <div className="relative aspect-video bg-[rgb(250_249_244)]">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${PRODUCT_VIDEO.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
          title={PRODUCT_VIDEO.title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 size-full bg-black"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 size-full"
          aria-label={`Play video: ${PRODUCT_VIDEO.title} (${PRODUCT_VIDEO.durationLabel})`}
        >
          <Image
            src={PRODUCT_VIDEO.poster}
            alt=""
            fill
            sizes="(min-width: 1024px) 65vw, 100vw"
            className="object-contain"
          />
          <span className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/5" aria-hidden />
          <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
            <span className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_12px_30px_-8px_rgb(0_0_0/0.45)] ring-8 ring-primary/15 transition-transform duration-300 group-hover:scale-105 sm:size-20">
              <Play className="ml-1 size-7 fill-current sm:size-8" />
            </span>
          </span>
          <span className="absolute bottom-4 left-4 rounded-full bg-black/75 px-3 py-1 text-xs font-medium text-white sm:bottom-5 sm:left-5">
            {PRODUCT_VIDEO.durationLabel}
          </span>
        </button>
      )}
    </div>
  );
}
