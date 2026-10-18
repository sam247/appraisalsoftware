"use client";

import FormSubmit from "@/app/dashboard/form-submit";
import { Button } from "@/components/ui/button";
import { usePack } from "@/app/dashboard/marketplace/actions";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Check, ClipboardList, FileStack, Lock, UserRoundCheck, UsersRound } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export type CycleKind = "annual" | "probation" | "feedback_360";

export interface WelcomeTemplate {
  /** Workspace template id, or a marketplace pack slug (prefixed "pack:"). */
  key: string;
  name: string;
  questions: number;
  kind: CycleKind;
  source: "workspace" | "pack";
}

const KINDS: Array<{ id: CycleKind; title: string; copy: string; icon: typeof ClipboardList }> = [
  { id: "annual", title: "Annual appraisal", copy: "Employees reflect, managers review, you compare both views.", icon: ClipboardList },
  { id: "probation", title: "Probation review", copy: "A structured end-of-probation check-in with a clear outcome.", icon: UserRoundCheck },
  { id: "feedback_360", title: "360 feedback", copy: "Anonymous feedback from peers, reports and managers.", icon: UsersRound },
];

/** Where the existing campaign setup takes over. */
function startHref(kind: CycleKind, templateKey: string | null): string {
  if (kind === "feedback_360") return "/dashboard/campaigns/new?type=360";
  return templateKey ? `/dashboard/campaigns/new?template=${templateKey}` : "/dashboard/campaigns/new";
}

export default function WelcomeFlow({
  firstName,
  can360,
  peopleCount,
  templates,
}: {
  firstName: string | null;
  can360: boolean;
  peopleCount: number;
  templates: WelcomeTemplate[];
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [kind, setKind] = useState<CycleKind | null>(null);
  const [templateKey, setTemplateKey] = useState<string | null>(null);
  const options = templates.filter((t) => t.kind === kind);
  const chosen = options.find((t) => t.key === templateKey) ?? null;

  const steps = ["What you're running", "Starting point", "Your people"];

  return (
    <section aria-labelledby="welcome-title" className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border bg-surface/60 px-5 py-5 sm:px-7">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Welcome{firstName ? `, ${firstName}` : ""}</p>
        <h2 id="welcome-title" className="mt-2 font-display text-2xl font-semibold tracking-tight">
          Let&apos;s set up your first review cycle.
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Three quick choices, then we&apos;ll open the campaign ready for you to finish and send.</p>
        <ol className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm" aria-label="Progress">
          {steps.map((label, i) => {
            const n = (i + 1) as 1 | 2 | 3;
            const done = step > n;
            return (
              <li key={label} className="flex items-center gap-2" aria-current={step === n ? "step" : undefined}>
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                    done ? "bg-primary text-primary-foreground" : step === n ? "border-2 border-primary text-primary" : "border border-border text-muted-foreground",
                  )}
                >
                  {done ? <Check className="size-3.5" strokeWidth={3} aria-hidden /> : n}
                </span>
                <span className={step === n ? "font-medium text-foreground" : "text-muted-foreground"}>{label}</span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="px-5 py-6 sm:px-7">
        {step === 1 && (
          <div role="radiogroup" aria-label="What are you running first?" className="grid gap-3 md:grid-cols-3">
            {KINDS.map(({ id, title, copy, icon: Icon }) => {
              const locked = id === "feedback_360" && !can360;
              const selected = kind === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={locked}
                  onClick={() => {
                    setKind(id);
                    setTemplateKey(null);
                  }}
                  className={cn(
                    "flex h-full flex-col rounded-xl border p-4 text-left transition-colors",
                    selected ? "border-primary bg-accent" : "border-border hover:border-primary/50",
                    locked && "cursor-not-allowed opacity-60 hover:border-border",
                  )}
                >
                  <span className="flex items-center justify-between">
                    <Icon className="size-5 text-primary" aria-hidden />
                    {locked ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted-foreground">
                        <Lock className="size-3" aria-hidden /> Pro
                      </span>
                    ) : selected ? (
                      <Check className="size-4 text-primary" aria-hidden />
                    ) : null}
                  </span>
                  <span className="mt-3 font-medium text-foreground">{title}</span>
                  <span className="mt-1 text-sm leading-relaxed text-muted-foreground">{copy}</span>
                </button>
              );
            })}
          </div>
        )}

        {step === 2 && kind && (
          <div>
            <p className="text-sm text-muted-foreground">Pick a ready-made form — you can edit every question later.</p>
            <div role="radiogroup" aria-label="Starting point" className="mt-4 grid gap-3 md:grid-cols-2">
              {options.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  role="radio"
                  aria-checked={templateKey === t.key}
                  onClick={() => setTemplateKey(t.key)}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                    templateKey === t.key ? "border-primary bg-accent" : "border-border hover:border-primary/50",
                  )}
                >
                  <FileStack className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                  <span>
                    <span className="block font-medium text-foreground">{t.name}</span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">
                      {t.questions} questions{t.source === "pack" ? " · from the marketplace" : ""}
                    </span>
                  </span>
                </button>
              ))}
              <button
                type="button"
                role="radio"
                aria-checked={templateKey === null}
                onClick={() => setTemplateKey(null)}
                className={cn(
                  "flex items-start gap-3 rounded-xl border border-dashed p-4 text-left transition-colors",
                  templateKey === null ? "border-primary bg-accent" : "border-border-strong hover:border-primary/50",
                )}
              >
                <span className="mt-0.5 size-5 shrink-0 rounded-full border-2 border-muted-foreground/40" aria-hidden />
                <span>
                  <span className="block font-medium text-foreground">Choose later</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">Pick or build the form in the campaign setup.</span>
                </span>
              </button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Want more choice?{" "}
              <Link href="/dashboard/marketplace" className="font-medium text-primary hover:underline">
                Browse the template marketplace
              </Link>
            </p>
          </div>
        )}

        {step === 3 && kind && (
          <div className="max-w-2xl">
            {peopleCount > 0 ? (
              <p className="flex items-center gap-2 text-sm text-foreground">
                <Check className="size-4 text-primary" aria-hidden />
                {peopleCount} {peopleCount === 1 ? "person is" : "people are"} ready in your workspace. You&apos;ll choose who&apos;s included in the next screen.
              </p>
            ) : (
              <>
                <p className="text-sm text-foreground">Add the people you&apos;ll review. A spreadsheet works — we&apos;ll match managers for you.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild variant="outline">
                    <Link href="/dashboard/people">Add people</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/dashboard/people/import?returnTo=/dashboard">Import a CSV</Link>
                  </Button>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">You can also add people while setting up the campaign.</p>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4 sm:px-7">
        {step > 1 ? (
          <Button type="button" variant="ghost" onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}>
            <ArrowLeft aria-hidden /> Back
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">Prefer to explore first? Everything is in the menu on the left.</span>
        )}
        {step < 3 ? (
          <Button type="button" disabled={!kind} onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}>
            Continue <ArrowRight aria-hidden />
          </Button>
        ) : chosen?.source === "pack" ? (
          // Installs the pack once, then opens the campaign draft with it attached.
          <form action={usePack}>
            <input type="hidden" name="pack" value={chosen.key.slice("pack:".length)} />
            <FormSubmit pendingLabel="Setting up…">
              Create my campaign <ArrowRight aria-hidden />
            </FormSubmit>
          </form>
        ) : (
          <Button asChild>
            <Link href={startHref(kind!, chosen?.key ?? null)}>
              Create my campaign <ArrowRight aria-hidden />
            </Link>
          </Button>
        )}
      </div>
    </section>
  );
}
