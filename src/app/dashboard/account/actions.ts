"use server";

import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateProfileName(formData: FormData): Promise<void> {
  const { userId } = await requireOrgAdmin();
  const supabase = await createClient();

  const fullName = (formData.get("full_name") as string | null)?.trim() ?? "";
  if (!fullName) {
    redirect(
      "/dashboard/account?error=" + encodeURIComponent("Name is required"),
    );
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", userId);

  if (error) {
    redirect(`/dashboard/account?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/account");
  revalidatePath("/dashboard");
  redirect("/dashboard/account?saved=1");
}

export async function updatePassword(formData: FormData): Promise<void> {
  await requireOrgAdmin();
  const supabase = await createClient();

  const password = (formData.get("password") as string | null) ?? "";
  const confirm = (formData.get("confirm") as string | null) ?? "";

  if (password.length < 8) {
    redirect(
      "/dashboard/account?error=" +
        encodeURIComponent("Password must be at least 8 characters"),
    );
  }
  if (password !== confirm) {
    redirect(
      "/dashboard/account?error=" + encodeURIComponent("Passwords do not match"),
    );
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect(`/dashboard/account?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard/account?saved=1");
}
