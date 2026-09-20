"use client";

import {
  OrgIdentityHeader,
  PlatformFooter,
} from "@/components/branding/org-identity";
import { Button } from "@/components/ui/button";
import { accentForWhiteText } from "@/lib/branding";
import type { CampaignQuestion } from "@/lib/types/database";
import {
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
}

type Phase = "cover" | "questions" | "complete";

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
      "Answer each question in your own words. Progress saves as you go; submission is final. Only people with your personal link can open this form.",
    cta: "Begin appraisal",
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
}: RespondFormProps) {
  const accent = accentForWhiteText(orgBrandColor);
  const brandStyle = {
    ["--org-accent" as string]: accent,
  } as CSSProperties;
  const [answers, setAnswers] = useState<Record<string, Answer>>(() =>
    Object.fromEntries(
      initialAnswers.map((answer) => [answer.campaign_question_id, answer]),
    ),
  );
  const [phase, setPhase] = useState<Phase>(() => {
    if (alreadySubmitted) return "complete";
    if (initialAnswers.some(isAnswered)) return "questions";
    return "cover";
  });
  const [questionIndex, setQuestionIndex] = useState(() =>
    initialAnswers.some(isAnswered)
      ? firstUnansweredIndex(
          questions,
          Object.fromEntries(
            initialAnswers.map((a) => [a.campaign_question_id, a]),
          ),
        )
      : 0,
  );
  const [submitted, setSubmitted] = useState(alreadySubmitted);
  const [error, setError] = useState<string | null>(null);
  const [saveHint, setSaveHint] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSaving, startSaveTransition] = useTransition();

  const answeredCount = useMemo(
    () => questions.filter((q) => isAnswered(answers[q.id])).length,
    [answers, questions],
  );

  const progressPct =
    questions.length === 0
      ? 0
      : Math.round((answeredCount / questions.length) * 100);

  const setAnswer = (questionId: string, partial: Partial<Answer>) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        campaign_question_id: questionId,
        ...partial,
      },
    }));
  };

  const persistAnswers = (nextAnswers: Record<string, Answer>) => {
    startSaveTransition(async () => {
      try {
        const res = await fetch("/api/respond", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "save",
            token,
            answers: Object.values(nextAnswers),
          }),
        });
        setSaveHint(
          res.ok
            ? "Progress saved"
            : "Progress could not be saved. Keep this page open and try again.",
        );
      } catch {
        setSaveHint(
          "Progress could not be saved. Keep this page open and try again.",
        );
      }
    });
  };

  const handleSave = () => persistAnswers(answers);

  const submitAll = () => {
    setError(null);
    for (const q of questions) {
      if (q.required && !isAnswered(answers[q.id])) {
        const idx = questions.findIndex((item) => item.id === q.id);
        setQuestionIndex(idx);
        setPhase("questions");
        setError(`Please answer: "${q.prompt}"`);
        return;
      }
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/respond", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "submit",
            token,
            answers: Object.values(answers),
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(
            (body as { error?: string }).error ??
              "Failed to submit. Please try again.",
          );
          return;
        }
        setSubmitted(true);
        setPhase("complete");
      } catch {
        setError(
          "Your response could not be submitted. Please try again; your answers remain on this page.",
        );
      }
    });
  };

  const goNext = () => {
    const current = questions[questionIndex];
    if (!current) return;
    if (current.required && !isAnswered(answers[current.id])) {
      setError("Please answer this question to continue.");
      return;
    }
    setError(null);
    persistAnswers(answers);
    if (questionIndex >= questions.length - 1) {
      submitAll();
      return;
    }
    setQuestionIndex((i) => i + 1);
  };

  const goBack = () => {
    setError(null);
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
    persistAnswers(answers);
    if (questionIndex >= questions.length - 1) {
      submitAll();
      return;
    }
    setQuestionIndex((i) => i + 1);
  };

  if (submitted || phase === "complete") {
    return (
      <Shell style={brandStyle}>
        <div className="flex flex-1 flex-col items-center justify-center text-center py-10">
          <div
            className="mb-5 flex h-14 w-14 items-center justify-center rounded-full text-2xl text-white"
            style={{ backgroundColor: accent }}
            aria-hidden
          >
            ✓
          </div>
          <OrgIdentityHeader
            orgName={orgName}
            logoUrl={orgLogoUrl}
            brandColor={orgBrandColor}
            size={40}
          />
          <h1 className="mt-6 font-display text-2xl font-semibold text-foreground">
            Thank you
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Your responses have been submitted successfully.
            {anonymous &&
              " Anonymous results will be released only after closure and when five reviewers have responded."}
            {!anonymous && orgName
              ? ` ${orgName} can now include them in the review.`
              : ""}
          </p>
        </div>
        <TrustFooter />
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

    return (
      <Shell style={brandStyle}>
        <div className="flex flex-1 flex-col justify-center gap-8 py-6">
          <OrgIdentityHeader
            orgName={orgName}
            logoUrl={orgLogoUrl}
            brandColor={orgBrandColor}
            size={48}
          />

          <div className="space-y-3">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-[2rem] text-balance">
              {copy.title}
            </h1>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground">
              {copy.description}
            </p>
          </div>

          <div className="rounded-2xl bg-card/80 px-4 py-3.5 ring-1 ring-border/80">
            <p className="text-sm font-medium text-foreground">What this is for</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {copy.purpose}
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            {questions.length} question{questions.length === 1 ? "" : "s"} · Around{" "}
            {minutes} minute{minutes === 1 ? "" : "s"}
          </p>

          <div className="space-y-3 pt-1">
            <Button
              type="button"
              className="h-12 w-full rounded-xl text-base"
              onClick={() => {
                setPhase("questions");
                setQuestionIndex(firstUnansweredIndex(questions, answers));
              }}
            >
              {copy.cta}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              You can close this page and return using the link in your email.
              Progress saves as you go.
            </p>
          </div>
        </div>
        <TrustFooter />
      </Shell>
    );
  }

  const current = questions[questionIndex];
  if (!current) {
    return (
      <Shell style={brandStyle}>
        <p className="text-sm text-muted-foreground">No questions available.</p>
      </Shell>
    );
  }

  return (
    <Shell style={brandStyle}>
      <div className="flex flex-1 flex-col">
        <div className="space-y-3 pb-6">
          <div
            className="h-1 w-full overflow-hidden rounded-full bg-border"
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Form progress"
          >
            <div
              className="h-full rounded-full transition-[width] duration-200 ease-out motion-reduce:transition-none"
              style={{ width: `${progressPct}%`, backgroundColor: accent }}
            />
          </div>
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>
              {questionIndex + 1} of {questions.length}
            </span>
            <span aria-live="polite">
              {isSaving
                ? "Saving…"
                : saveHint
                  ? saveHint === "Progress saved"
                    ? "✓ Progress saved"
                    : saveHint
                  : ""}
            </span>
          </div>
        </div>

        <QuestionStep
          key={current.id}
          question={current}
          answer={answers[current.id]}
          error={error}
          onChange={(partial) => {
            setError(null);
            setAnswer(current.id, partial);
          }}
          onBlur={handleSave}
        />

        <div className="sticky bottom-0 -mx-5 mt-8 border-t border-border/80 bg-surface/95 px-5 py-4 backdrop-blur sm:-mx-8 sm:px-8">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              className="h-11 rounded-xl px-4"
              onClick={goBack}
              disabled={isPending}
            >
              Back
            </Button>
            <div className="ml-auto flex items-center gap-2">
              {!current.required && !isAnswered(answers[current.id]) ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11 rounded-xl"
                  onClick={goSkip}
                  disabled={isPending}
                >
                  Skip
                </Button>
              ) : null}
              <Button
                type="button"
                className="h-11 min-w-[8.5rem] rounded-xl"
                disabled={isPending}
                onClick={goNext}
              >
                {isPending
                  ? "Submitting…"
                  : questionIndex >= questions.length - 1
                    ? anonymous
                      ? "Submit feedback"
                      : "Submit appraisal"
                    : "Continue"}
              </Button>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <TrustFooter />
        </div>
      </div>
    </Shell>
  );
}

