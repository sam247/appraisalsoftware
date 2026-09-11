import { createClient } from "@/lib/supabase/server";
import type { Organization, OrganizationMember } from "@/lib/types/database";

export interface OrgAdmin {
  userId: string;
  org: Organization;
  membership: OrganizationMember;
}

export async function getSessionUser(): Promise<{
  id: string;
  email: string | undefined;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return { id: user.id, email: user.email };
}

/**
 * Never trust a client-supplied organization_id — derive it from membership.
 */
export async function requireOrgAdmin(): Promise<OrgAdmin> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("unauthenticated");
  }

  const { data: membership, error: memberError } = await supabase
    .from("organization_members")
    .select("*, organizations(*)")
    .eq("user_id", user.id)
    .in("role", ["owner", "admin"])
    .maybeSingle();

  if (memberError || !membership) {
    throw new Error("not_org_admin");
  }

  const row = membership as OrganizationMember & {
    organizations: Organization;
  };

  return {
    userId: user.id,
    org: row.organizations,
    membership: row,
  };
}
