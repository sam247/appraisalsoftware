"use client";

import {
  OrgIdentityHeader,
  PlatformFooter,
} from "@/components/branding/org-identity";
import { Button } from "@/components/ui/button";
import { accentForWhiteText, normalizeBrandColor } from "@/lib/branding";
import type { CampaignQuestion } from "@/lib/types/database";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
  type ReactNode,
} from "react";

export interface Answer {
  campaign_question_id: string;
  numeric_value?: number | null;
  text_value?: string | null;
  choice_values?: unknown[];
}

interface RespondFormProps {
  token: string;
  campaignName: string;
  questions: CampaignQuestion[];
  relationship: string | null;
  alreadySubmitted: boolean;
  orgName?: string | null;
  orgLogoUrl?: string | null;
  orgBrandColor?: string | null;
  initialAnswers: Answer[];
  anonymous?: boolean;
  subjectName?: string;
  preview?: boolean;
  compact?: boolean;
  previewQuestionIndex?: number;
}

type Phase = "cover" | "questions" | "review" | "complete";
type SaveState = "idle" | "saving" | "saved" | "error";

/** Typing pauses this long before progress is saved. */
const TEXT_SAVE_DELAY_MS = 900;

function isAnswered(answer: Answer | undefined): boolean {
  if (!answer) return false;
  if (answer.numeric_value !== undefined && answer.numeric_value !== null)
    return true;
  if (answer.text_value && answer.text_value.trim()) return true;
  if (answer.choice_values && (answer.choice_values as unknown[]).length > 0)
    return true;
  return false;
}

function firstUnansweredIndex(
  questions: CampaignQuestion[],
  answers: Record<string, Answer>,
): number {
  const idx = questions.findIndex((q) => !isAnswered(answers[q.id]));
  return idx === -1 ? Math.max(0, questions.length - 1) : idx;
}

function estimateMinutes(questionCount: number): number {
  return Math.max(1, Math.ceil(questionCount * 0.5));
}

function scaleOf(question: CampaignQuestion) {
  const scale = (question.scale ?? {}) as {
    min?: number;
    max?: number;
    min_label?: string;
    max_label?: string;
  };
  const isNps = question.type === "nps";
  return {
    min: scale.min ?? (isNps ? 0 : 1),
    max: scale.max ?? (isNps ? 10 : 5),
    minLabel: scale.min_label,
    maxLabel: scale.max_label,
  };
}

export function formatAnswer(
  question: CampaignQuestion,
  answer: Answer | undefined,
): string | null {
  if (!isAnswered(answer) || !answer) return null;
  if (question.type === "rating" || question.type === "nps") {
    const { max } = scaleOf(question);
    return `${answer.numeric_value} out of ${max}`;
  }
  if (question.type === "text") return answer.text_value?.trim() ?? null;
  return ((answer.choice_values as string[]) ?? []).join(", ");
}

/**
 * Respondent pages wear the organisation's colour: re-pointing the theme
 * tokens here re-skins buttons, selections, focus rings and progress together.
 */
function brandTokens(orgBrandColor: string | null | undefined): CSSProperties {
  if (!normalizeBrandColor(orgBrandColor)) return {};
  const accent = accentForWhiteText(orgBrandColor);
  return {
    ["--primary" as string]: accent,
    ["--primary-hover" as string]: `color-mix(in oklab, ${accent} 86%, black)`,
    ["--primary-foreground" as string]: "#ffffff",
    ["--ring" as string]: accent,
    ["--accent" as string]: `color-mix(in oklab, ${accent} 9%, white)`,
    ["--accent-foreground" as string]: `color-mix(in oklab, ${accent} 70%, black)`,
  };
}

