"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useConsentManager } from "@c15t/nextjs";
import { createClient } from "@/lib/supabase/client";
import { analyticsReleased, trackEvent } from "@/lib/analytics/events";
import type { WorkspaceEntitlement } from "@/lib/billing/plan";

export function WorkspaceActivation({ orgId, entitlement }: { orgId: string; entitlement: WorkspaceEntitlement | null }) {
 const { has } = useConsentManager();
 const consent = has("measurement");
 const path = usePathname();
 useEffect(() => {
  if (!analyticsReleased || !consent || !entitlement?.first_activated) return;
  void createClient().rpc("claim_first_activation_measurement", { p_organization_id: orgId }).then(({ data, error }) => {
   if (!error && data) trackEvent("campaign_activation");
  });
 }, [consent, entitlement?.first_activated, orgId, path]);
 return null;
}
