"use server";

import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createPerson(formData: FormData): Promise<void> {
  const { userId, org } = await requireOrgAdmin();
  const supabase = await createClient();

  const email = (formData.get("email") as string | null)?.trim();
  const fullName = (formData.get("full_name") as string | null)?.trim() || null;
  const jobTitle = (formData.get("job_title") as string | null)?.trim() || null;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    redirect("/dashboard/people?error=Enter+a+valid+email+address");

  const { error } = await supabase.from("people").insert({
    organization_id: org.id,
    email,
    full_name: fullName,
    job_title: jobTitle,
    created_by: userId,
  });

  if (error) redirect(`/dashboard/people?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/dashboard/people");
  revalidatePath("/dashboard");
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

  if (!existing) redirect("/dashboard/people?error=Person+not+found");

  const { error } = await supabase
    .from("people")
    .update({
      full_name: (formData.get("full_name") as string | null)?.trim() || null,
      job_title: (formData.get("job_title") as string | null)?.trim() || null,
    })
    .eq("id", personId)
    .eq("organization_id", org.id);

  if (error) redirect(`/dashboard/people?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/dashboard/people");
  revalidatePath("/dashboard");
}

export async function archivePerson(personId: string): Promise<void> {
  const { org } = await requireOrgAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("people")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", personId)
    .eq("organization_id", org.id);

  if (error) redirect(`/dashboard/people?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/dashboard/people");
  revalidatePath("/dashboard");
}

export async function importPeopleCsv(formData: FormData): Promise<void> {
  const { userId, org } = await requireOrgAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/dashboard/people?error=Choose+a+CSV+file+to+upload");
  }
  if (file.size > 1_000_000) {
    redirect("/dashboard/people?error=CSV+must+be+under+1MB");
  }

  const { parsePeopleCsv } = await import("@/lib/people/csv");
  const text = await file.text();
  const { rows, errors } = parsePeopleCsv(text);
  if (!rows.length) {
    const msg = errors[0] ?? "No valid rows found";
    redirect(`/dashboard/people?error=${encodeURIComponent(msg)}`);
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("people")
    .select("email")
    .eq("organization_id", org.id)
    .is("archived_at", null);
  const existingEmails = new Set(
    (existing ?? []).map((p) => p.email.trim().toLowerCase()),
  );

  const toInsert = rows.filter((r) => !existingEmails.has(r.email));
  const skipped = rows.length - toInsert.length;

  if (toInsert.length) {
    const { error } = await supabase.from("people").insert(
      toInsert.map((r) => ({
        organization_id: org.id,
        email: r.email,
        full_name: r.full_name,
        job_title: r.job_title,
        created_by: userId,
      })),
    );
    if (error) {
      redirect(`/dashboard/people?error=${encodeURIComponent(error.message)}`);
    }
  }

  revalidatePath("/dashboard/people");
  revalidatePath("/dashboard");

  const summary = [
    `Imported ${toInsert.length}`,
    skipped ? `skipped ${skipped} existing` : null,
    errors.length ? `${errors.length} row warnings` : null,
  ]
    .filter(Boolean)
    .join(", ");
  redirect(`/dashboard/people?ok=${encodeURIComponent(summary)}`);
}
