"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import PeoplePicker, { type PickerDepartment, type PickerPerson } from "../people-picker";
import { campaignDate, campaignLocalDate, reminderSummary, setupCompleteness } from "../presentation";
import {
  finalizeFeedback360Draft, saveFeedback360Cohort, saveFeedback360Name,
  saveFeedback360Template, saveFeedback360Timing,
} from "../actions";
import type { Campaign, CampaignAssignment, Person, TemplateQuestion } from "@/lib/types/database";

type Section = "details" | "people" | "questions" | "timing";
type TemplateOption = { id: string; name: string; questions: { id: string; prompt: string; type: string }[] };
const field = "mt-1.5 w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export default function Feedback360DraftBuilder({
  campaign, subject, assignments, people, departments, questions, templateName, templates, ready,
}: {
  campaign: Campaign; subject: Person | null; assignments: CampaignAssignment[];
  people: PickerPerson[]; departments: PickerDepartment[]; questions: TemplateQuestion[];
  templateName: string | null; templates: TemplateOption[]; ready: boolean;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<Section | null>(null);
  const [name, setName] = useState(campaign.name);
  const [subjectId, setSubjectId] = useState(subject?.id ?? "");
  const [reviewerIds, setReviewerIds] = useState(assignments.map((a) => a.respondent_person_id));
  const [relationships, setRelationships] = useState<Record<string, string>>(
    Object.fromEntries(assignments.map((a) => [a.respondent_person_id, a.relationship ?? "peer"])),
  );
  const [templateId, setTemplateId] = useState(campaign.template_id ?? "");
  const [mode, setMode] = useState<"" | "now" | "later">(
    campaign.settings?.draft_delivery_mode === "now" || campaign.settings?.draft_delivery_mode === "later"
      ? campaign.settings.draft_delivery_mode : "",
  );
  const localDate = (value: string | null) => campaignLocalDate(value, campaign.timezone);
  const [sendDate, setSendDate] = useState(localDate(campaign.opens_at));
  const [closeDate, setCloseDate] = useState(localDate(campaign.closes_at));
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const peopleById = useMemo(() => Object.fromEntries(people.map((p) => [p.id, p])), [people]);
  const selectedTemplate = templates.find((t) => t.id === templateId);
  const allowedTemplates = templates.filter((t) => t.questions.length > 0 && t.questions.every((q) => q.type === "rating" || q.type === "text"));
  const savedMode = campaign.settings?.draft_delivery_mode;
  const savedReviewerCount = new Set(assignments.filter((a) => a.status === "pending" && !!peopleById[a.respondent_person_id] && a.respondent_person_id !== subject?.id && a.subject_person_id === subject?.id && ["manager", "peer", "direct_report", "other"].includes(a.relationship ?? "")).map((a) => a.respondent_person_id)).size;
  const dirty = expanded === "details" ? name !== campaign.name
    : expanded === "people" ? subjectId !== (subject?.id ?? "") ||
      JSON.stringify(reviewerIds.map((id) => [id, relationships[id] ?? "peer"]).sort()) !== JSON.stringify(assignments.map((a) => [a.respondent_person_id, a.relationship ?? "peer"]).sort())
    : expanded === "questions" ? templateId !== (campaign.template_id ?? "")
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
    setSubjectId(subject?.id ?? "");
    setReviewerIds(assignments.map((a) => a.respondent_person_id));
    setRelationships(Object.fromEntries(assignments.map((a) => [a.respondent_person_id, a.relationship ?? "peer"])));
    setTemplateId(campaign.template_id ?? "");
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
        : section === "people" ? await saveFeedback360Cohort(campaign.id, subjectId, reviewerIds.map((personId) => ({ personId, relationship: relationships[personId] ?? "peer" })))
        : section === "questions" ? await saveFeedback360Template(campaign.id, templateId)
        : await saveFeedback360Timing(campaign.id, mode as "now" | "later", mode === "later" ? sendDate : "", closeDate);
      if (result.error) { setError(result.error); return; }
      setExpanded(null);
      router.refresh();
    });
  };
  const final = () => {
    setError(null);
    startTransition(async () => {
      const result = await finalizeFeedback360Draft(campaign.id, acknowledged);
      if (result.error) { setError(result.error); router.refresh(); return; }
      router.refresh();
    });
  };
  const setup = setupCompleteness({
    campaign, subjectCount: subject && peopleById[subject.id] ? 1 : 0,
    assignmentCount: savedReviewerCount === assignments.length ? savedReviewerCount : 0, questionCount: questions.every((q) => q.type === "rating" || q.type === "text") && (campaign.questions_frozen_at !== null || templates.some((t) => t.id === campaign.template_id)) ? questions.length : 0,
  });
  const canFinish = ready && setup.ready && savedReviewerCount >= 5;
  const sections: { key: Section; label: string; summary: string; done: boolean }[] = [
    { key: "details", label: "Details", summary: campaign.name + " · Anonymous 360 feedback", done: !!campaign.name.trim() },
    { key: "people", label: "Subject & Reviewers", summary: subject ? `${subject.full_name || subject.email} · ${assignments.length} ${assignments.length === 1 ? "reviewer" : "reviewers"}` : "Choose a subject and reviewers", done: setup.steps[1].done },
    { key: "questions", label: "Questions", summary: questions.length ? `${templateName ?? "Template"} · ${questions.length} ${questions.length === 1 ? "question" : "questions"}` : "Choose a 360-safe template", done: setup.steps[2].done },
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
        <Button type="button" variant="outline" size="sm" onClick={finishLater}>Finish later</Button>
      </header>
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground"><span>{setup.doneCount} of 4 configured</span><span>Saved draft</span></div>
        <div className="mt-3 grid grid-cols-4 gap-1.5" aria-label={`${setup.doneCount} of 4 configured`}>
          {sections.map((s) => <div key={s.key} className={`h-1 rounded-full ${s.done ? "bg-primary/60" : "bg-border"}`} />)}
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {sections.map((section) => (
          <section key={section.key} className="border-b border-border last:border-b-0">
            <button type="button" onClick={() => changeSection(expanded === section.key ? null : section.key)}
              aria-expanded={expanded === section.key} aria-controls={`editor-${section.key}`}
              className="flex w-full items-start justify-between gap-4 p-4 text-left hover:bg-surface/40 sm:p-5">
              <span className="min-w-0"><span className="flex items-center gap-2 text-sm font-semibold"><span className={`h-2 w-2 shrink-0 rounded-full ${section.done ? "bg-primary" : "bg-border"}`} />{section.label}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{section.summary}</span></span>
              <span className="shrink-0 text-xs font-medium text-primary">{expanded === section.key ? "Close" : section.done ? "Edit" : "Set up"}</span>
            </button>
            {expanded === section.key && <div id={`editor-${section.key}`} className="space-y-5 border-t border-border bg-surface/20 p-4 sm:p-5">
              {section.key === "details" && <div className="max-w-xl space-y-3">
                <label className="block text-sm font-medium">Campaign name<input autoFocus className={field} value={name} onChange={(e) => setName(e.target.value)} maxLength={160} /></label>
                <p className="text-xs text-muted-foreground">Anonymous 360 feedback. Reviewer identity and answer content remain separate.</p>
              </div>}
              {section.key === "people" && <div className="space-y-4">
                <label className="block max-w-xl text-sm font-medium">Appraisal subject
                  <select className={field} value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setReviewerIds((ids) => ids.filter((id) => id !== e.target.value)); }}>
                    <option value="">Choose a subject</option>{people.map((p) => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}
                  </select>
                </label>
                <p className="text-sm text-muted-foreground">Choose at least five distinct reviewers. Saved partial cohorts remain drafts. Reviewer names support delivery tracking, but no normal admin view links a reviewer to anonymous answers.</p>
                {reviewerIds.some((id) => !peopleById[id]) && <p className="rounded-lg border border-amber-300/40 bg-amber-50/50 p-3 text-sm text-amber-900">Some saved reviewers are no longer available. <button type="button" className="font-medium underline" onClick={() => setReviewerIds((ids) => ids.filter((id) => !!peopleById[id]))}>Remove unavailable reviewers</button> and save a valid cohort.</p>}
                {subjectId ? <PeoplePicker people={people} departments={departments} mode="360" excludeIds={[subjectId]} selectedIds={reviewerIds} onChange={setReviewerIds} relationships={relationships} onRelationshipChange={(id, value) => setRelationships((prev) => ({ ...prev, [id]: value }))} /> : <p className="text-sm text-muted-foreground">Choose a subject first.</p>}
                <p className="text-xs text-muted-foreground">{reviewerIds.length} reviewers selected · At least five are required before send.</p>
              </div>}
              {section.key === "questions" && <div className="max-w-3xl space-y-3">
                <label className="block max-w-xl text-sm font-medium">360 question template<select className={field} value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                  <option value="">Choose a template</option>{allowedTemplates.map((t) => <option key={t.id} value={t.id}>{t.name} · {t.questions.length} {t.questions.length === 1 ? "question" : "questions"}</option>)}
                </select></label>
                {selectedTemplate && <div className="rounded-lg border border-border p-4 text-sm"><p className="font-medium">{selectedTemplate.questions.length} {selectedTemplate.questions.length === 1 ? "question" : "questions"}</p><ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">{selectedTemplate.questions.map((q) => <li key={q.id}>{q.prompt}</li>)}</ol></div>}
                <p className="text-xs text-muted-foreground">360 feedback supports rating and text questions. Edit questions in <Link href="/dashboard/templates" className="text-primary underline">Templates</Link>.</p>
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
      <section className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-6 lg:p-8">
        <div><h2 className="font-display text-lg font-semibold">Review &amp; Send</h2><p className="mt-1 text-sm text-muted-foreground">Review the saved anonymous feedback setup.</p></div>
        <dl className="grid gap-5 text-sm sm:grid-cols-2 xl:grid-cols-3">
          <div><dt className="text-xs text-muted-foreground">Subject</dt><dd>{subject?.full_name || subject?.email || "Not selected"}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Reviewers</dt><dd>{assignments.length} saved · {savedReviewerCount >= 5 ? "Five-reviewer minimum met" : "At least five required"}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Questions</dt><dd>{templateName ?? "No template"} · {questions.length} {questions.length === 1 ? "question" : "questions"}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Delivery</dt><dd>{sections[3].summary}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Reminders</dt><dd>{reminderSummary(campaign.reminder_settings)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Privacy</dt><dd>Anonymous results after closure and five submitted reviewers; each question needs five answers.</dd></div>
        </dl>
        {questions.length > 0 && <details className="max-w-3xl text-sm"><summary className="cursor-pointer font-medium text-primary">Preview saved questions</summary><ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">{questions.map((q) => <li key={q.id}>{q.prompt}</li>)}</ol></details>}
        {!canFinish && <div className="rounded-lg border border-border bg-surface/40 p-3 text-sm"><p className="font-medium">Complete before sending</p><ul className="mt-1 list-disc pl-5 text-muted-foreground">{sections.filter((s) => !s.done).map((s) => <li key={s.key}>{s.label}</li>)}</ul></div>}
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} className="mt-0.5" /><span>I understand that feedback is anonymous, reports require five submitted reviewers after closure, and individual answers cannot be tied to a reviewer.</span></label>
        {error && !expanded && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="button" disabled={!canFinish || !acknowledged || pending || !!expanded} onClick={final}>{pending ? "Checking…" : savedMode === "later" ? "Schedule feedback" : "Send feedback now"}</Button>
      </section>
    </div>
  );
}
