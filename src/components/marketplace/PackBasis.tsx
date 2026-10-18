import { nationsLabel, REGULATORY_DISCLAIMER, type TemplatePack } from "@/lib/marketplace";
import { MapPin, Scale } from "lucide-react";

/** What a sector pack is designed to support, where it applies, and its limits. */
export function PackBasis({ pack, compact = false }: { pack: TemplatePack; compact?: boolean }) {
  if (!pack.basis) return null;
  if (compact) {
    return (
      <div className="text-xs leading-relaxed text-muted-foreground">
        <p className="flex items-start gap-1.5">
          <Scale className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
          <span className="line-clamp-2">{pack.basis}</span>
        </p>
        <p className="mt-1 pl-5">{nationsLabel(pack)} · Not a substitute for your regulatory obligations.</p>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-border bg-surface/60 p-3 text-xs leading-relaxed text-muted-foreground">
      <p className="flex items-start gap-2 text-foreground">
        <Scale className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
        {pack.basis}
      </p>
      <p className="mt-2 flex items-center gap-2">
        <MapPin className="size-3.5 shrink-0" aria-hidden /> Written for {nationsLabel(pack)}
      </p>
      <p className="mt-2">{REGULATORY_DISCLAIMER}</p>
    </div>
  );
}
