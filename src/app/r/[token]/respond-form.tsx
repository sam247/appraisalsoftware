"use client";

import { Logo } from "@/components/home/Logo";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { CampaignQuestion } from "@/lib/types/database";

interface Answer {
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
}

export default function RespondForm({
  token,
  campaignName,
  questions,
  relationship,
  alreadySubmitted,
  orgName,
}: RespondFormProps) {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [submitted, setSubmitted] = useState(alreadySubmitted);
  const [error, setError] = useState<string | null>(null);
  const [saveHint, setSaveHint] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const answeredCount = useMemo(() => {
    return questions.filter((q) => {
      const a = answers[q.id];
      if (!a) return false;
      return (
        (a.numeric_value !== undefined && a.numeric_value !== null) ||
        Boolean(a.text_value && a.text_value.trim()) ||
        Boolean(a.choice_values && (a.choice_values as unknown[]).length > 0)
      );
    }).length;
  }, [answers, questions]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    for (const q of questions) {
      if (q.required) {
        const a = answers[q.id];
        const hasAnswer =
          a &&
          (a.numeric_value !== undefined ||
            (a.text_value && a.text_value.trim()) ||
            (a.choice_values && (a.choice_values as unknown[]).length > 0));
        if (!hasAnswer) {
          setError(`Please answer: "${q.prompt}"`);
          return;
        }
      }
    }

    startTransition(async () => {
      const answersArr = Object.values(answers);
      const res = await fetch("/api/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit",
          token,
          answers: answersArr,
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
    });
  };

  const handleSave = () => {
    startTransition(async () => {
      const answersArr = Object.values(answers);
      const res = await fetch("/api/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", token, answers: answersArr }),
      });
      if (res.ok) {
        setSaveHint("Progress saved");
        window.setTimeout(() => setSaveHint(null), 2000);
      }
    });
  };

  if (submitted) {
    return (
      <div className="min-h-dvh bg-surface flex items-center justify-center px-4 py-10">
        <div className="max-w-md w-full text-center">
          <div
            className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-2xl text-primary"
            aria-hidden
          >
            ✓
          </div>
          <div className="mb-6 flex justify-center"><Logo /></div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Thank you
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Your responses have been submitted successfully.
            {orgName ? ` ${orgName} can now include them in the review.` : ""}
          </p>
        </div>
      </div>
    );
  }

  const progressPct =
    questions.length === 0
      ? 0
      : Math.round((answeredCount / questions.length) * 100);

  return (
    <div className="min-h-dvh bg-surface">
      <div className="sticky top-0 z-10 border-b border-border/80 bg-surface/95 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3">
            {orgName?.trim() ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary truncate">{orgName}</p>
            ) : <Logo />}
            <p className="text-xs text-muted-foreground shrink-0">
              {answeredCount}/{questions.length || "—"}
            </p>
          </div>
          <div
            className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border"
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Form progress"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12 pb-28">
        <div className="mb-8">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
            {relationship
              ? RELATIONSHIP_LABELS[relationship] ?? relationship
              : ""}{" "}
            appraisal
          </p>
          <h1 className="font-display text-2xl sm:text-[1.75rem] font-semibold tracking-tight text-foreground text-balance">
            {campaignName}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Answer each question in your own words. Progress saves as you go.
          </p>
          {saveHint && (
            <p className="mt-2 text-xs text-primary" aria-live="polite">
              {saveHint}
            </p>
          )}
        </div>

        {error && (
          <div
            className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          {questions.map((q, idx) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={idx}
              answer={answers[q.id]}
              onChange={(partial) => setAnswer(q.id, partial)}
              onBlur={handleSave}
            />
          ))}

          <div className="fixed bottom-0 inset-x-0 z-10 border-t border-border bg-card/95 backdrop-blur-sm sm:static sm:border-0 sm:bg-transparent sm:backdrop-blur-none sm:pt-4">
            <div className="mx-auto max-w-2xl px-4 sm:px-0 py-3 sm:py-0 safe-pb">
              <Button
                type="submit"
                disabled={isPending}
                className="w-full sm:w-auto min-h-12 sm:min-h-10 text-base sm:text-sm"
              >
                {isPending ? "Submitting…" : "Submit appraisal"}
              </Button>
              <p className="mt-2 text-xs text-muted-foreground sm:hidden">
                You can&apos;t edit answers after submitting.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function QuestionCard({
  question,
  index,
  answer,
  onChange,
  onBlur,
}: {
  question: CampaignQuestion;
  index: number;
  answer: Answer | undefined;
  onChange: (partial: Partial<Answer>) => void;
  onBlur: () => void;
}) {
  const scale = question.scale as {
    min?: number;
    max?: number;
    min_label?: string;
    max_label?: string;
  };

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4 sm:px-5 sm:py-5 overflow-hidden">
      <p className="text-sm font-medium text-foreground mb-1 leading-snug">
        {index + 1}. {question.prompt}
        {question.required && (
          <span className="text-destructive ml-0.5">*</span>
        )}
      </p>
      {question.help_text && (
        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
          {question.help_text}
        </p>
      )}

      {(question.type === "rating" || question.type === "nps") && (
        <div className="mt-3">
          <div className="grid grid-cols-5 gap-2 sm:flex sm:flex-wrap sm:gap-2">
            {Array.from(
              { length: (scale.max ?? 5) - (scale.min ?? 1) + 1 },
              (_, i) => (scale.min ?? 1) + i,
            ).map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => onChange({ numeric_value: val })}
                onBlur={onBlur}
                aria-pressed={answer?.numeric_value === val}
                className={`min-h-12 min-w-0 rounded-lg border text-base font-medium transition-colors touch-manipulation sm:w-11 sm:h-11 sm:min-h-0 sm:text-sm ${
                  answer?.numeric_value === val
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface text-foreground hover:border-foreground/20 active:bg-muted"
                }`}
              >
                {val}
              </button>
            ))}
          </div>
          {(scale.min_label || scale.max_label) && (
            <div className="flex justify-between gap-2 mt-2">
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
          rows={4}
          value={answer?.text_value ?? ""}
          onChange={(e) => onChange({ text_value: e.target.value })}
          onBlur={onBlur}
          placeholder="Type your answer here…"
          className="mt-3 w-full max-w-full rounded-lg border border-input bg-surface px-3.5 py-3 text-base sm:text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring resize-y min-h-[7rem]"
        />
      )}

      {(question.type === "single_choice" ||
        question.type === "multi_choice") && (
        <div className="mt-3 space-y-2">
          {(question.options as string[]).map((opt) => {
            const isMulti = question.type === "multi_choice";
            const selected = isMulti
              ? ((answer?.choice_values as string[]) ?? []).includes(opt)
              : answer?.choice_values?.[0] === opt;

            return (
              <label
                key={opt}
                className={`flex items-start gap-3 cursor-pointer rounded-lg border px-3 py-3 touch-manipulation ${
                  selected
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-surface"
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
                <span className="text-sm text-foreground leading-snug">
                  {opt}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  self: "Self",
  manager: "Manager",
  peer: "Peer",
  direct_report: "Direct report",
  other: "",
};
