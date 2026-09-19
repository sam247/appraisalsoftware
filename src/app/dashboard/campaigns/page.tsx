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
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
            Campaigns
          </h1>
          <p className="mt-4 text-muted-foreground">
            Create, send and follow your annual appraisal cycles.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/campaigns/new">Create appraisal</Link>
        </Button>
      </div>
      <section className="mt-8">
        {campaigns.length ? (
          <CampaignList
            campaigns={campaigns}
            assignments={(assignmentResult.data ?? []) as CampaignAssignment[]}
          />
        ) : (
          <div className="bg-card rounded-2xl px-6 py-12">
            <h2 className="font-display text-xl font-semibold">
              Make room for a better review conversation.
            </h2>
            <p className="mt-4 max-w-lg text-muted-foreground leading-relaxed">
              Your first campaign brings employee reflection and manager
              feedback together. Start with a draft; nothing is sent until you
              review it.
            </p>
            <Link
              href="/dashboard/people"
              className="mt-5 inline-block text-sm text-primary underline underline-offset-4"
            >
              Manage your people first →
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
