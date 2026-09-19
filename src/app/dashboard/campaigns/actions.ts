"use server";

import { requireOrgAdmin } from "@/lib/auth/session";
import {
  DEFAULT_REMINDER_SETTINGS,
  sanitizeReminderSettings,
} from "@/lib/schedule/decisions";
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
  const opensAt = (formData.get("opens_at") as string | null) || null;

  if (
    formData.has("campaign_type") &&
    !["annual_appraisal", "feedback_360"].includes(
      String(formData.get("campaign_type")),
    )
  )
    redirect("/dashboard/campaigns/new?error=Unsupported+campaign+type");
  if (formData.get("campaign_type") === "feedback_360") {
    if (formData.get("privacy_ack") !== "on")
      redirect(
        "/dashboard/campaigns/new?type=360&error=Read+and+accept+the+anonymity+policy",
      );
    if (process.env.ENABLE_360_FEEDBACK !== "true")
      redirect("/dashboard/campaigns/new?error=360+feedback+is+not+enabled");
    if (!name || !templateId || (closesAt && !validDate(closesAt)))
      redirect(
        "/dashboard/campaigns/new?type=360&error=Check+the+name,+template+and+date",
      );
    const { data, error } = await supabase.rpc("create_feedback_360", {
      p_name: name,
      p_subject: String(formData.get("subject_id") || ""),
      p_template: templateId,
      p_close_date: closesAt,
      p_reviewers: formData.getAll("reviewer_id").map((id) => ({
        person_id: String(id),
        relationship: String(formData.get(`relationship_${id}`) || "peer"),
      })),
    });
    if (error)
      redirect(
        `/dashboard/campaigns/new?type=360&error=${encodeURIComponent(error.message)}`,
      );
    redirect(`/dashboard/campaigns/${data}`);
  }

  if (!name) redirect("/dashboard/campaigns/new?error=Name+is+required");

  if (!templateId)
    redirect("/dashboard/campaigns/new?error=Choose+a+question+template");
  const templateError = await validateTemplate(supabase, org.id, templateId);
  if (templateError)
    redirect(`/dashboard/campaigns/new?error=${encodeURIComponent(templateError)}`);
  if ((closesAt && !validDate(closesAt)) || (opensAt && !validDate(opensAt)))
    redirect("/dashboard/campaigns/new?error=Choose+a+valid+date");
  const timezone = org.timezone || "Europe/London";
  const closeInstant = closesAt ? await resolveDate(closesAt) : null;
  const openInstant = opensAt ? await resolveDate(opensAt) : null;
  async function resolveDate(date: string) {
    const { data, error } = await supabase.rpc("campaign_date_instants", {
      p_date: date,
      p_timezone: timezone,
    });
    if (error || !data?.[0])
      redirect(
        `/dashboard/campaigns/new?error=${encodeURIComponent(error?.message ?? "Unable to resolve campaign date")}`,
      );
    return data[0] as { opens_at: string; closes_at: string };
  }
  if (closeInstant && new Date(closeInstant.closes_at).getTime() <= Date.now())
    redirect("/dashboard/campaigns/new?error=Close+date+must+be+in+the+future");

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .insert({
      organization_id: org.id,
      name,
      campaign_type: "annual_appraisal",
      status: "draft",
      template_id: templateId,
      closes_at: closeInstant?.closes_at ?? null,
      opens_at: openInstant?.opens_at ?? null,
      timezone,
      reminder_settings: sanitizeReminderSettings(
        DEFAULT_REMINDER_SETTINGS,
      ) as unknown as Record<string, unknown>,
      created_by: userId,
    })
    .select("id")
    .single();

  if (error || !campaign)
    redirect(
      `/dashboard/campaigns/new?error=${encodeURIComponent(error?.message ?? "Failed to create")}`,
    );

  redirect(`/dashboard/campaigns/${campaign.id}`);
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
  await requireOrgAdmin();
  const supabase = await createClient();

  // The database derives tenancy, validates input and holds the activation lock.
  if (
    !Array.isArray(subjects) ||
    subjects.some((s) => !s || s.selfPersonId !== s.personId)
  )
    return { error: "Invalid participant selection" };
  const { error } = await supabase.rpc("save_appraisal_participants", {
    p_campaign_id: campaignId,
    p_participants: subjects.map((s) => ({
      person_id: s.personId,
      manager_person_id: s.managerPersonId,
    })),
  });
  if (error) return { error: error.message };

  revalidatePath(`/dashboard/campaigns/${campaignId}`);
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

  // Best-effort outbox nudge — never block or fail activation on Resend.
  void nudgeOutboxDrain();

  revalidatePath(`/dashboard/campaigns/${campaignId}`);
  return {};
}

