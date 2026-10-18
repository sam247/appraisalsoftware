"use client";

import { toast } from "@/components/ui/toaster";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/** After Stripe returns, wait briefly for the webhook to record the purchase. */
export default function PurchaseReturn({ packName, owned }: { packName: string | null; owned: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const announced = useRef(false);

  useEffect(() => {
    if (!packName || announced.current) return;
    announced.current = true;
    toast.success(`Thank you — ${packName} is yours`, {
      description: "It's ready to use whenever you are. A receipt is on its way by email.",
    });
  }, [packName]);

  useEffect(() => {
    if (!packName) return;
    if (owned) {
      router.replace(`${pathname}#added`, { scroll: false });
      return;
    }
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      router.refresh();
      if (tries >= 8) clearInterval(timer);
    }, 1500);
    return () => clearInterval(timer);
  }, [packName, owned, pathname, router]);

  return null;
}
