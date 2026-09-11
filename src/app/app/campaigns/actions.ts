"use server";

import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ---------------------------------------------------------------------------
// Create campaign (draft)
// ---------------------------------------------------------------------------
export async function createCampaign(formData: FormData): Promise<void> {
  const { userId, org } = await requireOrgAdmin();
  const supabase = await createClient();

  const name = (formData.get("name") as string | null)?.trim();
  const templateId = (formData.get("template_id") as string | null) || null;
  const closesAt = (formData.get("closes_at") as string | null) || null;

  if (!name) redirect("/app/campaigns/new?error=Name+is+required");

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .insert({
      organization_id: org.id,
      name,
      campaign_type: "annual_appraisal",
      status: "draft",
      template_id: templateId,
      closes_at: closesAt ? new Date(closesAt).toISOString() : null,
      created_by: userId,
    })
    .select("id")
    .single();

  if (error || !campaign)
    redirect(
      `/app/campaigns/new?error=${encodeURIComponent(error?.message ?? "Failed to create")}`,
    );

  redirect(`/app/campaigns/${campaign.id}`);
}

// ---------------------------------------------------------------------------
// Save subjects + assignments (wizard step 2)
// ---------------------------------------------------------------------------
export async function saveSubjectsAndAssignments(
  campaignId: string,
  subjects: Array<{
    personId: string;
    selfPersonId: string;
    managerPersonId: string | null;
  }>,
): Promise<{ error?: string }> {
  const { org } = await requireOrgAdmin();
  const supabase = await createClient();

  // Verify campaign belongs to org
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, organization_id, status")
    .eq("id", campaignId)
    .eq("organization_id", org.id)
    .single();

  if (!campaign) return { error: "Campaign not found" };
  if (campaign.status !== "draft") return { error: "Campaign is not in draft" };

  // Clear existing subjects + assignments (idempotent replace)
  await supabase
    .from("campaign_assignments")
    .delete()
    .eq("campaign_id", campaignId)
    .eq("organization_id", org.id);

  await supabase
    .from("campaign_subjects")
    .delete()
    .eq("campaign_id", campaignId)
    .eq("organization_id", org.id);

  // Insert subjects
  const subjectRows = subjects.map((s) => ({
    campaign_id: campaignId,
    organization_id: org.id,
    person_id: s.personId,
  }));

  if (subjectRows.length > 0) {
    const { error: subErr } = await supabase
      .from("campaign_subjects")
      .insert(subjectRows);
    if (subErr) return { error: subErr.message };
  }

  // Build assignments: self + manager for each subject
  const assignmentRows: Array<{
    campaign_id: string;
    organization_id: string;
    respondent_person_id: string;
    subject_person_id: string;
    relationship: string;
  }> = [];

  for (const s of subjects) {
    // Self assignment — subject reviews themselves
    assignmentRows.push({
      campaign_id: campaignId,
      organization_id: org.id,
      respondent_person_id: s.selfPersonId,
      subject_person_id: s.personId,
      relationship: "self",
    });

    // Manager assignment
    if (s.managerPersonId) {
      assignmentRows.push({
        campaign_id: campaignId,
        organization_id: org.id,
        respondent_person_id: s.managerPersonId,
        subject_person_id: s.personId,
        relationship: "manager",
      });
    }
  }

  if (assignmentRows.length > 0) {
    const { error: asnErr } = await supabase
      .from("campaign_assignments")
      .insert(assignmentRows);
    if (asnErr) return { error: asnErr.message };
  }

  revalidatePath(`/app/campaigns/${campaignId}`);
  return {};
}

// ---------------------------------------------------------------------------
// Activate campaign (calls DB RPC)
// ---------------------------------------------------------------------------
export async function activateCampaign(
  campaignId: string,
): Promise<{ error?: string }> {
  const { org } = await requireOrgAdmin();
  const supabase = await createClient();

  // Verify ownership before calling RPC
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, organization_id")
    .eq("id", campaignId)
    .eq("organization_id", org.id)
    .single();

  if (!campaign) return { error: "Campaign not found" };

  const { error } = await supabase.rpc("activate_campaign", {
    p_campaign_id: campaignId,
  });

  if (error) return { error: error.message };

  revalidatePath(`/app/campaigns/${campaignId}`);
  return {};
}

// ---------------------------------------------------------------------------
// Close campaign
// ---------------------------------------------------------------------------
export async function closeCampaign(campaignId: string): Promise<void> {
  const { org } = await requireOrgAdmin();
  const supabase = await createClient();

  await supabase
    .from("campaigns")
    .update({ status: "closed" })
    .eq("id", campaignId)
    .eq("organization_id", org.id);

  revalidatePath(`/app/campaigns/${campaignId}`);
}
