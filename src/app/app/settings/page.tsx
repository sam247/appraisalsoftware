import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { updateOrgName, inviteAdmin } from "./actions";
import { Button } from "@/components/ui/button";

type MemberWithProfile = {
  id: string;
  user_id: string;
  role: string;
  profiles: { email: string; full_name: string | null } | null;
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; inviteUrl?: string }>;
}) {
  let orgAdmin;
  try {
    orgAdmin = await requireOrgAdmin();
  } catch {
    redirect("/login");
  }

  const { org, userId } = orgAdmin;
  const params = await searchParams;

  const supabase = await createClient();
  const { data: rawMembers } = await supabase
    .from("organization_members")
    .select("id, user_id, role, profiles(email, full_name)")
    .eq("organization_id", org.id)
    .in("role", ["owner", "admin"])
    .order("created_at");

  const members = (rawMembers ?? []) as unknown as MemberWithProfile[];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your organisation and team.
        </p>
      </div>

      {params.error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {params.error}
        </div>
      )}

      {params.inviteUrl && (
        <div className="rounded-lg border border-border bg-accent/30 px-4 py-3 text-sm text-foreground">
          <p className="font-medium mb-1">Invite link generated</p>
          <p className="font-mono text-xs break-all text-muted-foreground">
            {params.inviteUrl}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Copy and share this link with your colleague.
          </p>
        </div>
      )}

      {/* Org name */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-base font-semibold text-foreground mb-4">
          Organisation
        </h2>
        <form action={updateOrgName} className="flex items-end gap-3">
          <div className="flex-1 space-y-1.5">
            <label
              htmlFor="org_name"
              className="block text-sm font-medium text-foreground"
            >
              Name
            </label>
            <input
              id="org_name"
              name="name"
              type="text"
              required
              defaultValue={org.name}
              className="w-full rounded-lg border border-input bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <Button type="submit" size="sm">
            Save
          </Button>
        </form>
      </section>

      {/* Admins */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-base font-semibold text-foreground mb-4">
          Admins
        </h2>

        {members.length > 0 && (
          <div className="divide-y divide-border rounded-lg border border-border overflow-hidden mb-4">
            {members.map((m) => {
              const profile = m.profiles;
              const isMe = m.user_id === userId;
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {profile?.full_name ?? profile?.email ?? "—"}
                      {isMe && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (you)
                        </span>
                      )}
                    </p>
                    {profile?.full_name && (
                      <p className="text-xs text-muted-foreground">
                        {profile.email}
                      </p>
                    )}
                  </div>
                  <span className="text-xs capitalize text-muted-foreground">
                    {m.role}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <form action={inviteAdmin} className="flex gap-3">
          <input
            name="email"
            type="email"
            required
            placeholder="colleague@company.com"
            className="flex-1 rounded-lg border border-input bg-surface px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button type="submit" size="sm">
            Invite admin
          </Button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">
          Create an invite link to copy and share with another workspace
          administrator.
        </p>
      </section>
    </div>
  );
}