function Shell({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div className="min-h-dvh bg-surface text-foreground" style={style}>
      <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-5 py-8 sm:px-8 sm:py-12">
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
  onChange,
  onBlur,
}: {
  question: CampaignQuestion;
  answer: Answer | undefined;
  error: string | null;
  onChange: (partial: Partial<Answer>) => void;
  onBlur: () => void;
}) {
  const headingId = useId();
  const errorId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const scale = question.scale as {
    min?: number;
    max?: number;
    min_label?: string;
    max_label?: string;
  };

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
        const min = scale.min ?? (question.type === "nps" ? 0 : 1);
        const max = scale.max ?? (question.type === "nps" ? 10 : 5);
        if (n >= min && n <= max) {
          e.preventDefault();
          onChange({ numeric_value: n });
          onBlur();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [question, scale.min, scale.max, onChange, onBlur]);

  return (
    <div className="flex flex-1 flex-col gap-6 animate-[fade-in_200ms_ease-out] motion-reduce:animate-none">
      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
              { length: (scale.max ?? 5) - (scale.min ?? 1) + 1 },
              (_, i) => (scale.min ?? 1) + i,
            ).map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  onChange({ numeric_value: val });
                  onBlur();
                }}
                aria-pressed={answer?.numeric_value === val}
                className={`min-h-12 min-w-0 rounded-xl border text-base font-medium transition-colors touch-manipulation sm:h-12 sm:w-12 sm:min-h-0 sm:text-sm ${
                  answer?.numeric_value === val
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:border-foreground/20 active:bg-muted"
                }`}
              >
                {val}
              </button>
            ))}
          </div>
          {(scale.min_label || scale.max_label) && (
            <div className="mt-2 flex justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {scale.min_label}
              </span>
              <span className="text-xs text-muted-foreground text-right">
                {scale.max_label}
              </span>
            </div>
          )}
        </div>
      )}

      {question.type === "text" && (
        <textarea
          rows={5}
          value={answer?.text_value ?? ""}
          onChange={(e) => onChange({ text_value: e.target.value })}
          onBlur={onBlur}
          placeholder="Type your answer here…"
          aria-labelledby={headingId}
          aria-describedby={error ? errorId : undefined}
          className="w-full max-w-full rounded-xl border border-input bg-card px-4 py-3 text-base sm:text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring resize-y min-h-[8rem]"
        />
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
                className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3.5 touch-manipulation transition-colors ${
                  selected
                    ? "border-primary/40 bg-primary/5 ring-1 ring-primary/30"
                    : "border-border bg-card hover:border-foreground/15"
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
                      onChange({ choice_values: next });
                    } else {
                      onChange({ choice_values: [opt] });
                    }
                    onBlur();
                  }}
                  className="mt-0.5 h-5 w-5 shrink-0 rounded"
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
