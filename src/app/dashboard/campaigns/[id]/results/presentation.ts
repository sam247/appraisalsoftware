import type {
  CampaignQuestion,
  ResponseAnswer,
} from "@/lib/types/database";

export type RatingPair = {
  questionId: string;
  label: string;
  prompt: string;
  max: number;
  self: number | null;
  manager: number | null;
};

export type WrittenPair = {
  questionId: string;
  prompt: string;
  self: string | null;
  manager: string | null;
  selfSubmitted: boolean;
  managerSubmitted: boolean;
};

export function scaleMax(question: Pick<CampaignQuestion, "scale">): number {
  const max = Number(question.scale?.max ?? 5);
  return Number.isFinite(max) && max > 0 ? max : 5;
}

export function ratingLabel(question: CampaignQuestion): string {
  const competency = question.competency_label?.trim();
  if (competency) return competency;
  return question.prompt;
}

export function numericAnswer(
  answer: ResponseAnswer | undefined,
): number | null {
  if (
    answer?.numeric_value === null ||
    answer?.numeric_value === undefined ||
    Number.isNaN(Number(answer.numeric_value))
  )
    return null;
  return Number(answer.numeric_value);
}

export function textAnswer(answer: ResponseAnswer | undefined): string | null {
  const value = answer?.text_value?.trim();
  return value ? value : null;
}

export function average(values: number[]): number | null {
  if (!values.length) return null;
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round((sum / values.length) * 10) / 10;
}

export function buildAnnualRatingPairs(
  questions: CampaignQuestion[],
  selfByQ: Record<string, ResponseAnswer | undefined>,
  managerByQ: Record<string, ResponseAnswer | undefined>,
): RatingPair[] {
  return questions
    .filter((q) => q.type === "rating")
    .map((q) => ({
      questionId: q.id,
      label: ratingLabel(q),
      prompt: q.prompt,
      max: scaleMax(q),
      self: numericAnswer(selfByQ[q.id]),
      manager: numericAnswer(managerByQ[q.id]),
    }));
}

export function buildAnnualWrittenPairs(
  questions: CampaignQuestion[],
  selfByQ: Record<string, ResponseAnswer | undefined>,
  managerByQ: Record<string, ResponseAnswer | undefined>,
  selfSubmitted: boolean,
  managerSubmitted: boolean,
): WrittenPair[] {
  return questions
    .filter((q) => q.type === "text")
    .map((q) => ({
      questionId: q.id,
      prompt: q.prompt,
      self: textAnswer(selfByQ[q.id]),
      manager: textAnswer(managerByQ[q.id]),
      selfSubmitted,
      managerSubmitted,
    }));
}

/** Deterministic discussion cues from absolute rating gaps (both answered). */
export function areasToDiscuss(
  pairs: RatingPair[],
  minGap = 1,
  limit = 3,
): Array<RatingPair & { gap: number }> {
  return pairs
    .filter((p) => p.self !== null && p.manager !== null)
    .map((p) => ({
      ...p,
      gap: Math.abs((p.self as number) - (p.manager as number)),
    }))
    .filter((p) => p.gap >= minGap)
    .sort((a, b) => b.gap - a.gap || a.label.localeCompare(b.label))
    .slice(0, limit);
}

export type Feedback360Question = {
  question_id: string;
  prompt: string;
  type: string;
  answer_count: number;
  average: number | null;
  comments: string[] | null;
};

export function feedback360RatingProfile(
  questions: Feedback360Question[],
): Array<{ id: string; label: string; average: number; answerCount: number }> {
  return questions
    .filter(
      (q) =>
        q.type === "rating" &&
        q.average !== null &&
        q.average !== undefined &&
        !Number.isNaN(Number(q.average)),
    )
    .map((q) => ({
      id: q.question_id,
      label: q.prompt,
      average: Number(q.average),
      answerCount: q.answer_count,
    }));
}

export function feedback360OverallAverage(
  ratings: Array<{ average: number }>,
): number | null {
  return average(ratings.map((r) => r.average));
}

export function feedback360ScoredAnswers(
  ratings: Array<{ answerCount: number }>,
): number {
  return ratings.reduce((sum, r) => sum + r.answerCount, 0);
}

/** Truncate long prompts for profile rows without inventing labels. */
export function shortPrompt(prompt: string, max = 42): string {
  const trimmed = prompt.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}
