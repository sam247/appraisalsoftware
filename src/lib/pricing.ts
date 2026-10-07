/** Capacities match the durable entitlement migration. Paid activation is manual. */
export const plans = [
  {
    name: "Free",
    price: "£0",
    employees: 10,
    campaigns: 1,
    admins: 1,
    feedback360: false,
    templates: "Standard first-party templates",
    support: "Public guides",
    setup: false,
    audience: "For small teams running real employee appraisals.",
    detail:
      "Free forever for up to 10 active employees. No card required. Keep your results and run your next cycle when the current one closes.",
  },
  {
    name: "Pro",
    price: "£39.99",
    employees: 75,
    campaigns: 5,
    admins: 3,
    feedback360: true,
    templates: "Full template access",
    support: "Email support",
    setup: false,
    audience: "For teams running regular reviews across several managers.",
    detail:
      "More room for people and simultaneous review cycles, with the same focused workflow.",
  },
  {
    name: "Organisation",
    price: "£89.99",
    employees: 250,
    campaigns: 20,
    admins: 10,
    feedback360: true,
    templates: "Full template access",
    support: "Email support + optional setup",
    setup: true,
    audience:
      "For organisations coordinating reviews across more people and teams.",
    detail:
      "Greater capacity and an optional setup session to help organise your first cycle.",
  },
] as const;
export const paidPlans = plans.filter((plan) => plan.name !== "Free");
export function planContactHref(name: string) {
  return `/contact?type=pricing&plan=${encodeURIComponent(name)}`;
}
