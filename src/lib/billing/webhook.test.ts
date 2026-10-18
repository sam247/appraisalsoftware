import { describe, expect, it } from "vitest";
import type Stripe from "stripe";
import { PRICE_AMOUNTS, PRICE_LOOKUP_KEYS, formatGbp, planForLookupKey } from "./stripe-plans";
import { subscriptionToApplyArgs, templatePurchaseArgs } from "./webhook";
import { plans } from "@/lib/pricing";

const ORG = "3f2b6c1e-8a4d-4e5f-9b7a-1c2d3e4f5a6b";

function subscription(overrides: Partial<Stripe.Subscription> = {}, lookupKey = "as_pro_annual") {
  return {
    id: "sub_123",
    customer: "cus_123",
    status: "active",
    cancel_at_period_end: false,
    cancel_at: null,
    metadata: {},
    items: { data: [{ price: { lookup_key: lookupKey }, current_period_end: 1_800_000_000 }] },
    ...overrides,
  } as unknown as Stripe.Subscription;
}

describe("stripe plans", () => {
  it("round-trips every lookup key", () => {
    for (const plan of ["pro", "organisation"] as const)
      for (const interval of ["month", "year"] as const)
        expect(planForLookupKey(PRICE_LOOKUP_KEYS[plan][interval])).toEqual({ plan, interval });
    expect(planForLookupKey("something_else")).toBeNull();
    expect(planForLookupKey(null)).toBeNull();
  });

  it("keeps monthly prices in step with the public pricing table", () => {
    expect(formatGbp(PRICE_AMOUNTS.pro.month)).toBe(plans.find((p) => p.name === "Pro")!.price);
    expect(formatGbp(PRICE_AMOUNTS.organisation.month)).toBe(plans.find((p) => p.name === "Organisation")!.price);
    expect(PRICE_AMOUNTS.pro.year).toBe(PRICE_AMOUNTS.pro.month * 10);
  });
});

describe("subscriptionToApplyArgs", () => {
  it("maps plan, interval, period and event time", () => {
    const args = subscriptionToApplyArgs(subscription(), 1_790_000_000, ORG);
    expect(args).toMatchObject({
      p_organization_id: ORG,
      p_customer: "cus_123",
      p_subscription: "sub_123",
      p_status: "active",
      p_plan: "pro",
      p_interval: "year",
      p_period_end: new Date(1_800_000_000 * 1000).toISOString(),
      p_cancel_at_period_end: false,
      p_event_at: new Date(1_790_000_000 * 1000).toISOString(),
    });
  });

  it("falls back to subscription metadata, then to the customer", () => {
    expect(subscriptionToApplyArgs(subscription({ metadata: { organization_id: ORG } }), 1).p_organization_id).toBe(ORG);
    expect(subscriptionToApplyArgs(subscription(), 1).p_organization_id).toBeNull();
  });

  it("rejects malformed workspace ids rather than passing them to the database", () => {
    expect(subscriptionToApplyArgs(subscription({ metadata: { organization_id: "'; drop" } }), 1).p_organization_id).toBeNull();
  });

  it("treats scheduled cancellation either way Stripe reports it", () => {
    expect(subscriptionToApplyArgs(subscription({ cancel_at_period_end: true }), 1).p_cancel_at_period_end).toBe(true);
    expect(subscriptionToApplyArgs(subscription({ cancel_at: 1_800_000_000 }), 1).p_cancel_at_period_end).toBe(true);
  });

  it("leaves the plan unset for unknown prices so entitlements are not changed", () => {
    const args = subscriptionToApplyArgs(subscription({}, "legacy_price"), 1);
    expect(args.p_plan).toBeNull();
    expect(args.p_interval).toBeNull();
  });
});

describe("templatePurchaseArgs", () => {
  const session = (overrides: Partial<Stripe.Checkout.Session> = {}) =>
    ({
      id: "cs_123",
      mode: "payment",
      payment_status: "paid",
      amount_total: 5880,
      currency: "gbp",
      client_reference_id: ORG,
      metadata: { kind: "template_pack", pack_slug: "annual-appraisal-pack", organization_id: ORG },
      ...overrides,
    }) as unknown as Stripe.Checkout.Session;

  it("records paid template-pack sessions", () => {
    expect(templatePurchaseArgs(session())).toEqual({
      p_organization_id: ORG,
      p_pack_slug: "annual-appraisal-pack",
      p_session: "cs_123",
      p_amount: 5880,
      p_currency: "gbp",
    });
  });

  it("ignores unpaid, unrelated or malformed sessions", () => {
    expect(templatePurchaseArgs(session({ payment_status: "unpaid" }))).toBeNull();
    expect(templatePurchaseArgs(session({ metadata: { pack_slug: "annual-appraisal-pack" } }))).toBeNull();
    expect(templatePurchaseArgs(session({ metadata: { kind: "template_pack", pack_slug: "Bad Slug", organization_id: ORG } }))).toBeNull();
    expect(templatePurchaseArgs(session({ metadata: { kind: "template_pack", pack_slug: "x-pack", organization_id: "nope" }, client_reference_id: null }))).toBeNull();
  });
});
