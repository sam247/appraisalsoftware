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
import {
  ANNUAL_STEPS,
  CampaignWizard,
  FEEDBACK_STEPS,
  ReviewSummary,
  WizardFooter,
} from "../campaign-wizard";
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
  templates,
  people,
  departments,
  timezone,
  error,
  initialTemplateId = "",
}: {
  is360: boolean;
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
      templates={templates}
      timezone={timezone}
      error={error}
      initialTemplateId={initialTemplateId}
    />
  );
}

function FieldLabel({
  children,
  optional,
}: {
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <span className="font-medium text-foreground">
      {children}
      {optional && (
        <span className="ml-1.5 font-normal text-muted-foreground">
          Optional
        </span>
      )}
    </span>
  );
}

const inputClass =
  "mt-1.5 w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

function AnnualSetupForm({
  templates,
  timezone,
  error,
  initialTemplateId,
}: {
  templates: CreateTemplateOption[];
  timezone: string;
  error?: string;
  initialTemplateId: string;
}) {
  const [sub, setSub] = useState<"details" | "questions">("details");
  const [name, setName] = useState("");
  const [closesAt, setClosesAt] = useState("");
  const [templateId, setTemplateId] = useState(initialTemplateId);
  const [chooserOpen, setChooserOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const selected = useMemo(
    () => templates.find((t) => t.id === templateId) ?? null,
    [templates, templateId],
  );

  const goQuestions = () => {
    setLocalError(null);
    if (!name.trim()) {
      setLocalError("Give the campaign a name");
      return;
    }
    setSub("questions");
  };

  return (
    <CampaignWizard
      typeLabel="Annual appraisal"
      title="New annual appraisal"
      steps={ANNUAL_STEPS}
      current={sub}
      error={localError ?? error}
    >
      {sub === "details" && (
        <div className="space-y-5">
          <TypeSwitcher is360={false} />
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Each employee you add later completes a self appraisal, and their
            manager receives the matching manager review.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <FieldLabel>Campaign name</FieldLabel>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. 2026 Annual Appraisals"
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              <FieldLabel optional>Close date</FieldLabel>
              <input
                type="date"
                value={closesAt}
                onChange={(e) => setClosesAt(e.target.value)}
                className={inputClass}
              />
              <span className="mt-1 block text-xs text-muted-foreground">
                Ends at the end of the selected day ({timezone}).
              </span>
            </label>
          </div>

          <WizardFooter>
            <Button type="button" onClick={goQuestions}>
              Continue to questions →
            </Button>
            <Button asChild variant="ghost">
              <Link href="/dashboard/campaigns">Cancel</Link>
            </Button>
          </WizardFooter>
        </div>
      )}

      <form
        action={createCampaign}
        className={cn("space-y-5", sub !== "questions" && "hidden")}
      >
        <input type="hidden" name="campaign_type" value="annual_appraisal" />
        <input type="hidden" name="template_id" value={templateId} />
        <input type="hidden" name="name" value={name} />
        <input type="hidden" name="closes_at" value={closesAt} />

        {!templates.length ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-6 text-sm">
            <p className="font-medium text-foreground">
              No question templates yet
            </p>
            <p className="mt-1 max-w-md text-muted-foreground">
              <Link
                href="/dashboard/templates"
                className="text-primary underline"
              >
                Create a question template
              </Link>{" "}
              to choose the questions people will answer.
            </p>
          </div>
        ) : (
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
        )}

        <WizardFooter>
          <FormSubmit
            disabled={!templates.length || !templateId}
            pendingLabel="Creating…"
          >
            Continue to people →
          </FormSubmit>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setSub("details")}
          >
            ← Back to details
          </Button>
        </WizardFooter>
      </form>
    </CampaignWizard>
  );
}

