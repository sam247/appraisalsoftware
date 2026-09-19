import type { Metadata } from "next";
import { requireOrgAdmin } from "@/lib/auth/session";
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

  const { org } = orgAdmin;

  return (
    <div className="min-h-screen bg-surface md:flex">
      <AppNavigation organization={org.name} />
      <main id="main-content" className="min-w-0 flex-1">
        <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 md:py-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
