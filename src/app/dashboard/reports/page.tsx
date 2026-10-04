import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { Campaign } from "@/lib/types/database";
import { PageHeader } from "../chrome";
import { responseProgress } from "../campaigns/presentation";
import { belongsInReports, reportAvailability, type ReportEntry } from "./presentation";
import ReportsDirectory from "./reports-directory";

export default async function ReportsPage() {
  const { org } = await requireOrgAdmin();
  const supabase = await createClient();
  const [campaignResult, assignmentResult, questionResult] = await Promise.all([
    supabase.from("campaigns").select("*").eq("organization_id", org.id).neq("status", "draft").order("updated_at", { ascending: false }),
    supabase.from("campaign_assignments").select("campaign_id,status").eq("organization_id", org.id),
    supabase.from("campaign_questions").select("campaign_id").eq("organization_id", org.id),
  ]);
  if (campaignResult.error || assignmentResult.error || questionResult.error) throw new Error("Unable to load reports");
  const questions = new Set((questionResult.data ?? []).map((question) => question.campaign_id));
  const entries: ReportEntry[] = await Promise.all(((campaignResult.data ?? []) as Campaign[]).filter(belongsInReports).map(async (campaign) => {
    const progress = responseProgress((assignmentResult.data ?? []).filter((assignment) => assignment.campaign_id === campaign.id));
    let feedbackState: string | undefined;
    if (campaign.campaign_type === "feedback_360") {
      const { data, error } = await supabase.rpc("feedback_360_report", { p_campaign_id: campaign.id });
      if (error) throw new Error("Unable to load report availability");
      // Only release availability metadata to the library, never the RPC's answers.
      feedbackState = (data as { state?: string } | null)?.state;
    }
    return {
      id: campaign.id, name: campaign.name, type: campaign.campaign_type, status: campaign.status,
      completion: `${progress.complete} of ${progress.total} responses`,
      ...reportAvailability(campaign, progress.complete, questions.has(campaign.id), feedbackState),
      date: campaign.closes_at ?? campaign.opens_at,
      dateLabel: campaign.closes_at ? (["closed", "archived"].includes(campaign.status) ? "Close date" : "Closes") : "Opens",
      timezone: campaign.timezone,
    };
  }));
  return <div><PageHeader title="Reports" subtitle="Appraisal and feedback reports across your campaigns." /><ReportsDirectory entries={entries} /></div>;
}
