/** Capacities match the durable entitlement migration. Paid activation is manual. */
export const plans = [
  {
    name: "Trial",
    price: "£0",
    employees: 75,
    campaigns: 5,
    admins: 3,
    setup: false,
    audience: "For organisations evaluating annual appraisals and anonymous 360 feedback.",
    detail:
      "14 days with Pro capacity, without a payment card. After expiry your workspace becomes read-only until paid activation.",
  },
  {
    name: "Pro",
    price: "£39.99",
    employees: 75,
    campaigns: 5,
    admins: 3,
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
    setup: true,
    audience:
      "For organisations coordinating reviews across more people and teams.",
    detail:
      "Greater capacity and an optional setup session to help organise your first cycle.",
  },
] as const;
export const paidPlans = plans.filter((plan) => plan.name !== "Trial");
export function planContactHref(name: string) {
  return `/contact?type=pricing&plan=${encodeURIComponent(name)}`;
}
