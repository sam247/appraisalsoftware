import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "../chrome";
import CampaignsDirectory from "./campaigns-directory";
import type {
  Campaign,
  CampaignAssignment,
  CampaignSubject,
} from "@/lib/types/database";

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { org } = await requireOrgAdmin();
  const params = await searchParams;
  const supabase = await createClient();
  const [campaignResult, assignmentResult, subjectResult] = await Promise.all([
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
    supabase
      .from("campaign_subjects")
      .select("campaign_id")
      .eq("organization_id", org.id),
  ]);
  if (campaignResult.error || assignmentResult.error || subjectResult.error)
    throw new Error("Unable to load your campaigns");

  const campaigns = (campaignResult.data ?? []) as Campaign[];
  const subjects = (subjectResult.data ?? []) as Pick<
    CampaignSubject,
    "campaign_id"
  >[];
  const subjectCounts: Record<string, number> = {};
  for (const s of subjects) {
    subjectCounts[s.campaign_id] = (subjectCounts[s.campaign_id] ?? 0) + 1;
  }

  return (
    <div>
      <PageHeader
        title="Campaigns"
        subtitle="Appraisals and feedback cycles across your team."
        action={
          <Button asChild size="sm">
            <Link href="/dashboard/campaigns/new">+ Create campaign</Link>
          </Button>
        }
      />
      {params.error && (
        <div
          className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {params.error}
        </div>
      )}
      {params.ok && (
        <div className="mt-4 rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground">
          {params.ok}
        </div>
      )}
      <div className="mt-6">
        <CampaignsDirectory
          campaigns={campaigns}
          assignments={(assignmentResult.data ?? []) as CampaignAssignment[]}
          subjectCounts={subjectCounts}
        />
      </div>
    </div>
  );
}
