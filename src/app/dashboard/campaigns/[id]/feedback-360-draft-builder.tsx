"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { campaignDate, campaignLocalDate, reminderSummary, setupCompleteness } from "../presentation";
import { draftPrimaryAction, type DraftDeliveryMode } from "../draft-action";
import DraftConfirmationDialog from "../draft-confirmation-dialog";
import {
  finalizeFeedback360Draft, saveFeedback360Name,
  saveFeedback360Timing,
} from "../actions";
import type { Campaign, CampaignAssignment, Person, TemplateQuestion } from "@/lib/types/database";

type Section = "details" | "people" | "questions" | "timing";
const field = "mt-1.5 w-full field";

export default function Feedback360DraftBuilder({
  campaign, subject, assignments, validReviewerCount, questions, templateName, ready,
}: {
  campaign: Campaign; subject: Person | null; assignments: CampaignAssignment[];
  validReviewerCount: number; questions: TemplateQuestion[];
  templateName: string | null; ready: boolean;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<Section | null>(null);
  const [name, setName] = useState(campaign.name);
  const [mode, setMode] = useState<"" | "now" | "later">(
    campaign.settings?.draft_delivery_mode === "now" || campaign.settings?.draft_delivery_mode === "later"
      ? campaign.settings.draft_delivery_mode : "",
  );
  const localDate = (value: string | null) => campaignLocalDate(value, campaign.timezone);
  const [sendDate, setSendDate] = useState(localDate(campaign.opens_at));
  const [closeDate, setCloseDate] = useState(localDate(campaign.closes_at));
  const [error, setError] = useState<string | null>(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const savedMode = campaign.settings?.draft_delivery_mode;
  const deliveryMode: DraftDeliveryMode =
    savedMode === "now" || savedMode === "later" ? savedMode : "";
  const dirty = expanded === "details" ? name !== campaign.name
    : expanded === "timing" ? mode !== (savedMode ?? "") || sendDate !== localDate(campaign.opens_at) || closeDate !== localDate(campaign.closes_at)
    : false;
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const changeSection = (next: Section | null) => {
    if (dirty && !window.confirm("Discard unsaved changes in this section?")) return;
    setName(campaign.name);
    setMode(savedMode === "now" || savedMode === "later" ? savedMode : "");
    setSendDate(localDate(campaign.opens_at));
    setCloseDate(localDate(campaign.closes_at));
    setError(null);
    setExpanded(next);
  };
  const finishLater = () => {
    if (dirty && !window.confirm("Discard unsaved changes? Saved sections will remain available.")) return;
    router.push("/dashboard/campaigns");
  };
  const save = () => {
    if (!expanded) return;
    setError(null);
    const section = expanded;
    startTransition(async () => {
      const result = section === "details" ? await saveFeedback360Name(campaign.id, name)
        : section === "people" ? { error: "Open Edit subject & reviewers to change participants" }
        : section === "questions" ? { error: "Open Edit form to change questions" }
        : await saveFeedback360Timing(campaign.id, mode as "now" | "later", mode === "later" ? sendDate : "", closeDate);
      if (result.error) { setError(result.error); return; }
      setExpanded(null);
      router.refresh();
    });
  };
  const confirmFinal = (acknowledged: boolean) => {
    setError(null);
    startTransition(async () => {
      const result = await finalizeFeedback360Draft(campaign.id, acknowledged);
      if (result.error) {
        setError(result.error);
        router.refresh();
        return;
      }
      setConfirmationOpen(false);
      router.refresh();
    });
  };
  const setup = setupCompleteness({
    campaign, subjectCount: subject ? 1 : 0,
    assignmentCount: validReviewerCount === assignments.length ? validReviewerCount : 0, questionCount: questions.every((q) => q.type === "rating" || q.type === "text") && (campaign.questions_frozen_at !== null || campaign.form_started_at !== null || !!campaign.template_id) ? questions.length : 0,
  });
  const canFinish = ready && setup.ready && validReviewerCount >= 5;
  const primaryAction = draftPrimaryAction(deliveryMode, canFinish);
  const sections: { key: Section; label: string; summary: string; done: boolean }[] = [
    { key: "details", label: "Details", summary: campaign.name + " · Anonymous 360 feedback", done: !!campaign.name.trim() },
    { key: "people", label: "Subject & Reviewers", summary: subject ? `${subject.full_name || subject.email} · ${assignments.length} ${assignments.length === 1 ? "reviewer" : "reviewers"}` : "Choose a subject and reviewers", done: setup.steps[1].done },
    { key: "questions", label: "Questions", summary: questions.length ? `${templateName ?? "Campaign form"} · ${questions.length} ${questions.length === 1 ? "question" : "questions"}` : "Build the feedback form", done: setup.steps[2].done },
    { key: "timing", label: "Timing", summary: savedMode === "now" ? `Send now${campaign.closes_at ? ` · Closes ${campaignDate(campaign.closes_at, campaign.timezone)}` : ""}` : savedMode === "later" && campaign.opens_at ? `Send ${campaignDate(campaign.opens_at, campaign.timezone, true)}${campaign.closes_at ? ` · Closes ${campaignDate(campaign.closes_at, campaign.timezone)}` : ""}` : "Choose when to send", done: setup.steps[3].done },
  ];
  return (
    <div className="dashboard-workspace space-y-5 pb-10">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href="/dashboard/campaigns" onClick={(e) => { if (dirty && !window.confirm("Discard unsaved changes?")) e.preventDefault(); }} className="text-xs text-muted-foreground hover:text-foreground">← Campaigns</Link>
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Anonymous 360 · Draft</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">{campaign.name}</h1>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <Button type="button" variant="outline" size="sm" onClick={finishLater}>Finish later</Button>
          <Button
            type="button"
            size="sm"
            disabled={!primaryAction.enabled || pending || !!expanded}
            title={!primaryAction.enabled ? "Complete the saved campaign setup first" : undefined}
            onClick={() => setConfirmationOpen(true)}
          >
            {pending && confirmationOpen ? primaryAction.pendingLabel : primaryAction.label}
          </Button>
        </div>
      </header>
      <div>
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground"><span>{setup.doneCount} of 4 configured</span><span>Saved draft</span></div>
        <div className="mt-3 grid grid-cols-4 gap-1.5" aria-label={`${setup.doneCount} of 4 configured`}>
          {sections.map((s) => <div key={s.key} className={`h-1 rounded-full ${s.done ? "bg-primary/60" : "bg-border"}`} />)}
        </div>
      </div>
      <div className="border-t border-border">
        {sections.map((section) => (
          <section key={section.key} className="border-b border-border last:border-b-0">
            {section.key === "people" || section.key === "questions" ? (
              <div className="flex w-full items-start justify-between gap-4 py-4 text-left sm:py-5">
                <span className="min-w-0"><span className="flex items-center gap-2 text-sm font-medium"><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${section.done ? "bg-primary" : "bg-border-strong"}`} />{section.label}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{section.summary}</span></span>
                <Button asChild type="button" size="sm" variant="outline" className="shrink-0">
                  <Link href={`/dashboard/campaigns/${campaign.id}/${section.key === "people" ? "reviewers" : "form"}`}>{section.key === "people" ? "Edit subject & reviewers" : questions.length ? "Edit form" : "Build form"}</Link>
                </Button>
              </div>
            ) : <button type="button" onClick={() => changeSection(expanded === section.key ? null : section.key)}
              aria-expanded={expanded === section.key} aria-controls={`editor-${section.key}`}
              className="flex w-full items-start justify-between gap-4 py-4 text-left sm:py-5">
              <span className="min-w-0"><span className="flex items-center gap-2 text-sm font-medium"><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${section.done ? "bg-primary" : "bg-border-strong"}`} />{section.label}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{section.summary}</span></span>
              <span className="shrink-0 text-xs font-medium text-primary">{expanded === section.key ? "Close" : section.done ? "Edit" : "Set up"}</span>
            </button>}
            {expanded === section.key && <div id={`editor-${section.key}`} className="space-y-5 pb-6">
              {section.key === "details" && <div className="max-w-xl space-y-3">
                <label className="block text-sm font-medium">Campaign name<input autoFocus className={field} value={name} onChange={(e) => setName(e.target.value)} maxLength={160} /></label>
                <p className="text-xs text-muted-foreground">Anonymous 360 feedback. Reviewer identity and answer content remain separate.</p>
              </div>}
              {section.key === "timing" && <div className="max-w-xl space-y-4">
                <fieldset><legend className="text-sm font-medium">Delivery</legend><div className="mt-2 flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm"><input type="radio" checked={mode === "now"} onChange={() => { setMode("now"); setSendDate(""); }} />Send now</label>
                  <label className="flex items-center gap-2 text-sm"><input type="radio" checked={mode === "later"} onChange={() => setMode("later")} />Send later</label>
                </div></fieldset>
                {mode === "later" && <label className="block max-w-xs text-sm font-medium">Send date<input type="date" className={field} value={sendDate} onChange={(e) => setSendDate(e.target.value)} /><span className="mt-1 block text-xs font-normal text-muted-foreground">Sends at 09:00 in {campaign.timezone}.</span></label>}
                <label className="block max-w-xs text-sm font-medium">Close date <span className="font-normal text-muted-foreground">Optional</span><input type="date" className={field} value={closeDate} onChange={(e) => setCloseDate(e.target.value)} /><span className="mt-1 block text-xs font-normal text-muted-foreground">Closes at the end of the selected day in {campaign.timezone}.</span></label>
                <p className="text-xs text-muted-foreground">{reminderSummary(campaign.reminder_settings)}.</p>
              </div>}
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <div className="flex flex-wrap gap-2"><Button type="button" disabled={pending} onClick={save}>{pending ? "Saving…" : "Save " + section.label}</Button><Button type="button" variant="ghost" disabled={pending} onClick={() => changeSection(null)}>Cancel</Button></div>
            </div>}
          </section>
        ))}
      </div>
      <DraftConfirmationDialog
        open={confirmationOpen}
        onOpenChange={setConfirmationOpen}
        title={`${deliveryMode === "later" ? "Schedule" : "Send"} "${campaign.name}"?`}
        description={
          deliveryMode === "later"
            ? "The saved anonymous feedback configuration will be scheduled."
            : "The saved anonymous feedback configuration will be sent immediately."
        }
        details={[
          {
            label: "Subject",
            value: subject?.full_name || subject?.email || "Not selected",
          },
          { label: "Reviewers", value: `${validReviewerCount}` },
          {
            label: "Questions",
            value: `${questions.length} ${questions.length === 1 ? "question" : "questions"}`,
          },
          {
            label: deliveryMode === "later" ? "Sends" : "Delivery",
            value:
              deliveryMode === "later" && campaign.opens_at
                ? campaignDate(campaign.opens_at, campaign.timezone, true)
                : "Send now",
          },
          {
            label: "Closes",
            value: campaign.closes_at
              ? campaignDate(campaign.closes_at, campaign.timezone)
              : "No close date",
          },
          {
            label: "Privacy",
            value: "Anonymous results after closure and five submitted reviewers",
          },
        ]}
        privacyAcknowledgement="I understand that reviewer feedback is anonymous, reports require five submitted reviewers after closure, and individual answers cannot be tied to a reviewer."
        actionLabel={deliveryMode === "later" ? "Schedule 360" : "Send 360"}
        pendingLabel={primaryAction.pendingLabel}
        pending={pending}
        error={error}
        onConfirm={confirmFinal}
      />
    </div>
  );
}
