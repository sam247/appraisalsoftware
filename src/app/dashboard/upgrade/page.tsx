import { requireOrgAdmin } from "@/lib/auth/session";
import { billingConfigured } from "@/lib/billing/stripe";
import type { WorkspaceEntitlement } from "@/lib/billing/plan";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import FormSubmit from "@/app/dashboard/form-submit";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "../chrome";
import { openBillingPortal } from "./actions";
import CheckoutReturn from "./checkout-return";
import PlanPicker from "./plan-picker";

interface BillingSummary {
  has_customer: boolean;
  status: string | null;
  plan: string | null;
  interval: "month" | "year" | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

const PLAN_LABEL: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  organisation: "Organisation",
  legacy: "Early access",
};

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; error?: string }>;
}) {
  let orgAdmin;
  try {
    orgAdmin = await requireOrgAdmin();
  } catch {
    redirect("/login");
  }
  const params = await searchParams;
  const supabase = await createClient();
  const [entitlementResult, billingResult] = await Promise.all([
    supabase.rpc("get_workspace_entitlement", { p_organization_id: orgAdmin.org.id }),
    supabase.rpc("get_workspace_billing" as never, { p_organization_id: orgAdmin.org.id } as never),
  ]);
  if (entitlementResult.error || !entitlementResult.data) throw new Error("Unable to load workspace plan");
  const entitlement = entitlementResult.data as unknown as WorkspaceEntitlement;
  // Billing RPC may be absent until the migration is applied; treat as no billing yet.
  const billing = (billingResult.error ? null : billingResult.data) as BillingSummary | null;
  const configured = billingConfigured() && !billingResult.error;
  const paid = entitlement.plan === "pro" || entitlement.plan === "organisation";
  const outcome = params.checkout === "success" || params.checkout === "cancelled" ? params.checkout : null;
  const periodEnd = billing?.current_period_end ? dateFormat.format(new Date(billing.current_period_end)) : null;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <CheckoutReturn outcome={outcome} planActive={paid} />
      <PageHeader title="Plans & billing" subtitle="More room for people, campaigns and admins — and anonymous 360 feedback." />

      {params.error ? (
        <p role="alert" className="mt-6 max-w-2xl rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {params.error}
        </p>
      ) : null}

      <section className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Current plan</p>
          <p className="mt-1 font-display text-xl font-semibold">
            {PLAN_LABEL[entitlement.plan] ?? entitlement.plan}
            {billing?.interval && paid ? (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                billed {billing.interval === "year" ? "annually" : "monthly"}
              </span>
            ) : null}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {billing?.status === "past_due"
              ? "Your last payment didn't go through. Update your card to keep your plan."
              : paid && billing?.cancel_at_period_end && periodEnd
                ? `Cancelled — you keep ${PLAN_LABEL[entitlement.plan]} until ${periodEnd}, then move to Free. Your data stays.`
                : paid && periodEnd
                  ? `Renews on ${periodEnd}.`
                  : entitlement.plan === "free"
                    ? "10 active employees, 1 active campaign and 1 admin. Free forever."
                    : outcome === "success"
                      ? "Confirming your payment…"
                      : null}
          </p>
        </div>
        {billing?.has_customer && configured ? (
          <form action={openBillingPortal}>
            <FormSubmit variant="outline" pendingLabel="Opening billing…">
              Manage billing & invoices
            </FormSubmit>
          </form>
        ) : null}
      </section>

      {entitlement.plan !== "organisation" && entitlement.plan !== "legacy" ? (
        <div className="mt-8">
          {configured ? (
            <PlanPicker currentPlan={entitlement.plan} canCheckout />
          ) : (
            <div className="rounded-xl border border-border bg-surface p-5 text-sm">
              <p className="font-medium">Online upgrades are coming soon.</p>
              <p className="mt-1 text-muted-foreground">Tell us what you need and we&apos;ll switch your workspace today.</p>
              <Button asChild className="mt-4">
                <Link href="/contact?type=pricing&plan=Pro">Talk to us about upgrading</Link>
              </Button>
            </div>
          )}
          <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
            Prices exclude VAT. Payments are handled securely by Stripe; we never see your card details.
            Change plan or cancel any time from &ldquo;Manage billing&rdquo; — if you cancel, you keep your
            plan until the end of the period and your data is never deleted. Need more than 250 employees?{" "}
            <Link href="/contact?type=pricing&plan=Organisation" className="underline underline-offset-2">Talk to us</Link>.
          </p>
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">
          You&apos;re on our largest plan. Need more capacity?{" "}
          <Link href="/contact?type=pricing&plan=Organisation" className="text-primary underline underline-offset-2">Talk to us</Link>.
        </p>
      )}
    </div>
  );
}
