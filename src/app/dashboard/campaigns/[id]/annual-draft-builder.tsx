"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { saveSubjectsAndAssignments } from "../actions";
import CreationProgress from "../creation-progress";
import PeoplePicker, {
  type PickerDepartment,
  type PickerPerson,
} from "../people-picker";
import SendControls from "./send-controls";
import type { TemplateQuestion } from "@/lib/types/database";

export type SubjectRow = {
  personId: string;
  managerPersonId: string | null;
};

function formatClose(closesAt: string | null, timezone: string) {
  if (!closesAt) return "Not set";
  return new Date(closesAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: timezone,
  });
}

export default function AnnualDraftBuilder({
  campaignId,
  campaignName,
  templateName,
  questionCount,
  questions,
  closesAt,
  timezone,
  people,
  departments,
  initialSubjects,
  ready,
  initialStep,
}: {
  campaignId: string;
  campaignName: string;
  templateName: string | null;
  questionCount: number;
  questions: TemplateQuestion[];
  closesAt: string | null;
  timezone: string;
  people: PickerPerson[];
  departments: PickerDepartment[];
  initialSubjects: SubjectRow[];
  ready: boolean;
  initialStep: "people" | "review";
}) {
  const router = useRouter();
  const [step, setStep] = useState<"people" | "review">(initialStep);
  const [selectedIds, setSelectedIds] = useState(
    () => initialSubjects.map((s) => s.personId),
  );
  const [managerOverrides, setManagerOverrides] = useState<
    Record<string, string | null>
  >(() =>
    Object.fromEntries(
      initialSubjects.map((s) => [s.personId, s.managerPersonId]),
    ),
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const peopleById = useMemo(
    () => Object.fromEntries(people.map((p) => [p.id, p])),
    [people],
  );

  const selectedPeople = selectedIds
    .map((id) => peopleById[id])
    .filter(Boolean) as PickerPerson[];

  const resolveManagerId = (personId: string) => {
    if (personId in managerOverrides) return managerOverrides[personId];
    const person = peopleById[personId];
    const mid = person?.manager_person_id ?? null;
    return mid && peopleById[mid] ? mid : null;
  };

  const withManager = selectedPeople.filter((p) => !!resolveManagerId(p.id))
    .length;
  const needsAttention = selectedPeople.length - withManager;

  const onChangeSelection = (ids: string[]) => {
    setSelectedIds(ids);
    setManagerOverrides((prev) => {
      const next: Record<string, string | null> = {};
      for (const id of ids) {
        if (id in prev) next[id] = prev[id];
        else {
          const person = peopleById[id];
          const mid = person?.manager_person_id ?? null;
          next[id] = mid && peopleById[mid] ? mid : null;
        }
      }
      return next;
    });
  };

  const continueToReview = () => {
    setError(null);
    if (selectedIds.length === 0) {
      setError("Choose at least one person");
      return;
    }
    startTransition(async () => {
      const rows = selectedIds.map((personId) => ({
        personId,
        selfPersonId: personId,
        managerPersonId: resolveManagerId(personId),
      }));
      const result = await saveSubjectsAndAssignments(campaignId, rows);
      if (result.error) {
        setError(result.error);
        return;
      }
      setStep("review");
      router.replace(`/dashboard/campaigns/${campaignId}?step=review`);
      router.refresh();
    });
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <header>
        <Link
          href="/dashboard/campaigns"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← Campaigns
        </Link>
        <h1 className="mt-2 text-xl font-medium tracking-tight text-foreground">
          {campaignName}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Annual appraisal · Draft
        </p>
        <CreationProgress current={step} className="mt-4" />
      </header>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      {step === "people" && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-medium tracking-tight text-foreground">
              Choose who will take part
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Each selected employee completes a self appraisal and their
              manager receives the manager review.
            </p>
          </div>

          {people.length === 0 ? (
            <p className="text-sm">
              <Link href="/dashboard/people" className="text-primary underline">
                Add people to your workspace
              </Link>{" "}
              before choosing participants.
            </p>
          ) : (
            <PeoplePicker
              mode="annual"
              people={people}
              departments={departments}
              selectedIds={selectedIds}
              onChange={onChangeSelection}
              managerOverrides={managerOverrides}
              onManagerChange={(id, managerId) =>
                setManagerOverrides((prev) => ({ ...prev, [id]: managerId }))
              }
            />
          )}

          <div className="flex flex-wrap items-center gap-3 border-t border-border/60 pt-4">
            <Button
              type="button"
              disabled={isPending || selectedIds.length === 0}
              onClick={continueToReview}
            >
              {isPending ? "Saving…" : "Continue to review →"}
            </Button>
            <Button asChild variant="ghost">
              <Link href="/dashboard/campaigns">Cancel</Link>
            </Button>
          </div>
        </div>
      )}

      {step === "review" && (
        <div className="space-y-5">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(14rem,1fr)]">
            <div className="min-w-0 space-y-5">
              <div>
                <h2 className="text-xl font-medium tracking-tight text-foreground">
                  {campaignName}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Annual appraisal · {selectedPeople.length} employees ·{" "}
                  {withManager} manager reviews
                  {templateName ? ` · ${templateName}` : ""}
                  {closesAt
                    ? ` · Closes ${formatClose(closesAt, timezone)}`
                    : ""}
                </p>
              </div>

              <section>
                <h3 className="text-sm font-semibold text-foreground">People</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedPeople.length} employees selected · {withManager}{" "}
                  managers assigned
                  {needsAttention > 0
                    ? ` · ${needsAttention} require${needsAttention === 1 ? "s" : ""} attention`
                    : ""}
                </p>
                {needsAttention > 0 && (
                  <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
                    People without a manager will only receive a self appraisal.
                  </p>
                )}
                <ul className="mt-3 max-h-64 divide-y divide-border/60 overflow-y-auto border-y border-border/60 text-sm">
                  {selectedPeople.map((p) => {
                    const managerId = resolveManagerId(p.id);
                    const manager = managerId ? peopleById[managerId] : null;
                    return (
                      <li key={p.id} className="py-2">
                        <p className="font-medium text-foreground">
                          {p.full_name || p.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {manager
                            ? `Manager: ${manager.full_name || manager.email}`
                            : "No manager assigned"}
                        </p>
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
                  {templateName ?? "Template"} · {questionCount} questions
                </p>
                {questions.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium text-primary">
                      Preview questions
                    </summary>
                    <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm">
                      {questions.map((q) => (
                        <li key={q.id}>{q.prompt}</li>
                      ))}
                    </ol>
                  </details>
                )}
              </section>

              <section>
                <h3 className="text-sm font-semibold text-foreground">
                  Schedule
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Closes {formatClose(closesAt, timezone)}
                </p>
              </section>

              {ready ? (
                <SendControls campaignId={campaignId} timezone={timezone} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Save at least one participant and choose a template with
                  questions before sending.
                </p>
              )}
            </div>

            <aside className="min-w-0 space-y-3 rounded-xl border border-border/70 bg-surface/50 p-4 text-sm lg:self-start">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Summary
              </p>
              <dl className="space-y-2">
                <div>
                  <dt className="text-muted-foreground">Type</dt>
                  <dd className="font-medium text-foreground">
                    Annual appraisal
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">People</dt>
                  <dd className="font-medium text-foreground">
                    {selectedPeople.length}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Questions</dt>
                  <dd className="font-medium text-foreground">
                    {questionCount}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Close date</dt>
                  <dd className="font-medium text-foreground">
                    {formatClose(closesAt, timezone)}
                  </dd>
                </div>
              </dl>
            </aside>
          </div>

          <div className="border-t border-border/60 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setStep("people");
                router.replace(`/dashboard/campaigns/${campaignId}?step=people`);
              }}
            >
              ← Back to people
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
