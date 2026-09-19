import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import CampaignList from "./campaign-list";
import type { Campaign, CampaignAssignment } from "@/lib/types/database";

export default async function CampaignsPage() {
  const { org } = await requireOrgAdmin();
  const supabase = await createClient();
  const [campaignResult, assignmentResult] = await Promise.all([
    supabase
      .from("campaigns")
      .select("*")
      .eq("organization_id", org.id)
      .neq("status", "archived")
      .order("created_at", { ascending: false }),
    supabase
      .from("campaign_assignments")
      .select("*")
      .eq("organization_id", org.id),
  ]);
  if (campaignResult.error || assignmentResult.error)
    throw new Error("Unable to load your campaigns");
  const campaigns = (campaignResult.data ?? []) as Campaign[];
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Campaigns
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Create, send and follow appraisal cycles.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/dashboard/campaigns/new">Create appraisal</Link>
        </Button>
      </div>
      <section className="mt-5">
        {campaigns.length ? (
          <CampaignList
            campaigns={campaigns}
            assignments={(assignmentResult.data ?? []) as CampaignAssignment[]}
          />
        ) : (
          <div className="rounded-lg border border-border bg-card px-4 py-8">
            <h2 className="text-sm font-semibold">No campaigns yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Create an appraisal to invite people and collect responses.
            </p>
            <Button asChild size="sm" className="mt-4">
              <Link href="/dashboard/campaigns/new">Create appraisal</Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
