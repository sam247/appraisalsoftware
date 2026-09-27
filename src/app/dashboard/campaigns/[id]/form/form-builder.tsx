"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import RespondForm from "@/app/r/[token]/respond-form";
import type { Campaign, CampaignQuestion } from "@/lib/types/database";
import { saveCampaignForm, startCampaignForm, type FormQuestionInput } from "./actions";

type TemplateChoice = { id: string; name: string; questionCount: number };
type EditableQuestion = CampaignQuestion;
const questionTypes = [
  { value: "rating", label: "Rating" },
  { value: "text", label: "Long answer" },
  { value: "single_choice", label: "Single choice" },
  { value: "multi_choice", label: "Multiple choice" },
  { value: "nps", label: "0–10 rating" },
];
const field = "field mt-1.5 w-full";

function newQuestion(campaign: Campaign, type = "rating"): EditableQuestion {
  return {
    id: crypto.randomUUID(), campaign_id: campaign.id, organization_id: campaign.organization_id,
    sort_order: 0, type, prompt: "", help_text: null, required: true,
    options: type === "single_choice" || type === "multi_choice" ? ["Option 1", "Option 2"] : [],
    scale: type === "nps" ? { min: 0, max: 10 } : { min: 1, max: 5 },
    stable_key: null, competency_key: null, competency_label: null, section_key: null, section_label: null,
    source_template_question_id: null, created_at: new Date().toISOString(),
  };
}

function questionInput(q: EditableQuestion): FormQuestionInput {
  const options = (q.type === "single_choice" || q.type === "multi_choice")
    ? (q.options as string[]).map((option) => option.trim()).filter(Boolean)
    : [];
  return {
    id: q.id, type: q.type, prompt: q.prompt.trim(), help_text: q.help_text?.trim() || null,
    required: q.required, options, scale: q.type === "rating" || q.type === "nps" ? q.scale : {},
  };
}

