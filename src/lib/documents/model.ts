/**
 * Format-neutral appraisal document built from a TemplatePack. The Word and PDF
 * renderers both consume this, so questions, order, scales and version details
 * have one source: the pack itself.
 */
import { nationsLabel, packAudience, questionSections, REGULATORY_DISCLAIMER, WRITTEN_SECTION } from "../marketplace";
import { documentVersionLabel, type DownloadProduct } from "../marketplace/downloads";
import { AGREE } from "../marketplace/scales";
import type { TemplatePack } from "../marketplace/types";

export const BRAND = "Appraisal Software";
/** Scale for rating questions that don't set their own; matches packTemplateQuestions. */
export const DEFAULT_SCALE = AGREE;
export { WRITTEN_SECTION };

export interface DocumentQuestion {
  /** 1-based position in the pack; never renumbered. */
  number: number;
  type: "rating" | "text";
  prompt: string;
  help: string | null;
  required: boolean;
  scale: { min_label: string; max_label: string } | null;
}

export interface DocumentSection {
  title: string;
  /** Competency area for rating sections; null for written reflection. */
  area: string | null;
  questions: DocumentQuestion[];
}

export interface AppraisalDocument {
  slug: string;
  title: string;
  /** Who completes it and for which sector, e.g. "Adult social care · Self and manager appraisal". */
  audience: string;
  summary: string;
  basis: string | null;
  disclaimer: string;
  nations: string;
  reviewed: string;
  /** e.g. "v2.1": pack version 2, document revision 1. */
  versionLabel: string;
  packVersion: number;
  documentRevision: number;
  /** Distinct rating scales used, in first-use order, for the scale key. */
  scales: { min_label: string; max_label: string }[];
  /** Record details printed at the top of the form. */
  recordFields: string[];
  sections: DocumentSection[];
  /** Closing sections common to every pack. */
  planning: { objectives: string[]; actions: string[] };
  signOff: string[];
  footer: string;
  metadata: { title: string; subject: string; keywords: string[]; creator: string; language: "en-GB" };
}

/** Reviewed date as printed, e.g. "18 October 2026". */
export function printedDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

export function buildAppraisalDocument(pack: TemplatePack, product: DownloadProduct): AppraisalDocument {
  if (product.packSlug !== pack.slug || product.packVersion !== pack.version) throw new Error("Download product does not match pack");

  const toDocument = (number: number, q: TemplatePack["questions"][number]): DocumentQuestion => ({
    number,
    type: q.type,
    prompt: q.prompt,
    help: q.help ?? null,
    required: q.required ?? true,
    scale: q.type === "rating" ? (q.scale ?? DEFAULT_SCALE) : null,
  });
  const sections: DocumentSection[] = questionSections(pack).map((s) => ({
    title: s.title,
    area: s.area,
    questions: s.questions.map(({ number, question }) => toDocument(number, question)),
  }));
  const questions = sections.flatMap((s) => s.questions);

  const scales: AppraisalDocument["scales"] = [];
  for (const q of questions)
    if (q.scale && !scales.some((s) => s.min_label === q.scale!.min_label && s.max_label === q.scale!.max_label)) scales.push(q.scale);

  const versionLabel = documentVersionLabel(product);

  return {
    slug: pack.slug,
    title: pack.name,
    audience: packAudience(pack),
    summary: pack.summary,
    basis: pack.basis ?? null,
    disclaimer: REGULATORY_DISCLAIMER,
    nations: nationsLabel(pack),
    reviewed: printedDate(pack.reviewed),
    versionLabel,
    packVersion: product.packVersion,
    documentRevision: product.documentRevision,
    scales,
    recordFields: ["Employee name", "Job title", "Reviewer name", "Review date"],
    sections,
    planning: {
      objectives: ["Development objective", "Support needed", "How we'll know"],
      actions: ["Agreed action", "Owner", "By when"],
    },
    signOff: ["Employee", "Reviewer"],
    footer: `${BRAND} · ${pack.name} · ${versionLabel}`,
    metadata: {
      title: `${pack.name} (${versionLabel})`,
      subject: pack.summary,
      keywords: [pack.category, "appraisal", "template", ...new Set(pack.questions.map((q) => q.area).filter((a): a is string => Boolean(a)))],
      creator: BRAND,
      language: "en-GB",
    },
  };
}

/** Every question in document order; equals the pack's own order by construction. */
export function documentQuestions(doc: AppraisalDocument): DocumentQuestion[] {
  return doc.sections.flatMap((s) => s.questions);
}
