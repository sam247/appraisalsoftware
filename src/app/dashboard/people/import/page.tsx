import { employeeCapacity, type WorkspaceEntitlement } from "@/lib/billing/plan";
import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ImportWorkspace from "./import-workspace";

function validReturnTo(value: string | undefined): string {
  if (value && /^\/dashboard\/campaigns\/[^/]+\/(people|reviewers)$/.test(value)) {
    return value;
  }
  return "/dashboard/people";
}

export default async function PeopleImportPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string; error?: string }>;
}) {
  let orgAdmin;
  try {
    orgAdmin = await requireOrgAdmin();
  } catch {
    redirect("/login");
  }

  const params = await searchParams;
  const returnTo = validReturnTo(params.returnTo);
  const supabase = await createClient();
  const { data: people, error } = await supabase
    .from("people")
    .select("email, reviewer_only")
    .eq("organization_id", orgAdmin.org.id)
    .is("archived_at", null);

  if (error) throw new Error("Unable to load people");

  const entitlementResult = await supabase.rpc("get_workspace_entitlement", { p_organization_id: orgAdmin.org.id });
  if (entitlementResult.error || !entitlementResult.data) throw new Error("Unable to load workspace plan");
  const limit = employeeCapacity((entitlementResult.data as unknown as WorkspaceEntitlement).plan);

  return (
    <ImportWorkspace
      employeeLimit={limit}
      activeEmployeeCount={(people ?? []).filter((p) => !p.reviewer_only).length}
      returnTo={returnTo}
      existingEmails={(people ?? []).map((person) => person.email)}
      error={params.error}
    />
  );
}
