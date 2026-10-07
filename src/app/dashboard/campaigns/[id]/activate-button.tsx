"use client";

import Link from "next/link";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { activateCampaign } from "../actions";
import { useRouter } from "next/navigation";

export default function ActivateButton({
  campaignId,
  label = "Send now",
}: {
  campaignId: string;
  label?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleActivate = () => {
    setError(null);
    startTransition(async () => {
      const result = await activateCampaign(campaignId);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div>
      <Button onClick={handleActivate} disabled={isPending} size="sm">
        {isPending ? "Sending…" : label}
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">{error}{error.includes("/dashboard/upgrade") && <> <Link href="/dashboard/upgrade" className="underline">Explore upgrading</Link></>}</p>
      )}
    </div>
  );
}
