import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
  const hasPeople = (peopleResult.count ?? 0) > 0;
  const active = campaigns.filter((c) => c.status === "active");
  const draft = campaigns.find((c) => c.status === "draft");
  const progress = responseProgress(
    assignments.filter((a) => active.some((c) => c.id === a.campaign_id)),
  );
  const activeCampaign = active[0];
  const hasResults =
    activeCampaign &&
    activeCampaign.campaign_type !== "feedback_360" &&
    assignments.some(
      (a) => a.campaign_id === activeCampaign.id && a.status === "submitted",
    );
  const nextAction =
    !hasPeople && !campaigns.length
      ? { href: "/dashboard/people", label: "Add people" }
      : draft
        ? {
            href: `/dashboard/campaigns/${draft.id}`,
            label: "Continue appraisal setup",
          }
        : activeCampaign
          ? {
              href: `/dashboard/campaigns/${activeCampaign.id}${hasResults ? "/results" : ""}`,
              label: hasResults ? "Review responses" : "Open active campaign",
            }
          : { href: "/dashboard/campaigns/new", label: "Create appraisal" };
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-2">{org.name}</p>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {campaigns.length
              ? "Appraisals at a glance"
              : "Start your first appraisal"}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            {campaigns.length
              ? "Track review cycles from invitation through conversation."
              : "Add people, pick a template, and send an annual appraisal."}
          </p>
        </div>
        <Button asChild size="sm">
          <Link href={nextAction.href}>{nextAction.label}</Link>
        </Button>
      </div>
      {!campaigns.length ? (
        <section className="mt-6 rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">First review checklist</h2>
          <ol className="mt-3 divide-y divide-border">
            {[
              [
                "Add your people",
                "Start with employees and their managers.",
                "/dashboard/people",
                hasPeople ? "People added" : "Add people",
              ],
              [
                "Create an annual appraisal",
                "Name your campaign and choose a template.",
                "/dashboard/campaigns/new",
                "Create appraisal",
              ],
              [
                "Review, then send",
                "Choose participants and send now or schedule.",
                "/dashboard/campaigns/new",
                "Start with a draft",
              ],
            ].map(([title, text, href, label], i) => (
              <li key={title} className="flex gap-3 py-3">
                <span className="text-primary font-display text-lg font-semibold w-5">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">{text}</p>
                  {i < 2 && (
                    <Link
                      href={href}
                      className="mt-1.5 inline-block text-xs text-primary underline underline-offset-2"
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
            aria-label="Active campaign summary"
            className="mt-5 flex flex-wrap gap-x-8 gap-y-3 py-3 border-y border-border"
          >
            {[
              [active.length, "Collecting"],
              [progress.complete, "Complete"],
              [progress.inProgress, "In progress"],
              [progress.attention, "Issues"],
            ].map(([value, label]) => (
              <div key={label}>
                <p className="font-display text-2xl font-semibold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </section>
          <section className="mt-5">
            <div className="flex justify-between items-center gap-3 mb-2">
              <h2 className="text-sm font-semibold">Campaigns</h2>
              <Link href="/dashboard/campaigns" className="text-xs text-primary">
                View all →
              </Link>
            </div>
            <CampaignList
              campaigns={campaigns.slice(0, 5)}
              assignments={assignments}
            />
          </section>
        </>
      )}
    </div>
  );
}