export default function FormBuilder({ campaign, initialQuestions, templates, org, subjectName }: {
  campaign: Campaign;
  initialQuestions: EditableQuestion[];
  templates: TemplateChoice[];
  org: { name: string; logoUrl: string | null; brandColor: string | null };
  subjectName: string;
}) {
  const router = useRouter();
  const [questions, setQuestions] = useState(initialQuestions);
  const [savedQuestions, setSavedQuestions] = useState(initialQuestions);
  const [revision, setRevision] = useState(campaign.form_revision);
  const [started, setStarted] = useState(!!campaign.form_started_at || initialQuestions.length > 0);
  const [selectedId, setSelectedId] = useState(initialQuestions[0]?.id ?? "");
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [previewOnly, setPreviewOnly] = useState(false);
  const [previewRole, setPreviewRole] = useState<"self" | "manager">("self");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const is360 = campaign.campaign_type === "feedback_360";
  const locked = campaign.status !== "draft" || (campaign.questions_frozen_at !== null && !is360);
  const dirty = JSON.stringify(questions.map(questionInput)) !== JSON.stringify(savedQuestions.map(questionInput));
  const selected = questions.find((q) => q.id === selectedId) ?? null;
  const campaignUrl = `/dashboard/campaigns/${campaign.id}`;
  const supportedTypes = is360 ? questionTypes.slice(0, 2) : questionTypes;
  const validForPreview = useMemo(() => questions.filter((q) => q.prompt.trim()).map((q, index) => ({ ...q, sort_order: index })), [questions]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const patchQuestion = (id: string, patch: Partial<EditableQuestion>) => {
    setQuestions((current) => current.map((q) => q.id === id ? { ...q, ...patch } : q));
    setError(null);
  };
  const move = (id: string, direction: -1 | 1) => {
    setQuestions((current) => {
      const from = current.findIndex((q) => q.id === id);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= current.length) return current;
      const next = [...current];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  };
  const add = (type = "rating") => {
    const next = newQuestion(campaign, type);
    setQuestions((current) => [...current, next]);
    setSelectedId(next.id);
    setPreviewOnly(false);
  };
  const duplicate = (id: string) => {
    const original = questions.find((q) => q.id === id);
    if (!original) return;
    const copy = { ...original, id: crypto.randomUUID(), prompt: original.prompt ? `${original.prompt} (copy)` : "", source_template_question_id: null };
    const index = questions.findIndex((q) => q.id === id);
    setQuestions((current) => [...current.slice(0, index + 1), copy, ...current.slice(index + 1)]);
    setSelectedId(copy.id);
  };
  const remove = (id: string) => {
    if (!window.confirm("Delete this question from the campaign form?")) return;
    const next = questions.filter((q) => q.id !== id);
    setQuestions(next);
    if (selectedId === id) setSelectedId(next[0]?.id ?? "");
  };
  const start = (source: string | null) => {
    setError(null);
    startTransition(async () => {
      const result = await startCampaignForm(campaign.id, source);
      if (result.error) { setError(result.error); return; }
      setStarted(true);
      setRevision(result.revision ?? revision + 1);
      router.refresh();
    });
  };
  const save = (exit: boolean) => {
    setError(null);
    if (questions.some((q) => !q.prompt.trim())) { setError("Give every question a prompt before saving."); return; }
    startTransition(async () => {
      if (dirty) {
        const result = await saveCampaignForm(campaign.id, revision, questions.map(questionInput));
        if (result.error) { setError(result.error); return; }
        setRevision(result.revision ?? revision + 1);
        setSavedQuestions(questions);
      }
      if (exit) router.push(campaignUrl);
      else router.refresh();
    });
  };
  const leave = () => {
    if (dirty && !window.confirm("Discard unsaved form changes?")) return;
    router.push(campaignUrl);
  };

  return (
    <main className="dashboard-workspace space-y-5 pb-12">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
        <div className="min-w-0">
          <button type="button" onClick={leave} className="text-xs text-muted-foreground hover:text-foreground">← {campaign.name}</button>
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">{is360 ? "Anonymous 360" : "Annual appraisal"} · Form builder</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">{campaign.name}</h1>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <span className="mr-2 text-xs text-muted-foreground" aria-live="polite">{pending ? "Saving…" : dirty ? "Unsaved changes" : "Changes saved"}</span>
          {started && <Button type="button" size="sm" variant="outline" onClick={() => setPreviewOnly((value) => !value)}>{previewOnly ? "Edit questions" : "Preview"}</Button>}
          <Button type="button" size="sm" disabled={pending || locked || !started} onClick={() => save(true)}>Save and exit</Button>
        </div>
      </header>

      {error && <p role="alert" className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}

      {!started ? (
        <div className="mx-auto max-w-4xl py-8 sm:py-14">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Questions</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">Set up your {is360 ? "feedback" : "appraisal"} form</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">Choose a starting point. The questions will belong to this campaign; future template changes will not change them.</p>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <section className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-display text-lg font-semibold">Use a template</h3>
              <p className="mt-2 text-sm text-muted-foreground">Copy a reusable questionnaire, then tailor it here.</p>
              <label className="mt-5 block text-sm font-medium">Template
                <select className={field} value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
                  {templates.length === 0 && <option value="">No compatible templates</option>}
                  {templates.map((template) => <option key={template.id} value={template.id}>{template.name} · {template.questionCount} questions</option>)}
                </select>
              </label>
              <Button type="button" className="mt-5" disabled={pending || !templateId || locked} onClick={() => start(templateId)}>Use template</Button>
            </section>
            <section className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-display text-lg font-semibold">Start from scratch</h3>
              <p className="mt-2 text-sm text-muted-foreground">Build an ordered question list for this campaign.</p>
              <Button type="button" variant="outline" className="mt-5" disabled={pending || locked} onClick={() => start(null)}>Create blank form</Button>
            </section>
          </div>
          <button type="button" onClick={leave} className="mt-6 text-sm text-muted-foreground hover:text-foreground">Return to campaign</button>
        </div>
      ) : (
        <div className={`grid min-w-0 gap-6 ${previewOnly ? "grid-cols-1" : "lg:grid-cols-[minmax(18rem,0.85fr)_minmax(0,1.35fr)]"}`}>
          {!previewOnly && <aside className="min-w-0 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div><h2 className="font-display text-lg font-semibold">Questions</h2><p className="text-xs text-muted-foreground">{questions.length} in this campaign form</p></div>
              {!locked && <Button type="button" size="sm" variant="outline" onClick={() => add()}>+ Add question</Button>}
            </div>
            <ol className="divide-y divide-border border-y border-border" aria-label="Form questions">
              {questions.map((q, index) => <li key={q.id}>
                <button type="button" onClick={() => setSelectedId(q.id)} className={`flex w-full items-start gap-3 px-2 py-3 text-left text-sm hover:bg-muted/40 ${selectedId === q.id ? "bg-primary/5" : ""}`} aria-current={selectedId === q.id ? "true" : undefined}>
                  <span className="w-5 shrink-0 text-muted-foreground">{index + 1}.</span>
                  <span className="min-w-0 flex-1 break-words font-medium">{q.prompt || "Untitled question"}<span className="mt-1 block text-xs font-normal text-muted-foreground">{questionTypes.find((type) => type.value === q.type)?.label ?? q.type} · {q.required ? "Required" : "Optional"}</span></span>
                </button>
              </li>)}
            </ol>
            {questions.length === 0 && <p className="text-sm text-muted-foreground">This form is empty. Add the first question to begin.</p>}
            {selected && <section className="space-y-4 border-t border-border pt-4" aria-label="Edit selected question">
              <div className="flex items-center justify-between gap-2"><h3 className="font-display text-base font-semibold">Edit question</h3><span className="text-xs text-muted-foreground">{questions.findIndex((q) => q.id === selected.id) + 1} of {questions.length}</span></div>
              <label className="block text-sm font-medium">Question<input className={field} value={selected.prompt} maxLength={500} disabled={locked} onChange={(event) => patchQuestion(selected.id, { prompt: event.target.value })} /></label>
              <label className="block text-sm font-medium">Help text <span className="font-normal text-muted-foreground">Optional</span><textarea className={field} rows={2} maxLength={1000} value={selected.help_text ?? ""} disabled={locked} onChange={(event) => patchQuestion(selected.id, { help_text: event.target.value })} /></label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-medium">Answer type<select className={field} value={selected.type} disabled={locked} onChange={(event) => { const type = event.target.value; patchQuestion(selected.id, { type, options: type.includes("choice") ? ["Option 1", "Option 2"] : [], scale: type === "nps" ? { min: 0, max: 10 } : { min: 1, max: 5 } }); }}>
                  {supportedTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select></label>
                <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" checked={selected.required} disabled={locked} onChange={(event) => patchQuestion(selected.id, { required: event.target.checked })} />Required answer</label>
              </div>
              {(selected.type === "single_choice" || selected.type === "multi_choice") && <label className="block text-sm font-medium">Options <span className="font-normal text-muted-foreground">One per line, 2–20</span><textarea className={field} rows={Math.max(3, selected.options.length)} value={(selected.options as string[]).join("\n")} disabled={locked} onChange={(event) => patchQuestion(selected.id, { options: event.target.value.split("\n") })} /></label>}
              {selected.type === "rating" && <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-medium">Start at<input className={field} type="number" min={0} max={9} value={Number(selected.scale.min ?? 1)} disabled={locked} onChange={(event) => patchQuestion(selected.id, { scale: { ...selected.scale, min: Number(event.target.value) } })} /></label>
                <label className="block text-sm font-medium">End at<input className={field} type="number" min={1} max={10} value={Number(selected.scale.max ?? 5)} disabled={locked} onChange={(event) => patchQuestion(selected.id, { scale: { ...selected.scale, max: Number(event.target.value) } })} /></label>
              </div>}
              {!locked && <div className="flex flex-wrap gap-2 border-t border-border pt-3 text-xs">
                <Button type="button" size="sm" variant="outline" disabled={questions[0]?.id === selected.id} onClick={() => move(selected.id, -1)}>Move up</Button>
                <Button type="button" size="sm" variant="outline" disabled={questions.at(-1)?.id === selected.id} onClick={() => move(selected.id, 1)}>Move down</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => duplicate(selected.id)}>Duplicate</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => remove(selected.id)}>Delete</Button>
              </div>}
            </section>}
            {!locked && <Button type="button" disabled={pending || !dirty} onClick={() => save(false)}>{pending ? "Saving…" : "Save form"}</Button>}
          </aside>}
          <section className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><h2 className="font-display text-lg font-semibold">Respondent preview</h2><p className="text-xs text-muted-foreground">Interactive preview · nothing is saved or submitted</p></div>
              {!is360 && <label className="text-xs text-muted-foreground">View as <select className="field ml-2" value={previewRole} onChange={(event) => setPreviewRole(event.target.value as "self" | "manager")}><option value="self">Employee</option><option value="manager">Manager</option></select></label>}
            </div>
            <div className="overflow-hidden rounded-lg border border-border bg-surface">
              {!previewOnly && selected && !selected.prompt.trim()
                ? <div className="flex min-h-96 items-center justify-center px-6 text-center text-sm text-muted-foreground">Give this question a prompt to preview it.</div>
                : validForPreview.length > 0 ? <RespondForm key={`${previewRole}-${previewOnly ? "cover" : selectedId}-${validForPreview.map((q) => q.id).join("|")}`} preview previewQuestionIndex={previewOnly ? undefined : Math.max(0, validForPreview.findIndex((q) => q.id === selectedId))} token="" campaignName={campaign.name} questions={validForPreview} relationship={is360 ? "peer" : previewRole} alreadySubmitted={false} orgName={org.name} orgLogoUrl={org.logoUrl} orgBrandColor={org.brandColor} initialAnswers={[]} anonymous={is360} subjectName={subjectName} />
                : <div className="flex min-h-96 items-center justify-center px-6 text-center text-sm text-muted-foreground">Add a complete question to preview the respondent form.</div>}
            </div>
          </section>
        </div>
      )}
      {locked && <p className="text-sm text-muted-foreground">This campaign form is frozen for delivery. Its questions can be viewed but not changed.</p>}
      <div className="border-t border-border pt-5"><Link href={campaignUrl} onClick={(event) => { if (dirty && !window.confirm("Discard unsaved form changes?")) event.preventDefault(); }} className="text-sm text-primary hover:underline">← Return to campaign</Link></div>
    </main>
  );
}
