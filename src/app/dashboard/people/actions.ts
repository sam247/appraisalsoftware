"use server";

import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function readOptionalId(formData: FormData, key: string): string | null {
  const raw = (formData.get(key) as string | null)?.trim();
  return raw || null;
}

async function assertManagerAllowed(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  managerId: string | null,
  personId: string | null,
): Promise<string | null> {
  if (!managerId) return null;
  if (personId && managerId === personId) {
    return "A person cannot be their own manager";
  }
  const { data } = await supabase
    .from("people")
    .select("id")
    .eq("id", managerId)
    .eq("organization_id", orgId)
    .is("archived_at", null)
    .maybeSingle();
  if (!data) return "Choose an available manager";
  return null;
}

async function assertDepartmentAllowed(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  departmentId: string | null,
): Promise<string | null> {
  if (!departmentId) return null;
  const { data } = await supabase
    .from("departments")
    .select("id")
    .eq("id", departmentId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!data) return "Choose an available department";
  return null;
}

export async function createDepartment(
  rawName: string,
): Promise<{ id: string; name: string } | { error: string }> {
  const { org } = await requireOrgAdmin();
  const name = rawName.trim().replace(/\s+/g, " ");
  if (!name) return { error: "Enter a department name" };
  if (name.length > 80) return { error: "Department name is too long" };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("departments")
    .select("id, name")
    .eq("organization_id", org.id);

  const match = (existing ?? []).find(
    (d) => d.name.trim().toLowerCase() === name.toLowerCase(),
  );
  if (match) return { id: match.id, name: match.name };

  const { data, error } = await supabase
    .from("departments")
    .insert({ organization_id: org.id, name })
    .select("id, name")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/dashboard/people");
  return { id: data.id, name: data.name };
}

export async function createPerson(formData: FormData): Promise<void> {
  const { userId, org } = await requireOrgAdmin();
  const supabase = await createClient();

  const email = (formData.get("email") as string | null)?.trim();
  const fullName = (formData.get("full_name") as string | null)?.trim() || null;
  const jobTitle = (formData.get("job_title") as string | null)?.trim() || null;
  const managerId = readOptionalId(formData, "manager_person_id");
  const departmentId = readOptionalId(formData, "department_id");

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    redirect("/dashboard/people?error=Enter+a+valid+email+address");

  const managerError = await assertManagerAllowed(
    supabase,
    org.id,
    managerId,
    null,
  );
  if (managerError)
    redirect(`/dashboard/people?error=${encodeURIComponent(managerError)}`);

  const departmentError = await assertDepartmentAllowed(
    supabase,
    org.id,
    departmentId,
  );
  if (departmentError)
    redirect(`/dashboard/people?error=${encodeURIComponent(departmentError)}`);

  const { error } = await supabase.from("people").insert({
    organization_id: org.id,
    email,
    full_name: fullName,
    job_title: jobTitle,
    manager_person_id: managerId,
    department_id: departmentId,
    created_by: userId,
  });

  if (error)
    redirect(`/dashboard/people?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/dashboard/people");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/campaigns");
  redirect("/dashboard/people");
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

  const managerId = readOptionalId(formData, "manager_person_id");
  const departmentId = readOptionalId(formData, "department_id");
  const managerError = await assertManagerAllowed(
    supabase,
    org.id,
    managerId,
    personId,
  );
  if (managerError)
    redirect(`/dashboard/people?error=${encodeURIComponent(managerError)}`);

  const departmentError = await assertDepartmentAllowed(
    supabase,
    org.id,
    departmentId,
  );
  if (departmentError)
    redirect(`/dashboard/people?error=${encodeURIComponent(departmentError)}`);

  const { error } = await supabase
    .from("people")
    .update({
      full_name: (formData.get("full_name") as string | null)?.trim() || null,
      job_title: (formData.get("job_title") as string | null)?.trim() || null,
      manager_person_id: managerId,
      department_id: departmentId,
    })
    .eq("id", personId)
    .eq("organization_id", org.id);

  if (error)
    redirect(`/dashboard/people?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/dashboard/people");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/campaigns");
  redirect("/dashboard/people");
}

export async function archivePerson(personId: string): Promise<void> {
  const { org } = await requireOrgAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("people")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", personId)
    .eq("organization_id", org.id);

  if (error)
    redirect(`/dashboard/people?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/dashboard/people");
  revalidatePath("/dashboard");
}

export async function unarchivePerson(personId: string): Promise<void> {
  const { org } = await requireOrgAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("people")
    .update({ archived_at: null })
    .eq("id", personId)
    .eq("organization_id", org.id);

  if (error)
    redirect(`/dashboard/people?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/dashboard/people");
  revalidatePath("/dashboard");
}

/** Ensure org departments exist for the given names (case-insensitive). */
async function resolveDepartmentIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  names: string[],
): Promise<Map<string, string>> {
  const unique = [
    ...new Set(
      names
        .map((n) => n.trim().replace(/\s+/g, " "))
        .filter(Boolean)
        .map((n) => n),
    ),
  ];
  const byLower = new Map<string, string>();

  const { data: existing } = await supabase
    .from("departments")
    .select("id, name")
    .eq("organization_id", orgId);

  for (const d of existing ?? []) {
    byLower.set(d.name.trim().toLowerCase(), d.id);
  }

  for (const name of unique) {
    const key = name.toLowerCase();
    if (byLower.has(key)) continue;
    const { data, error } = await supabase
      .from("departments")
      .insert({ organization_id: orgId, name })
      .select("id, name")
      .single();
    if (error) {
      // Race: another insert may have won — re-read
      const { data: again } = await supabase
        .from("departments")
        .select("id, name")
        .eq("organization_id", orgId);
      for (const d of again ?? []) {
        byLower.set(d.name.trim().toLowerCase(), d.id);
      }
      if (!byLower.has(key)) throw new Error(error.message);
      continue;
    }
    byLower.set(data.name.trim().toLowerCase(), data.id);
  }

  return byLower;
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

  let deptByLower = new Map<string, string>();
  try {
    deptByLower = await resolveDepartmentIds(
      supabase,
      org.id,
      toInsert
        .map((r) => r.department)
        .filter((d): d is string => Boolean(d)),
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not create departments";
    redirect(`/dashboard/people?error=${encodeURIComponent(msg)}`);
  }

  if (toInsert.length) {
    const { error } = await supabase.from("people").insert(
      toInsert.map((r) => ({
        organization_id: org.id,
        email: r.email,
        full_name: r.full_name,
        job_title: r.job_title,
        department_id: r.department
          ? (deptByLower.get(r.department.trim().toLowerCase()) ?? null)
          : null,
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
    `${toInsert.length} ready imported`,
    skipped ? `${skipped} already exist` : null,
    errors.length ? `${errors.length} need attention` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  redirect(`/dashboard/people?ok=${encodeURIComponent(summary)}`);
}
