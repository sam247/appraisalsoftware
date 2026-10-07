"use client";

import Image from "next/image";
import { useState } from "react";

const sampleReviews = [
  { quote: "The forms made our check-ins easier to prepare for, and the conversations felt more focused.", name: "Amelia Price", role: "People Manager", image: "/marketing/review-amelia.jpg" },
  { quote: "We finally had one clear place for self-assessments and manager feedback.", name: "Daniel Brooks", role: "Operations Lead", image: "/marketing/review-daniel.jpg" },
  { quote: "Setting up a review cycle felt straightforward, even with several teams involved.", name: "Priya Shah", role: "HR Director", image: "/marketing/review-priya.jpg" },
];

export function Reviews() {
  const [paused, setPaused] = useState(false);
  return (
    <section id="reviews" className="border-t border-border bg-surface/50 px-5 py-20 sm:py-24 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-20">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Customer reviews</p>
          <h2 className="mt-4 font-display text-[2rem] font-semibold leading-[1.1] tracking-[-0.035em] sm:text-[2.5rem]">What teams are saying.</h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">Design preview: the names, portraits and quotes shown here are fictional.</p>
          <button type="button" aria-pressed={paused} onClick={() => setPaused(!paused)} className="mt-5 text-xs font-medium text-primary underline underline-offset-4 motion-reduce:hidden">{paused ? "Resume reviews" : "Pause reviews"}</button>
        </div>
        <div className="review-window min-w-0 overflow-hidden" aria-label="Illustrative customer review cards" tabIndex={0}>
          <div className="review-track" style={{ animationPlayState: paused ? "paused" : undefined }}>
            {[0, 1].map((copy) => (
              <div key={copy} className="review-group" aria-hidden={copy === 1}>
                {sampleReviews.map((review) => (
                  <article key={review.name} className="review-card flex min-h-72 flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Sample review</p>
                    <blockquote className="mt-6 font-display text-xl font-medium leading-snug tracking-tight text-foreground">“{review.quote}”</blockquote>
                    <div className="mt-auto flex items-center gap-3 pt-7">
                      <Image src={review.image} alt="" width={48} height={48} className="size-12 rounded-full object-cover" />
                      <div><p className="text-sm font-semibold text-foreground">{review.name}</p><p className="text-xs text-muted-foreground">{review.role}</p></div>
                    </div>
                  </article>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
