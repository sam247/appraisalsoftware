"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { activateCampaign } from "../actions";
import { useRouter } from "next/navigation";

export default function ActivateButton({
  campaignId,
}: {
  campaignId: string;
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
      <Button onClick={handleActivate} disabled={isPending}>
        {isPending ? "Sending…" : "Send now"}
      </Button>
      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
