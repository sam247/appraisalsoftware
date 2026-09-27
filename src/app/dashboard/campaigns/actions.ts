"use server";

import { requireOrgAdmin } from "@/lib/auth/session";
import {
  DEFAULT_REMINDER_SETTINGS,
  sanitizeReminderSettings,
} from "@/lib/schedule/decisions";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { campaignLocalDate } from "./presentation";

// ---------------------------------------------------------------------------
// Create campaign (draft)
// ---------------------------------------------------------------------------
export async function createCampaign(formData: FormData): Promise<void> {
  const { userId, org } = await requireOrgAdmin();
  const supabase = await createClient();

  const name = (formData.get("name") as string | null)?.trim();
  const templateId = (formData.get("template_id") as string | null) || null;

  if (
    formData.has("campaign_type") &&
    !["annual_appraisal", "feedback_360"].includes(
      String(formData.get("campaign_type")),
    )
  )
    redirect("/dashboard/campaigns/new?error=Unsupported+campaign+type");
  if (formData.get("campaign_type") === "feedback_360") {
    if (!name) redirect("/dashboard/campaigns/new?type=360&error=Name+is+required");
    const { data, error } = await supabase.rpc("create_feedback_360_draft", {
      p_name: name, p_organization_id: org.id,
    });
    if (error)
      redirect(
        `/dashboard/campaigns/new?type=360&error=${encodeURIComponent(error.message)}`,
      );
    redirect(`/dashboard/campaigns/${data}`);
  }

  if (!name) redirect("/dashboard/campaigns/new?error=Name+is+required");

  if (templateId) {
    const templateError = await validateTemplate(supabase, org.id, templateId);
    if (templateError)
      redirect(`/dashboard/campaigns/new?error=${encodeURIComponent(templateError)}`);
  }
  const timezone = org.timezone || "Europe/London";

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .insert({
      organization_id: org.id,
      name,
      campaign_type: "annual_appraisal",
      status: "draft",
      template_id: templateId,
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

export async function saveAnnualName(campaignId: string, value: string): Promise<{ error?: string }> {
  const { org } = await requireOrgAdmin();
  const name = value.trim();
  if (!name) return { error: "Give the appraisal a name" };
  const supabase = await createClient();
  const { data, error } = await supabase.from("campaigns").update({ name })
    .eq("id", campaignId).eq("organization_id", org.id).eq("campaign_type", "annual_appraisal")
    .eq("status", "draft").is("questions_frozen_at", null).select("id").single();
  if (error || !data) return { error: error?.message ?? "This draft can no longer be edited" };
  revalidatePath(`/dashboard/campaigns/${campaignId}`);
  revalidatePath("/dashboard/campaigns");
  return {};
}

export async function saveAnnualTemplate(campaignId: string, templateId: string): Promise<{ error?: string }> {
  const { org } = await requireOrgAdmin();
  const supabase = await createClient();
  const validation = await validateTemplate(supabase, org.id, templateId);
  if (validation) return { error: validation };
  const { data, error } = await supabase.from("campaigns").update({ template_id: templateId })
    .eq("id", campaignId).eq("organization_id", org.id).eq("campaign_type", "annual_appraisal")
    .eq("status", "draft").is("questions_frozen_at", null).select("id").single();
  if (error || !data) return { error: error?.message ?? "This draft can no longer be edited" };
  revalidatePath(`/dashboard/campaigns/${campaignId}`);
  revalidatePath("/dashboard/campaigns");
  return {};
}

export async function saveAnnualTiming(campaignId: string, mode: "now" | "later", sendDate: string, closeDate: string): Promise<{ error?: string }> {
  await requireOrgAdmin();
  if (mode !== "now" && mode !== "later") return { error: "Choose when to send" };
  if ((mode === "later" && !validDate(sendDate)) || (mode === "now" && !!sendDate) || (closeDate && !validDate(closeDate)))
    return { error: "Choose valid delivery dates" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_annual_draft_timing", {
    p_campaign_id: campaignId, p_mode: mode, p_send_date: mode === "later" ? sendDate : null, p_close_date: closeDate || null,
  });
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/campaigns/${campaignId}`);
  revalidatePath("/dashboard/campaigns");
  return {};
}

export async function finalizeAnnualDraft(campaignId: string): Promise<{ error?: string }> {
  const { org } = await requireOrgAdmin();
  const supabase = await createClient();
  const { data: campaign, error: readError } = await supabase.from("campaigns")
    .select("id, campaign_type, status, settings, opens_at, timezone")
    .eq("id", campaignId).eq("organization_id", org.id).single();
  if (readError || !campaign || campaign.campaign_type !== "annual_appraisal" || campaign.status !== "draft")
    return { error: "This annual draft is no longer available" };
  const mode = (campaign.settings as Record<string, unknown>)?.draft_delivery_mode;
  if (mode !== "now" && mode !== "later") return { error: "Save a delivery choice before sending" };
  let result;
  if (mode === "later") {
    if (!campaign.opens_at) return { error: "Save a send date before scheduling" };
    const sendDate = campaignLocalDate(campaign.opens_at, campaign.timezone);
    result = await supabase.rpc("schedule_appraisal_campaign", { p_campaign_id: campaignId, p_send_date: sendDate });
  } else {
    result = await supabase.rpc("activate_campaign", { p_campaign_id: campaignId });
    if (!result.error) void nudgeOutboxDrain();
  }
  if (result.error) return { error: result.error.message };
  revalidatePath(`/dashboard/campaigns/${campaignId}`);
  revalidatePath("/dashboard/campaigns");
  revalidatePath("/dashboard");
  return {};
}

export async function saveFeedback360Name(campaignId: string, value: string): Promise<{ error?: string }> {
  const { org } = await requireOrgAdmin();
  const name = value.trim();
  if (!name) return { error: "Give the feedback campaign a name" };
  const supabase = await createClient();
  const { data, error } = await supabase.from("campaigns").update({ name })
    .eq("id", campaignId).eq("organization_id", org.id).eq("campaign_type", "feedback_360")
    .eq("status", "draft").select("id").single();
  if (error || !data) return { error: error?.message ?? "This draft can no longer be edited" };
  revalidatePath(`/dashboard/campaigns/${campaignId}`);
  return {};
}

export async function saveFeedback360Cohort(campaignId: string, subjectId: string, reviewers: { personId: string; relationship: string }[]): Promise<{ error?: string }> {
  await requireOrgAdmin();
  if (!subjectId || !Array.isArray(reviewers)) return { error: "Choose a subject and reviewers" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_feedback_360_cohort", { p_campaign_id: campaignId, p_subject: subjectId,
    p_reviewers: reviewers.map((r) => ({ person_id: r.personId, relationship: r.relationship })) });
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/campaigns/${campaignId}`);
  return {};
}

export async function saveFeedback360Template(campaignId: string, templateId: string): Promise<{ error?: string }> {
  await requireOrgAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_feedback_360_template", { p_campaign_id: campaignId, p_template: templateId });
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/campaigns/${campaignId}`);
  return {};
}

export async function saveFeedback360Timing(campaignId: string, mode: "now" | "later", sendDate: string, closeDate: string): Promise<{ error?: string }> {
  await requireOrgAdmin();
  if ((mode !== "now" && mode !== "later") || (mode === "later" && !validDate(sendDate)) || (mode === "now" && !!sendDate) || (closeDate && !validDate(closeDate)))
    return { error: "Choose valid delivery dates" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_feedback_360_timing", { p_campaign_id: campaignId, p_mode: mode,
    p_send_date: mode === "later" ? sendDate : null, p_close_date: closeDate || null });
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/campaigns/${campaignId}`);
  return {};
}

