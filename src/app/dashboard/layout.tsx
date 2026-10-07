import { WorkspaceActivation } from "@/components/analytics/WorkspaceActivation";
import { type WorkspaceEntitlement } from "@/lib/billing/plan";
import type { Metadata } from "next";
import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { hasLaunchedCampaign } from "./workspace-state";
import AppNavigation from "./app-navigation";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let orgAdmin;
  try {
    orgAdmin = await requireOrgAdmin();
  } catch (error) {
    const reason = error instanceof Error ? error.message : "";
    // Signed in but no workspace → finish setup (never bounce to /login:
    // that loops with the signed-in proxy redirect and whitescreens).
    if (reason === "not_org_admin") {
      redirect("/onboarding");
    }
    redirect("/login");
  }

  const { org, email, membership, userId } = orgAdmin;
  const supabase = await createClient();
  const [profileResult, campaignResult] = await Promise.all([
    supabase.from("profiles").select("full_name, avatar_url").eq("id", userId).maybeSingle(),
    supabase.from("campaigns").select("status,questions_frozen_at,send_claimed_at").eq("organization_id", org.id),
  ]);
  if (campaignResult.error) throw new Error("Unable to load workspace navigation");
  const entitlementResult = await supabase.rpc("get_workspace_entitlement", { p_organization_id: org.id });
  if (entitlementResult.error || !entitlementResult.data) throw new Error("Unable to load workspace access");
  const entitlement = entitlementResult.data as unknown as WorkspaceEntitlement | null;
  const profile = profileResult.data;

  const displayName =
    profile?.full_name?.trim() || email.split("@")[0] || "Account";

  return (
    <AppNavigation
      organization={org.name}
      displayName={displayName}
      email={email}
      role={membership.role}
      avatarUrl={profile?.avatar_url ?? null}
      showUpgrade={entitlement?.plan === "free"}
      showGettingStarted={!(campaignResult.data ?? []).some(hasLaunchedCampaign)}
    >
      <div className="dashboard-content">
        <WorkspaceActivation orgId={org.id} entitlement={entitlement} />
        {children}
      </div>
    </AppNavigation>
  );
}
