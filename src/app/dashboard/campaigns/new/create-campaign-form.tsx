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
import { useMemo, useState } from "react";
import { createCampaign } from "../actions";

export type CreateTemplateOption = {
  id: string;
  name: string;
  campaign_type_default: string;
  questionCount: number;
  questions: { id: string; prompt: string; type: string }[];
};

export type CreatePersonOption = {
  id: string;
  full_name: string | null;
  email: string;
};

const CREATION_STEPS = [
  { key: "details", label: "Details & template" },
  { key: "people", label: "People" },
  { key: "review", label: "Review & send" },
] as const;

export default function CreateCampaignForm({
  is360,
  enabled360,
  templates,
  people,
  timezone,
  error,
}: {
  is360: boolean;
  enabled360: boolean;
  templates: CreateTemplateOption[];
  people: CreatePersonOption[];
  timezone: string;
  error?: string;
}) {
  const [templateId, setTemplateId] = useState("");
  const [closesAt, setClosesAt] = useState("");
  const [chooserOpen, setChooserOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const selected = useMemo(
    () => templates.find((t) => t.id === templateId) ?? null,
    [templates, templateId],
  );

  const applicableHint = is360
    ? "Anonymous feedback from multiple reviewers"
    : "Self + manager";

  const closeSummary = closesAt
    ? new Date(`${closesAt}T12:00:00`).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Not set";

  return (
    <div className="w-full max-w-5xl">
      <h1 className="text-xl font-medium tracking-tight text-foreground">
        {is360 ? "Create anonymous 360 feedback" : "Create an annual appraisal"}
      </h1>

      {enabled360 && (
        <div
          role="radiogroup"
          aria-label="Campaign type"
          className="mt-4 grid gap-2 sm:grid-cols-2 lg:max-w-xl"
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
      )}

      <CreationProgress className="mt-4" />

      {is360 && (
        <p className="mt-3 text-sm text-muted-foreground">
          Reviewers are combined into one anonymous group. Results need five
          reviewers and campaign closure.
        </p>
      )}

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
          to start your {is360 ? "360 campaign" : "appraisal"}.
        </p>
      )}

      <form action={createCampaign} className="mt-5">
        <input
          type="hidden"
          name="campaign_type"
          value={is360 ? "feedback_360" : "annual_appraisal"}
        />
        <input type="hidden" name="template_id" value={templateId} required />

        {is360 && (
          <div className="mb-6 space-y-5 border-b border-border/70 pb-6">
            <label className="block text-sm">
              <span className="font-medium text-foreground">
                Person receiving feedback
              </span>
              <select
                name="subject_id"
                required
                className="mt-1.5 w-full max-w-md rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Choose a person</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name || p.email}
                  </option>
                ))}
              </select>
            </label>

            <fieldset>
              <legend className="text-sm font-medium text-foreground">
                Choose at least five reviewers
              </legend>
              <p className="mt-1 text-sm text-muted-foreground">
                Select colleagues other than the person receiving feedback.
                Relationship labels help organise invitations; results never
                separate these groups.
              </p>
              <div className="mt-2.5 space-y-2">
                {people.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 bg-card/40 px-3 py-2"
                  >
                    <label className="flex min-w-0 flex-1 items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        name="reviewer_id"
                        value={p.id}
                        className="h-4 w-4 rounded border-input"
                      />
                      <span className="truncate">{p.full_name || p.email}</span>
                    </label>
                    <select
                      name={`relationship_${p.id}`}
                      aria-label={`Relationship for ${p.full_name || p.email}`}
                      className="rounded-lg border border-input bg-card px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="peer">Peer</option>
                      <option value="manager">Manager</option>
                      <option value="direct_report">Direct report</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                ))}
              </div>
            </fieldset>

            <section className="rounded-xl bg-surface/80 px-4 py-3.5 text-sm leading-relaxed">
              <h2 className="font-medium text-foreground">Anonymity policy</h2>
              <p className="mt-1.5 text-muted-foreground">
                Your organisation receives combined feedback without reviewer
                names or response times. Results require five reviewers and
                campaign closure. Written comments may identify their author.
                Trusted platform operators can access operational records.
              </p>
              <label className="mt-3 flex items-start gap-2 text-foreground">
                <input
                  type="checkbox"
                  required
                  name="privacy_ack"
                  className="mt-0.5 h-4 w-4 rounded border-input"
                />
                <span>
                  I understand the five-reviewer policy and written-comment
                  limitations.
                </span>
              </label>
            </section>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(16rem,1fr)] lg:gap-8 xl:gap-10">
          {/* Primary */}
          <div className="min-w-0 space-y-4">
            <div>
              <label
                htmlFor="campaign-name"
                className="block text-sm font-medium text-foreground"
              >
                Campaign name
              </label>
              <input
                id="campaign-name"
                name="name"
                type="text"
                required
                placeholder="e.g. 2026 Annual Appraisals"
                className="mt-1.5 w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <p className="text-sm font-medium text-foreground">Questions</p>
              {selected ? (
                <div className="mt-1.5 rounded-xl border border-border/80 bg-card/50 px-3.5 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">
                        {selected.name}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {selected.questionCount} question
                        {selected.questionCount === 1 ? "" : "s"} ·{" "}
                        {applicableHint}
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
                <div className="mt-1.5 rounded-xl border border-dashed border-border px-3.5 py-3">
                  <p className="text-sm font-medium text-foreground">
                    Choose a question template
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    disabled={!templates.length}
                    onClick={() => setChooserOpen(true)}
                  >
                    Choose template
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Secondary */}
          <aside className="min-w-0 space-y-5 lg:border-l lg:border-border/70 lg:pl-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Schedule
              </p>
              <label
                htmlFor="close-date"
                className="mt-2 block text-sm font-medium text-foreground"
              >
                Close date
                <span className="ml-1.5 font-normal text-muted-foreground">
                  Optional
                </span>
              </label>
              <input
                id="close-date"
                name="closes_at"
                type="date"
                value={closesAt}
                onChange={(e) => setClosesAt(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-input bg-card px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                End of selected day ({timezone}).
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Setup
              </p>
              <dl className="mt-2 space-y-2.5 text-sm">
                <div>
                  <dt className="text-muted-foreground">Type</dt>
                  <dd className="font-medium text-foreground">
                    {is360 ? "Anonymous 360" : "Annual appraisal"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Questions</dt>
                  <dd className="font-medium text-foreground">
                    {selected
                      ? `${selected.name} · ${selected.questionCount}`
                      : "Not selected"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Close date</dt>
                  <dd className="font-medium text-foreground">{closeSummary}</dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border/60 pt-4">
          <FormSubmit
            disabled={!templates.length || !templateId}
            pendingLabel="Continuing…"
          >
            {is360 ? "Create campaign →" : "Continue to people →"}
          </FormSubmit>
          <Button asChild variant="ghost">
            <Link href="/dashboard/campaigns">Cancel</Link>
          </Button>
        </div>
      </form>

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

function CreationProgress({ className }: { className?: string }) {
  const currentKey = "details";
  return (
    <div className={className}>
      <div
        className="flex flex-wrap gap-1.5 sm:hidden"
        aria-label="Creation progress"
      >
        {CREATION_STEPS.map((step) => {
          const current = step.key === currentKey;
          return (
            <span
              key={step.key}
              className={cn(
                "rounded-full px-2 py-0.5 text-xs",
                current
                  ? "bg-surface font-medium text-foreground ring-1 ring-border"
                  : "text-muted-foreground",
              )}
            >
              {step.label}
            </span>
          );
        })}
      </div>
      <ol
        aria-label="Creation progress"
        className="hidden items-center gap-0 sm:flex"
      >
        {CREATION_STEPS.map((step, i) => {
          const current = step.key === currentKey;
          return (
            <li key={step.key} className="flex min-w-0 items-center">
              {i > 0 && (
                <span
                  aria-hidden
                  className="mx-1.5 h-px w-4 shrink-0 bg-border sm:w-6 md:w-8"
                />
              )}
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 whitespace-nowrap text-[13px]",
                  current
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                    current
                      ? "border border-primary/50 bg-accent text-accent-foreground"
                      : "border border-border text-transparent",
                  )}
                >
                  {current ? "·" : ""}
                </span>
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
