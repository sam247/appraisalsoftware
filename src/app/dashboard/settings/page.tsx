import FormSubmit from "@/app/dashboard/form-submit";
import { BrandMark } from "@/components/home/Logo";
import { requireOrgAdmin } from "@/lib/auth/session";
import { isFreePlan } from "@/lib/billing/plan";
import {
  accentForWhiteText,
  DEFAULT_BRAND_COLOR,
  normalizeBrandColor,
} from "@/lib/branding";
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

const SECTIONS = [
  { id: "general", label: "General" },
  { id: "branding", label: "Branding" },
  { id: "team", label: "Team" },
  { id: "billing", label: "Billing" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const SECTION_COPY: Record<
  SectionId,
  { title: string; description: string }
> = {
  general: {
    title: "General",
    description: "Organisation details used across appraisals and communications.",
  },
  branding: {
    title: "Branding",
    description:
      "Add your organisation&apos;s identity to appraisal emails and respondent forms.",
  },
  team: {
    title: "Team",
    description: "Manage who can administer this organisation.",
  },
  billing: {
    title: "Billing",
    description: "Plan and subscription management.",
  },
};

function inviteStatus(
  inv: OrganizationInvitation,
): "Pending" | "Accepted" | "Expired" | "Revoked" {
  if (inv.accepted_at) return "Accepted";
  if (inv.revoked_at) return "Revoked";
  if (new Date(inv.expires_at).getTime() < Date.now()) return "Expired";
  return "Pending";
}

function BrandingPreview({
  orgName,
  logoUrl,
  brandColor,
}: {
  orgName: string;
  logoUrl: string | null;
  brandColor: string;
}) {
  const accent = accentForWhiteText(brandColor);

  return (
    <aside className="rounded-2xl border border-border/80 bg-surface/50 p-5 lg:sticky lg:top-20">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Preview
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        How identity appears on respondent forms
      </p>

      <div className="mt-4 rounded-xl border border-border bg-card p-5 shadow-[0_12px_32px_-28px_oklch(0.46_0.12_158/0.45)]">
        <div className="space-y-3.5">
          {logoUrl?.trim() ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              className="h-10 max-w-[9rem] object-contain object-left"
            />
          ) : (
            <BrandMark size={36} />
          )}
          <p
            className="text-sm font-medium tracking-wide"
            style={{ color: brandColor }}
          >
            {orgName}
          </p>
          <div>
            <p className="font-display text-lg font-semibold tracking-tight text-foreground">
              Annual appraisal
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              You&apos;ve been invited to complete a short appraisal for{" "}
              {orgName}.
            </p>
          </div>
          <div
            className="inline-flex rounded-lg px-3.5 py-2 text-xs font-semibold text-white"
            style={{ backgroundColor: accent }}
          >
            Begin appraisal
          </div>
          <p className="pt-1 text-[11px] text-muted-foreground/80">
            Powered by Appraisal Software
          </p>
        </div>
      </div>
    </aside>
  );
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
  const tab: SectionId = SECTIONS.some((t) => t.id === params.tab)
    ? (params.tab as SectionId)
    : "general";
  const copy = SECTION_COPY[tab];

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
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Settings
        </p>
        <h1 className="text-xl font-medium tracking-tight text-foreground">
          {copy.title}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {copy.description}
        </p>
      </header>

      {params.error ? (
        <p
          role="alert"
          className="max-w-2xl rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
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
        <div className="max-w-2xl rounded-lg border border-border bg-accent/20 px-3 py-2.5 text-sm">
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
        <section className="max-w-lg space-y-5">
          <form action={updateOrgName} className="space-y-3">
            <div className="space-y-1.5">
              <label
                htmlFor="org_name"
                className="block text-sm font-medium text-foreground"
              >
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
              <p className="text-xs text-muted-foreground">
                Shown on invitations, respondent forms and results.
              </p>
            </div>
            <FormSubmit size="sm">Save changes</FormSubmit>
          </form>
        </section>
      ) : null}

      {tab === "branding" ? (
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,22rem)] lg:items-start lg:gap-10">
          <div className="max-w-xl space-y-8">
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground">Logo</h2>
              {org.logo_url ? (
                <div className="flex items-center gap-4 rounded-xl border border-border/80 bg-card px-4 py-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={org.logo_url}
                    alt={`${org.name} logo`}
                    className="h-12 max-w-[10rem] object-contain object-left"
                  />
                  <form action={removeOrgLogo}>
                    <FormSubmit
                      size="sm"
                      variant="outline"
                      pendingLabel="Removing…"
                    >
                      Remove
                    </FormSubmit>
                  </form>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No logo uploaded yet.
                </p>
              )}
              <form
                action={uploadOrgLogo}
                className="flex flex-col gap-3 sm:flex-row sm:items-end"
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  <label
                    htmlFor="logo"
                    className="block text-xs text-muted-foreground"
                  >
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

            <div className="space-y-3 border-t border-border pt-7">
              <h2 className="text-sm font-semibold text-foreground">
                Accent colour
              </h2>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Used for accents on invitations and respondent forms. Light
                colours fall back to the platform jade for button text contrast.
              </p>
              <form
                action={updateBrandColor}
                className="flex flex-wrap items-center gap-3"
              >
                <label htmlFor="brand_color" className="sr-only">
                  Accent colour
                </label>
                <input
                  id="brand_color"
                  name="brand_color"
                  type="color"
                  defaultValue={brandColor}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-input bg-surface p-1"
                />
                <span className="font-mono text-xs text-muted-foreground">
                  {brandColor}
                </span>
                <FormSubmit size="sm">Save colour</FormSubmit>
              </form>
            </div>
          </div>

          <BrandingPreview
            orgName={org.name}
            logoUrl={org.logo_url}
            brandColor={brandColor}
          />
        </section>
      ) : null}

      {tab === "team" ? (
        <section className="space-y-7">
          <div className="overflow-x-auto rounded-xl border border-border/80">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="border-b border-border bg-surface/70 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Name</th>
                  <th className="px-4 py-2.5 font-medium">Email</th>
                  <th className="px-4 py-2.5 font-medium">Role</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card/40">
                {members.map((m) => {
                  const profile = m.profiles;
                  const isMe = m.user_id === userId;
                  const canRemove =
                    !isMe &&
                    (m.role !== "owner" ||
                      (membership.role === "owner" && ownerCount > 1));
                  return (
                    <tr key={m.id} className="hover:bg-surface/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">
                          {profile?.full_name ?? profile?.email ?? "—"}
                          {isMe ? (
                            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                              (you)
                            </span>
                          ) : null}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {profile?.email}
                      </td>
                      <td className="px-4 py-3 capitalize text-muted-foreground">
                        {m.role}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">Active</td>
                      <td className="px-4 py-3 text-right">
                        {canRemove ? (
                          <form action={removeMember}>
                            <input
                              type="hidden"
                              name="member_id"
                              value={m.id}
                            />
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
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Pending invitations
              </h2>
              <ul className="divide-y divide-border rounded-xl border border-border/80">
                {invites.map((inv) => {
                  const status = inviteStatus(inv);
                  return (
                    <li
                      key={inv.id}
                      className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
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
                            <input
                              type="hidden"
                              name="email"
                              value={inv.email}
                            />
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

          <div className="max-w-lg space-y-3 border-t border-border pt-6">
            <h2 className="text-sm font-semibold text-foreground">
              Invite administrator
            </h2>
            <form
              action={inviteAdmin}
              className="flex flex-col gap-3 sm:flex-row"
            >
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
        <section className="max-w-lg">
          <div className="rounded-2xl border border-border/80 bg-card/50 px-5 py-5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm text-muted-foreground">Current plan</p>
              <p className="text-sm font-semibold text-foreground">
                {free ? "Free" : "Paid"}
              </p>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Self-serve billing is coming soon. You&apos;ll be able to choose a
              plan and manage your subscription here.
            </p>
            {free ? (
              <p className="mt-4 text-xs text-muted-foreground">
                Prefer an early upgrade path?{" "}
                <Link
                  href="/dashboard/upgrade"
                  className="font-medium text-primary hover:underline"
                >
                  See Upgrade
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
