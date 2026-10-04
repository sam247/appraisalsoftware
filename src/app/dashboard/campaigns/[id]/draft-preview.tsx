"use client";

import { useState } from "react";
import RespondForm from "@/app/r/[token]/respond-form";
import type { Campaign, CampaignQuestion } from "@/lib/types/database";

export default function DraftPreview({ campaign, questions, org, subjectName }: {
  campaign: Pick<Campaign, "name" | "campaign_type">;
  questions: CampaignQuestion[];
  org: { name: string; logoUrl: string | null; brandColor: string };
  subjectName: string;
}) {
  const [role, setRole] = useState("self");
  const anonymous = campaign.campaign_type === "feedback_360";
  return <aside className="draft-preview">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-base font-semibold">Respondent preview</h2>{!anonymous && <label className="text-xs text-muted-foreground">View as <select className="field ml-2" value={role} onChange={(event) => setRole(event.target.value)}><option value="self">Employee</option><option value="manager">Manager</option></select></label>}</div>
    <p className="mt-2 text-xs text-muted-foreground">{anonymous ? "Anonymous reviewer" : "Saved campaign form"} · nothing is submitted</p>
    <div className="respondent-preview">
      {questions.length ? <RespondForm key={role} preview previewQuestionIndex={0} token="" campaignName={campaign.name} questions={questions} relationship={anonymous ? "peer" : role} alreadySubmitted={false} orgName={org.name} orgLogoUrl={org.logoUrl} orgBrandColor={org.brandColor} initialAnswers={[]} anonymous={anonymous} subjectName={subjectName} /> : <div className="flex min-h-80 items-center justify-center p-8 text-center text-sm text-muted-foreground">Build the campaign form to preview the respondent experience.</div>}
    </div>
  </aside>;
}
