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
  /** Planning price in pence. Never shown publicly and never charged. */
  indicativePrice: number;
  /**
   * Approved sale price in pence. Null until approved for sale; a pack cannot
   * be sold without one. VAT treatment comes from DOWNLOAD_SALES.vat.
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

/**
 * Every pack that will be offered as a document is listed here; absence means
 * "not planned". Approved scope: three England-only sector packs.
 */
export const DOWNLOADS: Readonly<Record<string, DownloadConfig>> = {
  "care-worker-appraisal-pack": comingSoon(),
  "eyfs-supervision-pack": comingSoon(),
  "childrens-home-appraisal-pack": comingSoon(),
};

function comingSoon(): DownloadConfig {
  return { status: "coming_soon", formats: ["docx", "pdf"], indicativePrice: 2499, price: null, currency: "gbp", documentRevision: 1, updated: "2026-10-18" };
}

/**
 * Sales boundaries shared by every document licence. UK buyers only: no EU OSS.
 * VAT stays unconfirmed until the seller's VAT status is checked, and nothing
 * can be sold while it is (see docs/marketplace-downloads.md, "VAT").
 */
export const DOWNLOAD_SALES = {
  /** ISO 3166-1 alpha-2 billing countries Checkout will accept. */
  countries: ["GB"] as const,
  vat: {
    /** Whether the seller is VAT-registered; null until confirmed. */
    sellerRegistered: null as boolean | null,
    /** Whether `price` includes VAT. Prices shown to consumers must; null until decided. */
    priceIncludesVat: null as boolean | null,
  },
};

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
 * Whether a download may be sold. False for every pack today: it needs an
 * "available" status, an approved price and a confirmed VAT position.
 */
export function isDownloadPurchasable(product: DownloadProduct | null, sales: typeof DOWNLOAD_SALES = DOWNLOAD_SALES): boolean {
  const vatConfirmed = sales.vat.sellerRegistered !== null && sales.vat.priceIncludesVat !== null;
  return Boolean(product && product.status === "available" && product.price !== null && product.formats.length > 0 && vatConfirmed);
}

/** Version label printed on documents, e.g. "v2.1" = pack version 2, document revision 1. */
export function documentVersionLabel(product: DownloadProduct): string {
  return `v${product.packVersion}.${product.documentRevision}`;
}

/** Checkout metadata kind for a future document purchase; distinct from "template_pack". */
export const DOWNLOAD_PURCHASE_KIND = "template_download" as const;
