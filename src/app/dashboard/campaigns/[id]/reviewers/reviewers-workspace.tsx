"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { saveFeedback360Cohort } from "../../actions";
import type { PickerDepartment, PickerPerson } from "../../people-picker";

type PersonRow = PickerPerson & { archived_at: string | null };
type AssignmentRow = {
  respondent_person_id: string;
  relationship: string | null;
};

const RELATIONSHIPS = [
  { value: "peer", label: "Peer" },
  { value: "manager", label: "Manager" },
  { value: "direct_report", label: "Direct report" },
  { value: "other", label: "Other" },
] as const;

function label(person: PersonRow): string {
  return person.full_name?.trim() || person.email;
}

export default function ReviewersWorkspace({
  campaignId,
  campaignName,
  initialSubjectId,
  initialAssignments,
  people,
  departments,
  flash,
}: {
  campaignId: string;
  campaignName: string;
  initialSubjectId: string;
  initialAssignments: AssignmentRow[];
  people: PersonRow[];
  departments: PickerDepartment[];
  flash?: { error?: string; ok?: string };
}) {
  const router = useRouter();
  const [subjectId, setSubjectId] = useState(initialSubjectId);
  const [query, setQuery] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [reviewerIds, setReviewerIds] = useState(
    initialAssignments.map((assignment) => assignment.respondent_person_id),
  );
  const [relationships, setRelationships] = useState<Record<string, string>>(
    Object.fromEntries(
      initialAssignments.map((assignment) => [
        assignment.respondent_person_id,
        assignment.relationship ?? "peer",
      ]),
    ),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const byId = useMemo(
    () => Object.fromEntries(people.map((person) => [person.id, person])),
    [people],
  );
  const departmentById = useMemo(
    () =>
      Object.fromEntries(
        departments.map((department) => [department.id, department.name]),
      ),
    [departments],
  );
  const selectedSet = useMemo(() => new Set(reviewerIds), [reviewerIds]);
  const activePeople = useMemo(
    () => people.filter((person) => !person.archived_at),
    [people],
  );
  const eligible = useMemo(
    () => (subjectId ? activePeople.filter((person) => person.id !== subjectId) : []),
    [activePeople, subjectId],
  );
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return eligible.filter((person) => {
      if (departmentId && person.department_id !== departmentId) return false;
      if (!needle) return true;
      return [person.full_name ?? "", person.email, label(person)]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [departmentId, eligible, query]);
  const selectedReviewers = reviewerIds
    .map((id) => byId[id])
    .filter(Boolean) as PersonRow[];
  const validReviewerCount = selectedReviewers.filter(
    (person) =>
      !person.archived_at &&
      person.id !== subjectId &&
      RELATIONSHIPS.some(
        (relationship) => relationship.value === relationships[person.id],
      ),
  ).length;
  const initialState = JSON.stringify({
    subjectId: initialSubjectId,
    reviewers: initialAssignments
      .map((assignment) => [
        assignment.respondent_person_id,
        assignment.relationship ?? "peer",
      ])
      .sort(),
  });
  const currentState = JSON.stringify({
    subjectId,
    reviewers: reviewerIds
      .map((id) => [id, relationships[id] ?? "peer"])
      .sort(),
  });
  const dirty = initialState !== currentState;
  const allFilteredSelected =
    filtered.length > 0 && filtered.every((person) => selectedSet.has(person.id));

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function select(ids: string[]) {
    setReviewerIds(ids.filter((id) => id !== subjectId));
    setRelationships((current) => {
      const next = { ...current };
      for (const id of ids) {
        if (!(id in next)) next[id] = "peer";
      }
      return next;
    });
  }

  function toggle(id: string) {
    select(
      selectedSet.has(id)
        ? reviewerIds.filter((reviewerId) => reviewerId !== id)
        : [...reviewerIds, id],
    );
  }

  function confirmCancel() {
    if (dirty && !window.confirm("Discard unsaved reviewer changes?")) return;
    router.push(`/dashboard/campaigns/${campaignId}`);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveFeedback360Cohort(
        campaignId,
        subjectId,
        reviewerIds.map((personId) => ({
          personId,
          relationship: relationships[personId] ?? "peer",
        })),
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(`/dashboard/campaigns/${campaignId}`);
      router.refresh();
    });
  }

  return (
    <div className="dashboard-workspace space-y-6 pb-10">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href={`/dashboard/campaigns/${campaignId}`}
            onClick={(event) => {
              event.preventDefault();
              confirmCancel();
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← {campaignName}
          </Link>
          <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Anonymous 360 feedback
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">
            Choose subject &amp; reviewers
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            The subject receives feedback. Reviewers are the anonymous cohort.
            Reviewer names support delivery tracking; normal reports never link
            reviewers to answers.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={confirmCancel}>
          Cancel
        </Button>
      </header>

      {flash?.error && <p role="alert" className="text-sm text-destructive">{flash.error}</p>}
      {flash?.ok && <p role="status" className="text-sm text-foreground">{flash.ok}</p>}

      <section className="max-w-xl border-b border-border pb-5">
        <label className="block text-sm font-medium">
          Feedback subject
          <select
            value={subjectId}
            onChange={(event) => {
              const next = event.target.value;
              setSubjectId(next);
              setReviewerIds((ids) => ids.filter((id) => id !== next));
            }}
            className="field mt-1.5 w-full"
          >
            <option value="">Choose a subject</option>
            {people
              .filter((person) => !person.archived_at || person.id === initialSubjectId)
              .map((person) => (
                <option key={person.id} value={person.id}>
                  {label(person)}
                  {person.archived_at ? " · Archived" : ""}
                </option>
              ))}
          </select>
        </label>
        {subjectId && byId[subjectId]?.archived_at && (
          <p className="mt-2 rounded-md bg-warning px-3 py-2.5 text-xs text-warning-foreground">
            This saved subject is archived. Choose an active person before saving.
          </p>
        )}
      </section>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">Choose reviewers</h2>
          <div className="mt-3 flex flex-wrap items-end gap-2 border-b border-border pb-4">
            <label className="min-w-[14rem] flex-1 text-sm">
              <span className="sr-only">Search reviewers</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search people…"
                className="field w-full"
              />
            </label>
            <label className="text-sm">
              <span className="sr-only">Department</span>
              <select
                value={departmentId}
                onChange={(event) => setDepartmentId(event.target.value)}
                className="field"
              >
                <option value="">All departments</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </label>
            <Link
              href={`/dashboard/people/import?returnTo=${encodeURIComponent(`/dashboard/campaigns/${campaignId}/reviewers`)}`}
              className="inline-flex h-9 items-center rounded-md border border-input px-3 text-sm font-medium text-foreground hover:bg-surface"
            >
              Import people
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-2 py-3">
            <Button type="button" size="sm" variant="outline" disabled={!subjectId} onClick={() => select(eligible.map((person) => person.id))}>
              Everyone
            </Button>
            <Button type="button" size="sm" variant="outline" disabled={!departmentId} onClick={() => select([...new Set([...reviewerIds, ...eligible.filter((person) => person.department_id === departmentId).map((person) => person.id)])])}>
              This department
            </Button>
            <Button type="button" size="sm" variant="outline" disabled={!filtered.length} onClick={() => select(allFilteredSelected ? reviewerIds.filter((id) => !filtered.some((person) => person.id === id)) : [...new Set([...reviewerIds, ...filtered.map((person) => person.id)])])}>
              {allFilteredSelected ? "Clear shown" : "Select shown"}
            </Button>
            <span className="ml-auto text-xs tabular-nums text-muted-foreground">
              {filtered.length} shown · {eligible.length} eligible
            </span>
          </div>

          <div className="hidden max-h-[42rem] overflow-auto border-t border-border md:block">
            <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="w-10 py-2 pr-2 font-medium">Select</th>
                  <th className="py-2 pr-3 font-medium">Reviewer</th>
                  <th className="py-2 pr-3 font-medium">Department</th>
                  <th className="py-2 pr-3 font-medium">Relationship</th>
                  <th className="py-2 font-medium">Participation</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((person) => {
                  const selected = selectedSet.has(person.id);
                  return (
                    <tr key={person.id} className={`border-b border-border/70 last:border-b-0 hover:bg-foreground/[0.025] ${selected ? "bg-foreground/[0.03]" : ""}`}>
                      <td className="py-3 pr-2 align-middle">
                        <input type="checkbox" checked={selected} onChange={() => toggle(person.id)} aria-label={`Select ${label(person)} as reviewer`} className="h-4 w-4 rounded border-input" />
                      </td>
                      <td className="py-3 pr-3 align-middle">
                        <p className="font-medium text-foreground">{label(person)}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{person.email}</p>
                      </td>
                      <td className="py-3 pr-3 align-middle text-xs text-muted-foreground">
                        {person.department_id ? departmentById[person.department_id] ?? "—" : "—"}
                      </td>
                      <td className="py-3 pr-3 align-middle">
                        {selected ? (
                          <select value={relationships[person.id] ?? "peer"} onChange={(event) => setRelationships((current) => ({ ...current, [person.id]: event.target.value }))} aria-label={`Relationship for ${label(person)}`} className="field text-xs">
                            {RELATIONSHIPS.map((relationship) => <option key={relationship.value} value={relationship.value}>{relationship.label}</option>)}
                          </select>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="py-3 align-middle text-xs text-muted-foreground">{selected ? "Selected" : "Not selected"}</td>
                    </tr>
                  );
                })}
                {!filtered.length && (
                  <tr><td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">{subjectId ? "No people match these filters." : "Choose a subject before selecting reviewers."}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <ul className="divide-y divide-border border-t border-border md:hidden">
            {filtered.map((person) => {
              const selected = selectedSet.has(person.id);
              return (
                <li key={person.id} className={`space-y-3 py-3 ${selected ? "bg-foreground/[0.03]" : ""}`}>
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggle(person.id)}
                      aria-label={`Select ${label(person)} as reviewer`}
                      className="mt-0.5 h-4 w-4 rounded border-input"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{label(person)}</span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">{person.email}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {person.department_id ? departmentById[person.department_id] ?? "—" : "No department"}
                      </span>
                    </span>
                  </label>
                  {selected && (
                    <label className="ml-7 block text-xs text-muted-foreground">
                      Relationship
                      <select
                        value={relationships[person.id] ?? "peer"}
                        onChange={(event) => setRelationships((current) => ({ ...current, [person.id]: event.target.value }))}
                        aria-label={`Relationship for ${label(person)}`}
                        className="field mt-1 w-full text-xs"
                      >
                        {RELATIONSHIPS.map((relationship) => <option key={relationship.value} value={relationship.value}>{relationship.label}</option>)}
                      </select>
                    </label>
                  )}
                </li>
              );
            })}
            {!filtered.length && <li className="py-8 text-center text-sm text-muted-foreground">{subjectId ? "No people match these filters." : "Choose a subject before selecting reviewers."}</li>}
          </ul>
        </section>

        <aside className="min-w-0 xl:sticky xl:top-20 xl:self-start">
          <div className="border-t border-border pt-4 xl:border-t-0 xl:border-l xl:pl-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Selection summary</p>
            <p className="mt-2 text-2xl font-medium tracking-tight text-foreground">{byId[subjectId] ? label(byId[subjectId]) : "No subject"}</p>
            <dl className="mt-4 divide-y divide-border border-y border-border text-sm">
              <div className="flex justify-between gap-3 py-2.5"><dt className="text-muted-foreground">Reviewers selected</dt><dd className="font-medium tabular-nums">{selectedReviewers.length}</dd></div>
              <div className="flex justify-between gap-3 py-2.5"><dt className="text-muted-foreground">Minimum required</dt><dd className="font-medium tabular-nums">5</dd></div>
            </dl>
            <p className={`mt-4 text-sm ${validReviewerCount >= 5 ? "text-primary" : "text-muted-foreground"}`}>
              {validReviewerCount >= 5 ? "Minimum reviewer requirement met ✓" : `${validReviewerCount} of 5 minimum reviewers selected`}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              At least five completed reviewer responses are required before results can be shown.
            </p>
            <div className="mt-4 max-h-[28rem] space-y-2 overflow-y-auto">
              {selectedReviewers.map((person) => (
                <div key={person.id} className="flex items-start justify-between gap-2 border-b border-border/70 pb-2.5 last:border-0">
                  <div className="min-w-0"><p className="truncate text-sm font-medium text-foreground">{label(person)}</p><p className="mt-0.5 text-xs text-muted-foreground">{person.archived_at ? "Archived" : RELATIONSHIPS.find((item) => item.value === relationships[person.id])?.label ?? "Peer"}</p></div>
                  <button type="button" className="text-xs text-muted-foreground hover:text-destructive" onClick={() => toggle(person.id)}>Remove</button>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2 border-t border-border pt-5">
        <Button type="button" disabled={pending} onClick={save}>{pending ? "Saving…" : `Save ${selectedReviewers.length} reviewers`}</Button>
        <Button type="button" variant="ghost" disabled={pending} onClick={confirmCancel}>Cancel</Button>
      </div>
    </div>
  );
}