function coverCopy({
  anonymous,
  relationship,
  subjectName,
  orgName,
  campaignName,
}: {
  anonymous: boolean;
  relationship: string | null;
  subjectName?: string;
  orgName?: string | null;
  campaignName: string;
}): { title: string; description: string; purpose: string; cta: string } {
  const subject = subjectName?.trim() || "your colleague";
  const org = orgName?.trim() || "your organisation";

  if (anonymous) {
    return {
      title: `360 feedback for ${subject}`,
      description: `You've been invited to share honest feedback about ${subject} as part of "${campaignName}".`,
      purpose:
        "Your organisation receives combined feedback without reviewer names or response times. Results are released only after the campaign closes and at least five reviewers have responded. Written comments may identify you — avoid personal references.",
      cta: "Begin feedback",
    };
  }

  if (relationship === "self") {
    return {
      title: "Your self-appraisal",
      description: `Take a few quiet minutes to reflect on your work as part of "${campaignName}" for ${org}.`,
      purpose:
        "This is your space to share progress, challenges, and what you want next. Your answers go to authorised reviewers in your organisation. Only people with your personal link can open this form.",
      cta: "Start self-appraisal",
    };
  }

  if (relationship === "manager") {
    return {
      title: `Manager appraisal for ${subject}`,
      description: `You've been asked to complete a manager appraisal for ${subject} as part of "${campaignName}".`,
      purpose:
        "Your perspective helps create a balanced review alongside their self-appraisal. Answers are shared with authorised reviewers in your organisation. Only people with your personal link can open this form.",
      cta: "Start manager appraisal",
    };
  }

  return {
    title: campaignName || "Your appraisal",
    description: `You've been asked to complete an appraisal form for ${org}.`,
    purpose:
      "Answer each question in your own words. Progress saves as you go, and you can check everything before you submit. Only people with your personal link can open this form.",
    cta: "Begin appraisal",
  };
}

function completionCopy({
  anonymous,
  relationship,
  subjectName,
  orgName,
  returning,
}: {
  anonymous: boolean;
  relationship: string | null;
  subjectName?: string;
  orgName?: string | null;
  returning: boolean;
}): { title: string; body: string; next: string[] } {
  const subject = subjectName?.trim();
  const org = orgName?.trim() || "your organisation";

  if (anonymous) {
    return {
      title: returning ? "You've already shared your feedback" : "Thank you — your feedback is in",
      body: subject
        ? `Your perspective will help ${subject} see their work more clearly.`
        : "Your perspective will help your colleague see their work more clearly.",
      next: [
        "Your answers are combined with other reviewers' — your name is never attached.",
        "Nothing is released until the campaign closes and at least five people have responded.",
        "You can close this page. There's nothing else you need to do.",
      ],
    };
  }

  if (relationship === "self") {
    return {
      title: returning ? "Your self-appraisal is already in" : "Nicely done — your self-appraisal is in",
      body: "Taking time to reflect is the hardest part. That's done.",
      next: [
        `Your answers are now with ${org}.`,
        "Your manager will see them alongside their own view, ready for your review conversation.",
        "You can close this page.",
      ],
    };
  }

  if (relationship === "manager") {
    return {
      title: returning ? "This appraisal is already in" : "Thank you — your appraisal is in",
      body: subject
        ? `${subject}'s review now has your perspective alongside their own.`
        : "The review now has your perspective alongside the employee's own.",
      next: [
        "Both views come together in the results, ready to compare.",
        "Use them to prepare for a focused review conversation.",
        "You can close this page.",
      ],
    };
  }

  return {
    title: returning ? "You've already submitted this" : "Thank you — that's submitted",
    body: `${org} can now include your answers in the review.`,
    next: ["You can close this page. There's nothing else you need to do."],
  };
}

