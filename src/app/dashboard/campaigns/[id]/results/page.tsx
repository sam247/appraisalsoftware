import FeedbackResults from "./feedback-results";
import AnnualResults from "./annual-results";
import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import type {
  Campaign,
  CampaignQuestion,
  CampaignAssignment,
  CampaignSubject,
  Person,
  Response,
  ResponseAnswer,
} from "@/lib/types/database";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let orgAdmin;
  try {
    orgAdmin = await requireOrgAdmin();
  } catch {
    redirect("/login");
  }

  const supabase = await createClient();

  const { data: rawCampaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .eq("organization_id", orgAdmin.org.id)
    .single();

  if (campaignError && campaignError.code !== "PGRST116")
    throw new Error("Unable to load campaign results");
  if (!rawCampaign) notFound();
  const campaign = rawCampaign as Campaign;
  if (campaign.campaign_type === "feedback_360")
    return <FeedbackResults campaign={campaign} />;

  const { data: rawQuestions, error: questionsError } = await supabase
    .from("campaign_questions")
    .select("*")
    .eq("campaign_id", id)
    .order("sort_order");
  const questions = (rawQuestions ?? []) as CampaignQuestion[];

  const { data: rawSubjects, error: subjectsError } = await supabase
    .from("campaign_subjects")
    .select("*")
    .eq("campaign_id", id)
    .eq("organization_id", orgAdmin.org.id);
  const subjects = (rawSubjects ?? []) as CampaignSubject[];

  const { data: rawAssignments, error: assignmentsError } = await supabase
    .from("campaign_assignments")
    .select("*")
    .eq("campaign_id", id)
    .eq("organization_id", orgAdmin.org.id)
    .eq("status", "submitted");
  const assignments = (rawAssignments ?? []) as CampaignAssignment[];

  const assignmentIds = assignments.map((a) => a.id);
  const { data: rawResponses, error: responsesError } =
    assignmentIds.length > 0
      ? await supabase
          .from("responses")
          .select("*")
          .in("assignment_id", assignmentIds)
          .eq("status", "submitted")
      : { data: [], error: null };
  const responses = (rawResponses ?? []) as Response[];

  const responseIds = responses.map((r) => r.id);
  const { data: rawAnswers, error: answersError } =
    responseIds.length > 0
      ? await supabase
          .from("response_answers")
          .select("*")
          .in("response_id", responseIds)
      : { data: [], error: null };
  const answers = (rawAnswers ?? []) as ResponseAnswer[];

  const { data: rawPeople, error: peopleError } = await supabase
    .from("people")
    .select("id, full_name, email")
    .eq("organization_id", orgAdmin.org.id);
  const people = (rawPeople ?? []) as Pick<
    Person,
    "id" | "full_name" | "email"
  >[];
  const peopleById = Object.fromEntries(people.map((p) => [p.id, p]));

  if (
    [
      questionsError,
      subjectsError,
      assignmentsError,
      responsesError,
      answersError,
      peopleError,
    ].some(Boolean)
  )
    throw new Error("Unable to load campaign responses");

  return (
    <AnnualResults
      campaign={campaign}
      questions={questions}
      subjects={subjects}
      assignments={assignments}
      responses={responses}
      answers={answers}
      peopleById={peopleById}
    />
  );
}
