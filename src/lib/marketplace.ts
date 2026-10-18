/**
 * Template marketplace catalogue. First-party packs, versioned in code so the
 * questions a workspace installs are reviewable like any other change.
 * Prices are in pence and exclude VAT.
 */
import type { CampaignQuestion } from "@/lib/types/database";

export type PackAccent = "jade" | "amber" | "blue" | "rose" | "teal";
export type PackCampaignType = "annual_appraisal" | "feedback_360";

export interface PackQuestion {
  type: "rating" | "text";
  prompt: string;
  help?: string;
  /** Competency for rating questions — drives the results radar. */
  area?: string;
  required?: boolean;
  scale?: { min_label: string; max_label: string };
}

export interface TemplatePack {
  slug: string;
  name: string;
  category: string;
  summary: string;
  benefits: string[];
  minutes: number;
  price: number;
  includedWithPro: boolean;
  campaignType: PackCampaignType;
  accent: PackAccent;
  questions: PackQuestion[];
}

const AGREE = { min_label: "Rarely", max_label: "Consistently" };
const LEVEL = { min_label: "Not yet", max_label: "Role model" };

export const packs: TemplatePack[] = [
  {
    slug: "annual-appraisal-pack",
    name: "Annual Appraisal Pack",
    category: "Annual reviews",
    summary: "A complete self and manager appraisal built around five competencies, with rating guidance and development prompts.",
    benefits: ["Self and manager answer the same questions", "Five competencies with clear rating anchors", "Run it as a campaign in one click"],
    minutes: 12,
    price: 4900,
    includedWithPro: true,
    campaignType: "annual_appraisal",
    accent: "jade",
    questions: [
      { type: "rating", area: "Delivery", prompt: "How consistently were agreed objectives delivered this year?", help: "Think about outcomes, not effort. 3 means fully met.", scale: { min_label: "Rarely", max_label: "Always, and beyond" } },
      { type: "rating", area: "Delivery", prompt: "How well was work planned so deadlines were met without last-minute pressure?", scale: AGREE },
      { type: "rating", area: "Quality", prompt: "How reliable was the quality of work, first time?", scale: AGREE },
      { type: "rating", area: "Quality", prompt: "How well were problems spotted early and raised before they grew?", scale: AGREE },
      { type: "rating", area: "Communication", prompt: "How clearly were progress, risks and decisions communicated?", scale: AGREE },
      { type: "rating", area: "Communication", prompt: "How well were other people's views listened to and built on?", scale: AGREE },
      { type: "rating", area: "Collaboration", prompt: "How effectively was work shared and others supported to succeed?", scale: AGREE },
      { type: "rating", area: "Collaboration", prompt: "How constructively were disagreements handled?", scale: AGREE },
      { type: "rating", area: "Growth", prompt: "How actively were new skills learned and applied?", scale: AGREE },
      { type: "rating", area: "Growth", prompt: "How openly was feedback sought and acted on?", scale: AGREE },
      { type: "text", prompt: "Which piece of work are you proudest of this year, and why?", help: "One specific example is more useful than a list." },
      { type: "text", prompt: "What got in the way of doing your best work?", required: false },
      { type: "text", prompt: "Which objectives were not fully met, and what would help next time?" },
      { type: "text", prompt: "What is the most valuable thing to keep doing?" },
      { type: "text", prompt: "What one change would make the biggest difference next year?" },
      { type: "text", prompt: "Which skills should be the focus for development, and how?" },
      { type: "text", prompt: "What support is needed from the manager or the wider team?", required: false },
      { type: "text", prompt: "Proposed objectives for the next review period.", help: "Aim for three to five, each with a measure of success." },
    ],
  },
  {
    slug: "probation-review-pack",
    name: "Probation Review Pack",
    category: "Probation",
    summary: "A structured end-of-probation review that makes the pass, extend or end decision clear, fair and documented.",
    benefits: ["Settling-in, capability and conduct covered", "Clear pass, extend or end recommendation", "Agreed actions recorded with the review"],
    minutes: 8,
    price: 2900,
    includedWithPro: true,
    campaignType: "annual_appraisal",
    accent: "amber",
    questions: [
      { type: "rating", area: "Role knowledge", prompt: "How well have the core responsibilities of the role been understood?", scale: LEVEL },
      { type: "rating", area: "Role knowledge", prompt: "How independently can day-to-day work now be completed?", scale: LEVEL },
      { type: "rating", area: "Quality of work", prompt: "How accurate and reliable is the work produced?", scale: LEVEL },
      { type: "rating", area: "Quality of work", prompt: "How well are instructions and processes followed?", scale: LEVEL },
      { type: "rating", area: "Working with others", prompt: "How well have relationships been built with the team?", scale: LEVEL },
      { type: "rating", area: "Conduct", prompt: "How consistently are attendance, timekeeping and company standards met?", scale: LEVEL },
      { type: "rating", area: "Learning", prompt: "How quickly has new knowledge been picked up and applied?", scale: LEVEL },
      { type: "text", prompt: "What has gone well since starting?" },
      { type: "text", prompt: "What has been harder than expected?" },
      { type: "text", prompt: "Was the induction and training sufficient? What was missing?", required: false },
      { type: "text", prompt: "What support would help over the next three months?" },
      { type: "text", prompt: "Any concerns that need to be resolved?", required: false },
      { type: "text", prompt: "Recommendation: pass, extend or end probation — and why.", help: "Managers: state the outcome and the evidence behind it." },
      { type: "text", prompt: "Agreed actions and objectives for the next period." },
    ],
  },
  {
    slug: "leadership-360-pack",
    name: "Leadership 360",
    category: "360 feedback",
    summary: "Anonymous feedback on how a manager sets direction, develops people and builds trust.",
    benefits: ["Peers, reports and managers in one cycle", "Six leadership behaviours", "Prompts that feed a development plan"],
    minutes: 10,
    price: 5900,
    includedWithPro: false,
    campaignType: "feedback_360",
    accent: "blue",
    questions: [
      { type: "rating", area: "Direction", prompt: "Sets a clear direction so people know what matters most.", scale: AGREE },
      { type: "rating", area: "Direction", prompt: "Explains the reasons behind decisions.", scale: AGREE },
      { type: "rating", area: "Developing people", prompt: "Gives useful, timely feedback.", scale: AGREE },
      { type: "rating", area: "Developing people", prompt: "Creates opportunities for people to grow.", scale: AGREE },
      { type: "rating", area: "Trust", prompt: "Follows through on commitments.", scale: AGREE },
      { type: "rating", area: "Trust", prompt: "Makes it safe to raise problems and disagree.", scale: AGREE },
      { type: "rating", area: "Delegation", prompt: "Delegates meaningful work and trusts people to deliver.", scale: AGREE },
      { type: "rating", area: "Communication", prompt: "Keeps people informed about changes that affect them.", scale: AGREE },
      { type: "rating", area: "Communication", prompt: "Listens before responding.", scale: AGREE },
      { type: "rating", area: "Composure", prompt: "Stays calm and constructive under pressure.", scale: AGREE },
      { type: "rating", area: "Composure", prompt: "Treats everyone fairly and with respect.", scale: AGREE },
      { type: "text", prompt: "What does this person do that you would like them to keep doing?" },
      { type: "text", prompt: "What would make them a more effective leader?" },
      { type: "text", prompt: "Describe a moment when their leadership made a real difference.", required: false },
      { type: "text", prompt: "What should they start doing?", required: false },
      { type: "text", prompt: "Anything else they would benefit from hearing?", required: false },
    ],
  },
  {
    slug: "engineering-ladder-pack",
    name: "Engineering Career Ladder",
    category: "Engineering",
    summary: "An appraisal mapped to engineering expectations — technical depth, delivery, collaboration and influence.",
    benefits: ["Expectations engineers recognise", "Technical and collaboration skills together", "A clear promotion-readiness signal"],
    minutes: 15,
    price: 6900,
    includedWithPro: false,
    campaignType: "annual_appraisal",
    accent: "teal",
    questions: [
      { type: "rating", area: "Technical depth", prompt: "Writes code that is clear, tested and easy for others to change.", scale: LEVEL },
      { type: "rating", area: "Technical depth", prompt: "Understands the systems they work in, including their failure modes.", scale: LEVEL },
      { type: "rating", area: "Technical depth", prompt: "Makes sound design decisions and explains the trade-offs.", scale: LEVEL },
      { type: "rating", area: "Delivery", prompt: "Breaks work down and delivers in small, safe increments.", scale: LEVEL },
      { type: "rating", area: "Delivery", prompt: "Estimates realistically and flags slippage early.", scale: LEVEL },
      { type: "rating", area: "Delivery", prompt: "Owns problems in production through to resolution.", scale: LEVEL },
      { type: "rating", area: "Collaboration", prompt: "Gives thoughtful, kind code reviews.", scale: LEVEL },
      { type: "rating", area: "Collaboration", prompt: "Works effectively with product, design and other teams.", scale: LEVEL },
      { type: "rating", area: "Influence", prompt: "Shares knowledge through docs, talks or pairing.", scale: LEVEL },
      { type: "rating", area: "Influence", prompt: "Improves how the team works, not just what it ships.", scale: LEVEL },
      { type: "rating", area: "Influence", prompt: "Mentors others and raises the bar around them.", scale: LEVEL },
      { type: "rating", area: "Product sense", prompt: "Understands the user problem behind the work.", scale: LEVEL },
      { type: "text", prompt: "What was the most significant technical contribution this year?" },
      { type: "text", prompt: "Describe a hard problem and how it was approached.", required: false },
      { type: "text", prompt: "Where has influence beyond your own work grown?" },
      { type: "text", prompt: "Which technical areas should be deepened next?" },
      { type: "text", prompt: "What is the gap to the next level, in your own words?" },
      { type: "text", prompt: "Manager: is this person operating at the next level? What evidence supports that?", required: false },
      { type: "text", prompt: "What support or opportunities would accelerate growth?" },
      { type: "text", prompt: "Objectives for the next review period." },
    ],
  },
  {
    slug: "sales-performance-pack",
    name: "Sales Performance Review",
    category: "Sales",
    summary: "Balances the numbers with the behaviours behind them: pipeline, customer focus and coaching.",
    benefits: ["Results and behaviours side by side", "Pipeline health prompts", "A coaching plan for next quarter"],
    minutes: 10,
    price: 4900,
    includedWithPro: false,
    campaignType: "annual_appraisal",
    accent: "rose",
    questions: [
      { type: "rating", area: "Results", prompt: "How consistently was quota achieved over the period?", scale: { min_label: "Well below", max_label: "Well above" } },
      { type: "rating", area: "Pipeline", prompt: "How healthy and accurate is the pipeline?", scale: LEVEL },
      { type: "rating", area: "Pipeline", prompt: "How well is time prioritised towards the best opportunities?", scale: LEVEL },
      { type: "rating", area: "Customer focus", prompt: "How well are customer needs uncovered before proposing a solution?", scale: LEVEL },
      { type: "rating", area: "Customer focus", prompt: "How strong are relationships with key accounts?", scale: LEVEL },
      { type: "rating", area: "Craft", prompt: "How effectively are objections handled?", scale: LEVEL },
      { type: "rating", area: "Craft", prompt: "How well are deals negotiated and closed without unnecessary discounting?", scale: LEVEL },
      { type: "rating", area: "Teamwork", prompt: "How well is knowledge shared with the team?", scale: LEVEL },
      { type: "rating", area: "Discipline", prompt: "How reliably is the CRM kept up to date?", scale: LEVEL },
      { type: "text", prompt: "Which win are you proudest of, and what made it work?" },
      { type: "text", prompt: "Which deal was lost that you learned the most from?" },
      { type: "text", prompt: "Where does the pipeline need attention next quarter?" },
      { type: "text", prompt: "Which skills would most improve results?" },
      { type: "text", prompt: "What support is needed from marketing, product or management?", required: false },
      { type: "text", prompt: "Coaching plan and targets for next quarter." },
    ],
  },
];

