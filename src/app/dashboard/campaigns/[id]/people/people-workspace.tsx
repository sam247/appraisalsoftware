"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { importPeopleCsv } from "../../../people/actions";
import { saveSubjectsAndAssignments } from "../../actions";
import type { PickerDepartment, PickerPerson } from "../../people-picker";

type PersonRow = PickerPerson & { archived_at: string | null };
type SubjectRow = { personId: string; managerPersonId: string | null };

function label(person: PersonRow): string {
  return person.full_name?.trim() || person.email;
}

function ImportPeopleDialog({
  campaignId,
  open,
  onOpenChange,
}: {
  campaignId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const returnTo = `/dashboard/campaigns/${campaignId}/people`;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setFile(null);
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import people</DialogTitle>
          <DialogDescription>
            Add people to your workspace. They&apos;ll be available for this and
            future appraisals.
          </DialogDescription>
        </DialogHeader>
        <form action={importPeopleCsv} encType="multipart/form-data">
          <input type="hidden" name="return_to" value={returnTo} />
          <label className="block text-sm font-medium">
            Upload a CSV file
            <input
              aria-label="People CSV file"
              name="file"
              type="file"
              accept=".csv,text/csv"
              required
              onChange={(event) =>
                setFile(event.target.files?.[0] ?? null)
              }
              className="mt-2 w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-surface file:px-3 file:py-2 file:text-sm"
            />
          </label>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Required column: <span className="font-medium text-foreground">email</span>.
            Optional columns: full_name, job_title and department. Existing
            emails are skipped.
          </p>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!file}>
              Import people
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
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
  const [importOpen, setImportOpen] = useState(false);

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
    return people.filter((person) => !person.archived_at || selectedSet.has(person.id)).filter((person) => {
      if (departmentId && person.department_id !== departmentId) return false;
      if (!needle) return true;
      return [person.full_name ?? "", person.email, label(person)]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [people, selectedSet, departmentId, query]);
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
    <div data-focused-workspace className="dashboard-workspace people-workspace space-y-4 pb-4">
      <header className="task-header">
        <div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1"><Link
            href={`/dashboard/campaigns/${campaignId}`}
            onClick={(event) => {
              event.preventDefault();
              confirmCancel();
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← {campaignName}
          </Link>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Annual appraisal · Participants
          </p></div>
          <h1 className="mt-1 font-display text-[22px] md:text-[24px] font-semibold tracking-tight">
            Choose people
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Select employees and set campaign managers here. Default managers in People stay unchanged.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={confirmCancel}>
          Finish later
        </Button>
      </header>

      {flash?.error && <p role="alert" className="text-sm text-destructive">{flash.error}</p>}
      {flash?.ok && <p role="status" className="text-sm text-foreground">{flash.ok}</p>}

      <div className="space-y-3">
        <section className="min-w-0">
          <div className="directory-toolbar">
            <label className="min-w-0 w-full text-sm sm:max-w-sm">
              <span className="sr-only">Search people</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search people…"
                className="field w-full"
              />
            </label>
            <label className="w-full text-sm sm:w-48 xl:w-52">
              <span className="sr-only">Department</span>
              <select
                value={departmentId}
                onChange={(event) => setDepartmentId(event.target.value)}
                className="field w-full"
              >
                <option value="">All departments</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </label>
            <Button type="button" variant="outline" onClick={() => setImportOpen(true)}>
              Import people
            </Button>
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

          <div className="directory-table participant-table overflow-auto">
            <table className="w-full min-w-[900px] table-fixed text-left text-sm" aria-label="Campaign participants">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th scope="col" className="w-12"><input type="checkbox" aria-label="Select all shown employees" checked={allFilteredSelected} disabled={!filtered.length} onChange={() => select(allFilteredSelected ? selectedIds.filter((id) => !filtered.some((person) => person.id === id)) : [...new Set([...selectedIds, ...filtered.map((person) => person.id)])])} className="size-4" /></th>
                  <th scope="col" className="w-[20%]">Employee</th>
                  <th scope="col" className="w-[25%]">Email</th>
                  <th scope="col" className="w-[15%]">Department</th>
                  <th scope="col" className="w-[25%]">Campaign manager</th>
                  <th scope="col">Review</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((person) => {
                  const selected = selectedSet.has(person.id);
                  const manager = resolveManager(person.id);
                  return <tr key={person.id} className={selected ? "bg-primary/5" : ""}>
                    <td><input type="checkbox" checked={selected} onChange={() => toggle(person.id)} aria-label={`Select ${label(person)}`} className="size-4" /></td>
                    <td className="truncate font-medium" title={label(person)}>{label(person)}{person.archived_at && <span className="ml-2 text-xs font-normal text-muted-foreground">Archived</span>}</td>
                    <td className="truncate text-muted-foreground" title={person.email}>{person.email}</td>
                    <td className="truncate text-muted-foreground">{person.department_id ? departmentById[person.department_id] ?? "—" : "—"}</td>
                    <td><select aria-label={`Campaign manager for ${label(person)}`} value={manager?.id ?? ""} disabled={!selected || !!person.archived_at || pending} onChange={(event) => setManagers((current) => ({ ...current, [person.id]: event.target.value || null }))} className="field w-full text-sm disabled:opacity-50">
                      <option value="">No manager · self-only</option>
                      {available.filter((candidate) => candidate.id !== person.id).map((candidate) => <option key={candidate.id} value={candidate.id}>{label(candidate)}</option>)}
                    </select></td>
                    <td className="text-xs text-muted-foreground">{selected ? manager ? "Self + manager" : "Self-only" : "—"}</td>
                  </tr>;
                })}
                {!filtered.length && <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No people match these filters.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
        <div className="participant-summary flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground" aria-live="polite">
          <span className="font-medium text-foreground">{selectedPeople.length} selected</span>
          <span>{selectedPeople.length} self appraisals</span>
          <span>{managerCount} manager reviews</span>
          <span>{selfOnlyCount} self-only</span>
          <span>Employees without a manager receive a self-appraisal only.</span>
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2 border-t border-border pt-5">
        <Button
          type="button"
          disabled={pending || selectedPeople.length === 0}
          onClick={save}
        >
          {pending
            ? "Saving…"
            : `Save ${selectedPeople.length} ${selectedPeople.length === 1 ? "person" : "people"}`}
        </Button>
        <Button type="button" variant="ghost" disabled={pending} onClick={confirmCancel}>
          Cancel
        </Button>
      </div>
      <ImportPeopleDialog
        campaignId={campaignId}
        open={importOpen}
        onOpenChange={setImportOpen}
      />
    </div>
  );
}
