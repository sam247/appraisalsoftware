import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
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

  // Questions
  const { data: rawQuestions, error: questionsError } = await supabase
    .from("campaign_questions")
    .select("*")
    .eq("campaign_id", id)
    .order("sort_order");
  const questions = (rawQuestions ?? []) as CampaignQuestion[];

  // Subjects
  const { data: rawSubjects, error: subjectsError } = await supabase
    .from("campaign_subjects")
    .select("*")
    .eq("campaign_id", id)
    .eq("organization_id", orgAdmin.org.id);
  const subjects = (rawSubjects ?? []) as CampaignSubject[];

  // Submitted assignments
  const { data: rawAssignments, error: assignmentsError } = await supabase
    .from("campaign_assignments")
    .select("*")
    .eq("campaign_id", id)
    .eq("organization_id", orgAdmin.org.id)
    .eq("status", "submitted");
  const assignments = (rawAssignments ?? []) as CampaignAssignment[];

  // Responses
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
  const responseByAssignmentId = Object.fromEntries(
    responses.map((r) => [r.assignment_id, r]),
  );

  // Answers
  const responseIds = responses.map((r) => r.id);
  const { data: rawAnswers, error: answersError } =
    responseIds.length > 0
      ? await supabase
          .from("response_answers")
          .select("*")
          .in("response_id", responseIds)
      : { data: [], error: null };
  const answers = (rawAnswers ?? []) as ResponseAnswer[];

  // People
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

  // Build lookup: responseId → answers
  const answersByResponseId: Record<string, ResponseAnswer[]> = {};
  for (const a of answers) {
    if (!answersByResponseId[a.response_id])
      answersByResponseId[a.response_id] = [];
    answersByResponseId[a.response_id].push(a);
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-muted-foreground">
          Questions and results will appear once this appraisal has been sent or
          scheduled.
        </p>
        <Link
          href={`/app/campaigns/${id}`}
          className="mt-4 inline-block text-sm text-foreground underline underline-offset-2"
        >
          ← Back to campaign
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-1">
        <Link
          href={`/app/campaigns/${id}`}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← {campaign.name}
        </Link>
      </div>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
        Results
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Employee reflection and manager feedback, side by side. Use the
        responses to guide your review conversation.
      </p>

      {subjects.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          No participants in this campaign.
        </p>
      ) : (
        <div className="mt-8 space-y-10">
          {subjects.map((subject) => {
            const person = peopleById[subject.person_id];
            const subjectAssignments = assignments.filter(
              (a) => a.subject_person_id === subject.person_id,
            );

            const selfAssignment = subjectAssignments.find(
              (a) => a.relationship === "self",
            );
            const managerAssignment = subjectAssignments.find(
              (a) => a.relationship === "manager",
            );

            const selfResponse = selfAssignment
              ? responseByAssignmentId[selfAssignment.id]
              : undefined;
            const managerResponse = managerAssignment
              ? responseByAssignmentId[managerAssignment.id]
              : undefined;

            const selfAnswers = selfResponse
              ? (answersByResponseId[selfResponse.id] ?? [])
              : [];
            const managerAnswers = managerResponse
              ? (answersByResponseId[managerResponse.id] ?? [])
              : [];

            const selfAnswerByQId = Object.fromEntries(
              selfAnswers.map((a) => [a.campaign_question_id, a]),
            );
            const managerAnswerByQId = Object.fromEntries(
              managerAnswers.map((a) => [a.campaign_question_id, a]),
            );

            const managerPerson = managerAssignment?.respondent_person_id
              ? peopleById[managerAssignment.respondent_person_id]
              : undefined;

            return (
              <div
                key={subject.id}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-border">
                  <h2 className="font-display text-xl font-semibold text-foreground">
                    {person?.full_name ?? person?.email ?? subject.person_id}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Manager:{" "}
                    {managerPerson
                      ? (managerPerson.full_name ?? managerPerson.email)
                      : "—"}
                  </p>
                </div>

                {/* Questions grid */}
                <div className="divide-y divide-border">
                  {questions.map((q) => {
                    const selfAns = selfAnswerByQId[q.id];
                    const mgrAns = managerAnswerByQId[q.id];
                    return (
                      <div key={q.id} className="px-5 py-4">
                        <p className="text-sm font-medium text-foreground mb-3">
                          {q.prompt}
                        </p>
                        <div className="grid sm:grid-cols-2 gap-5">
                          <ResponseCell
                            label="Self"
                            answer={selfAns}
                            submitted={!!selfResponse}
                          />
                          <ResponseCell
                            label="Manager"
                            answer={mgrAns}
                            submitted={!!managerResponse}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ResponseCell({
  label,
  answer,
  submitted,
}: {
  label: string;
  answer: ResponseAnswer | undefined;
  submitted: boolean;
}) {
  return (
    <div className="rounded-lg bg-surface px-5 py-4">
      <p className="text-xs font-medium text-muted-foreground mb-1.5">
        {label}
      </p>
      {!submitted ? (
        <p className="text-xs text-muted-foreground italic">Not submitted</p>
      ) : !answer ? (
        <p className="text-xs text-muted-foreground italic">Skipped</p>
      ) : answer.numeric_value !== null &&
        answer.numeric_value !== undefined ? (
        <p className="text-xl font-display font-semibold text-foreground">
          {answer.numeric_value}
          <span className="text-xs font-normal text-muted-foreground ml-1">
            / 5
          </span>
        </p>
      ) : answer.text_value ? (
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-foreground">
          {answer.text_value}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground italic">No answer</p>
      )}
    </div>
  );
}
