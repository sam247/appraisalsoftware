import FormSubmit from "@/app/dashboard/form-submit";
import { requireOrgAdmin } from "@/lib/auth/session";
import { isFreePlan } from "@/lib/billing/plan";
import { DEFAULT_BRAND_COLOR, normalizeBrandColor } from "@/lib/branding";
import type { OrganizationInvitation } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  inviteAdmin,
  removeMember,
  removeOrgLogo,
  revokeInvite,
  updateBrandColor,
  updateOrgName,
  uploadOrgLogo,
} from "./actions";

type MemberWithProfile = {
  id: string;
  user_id: string;
  role: string;
  profiles: { email: string; full_name: string | null } | null;
};

const TABS = [
  { id: "general", label: "General" },
  { id: "branding", label: "Branding" },
  { id: "team", label: "Team" },
  { id: "billing", label: "Billing" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function inviteStatus(inv: OrganizationInvitation): "Pending" | "Accepted" | "Expired" | "Revoked" {
  if (inv.accepted_at) return "Accepted";
  if (inv.revoked_at) return "Revoked";
  if (new Date(inv.expires_at).getTime() < Date.now()) return "Expired";
  return "Pending";
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    inviteUrl?: string;
    saved?: string;
    tab?: string;
  }>;
}) {
  let orgAdmin;
  try {
    orgAdmin = await requireOrgAdmin();
  } catch {
    redirect("/login");
  }

  const { org, userId, membership } = orgAdmin;
  const params = await searchParams;
  const tab: TabId = TABS.some((t) => t.id === params.tab)
    ? (params.tab as TabId)
    : "general";

  const supabase = await createClient();
  const [{ data: rawMembers }, { data: rawInvites }] = await Promise.all([
    supabase
      .from("organization_members")
      .select("id, user_id, role, profiles(email, full_name)")
      .eq("organization_id", org.id)
      .in("role", ["owner", "admin"])
      .order("created_at"),
    supabase
      .from("organization_invitations")
      .select("*")
      .eq("organization_id", org.id)
      .is("accepted_at", null)
      .is("revoked_at", null)
      .order("created_at", { ascending: false }),
  ]);

  const members = (rawMembers ?? []) as unknown as MemberWithProfile[];
  const invites = (rawInvites ?? []) as OrganizationInvitation[];
  const ownerCount = members.filter((m) => m.role === "owner").length;
  const brandColor =
    normalizeBrandColor(org.brand_color) ?? DEFAULT_BRAND_COLOR;
  const free = isFreePlan(org);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-medium tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Manage your organisation and workspace.
        </p>
      </div>

      <nav
        aria-label="Settings sections"
        className="-mx-1 flex gap-1 overflow-x-auto border-b border-border pb-px"
      >
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <Link
              key={t.id}
              href={`/dashboard/settings?tab=${t.id}`}
              className={`shrink-0 border-b-2 px-3 py-2 text-sm transition-colors ${
                active
                  ? "border-primary font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      {params.error ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {params.error}
        </p>
      ) : null}
      {params.saved ? (
        <p role="status" className="text-sm text-primary">
          Saved ✓
        </p>
      ) : null}
      {params.inviteUrl ? (
        <div className="rounded-lg border border-border bg-accent/20 px-3 py-2.5 text-sm">
          <p className="font-medium text-foreground">Invite link ready</p>
          <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
            {params.inviteUrl}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Copy and share this link with your colleague.
          </p>
        </div>
      ) : null}

      {tab === "general" ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Organisation name
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Used across your appraisals and communications.
            </p>
          </div>
          <form action={updateOrgName} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1 space-y-1.5">
              <label htmlFor="org_name" className="sr-only">
                Organisation name
              </label>
              <input
                id="org_name"
                name="name"
                type="text"
                required
                defaultValue={org.name}
                className="w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <FormSubmit size="sm">Save changes</FormSubmit>
          </form>
        </section>
      ) : null}

      {tab === "branding" ? (
        <section className="space-y-8">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Branding</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Add your organisation&apos;s identity to appraisal communications.
            </p>
          </div>

          <div className="space-y-3 border-t border-border pt-5">
            <h3 className="text-sm font-medium text-foreground">Logo</h3>
            {org.logo_url ? (
              <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={org.logo_url}
                  alt={`${org.name} logo`}
                  className="h-12 max-w-[10rem] object-contain object-left"
                />
                <form action={removeOrgLogo}>
                  <FormSubmit size="sm" variant="outline" pendingLabel="Removing…">
                    Remove
                  </FormSubmit>
                </form>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No logo uploaded yet.</p>
            )}
            <form action={uploadOrgLogo} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1 space-y-1.5">
                <label htmlFor="logo" className="block text-xs text-muted-foreground">
                  PNG, JPEG, WebP or SVG · max 1 MB
                </label>
                <input
                  id="logo"
                  name="logo"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  required
                  className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground"
                />
              </div>
              <FormSubmit size="sm" pendingLabel="Uploading…">
                {org.logo_url ? "Replace logo" : "Upload logo"}
              </FormSubmit>
            </form>
          </div>

          <div className="space-y-3 border-t border-border pt-5">
            <h3 className="text-sm font-medium text-foreground">Accent colour</h3>
            <p className="text-xs text-muted-foreground">
              Used for accents on invitations and respondent forms. Light colours
              fall back to the platform jade for button text contrast.
            </p>
            <form action={updateBrandColor} className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <label htmlFor="brand_color" className="sr-only">
                  Accent colour
                </label>
                <input
                  id="brand_color"
                  name="brand_color"
                  type="color"
                  defaultValue={brandColor}
                  className="h-10 w-14 cursor-pointer rounded border border-input bg-surface p-1"
                />
              </div>
              <FormSubmit size="sm">Save colour</FormSubmit>
            </form>
            {org.logo_url || brandColor !== DEFAULT_BRAND_COLOR ? (
              <div className="rounded-lg border border-border bg-card px-4 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Preview
                </p>
                <div className="mt-2 flex items-center gap-3">
                  {org.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={org.logo_url}
                      alt=""
                      className="h-8 max-w-[7rem] object-contain"
                    />
                  ) : null}
                  <div>
                    <p className="text-sm font-medium text-foreground">{org.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Powered by Appraisal Software
                    </p>
                  </div>
                  <span
                    className="ml-auto inline-block size-6 rounded-full ring-1 ring-border"
                    style={{ backgroundColor: brandColor }}
                    aria-hidden
                  />
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {tab === "team" ? (
        <section className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Team</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Manage who can administer this organisation.
            </p>
          </div>

          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface/80 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="hidden px-3 py-2 font-medium sm:table-cell">
                    Email
                  </th>
                  <th className="px-3 py-2 font-medium">Role</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {members.map((m) => {
                  const profile = m.profiles;
                  const isMe = m.user_id === userId;
                  const canRemove =
                    !isMe &&
                    (m.role !== "owner" ||
                      (membership.role === "owner" && ownerCount > 1));
                  return (
                    <tr key={m.id}>
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-foreground">
                          {profile?.full_name ?? profile?.email ?? "—"}
                          {isMe ? (
                            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                              (you)
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-muted-foreground sm:hidden">
                          {profile?.email}
                        </p>
                      </td>
                      <td className="hidden px-3 py-2.5 text-muted-foreground sm:table-cell">
                        {profile?.email}
                      </td>
                      <td className="px-3 py-2.5 capitalize text-muted-foreground">
                        {m.role}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        Active
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {canRemove ? (
                          <form action={removeMember}>
                            <input type="hidden" name="member_id" value={m.id} />
                            <button
                              type="submit"
                              className="text-xs text-muted-foreground hover:text-destructive"
                            >
                              Remove
                            </button>
                          </form>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {invites.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Pending invitations
              </h3>
              <ul className="divide-y divide-border rounded-lg border border-border">
                {invites.map((inv) => {
                  const status = inviteStatus(inv);
                  return (
                    <li
                      key={inv.id}
                      className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm"
                    >
                      <div>
                        <p className="text-foreground">{inv.email}</p>
                        <p className="text-xs capitalize text-muted-foreground">
                          {inv.role} · {status}
                        </p>
                      </div>
                      {status === "Pending" || status === "Expired" ? (
                        <div className="flex items-center gap-3">
                          <form action={inviteAdmin}>
                            <input type="hidden" name="email" value={inv.email} />
                            <button
                              type="submit"
                              className="text-xs font-medium text-primary hover:underline"
                            >
                              Resend
                            </button>
                          </form>
                          <form action={revokeInvite}>
                            <input
                              type="hidden"
                              name="invitation_id"
                              value={inv.id}
                            />
                            <button
                              type="submit"
                              className="text-xs text-muted-foreground hover:text-destructive"
                            >
                              Revoke
                            </button>
                          </form>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          <div className="space-y-3 border-t border-border pt-5">
            <h3 className="text-sm font-medium text-foreground">
              Invite administrator
            </h3>
            <form action={inviteAdmin} className="flex flex-col gap-3 sm:flex-row">
              <input
                name="email"
                type="email"
                required
                placeholder="colleague@company.com"
                className="min-w-0 flex-1 rounded-lg border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <FormSubmit size="sm" pendingLabel="Inviting…">
                Invite
              </FormSubmit>
            </form>
          </div>
        </section>
      ) : null}

      {tab === "billing" ? (
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Billing</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Plan and subscription management.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface/50 px-4 py-4">
            <p className="text-sm text-foreground">
              Current plan:{" "}
              <span className="font-medium">{free ? "Free" : "Paid"}</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Self-serve billing is coming soon. You&apos;ll be able to choose a
              plan and manage your subscription here.
            </p>
            {free ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Prefer an early upgrade path? See{" "}
                <Link
                  href="/dashboard/upgrade"
                  className="font-medium text-primary hover:underline"
                >
                  Upgrade
                </Link>
                .
              </p>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
