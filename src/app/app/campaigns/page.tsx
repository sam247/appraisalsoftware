import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Campaign } from "@/lib/types/database";

export default async function CampaignsPage() {
  let orgAdmin;
  try {
    orgAdmin = await requireOrgAdmin();
  } catch {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: raw } = await supabase
    .from("campaigns")
    .select("*")
    .eq("organization_id", orgAdmin.org.id)
    .not("status", "eq", "archived")
    .order("created_at", { ascending: false });

  const campaigns = (raw ?? []) as Campaign[];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Campaigns
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Run and track appraisal cycles.
          </p>
        </div>
        <Link href="/app/campaigns/new">
          <Button size="sm">New campaign</Button>
        </Link>
      </div>

      <div className="mt-8">
        {campaigns.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-8 py-14 text-center">
            <p className="text-sm text-muted-foreground">
              No campaigns yet.{" "}
              <Link
                href="/app/campaigns/new"
                className="text-foreground underline underline-offset-2"
              >
                Create your first one
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
            {campaigns.map((c) => (
              <Link
                key={c.id}
                href={`/app/campaigns/${c.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-surface transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {c.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {CAMPAIGN_TYPE_LABELS[c.campaign_type] ?? c.campaign_type}
                    {" · "}
                    {c.closes_at
                      ? `Closes ${new Date(c.closes_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
                      : "No close date"}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[c.status]}`}
                >
                  {STATUS_LABELS[c.status]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const CAMPAIGN_TYPE_LABELS: Record<string, string> = {
  annual_appraisal: "Annual appraisal",
  feedback_360: "360° feedback",
  self_assessment: "Self-assessment",
  manager_review: "Manager review",
  probation_review: "Probation review",
  employee_feedback: "Employee feedback",
  custom: "Custom",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  active: "Active",
  closed: "Closed",
  archived: "Archived",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-blue-50 text-blue-700",
  active: "bg-emerald-50 text-emerald-700",
  closed: "bg-muted text-muted-foreground",
  archived: "bg-muted text-muted-foreground",
};
