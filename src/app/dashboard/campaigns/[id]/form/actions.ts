"use server";

import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function startCampaignForm(campaignId: string, templateId: string | null): Promise<{ revision?: number; error?: string }> {
  await requireOrgAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("start_campaign_form", { p_campaign_id: campaignId, p_template_id: templateId });
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/campaigns/${campaignId}`);
  revalidatePath(`/dashboard/campaigns/${campaignId}/form`);
  revalidatePath("/dashboard/campaigns");
  revalidatePath("/dashboard");
  return { revision: data };
}

export type FormQuestionInput = {
  id: string;
  type: string;
  prompt: string;
  help_text: string | null;
  required: boolean;
  options: string[];
  scale: Record<string, unknown>;
};

export async function saveCampaignForm(campaignId: string, expectedRevision: number, questions: FormQuestionInput[]): Promise<{ revision?: number; error?: string }> {
  await requireOrgAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_campaign_form", {
    p_campaign_id: campaignId,
    p_expected_revision: expectedRevision,
    p_questions: questions,
  });
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/campaigns/${campaignId}`);
  revalidatePath(`/dashboard/campaigns/${campaignId}/form`);
  revalidatePath("/dashboard/campaigns");
  revalidatePath("/dashboard");
  return { revision: data };
}
