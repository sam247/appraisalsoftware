"use client";

import FormSubmit from "@/app/dashboard/form-submit";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { createCampaign } from "../actions";
import CreationProgress, {
  type CreationStepKey,
} from "../creation-progress";
import PeoplePicker, {
  type PickerDepartment,
  type PickerPerson,
} from "../people-picker";

export type CreateTemplateOption = {
  id: string;
  name: string;
  campaign_type_default: string;
  questionCount: number;
  questions: { id: string; prompt: string; type: string }[];
};

export type CreatePersonOption = PickerPerson;

function formatCloseDate(closesAt: string) {
  if (!closesAt) return null;
  return new Date(`${closesAt}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function CreateCampaignForm({
  is360,
  enabled360,
  templates,
  people,
  departments,
  timezone,
  error,
  initialTemplateId = "",
}: {
  is360: boolean;
  enabled360: boolean;
  templates: CreateTemplateOption[];
  people: CreatePersonOption[];
  departments: PickerDepartment[];
  timezone: string;
  error?: string;
  initialTemplateId?: string;
}) {
  if (is360) {
    return (
      <Feedback360Wizard
        enabled360={enabled360}
        templates={templates}
        people={people}
        departments={departments}
        timezone={timezone}
        error={error}
        initialTemplateId={initialTemplateId}
      />
    );
  }

  return (
    <AnnualSetupForm
      enabled360={enabled360}
      templates={templates}
      timezone={timezone}
      error={error}
      initialTemplateId={initialTemplateId}
    />
  );
}

function AnnualSetupForm({
  enabled360,
  templates,
  timezone,
  error,
  initialTemplateId,
}: {
  enabled360: boolean;
  templates: CreateTemplateOption[];
  timezone: string;
  error?: string;
  initialTemplateId: string;
}) {
  const [templateId, setTemplateId] = useState(initialTemplateId);
  const [closesAt, setClosesAt] = useState("");
  const [chooserOpen, setChooserOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const selected = useMemo(
    () => templates.find((t) => t.id === templateId) ?? null,
    [templates, templateId],
  );

  return (
    <div className="mx-auto w-full max-w-5xl">
      <h1 className="text-xl font-medium tracking-tight text-foreground">
        Create an annual appraisal
      </h1>

      {enabled360 && (
        <TypeSwitcher is360={false} className="mt-4" />
      )}

      <CreationProgress current="setup" className="mt-4" />

      {error && (
        <div
          className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      )}

      {!templates.length && (
        <p className="mt-4 text-sm">
          <Link href="/dashboard/templates" className="text-primary underline">
            Create a question template
          </Link>{" "}
          to start your appraisal.
        </p>
      )}

      <form action={createCampaign} className="mt-5 space-y-5">
        <input type="hidden" name="campaign_type" value="annual_appraisal" />
        <input type="hidden" name="template_id" value={templateId} required />

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-1">
            <span className="font-medium text-foreground">Campaign name</span>
            <input
              name="name"
              type="text"
              required
              placeholder="e.g. 2026 Annual Appraisals"
              className="mt-1.5 w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-foreground">
              Close date
              <span className="ml-1.5 font-normal text-muted-foreground">
                Optional
              </span>
            </span>
            <input
              name="closes_at"
              type="date"
              value={closesAt}
              onChange={(e) => setClosesAt(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span className="mt-1 block text-xs text-muted-foreground">
              End of selected day ({timezone}).
            </span>
          </label>
        </div>

        <TemplateField
          selected={selected}
          templates={templates}
          chooserOpen={chooserOpen}
          setChooserOpen={setChooserOpen}
          previewOpen={previewOpen}
          setPreviewOpen={setPreviewOpen}
          setTemplateId={setTemplateId}
          templateId={templateId}
          is360={false}
        />

        <div className="flex flex-wrap items-center gap-3 border-t border-border/60 pt-4">
          <FormSubmit
            disabled={!templates.length || !templateId}
            pendingLabel="Continuing…"
          >
            Continue to people →
          </FormSubmit>
          <Button asChild variant="ghost">
            <Link href="/dashboard/campaigns">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}

function Feedback360Wizard({
  enabled360,
  templates,
  people,
  departments,
  timezone,
  error,
  initialTemplateId,
}: {
  enabled360: boolean;
  templates: CreateTemplateOption[];
  people: CreatePersonOption[];
  departments: PickerDepartment[];
  timezone: string;
  error?: string;
  initialTemplateId: string;
}) {
  const [step, setStep] = useState<CreationStepKey>("setup");
  const [name, setName] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [templateId, setTemplateId] = useState(initialTemplateId);
  const [closesAt, setClosesAt] = useState("");
  const [reviewerIds, setReviewerIds] = useState<string[]>([]);
  const [relationships, setRelationships] = useState<Record<string, string>>(
    {},
  );
  const [privacyAck, setPrivacyAck] = useState(false);
  const [chooserOpen, setChooserOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selected = useMemo(
    () => templates.find((t) => t.id === templateId) ?? null,
    [templates, templateId],
  );
  const subject = people.find((p) => p.id === subjectId) ?? null;
  const peopleById = useMemo(
    () => Object.fromEntries(people.map((p) => [p.id, p])),
    [people],
  );

  const setReviewers = (ids: string[]) => {
    setReviewerIds(ids);
    setRelationships((prev) => {
      const next = { ...prev };
      for (const id of ids) {
        if (!next[id]) next[id] = "peer";
      }
      for (const key of Object.keys(next)) {
        if (!ids.includes(key)) delete next[key];
      }
      return next;
    });
  };

  const goPeople = () => {
    setLocalError(null);
    if (!name.trim()) {
      setLocalError("Name the campaign");
      return;
    }
    if (!subjectId) {
      setLocalError("Choose the person receiving feedback");
      return;
    }
    if (!templateId) {
      setLocalError("Choose a question template");
      return;
    }
    setStep("people");
  };

  const goReview = () => {
    setLocalError(null);
    if (reviewerIds.length < 5) {
      setLocalError("Choose at least five reviewers");
      return;
    }
    if (!privacyAck) {
      setLocalError("Read and accept the anonymity policy");
      return;
    }
    setStep("review");
  };

  const submit = () => {
    setLocalError(null);
    startTransition(async () => {
      const data = new FormData();
      data.set("campaign_type", "feedback_360");
      data.set("name", name.trim());
      data.set("subject_id", subjectId);
      data.set("template_id", templateId);
      if (closesAt) data.set("closes_at", closesAt);
      data.set("privacy_ack", "on");
      for (const id of reviewerIds) {
        data.append("reviewer_id", id);
        data.set(`relationship_${id}`, relationships[id] ?? "peer");
      }
      await createCampaign(data);
    });
  };

  const displayError = localError || error;

  return (
    <div
      className={cn(
        "mx-auto w-full",
        step === "people" ? "max-w-6xl" : "max-w-5xl",
      )}
    >
      <h1 className="text-xl font-medium tracking-tight text-foreground">
        Create anonymous 360 feedback
      </h1>

      {enabled360 && <TypeSwitcher is360 className="mt-4" />}

      <CreationProgress current={step} className="mt-4" />

      {displayError && (
        <div
          className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {displayError}
        </div>
      )}

      {!templates.length && (
        <p className="mt-4 text-sm">
          <Link href="/dashboard/templates" className="text-primary underline">
            Create a question template
          </Link>{" "}
          to start your 360 campaign.
        </p>
      )}

      {step === "setup" && (
        <div className="mt-5 space-y-5">
          <p className="text-sm text-muted-foreground">
            360 feedback is combined anonymously and requires at least five
            completed reviewers before results are available.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-foreground">Campaign name</span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Leadership 360 — Alex Morgan"
                className="mt-1.5 w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-foreground">
                Close date
                <span className="ml-1.5 font-normal text-muted-foreground">
                  Optional
                </span>
              </span>
              <input
                type="date"
                value={closesAt}
                onChange={(e) => setClosesAt(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="mt-1 block text-xs text-muted-foreground">
                End of selected day ({timezone}).
              </span>
            </label>
          </div>

          <label className="block text-sm">
            <span className="font-medium text-foreground">
              Person receiving feedback
            </span>
            <select
              value={subjectId}
              onChange={(e) => {
                const next = e.target.value;
                setSubjectId(next);
                setReviewerIds((ids) => ids.filter((id) => id !== next));
              }}
              className="mt-1.5 w-full max-w-lg rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Choose a person</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name || p.email}
                </option>
              ))}
            </select>
          </label>

          <TemplateField
            selected={selected}
            templates={templates}
            chooserOpen={chooserOpen}
            setChooserOpen={setChooserOpen}
            previewOpen={previewOpen}
            setPreviewOpen={setPreviewOpen}
            setTemplateId={setTemplateId}
            templateId={templateId}
            is360
          />

          <div className="flex flex-wrap items-center gap-3 border-t border-border/60 pt-4">
            <Button
              type="button"
              disabled={!templates.length || !templateId}
              onClick={goPeople}
            >
              Continue to people →
            </Button>
            <Button asChild variant="ghost">
              <Link href="/dashboard/campaigns">Cancel</Link>
            </Button>
          </div>
        </div>
      )}

      {step === "people" && (
        <div className="mt-5 space-y-5">
          <div>
            <h2 className="text-lg font-medium tracking-tight text-foreground">
              Choose reviewers
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Feedback for{" "}
              <span className="font-medium text-foreground">
                {subject?.full_name || subject?.email || "—"}
              </span>
            </p>
          </div>

          {people.length === 0 ? (
            <p className="text-sm">
              <Link href="/dashboard/people" className="text-primary underline">
                Add people to your workspace
              </Link>{" "}
              before choosing reviewers.
            </p>
          ) : (
            <PeoplePicker
              mode="360"
              people={people}
              departments={departments}
              selectedIds={reviewerIds}
              onChange={setReviewers}
              excludeIds={subjectId ? [subjectId] : []}
              relationships={relationships}
              onRelationshipChange={(id, rel) =>
                setRelationships((prev) => ({ ...prev, [id]: rel }))
              }
            />
          )}

          <section className="rounded-xl bg-surface/80 px-4 py-3.5 text-sm leading-relaxed">
            <h3 className="font-medium text-foreground">Anonymity policy</h3>
            <p className="mt-1.5 text-muted-foreground">
              Your organisation receives combined feedback without reviewer
              names or response times. Results require five completed reviewer
              responses and campaign closure. Written comments may identify
              their author. Trusted platform operators can access operational
              records.
            </p>
            <label className="mt-3 flex items-start gap-2 text-foreground">
              <input
                type="checkbox"
                checked={privacyAck}
                onChange={(e) => setPrivacyAck(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-input"
              />
              <span>
                I understand the five-reviewer policy and written-comment
                limitations.
              </span>
            </label>
          </section>

          <div className="flex flex-wrap items-center gap-3 border-t border-border/60 pt-4">
            <Button type="button" onClick={goReview}>
              Continue to review →
            </Button>
            <Button type="button" variant="ghost" onClick={() => setStep("setup")}>
              ← Back to setup
            </Button>
          </div>
        </div>
      )}

      {step === "review" && (
        <div className="mt-5">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(14rem,1fr)]">
            <div className="min-w-0 space-y-5">
              <div>
                <h2 className="text-xl font-medium tracking-tight text-foreground">
                  {name.trim() || "Untitled 360"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Anonymous 360
                  {subject
                    ? ` · Feedback for ${subject.full_name || subject.email}`
                    : ""}
                  {` · ${reviewerIds.length} reviewers invited`}
                  {selected ? ` · ${selected.name}` : ""}
                  {closesAt
                    ? ` · Closes ${formatCloseDate(closesAt)}`
                    : ""}
                </p>
              </div>

              <section>
                <h3 className="text-sm font-semibold text-foreground">Privacy</h3>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>{reviewerIds.length} reviewers selected</li>
                  <li>
                    {reviewerIds.length >= 5
                      ? "Minimum reviewer cohort met"
                      : "Need at least five reviewers"}
                  </li>
                  <li>
                    Results available only after closure and at least five
                    completed reviewer responses
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-foreground">
                  Reviewers
                </h3>
                <ul className="mt-2 divide-y divide-border/60 border-y border-border/60 text-sm">
                  {reviewerIds.map((id) => {
                    const p = peopleById[id];
                    const rel = (relationships[id] ?? "peer").replaceAll(
                      "_",
                      " ",
                    );
                    return (
                      <li
                        key={id}
                        className="flex flex-wrap items-center justify-between gap-2 py-2"
                      >
                        <span className="font-medium text-foreground">
                          {p?.full_name || p?.email || "Person"}
                        </span>
                        <span className="text-muted-foreground capitalize">
                          {rel}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-foreground">
                  Questions
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selected
                    ? `${selected.name} · ${selected.questionCount} questions`
                    : "Not selected"}
                </p>
              </section>
            </div>

            <aside className="min-w-0 space-y-3 rounded-xl border border-border/70 bg-surface/50 p-4 text-sm lg:self-start">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Ready to send
              </p>
              <dl className="space-y-2">
                <div>
                  <dt className="text-muted-foreground">Type</dt>
                  <dd className="font-medium text-foreground">Anonymous 360</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Subject</dt>
                  <dd className="font-medium text-foreground">
                    {subject?.full_name || subject?.email || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Reviewers</dt>
                  <dd className="font-medium text-foreground">
                    {reviewerIds.length}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Close date</dt>
                  <dd className="font-medium text-foreground">
                    {formatCloseDate(closesAt) ?? "Not set"}
                  </dd>
                </div>
              </dl>
              <p className="text-xs text-muted-foreground">
                Creating this campaign locks the setup and prepares invitations.
                Nothing is emailed until you send from the next screen.
              </p>
            </aside>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border/60 pt-4">
            <Button type="button" disabled={isPending} onClick={submit}>
              {isPending ? "Creating…" : "Create campaign →"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={isPending}
              onClick={() => setStep("people")}
            >
              ← Back to people
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function TypeSwitcher({
  is360,
  className,
}: {
  is360: boolean;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Campaign type"
      className={cn("grid gap-2 sm:grid-cols-2 lg:max-w-xl", className)}
    >
      <TypeOption
        href="/dashboard/campaigns/new"
        selected={!is360}
        title="Annual appraisal"
        description="Self and manager review"
      />
      <TypeOption
        href="/dashboard/campaigns/new?type=360"
        selected={is360}
        title="Anonymous 360"
        description="Anonymous feedback from multiple reviewers"
      />
    </div>
  );
}

function TypeOption({
  href,
  selected,
  title,
  description,
}: {
  href: string;
  selected: boolean;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      role="radio"
      aria-checked={selected}
      className={cn(
        "rounded-xl border px-4 py-3 transition-colors",
        selected
          ? "border-primary/35 bg-accent/50 ring-1 ring-primary/20"
          : "border-border bg-card/40 hover:border-foreground/15",
      )}
    >
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
    </Link>
  );
}

function TemplateField({
  selected,
  templates,
  chooserOpen,
  setChooserOpen,
  previewOpen,
  setPreviewOpen,
  setTemplateId,
  templateId,
  is360,
}: {
  selected: CreateTemplateOption | null;
  templates: CreateTemplateOption[];
  chooserOpen: boolean;
  setChooserOpen: (open: boolean) => void;
  previewOpen: boolean;
  setPreviewOpen: (open: boolean) => void;
  setTemplateId: (id: string) => void;
  templateId: string;
  is360: boolean;
}) {
  const applicableHint = is360
    ? "Anonymous feedback from multiple reviewers"
    : "Self + manager";

  return (
    <>
      <div>
        <p className="text-sm font-medium text-foreground">Question template</p>
        {selected ? (
          <div className="mt-1.5 rounded-xl border border-border/80 bg-card/50 px-3.5 py-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-foreground">{selected.name}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {selected.questionCount} question
                  {selected.questionCount === 1 ? "" : "s"} · {applicableHint}
                </p>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
                {selected.questions.length > 0 && (
                  <button
                    type="button"
                    className="font-medium text-primary hover:underline"
                    onClick={() => setPreviewOpen(true)}
                  >
                    Preview
                  </button>
                )}
                <button
                  type="button"
                  className="font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => setChooserOpen(true)}
                >
                  Change
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-1.5 rounded-xl border border-dashed border-border px-3.5 py-6">
            <p className="text-sm font-medium text-foreground">
              Choose a question template
            </p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Pick the questions people will answer. You can preview before
              continuing.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              disabled={!templates.length}
              onClick={() => setChooserOpen(true)}
            >
              Choose template
            </Button>
          </div>
        )}
      </div>

      <Sheet open={chooserOpen} onOpenChange={setChooserOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col overflow-y-auto bg-card sm:max-w-md"
        >
          <SheetHeader className="text-left">
            <SheetTitle>Choose a template</SheetTitle>
            <SheetDescription>
              {is360
                ? "Only rating and text templates are shown for 360 feedback."
                : "Pick the questions people will answer in this campaign."}
            </SheetDescription>
          </SheetHeader>
          <ul className="mt-6 space-y-2">
            {templates.map((t) => {
              const active = t.id === templateId;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    className={cn(
                      "w-full rounded-xl border px-4 py-3 text-left transition-colors",
                      active
                        ? "border-primary/40 bg-accent/60 ring-1 ring-primary/25"
                        : "border-border bg-surface/40 hover:border-foreground/15 hover:bg-card",
                    )}
                    onClick={() => {
                      setTemplateId(t.id);
                      setChooserOpen(false);
                    }}
                  >
                    <p className="font-medium text-foreground">{t.name}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {t.questionCount} question
                      {t.questionCount === 1 ? "" : "s"}
                      {t.campaign_type_default === "feedback_360"
                        ? " · 360"
                        : " · Annual"}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </SheetContent>
      </Sheet>

      <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col overflow-y-auto bg-card sm:max-w-md"
        >
          <SheetHeader className="text-left">
            <SheetTitle>{selected?.name ?? "Questions"}</SheetTitle>
            <SheetDescription>
              Preview only — edit templates from the Templates area.
            </SheetDescription>
          </SheetHeader>
          <ol className="mt-6 space-y-4">
            {(selected?.questions ?? []).map((q, i) => (
              <li
                key={q.id}
                className="border-b border-border/60 pb-3 last:border-0"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Question {i + 1}
                  {q.type ? ` · ${q.type.replace("_", " ")}` : ""}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-foreground">
                  {q.prompt}
                </p>
              </li>
            ))}
          </ol>
        </SheetContent>
      </Sheet>
    </>
  );
}
