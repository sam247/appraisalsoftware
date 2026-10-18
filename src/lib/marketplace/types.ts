export type PackAccent = "jade" | "amber" | "blue" | "rose" | "teal";
export type PackCampaignType = "annual_appraisal" | "feedback_360";
export type PackGroup = "Review types" | "Roles & teams" | "Health & social care" | "Children & education" | "Financial services" | "Housing";
export type Nation = "England" | "Scotland" | "Wales" | "Northern Ireland";

export const UK: Nation[] = ["England", "Scotland", "Wales", "Northern Ireland"];
export const ENGLAND: Nation[] = ["England"];

export interface PackQuestion {
  type: "rating" | "text";
  prompt: string;
  help?: string;
  /** Competency for rating questions — drives the results radar. */
  area?: string;
  required?: boolean;
  scale?: { min_label: string; max_label: string };
}

export interface PackChange {
  version: number;
  /** ISO date the version was published. */
  date: string;
  summary: string;
}

export interface TemplatePack {
  slug: string;
  name: string;
  category: string;
  group: PackGroup;
  summary: string;
  benefits: string[];
  /**
   * What the pack is designed to support, for sector packs. Always phrased as
   * support, never as compliance; shown with REGULATORY_DISCLAIMER.
   */
  basis?: string;
  /** Search title for the public product page; sector packs only. */
  seoTitle?: string;
  /** UK nations the content is written for. */
  nations: Nation[];
  /** ISO date the content was last checked against its sources. */
  reviewed: string;
  /** Owners get every later version free; installing one adds a new template. */
  version: number;
  changelog: PackChange[];
  minutes: number;
  price: number;
  includedWithPro: boolean;
  campaignType: PackCampaignType;
  accent: PackAccent;
  questions: PackQuestion[];
}
