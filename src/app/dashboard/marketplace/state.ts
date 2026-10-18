import { createClient } from "@/lib/supabase/server";

/** Plan and owned packs for the signed-in admin's workspace. */
export async function workspacePackState(orgId: string): Promise<{ plan: string; purchased: Set<string> }> {
  const supabase = await createClient();
  const [entitlement, purchases] = await Promise.all([
    supabase.rpc("get_workspace_entitlement", { p_organization_id: orgId }),
    supabase.rpc("list_template_purchases" as never, { p_organization_id: orgId } as never),
  ]);
  const plan = (entitlement.data as { plan?: string } | null)?.plan ?? "free";
  // Before the migration is applied the RPC is missing: treat as nothing owned.
  const purchased = new Set<string>(Array.isArray(purchases.data) ? (purchases.data as string[]) : []);
  return { plan, purchased };
}
