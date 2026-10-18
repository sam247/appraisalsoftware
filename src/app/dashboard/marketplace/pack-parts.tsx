import FormSubmit from "@/app/dashboard/form-submit";
import { Button } from "@/components/ui/button";
import { formatPackPrice, type PackAccess, type TemplatePack } from "@/lib/marketplace";
import { cn } from "@/lib/utils";
import { Check, Lock, RefreshCw } from "lucide-react";
import Link from "next/link";
import { buyPack, usePack } from "./actions";

const STATUS: Record<PackAccess, string> = {
  owned: "Owned",
  included: "Included with your plan",
  available: "",
  needs_pro: "Needs Pro",
};

export function PackStatus({ access, update = false, className }: { access: PackAccess; update?: boolean; className?: string }) {
  if (update) {
    return (
      <span className={cn("inline-flex items-center gap-1 rounded-full bg-warm px-2.5 py-1 text-xs font-medium text-warm-foreground shadow-sm", className)}>
        <RefreshCw className="size-3" aria-hidden />
        Update available
      </span>
    );
  }
  const label = STATUS[access];
  if (!label) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium shadow-sm",
        access === "needs_pro" ? "bg-card text-muted-foreground" : "bg-primary text-primary-foreground",
        className,
      )}
    >
      {access === "needs_pro" ? <Lock className="size-3" aria-hidden /> : <Check className="size-3" strokeWidth={3} aria-hidden />}
      {label}
    </span>
  );
}

export function PackPrice({ pack, access, large = false }: { pack: TemplatePack; access: PackAccess; large?: boolean }) {
  const ready = access === "owned" || access === "included";
  return (
    <p className="text-sm text-muted-foreground">
      {ready ? (
        <>
          <span className={cn("font-display font-semibold text-foreground", large ? "text-3xl" : "text-lg")}>
            {access === "included" ? "Included" : "Owned"}
          </span>
          {access === "included" ? <span className="ml-2 line-through">{formatPackPrice(pack.price)}</span> : null}
        </>
      ) : (
        <>
          <span className={cn("font-display font-semibold text-foreground", large ? "text-3xl" : "text-lg")}>{formatPackPrice(pack.price)}</span>{" "}
          one-off + VAT
        </>
      )}
    </p>
  );
}

/** The single next step for a pack: use it, buy it, upgrade, or ask. */
export function PackAction({
  pack,
  access,
  canBuy,
  update = false,
  block = false,
}: {
  pack: TemplatePack;
  access: PackAccess;
  canBuy: boolean;
  /** An older version is installed: using the pack adds the latest as a new template. */
  update?: boolean;
  block?: boolean;
}) {
  const width = block ? "w-full" : "";
  if (access === "owned" || access === "included") {
    return (
      <form action={usePack} className={width}>
        <input type="hidden" name="pack" value={pack.slug} />
        <FormSubmit pendingLabel="Setting up…" className={width}>
          {update ? `Install update (v${pack.version})` : "Use this template"}
        </FormSubmit>
      </form>
    );
  }
  if (access === "needs_pro") {
    return (
      <Button asChild variant="outline" className={width}>
        <Link href="/dashboard/upgrade">Upgrade to Pro</Link>
      </Button>
    );
  }
  if (canBuy) {
    return (
      <form action={buyPack} className={width}>
        <input type="hidden" name="pack" value={pack.slug} />
        <FormSubmit pendingLabel="Opening checkout…" className={width}>
          Buy for {formatPackPrice(pack.price)}
        </FormSubmit>
      </form>
    );
  }
  return (
    <Button asChild variant="outline" className={width}>
      <Link href={`/contact?type=pricing&plan=${encodeURIComponent(pack.name)}`}>Ask about this pack</Link>
    </Button>
  );
}
