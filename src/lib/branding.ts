/** Organisation branding helpers — restrained V1 (logo + accent only). */

export const DEFAULT_BRAND_COLOR = "#0d9488";
export const PLATFORM_JADE = "#29a46c";

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function normalizeBrandColor(input: string | null | undefined): string | null {
  if (!input) return null;
  const raw = input.trim();
  if (!HEX_RE.test(raw)) return null;
  if (raw.length === 4) {
    const r = raw[1];
    const g = raw[2];
    const b = raw[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return raw.toLowerCase();
}

function relativeLuminance(hex: string): number {
  const n = normalizeBrandColor(hex);
  if (!n) return 0;
  const r = parseInt(n.slice(1, 3), 16) / 255;
  const g = parseInt(n.slice(3, 5), 16) / 255;
  const b = parseInt(n.slice(5, 7), 16) / 255;
  const lin = (c: number) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Accent safe for white foreground text (CTA buttons). Falls back to platform jade. */
export function accentForWhiteText(color: string | null | undefined): string {
  const hex = normalizeBrandColor(color) ?? DEFAULT_BRAND_COLOR;
  // Contrast ratio vs white ≥ ~4.5 ⇒ luminance ≤ ~0.18 for typical cases; keep margin.
  if (relativeLuminance(hex) > 0.22) return PLATFORM_JADE;
  return hex;
}

/** Quiet accent for borders / underlines — allow lighter org colours. */
export function accentBorder(color: string | null | undefined): string {
  return normalizeBrandColor(color) ?? DEFAULT_BRAND_COLOR;
}

export type OrgBranding = {
  name: string | null | undefined;
  logoUrl: string | null | undefined;
  brandColor: string | null | undefined;
};

export const LOGO_MAX_BYTES = 1024 * 1024;
export const LOGO_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);

export function logoExtension(mime: string): string | null {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    case "image/svg+xml":
      return "svg";
    default:
      return null;
  }
}
