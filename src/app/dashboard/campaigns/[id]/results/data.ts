import { createClient } from "@/lib/supabase/server";
import type {
  Campaign,
  CampaignAssignment,
  CampaignQuestion,
  CampaignSubject,
  Person,
  Response,
  ResponseAnswer,
} from "@/lib/types/database";
import type { Feedback360Question } from "./presentation";

export type PeopleById = Record<string, Pick<Person, "id" | "full_name" | "email">>;

export interface AnnualResultsData {
  questions: CampaignQuestion[];
  subjects: CampaignSubject[];
  assignments: CampaignAssignment[];
  responses: Response[];
  answers: ResponseAnswer[];
  peopleById: PeopleById;
}

export async function loadCampaign(id: string, orgId: string): Promise<Campaign | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .eq("organization_id", orgId)
    .single();
  if (error && error.code !== "PGRST116") throw new Error("Unable to load campaign results");
  return (data as Campaign | null) ?? null;
}

/**
 * Every assignment (for completion — closing revokes unsubmitted ones) with
 * submitted responses only (for answers). RLS scopes everything to the admin's workspace.
 */
export async function loadAnnualResults(campaignId: string, orgId: string): Promise<AnnualResultsData> {
  const supabase = await createClient();
  const [questionsResult, subjectsResult, assignmentsResult, peopleResult] = await Promise.all([
    supabase.from("campaign_questions").select("*").eq("campaign_id", campaignId).order("sort_order"),
    supabase.from("campaign_subjects").select("*").eq("campaign_id", campaignId).eq("organization_id", orgId),
    supabase
      .from("campaign_assignments")
      .select("*")
      .eq("campaign_id", campaignId)
      .eq("organization_id", orgId),
    supabase.from("people").select("id, full_name, email").eq("organization_id", orgId),
  ]);
  const assignments = (assignmentsResult.data ?? []) as CampaignAssignment[];
  const responsesResult = assignments.length
    ? await supabase.from("responses").select("*").in("assignment_id", assignments.map((a) => a.id)).eq("status", "submitted")
    : { data: [], error: null };
  const responses = (responsesResult.data ?? []) as Response[];
  const answersResult = responses.length
    ? await supabase.from("response_answers").select("*").in("response_id", responses.map((r) => r.id))
    : { data: [], error: null };

  if ([questionsResult, subjectsResult, assignmentsResult, peopleResult, responsesResult, answersResult].some((r) => r.error))
    throw new Error("Unable to load campaign responses");

  const people = (peopleResult.data ?? []) as Array<Pick<Person, "id" | "full_name" | "email">>;
  return {
    questions: (questionsResult.data ?? []) as CampaignQuestion[],
    subjects: (subjectsResult.data ?? []) as CampaignSubject[],
    assignments,
    responses,
    answers: (answersResult.data ?? []) as ResponseAnswer[],
    peopleById: Object.fromEntries(people.map((p) => [p.id, p])),
  };
}

export interface Feedback360Report {
  state: string;
  completed?: number;
  minimum_responses?: number;
  questions?: Feedback360Question[];
}

export async function loadFeedback360Report(campaignId: string): Promise<Feedback360Report> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("feedback_360_report", { p_campaign_id: campaignId });
  if (error || !data) throw new Error("Unable to load anonymous results");
  return data as unknown as Feedback360Report;
}
