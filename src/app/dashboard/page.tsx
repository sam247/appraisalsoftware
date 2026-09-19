import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import CampaignList from "./campaigns/campaign-list";
import { responseProgress } from "./campaigns/presentation";
import type { Campaign, CampaignAssignment } from "@/lib/types/database";

export default async function OverviewPage() {
  const { org } = await requireOrgAdmin();
  const supabase = await createClient();
  const [campaignResult, peopleResult, assignmentResult] = await Promise.all([
    supabase
      .from("campaigns")
      .select("*")
      .eq("organization_id", org.id)
      .neq("status", "archived")
      .order("created_at", { ascending: false }),
    supabase
      .from("people")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", org.id)
      .is("archived_at", null),
    supabase
      .from("campaign_assignments")
      .select("*")
      .eq("organization_id", org.id),
  ]);
  if (campaignResult.error || peopleResult.error || assignmentResult.error)
    throw new Error("Unable to load your workspace");
  const campaigns = (campaignResult.data ?? []) as Campaign[];
  const assignments = (assignmentResult.data ?? []) as CampaignAssignment[];
  const peopleCount = peopleResult.count ?? 0;
  const hasPeople = peopleCount > 0;
  const active = campaigns.filter((c) => c.status === "active");
  const progress = responseProgress(
    assignments.filter((a) => active.some((c) => c.id === a.campaign_id)),
  );

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
        Home
      </h1>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/dashboard/campaigns/new"
          className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-surface"
        >
          <Plus className="size-4 text-primary" aria-hidden />
          Create appraisal
        </Link>
        <Link
          href="/dashboard/people"
          className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-surface"
        >
          <Upload className="size-4 text-primary" aria-hidden />
          Import people
        </Link>
      </div>

      {!campaigns.length ? (
        <section className="mt-6 rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">
            Get started
          </h2>
          <ol className="mt-3 divide-y divide-border">
            {[
              [
                "Add your people",
                "Import a CSV or add employees one by one.",
                "/dashboard/people",
                hasPeople ? "People added" : "Add people",
              ],
              [
                "Create an appraisal",
                "Name the campaign and choose a question template.",
                "/dashboard/campaigns/new",
                "Create appraisal",
              ],
              [
                "Review, then send",
                "Assign participants and send or schedule.",
                "/dashboard/campaigns/new",
                "Start draft",
              ],
            ].map(([title, text, href, label], i) => (
              <li key={title} className="flex gap-3 py-3">
                <span className="w-5 font-display text-lg font-semibold text-primary">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">{text}</p>
                  {i < 2 && (
                    <Link
                      href={href}
                      className="mt-1.5 inline-block text-xs font-medium text-primary hover:underline"
                    >
                      {label} →
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <>
          <section
            aria-label="Appraisal activity"
            className="mt-6 rounded-xl border border-border bg-card p-5"
          >
            <h2 className="mb-4 text-sm font-semibold text-foreground">
              Appraisal activity
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                [active.length, "Collecting"],
                [progress.complete, "Responses complete"],
                [progress.inProgress, "In progress"],
                [peopleCount, "People"],
              ].map(([value, label]) => (
                <div key={label}>
                  <p className="font-display text-2xl font-semibold tabular-nums text-foreground">
                    {value}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-6">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-foreground">
                Recent campaigns
              </h2>
              <Link
                href="/dashboard/campaigns"
                className="text-xs font-medium text-primary hover:underline"
              >
                See all
              </Link>
            </div>
            <div className="rounded-xl border border-border bg-card px-4">
              <CampaignList
                campaigns={campaigns.slice(0, 5)}
                assignments={assignments}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
