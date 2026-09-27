"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { saveSubjectsAndAssignments } from "../../actions";
import type { PickerDepartment, PickerPerson } from "../../people-picker";

type PersonRow = PickerPerson & { archived_at: string | null };
type SubjectRow = { personId: string; managerPersonId: string | null };

function label(person: PersonRow): string {
  return person.full_name?.trim() || person.email;
}

export default function PeopleWorkspace({
  campaignId,
  campaignName,
  people,
  departments,
  flash,
  initialSubjects,
}: {
  campaignId: string;
  campaignName: string;
  people: PersonRow[];
  departments: PickerDepartment[];
  flash?: { error?: string; ok?: string };
  initialSubjects: SubjectRow[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [selectedIds, setSelectedIds] = useState(
    initialSubjects.map((subject) => subject.personId),
  );
  const [managers, setManagers] = useState<Record<string, string | null>>(
    Object.fromEntries(
      initialSubjects.map((subject) => [
        subject.personId,
        subject.managerPersonId,
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
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const available = useMemo(
    () => people.filter((person) => !person.archived_at),
    [people],
  );
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return available.filter((person) => {
      if (departmentId && person.department_id !== departmentId) return false;
      if (!needle) return true;
      return [person.full_name ?? "", person.email, label(person)]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [available, departmentId, query]);
  const selectedPeople = selectedIds
    .map((id) => byId[id])
    .filter(Boolean) as PersonRow[];
  const managerCount = selectedPeople.filter((person) =>
    Boolean(resolveManager(person.id)),
  ).length;
  const selfOnlyCount = selectedPeople.length - managerCount;
  const initialState = JSON.stringify(
    initialSubjects
      .map((subject) => [subject.personId, subject.managerPersonId])
      .sort(),
  );
  const currentState = JSON.stringify(
    selectedIds
      .map((id) => [id, resolveManager(id)])
      .sort(),
  );
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

  function resolveManager(personId: string): PersonRow | null {
    const person = byId[personId];
    const managerId =
      personId in managers ? managers[personId] : person?.manager_person_id;
    const manager = managerId ? byId[managerId] : undefined;
    return manager && !manager.archived_at ? manager : null;
  }

  function select(ids: string[]) {
    setSelectedIds(ids);
    setManagers((current) => {
      const next = { ...current };
      for (const id of ids) {
        if (!(id in next)) next[id] = byId[id]?.manager_person_id ?? null;
      }
      return next;
    });
  }

  function toggle(id: string) {
    select(
      selectedSet.has(id)
        ? selectedIds.filter((selectedId) => selectedId !== id)
        : [...selectedIds, id],
    );
  }

  function confirmCancel() {
    if (dirty && !window.confirm("Discard unsaved people changes?")) return;
    router.push(`/dashboard/campaigns/${campaignId}`);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveSubjectsAndAssignments(
        campaignId,
        selectedIds.map((personId) => ({
          personId,
          selfPersonId: personId,
          managerPersonId: resolveManager(personId)?.id ?? null,
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
            Annual appraisal
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">
            Choose people
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Select the employees who should take part in this appraisal. Their
            saved campaign pairing remains separate from their default manager.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={confirmCancel}>
          Cancel
        </Button>
      </header>

      {flash?.error && <p role="alert" className="text-sm text-destructive">{flash.error}</p>}
      {flash?.ok && <p role="status" className="text-sm text-foreground">{flash.ok}</p>}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="min-w-0">
          <div className="flex flex-wrap items-end gap-2 border-b border-border pb-4">
            <label className="min-w-[14rem] flex-1 text-sm">
              <span className="sr-only">Search people</span>
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
              href={`/dashboard/people/import?returnTo=${encodeURIComponent(`/dashboard/campaigns/${campaignId}/people`)}`}
              className="inline-flex h-9 items-center rounded-md border border-input px-3 text-sm font-medium text-foreground hover:bg-surface"
            >
              Import people
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2 py-3">
            <Button type="button" size="sm" variant="outline" onClick={() => select(available.map((person) => person.id))}>
              Everyone
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!departmentId}
              onClick={() =>
                select([
                  ...new Set([
                    ...selectedIds,
                    ...available
                      .filter((person) => person.department_id === departmentId)
                      .map((person) => person.id),
                  ]),
                ])
              }
            >
              This department
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!filtered.length}
              onClick={() =>
                select(
                  allFilteredSelected
                    ? selectedIds.filter(
                        (id) => !filtered.some((person) => person.id === id),
                      )
                    : [...new Set([...selectedIds, ...filtered.map((person) => person.id)])],
                )
              }
            >
              {allFilteredSelected ? "Clear shown" : "Select shown"}
            </Button>
            <span className="ml-auto text-xs tabular-nums text-muted-foreground">
              {filtered.length} shown · {available.length} available
            </span>
          </div>

          <div className="hidden max-h-[42rem] overflow-auto border-t border-border md:block">
            <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="w-10 py-2 pr-2 font-medium">Select</th>
                  <th className="py-2 pr-3 font-medium">Employee</th>
                  <th className="py-2 pr-3 font-medium">Department</th>
                  <th className="py-2 pr-3 font-medium">Manager</th>
                  <th className="py-2 font-medium">Participation</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((person) => {
                  const selected = selectedSet.has(person.id);
                  const manager = resolveManager(person.id);
                  return (
                    <tr
                      key={person.id}
                      className={`border-b border-border/70 last:border-b-0 hover:bg-foreground/[0.025] ${selected ? "bg-foreground/[0.03]" : ""}`}
                    >
                      <td className="py-3 pr-2 align-middle">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggle(person.id)}
                          aria-label={`Select ${label(person)}`}
                          className="h-4 w-4 rounded border-input"
                        />
                      </td>
                      <td className="py-3 pr-3 align-middle">
                        <p className="font-medium text-foreground">{label(person)}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{person.email}</p>
                      </td>
                      <td className="py-3 pr-3 align-middle text-xs text-muted-foreground">
                        {person.department_id ? departmentById[person.department_id] ?? "—" : "—"}
                      </td>
                      <td className="py-3 pr-3 align-middle text-xs text-muted-foreground">
                        {manager ? label(manager) : "Not assigned"}
                      </td>
                      <td className="py-3 align-middle text-xs text-muted-foreground">
                        {selected ? "Selected" : "Not selected"}
                      </td>
                    </tr>
                  );
                })}
                {!filtered.length && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                      No people match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <ul className="divide-y divide-border border-t border-border md:hidden">
            {filtered.map((person) => {
              const selected = selectedSet.has(person.id);
              const manager = resolveManager(person.id);
              return (
                <li key={person.id} className={`space-y-3 py-3 ${selected ? "bg-foreground/[0.03]" : ""}`}>
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggle(person.id)}
                      aria-label={`Select ${label(person)}`}
                      className="mt-0.5 h-4 w-4 rounded border-input"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{label(person)}</span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">{person.email}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {person.department_id ? departmentById[person.department_id] ?? "—" : "No department"}
                        {" · "}
                        {manager ? `Manager: ${label(manager)}` : "Self-only"}
                      </span>
                    </span>
                  </label>
                  {selected && (
                    <label className="ml-7 block text-xs text-muted-foreground">
                      Campaign manager
                      <select
                        value={managers[person.id] ?? ""}
                        onChange={(event) => setManagers((current) => ({ ...current, [person.id]: event.target.value || null }))}
                        className="field mt-1 w-full text-xs"
                      >
                        <option value="">Not assigned</option>
                        {available.filter((managerPerson) => managerPerson.id !== person.id).map((managerPerson) => (
                          <option key={managerPerson.id} value={managerPerson.id}>{label(managerPerson)}</option>
                        ))}
                      </select>
                    </label>
                  )}
                </li>
              );
            })}
            {!filtered.length && <li className="py-8 text-center text-sm text-muted-foreground">No people match these filters.</li>}
          </ul>
        </section>

        <aside className="min-w-0 xl:sticky xl:top-20 xl:self-start">
          <div className="border-t border-border pt-4 xl:border-t-0 xl:border-l xl:pl-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Selection summary
            </p>
            <p className="mt-2 text-2xl font-medium tabular-nums tracking-tight text-foreground">
              {selectedPeople.length} employees
            </p>
            <dl className="mt-4 divide-y divide-border border-y border-border text-sm">
              <div className="flex justify-between gap-3 py-2.5">
                <dt className="text-muted-foreground">Self appraisals</dt>
                <dd className="font-medium tabular-nums">{selectedPeople.length}</dd>
              </div>
              <div className="flex justify-between gap-3 py-2.5">
                <dt className="text-muted-foreground">Manager reviews</dt>
                <dd className="font-medium tabular-nums">{managerCount}</dd>
              </div>
              <div className="flex justify-between gap-3 py-2.5">
                <dt className="text-muted-foreground">Self-only</dt>
                <dd className="font-medium tabular-nums">{selfOnlyCount}</dd>
              </div>
            </dl>
            {selfOnlyCount > 0 && (
              <p className="mt-4 rounded-md bg-warning px-3 py-2.5 text-xs leading-relaxed text-warning-foreground">
                {selfOnlyCount} selected{" "}
                {selfOnlyCount === 1 ? "employee has" : "employees have"} no
                manager. They will receive a self-appraisal only.
              </p>
            )}
            <div className="mt-4 max-h-[28rem] space-y-2 overflow-y-auto">
              {selectedPeople.map((person) => (
                <div key={person.id} className="border-b border-border/70 pb-3 last:border-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{label(person)}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {person.archived_at ? "Archived" : resolveManager(person.id) ? `Manager: ${label(resolveManager(person.id)!)}` : "Self-only"}
                      </p>
                    </div>
                    <button type="button" className="text-xs text-muted-foreground hover:text-destructive" onClick={() => toggle(person.id)}>
                      Remove
                    </button>
                  </div>
                  <label className="mt-2 block text-xs text-muted-foreground">
                    Campaign manager
                    <select
                      value={managers[person.id] ?? ""}
                      onChange={(event) => setManagers((current) => ({ ...current, [person.id]: event.target.value || null }))}
                      disabled={Boolean(person.archived_at)}
                      className="field mt-1 w-full text-xs"
                    >
                      <option value="">Not assigned</option>
                      {available
                        .filter((manager) => manager.id !== person.id)
                        .map((manager) => (
                          <option key={manager.id} value={manager.id}>
                            {label(manager)}
                          </option>
                        ))}
                    </select>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2 border-t border-border pt-5">
        <Button type="button" disabled={pending} onClick={save}>
          {pending ? "Saving…" : `Save ${selectedPeople.length} people`}
        </Button>
        <Button type="button" variant="ghost" disabled={pending} onClick={confirmCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