export default function RespondForm({
  token,
  campaignName,
  questions,
  relationship,
  alreadySubmitted,
  orgName,
  orgLogoUrl,
  orgBrandColor,
  initialAnswers,
  anonymous = false,
  subjectName,
  preview = false,
  compact = false,
  previewQuestionIndex,
}: RespondFormProps) {
  const Heading = preview ? "h2" : "h1";
  const brandStyle = brandTokens(orgBrandColor);
  const [answers, setAnswers] = useState<Record<string, Answer>>(() =>
    Object.fromEntries(
      initialAnswers.map((answer) => [answer.campaign_question_id, answer]),
    ),
  );
  const [phase, setPhase] = useState<Phase>(() => {
    if (alreadySubmitted) return "complete";
    if (preview && previewQuestionIndex !== undefined) return "questions";
    if (initialAnswers.some(isAnswered)) return "questions";
    return "cover";
  });
  const [questionIndex, setQuestionIndex] = useState(() =>
    preview && previewQuestionIndex !== undefined
      ? Math.max(0, Math.min(questions.length - 1, previewQuestionIndex))
      : initialAnswers.some(isAnswered)
      ? firstUnansweredIndex(
          questions,
          Object.fromEntries(
            initialAnswers.map((a) => [a.campaign_question_id, a]),
          ),
        )
      : 0,
  );
  // Editing from the review screen returns there instead of walking forward.
  const [editingFromReview, setEditingFromReview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [isPending, startTransition] = useTransition();

  // Autosave: the ref always holds the latest answers, so saves never send a
  // stale snapshot; saves run one at a time and coalesce while one is in flight.
  const answersRef = useRef(answers);
  const dirtyRef = useRef(false);
  const inFlightRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushSave = useCallback(
    async (options: { keepalive?: boolean } = {}) => {
      if (preview) return;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (!dirtyRef.current || inFlightRef.current) return;
      inFlightRef.current = true;
      setSaveState("saving");
      let ok = true;
      // Answers that change while a save is running are saved straight after.
      while (ok && dirtyRef.current) {
        dirtyRef.current = false;
        try {
          const res = await fetch("/api/respond", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            keepalive: options.keepalive,
            body: JSON.stringify({
              action: "save",
              token,
              answers: Object.values(answersRef.current),
            }),
          });
          ok = res.ok;
        } catch {
          ok = false;
        }
        if (!ok) dirtyRef.current = true;
      }
      inFlightRef.current = false;
      setSaveState(ok ? "saved" : "error");
    },
    [preview, token],
  );

  const scheduleSave = useCallback(
    (delay: number) => {
      if (preview) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => void flushSave(), delay);
    },
    [flushSave, preview],
  );

  const updateAnswer = useCallback(
    (questionId: string, partial: Partial<Answer>, delay: number) => {
      const next = {
        ...answersRef.current,
        [questionId]: {
          ...answersRef.current[questionId],
          campaign_question_id: questionId,
          ...partial,
        },
      };
      answersRef.current = next;
      dirtyRef.current = true;
      setAnswers(next);
      scheduleSave(delay);
    },
    [scheduleSave],
  );

  useEffect(() => {
    if (preview) return;
    const onHide = () => {
      if (document.visibilityState === "hidden") void flushSave({ keepalive: true });
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirtyRef.current && !inFlightRef.current) return;
      void flushSave({ keepalive: true });
      e.preventDefault();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onBeforeUnload);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [flushSave, preview]);

  const answeredCount = useMemo(
    () => questions.filter((q) => isAnswered(answers[q.id])).length,
    [answers, questions],
  );

  const progressPct =
    questions.length === 0
      ? 0
      : Math.round((answeredCount / questions.length) * 100);

  const missingRequired = questions.filter(
    (q) => q.required && !isAnswered(answers[q.id]),
  );

  const openQuestion = (index: number, fromReview: boolean) => {
    setError(null);
    setEditingFromReview(fromReview);
    setQuestionIndex(index);
    setPhase("questions");
  };

  const submitAll = () => {
    if (preview) {
      setPhase("complete");
      return;
    }
    setError(null);
    const firstMissing = missingRequired[0];
    if (firstMissing) {
      openQuestion(
        questions.findIndex((item) => item.id === firstMissing.id),
        true,
      );
      setError("This question needs an answer before you can submit.");
      return;
    }

    startTransition(async () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      try {
        const res = await fetch("/api/respond", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "submit",
            token,
            answers: Object.values(answersRef.current),
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(
            (body as { error?: string }).error ??
              "We couldn't submit your answers. Please try again — nothing has been lost.",
          );
          return;
        }
        dirtyRef.current = false;
        setPhase("complete");
      } catch {
        setError(
          "We couldn't reach the server. Check your connection and try again — your answers are still here.",
        );
      }
    });
  };

  const advance = () => {
    void flushSave();
    if (editingFromReview || questionIndex >= questions.length - 1) {
      setEditingFromReview(false);
      setPhase("review");
      return;
    }
    setQuestionIndex((i) => i + 1);
  };

  const goNext = () => {
    const current = questions[questionIndex];
    if (!current) return;
    if (current.required && !isAnswered(answers[current.id])) {
      setError("Please answer this question to continue.");
      return;
    }
    setError(null);
    advance();
  };

  const goBack = () => {
    setError(null);
    if (editingFromReview) {
      setEditingFromReview(false);
      setPhase("review");
      return;
    }
    if (questionIndex <= 0) {
      setPhase("cover");
      return;
    }
    setQuestionIndex((i) => i - 1);
  };

  const goSkip = () => {
    const current = questions[questionIndex];
    if (!current || current.required) return;
    setError(null);
    advance();
  };

  if (phase === "complete") {
    const copy = completionCopy({
      anonymous,
      relationship,
      subjectName,
      orgName,
      returning: alreadySubmitted,
    });
    return (
      <Shell style={brandStyle} embedded={preview} compact={compact}>
        <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
          <SuccessMark animate={!alreadySubmitted} />
          <div className="mt-6">
            <OrgIdentityHeader
              orgName={orgName}
              logoUrl={orgLogoUrl}
              brandColor={orgBrandColor}
              size={32}
              align="center"
            />
          </div>
          <Heading className="mt-5 font-display text-2xl font-semibold tracking-tight text-foreground text-balance sm:text-[1.75rem]">
            {copy.title}
          </Heading>
          <p className="mt-3 max-w-md text-base leading-relaxed text-muted-foreground">
            {preview
              ? "This is the completion preview. No response was recorded."
              : copy.body}
          </p>
          {!preview && (
            <div className="mt-8 w-full max-w-md rounded-xl border border-border bg-card p-5 text-left">
              <p className="text-sm font-medium text-foreground">What happens next</p>
              <ul className="mt-3 space-y-2.5">
                {copy.next.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                    <span
                      className="mt-[0.45rem] size-1.5 shrink-0 rounded-full bg-primary"
                      aria-hidden
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {!compact && <TrustFooter />}
      </Shell>
    );
  }

  if (phase === "cover") {
    const copy = coverCopy({
      anonymous,
      relationship,
      subjectName,
      orgName,
      campaignName,
    });
    const minutes = estimateMinutes(questions.length);
    const resuming = answeredCount > 0;

    return (
      <Shell style={brandStyle} embedded={preview} compact={compact}>
        <div className={`flex flex-1 flex-col justify-center gap-8 ${compact ? "" : "py-6"}`}>
          <OrgIdentityHeader
            orgName={orgName}
            logoUrl={orgLogoUrl}
            brandColor={orgBrandColor}
            size={48}
          />

          <div className="space-y-3">
            <Heading className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-[2rem] text-balance">
              {copy.title}
            </Heading>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground">
              {copy.description}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">What this is for</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {copy.purpose}
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            {questions.length} question{questions.length === 1 ? "" : "s"} · Around{" "}
            {minutes} minute{minutes === 1 ? "" : "s"}
            {resuming ? ` · ${answeredCount} answered so far` : ""}
          </p>

          <div className="space-y-3 pt-1">
            <Button
              type="button"
              className="h-10 w-full"
              onClick={() =>
                openQuestion(firstUnansweredIndex(questions, answers), false)
              }
            >
              {resuming ? "Pick up where you left off" : copy.cta}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              {preview ? "This is a preview. Nothing you enter will be saved or submitted." : "You can close this page and return using the link in your email. Progress saves as you go."}
            </p>
          </div>
        </div>
        {!compact && <TrustFooter />}
      </Shell>
    );
  }

  if (phase === "review") {
    return (
      <Shell style={brandStyle} embedded={preview} compact={compact}>
        <div className="flex flex-1 flex-col animate-[fade-in_200ms_ease-out] motion-reduce:animate-none">
          <ProgressHeader
            pct={progressPct}
            label="Review"
            saveState={saveState}
          />
          <div className="space-y-2">
            <Heading className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
              Check your answers
            </Heading>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {missingRequired.length > 0
                ? `${missingRequired.length} required question${missingRequired.length === 1 ? " still needs" : "s still need"} an answer.`
                : saveState === "error"
                  ? "Some answers haven't saved yet — they'll be sent when you submit. Change anything you like first."
                  : "Your answers are saved. Change anything you like, then submit when you're happy."}
            </p>
          </div>

          <ol className="mt-6 divide-y divide-border rounded-xl border border-border bg-card">
            {questions.map((q, i) => {
              const value = formatAnswer(q, answers[q.id]);
              const missing = q.required && !value;
              return (
                <li key={q.id} className="flex items-start gap-4 px-4 py-3.5">
                  <span className="mt-0.5 w-5 shrink-0 text-xs tabular-nums text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug text-foreground">
                      {q.prompt}
                    </p>
                    <p
                      className={`mt-1 line-clamp-2 text-sm leading-relaxed ${
                        missing
                          ? "font-medium text-destructive"
                          : value
                            ? "text-muted-foreground"
                            : "italic text-muted-foreground/80"
                      }`}
                    >
                      {value ?? (missing ? "Needs an answer" : "Skipped")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openQuestion(i, true)}
                    className="shrink-0 rounded-md px-2 py-1 text-sm font-medium text-primary hover:bg-accent focus-visible:outline-2"
                    aria-label={`${value ? "Change" : "Answer"} question ${i + 1}`}
                  >
                    {value ? "Change" : "Answer"}
                  </button>
                </li>
              );
            })}
          </ol>

          {error ? (
            <p role="alert" className="mt-4 text-sm font-medium text-destructive">
              {error}
            </p>
          ) : null}

          <div className="sticky bottom-0 -mx-5 mt-8 border-t border-border/80 bg-surface/95 px-5 py-4 backdrop-blur sm:-mx-8 sm:px-8">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                className="h-10 px-3"
                onClick={() => openQuestion(questions.length - 1, false)}
                disabled={isPending}
              >
                Back
              </Button>
              <p className="ml-auto hidden text-xs text-muted-foreground sm:block">
                You can&apos;t change answers after submitting.
              </p>
              <Button
                type="button"
                className="h-10 min-w-[8.5rem] max-sm:ml-auto"
                disabled={isPending}
                onClick={submitAll}
              >
                {isPending
                  ? "Submitting…"
                  : anonymous
                    ? "Submit feedback"
                    : "Submit appraisal"}
              </Button>
            </div>
          </div>

          {!compact && (
            <div className="pt-4">
              <TrustFooter />
            </div>
          )}
        </div>
      </Shell>
    );
  }

  const current = questions[questionIndex];
  if (!current) {
    return (
      <Shell style={brandStyle} embedded={preview} compact={compact}>
        <p className="text-sm text-muted-foreground">No questions available.</p>
      </Shell>
    );
  }

  const isLast = questionIndex >= questions.length - 1;

  return (
    <Shell style={brandStyle} embedded={preview} compact={compact}>
      <div className="flex flex-1 flex-col">
        <ProgressHeader
          pct={progressPct}
          label={`${questionIndex + 1} of ${questions.length}`}
          saveState={saveState}
        />

        <QuestionStep
          key={current.id}
          question={current}
          answer={answers[current.id]}
          error={error}
          onAnswer={(partial, delay) => {
            setError(null);
            updateAnswer(current.id, partial, delay);
          }}
          onBlur={() => void flushSave()}
        />

        <div className="sticky bottom-0 -mx-5 mt-8 border-t border-border/80 bg-surface/95 px-5 py-4 backdrop-blur sm:-mx-8 sm:px-8">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              className="h-10 px-3"
              onClick={goBack}
              disabled={isPending}
            >
              {editingFromReview ? "Back to review" : "Back"}
            </Button>
            <div className="ml-auto flex items-center gap-2">
              {!current.required && !isAnswered(answers[current.id]) ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-10"
                  onClick={goSkip}
                  disabled={isPending}
                >
                  Skip
                </Button>
              ) : null}
              <Button
                type="button"
                className="h-10 min-w-[8.5rem]"
                disabled={isPending}
                onClick={goNext}
              >
                {editingFromReview ? "Save and review" : isLast ? "Review answers" : "Continue"}
              </Button>
            </div>
          </div>
        </div>

        {!compact && <div className="pt-4">
          <TrustFooter />
        </div>}
      </div>
    </Shell>
  );
}

function ProgressHeader({
  pct,
  label,
  saveState,
}: {
  pct: number;
  label: string;
  saveState: SaveState;
}) {
  return (
    <div className="space-y-3 pb-6">
      <div
        className="h-1 w-full overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Form progress"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out motion-reduce:transition-none"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{label}</span>
        <span aria-live="polite" className={saveState === "error" ? "text-destructive" : undefined}>
          {saveState === "saving"
            ? "Saving…"
            : saveState === "saved"
              ? "✓ Saved"
              : saveState === "error"
                ? "Not saved yet — we'll keep trying"
                : ""}
        </span>
      </div>
    </div>
  );
}

function SuccessMark({ animate }: { animate: boolean }) {
  return (
    <div className="relative flex size-16 items-center justify-center" aria-hidden>
      {animate && (
        <span className="absolute inset-0 rounded-full bg-primary opacity-0 animate-[halo_900ms_ease-out_250ms] motion-reduce:hidden" />
      )}
      <span
        className={`relative flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_30px_-12px_var(--primary)] ${animate ? "animate-[pop-in_420ms_cubic-bezier(0.34,1.56,0.64,1)_both]" : ""}`}
      >
        <svg viewBox="0 0 24 24" className="size-8" fill="none">
          <path
            d="M5 12.5l4.5 4.5L19 7.5"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            className={animate ? "animate-[check-draw_380ms_ease-out_280ms_both]" : undefined}
          />
        </svg>
      </span>
    </div>
  );
}

function Shell({
  children,
  style,
  embedded = false,
  compact = false,
}: {
  children: ReactNode;
  style?: CSSProperties;
  embedded?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={`${compact ? "" : embedded ? "min-h-[38rem]" : "min-h-dvh"} bg-surface text-foreground`} style={style}>
      <div className={`mx-auto flex ${compact ? "py-6" : embedded ? "min-h-[38rem] py-8 sm:py-12" : "min-h-dvh py-8 sm:py-12"} w-full max-w-xl flex-col px-5 sm:px-8`}>
        {children}
      </div>
    </div>
  );
}

function TrustFooter() {
  return (
    <div className="mt-auto pt-8 text-center">
      <PlatformFooter quiet />
    </div>
  );
}

function QuestionStep({
  question,
  answer,
  error,
  onAnswer,
  onBlur,
}: {
  question: CampaignQuestion;
  answer: Answer | undefined;
  error: string | null;
  onAnswer: (partial: Partial<Answer>, saveDelay: number) => void;
  onBlur: () => void;
}) {
  const headingId = useId();
  const errorId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const scale = scaleOf(question);

  useEffect(() => {
    headingRef.current?.focus();
  }, [question.id]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "TEXTAREA" || target.tagName === "INPUT")
      )
        return;

      if (
        (question.type === "rating" || question.type === "nps") &&
        /^[0-9]$/.test(e.key)
      ) {
        const n = Number(e.key);
        if (n >= scale.min && n <= scale.max) {
          e.preventDefault();
          onAnswer({ numeric_value: n }, 0);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [question.type, scale.min, scale.max, onAnswer]);

  return (
    <div className="flex flex-1 flex-col gap-6 animate-[fade-in_200ms_ease-out] motion-reduce:animate-none">
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          {question.required ? "Required" : "Optional"}
        </p>
        <h2
          id={headingId}
          ref={headingRef}
          tabIndex={-1}
          className="font-display text-2xl font-semibold tracking-tight text-foreground outline-none sm:text-[1.75rem] text-balance"
        >
          {question.prompt}
        </h2>
        {question.help_text ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {question.help_text}
          </p>
        ) : null}
      </div>

      {(question.type === "rating" || question.type === "nps") && (
        <div>
          <div className="grid grid-cols-5 gap-2 sm:flex sm:flex-wrap sm:gap-2">
            {Array.from(
              { length: scale.max - scale.min + 1 },
              (_, i) => scale.min + i,
            ).map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => onAnswer({ numeric_value: val }, 0)}
                aria-pressed={answer?.numeric_value === val}
                className={`min-h-11 min-w-0 rounded-md border text-sm font-medium transition-[color,background-color,border-color,transform] duration-150 touch-manipulation active:scale-95 sm:size-11 sm:min-h-0 ${
                  answer?.numeric_value === val
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-card text-foreground hover:border-primary/50"
                }`}
              >
                {val}
              </button>
            ))}
          </div>
          {(scale.minLabel || scale.maxLabel) && (
            <div className="mt-2 flex justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {scale.minLabel}
              </span>
              <span className="text-xs text-muted-foreground text-right">
                {scale.maxLabel}
              </span>
            </div>
          )}
        </div>
      )}

      {question.type === "text" && (
        <div>
          <textarea
            rows={5}
            value={answer?.text_value ?? ""}
            onChange={(e) =>
              onAnswer({ text_value: e.target.value }, TEXT_SAVE_DELAY_MS)
            }
            onBlur={onBlur}
            placeholder="Type your answer here…"
            aria-labelledby={headingId}
            aria-describedby={error ? errorId : undefined}
            className="field w-full max-w-full text-base leading-relaxed sm:text-sm"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Specific examples are the most useful. Your words are saved as you type.
          </p>
        </div>
      )}

      {(question.type === "single_choice" ||
        question.type === "multi_choice") && (
        <div className="space-y-2">
          {(question.options as string[]).map((opt) => {
            const isMulti = question.type === "multi_choice";
            const selected = isMulti
              ? ((answer?.choice_values as string[]) ?? []).includes(opt)
              : answer?.choice_values?.[0] === opt;

            return (
              <label
                key={opt}
                className={`flex cursor-pointer items-start gap-3 rounded-md border px-3.5 py-3 touch-manipulation transition-colors ${
                  selected
                    ? "border-primary/60 bg-accent"
                    : "border-input bg-card hover:border-primary/40"
                }`}
              >
                <input
                  type={isMulti ? "checkbox" : "radio"}
                  checked={selected}
                  onChange={() => {
                    if (isMulti) {
                      const current = (
                        (answer?.choice_values as string[]) ?? []
                      ).filter(Boolean);
                      const next = selected
                        ? current.filter((v) => v !== opt)
                        : [...current, opt];
                      onAnswer({ choice_values: next }, 0);
                    } else {
                      onAnswer({ choice_values: [opt] }, 0);
                    }
                  }}
                  className="mt-0.5 h-5 w-5 shrink-0 rounded accent-primary"
                />
                <span className="text-sm leading-snug text-foreground">
                  {opt}
                </span>
              </label>
            );
          })}
        </div>
      )}

      {error ? (
        <p id={errorId} role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
