"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";

/** Bump to show the tour again to everyone after a major navigation change. */
const STORAGE_KEY = "as-tour-v1";
export const START_TOUR_EVENT = "as:start-tour";

type Step = { target?: string; title: string; body: string };

const STEPS: Step[] = [
  {
    title: "Welcome to Appraisal Software",
    body: "A one-minute tour of where everything lives. You can replay it any time from your account menu.",
  },
  { target: "create", title: "Start a review cycle", body: "Create opens a new annual appraisal, probation review or 360 feedback campaign." },
  { target: "/dashboard/campaigns", title: "Campaigns", body: "Track who has responded, send reminders, close the cycle and open the results." },
  { target: "/dashboard/people", title: "People", body: "Your employees and reviewers. Add them one by one or import a spreadsheet — managers are matched for you." },
  { target: "/dashboard/templates", title: "Templates", body: "Reusable question sets. Edit any question so every cycle asks what matters to you." },
  { target: "/dashboard/marketplace", title: "Marketplace", body: "Ready-to-run review packs for annual reviews, probation and leadership 360." },
  { target: "/dashboard/reports", title: "Reports", body: "Insights, charts and side-by-side answers for every closed cycle — with PDF and CSV export." },
  { target: "help", title: "Need a hand?", body: "Questions or feedback reach the team directly. We read everything." },
];

function storedDone(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "done";
  } catch {
    return true; // storage blocked: never nag
  }
}

function findTarget(target?: string): HTMLElement | null {
  if (!target) return null;
  const el = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 ? el : null;
}

export default function ProductTour() {
  const pathname = usePathname();
  const [index, setIndex] = useState<number | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const finish = useCallback(() => {
    setIndex(null);
    try {
      window.localStorage.setItem(STORAGE_KEY, "done");
    } catch {
      /* ignore */
    }
  }, []);

  // First visit to the dashboard home starts the tour once.
  useEffect(() => {
    if (pathname !== "/dashboard" || storedDone()) return;
    const timer = window.setTimeout(() => setIndex(0), 700);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  // "Take the tour" from the account menu.
  useEffect(() => {
    const start = () => setIndex(0);
    window.addEventListener(START_TOUR_EVENT, start);
    return () => window.removeEventListener(START_TOUR_EVENT, start);
  }, []);

  const step = index === null ? null : STEPS[index];

  // Skip steps whose target isn't on screen (e.g. the sidebar on phones keeps
  // the step, but shows it as a centred card).
  useLayoutEffect(() => {
    if (index === null || !step) return;
    const measure = () => setRect(findTarget(step.target)?.getBoundingClientRect() ?? null);
    measure();
    findTarget(step.target)?.scrollIntoView({ block: "nearest" });
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [index, step]);

  useEffect(() => {
    if (index !== null) cardRef.current?.focus();
  }, [index]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      else if (e.key === "ArrowRight") setIndex((i) => (i !== null && i < STEPS.length - 1 ? i + 1 : i));
      else if (e.key === "ArrowLeft") setIndex((i) => (i !== null && i > 0 ? i - 1 : i));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, finish]);

  if (index === null || !step) return null;

  const last = index === STEPS.length - 1;
  const pad = 6;
  // Card sits beside the highlighted item when there is room, else centred.
  const beside = rect && window.innerWidth >= 768;
  const cardStyle: React.CSSProperties = beside
    ? {
        position: "fixed",
        left: Math.min(rect.right + 18, window.innerWidth - 340),
        top: Math.max(16, Math.min(rect.top + rect.height / 2 - 90, window.innerHeight - 220)),
      }
    : { position: "fixed", left: "50%", bottom: 24, transform: "translateX(-50%)" };

  return (
    <div className="fixed inset-0 z-[70]" role="presentation">
      {rect ? (
        <div
          aria-hidden
          className="pointer-events-none fixed rounded-lg ring-2 ring-primary"
          style={{
            left: rect.left - pad,
            top: rect.top - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            boxShadow: "0 0 0 9999px rgb(18 24 20 / 0.45)",
          }}
        />
      ) : (
        <div aria-hidden className="fixed inset-0 bg-[rgb(18_24_20/0.45)]" />
      )}
      {/* Clicking the backdrop dismisses, like Esc. */}
      <button type="button" aria-label="Close tour" className="fixed inset-0 cursor-default" onClick={finish} />

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={cardStyle}
        className="w-[min(320px,calc(100vw-32px))] rounded-xl border border-border bg-card p-5 shadow-[0_24px_60px_-24px_rgb(15_35_26/0.55)] outline-none animate-[reveal-up_220ms_ease-out] motion-reduce:animate-none"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium text-muted-foreground">
            {index + 1} of {STEPS.length}
          </p>
          <button type="button" onClick={finish} aria-label="Close tour" className="-mr-1 -mt-1 rounded-md p-1 text-muted-foreground hover:bg-surface hover:text-foreground">
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <h2 id={titleId} className="mt-1 font-display text-lg font-semibold tracking-tight">
          {step.title}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
        <div className="mt-5 flex items-center justify-between gap-2">
          <div className="flex gap-1" aria-hidden>
            {STEPS.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === index ? "w-4 bg-primary" : "w-1.5 bg-border-strong"}`} />
            ))}
          </div>
          <div className="flex gap-2">
            {index === 0 ? (
              <Button type="button" variant="ghost" size="sm" onClick={finish}>
                Skip
              </Button>
            ) : (
              <Button type="button" variant="ghost" size="sm" onClick={() => setIndex(index - 1)}>
                Back
              </Button>
            )}
            <Button type="button" size="sm" onClick={() => (last ? finish() : setIndex(index + 1))}>
              {index === 0 ? "Show me" : last ? "Done" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
