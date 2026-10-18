"use client";

import { toast } from "@/components/ui/toaster";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * After Stripe redirects back, the webhook may land a moment later. Celebrate,
 * then refresh briefly until the new plan shows, and tidy the URL.
 */
export default function CheckoutReturn({
  outcome,
  planActive,
}: {
  outcome: "success" | "cancelled" | null;
  planActive: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const announced = useRef(false);

  useEffect(() => {
    if (!outcome || announced.current) return;
    announced.current = true;
    if (outcome === "success")
      toast.success("Thank you — you're upgraded", {
        description: "Your new limits apply straight away. A receipt is on its way by email.",
      });
    else toast.info("Checkout cancelled", { description: "No payment was taken." });
  }, [outcome]);

  useEffect(() => {
    if (outcome !== "success") return;
    if (planActive) {
      router.replace(pathname, { scroll: false });
      return;
    }
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      router.refresh();
      if (tries >= 8) clearInterval(timer);
    }, 1500);
    return () => clearInterval(timer);
  }, [outcome, planActive, pathname, router]);

  useEffect(() => {
    if (outcome === "cancelled") router.replace(pathname, { scroll: false });
  }, [outcome, pathname, router]);

  return null;
}
