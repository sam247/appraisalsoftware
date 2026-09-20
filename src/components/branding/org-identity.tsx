"use client";

import { BrandMark } from "@/components/home/Logo";
import { accentBorder } from "@/lib/branding";

export function OrgIdentityHeader({
  orgName,
  logoUrl,
  brandColor,
  size = 48,
}: {
  orgName?: string | null;
  logoUrl?: string | null;
  brandColor?: string | null;
  size?: number;
}) {
  const accent = accentBorder(brandColor);
  const name = orgName?.trim();

  return (
    <div className="space-y-3">
      {logoUrl?.trim() ? (
        // eslint-disable-next-line @next/next/no-img-element -- org-uploaded remote URLs vary by storage host
        <img
          src={logoUrl}
          alt={name ? `${name} logo` : "Organisation logo"}
          style={{ maxHeight: size, maxWidth: size * 3 }}
          className="object-contain object-left"
        />
      ) : (
        <BrandMark size={size} />
      )}
      {name ? (
        <p
          className="text-sm font-medium tracking-wide"
          style={{ color: accent }}
        >
          {name}
        </p>
      ) : null}
    </div>
  );
}

export function PlatformFooter({ quiet = false }: { quiet?: boolean }) {
  return (
    <p
      className={
        quiet
          ? "text-[11px] text-muted-foreground/80"
          : "text-xs text-muted-foreground"
      }
    >
      Powered by Appraisal Software
    </p>
  );
}

/** Results report masthead — organisation artefact, platform quiet. */
export function ResultsBrandMasthead({
  orgName,
  logoUrl,
}: {
  orgName: string;
  logoUrl?: string | null;
}) {
  return (
    <div className="mb-4 flex items-center gap-3 border-b border-border pb-3">
      {logoUrl?.trim() ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={`${orgName} logo`}
          className="h-8 max-w-[9rem] object-contain object-left"
        />
      ) : (
        <BrandMark size={28} />
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{orgName}</p>
        <p className="text-[11px] text-muted-foreground">
          Powered by Appraisal Software
        </p>
      </div>
    </div>
  );
}
