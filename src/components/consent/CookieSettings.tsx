"use client";

import { useConsentDialogTrigger } from "@c15t/nextjs";

export function CookieSettings() {
  const { openDialog } = useConsentDialogTrigger({ showWhen: "always" });
  return <button type="button" onClick={openDialog} className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">Cookie settings</button>;
}
