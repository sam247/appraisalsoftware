import { requireOrgAdmin } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function AppOverviewPage() {
  let orgAdmin;
  try {
    orgAdmin = await requireOrgAdmin();
  } catch {
    redirect("/login");
  }

  const { org } = orgAdmin;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
        Overview
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Welcome to {org.name}&apos;s appraisal workspace.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Campaigns" href="/app/campaigns" />
        <StatCard label="People" href="/app/people" />
        <StatCard label="Templates" href="/app/templates" />
      </div>
    </div>
  );
}

function StatCard({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      className="block rounded-xl border border-border bg-card px-5 py-4 hover:border-foreground/15 hover:shadow-sm transition-all"
    >
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span className="mt-0.5 block text-xs text-muted-foreground">
        Manage →
      </span>
    </a>
  );
}
