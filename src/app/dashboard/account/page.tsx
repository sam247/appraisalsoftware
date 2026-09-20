import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FormSubmit from "@/app/dashboard/form-submit";
import { updatePassword, updateProfileName } from "./actions";

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
    .select("full_name, email")
    .eq("id", orgAdmin.userId)
    .maybeSingle();

  const fullName = profile?.full_name ?? "";
  const email = profile?.email ?? orgAdmin.email;

  return (
    <div className="mx-auto w-full max-w-lg space-y-8">
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
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {params.error}
        </p>
      ) : null}
      {params.saved ? (
        <p
          role="status"
          className="text-sm text-primary"
        >
          Saved ✓
        </p>
      ) : null}

      <section className="space-y-4 border-t border-border pt-6">
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

      <section className="space-y-4 border-t border-border pt-6">
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
