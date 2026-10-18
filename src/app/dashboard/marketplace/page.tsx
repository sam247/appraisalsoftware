import { Button } from "@/components/ui/button";
import { PackBasis } from "@/components/marketplace/PackBasis";
import { PackCover } from "@/components/marketplace/PackCover";
import { requireOrgAdmin } from "@/lib/auth/session";
import { billingConfigured } from "@/lib/billing/stripe";
import { groups, packAccess, packBySlug, packs, UPDATES_NOTE, type PackAccess, type TemplatePack } from "@/lib/marketplace";
import { cn } from "@/lib/utils";
import { Clock, ListChecks } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "../chrome";
import { PackAction, PackPrice, PackStatus } from "./pack-parts";
import PurchaseReturn from "./purchase-return";
import { installedPackVersions, workspacePackState } from "./state";

const MARKET = "/dashboard/marketplace";

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ purchased?: string; error?: string; group?: string }>;
}) {
  let orgAdmin;
  try {
    orgAdmin = await requireOrgAdmin();
  } catch {
    redirect("/login");
  }
  const params = await searchParams;
  const [{ plan, purchased }, installed] = await Promise.all([workspacePackState(orgAdmin.org.id), installedPackVersions(orgAdmin.org.id)]);
  const justBought = params.purchased ? packBySlug(params.purchased) : undefined;
  const canBuy = billingConfigured();
  const group = groups.find((g) => g.name === params.group)?.name;
  const shown = group ? packs.filter((p) => p.group === group) : packs;

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

      <nav aria-label="Pack groups" className="mt-6 flex flex-wrap items-center gap-2">
        <CategoryLink href={MARKET} active={!group} label="All packs" count={packs.length} />
        {groups.map((g) => (
          <CategoryLink key={g.name} href={`${MARKET}?group=${encodeURIComponent(g.name)}`} active={group === g.name} label={g.name} count={g.count} />
        ))}
      </nav>

      <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((pack) => (
          <ProductCard
            key={pack.slug}
            pack={pack}
            access={packAccess(pack, plan, purchased)}
            installedVersion={installed.get(pack.slug)}
            canBuy={canBuy}
            highlight={pack.slug === justBought?.slug}
          />
        ))}
      </div>

      <p className="mt-8 max-w-3xl text-xs leading-relaxed text-muted-foreground">
        No VAT is charged. Purchases are one-off and belong to this workspace. {UPDATES_NOTE}
      </p>
    </div>
  );
}

function CategoryLink({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
        active ? "border-foreground bg-foreground text-background" : "border-border bg-card text-foreground hover:border-foreground/40",
      )}
    >
      {label}
      <span className={cn("text-xs tabular-nums", active ? "text-background/70" : "text-muted-foreground")}>{count}</span>
    </Link>
  );
}

function ProductCard({
  pack,
  access,
  installedVersion,
  canBuy,
  highlight,
}: {
  pack: TemplatePack;
  access: PackAccess;
  installedVersion: number | undefined;
  canBuy: boolean;
  highlight: boolean;
}) {
  const update = (access === "owned" || access === "included") && installedVersion !== undefined && installedVersion < pack.version;
  return (
    <article
      id={pack.slug}
      className={cn(
        "group relative flex scroll-mt-24 flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-[0_20px_44px_-30px_rgb(21_38_29/0.45)]",
        highlight ? "border-primary shadow-[0_16px_40px_-28px_var(--primary)]" : "border-border",
      )}
    >
      <PackCover pack={pack} className="aspect-[16/10] border-b border-border">
        <PackStatus access={access} update={update} className="absolute left-3 top-3" />
      </PackCover>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{pack.category}</p>
        <h2 className="mt-1.5 font-display text-lg font-semibold tracking-tight">
          {/* Stretched link: the whole card opens the product page; the action stays clickable above it. */}
          <Link href={`${MARKET}/${pack.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none group-hover:underline">
            {pack.name}
          </Link>
        </h2>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{pack.summary}</p>
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <ListChecks className="size-3.5" aria-hidden /> {pack.questions.length} questions
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" aria-hidden /> ~{pack.minutes} min
          </span>
          <span>{pack.campaignType === "feedback_360" ? "Anonymous 360" : "Self + manager"}</span>
        </p>
        {pack.basis ? (
          <div className="mt-3">
            <PackBasis pack={pack} compact />
          </div>
        ) : null}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
          <PackPrice pack={pack} access={access} />
          <div className="relative z-10">
            <PackAction pack={pack} access={access} canBuy={canBuy} update={update} />
          </div>
        </div>
      </div>
    </article>
  );
}
