import FormSubmit from "@/app/dashboard/form-submit";
import { Button } from "@/components/ui/button";
import { requireOrgAdmin } from "@/lib/auth/session";
import { billingConfigured } from "@/lib/billing/stripe";
import { formatPackPrice, packAccess, packBySlug, packs, type PackAccess, type TemplatePack } from "@/lib/marketplace";
import { cn } from "@/lib/utils";
import { Check, Clock, ListChecks, Lock } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "../chrome";
import { buyPack, usePack } from "./actions";
import PurchaseReturn from "./purchase-return";
import { workspacePackState } from "./state";

const STATUS: Record<PackAccess, { label: string; tone: string }> = {
  owned: { label: "Owned", tone: "bg-accent text-accent-foreground" },
  included: { label: "Included with your plan", tone: "bg-accent text-accent-foreground" },
  available: { label: "", tone: "" },
  needs_pro: { label: "Needs Pro", tone: "bg-surface-2 text-muted-foreground" },
};

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ purchased?: string; error?: string }>;
}) {
  let orgAdmin;
  try {
    orgAdmin = await requireOrgAdmin();
  } catch {
    redirect("/login");
  }
  const params = await searchParams;
  const { plan, purchased } = await workspacePackState(orgAdmin.org.id);
  const justBought = params.purchased ? packBySlug(params.purchased) : undefined;
  const canBuy = billingConfigured();

  return (
    <div className="w-full">
      <PurchaseReturn packName={justBought?.name ?? null} owned={Boolean(justBought && purchased.has(justBought.slug))} />
      <PageHeader
        title="Template marketplace"
        subtitle="Ready-to-run review packs. Buy once for your workspace, reuse every cycle and edit any question."
        action={
          <Button asChild variant="outline">
            <Link href="/dashboard/templates">Your templates</Link>
          </Button>
        }
      />

      {params.error ? (
        <p role="alert" className="mt-6 max-w-3xl rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {params.error}
        </p>
      ) : null}

      <div className="mt-6 grid max-w-6xl gap-4 lg:grid-cols-2">
        {packs.map((pack) => (
          <PackTile key={pack.slug} pack={pack} access={packAccess(pack, plan, purchased)} canBuy={canBuy} highlight={pack.slug === justBought?.slug} />
        ))}
      </div>

      <p className="mt-6 max-w-3xl text-xs leading-relaxed text-muted-foreground">
        Prices exclude VAT. Purchases are one-off and belong to this workspace. Using a pack copies its questions into your
        templates, so later changes to the pack never alter your past reviews.
      </p>
    </div>
  );
}

function PackTile({ pack, access, canBuy, highlight }: { pack: TemplatePack; access: PackAccess; canBuy: boolean; highlight: boolean }) {
  const status = STATUS[access];
  const ready = access === "owned" || access === "included";
  return (
    <article
      id={pack.slug}
      className={cn(
        "flex scroll-mt-24 flex-col rounded-xl border bg-card p-5",
        highlight ? "border-primary shadow-[0_16px_40px_-28px_var(--primary)]" : "border-border",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{pack.category}</span>
        {status.label ? (
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", status.tone)}>
            {access === "needs_pro" ? <Lock className="size-3" aria-hidden /> : <Check className="size-3" aria-hidden />}
            {status.label}
          </span>
        ) : null}
      </div>
      <h2 className="mt-2 font-display text-lg font-semibold tracking-tight">{pack.name}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{pack.summary}</p>
      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <ListChecks className="size-3.5" aria-hidden /> {pack.questions.length} questions
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-3.5" aria-hidden /> ~{pack.minutes} min
        </span>
        <span>{pack.campaignType === "feedback_360" ? "Anonymous 360" : "Self + manager appraisal"}</span>
      </p>

      <details className="group mt-4 rounded-lg border border-border bg-surface/60 px-3 py-2">
        <summary className="cursor-pointer list-none text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
          <span className="text-primary group-open:hidden">▸ </span>
          <span className="hidden text-primary group-open:inline">▾ </span>
          Preview all {pack.questions.length} questions
        </summary>
        <ol className="mt-3 space-y-2 pb-1 text-sm">
          {pack.questions.map((q, i) => (
            <li key={i} className="flex gap-2">
              <span className="w-5 shrink-0 text-xs tabular-nums text-muted-foreground">{i + 1}</span>
              <span className="text-foreground">
                {q.prompt}
                <span className="ml-1.5 text-xs text-muted-foreground">
                  {q.type === "rating" ? `Rating · ${q.area}` : "Written"}
                  {q.required === false ? " · optional" : ""}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </details>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
        <p className="text-sm text-muted-foreground">
          {ready ? (
            access === "included" ? "Included" : "Yours to keep"
          ) : (
            <>
              <span className="font-display text-xl font-semibold text-foreground">{formatPackPrice(pack.price)}</span> one-off + VAT
            </>
          )}
        </p>
        {ready ? (
          <form action={usePack}>
            <input type="hidden" name="pack" value={pack.slug} />
            <FormSubmit pendingLabel="Setting up…">Use this template</FormSubmit>
          </form>
        ) : access === "needs_pro" ? (
          <Button asChild variant="outline">
            <Link href="/dashboard/upgrade">Upgrade to Pro</Link>
          </Button>
        ) : canBuy ? (
          <form action={buyPack}>
            <input type="hidden" name="pack" value={pack.slug} />
            <FormSubmit pendingLabel="Opening checkout…">Buy for {formatPackPrice(pack.price)}</FormSubmit>
          </form>
        ) : (
          <Button asChild variant="outline">
            <Link href={`/contact?type=pricing&plan=${encodeURIComponent(pack.name)}`}>Ask about this pack</Link>
          </Button>
        )}
      </div>
    </article>
  );
}
