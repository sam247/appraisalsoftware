"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowRight, MessageSquareQuote, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRIMARY_CTA_LABEL, PRIMARY_CTA_URL } from "@/lib/links";
import { ROUTES } from "@/lib/routes";

/**
 * Real customer quotes only — each with the person's permission to publish
 * their name, role and company. While this list is empty the section invites
 * founding teams instead of showing invented reviews.
 */
type Testimonial = { quote: string; name: string; role: string; company: string; image?: string };
const testimonials: Testimonial[] = [];

export function Reviews() {
  return testimonials.length ? <TestimonialCarousel items={testimonials} /> : <FoundingTeams />;
}

function FoundingTeams() {
  const perks = [
    { icon: Users, title: "Talk to the people building it", copy: "Direct access to the team — no ticket queue, no account manager in between." },
    { icon: Sparkles, title: "Shape what comes next", copy: "Your review process and feedback steer the roadmap and the template packs we build." },
    { icon: MessageSquareQuote, title: "Help set the standard", copy: "Tell us what a good appraisal looks like in your organisation, and we'll build it in." },
  ];
  return (
    <section id="founding-teams" className="border-t border-border bg-surface/50 px-5 py-20 sm:py-24 lg:px-8">
      <div className="mx-auto grid max-w-content gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-20">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Founding teams</p>
          <h2 className="mt-4 font-display text-[2rem] font-semibold leading-[1.1] tracking-[-0.035em] sm:text-[2.5rem]">
            Shaped by the HR teams who use it.
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
            We&apos;re inviting a small group of UK organisations to run their review cycles with us as founding teams —
            and to help shape a calmer way to do appraisals.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="px-7" asChild>
              <a href={PRIMARY_CTA_URL}>
                {PRIMARY_CTA_LABEL} <ArrowRight className="size-4" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="px-7" asChild>
              <a href={`${ROUTES.contact}?type=product`}>Tell us about your team</a>
            </Button>
          </div>
        </div>
        <ul className="grid gap-4">
          {perks.map(({ icon: Icon, title, copy }) => (
            <li key={title} className="flex gap-4 rounded-2xl border border-border bg-card p-6">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-primary" aria-hidden>
                <Icon className="size-5" />
              </span>
              <div>
                <p className="font-display text-lg font-semibold tracking-tight text-foreground">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{copy}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function TestimonialCarousel({ items }: { items: Testimonial[] }) {
  const [paused, setPaused] = useState(false);
  return (
    <section id="reviews" className="border-t border-border bg-surface/50 px-5 py-20 sm:py-24 lg:px-8">
      <div className="mx-auto grid max-w-content gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-20">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Customer stories</p>
          <h2 className="mt-4 font-display text-[2rem] font-semibold leading-[1.1] tracking-[-0.035em] sm:text-[2.5rem]">What teams are saying.</h2>
          <button type="button" aria-pressed={paused} onClick={() => setPaused(!paused)} className="mt-5 text-xs font-medium text-primary underline underline-offset-4 motion-reduce:hidden">
            {paused ? "Resume" : "Pause"}
          </button>
        </div>
        <div className="review-window min-w-0 overflow-hidden" aria-label="Customer stories" tabIndex={0}>
          <div className="review-track" style={{ animationPlayState: paused ? "paused" : undefined }}>
            {[0, 1].map((copy) => (
              <div key={copy} className="review-group" aria-hidden={copy === 1}>
                {items.map((t) => (
                  <figure key={t.name} className="review-card flex min-h-72 flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <blockquote className="font-display text-xl font-medium leading-snug tracking-tight text-foreground">“{t.quote}”</blockquote>
                    <figcaption className="mt-auto flex items-center gap-3 pt-7">
                      {t.image ? <Image src={t.image} alt="" width={48} height={48} className="size-12 rounded-full object-cover" /> : null}
                      <div>
                        <p className="text-sm font-semibold text-foreground">{t.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.role}, {t.company}
                        </p>
                      </div>
                    </figcaption>
                  </figure>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
