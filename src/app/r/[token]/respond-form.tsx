"use client";

import { useState, useTransition } from "react";
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
}

export default function RespondForm({
  token,
  campaignName,
  questions,
  relationship,
  alreadySubmitted,
}: RespondFormProps) {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [submitted, setSubmitted] = useState(alreadySubmitted);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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

    // Validate required
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
        setError((body as { error?: string }).error ?? "Failed to submit. Please try again.");
        return;
      }

      setSubmitted(true);
    });
  };

  const handleSave = () => {
    startTransition(async () => {
      const answersArr = Object.values(answers);
      await fetch("/api/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", token, answers: answersArr }),
      });
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center py-16">
          <div className="text-4xl mb-4">✓</div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Thank you!
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Your responses have been submitted successfully.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-2xl px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
            {relationship ? RELATIONSHIP_LABELS[relationship] ?? relationship : ""}{" "}
            appraisal
          </p>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            {campaignName}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Please answer each question honestly. Your responses are saved as
            you go.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Submitting…" : "Submit appraisal"}
            </Button>
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
    <div className="rounded-xl border border-border bg-card px-5 py-5">
      <p className="text-sm font-medium text-foreground mb-1">
        {index + 1}. {question.prompt}
        {question.required && (
          <span className="text-destructive ml-0.5">*</span>
        )}
      </p>
      {question.help_text && (
        <p className="text-xs text-muted-foreground mb-3">{question.help_text}</p>
      )}

      {(question.type === "rating" || question.type === "nps") && (
        <div className="mt-3">
          <div className="flex gap-2 flex-wrap">
            {Array.from(
              { length: (scale.max ?? 5) - (scale.min ?? 1) + 1 },
              (_, i) => (scale.min ?? 1) + i,
            ).map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => onChange({ numeric_value: val })}
                onBlur={onBlur}
                className={`w-10 h-10 rounded-lg border text-sm font-medium transition-colors ${
                  answer?.numeric_value === val
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface text-foreground hover:border-foreground/20"
                }`}
              >
                {val}
              </button>
            ))}
          </div>
          {(scale.min_label || scale.max_label) && (
            <div className="flex justify-between mt-1.5">
              <span className="text-xs text-muted-foreground">
                {scale.min_label}
              </span>
              <span className="text-xs text-muted-foreground">
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
          className="mt-3 w-full rounded-lg border border-input bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
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
                className="flex items-center gap-2.5 cursor-pointer"
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
                  className="rounded"
                />
                <span className="text-sm text-foreground">{opt}</span>
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
