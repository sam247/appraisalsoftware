import { Logo } from "@/components/home/Logo";
import { createClient } from "@/lib/supabase/server";
import type { CampaignQuestion } from "@/lib/types/database";
import RespondForm, { type Answer } from "./respond-form";

interface ResolveRow {
  assignment_id: string;
  campaign_id: string;
  organization_id: string;
  respondent_person_id: string;
  subject_person_id: string | null;
  relationship: string | null;
  assignment_status: string;
  campaign_name: string;
  campaign_status: string;
  closes_at: string | null;
  response_id: string;
  response_status: string;
  org_name?: string | null;
}

export default async function RespondPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const supabase = await createClient();

  const { data: kind, error: kindError } = await supabase.rpc(
    "respond_campaign_kind",
    { p_raw_token: token },
  );
  if (kindError)
    return <ErrorPage message="Invalid or expired personal link." />;
  if (kind === "feedback_360") {
    const { data: feedback, error } = await supabase.rpc("feedback_360_open", {
      p_raw_token: token,
    });
    if (error || !feedback)
      return (
        <ErrorPage message="This feedback request is unavailable, closed or expired." />
      );
    return (
      <RespondForm
        token={token}
        anonymous
        subjectName={String(feedback.subject_name || "your colleague")}
        campaignName={String(feedback.campaign_name || "360 feedback")}
        orgName={String(feedback.org_name || "")}
        relationship={null}
        alreadySubmitted={feedback.submitted === true}
        questions={(feedback.questions || []) as CampaignQuestion[]}
        initialAnswers={(feedback.answers || []) as Answer[]}
      />
    );
  }

  // Resolve token via SECURITY DEFINER RPC (anon-accessible)
  const { data, error } = await supabase.rpc("respond_resolve", {
    p_raw_token: token,
  });

  if (error || !data || data.length === 0) {
    return <ErrorPage message={error?.message ?? "Invalid or expired link."} />;
  }

  const ctx = data[0] as ResolveRow;

  if (
    ctx.response_status === "submitted" ||
    ctx.assignment_status === "submitted"
  ) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center py-16">
          <div className="text-4xl mb-4">✓</div>
          <div className="mb-6 flex justify-center">
            <Logo />
          </div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Already submitted
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            You&apos;ve already completed this appraisal. Thank you!
          </p>
        </div>
      </div>
    );
  }

  // Load frozen questions — use service-level select (RLS allows admin select,
  // but since anon calls this RPC we need to select as admin via the existing
  // response context. For the respond path we use anon key + RPC for mutations;
  // for question loading we can use a public RPC or fetch via the campaign_id
  // the resolve RPC returned. Since campaign_questions has no anon policy, we
  // add a lightweight helper: fetch as anon via a SECURITY DEFINER RPC that
  // returns questions for a valid token holder.
  //
  // ponytail: for Phase 2, we fetch questions via a second anon-accessible RPC
  // rather than exposing service key to the client. The questions themselves
  // are non-sensitive (they're the form prompts).
  const { data: rawQuestions, error: qErr } = await supabase.rpc(
    "respond_get_questions" as never,
    { p_raw_token: token } as never,
  );

  if (qErr || !rawQuestions?.length)
    return (
      <ErrorPage message="We couldn’t load the appraisal questions. Please try opening your personal link again." />
    );
  const questions = rawQuestions as CampaignQuestion[];

  const { data: savedAnswers, error: savedError } = await supabase.rpc(
    "respond_get_saved_answers",
    { p_raw_token: token },
  );
  if (savedError)
    return (
      <ErrorPage message="We couldn’t load your saved progress. Please try opening your personal link again." />
    );

  return (
    <RespondForm
      initialAnswers={(savedAnswers ?? []) as Answer[]}
      token={token}
      campaignName={ctx.campaign_name}
      questions={questions}
      relationship={ctx.relationship}
      alreadySubmitted={false}
      orgName={ctx.org_name}
    />
  );
}

function ErrorPage({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center py-16">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <h1 className="font-display text-2xl font-semibold text-foreground mb-3">
          Link unavailable
        </h1>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
