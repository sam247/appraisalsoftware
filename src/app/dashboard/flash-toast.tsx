"use client";

import { toast } from "@/components/ui/toaster";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

/**
 * Server actions report success by redirecting with a flash param. Show it as
 * a toast once, then drop the param so a refresh or shared link stays quiet.
 */
const FLASH_KEYS = ["ok", "saved", "sent", "scheduled"] as const;

export function flashMessage(
  key: (typeof FLASH_KEYS)[number],
  value: string,
): { title: string; description?: string } {
  switch (key) {
    case "saved":
      return { title: value === "1" ? "Changes saved" : value };
    case "sent":
      return {
        title: "Your campaign is on its way",
        description: "Invitations are being emailed now. We'll track every response for you.",
      };
    case "scheduled":
      return {
        title: "Campaign scheduled",
        description: "Invitations will go out automatically on the send date.",
      };
    default:
      return { title: value };
  }
}

export default function FlashToast() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const present = FLASH_KEYS.filter((key) => params.get(key));
    if (present.length === 0) return;
    for (const key of present) {
      const { title, description } = flashMessage(key, params.get(key) ?? "");
      toast.success(title, { description });
    }
    const next = new URLSearchParams(params.toString());
    for (const key of present) next.delete(key);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [params, pathname, router]);

  return null;
}
