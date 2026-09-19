import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import CampaignList from "./campaign-list";
import { PageHeader } from "../chrome";
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
      <PageHeader
        title="Campaigns"
        subtitle="Appraisals and feedback cycles in this workspace."
        action={
          <Button asChild size="sm">
            <Link href="/dashboard/campaigns/new">Create appraisal</Link>
          </Button>
        }
      />
      <section className="mt-6">
        {campaigns.length ? (
          <CampaignList
            campaigns={campaigns}
            assignments={(assignmentResult.data ?? []) as CampaignAssignment[]}
          />
        ) : (
          <div className="border-t border-border py-8">
            <h2 className="text-sm font-semibold">No appraisals yet</h2>
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
