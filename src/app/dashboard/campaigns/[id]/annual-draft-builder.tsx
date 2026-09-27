"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import PeoplePicker, { type PickerDepartment, type PickerPerson } from "../people-picker";
import { campaignDate, campaignLocalDate, reminderSummary, setupCompleteness } from "../presentation";
import {
  finalizeAnnualDraft,
  saveAnnualName,
  saveAnnualTemplate,
  saveAnnualTiming,
  saveSubjectsAndAssignments,
} from "../actions";
import type { Campaign, TemplateQuestion } from "@/lib/types/database";

export type SubjectRow = { personId: string; managerPersonId: string | null };
type Section = "details" | "people" | "questions" | "timing";
type TemplateOption = { id: string; name: string; questions: { id: string; prompt: string; type: string }[] };
const field = "mt-1.5 w-full field";

export default function AnnualDraftBuilder({
  campaignId, campaignName, campaignSettings, reminderSettings, opensAt, templateId, templateName, templates,
  questionCount, questions, closesAt, timezone, people, departments, initialSubjects, pendingAssignmentCount, ready,
}: {
  campaignId: string; campaignName: string; campaignSettings: Campaign["settings"]; reminderSettings: Campaign["reminder_settings"]; opensAt: string | null;
  templateId: string | null; templateName: string | null; templates: TemplateOption[];
  questionCount: number; questions: TemplateQuestion[]; closesAt: string | null; timezone: string;
  people: PickerPerson[]; departments: PickerDepartment[]; initialSubjects: SubjectRow[]; pendingAssignmentCount: number; ready: boolean;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<Section | null>(null);
  const [name, setName] = useState(campaignName);
  const [selectedIds, setSelectedIds] = useState(initialSubjects.map((s) => s.personId));
  const [managers, setManagers] = useState<Record<string, string | null>>(
    Object.fromEntries(initialSubjects.map((s) => [s.personId, s.managerPersonId])),
  );
  const [selectedTemplate, setSelectedTemplate] = useState(templateId ?? "");
  const [mode, setMode] = useState<"" | "now" | "later">(
    campaignSettings?.draft_delivery_mode === "now" || campaignSettings?.draft_delivery_mode === "later"
      ? campaignSettings.draft_delivery_mode : "",
  );
  const localDate = (value: string | null) => campaignLocalDate(value, timezone);
  const [sendDate, setSendDate] = useState(localDate(opensAt));
  const [closeDate, setCloseDate] = useState(localDate(closesAt));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const peopleById = useMemo(() => Object.fromEntries(people.map((p) => [p.id, p])), [people]);
  const savedPeople = initialSubjects.map((s) => peopleById[s.personId]).filter(Boolean);
  const missingManagers = initialSubjects.filter((s) => !s.managerPersonId).map((s) => peopleById[s.personId]?.full_name || peopleById[s.personId]?.email || "Unknown person");
  const savedMode = campaignSettings?.draft_delivery_mode;
  const selected = templates.find((t) => t.id === selectedTemplate);
  const dirty = expanded === "details" ? name !== campaignName
    : expanded === "people" ? JSON.stringify(selectedIds.map((id) => [id, managers[id] ?? peopleById[id]?.manager_person_id ?? null]).sort()) !== JSON.stringify(initialSubjects.map((s) => [s.personId, s.managerPersonId]).sort())
    : expanded === "questions" ? selectedTemplate !== (templateId ?? "")
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
    setSelectedIds(initialSubjects.map((s) => s.personId));
    setManagers(Object.fromEntries(initialSubjects.map((s) => [s.personId, s.managerPersonId])));
    setSelectedTemplate(templateId ?? "");
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
  const resolveManager = (id: string) => id in managers ? managers[id] : (peopleById[id]?.manager_person_id && peopleById[peopleById[id].manager_person_id!] ? peopleById[id].manager_person_id : null);
  const changePeople = (ids: string[]) => {
    setSelectedIds(ids);
    setManagers((prev) => {
      const next: Record<string, string | null> = {};
      for (const id of ids) next[id] = id in prev ? prev[id] : resolveManager(id);
      return next;
    });
  };
  const save = () => {
    setError(null);
    if (!expanded) return;
    const section = expanded;
    startTransition(async () => {
      const result = section === "details" ? await saveAnnualName(campaignId, name)
        : section === "people" ? await saveSubjectsAndAssignments(campaignId, selectedIds.map((personId) => ({ personId, selfPersonId: personId, managerPersonId: resolveManager(personId) })))
        : section === "questions" ? await saveAnnualTemplate(campaignId, selectedTemplate)
        : await saveAnnualTiming(campaignId, mode as "now" | "later", mode === "later" ? sendDate : "", closeDate);
      if (result.error) { setError(result.error); return; }
      setExpanded(null);
      router.refresh();
    });
  };
  const final = () => {
    setError(null);
    startTransition(async () => {
      const result = await finalizeAnnualDraft(campaignId);
      if (result.error) { setError(result.error); router.refresh(); return; }
      router.refresh();
    });
  };
  const setup = setupCompleteness({
    campaign: { campaign_type: "annual_appraisal", name: campaignName, template_id: templateId, settings: campaignSettings, opens_at: opensAt, closes_at: closesAt },
    subjectCount: initialSubjects.length, assignmentCount: pendingAssignmentCount, questionCount,
  });
  const sections: { key: Section; label: string; summary: string; done: boolean }[] = [
    { key: "details", label: "Details", summary: campaignName + " · Annual appraisal", done: !!campaignName.trim() },
    { key: "people", label: "People", summary: initialSubjects.length ? `${initialSubjects.length} ${initialSubjects.length === 1 ? "employee" : "employees"} · ${initialSubjects.length} self ${initialSubjects.length === 1 ? "appraisal" : "appraisals"} · ${initialSubjects.length - missingManagers.length} manager ${initialSubjects.length - missingManagers.length === 1 ? "appraisal" : "appraisals"}` : "Choose employees and managers", done: setup.steps[1].done },
    { key: "questions", label: "Questions", summary: questionCount ? `${templateName ?? "Template"} · ${questionCount} ${questionCount === 1 ? "question" : "questions"}` : "Choose a question template", done: questionCount > 0 },
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
        <Button type="button" variant="outline" size="sm" onClick={finishLater}>Finish later</Button>
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
            <button type="button" onClick={() => changeSection(expanded === section.key ? null : section.key)}
              aria-expanded={expanded === section.key} aria-controls={`editor-${section.key}`}
              className="flex w-full items-start justify-between gap-4 py-4 text-left sm:py-5">
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-sm font-medium"><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${section.done ? "bg-primary" : "bg-border-strong"}`} />{section.label}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{section.summary}</span>
              </span>
              <span className="shrink-0 text-xs font-medium text-primary">{expanded === section.key ? "Close" : section.done ? "Edit" : "Set up"}</span>
            </button>
            {expanded === section.key && (
              <div id={`editor-${section.key}`} className="space-y-5 pb-6">
                {section.key === "details" && <div className="max-w-xl space-y-3">
                  <label className="block text-sm font-medium">Campaign name<input autoFocus className={field} value={name} onChange={(e) => setName(e.target.value)} maxLength={160} /></label>
                  <p className="text-xs text-muted-foreground">Annual appraisal · Each employee receives a self appraisal. Assigned managers receive a manager appraisal.</p>
                </div>}
                {section.key === "people" && <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Select employees. Their current manager is suggested for new selections; saved campaign pairings stay in place.</p>
                  {people.length ? <PeoplePicker people={people} departments={departments} mode="annual" selectedIds={selectedIds} onChange={changePeople} managerOverrides={managers} onManagerChange={(id, value) => setManagers((prev) => ({ ...prev, [id]: value }))} />
                    : <p className="text-sm">Add people in <Link className="text-primary underline" href="/dashboard/people">People</Link> first.</p>}
                  <p className="text-xs text-muted-foreground">{selectedIds.length} {selectedIds.length === 1 ? "employee" : "employees"} · {selectedIds.length} self assignments · {selectedIds.filter((id) => !!resolveManager(id)).length} manager assignments</p>
                </div>}
                {section.key === "questions" && <div className="max-w-3xl space-y-3">
                  <label className="block max-w-xl text-sm font-medium">Question template
                    <select className={field} value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}>
                      <option value="">Choose a template</option>
                      {templates.map((t) => <option key={t.id} value={t.id}>{t.name} · {t.questions.length} {t.questions.length === 1 ? "question" : "questions"}</option>)}
                    </select>
                  </label>
                  {selected && <div className="text-sm"><p className="font-medium">{selected.questions.length} {selected.questions.length === 1 ? "question" : "questions"}</p><ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">{selected.questions.map((q) => <li key={q.id}>{q.prompt}</li>)}</ol></div>}
                  <p className="text-xs text-muted-foreground">Questions are frozen when you send or schedule. Edit the template in <Link href="/dashboard/templates" className="text-primary underline">Templates</Link>.</p>
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
      <section className="space-y-5 border-t border-border pt-8">
        <div><h2 className="font-display text-lg font-semibold">Review &amp; Send</h2><p className="mt-1 text-sm text-muted-foreground">Review the saved configuration before the final action.</p></div>
        <dl className="grid gap-5 text-sm sm:grid-cols-2 xl:grid-cols-4">
          <div><dt className="text-xs text-muted-foreground">People</dt><dd>{savedPeople.length} {savedPeople.length === 1 ? "employee" : "employees"} · {savedPeople.length} self · {savedPeople.length - missingManagers.length} manager assignments</dd></div>
          <div><dt className="text-xs text-muted-foreground">Questions</dt><dd>{templateName ?? "No template"} · {questionCount} {questionCount === 1 ? "question" : "questions"}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Delivery</dt><dd>{sections[3].summary}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Reminders</dt><dd>{reminderSummary(reminderSettings)}</dd></div>
        </dl>
        {questions.length > 0 && <details className="max-w-3xl text-sm"><summary className="cursor-pointer font-medium text-primary">Preview saved questions</summary><ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">{questions.map((q) => <li key={q.id}>{q.prompt}</li>)}</ol></details>}
        {missingManagers.length > 0 && <p className="rounded-md bg-warning px-3 py-2.5 text-sm text-warning-foreground">Self-only warning: {missingManagers.join(", ")} {missingManagers.length === 1 ? "has" : "have"} no manager assigned.</p>}
        {!ready && <div className="text-sm"><p className="font-medium">Complete before sending</p><ul className="mt-1 list-disc pl-5 text-muted-foreground">{sections.filter((s) => !s.done).map((s) => <li key={s.key}>{s.label}</li>)}</ul></div>}
        {error && !expanded && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="button" disabled={!ready || pending || !!expanded} onClick={final}>{pending ? "Checking…" : savedMode === "later" ? "Schedule appraisal" : "Send appraisal now"}</Button>
      </section>
    </div>
  );
}
