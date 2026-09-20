"use server";

import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const AVATAR_MAX_BYTES = 250 * 1024;
const AVATAR_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);

function avatarExt(mime: string): string | null {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  return null;
}

function accountPath(extra?: Record<string, string>): string {
  const params = new URLSearchParams(extra);
  const q = params.toString();
  return q ? `/dashboard/account?${q}` : "/dashboard/account";
}

export async function updateProfileName(formData: FormData): Promise<void> {
  const { userId } = await requireOrgAdmin();
  const supabase = await createClient();

  const fullName = (formData.get("full_name") as string | null)?.trim() ?? "";
  if (!fullName) {
    redirect(accountPath({ error: "Name is required" }));
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", userId);

  if (error) {
    redirect(accountPath({ error: error.message }));
  }

  revalidatePath("/dashboard/account");
  revalidatePath("/dashboard");
  redirect(accountPath({ saved: "1" }));
}

export async function updatePassword(formData: FormData): Promise<void> {
  await requireOrgAdmin();
  const supabase = await createClient();

  const password = (formData.get("password") as string | null) ?? "";
  const confirm = (formData.get("confirm") as string | null) ?? "";

  if (password.length < 8) {
    redirect(accountPath({ error: "Password must be at least 8 characters" }));
  }
  if (password !== confirm) {
    redirect(accountPath({ error: "Passwords do not match" }));
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect(accountPath({ error: error.message }));
  }

  redirect(accountPath({ saved: "1" }));
}

export async function uploadAvatar(formData: FormData): Promise<void> {
  const { userId } = await requireOrgAdmin();
  const supabase = await createClient();

  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) {
    redirect(accountPath({ error: "Choose an image" }));
  }
  if (file.size > AVATAR_MAX_BYTES) {
    redirect(accountPath({ error: "Image must be 250 KB or smaller" }));
  }
  if (!AVATAR_MIME.has(file.type)) {
    redirect(accountPath({ error: "Use PNG, JPEG or WebP" }));
  }

  const ext = avatarExt(file.type);
  if (!ext) {
    redirect(accountPath({ error: "Unsupported file type" }));
  }

  const path = `${userId}/avatar.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("profile-avatars")
    .upload(path, bytes, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    redirect(accountPath({ error: uploadError.message }));
  }

  const { data: pub } = supabase.storage
    .from("profile-avatars")
    .getPublicUrl(path);
  const avatarUrl = `${pub.publicUrl}?v=${Date.now()}`;

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", userId);

  if (error) {
    redirect(accountPath({ error: error.message }));
  }

  revalidatePath("/dashboard/account");
  revalidatePath("/dashboard");
  redirect(accountPath({ saved: "1" }));
}

export async function removeAvatar(formData: FormData): Promise<void> {
  void formData;
  const { userId } = await requireOrgAdmin();
  const supabase = await createClient();

  for (const ext of ["png", "jpg", "jpeg", "webp"]) {
    await supabase.storage
      .from("profile-avatars")
      .remove([`${userId}/avatar.${ext}`]);
  }

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", userId);

  if (error) {
    redirect(accountPath({ error: error.message }));
  }

  revalidatePath("/dashboard/account");
  revalidatePath("/dashboard");
  redirect(accountPath({ saved: "1" }));
}
