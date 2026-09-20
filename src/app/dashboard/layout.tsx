import type { Metadata } from "next";
import { requireOrgAdmin } from "@/lib/auth/session";
import { isFreePlan } from "@/lib/billing/plan";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
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
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();

  const displayName =
    profile?.full_name?.trim() || email.split("@")[0] || "Account";

  return (
    <AppNavigation
      organization={org.name}
      displayName={displayName}
      email={email}
      role={membership.role}
      showUpgrade={isFreePlan(org)}
    >
      <div className="w-full px-4 py-5 sm:px-6 md:px-8 md:py-6">
        {children}
      </div>
    </AppNavigation>
  );
}
