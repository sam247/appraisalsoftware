import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PeopleDirectory, {
  type PeopleDirectoryDepartment,
  type PeopleDirectoryPerson,
} from "./people-directory";

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  let orgAdmin;
  try {
    orgAdmin = await requireOrgAdmin();
  } catch {
    redirect("/login");
  }

  const params = await searchParams;
  const supabase = await createClient();
  const [peopleResult, departmentsResult] = await Promise.all([
    supabase
      .from("people")
      .select(
        "id, email, full_name, job_title, manager_person_id, department_id, archived_at",
      )
      .eq("organization_id", orgAdmin.org.id)
      .order("full_name"),
    supabase
      .from("departments")
      .select("id, name")
      .eq("organization_id", orgAdmin.org.id)
      .order("name"),
  ]);

  if (peopleResult.error) throw new Error("Unable to load people");
  if (departmentsResult.error) throw new Error("Unable to load departments");

  return (
    <PeopleDirectory
      people={(peopleResult.data ?? []) as PeopleDirectoryPerson[]}
      departments={
        (departmentsResult.data ?? []) as PeopleDirectoryDepartment[]
      }
      flash={{ error: params.error, ok: params.ok }}
    />
  );
}
