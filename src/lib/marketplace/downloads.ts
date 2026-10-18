/**
 * Downloadable document licences (Word + PDF), a second product on the same
 * catalogue. Questions, versions, nations and regulatory basis always come from
 * the TemplatePack; this file only says whether and how a pack is offered as a
 * document. Nothing here is purchasable yet: see docs/marketplace-downloads.md.
 */
import type { TemplatePack } from "./types";

export type DownloadFormat = "docx" | "pdf";
export type DownloadStatus = "coming_soon" | "available" | "retired";

/** The two licences a pack can be sold under. They never grant each other. */
export type LicenceType = "interactive" | "download";

export interface DownloadConfig {
  status: DownloadStatus;
  formats: DownloadFormat[];
  /**
   * Price in pence, excluding VAT. Null until a price is approved; a pack
   * cannot become "available" without one.
   */
  price: number | null;
  currency: "gbp";
  /**
   * Layout/wording revision of the document itself. Bumps when the document
   * changes without a pack version change (e.g. a typo or layout fix).
   */
  documentRevision: number;
  /** ISO date the document revision was last updated. */
  updated: string;
}

/** Every pack that will be offered as a document is listed here; absence means "not planned". */
export const DOWNLOADS: Readonly<Record<string, DownloadConfig>> = {
  "annual-appraisal-pack": comingSoon(),
  "probation-review-pack": comingSoon(),
  "engineering-ladder-pack": comingSoon(),
  "sales-performance-pack": comingSoon(),
  "care-worker-appraisal-pack": comingSoon(),
  "childrens-home-appraisal-pack": comingSoon(),
  "eyfs-supervision-pack": comingSoon(),
  "smcr-fitness-propriety-pack": comingSoon(),
  "social-housing-competence-pack": comingSoon(),
  // leadership-360-pack is deliberately absent: anonymous 360 feedback relies on
  // the software's aggregation and thresholds, which a paper form can't provide.
};

function comingSoon(): DownloadConfig {
  return { status: "coming_soon", formats: ["docx", "pdf"], price: null, currency: "gbp", documentRevision: 1, updated: "2026-10-18" };
}

/** A pack's document product, with the version it is generated from. */
export interface DownloadProduct extends DownloadConfig {
  packSlug: string;
  /** Always the pack's current version; documents are regenerated on each pack update. */
  packVersion: number;
}

export function downloadFor(pack: TemplatePack): DownloadProduct | null {
  const config = DOWNLOADS[pack.slug];
  return config ? { ...config, packSlug: pack.slug, packVersion: pack.version } : null;
}

/**
 * Whether a download may be sold. False for every pack today; also false for
 * any pack without an approved price, whatever its status says.
 */
export function isDownloadPurchasable(product: DownloadProduct | null): boolean {
  return Boolean(product && product.status === "available" && product.price !== null && product.formats.length > 0);
}

/** Version label printed on documents, e.g. "v2.1" = pack version 2, document revision 1. */
export function documentVersionLabel(product: DownloadProduct): string {
  return `v${product.packVersion}.${product.documentRevision}`;
}

/** Checkout metadata kind for a future document purchase; distinct from "template_pack". */
export const DOWNLOAD_PURCHASE_KIND = "template_download" as const;
