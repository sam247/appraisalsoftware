import { requireOrgAdmin } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CONTACT_URL } from "@/lib/links";
import { isFreePlan } from "@/lib/billing/plan";
import { Button } from "@/components/ui/button";

export default async function UpgradePage() {
  let orgAdmin;
  try {
    orgAdmin = await requireOrgAdmin();
  } catch {
    redirect("/login");
  }

  if (!isFreePlan(orgAdmin.org)) {
    redirect("/dashboard/settings");
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Upgrade
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        You&apos;re on the free plan. Upgrade when you need more capacity for
        people, campaigns and team admins.
      </p>

      <section className="mt-6 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Paid workspace</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>Larger people directories and CSV imports</li>
          <li>More concurrent appraisal campaigns</li>
          <li>Additional admin seats</li>
          <li>Priority support</li>
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          Self-serve billing is coming. For now, tell us you want to upgrade and
          we&apos;ll switch the workspace.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild>
            <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer">
              Talk to us about upgrading
            </a>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to Home</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
