"use server";

import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { QuestionType } from "@/lib/types/database";

export async function createTemplate(formData: FormData): Promise<void> {
  const { userId, org } = await requireOrgAdmin();
  const supabase = await createClient();

  const name = (formData.get("name") as string | null)?.trim();
  const description =
    (formData.get("description") as string | null)?.trim() || null;

  if (!name) redirect("/app/templates?error=Name+is+required");

  const { error } = await supabase.from("templates").insert({
    organization_id: org.id,
    name,
    description,
    campaign_type_default: "custom",
    settings: {},
    created_by: userId,
  });

  if (error)
    redirect(`/app/templates?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/app/templates");
}

export async function archiveTemplate(templateId: string): Promise<void> {
  const { org } = await requireOrgAdmin();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("templates")
    .select("id")
    .eq("id", templateId)
    .eq("organization_id", org.id)
    .single();

  if (!existing) redirect("/app/templates?error=Template+not+found");

  const { error } = await supabase
    .from("templates")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", templateId);

  if (error)
    redirect(`/app/templates?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/app/templates");
  redirect("/app/templates");
}

export async function upsertQuestion(
  templateId: string,
  questionId: string | null,
  formData: FormData,
): Promise<void> {
  const { org } = await requireOrgAdmin();
  const supabase = await createClient();

  const { data: template } = await supabase
    .from("templates")
    .select("id")
    .eq("id", templateId)
    .eq("organization_id", org.id)
    .single();

  if (!template) redirect("/app/templates?error=Template+not+found");

  const prompt = (formData.get("prompt") as string | null)?.trim();
  const rawType = (formData.get("type") as string | null) ?? "text";
  const VALID_TYPES: QuestionType[] = [
    "rating",
    "single_choice",
    "multi_choice",
    "text",
    "nps",
  ];
  if (!(VALID_TYPES as string[]).includes(rawType))
    redirect(
      `/app/templates/${templateId}?error=Choose+a+supported+question+type`,
    );
  const type = rawType as QuestionType;
  if (!questionId && !["text", "rating"].includes(type))
    redirect(
      `/app/templates/${templateId}?error=New+questions+support+text+or+rating`,
    );
  const helpText = (formData.get("help_text") as string | null)?.trim() || null;
  const required = formData.get("required") === "on";
  const sortOrder = parseInt(
    (formData.get("sort_order") as string | null) ?? "0",
    10,
  );

  if (!Number.isInteger(sortOrder) || sortOrder < 0)
    redirect(`/app/templates/${templateId}?error=Invalid+question+order`);
  if (!prompt)
    redirect(`/app/templates/${templateId}?error=Prompt+is+required`);

  if (questionId) {
    const { error } = await supabase
      .from("template_questions")
      .update({
        prompt,
        type,
        help_text: helpText,
        required,
        sort_order: sortOrder,
      })
      .eq("id", questionId)
      .eq("organization_id", org.id);

    if (error)
      redirect(
        `/app/templates/${templateId}?error=${encodeURIComponent(error.message)}`,
      );
  } else {
    const { error } = await supabase.from("template_questions").insert({
      template_id: templateId,
      organization_id: org.id,
      prompt,
      type,
      help_text: helpText,
      required,
      sort_order: sortOrder,
      options: [],
      scale: {},
    });

    if (error)
      redirect(
        `/app/templates/${templateId}?error=${encodeURIComponent(error.message)}`,
      );
  }

  revalidatePath(`/app/templates/${templateId}`);
}

export async function deleteQuestion(
  templateId: string,
  questionId: string,
): Promise<void> {
  const { org } = await requireOrgAdmin();
  const supabase = await createClient();

  const { data: template } = await supabase
    .from("templates")
    .select("id")
    .eq("id", templateId)
    .eq("organization_id", org.id)
    .single();

  if (!template) redirect("/app/templates?error=Template+not+found");

  const { error } = await supabase
    .from("template_questions")
    .delete()
    .eq("id", questionId)
    .eq("organization_id", org.id);

  if (error)
    redirect(
      `/app/templates/${templateId}?error=${encodeURIComponent(error.message)}`,
    );

  revalidatePath(`/app/templates/${templateId}`);
}
