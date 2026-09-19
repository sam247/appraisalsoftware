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

  if (!name) redirect("/dashboard/templates?error=Name+is+required");

  const { error } = await supabase.from("templates").insert({
    organization_id: org.id,
    name,
    description,
    campaign_type_default: "custom",
    settings: {},
    created_by: userId,
  });

  if (error)
    redirect(`/dashboard/templates?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/dashboard/templates");
}

export async function updateTemplate(
  templateId: string,
  formData: FormData,
): Promise<void> {
  const { org } = await requireOrgAdmin();
  const supabase = await createClient();

  const name = (formData.get("name") as string | null)?.trim();
  const description =
    (formData.get("description") as string | null)?.trim() || null;

  if (!name) {
    redirect(`/dashboard/templates/${templateId}?error=Name+is+required`);
  }

  const { data: existing } = await supabase
    .from("templates")
    .select("id")
    .eq("id", templateId)
    .eq("organization_id", org.id)
    .single();

  if (!existing) redirect("/dashboard/templates?error=Template+not+found");

  const { error } = await supabase
    .from("templates")
    .update({ name, description })
    .eq("id", templateId)
    .eq("organization_id", org.id);

  if (error) {
    redirect(
      `/dashboard/templates/${templateId}?error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath("/dashboard/templates");
  revalidatePath(`/dashboard/templates/${templateId}`);
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

  if (!existing) redirect("/dashboard/templates?error=Template+not+found");

  const { error } = await supabase
    .from("templates")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", templateId);

  if (error)
    redirect(`/dashboard/templates?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/dashboard/templates");
  redirect("/dashboard/templates");
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

  if (!template) redirect("/dashboard/templates?error=Template+not+found");

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
      `/dashboard/templates/${templateId}?error=Choose+a+supported+question+type`,
    );
  const type = rawType as QuestionType;
  if (!questionId && !["text", "rating"].includes(type))
    redirect(
      `/dashboard/templates/${templateId}?error=New+questions+support+text+or+rating`,
    );
  const helpText = (formData.get("help_text") as string | null)?.trim() || null;
  const required = formData.get("required") === "on";
  const sortOrder = parseInt(
    (formData.get("sort_order") as string | null) ?? "0",
    10,
  );

  if (!Number.isInteger(sortOrder) || sortOrder < 0)
    redirect(`/dashboard/templates/${templateId}?error=Invalid+question+order`);
  if (!prompt)
    redirect(`/dashboard/templates/${templateId}?error=Prompt+is+required`);

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
        `/dashboard/templates/${templateId}?error=${encodeURIComponent(error.message)}`,
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
        `/dashboard/templates/${templateId}?error=${encodeURIComponent(error.message)}`,
      );
  }

  revalidatePath(`/dashboard/templates/${templateId}`);
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

  if (!template) redirect("/dashboard/templates?error=Template+not+found");

  const { error } = await supabase
    .from("template_questions")
    .delete()
    .eq("id", questionId)
    .eq("organization_id", org.id);

  if (error)
    redirect(
      `/dashboard/templates/${templateId}?error=${encodeURIComponent(error.message)}`,
    );

  revalidatePath(`/dashboard/templates/${templateId}`);
}
