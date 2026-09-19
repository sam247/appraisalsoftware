import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PeopleDirectory, {
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
  const { data: rawPeople, error: peopleError } = await supabase
    .from("people")
    .select(
      "id, email, full_name, job_title, manager_person_id, archived_at",
    )
    .eq("organization_id", orgAdmin.org.id)
    .order("full_name");

  if (peopleError) throw new Error("Unable to load people");
  const people = (rawPeople ?? []) as PeopleDirectoryPerson[];

  return (
    <PeopleDirectory
      people={people}
      flash={{ error: params.error, ok: params.ok }}
    />
  );
}
