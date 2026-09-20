import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FormSubmit from "@/app/dashboard/form-submit";
import {
  removeAvatar,
  updatePassword,
  updateProfileName,
  uploadAvatar,
} from "./actions";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  let orgAdmin;
  try {
    orgAdmin = await requireOrgAdmin();
  } catch {
    redirect("/login");
  }

  const params = await searchParams;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, avatar_url")
    .eq("id", orgAdmin.userId)
    .maybeSingle();

  const fullName = profile?.full_name ?? "";
  const email = profile?.email ?? orgAdmin.email;
  const avatarUrl = profile?.avatar_url ?? null;
  const initial = (fullName[0] ?? email[0] ?? "A").toUpperCase();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <div>
        <h1 className="text-xl font-medium tracking-tight text-foreground">
          My account
        </h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Your personal details for this workspace.
        </p>
      </div>

      {params.error ? (
        <p
          role="alert"
          className="max-w-xl rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {params.error}
        </p>
      ) : null}
      {params.saved ? (
        <p role="status" className="text-sm text-primary">
          Saved ✓
        </p>
      ) : null}

      <section className="max-w-xl space-y-4 border-t border-border pt-6">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Photo</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Shown in the top-right account menu. PNG, JPEG or WebP · max 250 KB.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              className="size-14 rounded-full object-cover ring-1 ring-border"
            />
          ) : (
            <span className="flex size-14 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground">
              {initial}
            </span>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <form action={uploadAvatar} className="flex flex-wrap items-end gap-2">
              <input
                id="avatar"
                name="avatar"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                required
                className="block max-w-xs text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground"
              />
              <FormSubmit size="sm" pendingLabel="Uploading…">
                {avatarUrl ? "Replace" : "Upload"}
              </FormSubmit>
            </form>
            {avatarUrl ? (
              <form action={removeAvatar}>
                <FormSubmit size="sm" variant="outline" pendingLabel="Removing…">
                  Remove
                </FormSubmit>
              </form>
            ) : null}
          </div>
        </div>
      </section>

      <section className="max-w-xl space-y-4 border-t border-border pt-6">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Personal details
          </h2>
        </div>
        <form action={updateProfileName} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="full_name"
              className="block text-sm font-medium text-foreground"
            >
              Name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              defaultValue={fullName}
              autoComplete="name"
              className="w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              readOnly
              disabled
              className="w-full rounded-lg border border-input bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">
              Email is managed by your sign-in credentials and cannot be changed
              here.
            </p>
          </div>
          <FormSubmit size="sm">Save changes</FormSubmit>
        </form>
      </section>

      <section className="max-w-xl space-y-4 border-t border-border pt-6">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Security</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Update the password for your Appraisal Software account.
          </p>
        </div>
        <form action={updatePassword} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground"
            >
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="confirm"
              className="block text-sm font-medium text-foreground"
            >
              Confirm password
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <FormSubmit size="sm" pendingLabel="Updating…">
            Update password
          </FormSubmit>
        </form>
      </section>
    </div>
  );
}
