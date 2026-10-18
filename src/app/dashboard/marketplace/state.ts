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

type PackSettings = { marketplace_pack?: unknown; marketplace_pack_version?: unknown } | null;

/** Version of a pack a template was installed from; templates from before versioning are v1. */
export function installedVersion(settings: PackSettings): number {
  const v = Number(settings?.marketplace_pack_version);
  return Number.isInteger(v) && v > 0 ? v : 1;
}

/** Highest installed version of each pack among the workspace's active templates. */
export async function installedPackVersions(orgId: string): Promise<Map<string, number>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("templates")
    .select("settings")
    .eq("organization_id", orgId)
    .is("archived_at", null)
    .not("settings->>marketplace_pack", "is", null);
  const versions = new Map<string, number>();
  for (const row of (data ?? []) as Array<{ settings: PackSettings }>) {
    const slug = row.settings?.marketplace_pack;
    if (typeof slug !== "string") continue;
    versions.set(slug, Math.max(versions.get(slug) ?? 0, installedVersion(row.settings)));
  }
  return versions;
}
