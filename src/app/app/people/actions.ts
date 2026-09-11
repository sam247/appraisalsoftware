"use server";

import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { QuestionType } from "@/lib/types/database";

export async function createPerson(formData: FormData): Promise<void> {
  const { userId, org } = await requireOrgAdmin();
  const supabase = await createClient();

  const email = (formData.get("email") as string | null)?.trim();
  const fullName = (formData.get("full_name") as string | null)?.trim() || null;
  const jobTitle = (formData.get("job_title") as string | null)?.trim() || null;

  if (!email) return;

  await supabase.from("people").insert({
    organization_id: org.id,
    email,
    full_name: fullName,
    job_title: jobTitle,
    created_by: userId,
  });

  revalidatePath("/app/people");
}

export async function updatePerson(
  personId: string,
  formData: FormData,
): Promise<void> {
  const { org } = await requireOrgAdmin();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("people")
    .select("id")
    .eq("id", personId)
    .eq("organization_id", org.id)
    .single();

  if (!existing) return;

  await supabase
    .from("people")
    .update({
      full_name: (formData.get("full_name") as string | null)?.trim() || null,
      job_title: (formData.get("job_title") as string | null)?.trim() || null,
    })
    .eq("id", personId)
    .eq("organization_id", org.id);

  revalidatePath("/app/people");
}

export async function archivePerson(personId: string): Promise<void> {
  const { org } = await requireOrgAdmin();
  const supabase = await createClient();

  await supabase
    .from("people")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", personId)
    .eq("organization_id", org.id);

  revalidatePath("/app/people");
}