export async function finalizeFeedback360Draft(campaignId: string, acknowledged: boolean): Promise<{ error?: string }> {
  const { org } = await requireOrgAdmin();
  if (!acknowledged) return { error: "Acknowledge the anonymity policy before sending" };
  const supabase = await createClient();
  const { data: campaign } = await supabase.from("campaigns").select("id, campaign_type, status, settings")
    .eq("id", campaignId).eq("organization_id", org.id).single();
  if (!campaign || campaign.campaign_type !== "feedback_360" || campaign.status !== "draft") return { error: "This 360 draft is no longer available" };
  const { error } = await supabase.rpc("finalize_feedback_360_draft", { p_campaign_id: campaignId, p_acknowledged: true });
  if (error) return { error: error.message };
  if ((campaign.settings as Record<string, unknown>)?.draft_delivery_mode === "now") void nudgeOutboxDrain();
  revalidatePath(`/dashboard/campaigns/${campaignId}`);
  revalidatePath("/dashboard/campaigns");
  revalidatePath("/dashboard");
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
    .select("id, organization_id, campaign_type, status")
    .eq("id", campaignId)
    .eq("organization_id", org.id)
    .single();

  if (!campaign) return { error: "Campaign not found" };
  if (campaign.campaign_type === "feedback_360" && campaign.status === "draft")
    return { error: "Review the anonymous feedback setup and acknowledge the privacy policy before sending" };

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
  const { data: campaign } = await supabase.from("campaigns").select("campaign_type")
    .eq("id", campaignId).single();
  if (!campaign || campaign.campaign_type !== "annual_appraisal")
    redirect(`/dashboard/campaigns/${campaignId}?error=Use+Review+and+Send+to+schedule+feedback`);

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

export async function renameCampaign(
  campaignId: string,
  formData: FormData,
): Promise<void> {
  const { org } = await requireOrgAdmin();
  const supabase = await createClient();
  const name = (formData.get("name") as string | null)?.trim();
  if (!name)
    redirect(`/dashboard/campaigns?error=${encodeURIComponent("Name is required")}`);

  const { data, error } = await supabase
    .from("campaigns")
    .update({ name })
    .eq("id", campaignId)
    .eq("organization_id", org.id)
    .neq("status", "archived")
    .select("id")
    .single();

  if (error || !data)
    redirect(
      `/dashboard/campaigns?error=${encodeURIComponent(error?.message ?? "Unable to rename campaign")}`,
    );

  revalidatePath("/dashboard/campaigns");
  revalidatePath(`/dashboard/campaigns/${campaignId}`);
  redirect("/dashboard/campaigns");
}

export async function archiveCampaign(campaignId: string): Promise<void> {
  await requireOrgAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("archive_campaign", {
    p_campaign_id: campaignId,
  });
  if (error)
    redirect(
      `/dashboard/campaigns?error=${encodeURIComponent(error.message)}`,
    );
  revalidatePath("/dashboard/campaigns");
  redirect("/dashboard/campaigns");
}

/** Permanent delete — drafts only. Live/closed campaigns should be archived. */
export async function deleteCampaign(campaignId: string): Promise<void> {
  const { org } = await requireOrgAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campaigns")
    .delete()
    .eq("id", campaignId)
    .eq("organization_id", org.id)
    .eq("status", "draft")
    .select("id")
    .single();

  if (error || !data)
    redirect(
      `/dashboard/campaigns?error=${encodeURIComponent(
        error?.message ??
          "Only draft campaigns can be deleted. Archive collecting or closed campaigns instead.",
      )}`,
    );

  revalidatePath("/dashboard/campaigns");
  redirect("/dashboard/campaigns");
}

/** Manual reminders to respondents who have not submitted yet. */
export async function sendCampaignReminders(
  campaignId: string,
): Promise<void> {
  await requireOrgAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("send_campaign_reminders", {
    p_campaign_id: campaignId,
  });
  if (error)
    redirect(
      `/dashboard/campaigns?error=${encodeURIComponent(error.message)}`,
    );

  void nudgeOutboxDrain();

  const count = typeof data === "number" ? data : 0;
  revalidatePath("/dashboard/campaigns");
  revalidatePath(`/dashboard/campaigns/${campaignId}`);
  redirect(
    `/dashboard/campaigns?ok=${encodeURIComponent(
      count === 0
        ? "No outstanding recipients to remind right now."
        : `Queued ${count} reminder${count === 1 ? "" : "s"} for people who have not responded.`,
    )}`,
  );
}