export const categories = [...new Set(packs.map((p) => p.category))].map((name) => ({
  name,
  count: packs.filter((p) => p.category === name).length,
}));

export function packBySlug(slug: string): TemplatePack | undefined {
  return packs.find((p) => p.slug === slug);
}

export function formatPackPrice(pence: number): string {
  return `£${(pence / 100).toFixed(0)}`;
}

/** Rows for public.template_questions when a pack is installed. */
export function packTemplateQuestions(pack: TemplatePack) {
  return pack.questions.map((q, i) => ({
    sort_order: i,
    type: q.type,
    prompt: q.prompt,
    help_text: q.help ?? null,
    required: q.required ?? true,
    options: [],
    scale: q.type === "rating" ? { min: 1, max: 5, ...(q.scale ?? AGREE) } : {},
    stable_key: `${pack.slug}:${i}`,
    competency_key: q.area ? q.area.toLowerCase().replace(/[^a-z0-9]+/g, "-") : null,
    competency_label: q.area ?? null,
    section_key: null,
    section_label: null,
  }));
}

/** The first questions of a pack in the respondent preview's shape. */
export function previewQuestions(pack: TemplatePack, count = 2): CampaignQuestion[] {
  return packTemplateQuestions(pack)
    .slice(0, count)
    .map((q, i) => ({
      ...q,
      id: `${pack.slug}-preview-${i}`,
      campaign_id: "marketplace-preview",
      organization_id: "marketplace-preview",
      source_template_question_id: null,
      created_at: "2026-01-01T00:00:00.000Z",
    })) as CampaignQuestion[];
}

export type PackAccess = "owned" | "included" | "available" | "needs_pro";

/**
 * What a workspace can do with a pack. Purchases are permanent; Pro and
 * Organisation (and early-access) include some packs; 360 packs need a plan
 * that can run anonymous 360 feedback.
 */
export function packAccess(pack: TemplatePack, plan: string, purchased: ReadonlySet<string>): PackAccess {
  const paidPlan = plan === "pro" || plan === "organisation" || plan === "legacy";
  if (purchased.has(pack.slug)) return pack.campaignType === "feedback_360" && !paidPlan ? "needs_pro" : "owned";
  if (pack.includedWithPro && paidPlan) return "included";
  if (pack.campaignType === "feedback_360" && !paidPlan) return "needs_pro";
  return "available";
}
