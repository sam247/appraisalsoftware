import { BrandMark } from "@/components/home/Logo";
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
  org_logo_url?: string | null;
  org_brand_color?: string | null;
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
        orgLogoUrl={
          typeof feedback.org_logo_url === "string"
            ? feedback.org_logo_url
            : null
        }
        orgBrandColor={
          typeof feedback.org_brand_color === "string"
            ? feedback.org_brand_color
            : null
        }
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
    if (error)
      console.error("[respond] respond_resolve failed", {
        message: error.message,
        code: error.code,
      });
    return (
      <ErrorPage message="This personal link is invalid, has expired, or the review has closed." />
    );
  }

  const ctx = data[0] as ResolveRow;

  if (
    ctx.response_status === "submitted" ||
    ctx.assignment_status === "submitted"
  ) {
    return (
      <RespondForm
        initialAnswers={[]}
        token={token}
        campaignName={ctx.campaign_name}
        questions={[]}
        relationship={ctx.relationship}
        alreadySubmitted
        orgName={ctx.org_name}
        orgLogoUrl={ctx.org_logo_url}
        orgBrandColor={ctx.org_brand_color}
      />
    );
  }

  // Frozen questions via token-gated SECURITY DEFINER RPC (no anon table access).
  const { data: rawQuestions, error: qErr } = await supabase.rpc(
    "respond_get_questions" as never,
    { p_raw_token: token } as never,
  );

  if (qErr || !rawQuestions?.length) {
    console.error("[respond] respond_get_questions failed", {
      message: qErr?.message ?? "empty questions",
      code: qErr?.code,
    });
    return (
      <ErrorPage message="We couldn’t load the appraisal questions. Please try opening your personal link again." />
    );
  }
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
      orgLogoUrl={ctx.org_logo_url}
      orgBrandColor={ctx.org_brand_color}
    />
  );
}

function ErrorPage({ message }: { message: string }) {
  return (
    <div className="min-h-dvh bg-surface flex items-center justify-center px-5">
      <div className="max-w-md w-full text-center py-16">
        <div className="mb-6 flex justify-center">
          <BrandMark size={40} />
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          We couldn&apos;t open this form
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {message}
        </p>
        <div className="mt-8 rounded-xl border border-border bg-card p-5 text-left">
          <p className="text-sm font-medium text-foreground">Things to try</p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
            <li>Open the most recent invitation email — reminders carry the same personal link.</li>
            <li>Make sure the whole link was copied, if you pasted it.</li>
            <li>Still stuck? Ask the person who sent the invitation for a fresh link.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
