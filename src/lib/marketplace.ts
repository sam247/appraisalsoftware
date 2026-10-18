/**
 * Template marketplace catalogue. First-party packs, versioned in code so the
 * questions a workspace installs are reviewable like any other change.
 * Prices are in pence and exclude VAT. Pack data lives in ./marketplace/packs.
 */
import type { CampaignQuestion } from "@/lib/types/database";
import { carePacks } from "./marketplace/packs/care";
import { childrenPacks } from "./marketplace/packs/children";
import { financialPacks } from "./marketplace/packs/financial";
import { generalPacks } from "./marketplace/packs/general";
import { housingPacks } from "./marketplace/packs/housing";
import { AGREE } from "./marketplace/scales";
import type { PackGroup, PackQuestion, TemplatePack } from "./marketplace/types";

export type { Nation, PackAccent, PackCampaignType, PackChange, PackGroup, PackQuestion, TemplatePack } from "./marketplace/types";

export const packs: TemplatePack[] = [...generalPacks, ...carePacks, ...childrenPacks, ...financialPacks, ...housingPacks];

/** Shown wherever a pack's regulatory basis appears. */
export const REGULATORY_DISCLAIMER =
  "Not a substitute for your organisation's regulatory obligations or legal advice. Buying or completing this template does not by itself demonstrate compliance.";

export const UPDATES_NOTE = "Includes future updates to this pack. Updates are added as a new template version; your past reviews never change.";

export const GROUP_ORDER: PackGroup[] = ["Review types", "Roles & teams", "Health & social care", "Children & education", "Financial services", "Housing"];

export const groups = GROUP_ORDER.map((name) => ({ name, count: packs.filter((p) => p.group === name).length })).filter((g) => g.count > 0);

/** Heading for written questions, which have no competency area. */
export const WRITTEN_SECTION = "Reflection and next steps";

export interface QuestionSection {
  title: string;
  /** Competency area for rating sections; null for written questions. */
  area: string | null;
  questions: { number: number; question: PackQuestion }[];
}

/**
 * The pack's questions grouped by competency area. Groups are consecutive runs,
 * so the pack's order is never changed and numbering stays 1..n.
 */
export function questionSections(pack: TemplatePack): QuestionSection[] {
  const sections: QuestionSection[] = [];
  pack.questions.forEach((question, i) => {
    const area = question.type === "rating" ? (question.area ?? "General") : null;
    const title = area ?? WRITTEN_SECTION;
    const last = sections.at(-1);
    if (last && last.title === title && last.area === area) last.questions.push({ number: i + 1, question });
    else sections.push({ title, area, questions: [{ number: i + 1, question }] });
  });
  return sections;
}

/** Who completes the pack, e.g. "Adult social care · Self and manager appraisal". */
export function packAudience(pack: TemplatePack): string {
  return `${pack.category} · ${pack.campaignType === "feedback_360" ? "Anonymous 360 feedback" : "Self and manager appraisal"}`;
}

/** Public product page for a pack on the marketing site. */
export function packPublicPath(slug: string): string {
  return `/marketplace/${slug}`;
}

/**
 * Sector packs get indexable product pages. General packs stay noindex so they
 * don't compete with the free template pages that own those queries
 * (docs/seo/url-ownership.md).
 */
export function isIndexablePack(pack: TemplatePack): boolean {
  return Boolean(pack.basis);
}

/** Where the pack's content is written for, e.g. "England" or "UK-wide". */
export function nationsLabel(pack: TemplatePack): string {
  return pack.nations.length === 4 ? "UK-wide" : pack.nations.join(", ");
}
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
    // v1 keys predate versioning; later versions get their own so answers never mix.
    stable_key: pack.version > 1 ? `${pack.slug}@v${pack.version}:${i}` : `${pack.slug}:${i}`,
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