function Feedback360Wizard({
  templates,
  people,
  departments,
  timezone,
  error,
  initialTemplateId,
}: {
  templates: CreateTemplateOption[];
  people: CreatePersonOption[];
  departments: PickerDepartment[];
  timezone: string;
  error?: string;
  initialTemplateId: string;
}) {
  const [step, setStep] = useState<
    "details" | "questions" | "reviewers" | "review"
  >("details");
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

  const goQuestions = () => {
    setLocalError(null);
    if (!name.trim()) {
      setLocalError("Name the campaign");
      return;
    }
    if (!subjectId) {
      setLocalError("Choose the person receiving feedback");
      return;
    }
    setStep("questions");
  };

  const goReviewers = () => {
    setLocalError(null);
    if (!templateId) {
      setLocalError("Choose a question template");
      return;
    }
    setStep("reviewers");
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

  return (
    <CampaignWizard
      typeLabel="Anonymous 360"
      title={name.trim() || "New 360 feedback"}
      steps={FEEDBACK_STEPS}
      current={step}
      error={localError ?? error}
      wide={step === "reviewers"}
    >
      {step === "details" && (
        <div className="space-y-5">
          <TypeSwitcher is360 />
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            360 feedback is combined anonymously and requires at least five
            completed reviewers before results are available.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <FieldLabel>Campaign name</FieldLabel>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Leadership 360 — Alex Morgan"
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              <FieldLabel optional>Close date</FieldLabel>
              <input
                type="date"
                value={closesAt}
                onChange={(e) => setClosesAt(e.target.value)}
                className={inputClass}
              />
              <span className="mt-1 block text-xs text-muted-foreground">
                Ends at the end of the selected day ({timezone}).
              </span>
            </label>
          </div>

          <label className="block text-sm">
            <FieldLabel>Person receiving feedback</FieldLabel>
            <select
              value={subjectId}
              onChange={(e) => {
                const next = e.target.value;
                setSubjectId(next);
                setReviewerIds((ids) => ids.filter((id) => id !== next));
              }}
              className={cn(inputClass, "max-w-lg")}
            >
              <option value="">Choose a person</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name || p.email}
                </option>
              ))}
            </select>
          </label>

          <WizardFooter>
            <Button type="button" onClick={goQuestions}>
              Continue to questions →
            </Button>
            <Button asChild variant="ghost">
              <Link href="/dashboard/campaigns">Cancel</Link>
            </Button>
          </WizardFooter>
        </div>
      )}

      {step === "questions" && (
        <div className="space-y-5">
          {!templates.length ? (
            <div className="rounded-xl border border-dashed border-border px-4 py-6 text-sm">
              <p className="font-medium text-foreground">
                No question templates yet
              </p>
              <p className="mt-1 max-w-md text-muted-foreground">
                <Link
                  href="/dashboard/templates"
                  className="text-primary underline"
                >
                  Create a question template
                </Link>{" "}
                with rating and text questions to start a 360 campaign.
              </p>
            </div>
          ) : (
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
          )}

          <WizardFooter>
            <Button
              type="button"
              disabled={!templates.length || !templateId}
              onClick={goReviewers}
            >
              Continue to reviewers →
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep("details")}
            >
              ← Back to details
            </Button>
          </WizardFooter>
        </div>
      )}

      {step === "reviewers" && (
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Feedback for{" "}
            <span className="font-medium text-foreground">
              {subject?.full_name || subject?.email || "—"}
            </span>
          </p>

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

          <WizardFooter>
            <Button type="button" onClick={goReview}>
              Continue to review →
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep("questions")}
            >
              ← Back to questions
            </Button>
          </WizardFooter>
        </div>
      )}

      {step === "review" && (
        <div className="space-y-6">
          <ReviewSummary
            items={[
              { label: "Type", value: "Anonymous 360" },
              {
                label: "Subject",
                value: subject?.full_name || subject?.email || "—",
              },
              { label: "Reviewers", value: String(reviewerIds.length) },
              {
                label: "Close date",
                value: formatCloseDate(closesAt) ?? "Not set",
              },
            ]}
          />

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
                Results available only after closure and at least five completed
                reviewer responses
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-foreground">Reviewers</h3>
            <ul className="mt-2 divide-y divide-border/60 border-y border-border/60 text-sm">
              {reviewerIds.map((id) => {
                const p = peopleById[id];
                const rel = (relationships[id] ?? "peer").replaceAll("_", " ");
                return (
                  <li
                    key={id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2"
                  >
                    <span className="font-medium text-foreground">
                      {p?.full_name || p?.email || "Person"}
                    </span>
                    <span className="capitalize text-muted-foreground">
                      {rel}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-foreground">Questions</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {selected
                ? `${selected.name} · ${selected.questionCount} questions`
                : "Not selected"}
            </p>
          </section>

          <p className="text-xs text-muted-foreground">
            Creating this campaign locks the setup and prepares invitations.
            Nothing is emailed until you send from the next screen.
          </p>

          <WizardFooter>
            <Button type="button" disabled={isPending} onClick={submit}>
              {isPending ? "Creating…" : "Create campaign →"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={isPending}
              onClick={() => setStep("reviewers")}
            >
              ← Back to reviewers
            </Button>
          </WizardFooter>
        </div>
      )}
    </CampaignWizard>
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
        <p className="mt-0.5 text-sm text-muted-foreground">
          Pick the questions people will answer. You can preview before
          continuing.
        </p>
        {selected ? (
          <div className="mt-3 rounded-xl border border-border/80 bg-card/50 px-3.5 py-3">
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
          <div className="mt-3 rounded-xl border border-dashed border-border px-3.5 py-6">
            <p className="text-sm font-medium text-foreground">
              Choose a question template
            </p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {is360
                ? "Only rating and text templates can be used for 360 feedback."
                : "Pick the questions people will answer in this campaign."}
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
