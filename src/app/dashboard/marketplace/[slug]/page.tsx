import { PackBasis } from "@/components/marketplace/PackBasis";
import { PackCover } from "@/components/marketplace/PackCover";
import { requireOrgAdmin } from "@/lib/auth/session";
import { billingConfigured } from "@/lib/billing/stripe";
import { packAccess, packBySlug, packs, UPDATES_NOTE } from "@/lib/marketplace";
import { ArrowLeft, CalendarCheck, Check, Clock, Copy, ListChecks, PencilLine, RefreshCw, Users } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PackAction, PackPrice, PackStatus } from "../pack-parts";
import { installedPackVersions, workspacePackState } from "../state";

export default async function PackPage({ params }: { params: Promise<{ slug: string }> }) {
  let orgAdmin;
  try {
    orgAdmin = await requireOrgAdmin();
  } catch {
    redirect("/login");
  }
  const { slug } = await params;
  const pack = packBySlug(slug);
  if (!pack) notFound();

  const [{ plan, purchased }, installed] = await Promise.all([workspacePackState(orgAdmin.org.id), installedPackVersions(orgAdmin.org.id)]);
  const access = packAccess(pack, plan, purchased);
  const ready = access === "owned" || access === "included";
  const installedAt = installed.get(pack.slug);
  const update = ready && installedAt !== undefined && installedAt < pack.version;
  const newChanges = update ? pack.changelog.filter((c) => c.version > installedAt) : [];
  const canBuy = billingConfigured();
  const is360 = pack.campaignType === "feedback_360";
  const ratings = pack.questions.filter((q) => q.type === "rating").length;
  // Same group first, then the rest of the catalogue.
  const others = packs.filter((p) => p.slug !== pack.slug);
  const related = [...others.filter((p) => p.group === pack.group), ...others.filter((p) => p.group !== pack.group)].slice(0, 3);
  const reviewed = new Date(`${pack.reviewed}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <div className="w-full">
      <Link href="/dashboard/marketplace" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Marketplace
      </Link>

      {/* Cover, then the buy box, then the details on phones; the buy box sits beside both from lg. */}
      <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="min-w-0 lg:col-start-1">
          <PackCover pack={pack} className="aspect-[2/1] rounded-xl border border-border sm:aspect-[5/2]">
            <PackStatus access={access} update={update} className="absolute left-4 top-4" />
          </PackCover>
        </div>

        <aside className="rounded-xl border border-border bg-card p-5 lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{pack.category}</p>
          <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight">{pack.name}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pack.summary}</p>
          <div className="mt-5">
            <PackPrice pack={pack} access={access} large />
          </div>
          {update ? (
            <div className="mt-4 rounded-lg border border-warm/40 bg-warm/10 p-3 text-xs leading-relaxed text-foreground">
              <p className="flex items-center gap-1.5 font-semibold">
                <RefreshCw className="size-3.5" aria-hidden /> Version {pack.version} is available
              </p>
              <ul className="mt-1.5 space-y-1 text-muted-foreground">
                {newChanges.map((c) => (
                  <li key={c.version}>{c.summary}</li>
                ))}
              </ul>
              <p className="mt-1.5 text-muted-foreground">It is added as a new template. Your existing template and past reviews stay as they are.</p>
            </div>
          ) : null}
          <div className="mt-4">
            <PackAction pack={pack} access={access} canBuy={canBuy} update={update} block />
          </div>
          {pack.basis ? (
            <div className="mt-4">
              <PackBasis pack={pack} />
            </div>
          ) : null}
          <ul className="mt-5 space-y-2.5 border-t border-border pt-5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2.5">
              <ListChecks className="size-4 shrink-0" aria-hidden /> {pack.questions.length} questions
            </li>
            <li className="flex items-center gap-2.5">
              <Clock className="size-4 shrink-0" aria-hidden /> About {pack.minutes} minutes to complete
            </li>
            <li className="flex items-center gap-2.5">
              <Users className="size-4 shrink-0" aria-hidden /> {is360 ? "Anonymous 360 feedback" : "Self + manager appraisal"}
            </li>
            <li className="flex items-center gap-2.5">
              <PencilLine className="size-4 shrink-0" aria-hidden /> Edit any question after you add it
            </li>
            <li className="flex items-center gap-2.5">
              <Copy className="size-4 shrink-0" aria-hidden /> One-off purchase, reuse every cycle
            </li>
            <li className="flex items-center gap-2.5">
              <RefreshCw className="size-4 shrink-0" aria-hidden /> Free future updates (version {pack.version})
            </li>
            <li className="flex items-center gap-2.5">
              <CalendarCheck className="size-4 shrink-0" aria-hidden /> Content reviewed {reviewed}
            </li>
          </ul>
          <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
            Prices exclude VAT. Purchases belong to this workspace. {UPDATES_NOTE}
          </p>
        </aside>

        <div className="min-w-0 lg:col-start-1">
          <section aria-labelledby="included">
            <h2 id="included" className="font-display text-lg font-semibold tracking-tight">What&apos;s included</h2>
            <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {pack.benefits.map((b) => (
                <li key={b} className="flex gap-2.5 text-sm text-foreground">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-primary" aria-hidden>
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-8" aria-labelledby="questions">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="questions" className="font-display text-lg font-semibold tracking-tight">All {pack.questions.length} questions</h2>
              <p className="text-xs text-muted-foreground">
                {ratings} rating · {pack.questions.length - ratings} written
              </p>
            </div>
            <ol className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
              {pack.questions.map((q, i) => (
                <li key={i} className="flex gap-3 px-4 py-3 text-sm">
                  <span className="w-5 shrink-0 pt-px text-xs tabular-nums text-muted-foreground">{i + 1}</span>
                  <span className="min-w-0 flex-1 text-foreground">
                    {q.prompt}
                    {q.help ? <span className="mt-0.5 block text-xs text-muted-foreground">{q.help}</span> : null}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {q.type === "rating" ? q.area : "Written"}
                    {q.required === false ? " · optional" : ""}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>

      </div>

      <section className="mt-12" aria-labelledby="more">
        <h2 id="more" className="font-display text-lg font-semibold tracking-tight">More packs</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-3">
          {related.map((p) => (
            <Link key={p.slug} href={`/dashboard/marketplace/${p.slug}`} className="group overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-[0_20px_44px_-30px_rgb(21_38_29/0.45)]">
              <PackCover pack={p} className="aspect-[16/10] border-b border-border" />
              <div className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{p.category}</p>
                <p className="mt-1 font-semibold group-hover:underline">{p.name}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
