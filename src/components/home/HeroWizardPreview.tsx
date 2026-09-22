"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Avatar, StatusChip } from "@/components/product/primitives";
import { ProductFrame } from "@/components/product-marketing/ProductFrame";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "details", label: "Campaign details" },
  { key: "questions", label: "Questions" },
  { key: "reviewers", label: "Reviewers" },
  { key: "review", label: "Review & send" },
] as const;

const REVIEWERS = [
  { name: "Priya Shah", initials: "PS", relationship: "Manager" },
  { name: "Jordan Lee", initials: "JL", relationship: "Peer" },
  { name: "Sam Okafor", initials: "SO", relationship: "Peer" },
  { name: "Riya Patel", initials: "RP", relationship: "Direct report" },
  { name: "Tom Berg", initials: "TB", relationship: "Direct report" },
];

const STEP_INTERVAL_MS = 3400;

export default function HeroWizardPreview() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) {
      // Land on the final step without animating through the sequence.
      const t = window.setTimeout(() => setStep(STEPS.length - 1), 0);
      return () => window.clearTimeout(t);
    }
    const id = window.setInterval(() => {
      setStep((s) => (s + 1) % STEPS.length);
    }, STEP_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <ProductFrame
      eyebrow="Campaign builder"
      title="New 360 feedback"
      className="shadow-[0_28px_70px_-30px_oklch(0.46_0.12_158/0.5)]"
    >
      <div className="p-5 sm:p-6">
        {/* Progress header */}
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold text-foreground">
            {STEPS[step].label}
          </p>
          <span className="shrink-0 text-[11px] font-medium tabular-nums text-muted-foreground">
            Step {step + 1} of {STEPS.length}
          </span>
        </div>
        <div className="mt-3 flex gap-1.5">
          {STEPS.map((s, i) => (
            <span
              key={s.key}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-700 ease-out",
                i <= step ? "bg-primary" : "bg-border",
              )}
            />
          ))}
        </div>

        {/* Step content */}
        <div
          key={step}
          className="mt-5 min-h-[15.5rem] [animation:fade-in_0.5s_ease]"
        >
          {step === 0 && <DetailsStep />}
          {step === 1 && <QuestionsStep />}
          {step === 2 && <ReviewersStep />}
          {step === 3 && <ReviewStep />}
        </div>
      </div>
    </ProductFrame>
  );
}

function FieldPill({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-foreground">{label}</span>
      <span className="mt-1.5 flex h-10 items-center rounded-lg border border-input bg-surface/50 px-3.5 text-[13px] text-foreground">
        {value}
      </span>
    </label>
  );
}

function DetailsStep() {
  return (
    <div className="space-y-3.5">
      <FieldPill label="Campaign name" value="Leadership 360 — Alex Morgan" />
      <FieldPill label="Person receiving feedback" value="Alex Morgan" />
    </div>
  );
}

function QuestionsStep() {
  return (
    <div className="space-y-2.5">
      {[
        ["Leadership behaviours", "8 questions · rating + text", true],
        ["Collaboration & communication", "6 questions · rating + text", false],
      ].map(([name, meta, selected]) => (
        <div
          key={name as string}
          className={cn(
            "flex items-center justify-between gap-3 rounded-xl border px-4 py-3.5 transition-colors",
            selected
              ? "border-primary/40 bg-accent/50 ring-1 ring-primary/20"
              : "border-border bg-surface/40",
          )}
        >
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-foreground">
              {name}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{meta}</p>
          </div>
          {selected ? (
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="size-3" />
            </span>
          ) : (
            <span className="size-5 shrink-0 rounded-full border border-border" />
          )}
        </div>
      ))}
    </div>
  );
}

function ReviewersStep() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Feedback cohort</p>
        <span className="text-[11px] font-semibold text-primary">
          5 of 5 selected
        </span>
      </div>
      <ul className="mt-2.5 divide-y divide-border/70 rounded-xl border border-border">
        {REVIEWERS.map((r, i) => (
          <li key={r.name} className="flex items-center gap-3 px-3.5 py-2.5">
            <Avatar initials={r.initials} tone={i} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-foreground">
                {r.name}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {r.relationship}
              </p>
            </div>
            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="size-2.5" />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReviewStep() {
  return (
    <div className="space-y-3.5">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border">
        {[
          ["Type", "Anonymous 360"],
          ["Subject", "Alex Morgan"],
          ["Reviewers", "5"],
          ["Close date", "30 Apr 2026"],
        ].map(([label, value]) => (
          <div key={label} className="bg-surface/70 px-3.5 py-3">
            <dt className="text-[11px] text-muted-foreground">{label}</dt>
            <dd className="mt-0.5 truncate text-[13px] font-semibold text-foreground">
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <StatusChip status="Draft" />
          <span className="text-[11px] text-muted-foreground">
            Anonymity policy accepted
          </span>
        </div>
        <span className="inline-flex h-8 items-center rounded-lg bg-primary px-3.5 text-[11px] font-semibold text-primary-foreground">
          Create campaign →
        </span>
      </div>
    </div>
  );
}
