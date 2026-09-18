import type { Metadata } from "next";
import { requireOrgAdmin } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import AppNavigation from "./app-navigation";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let orgAdmin;
  try {
    orgAdmin = await requireOrgAdmin();
  } catch {
    redirect("/login");
  }

  const { org } = orgAdmin;

  return (
    <div className="min-h-screen bg-surface md:flex">
      <AppNavigation organization={org.name} />
      <main id="main-content" className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 md:py-12 lg:px-12">
          {children}
        </div>
      </main>
    </div>
  );
}
