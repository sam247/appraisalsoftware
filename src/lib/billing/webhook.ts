import type Stripe from "stripe";
import { planForLookupKey } from "./stripe-plans";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Arguments for the `apply_stripe_subscription` RPC. */
export interface ApplySubscriptionArgs {
  p_organization_id: string | null;
  p_customer: string;
  p_subscription: string;
  p_status: string;
  p_plan: string | null;
  p_interval: string | null;
  p_period_end: string | null;
  p_cancel_at_period_end: boolean;
  p_event_at: string;
}

const iso = (seconds: number | null | undefined) =>
  typeof seconds === "number" ? new Date(seconds * 1000).toISOString() : null;

/**
 * Maps a Stripe subscription to the database's view of it. The workspace comes
 * from the checkout hint or subscription metadata; failing that, the database
 * resolves it from the customer.
 */
export function subscriptionToApplyArgs(
  subscription: Stripe.Subscription,
  eventCreated: number,
  organizationHint?: string | null,
): ApplySubscriptionArgs {
  const item = subscription.items.data[0];
  const mapped = planForLookupKey(item?.price.lookup_key);
  const candidate = organizationHint ?? subscription.metadata?.organization_id ?? null;
  const customer =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  return {
    p_organization_id: candidate && UUID_RE.test(candidate) ? candidate : null,
    p_customer: customer,
    p_subscription: subscription.id,
    p_status: subscription.status,
    p_plan: mapped?.plan ?? null,
    p_interval: mapped?.interval ?? null,
    p_period_end: iso(item?.current_period_end),
    p_cancel_at_period_end: Boolean(subscription.cancel_at_period_end || subscription.cancel_at),
    p_event_at: iso(eventCreated)!,
  };
}

/**
 * Arguments for `record_template_purchase`, or null when the session is not a
 * paid template-pack purchase (e.g. an unrelated one-off payment).
 */
export function templatePurchaseArgs(session: Stripe.Checkout.Session): {
  p_organization_id: string;
  p_pack_slug: string;
  p_session: string;
  p_amount: number | null;
  p_currency: string | null;
} | null {
  const org = session.metadata?.organization_id ?? session.client_reference_id ?? "";
  const slug = session.metadata?.pack_slug ?? "";
  if (session.metadata?.kind !== "template_pack" || session.payment_status !== "paid") return null;
  if (!UUID_RE.test(org) || !/^[a-z0-9-]{3,64}$/.test(slug)) return null;
  return {
    p_organization_id: org,
    p_pack_slug: slug,
    p_session: session.id,
    p_amount: session.amount_total ?? null,
    p_currency: session.currency ?? null,
  };
}

export const HANDLED_EVENTS = new Set<string>([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);
