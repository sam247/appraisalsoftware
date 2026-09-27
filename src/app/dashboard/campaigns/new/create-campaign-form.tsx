"use client";

import FormSubmit from "@/app/dashboard/form-submit";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createCampaign } from "../actions";
import type { PickerDepartment, PickerPerson } from "../people-picker";

export type CreateTemplateOption = {
  id: string;
  name: string;
  campaign_type_default: string;
  questionCount: number;
  questions: { id: string; prompt: string; type: string }[];
};
export type CreatePersonOption = PickerPerson;

export default function CreateCampaignForm({
  is360, error, initialTemplateId = "",
}: {
  is360: boolean;
  templates: CreateTemplateOption[];
  people: CreatePersonOption[];
  departments: PickerDepartment[];
  timezone: string;
  error?: string;
  initialTemplateId?: string;
}) {
  const kind = is360 ? "360 feedback" : "Annual appraisal";
  return (
    <div className="dashboard-workspace space-y-6">
      <div className="max-w-3xl">
        <Link href="/dashboard/campaigns" className="text-xs text-muted-foreground hover:text-foreground">← Campaigns</Link>
        <p className="mt-5 text-xs font-medium uppercase tracking-wide text-muted-foreground">{kind}</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">Create {is360 ? "feedback" : "an appraisal"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Name the draft now. You can configure {is360 ? "the subject, reviewers, questions and delivery" : "people, questions and delivery"} after it is saved.
        </p>
      </div>
      {error && <p role="alert" className="max-w-3xl rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
      <form action={createCampaign} className="max-w-3xl space-y-5 rounded-xl border border-border bg-card p-5 sm:p-7">
        <input type="hidden" name="campaign_type" value={is360 ? "feedback_360" : "annual_appraisal"} />
        <input type="hidden" name="template_id" value={is360 ? "" : initialTemplateId} />
        <label className="block max-w-xl text-sm">
          <span className="font-medium">Campaign name</span>
          <input name="name" required maxLength={160} autoFocus placeholder={is360 ? "e.g. 2026 Leadership Feedback" : "e.g. 2026 Annual Appraisals"}
            className="mt-1.5 w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </label>
        {is360 && <p className="text-xs text-muted-foreground">Feedback is anonymous. You will review the five-reviewer minimum and privacy policy before sending.</p>}
        <div className="flex flex-wrap gap-2">
          <FormSubmit pendingLabel="Creating…">{is360 ? "Create feedback draft" : "Create appraisal"}</FormSubmit>
          <Button asChild variant="ghost"><Link href="/dashboard/campaigns">Cancel</Link></Button>
        </div>
      </form>
    </div>
  );
}
