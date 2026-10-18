"use client";

import FormSubmit from "@/app/dashboard/form-submit";
import { paidPlans } from "@/lib/pricing";
import {
  PRICE_AMOUNTS,
  formatGbp,
  type BillingInterval,
  type PaidPlan,
} from "@/lib/billing/stripe-plans";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useState } from "react";
import { startCheckout } from "./actions";

const KEYS: Record<string, PaidPlan> = { Pro: "pro", Organisation: "organisation" };

export default function PlanPicker({
  currentPlan,
  canCheckout,
}: {
  currentPlan: string;
  canCheckout: boolean;
}) {
  const [interval, setInterval] = useState<BillingInterval>("year");

  return (
    <div>
      <div
        role="radiogroup"
        aria-label="Billing period"
        className="inline-flex rounded-lg border border-border bg-surface p-1 text-sm"
      >
        {(["month", "year"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={interval === value}
            onClick={() => setInterval(value)}
            className={cn(
              "rounded-md px-3.5 py-1.5 font-medium transition-colors",
              interval === value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {value === "month" ? "Monthly" : "Annual"}
            {value === "year" && (
              <span className="ml-2 rounded-full bg-accent px-1.5 py-0.5 text-[11px] font-semibold text-accent-foreground">
                2 months free
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {paidPlans.map((plan) => {
          const key = KEYS[plan.name];
          const current = currentPlan === key;
          const amount = PRICE_AMOUNTS[key][interval];
          const perMonth = interval === "year" ? formatGbp(Math.round(amount / 12)) : null;
          return (
            <section
              key={plan.name}
              className={cn(
                "flex flex-col rounded-xl border bg-card p-5",
                key === "pro" ? "border-primary/60 shadow-[0_12px_32px_-24px_var(--primary)]" : "border-border",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-lg font-semibold">{plan.name}</h2>
                {current ? (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                    Current plan
                  </span>
                ) : key === "pro" ? (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                    Most popular
                  </span>
                ) : null}
              </div>
              <p className="mt-3">
                <span className="font-display text-3xl font-semibold tracking-tight">{formatGbp(amount)}</span>
                <span className="text-sm text-muted-foreground"> /{interval === "year" ? "year" : "month"}</span>
              </p>
              <p className="mt-1 h-5 text-xs text-muted-foreground">
                {perMonth ? `Works out at ${perMonth}/month` : "Cancel any time"}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">{plan.audience}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {[
                  `${plan.employees} active employees`,
                  `${plan.campaigns} active campaigns`,
                  `${plan.admins} admins, including you`,
                  "Annual appraisals and anonymous 360 feedback",
                  plan.support,
                ].map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    {feature}
                  </li>
                ))}
              </ul>
              <form action={startCheckout} className="mt-auto pt-6">
                <input type="hidden" name="plan" value={key} />
                <input type="hidden" name="interval" value={interval} />
                <FormSubmit
                  className="h-10 w-full"
                  pendingLabel="Opening secure checkout…"
                  variant={key === "pro" ? "default" : "outline"}
                  disabled={current || !canCheckout}
                >
                  {current ? "Your current plan" : `Upgrade to ${plan.name}`}
                </FormSubmit>
              </form>
            </section>
          );
        })}
      </div>
    </div>
  );
}
