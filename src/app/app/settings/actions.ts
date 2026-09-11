"use server";

import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateOrgName(formData: FormData): Promise<void> {
  const { org } = await requireOrgAdmin();
  const supabase = await createClient();

  const name = (formData.get("name") as string | null)?.trim();
  if (!name) redirect("/app/settings?error=" + encodeURIComponent("Name is required"));

  const { error } = await supabase
    .from("organizations")
    .update({ name })
    .eq("id", org.id);

  if (error) {
    redirect(`/app/settings?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/app/settings");
  revalidatePath("/app");
}

export async function inviteAdmin(formData: FormData): Promise<void> {
  const { org } = await requireOrgAdmin();
  const supabase = await createClient();

  const email = (formData.get("email") as string | null)?.trim();
  if (!email) redirect("/app/settings?error=" + encodeURIComponent("Email is required"));

  const { data, error } = await supabase.rpc("create_organization_invitation", {
    p_organization_id: org.id,
    p_email: email,
    p_role: "admin",
  });

  if (error) {
    redirect(`/app/settings?error=${encodeURIComponent(error.message)}`);
  }

  const row = Array.isArray(data) ? data[0] : data;
  const rawToken = row?.raw_token as string | undefined;
  if (!rawToken) {
    redirect("/app/settings?error=" + encodeURIComponent("Invite failed"));
  }

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_ORIGIN ?? "http://localhost:3000"}/invite/${rawToken}`;
  revalidatePath("/app/settings");
  redirect(`/app/settings?inviteUrl=${encodeURIComponent(inviteUrl)}`);
}