async function nudgeOutboxDrain(): Promise<void> {
  try {
    const { getAppOrigin } = await import("@/lib/app-origin");
    const secret = process.env.CRON_SECRET?.trim();
    const headers: HeadersInit = {};
    if (secret) headers.Authorization = `Bearer ${secret}`;
    await fetch(`${getAppOrigin()}/api/cron/drain-outbox`, {
      method: "POST",
      headers,
      cache: "no-store",
    });
  } catch {
    // Scheduler cron remains the reliable path.
  }
}

// ---------------------------------------------------------------------------
// Close campaign (revokes outstanding tokens — Disclosurely Feedback model)
// ---------------------------------------------------------------------------
export async function closeCampaign(campaignId: string): Promise<void> {
  const { org } = await requireOrgAdmin();
  const supabase = await createClient();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id")
    .eq("id", campaignId)
    .eq("organization_id", org.id)
    .single();

  if (!campaign) return;

  const { error } = await supabase.rpc("close_campaign", {
    p_campaign_id: campaignId,
  });
  if (error) {
    redirect(
      `/dashboard/campaigns/${campaignId}?error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath(`/dashboard/campaigns/${campaignId}`);
}

// ---------------------------------------------------------------------------
// Schedule campaign for later activation (opens_at)
// ---------------------------------------------------------------------------
export async function scheduleCampaign(
  campaignId: string,
  formData: FormData,
): Promise<void> {
  await requireOrgAdmin();
  const supabase = await createClient();

  const opensAt = (formData.get("opens_at") as string | null)?.trim();
  if (!opensAt) {
    redirect(
      `/dashboard/campaigns/${campaignId}?error=${encodeURIComponent("Open date is required to schedule")}`,
    );
  }

  if (!validDate(opensAt))
    redirect(`/dashboard/campaigns/${campaignId}?error=Invalid+send+date`);
  const { error } = await supabase.rpc("schedule_appraisal_campaign", {
    p_campaign_id: campaignId,
    p_send_date: opensAt,
  });
  if (error)
    redirect(
      `/dashboard/campaigns/${campaignId}?error=${encodeURIComponent(error.message)}`,
    );

  revalidatePath(`/dashboard/campaigns/${campaignId}`);
  redirect(`/dashboard/campaigns/${campaignId}`);
}

function validDate(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(new Date(value).getTime()) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}

async function validateTemplate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  templateId: string,
): Promise<string | null> {
  const { data: template, error } = await supabase
    .from("templates")
    .select("id")
    .eq("id", templateId)
    .eq("organization_id", organizationId)
    .is("archived_at", null)
    .single();
  if (error || !template)
    return "Choose an available template from your workspace.";
  const { count, error: questionError } = await supabase
    .from("template_questions")
    .select("id", { count: "exact", head: true })
    .eq("template_id", templateId)
    .eq("organization_id", organizationId);
  if (questionError || !count)
    return "Add at least one question to this template before creating an appraisal.";
  return null;
}

export async function setCampaignTemplate(
  campaignId: string,
  formData: FormData,
): Promise<void> {
  const { org } = await requireOrgAdmin();
  const supabase = await createClient();
  const templateId = String(formData.get("template_id") ?? "");
  const error = await validateTemplate(supabase, org.id, templateId);
  if (error)
    redirect(`/dashboard/campaigns/${campaignId}?error=${encodeURIComponent(error)}`);
  const { data, error: updateError } = await supabase
    .from("campaigns")
    .update({ template_id: templateId })
    .eq("id", campaignId)
    .eq("organization_id", org.id)
    .eq("status", "draft")
    .is("questions_frozen_at", null)
    .select("id")
    .single();
  if (updateError || !data)
    redirect(
      `/dashboard/campaigns/${campaignId}?error=This+campaign+can+no+longer+be+edited`,
    );
  revalidatePath(`/dashboard/campaigns/${campaignId}`);
  redirect(`/dashboard/campaigns/${campaignId}`);
}

export async function sendCampaign(
  campaignId: string,
  formData: FormData,
): Promise<void> {
  if (formData.get("delivery") === "later")
    return scheduleCampaign(campaignId, formData);
  if (formData.get("delivery") !== "now")
    redirect(`/dashboard/campaigns/${campaignId}?error=Choose+when+to+send`);
  const result = await activateCampaign(campaignId);
  if (result.error)
    redirect(
      `/dashboard/campaigns/${campaignId}?error=${encodeURIComponent(result.error)}`,
    );
  redirect(`/dashboard/campaigns/${campaignId}`);
}
