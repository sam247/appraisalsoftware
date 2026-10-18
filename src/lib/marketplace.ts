/**
 * Template marketplace catalogue (design preview). Packs are first-party and
 * illustrative until purchasing ships; prices exclude VAT.
 */
import type { CampaignQuestion } from "@/lib/types/database";

export type PackAccent = "jade" | "amber" | "blue" | "rose" | "teal";

export interface TemplatePack {
  slug: string;
  name: string;
  category: string;
  summary: string;
  benefits: string[];
  questions: number;
  minutes: number;
  /** Pence, excluding VAT. */
  price: number;
  includedWithPro: boolean;
  author: string;
  accent: PackAccent;
  sample: Array<Pick<CampaignQuestion, "type" | "prompt" | "help_text" | "scale" | "competency_label">>;
}

export const packs: TemplatePack[] = [
  {
    slug: "annual-appraisal-pack",
    name: "Annual Appraisal Pack",
    category: "Annual reviews",
    summary: "A complete self and manager appraisal built around five competencies, with rating guidance and development prompts.",
    benefits: [
      "Self and manager forms that mirror each other",
      "Five competencies with clear rating descriptors",
      "Run it as a campaign in one click",
    ],
    questions: 18,
    minutes: 12,
    price: 4900,
    includedWithPro: true,
    author: "Appraisal Software",
    accent: "jade",
    sample: [
      {
        type: "rating",
        prompt: "How consistently did you deliver on your agreed objectives this year?",
        help_text: "Think about outcomes, not effort. 3 means fully met.",
        scale: { min: 1, max: 5, min_label: "Rarely", max_label: "Always, and beyond" },
        competency_label: "Delivery",
      },
      {
        type: "text",
        prompt: "Which piece of work are you proudest of, and why?",
        help_text: "One specific example is more useful than a list.",
        scale: {},
        competency_label: "Reflection",
      },
    ],
  },
  {
    slug: "probation-review-pack",
    name: "Probation Review Pack",
    category: "Probation",
    summary: "Structured 1, 3 and 6-month check-ins that make the pass, extend or end decision clear and fair.",
    benefits: ["Three check-in forms that build on each other", "Clear pass, extend or end recommendation", "Manager notes kept with the record"],
    questions: 14,
    minutes: 8,
    price: 2900,
    includedWithPro: true,
    author: "Appraisal Software",
    accent: "amber",
    sample: [],
  },
  {
    slug: "leadership-360-pack",
    name: "Leadership 360",
    category: "360 feedback",
    summary: "Anonymous feedback on how a manager sets direction, develops people and builds trust.",
    benefits: ["Peers, reports and managers in one cycle", "Six leadership behaviours", "Prompts for a development plan"],
    questions: 16,
    minutes: 10,
    price: 5900,
    includedWithPro: false,
    author: "Appraisal Software",
    accent: "blue",
    sample: [],
  },
  {
    slug: "engineering-ladder-pack",
    name: "Engineering Career Ladder",
    category: "Engineering",
    summary: "Appraisal mapped to a four-level engineering ladder, from junior to staff.",
    benefits: ["Level-specific expectations", "Technical and collaboration skills", "Promotion readiness signal"],
    questions: 20,
    minutes: 15,
    price: 6900,
    includedWithPro: false,
    author: "Appraisal Software",
    accent: "teal",
    sample: [],
  },
  {
    slug: "sales-performance-pack",
    name: "Sales Performance Review",
    category: "Sales",
    summary: "Balances numbers with the behaviours behind them: pipeline, customer focus and coaching.",
    benefits: ["Quota and behaviour together", "Pipeline health prompts", "Coaching plan for next quarter"],
    questions: 15,
    minutes: 10,
    price: 4900,
    includedWithPro: false,
    author: "Appraisal Software",
    accent: "rose",
    sample: [],
  },
];

export const categories = [
  { name: "Annual reviews", count: 6 },
  { name: "Probation", count: 3 },
  { name: "360 feedback", count: 5 },
  { name: "Engineering", count: 4 },
  { name: "Sales", count: 3 },
  { name: "Healthcare", count: 2 },
  { name: "Hospitality & retail", count: 3 },
  { name: "Leadership", count: 4 },
];

export function formatPackPrice(pence: number): string {
  return `£${(pence / 100).toFixed(0)}`;
}

/** Turn a pack's sample questions into the respondent preview's question shape. */
export function previewQuestions(pack: TemplatePack): CampaignQuestion[] {
  return pack.sample.map((q, i) => ({
    id: `${pack.slug}-preview-${i}`,
    campaign_id: "marketplace-preview",
    organization_id: "marketplace-preview",
    sort_order: i,
    type: q.type,
    prompt: q.prompt,
    help_text: q.help_text,
    required: true,
    options: [],
    scale: q.scale,
    stable_key: null,
    competency_key: null,
    competency_label: q.competency_label,
    section_key: null,
    section_label: null,
    source_template_question_id: null,
    created_at: "2026-01-01T00:00:00.000Z",
  })) as CampaignQuestion[];
}
