/**
 * Report insights are derived from the answers by explainable rules — every
 * sentence on the report can be traced back to the ratings that produced it.
 */
import type { CampaignQuestion, ResponseAnswer } from "@/lib/types/database";

export interface Dimension {
  key: string;
  label: string;
  max: number;
  questionIds: string[];
}

export type Scores = Record<string, number | null>;

export interface SubjectScores {
  subjectId: string;
  name: string;
  selfSubmitted: boolean;
  managerSubmitted: boolean;
  self: Scores;
  manager: Scores;
}

export type InsightKind =
  | "strength"
  | "growth"
  | "blind_spot"
  | "hidden_strength"
  | "alignment"
  | "spread"
  | "theme";

export interface Insight {
  kind: InsightKind;
  title: string;
  detail: string;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function mean(values: Array<number | null | undefined>): number | null {
  const nums = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (!nums.length) return null;
  return round1(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function stdev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(values.reduce((a, b) => a + (b - m) ** 2, 0) / values.length);
}

export function scaleMaxOf(question: Pick<CampaignQuestion, "scale">): number {
  const max = Number((question.scale as { max?: number } | null)?.max ?? 5);
  return Number.isFinite(max) && max > 0 ? max : 5;
}

/** Rating questions grouped into dimensions by competency label, else by prompt. */
export function buildDimensions(questions: CampaignQuestion[]): Dimension[] {
  const byKey = new Map<string, Dimension>();
  for (const q of questions) {
    if (q.type !== "rating") continue;
    const label = q.competency_label?.trim() || q.prompt.trim();
    const key = (q.competency_key?.trim() || label).toLowerCase();
    const existing = byKey.get(key);
    if (existing) existing.questionIds.push(q.id);
    else byKey.set(key, { key, label, max: scaleMaxOf(q), questionIds: [q.id] });
  }
  return [...byKey.values()];
}

/** One respondent's score per dimension: the mean of their answered ratings. */
export function scoreDimensions(
  dimensions: Dimension[],
  answersByQuestion: Record<string, ResponseAnswer | undefined>,
): Scores {
  const out: Scores = {};
  for (const d of dimensions)
    out[d.key] = mean(
      d.questionIds.map((id) => {
        const v = answersByQuestion[id]?.numeric_value;
        return v === null || v === undefined ? null : Number(v);
      }),
    );
  return out;
}

export interface TeamSummary {
  self: Scores;
  manager: Scores;
  overallSelf: number | null;
  overallManager: number | null;
  /** Share of self/manager rating pairs within one point of each other. */
  alignment: number | null;
  comparedPairs: number;
}

export function summariseTeam(dimensions: Dimension[], subjects: SubjectScores[]): TeamSummary {
  const self: Scores = {};
  const manager: Scores = {};
  let pairs = 0;
  let aligned = 0;
  for (const d of dimensions) {
    self[d.key] = mean(subjects.map((s) => s.self[d.key]));
    manager[d.key] = mean(subjects.map((s) => s.manager[d.key]));
    for (const s of subjects) {
      const a = s.self[d.key];
      const b = s.manager[d.key];
      if (a === null || a === undefined || b === null || b === undefined) continue;
      pairs += 1;
      if (Math.abs(a - b) <= 1) aligned += 1;
    }
  }
  return {
    self,
    manager,
    overallSelf: mean(Object.values(self)),
    overallManager: mean(Object.values(manager)),
    alignment: pairs ? Math.round((aligned / pairs) * 100) : null,
    comparedPairs: pairs,
  };
}

/** The view to judge strengths by: manager where present, else self. */
function primary(manager: Scores, self: Scores, key: string): number | null {
  return manager[key] ?? self[key] ?? null;
}

const list = (labels: string[]) =>
  labels.length <= 1 ? labels.join("") : `${labels.slice(0, -1).join(", ")} and ${labels.at(-1)}`;

/**
 * Insights for a group (team) or a single person. Thresholds are relative to
 * each dimension's scale so 1–5 and 1–10 questions behave the same way.
 */
export function deriveInsights(
  dimensions: Dimension[],
  self: Scores,
  manager: Scores,
  options: { subjects?: SubjectScores[]; audience: "team" | "person"; name?: string },
): Insight[] {
  const insights: Insight[] = [];
  const scored = dimensions
    .map((d) => ({ d, value: primary(manager, self, d.key) }))
    .filter((x): x is { d: Dimension; value: number } => x.value !== null);
  if (!scored.length) return insights;
  const who = options.audience === "team" ? "the team" : options.name ?? "this person";
  const Who = who.charAt(0).toUpperCase() + who.slice(1);
  const ratio = (x: { d: Dimension; value: number }) => x.value / x.d.max;
  const byRatio = [...scored].sort((a, b) => ratio(b) - ratio(a) || a.d.label.localeCompare(b.d.label));

  const strengths = byRatio.filter((x) => ratio(x) >= 0.7).slice(0, 2);
  if (strengths.length)
    insights.push({
      kind: "strength",
      title: `Strongest in ${list(strengths.map((x) => x.d.label))}`,
      detail: strengths.map((x) => `${x.d.label} ${x.value}/${x.d.max}`).join(" · "),
    });

  const growth = [...byRatio].reverse().filter((x) => ratio(x) <= 0.6 && !strengths.includes(x)).slice(0, 2);
  if (growth.length)
    insights.push({
      kind: "growth",
      title: `Room to grow in ${list(growth.map((x) => x.d.label))}`,
      detail: `The lowest-rated ${growth.length === 1 ? "area" : "areas"} for ${who}: ${growth
        .map((x) => `${x.d.label} ${x.value}/${x.d.max}`)
        .join(" · ")}.`,
    });

  const gaps = dimensions
    .map((d) => ({ d, self: self[d.key], manager: manager[d.key] }))
    .filter((g): g is { d: Dimension; self: number; manager: number } => g.self != null && g.manager != null)
    .map((g) => ({ ...g, gap: round1(g.self - g.manager) }));
  const threshold = (d: Dimension) => Math.max(1, d.max / 5);
  const blind = gaps.filter((g) => g.gap >= threshold(g.d)).sort((a, b) => b.gap - a.gap).slice(0, 2);
  if (blind.length)
    insights.push({
      kind: "blind_spot",
      title: `Possible blind ${blind.length === 1 ? "spot" : "spots"}: ${list(blind.map((g) => g.d.label))}`,
      detail: `${options.audience === "team" ? "Self-ratings run" : "Rated themselves"} higher than ${options.audience === "team" ? "managers'" : "their manager did"} — ${blind
        .map((g) => `${g.d.label} self ${g.self} vs manager ${g.manager}`)
        .join(" · ")}. Worth exploring with examples.`,
    });
  const hidden = gaps.filter((g) => -g.gap >= threshold(g.d)).sort((a, b) => a.gap - b.gap).slice(0, 2);
  if (hidden.length)
    insights.push({
      kind: "hidden_strength",
      title: `Hidden ${hidden.length === 1 ? "strength" : "strengths"}: ${list(hidden.map((g) => g.d.label))}`,
      detail: `${options.audience === "team" ? "Managers rate the team" : "Their manager rates them"} higher than ${options.audience === "team" ? "people rate themselves" : "they rate themselves"} — ${hidden
        .map((g) => `${g.d.label} manager ${g.manager} vs self ${g.self}`)
        .join(" · ")}. Say so in the conversation.`,
    });

  // For a team, compare each person's own self/manager pair; team averages
  // would smooth real disagreements away.
  const pairs =
    options.audience === "team" && options.subjects
      ? options.subjects.flatMap((s) =>
          dimensions
            .map((d) => ({ self: s.self[d.key], manager: s.manager[d.key] }))
            .filter((p): p is { self: number; manager: number } => p.self != null && p.manager != null)
            .map((p) => ({ gap: p.self - p.manager })),
        )
      : gaps;
  if (pairs.length >= 2) {
    const close = pairs.filter((g) => Math.abs(g.gap) <= 1).length;
    const pct = Math.round((close / pairs.length) * 100);
    insights.push({
      kind: "alignment",
      title:
        pct >= 80 ? "Self and manager views are well aligned" : pct >= 50 ? "Mostly aligned, with some differences" : "Self and manager views differ noticeably",
      detail:
        options.audience === "team"
          ? `${pct}% of individual self and manager ratings are within one point (${close} of ${pairs.length}).`
          : `${pct}% of areas are within one point of each other (${close} of ${pairs.length}).`,
    });
  }

  if (options.audience === "team" && options.subjects && options.subjects.length >= 3) {
    const spread = dimensions
      .map((d) => {
        const values = options.subjects!
          .map((s) => primary(s.manager, s.self, d.key))
          .filter((v): v is number => v !== null);
        return { d, values, sd: stdev(values) / d.max };
      })
      .filter((x) => x.values.length >= 3 && x.sd >= 0.2)
      .sort((a, b) => b.sd - a.sd)
      .slice(0, 1);
    for (const x of spread)
      insights.push({
        kind: "spread",
        title: `${x.d.label} varies a lot across ${who}`,
        detail: `Ratings range from ${Math.min(...x.values)} to ${Math.max(...x.values)} out of ${x.d.max}. Look at who is ahead here — they could support others.`,
      });
  }

  if (!insights.some((i) => i.kind === "strength" || i.kind === "growth"))
    insights.unshift({
      kind: "alignment",
      title: `${Who} rates steadily across all areas`,
      detail: "No area stands out as notably high or low. Use the written answers to find specifics.",
    });
  return insights;
}

const STOPWORDS = new Set(
  "a about above after again all also am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers him his how i if in into is it its itself just me more most my myself no nor not now of off on once only or other our ours out over own same she should so some such than that the their theirs them then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours yourself really things thing get got make made lot lots much many well good great work working team year time also able way need needs".split(
    " ",
  ),
);

/**
 * Recurring words across written answers, counted once per answer, so one long
 * answer can't dominate. Only words in at least two answers are returned.
 */
export function recurringThemes(texts: Array<string | null | undefined>, limit = 6): Array<{ term: string; count: number }> {
  const counts = new Map<string, number>();
  for (const text of texts) {
    if (!text) continue;
    const words = new Set(
      text
        .toLowerCase()
        .replace(/[’']/g, "")
        .split(/[^a-z]+/)
        .filter((w) => w.length >= 4 && !STOPWORDS.has(w)),
    );
    for (const w of words) counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([term, count]) => ({ term, count }));
}
