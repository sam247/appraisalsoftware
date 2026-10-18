import type { TemplatePack } from "@/lib/marketplace";
import { cn } from "@/lib/utils";
import { PACK_ACCENT } from "./pack-accent";

/**
 * Product "photo" for a pack: a tinted panel with a mock form sheet showing the
 * pack's first rating question, so every listing has a recognisable cover.
 */
export function PackCover({ pack, className, children }: { pack: TemplatePack; className?: string; children?: React.ReactNode }) {
  const accent = PACK_ACCENT[pack.accent];
  const sample = pack.questions.find((q) => q.type === "rating") ?? pack.questions[0];
  const areas = [...new Set(pack.questions.map((q) => q.area).filter(Boolean))].slice(0, 3);
  return (
    <div className={cn("relative isolate overflow-hidden", accent.cover, className)}>
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(rgb(0_0_0/0.07)_1px,transparent_1px)] [background-size:16px_16px]"
      />
      <div aria-hidden className="absolute left-1/2 top-[16%] bottom-[-12%] w-[76%] max-w-sm -translate-x-1/2 rotate-[-2deg] rounded-xl bg-card/95 p-4 shadow-[0_18px_40px_-24px_rgb(21_38_29/0.5)]">
        <div className="flex items-center gap-2">
          <span className={cn("size-2 rounded-full", accent.dot)} />
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{sample.area ?? pack.category}</span>
        </div>
        <p className="mt-2 line-clamp-2 text-[13px] font-medium leading-snug text-foreground">{sample.prompt}</p>
        <div className="mt-3 flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              className={cn("flex size-6 items-center justify-center rounded-md border text-[10px] tabular-nums", n === 4 ? cn(accent.dot, "border-transparent text-white") : "border-border text-muted-foreground")}
            >
              {n}
            </span>
          ))}
        </div>
        <div className="mt-4 space-y-1.5">
          <span className="block h-1.5 w-4/5 rounded-full bg-surface-2" />
          <span className="block h-1.5 w-3/5 rounded-full bg-surface-2" />
        </div>
        {areas.length ? (
          <div className="mt-4 flex flex-wrap gap-1">
            {areas.map((a) => (
              <span key={a} className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-muted-foreground">
                {a}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      {children}
    </div>
  );
}
