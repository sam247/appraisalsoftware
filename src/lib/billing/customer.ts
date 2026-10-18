import { stripe } from "./stripe";
import { createServiceClient } from "@/lib/supabase/admin";

/**
 * The workspace's single Stripe customer, created on first purchase. Shared by
 * plan upgrades and template purchases so invoices live in one place.
 */
export async function ensureWorkspaceCustomer(org: { id: string; name: string }, email: string): Promise<string> {
  const service = createServiceClient();
  const { data: existing, error } = await service.rpc("workspace_stripe_customer", { p_organization_id: org.id });
  if (error) throw new Error("Unable to read billing customer");
  if (typeof existing === "string" && existing) return existing;

  const customer = await stripe().customers.create(
    { email, name: org.name, metadata: { organization_id: org.id } },
    { idempotencyKey: `workspace-customer-${org.id}` },
  );
  const { data: stored, error: storeError } = await service.rpc("set_workspace_stripe_customer", {
    p_organization_id: org.id,
    p_customer: customer.id,
  });
  if (storeError || typeof stored !== "string") throw new Error("Unable to save billing customer");
  return stored;
}
