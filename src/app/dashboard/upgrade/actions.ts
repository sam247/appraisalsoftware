"use server";

import { getAppOrigin } from "@/lib/app-origin";
import { requireOrgAdmin } from "@/lib/auth/session";
import { billingConfigured, stripe } from "@/lib/billing/stripe";
import { ensureWorkspaceCustomer } from "@/lib/billing/customer";
import { PRICE_LOOKUP_KEYS, isInterval, isPaidPlan } from "@/lib/billing/stripe-plans";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const UPGRADE = "/dashboard/upgrade";

function fail(message: string): never {
  redirect(`${UPGRADE}?error=${encodeURIComponent(message)}`);
}

async function hasLiveSubscription(orgId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_workspace_billing" as never, { p_organization_id: orgId } as never);
  const status = (data as { status?: string } | null)?.status;
  return status === "active" || status === "trialing" || status === "past_due";
}

export async function startCheckout(formData: FormData): Promise<void> {
  const { org, email } = await requireOrgAdmin();
  const plan = formData.get("plan");
  const interval = formData.get("interval");
  if (!isPaidPlan(plan) || !isInterval(interval)) fail("Choose a plan to continue.");
  if (!billingConfigured()) fail("Online payments aren't available yet. Please contact us to upgrade.");

  // Existing subscribers change plan in the billing portal, never a second subscription.
  if (await hasLiveSubscription(org.id)) return openBillingPortal();

  let url: string | null = null;
  try {
    const customer = await ensureWorkspaceCustomer(org, email);
    const lookupKey = PRICE_LOOKUP_KEYS[plan][interval];
    const prices = await stripe().prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
    const price = prices.data[0];
    if (!price) throw new Error(`Missing Stripe price ${lookupKey}`);
    const origin = getAppOrigin();
    const session = await stripe().checkout.sessions.create({
      mode: "subscription",
      customer,
      line_items: [{ price: price.id, quantity: 1 }],
      client_reference_id: org.id,
      metadata: { organization_id: org.id },
      subscription_data: { metadata: { organization_id: org.id } },
      allow_promotion_codes: true,
      billing_address_collection: "required",
      tax_id_collection: { enabled: true },
      customer_update: { address: "auto", name: "auto" },
      automatic_tax: { enabled: process.env.STRIPE_AUTOMATIC_TAX === "true" },
      success_url: `${origin}${UPGRADE}?checkout=success`,
      cancel_url: `${origin}${UPGRADE}?checkout=cancelled`,
    });
    url = session.url;
  } catch (error) {
    console.error("[billing] checkout failed", error instanceof Error ? error.message : error);
  }
  if (!url) fail("We couldn't start checkout. Please try again, or contact us and we'll sort it.");
  redirect(url);
}

export async function openBillingPortal(): Promise<void> {
  const { org } = await requireOrgAdmin();
  if (!billingConfigured()) fail("Online billing isn't available yet. Please contact us.");
  let url: string | null = null;
  try {
    const service = createServiceClient();
    const { data: customer } = await service.rpc("workspace_stripe_customer", {
      p_organization_id: org.id,
    });
    if (typeof customer !== "string" || !customer) throw new Error("No billing customer");
    const session = await stripe().billingPortal.sessions.create({
      customer,
      return_url: `${getAppOrigin()}${UPGRADE}`,
    });
    url = session.url;
  } catch (error) {
    console.error("[billing] portal failed", error instanceof Error ? error.message : error);
  }
  if (!url) fail("We couldn't open billing. Please try again in a moment.");
  redirect(url);
}
