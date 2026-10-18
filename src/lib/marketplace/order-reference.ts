/**
 * Order references for document purchases, e.g. "AS-D-7KQ2-M9XH-3TPW". They go
 * in purchase records, Stripe descriptions, receipts and emails so buyers and
 * support can find an order. Never put them in generated documents: files are
 * identical for every buyer and identify only their pack and version.
 */
import { randomInt } from "node:crypto";

/** Crockford base32: no I, L, O or U, so references survive being read aloud or retyped. */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const PREFIX = "AS-D";
const GROUPS = 3;
const GROUP_LENGTH = 4;

export function newOrderReference(): string {
  const groups = Array.from({ length: GROUPS }, () => Array.from({ length: GROUP_LENGTH }, () => ALPHABET[randomInt(ALPHABET.length)]).join(""));
  return [PREFIX, ...groups].join("-");
}

const PATTERN = new RegExp(`^${PREFIX}(?:-[${ALPHABET}]{${GROUP_LENGTH}}){${GROUPS}}$`);

/** Accepts what a buyer might type: any case, spaces instead of hyphens, O/I/L for 0/1/1. */
export function normaliseOrderReference(input: string): string | null {
  const cleaned = input.trim().toUpperCase().replace(/\s+/g, "-").replace(/O/g, "0").replace(/[IL]/g, "1");
  return PATTERN.test(cleaned) ? cleaned : null;
}
