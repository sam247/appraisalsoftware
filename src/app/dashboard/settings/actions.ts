"use server";

import { getAppOrigin } from "@/lib/app-origin";
import {
  LOGO_MAX_BYTES,
  LOGO_MIME,
  logoExtension,
  normalizeBrandColor,
} from "@/lib/branding";
import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function settingsPath(
  tab: string,
  extra?: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams({ tab });
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v) params.set(k, v);
    }
  }
  return `/dashboard/settings?${params.toString()}`;
}

export async function updateOrgName(formData: FormData): Promise<void> {
  const { org } = await requireOrgAdmin();
  const supabase = await createClient();

  const name = (formData.get("name") as string | null)?.trim();
  if (!name) {
    redirect(settingsPath("general", { error: "Name is required" }));
  }

  const { error } = await supabase
    .from("organizations")
    .update({ name })
    .eq("id", org.id);

  if (error) {
    redirect(settingsPath("general", { error: error.message }));
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  redirect(settingsPath("general", { saved: "1" }));
}

export async function updateBrandColor(formData: FormData): Promise<void> {
  const { org } = await requireOrgAdmin();
  const supabase = await createClient();

  const raw = (formData.get("brand_color") as string | null)?.trim() ?? "";
  const color = normalizeBrandColor(raw);
  if (!color) {
    redirect(settingsPath("branding", { error: "Choose a valid hex colour" }));
  }

  const { error } = await supabase
    .from("organizations")
    .update({ brand_color: color })
    .eq("id", org.id);

  if (error) {
    redirect(settingsPath("branding", { error: error.message }));
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  redirect(settingsPath("branding", { saved: "1" }));
}

export async function uploadOrgLogo(formData: FormData): Promise<void> {
  const { org } = await requireOrgAdmin();
  const supabase = await createClient();

  const file = formData.get("logo") as File | null;
  if (!file || file.size === 0) {
    redirect(settingsPath("branding", { error: "Choose a logo file" }));
  }
  if (file.size > LOGO_MAX_BYTES) {
    redirect(settingsPath("branding", { error: "Logo must be 1 MB or smaller" }));
  }
  if (!LOGO_MIME.has(file.type)) {
    redirect(
      settingsPath("branding", {
        error: "Use PNG, JPEG, WebP or SVG",
      }),
    );
  }

  const ext = logoExtension(file.type);
  if (!ext) {
    redirect(settingsPath("branding", { error: "Unsupported file type" }));
  }

  const path = `${org.id}/logo.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("org-branding")
    .upload(path, bytes, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    redirect(settingsPath("branding", { error: uploadError.message }));
  }

  const { data: pub } = supabase.storage.from("org-branding").getPublicUrl(path);
  const logoUrl = `${pub.publicUrl}?v=${Date.now()}`;

  const { error } = await supabase
    .from("organizations")
    .update({ logo_url: logoUrl })
    .eq("id", org.id);

  if (error) {
    redirect(settingsPath("branding", { error: error.message }));
  }

  revalidatePath("/dashboard/settings");
  redirect(settingsPath("branding", { saved: "1" }));
}

export async function removeOrgLogo(formData: FormData): Promise<void> {
  void formData;
  const { org } = await requireOrgAdmin();
  const supabase = await createClient();

  // Best-effort remove known extensions; ignore missing objects.
  for (const ext of ["png", "jpg", "jpeg", "webp", "svg"]) {
    await supabase.storage.from("org-branding").remove([`${org.id}/logo.${ext}`]);
  }

  const { error } = await supabase
    .from("organizations")
    .update({ logo_url: null })
    .eq("id", org.id);

  if (error) {
    redirect(settingsPath("branding", { error: error.message }));
  }

  revalidatePath("/dashboard/settings");
  redirect(settingsPath("branding", { saved: "1" }));
}

export async function inviteAdmin(formData: FormData): Promise<void> {
  const { org } = await requireOrgAdmin();
  const supabase = await createClient();

  const email = (formData.get("email") as string | null)?.trim();
  if (!email) {
    redirect(settingsPath("team", { error: "Email is required" }));
  }

  const { data, error } = await supabase.rpc("create_organization_invitation", {
    p_organization_id: org.id,
    p_email: email,
    p_role: "admin",
  });

  if (error) {
    redirect(settingsPath("team", { error: error.message }));
  }

  const row = Array.isArray(data) ? data[0] : data;
  const rawToken = row?.raw_token as string | undefined;
  if (!rawToken) {
    redirect(settingsPath("team", { error: "Invite failed" }));
  }

  const inviteUrl = `${getAppOrigin()}/invite/${rawToken}`;
  revalidatePath("/dashboard/settings");
  redirect(settingsPath("team", { inviteUrl }));
}

export async function revokeInvite(formData: FormData): Promise<void> {
  await requireOrgAdmin();
  const supabase = await createClient();
  const id = (formData.get("invitation_id") as string | null)?.trim();
  if (!id) redirect(settingsPath("team", { error: "Missing invitation" }));

  const { error } = await supabase.rpc("revoke_organization_invitation", {
    p_invitation_id: id,
  });

  if (error) {
    redirect(settingsPath("team", { error: error.message }));
  }

  revalidatePath("/dashboard/settings");
  redirect(settingsPath("team", { saved: "1" }));
}

export async function removeMember(formData: FormData): Promise<void> {
  await requireOrgAdmin();
  const supabase = await createClient();
  const id = (formData.get("member_id") as string | null)?.trim();
  if (!id) redirect(settingsPath("team", { error: "Missing member" }));

  const { error } = await supabase.rpc("remove_organization_member", {
    p_member_id: id,
  });

  if (error) {
    redirect(settingsPath("team", { error: error.message }));
  }

  revalidatePath("/dashboard/settings");
  redirect(settingsPath("team", { saved: "1" }));
}
