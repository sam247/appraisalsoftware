import { requireOrgAdmin } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { PageHeader } from "../chrome";
import Link from "next/link";


import { Button } from "@/components/ui/button";

export default async function UpgradePage() {
  let orgAdmin;
  try {
    orgAdmin = await requireOrgAdmin();
  } catch {
    redirect("/login");
  }

  void orgAdmin;

  return (
    <div className="mx-auto w-full">
      <div className="max-w-xl">
      <PageHeader title="Upgrade" subtitle="Choose more capacity for people, campaigns and team admins." />

      <section className="mt-6 max-w-xl">
        <h2 className="text-sm font-semibold">Pro · £39.99/month + VAT</h2>
        <p className="mt-3 text-sm">Free includes 10 active employees, 1 active campaign and 1 admin, with employee appraisals and retained results forever.</p>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>Up to 75 active employees, including CSV imports</li>
          <li>Up to 5 active campaigns</li>
          <li>Up to 3 admins, including the owner</li>
          <li>Annual appraisals and anonymous 360 feedback</li>
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          Paid activation is handled with our team. Tell us which capacity you need and
          we&apos;ll switch the workspace.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/contact?type=pricing&plan=Pro">
              Talk to us about upgrading
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to Home</Link>
          </Button>
        </div>
      </section>
      </div>
    </div>
  );
}
