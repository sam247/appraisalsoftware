"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { campaignDate, campaignLocalDate, reminderSummary, setupCompleteness } from "../presentation";
import { draftPrimaryAction, type DraftDeliveryMode } from "../draft-action";
import DraftConfirmationDialog from "../draft-confirmation-dialog";
import {
  finalizeAnnualDraft,
  saveAnnualName,
  saveAnnualTiming,
} from "../actions";
import type { Campaign } from "@/lib/types/database";

export type SubjectRow = { personId: string; managerPersonId: string | null };
type Section = "details" | "people" | "questions" | "timing";
const field = "mt-1.5 w-full field";

export default function AnnualDraftBuilder({
  campaignId, campaignName, campaignSettings, reminderSettings, opensAt, templateId, templateName, formStartedAt,
  questionCount, closesAt, timezone, initialSubjects, pendingAssignmentCount, ready,
}: {
  campaignId: string; campaignName: string; campaignSettings: Campaign["settings"]; reminderSettings: Campaign["reminder_settings"]; opensAt: string | null;
  templateId: string | null; templateName: string | null; formStartedAt: string | null;
  questionCount: number; closesAt: string | null; timezone: string;
  initialSubjects: SubjectRow[]; pendingAssignmentCount: number; ready: boolean;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<Section | null>(null);
  const [name, setName] = useState(campaignName);
  const [mode, setMode] = useState<"" | "now" | "later">(
    campaignSettings?.draft_delivery_mode === "now" || campaignSettings?.draft_delivery_mode === "later"
      ? campaignSettings.draft_delivery_mode : "",
  );
  const localDate = (value: string | null) => campaignLocalDate(value, timezone);
  const [sendDate, setSendDate] = useState(localDate(opensAt));
  const [closeDate, setCloseDate] = useState(localDate(closesAt));
  const [error, setError] = useState<string | null>(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const managerCount = Math.max(0, pendingAssignmentCount - initialSubjects.length);
  const selfOnlyCount = Math.max(0, initialSubjects.length - managerCount);
  const savedMode = campaignSettings?.draft_delivery_mode;
  const deliveryMode: DraftDeliveryMode =
    savedMode === "now" || savedMode === "later" ? savedMode : "";
  const dirty = expanded === "details" ? name !== campaignName
    : expanded === "timing" ? mode !== (savedMode ?? "") || sendDate !== localDate(opensAt) || closeDate !== localDate(closesAt)
    : false;
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const changeSection = (next: Section | null) => {
    if (dirty && !window.confirm("Discard unsaved changes in this section?")) return;
    setName(campaignName);
    setMode(savedMode === "now" || savedMode === "later" ? savedMode : "");
    setSendDate(localDate(opensAt));
    setCloseDate(localDate(closesAt));
    setError(null);
    setExpanded(next);
  };
  const finishLater = () => {
    if (dirty && !window.confirm("Discard unsaved changes? Saved sections will remain available.")) return;
    router.push("/dashboard/campaigns");
  };
  const save = () => {
    setError(null);
    if (!expanded) return;
    const section = expanded;
    startTransition(async () => {
      const result = section === "details" ? await saveAnnualName(campaignId, name)
        : section === "people" ? { error: "Open Edit people to change participants" }
        : section === "questions" ? { error: "Open Edit form to change questions" }
        : await saveAnnualTiming(campaignId, mode as "now" | "later", mode === "later" ? sendDate : "", closeDate);
      if (result.error) { setError(result.error); return; }
      setExpanded(null);
      router.refresh();
    });
  };
  const primaryAction = draftPrimaryAction(deliveryMode, ready);
  const confirmFinal = () => {
    setError(null);
    startTransition(async () => {
      const result = await finalizeAnnualDraft(campaignId);
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
    campaign: { campaign_type: "annual_appraisal", name: campaignName, template_id: templateId, form_started_at: formStartedAt, settings: campaignSettings, opens_at: opensAt, closes_at: closesAt },
    subjectCount: initialSubjects.length, assignmentCount: pendingAssignmentCount, questionCount,
  });
  const sections: { key: Section; label: string; summary: string; done: boolean }[] = [
    { key: "details", label: "Details", summary: campaignName + " · Annual appraisal", done: !!campaignName.trim() },
    { key: "people", label: "People", summary: initialSubjects.length ? `${initialSubjects.length} ${initialSubjects.length === 1 ? "employee" : "employees"} · ${managerCount} manager ${managerCount === 1 ? "review" : "reviews"}${selfOnlyCount ? ` · ${selfOnlyCount} self-only` : ""}` : "Choose employees and managers", done: setup.steps[1].done },
    { key: "questions", label: "Questions", summary: questionCount ? `${templateName ?? "Campaign form"} · ${questionCount} ${questionCount === 1 ? "question" : "questions"}` : "Build the appraisal form", done: questionCount > 0 },
    { key: "timing", label: "Timing", summary: savedMode === "now" ? `Send now${closesAt ? ` · Closes ${campaignDate(closesAt, timezone)}` : ""}` : savedMode === "later" && opensAt ? `Send ${campaignDate(opensAt, timezone, true)}${closesAt ? ` · Closes ${campaignDate(closesAt, timezone)}` : ""}` : "Choose when to send", done: setup.steps[3].done },
  ];
  return (
    <div className="dashboard-workspace space-y-5 pb-10">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href="/dashboard/campaigns" onClick={(e) => { if (dirty && !window.confirm("Discard unsaved changes?")) e.preventDefault(); }} className="text-xs text-muted-foreground hover:text-foreground">← Campaigns</Link>
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Annual appraisal · Draft</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">{campaignName}</h1>
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
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>{setup.doneCount} of 4 configured</span><span>Saved draft</span>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1.5" aria-label={`${setup.doneCount} of 4 configured`}>
          {sections.map((s) => <div key={s.key} className={`h-1 rounded-full ${s.done ? "bg-primary/60" : "bg-border"}`} />)}
        </div>
      </div>
      <div className="border-t border-border">
            {sections.map((section) => (
          <section key={section.key} className="border-b border-border last:border-b-0">
            {section.key === "people" || section.key === "questions" ? (
              <div className="flex w-full items-start justify-between gap-4 py-4 text-left sm:py-5">
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-sm font-medium"><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${section.done ? "bg-primary" : "bg-border-strong"}`} />{section.label}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{section.summary}</span>
                </span>
                <Button asChild type="button" size="sm" variant="outline" className="shrink-0">
                  <Link href={`/dashboard/campaigns/${campaignId}/${section.key === "people" ? "people" : "form"}`}>{section.key === "people" ? "Edit people" : questionCount ? "Edit form" : "Build form"}</Link>
                </Button>
              </div>
            ) : <button type="button" onClick={() => changeSection(expanded === section.key ? null : section.key)}
              aria-expanded={expanded === section.key} aria-controls={`editor-${section.key}`}
              className="flex w-full items-start justify-between gap-4 py-4 text-left sm:py-5">
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-sm font-medium"><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${section.done ? "bg-primary" : "bg-border-strong"}`} />{section.label}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{section.summary}</span>
              </span>
              <span className="shrink-0 text-xs font-medium text-primary">
                {expanded === section.key ? "Close" : section.done ? "Edit" : "Set up"}
              </span>
            </button>}
            {expanded === section.key && (
              <div id={`editor-${section.key}`} className="space-y-5 pb-6">
                {section.key === "details" && <div className="max-w-xl space-y-3">
                  <label className="block text-sm font-medium">Campaign name<input autoFocus className={field} value={name} onChange={(e) => setName(e.target.value)} maxLength={160} /></label>
                  <p className="text-xs text-muted-foreground">Annual appraisal · Each employee receives a self appraisal. Assigned managers receive a manager appraisal.</p>
                </div>}
                {section.key === "timing" && <div className="max-w-xl space-y-4">
                  <fieldset><legend className="text-sm font-medium">Delivery</legend><div className="mt-2 flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-sm"><input type="radio" checked={mode === "now"} onChange={() => { setMode("now"); setSendDate(""); }} />Send now</label>
                    <label className="flex items-center gap-2 text-sm"><input type="radio" checked={mode === "later"} onChange={() => setMode("later")} />Send later</label>
                  </div></fieldset>
                  {mode === "later" && <label className="block max-w-xs text-sm font-medium">Send date<input type="date" className={field} value={sendDate} onChange={(e) => setSendDate(e.target.value)} /><span className="mt-1 block text-xs font-normal text-muted-foreground">Sends at 09:00 in {timezone}.</span></label>}
                  <label className="block max-w-xs text-sm font-medium">Close date <span className="font-normal text-muted-foreground">Optional</span><input type="date" className={field} value={closeDate} onChange={(e) => setCloseDate(e.target.value)} /><span className="mt-1 block text-xs font-normal text-muted-foreground">Closes at the end of the selected day in {timezone}.</span></label>
                  <p className="text-xs text-muted-foreground">{reminderSummary(reminderSettings)}.</p>
                </div>}
                {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                <div className="flex flex-wrap gap-2"><Button type="button" disabled={pending} onClick={save}>{pending ? "Saving…" : "Save " + section.label}</Button><Button type="button" variant="ghost" disabled={pending} onClick={() => changeSection(null)}>Cancel</Button></div>
              </div>
            )}
          </section>
        ))}
      </div>
      <DraftConfirmationDialog
        open={confirmationOpen}
        onOpenChange={setConfirmationOpen}
        title={`${deliveryMode === "later" ? "Schedule" : "Send"} "${campaignName}"?`}
        description={
          deliveryMode === "later"
            ? "The saved campaign configuration will be scheduled."
            : "The saved campaign configuration will be sent immediately."
        }
        details={[
          {
            label: "People",
            value: `${initialSubjects.length} employees · ${managerCount} manager reviews`,
          },
          {
            label: "Questions",
            value: `${questionCount} ${questionCount === 1 ? "question" : "questions"}`,
          },
          {
            label: deliveryMode === "later" ? "Sends" : "Delivery",
            value:
              deliveryMode === "later" && opensAt
                ? campaignDate(opensAt, timezone, true)
                : "Send now",
          },
          {
            label: "Closes",
            value: closesAt ? campaignDate(closesAt, timezone) : "No close date",
          },
          { label: "Reminders", value: reminderSummary(reminderSettings) },
        ]}
        warning={
          selfOnlyCount > 0
            ? `${selfOnlyCount} ${selfOnlyCount === 1 ? "employee has" : "employees have"} no manager and will receive a self-appraisal only.`
            : undefined
        }
        actionLabel={primaryAction.confirmLabel}
        pendingLabel={primaryAction.pendingLabel}
        pending={pending}
        error={error}
        onConfirm={confirmFinal}
      />
    </div>
  );
}
