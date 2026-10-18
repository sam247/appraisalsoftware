/**
 * Stripe webhook: keeps workspace plans in step with subscriptions.
 * Signature-verified; the database RPC is idempotent and ignores stale events,
 * so Stripe retries and out-of-order delivery are safe.
 */
import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/billing/stripe";
import { HANDLED_EVENTS, subscriptionToApplyArgs } from "@/lib/billing/webhook";
import { createServiceClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });

  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = await stripe().webhooks.constructEventAsync(await req.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  if (!HANDLED_EVENTS.has(event.type)) return NextResponse.json({ received: true });

  let subscription: Stripe.Subscription | null = null;
  let organizationHint: string | null = null;
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.mode !== "subscription" || !session.subscription)
      return NextResponse.json({ received: true });
    subscription =
      typeof session.subscription === "string"
        ? await stripe().subscriptions.retrieve(session.subscription)
        : session.subscription;
    organizationHint = session.client_reference_id;
  } else {
    subscription = event.data.object as Stripe.Subscription;
  }

  const args = subscriptionToApplyArgs(subscription, event.created, organizationHint);
  const { data, error } = await createServiceClient().rpc("apply_stripe_subscription", args);
  if (error) {
    console.error("[stripe-webhook]", event.type, event.id, error.code, error.message);
    // Non-2xx makes Stripe retry, which covers transient database failures.
    return NextResponse.json({ error: "Not applied" }, { status: 500 });
  }
  return NextResponse.json({ received: true, result: data });
}
