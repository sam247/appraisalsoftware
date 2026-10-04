"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useConsentManager } from "@c15t/nextjs";
import { createClient } from "@/lib/supabase/client";
import { analyticsReleased, trackEvent } from "@/lib/analytics/events";
import type { WorkspaceEntitlement } from "@/lib/billing/trial";

export function WorkspaceTrial({ orgId, entitlement }: { orgId: string; entitlement: WorkspaceEntitlement | null }) {
 const { has } = useConsentManager();
 const consent = has("measurement");
 const path = usePathname();
 useEffect(() => {
  if (!analyticsReleased || !consent || !entitlement?.first_activated) return;
  void createClient().rpc("claim_first_activation_measurement", { p_organization_id: orgId }).then(({ data, error }) => {
   if (!error && data) trackEvent("trial_activation");
  });
 }, [consent, entitlement?.first_activated, orgId, path]);
 if (!entitlement || entitlement.plan !== "trial") return null;
 return <aside role="status" className="mb-5 rounded-lg border border-border bg-card p-4 text-sm">
  {entitlement.can_operate ? <>Your trial ends <time dateTime={entitlement.trial_ends_at!}>{new Date(entitlement.trial_ends_at!).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" })}</time>. Both annual appraisals and anonymous 360 feedback are included.</> : <>Your trial has ended. Collection and operational changes are paused. Your data and completed results remain available.</>}
  {" "}<Link href="/contact?type=pricing&plan=Pro" className="font-medium underline underline-offset-4">Arrange paid activation</Link>.
 </aside>;
}
