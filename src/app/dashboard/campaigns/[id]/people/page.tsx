import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { Department, Person } from "@/lib/types/database";
import { notFound, redirect } from "next/navigation";
import PeopleWorkspace from "./people-workspace";

export default async function CampaignPeoplePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { id } = await params;
  const messages = await searchParams;
  const { org } = await requireOrgAdmin();
  const supabase = await createClient();
  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("id, name, campaign_type, status")
    .eq("id", id)
    .eq("organization_id", org.id)
    .single();

  if (campaignError && campaignError.code !== "PGRST116") {
    throw new Error("Unable to load campaign");
  }
  if (!campaign) notFound();
  if (campaign.campaign_type !== "annual_appraisal" || campaign.status !== "draft") {
    redirect(`/dashboard/campaigns/${id}`);
  }

  const [subjectResult, assignmentResult, peopleResult, departmentResult] =
    await Promise.all([
      supabase
        .from("campaign_subjects")
        .select("person_id")
        .eq("campaign_id", id)
        .eq("organization_id", org.id),
      supabase
        .from("campaign_assignments")
        .select("subject_person_id, respondent_person_id, relationship")
        .eq("campaign_id", id)
        .eq("organization_id", org.id),
      supabase
        .from("people")
        .select(
          "id, full_name, email, department_id, manager_person_id, archived_at",
        )
        .eq("organization_id", org.id)
        .order("full_name"),
      supabase
        .from("departments")
        .select("id, name")
        .eq("organization_id", org.id)
        .order("name"),
    ]);

  if (
    subjectResult.error ||
    assignmentResult.error ||
    peopleResult.error ||
    departmentResult.error
  ) {
    throw new Error("Unable to load campaign people");
  }

  const managerBySubject = new Map(
    (assignmentResult.data ?? [])
      .filter(
        (assignment) =>
          assignment.relationship === "manager" && assignment.subject_person_id,
      )
      .map((assignment) => [
        assignment.subject_person_id as string,
        assignment.respondent_person_id,
      ]),
  );

  return (
    <PeopleWorkspace
      campaignId={id}
      campaignName={campaign.name}
      people={(peopleResult.data ?? []) as Person[]}
      departments={(departmentResult.data ?? []) as Department[]}
      flash={messages}
      initialSubjects={(subjectResult.data ?? []).map((subject) => ({
        personId: subject.person_id,
        managerPersonId: managerBySubject.get(subject.person_id) ?? null,
      }))}
    />
  );
}
