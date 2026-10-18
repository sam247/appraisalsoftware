// Creates the Pro and Organisation products and their monthly/annual prices.
// Idempotent: prices are found by lookup key and only created when missing.
// Usage: node --env-file=.env.local scripts/stripe-setup.mjs [--live]
// Refuses live keys unless --live is passed.
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY?.trim();
if (!key) throw new Error("STRIPE_SECRET_KEY is required");
const live = key.includes("_live_");
if (live && !process.argv.includes("--live"))
  throw new Error("Refusing to modify a LIVE Stripe account. Re-run with --live when you mean it.");

const stripe = new Stripe(key);
const catalogue = [
  {
    plan: "pro",
    name: "Appraisal Software Pro",
    description: "75 active employees, 5 active campaigns, 3 admins, anonymous 360 feedback.",
    prices: [
      { lookup_key: "as_pro_monthly", unit_amount: 3999, interval: "month" },
      { lookup_key: "as_pro_annual", unit_amount: 39990, interval: "year" },
    ],
  },
  {
    plan: "organisation",
    name: "Appraisal Software Organisation",
    description: "250 active employees, 20 active campaigns, 10 admins, optional setup session.",
    prices: [
      { lookup_key: "as_org_monthly", unit_amount: 8999, interval: "month" },
      { lookup_key: "as_org_annual", unit_amount: 89990, interval: "year" },
    ],
  },
];

const existing = await stripe.prices.list({
  lookup_keys: catalogue.flatMap((p) => p.prices.map((price) => price.lookup_key)),
  active: true,
  limit: 100,
});
const byKey = new Map(existing.data.map((price) => [price.lookup_key, price]));

for (const entry of catalogue) {
  const found = await stripe.products.search({ query: `metadata['as_plan']:'${entry.plan}'` });
  const product =
    found.data[0] ??
    (await stripe.products.create({
      name: entry.name,
      description: entry.description,
      tax_code: "txcd_10103001", // SaaS, business use
      metadata: { as_plan: entry.plan },
    }));
  for (const price of entry.prices) {
    if (byKey.has(price.lookup_key)) {
      console.log(`✓ ${price.lookup_key} exists`);
      continue;
    }
    await stripe.prices.create({
      product: product.id,
      currency: "gbp",
      unit_amount: price.unit_amount,
      recurring: { interval: price.interval },
      tax_behavior: "exclusive",
      lookup_key: price.lookup_key,
      metadata: { as_plan: entry.plan },
    });
    console.log(`+ ${price.lookup_key} created`);
  }
}
console.log(`Done (${live ? "LIVE" : "test"} mode).`);
