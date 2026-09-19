"use client";

import FormSubmit from "@/app/dashboard/form-submit";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { parsePeopleCsv, type PeopleCsvRow } from "@/lib/people/csv";
import type { Person } from "@/lib/types/database";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  archivePerson,
  createPerson,
  importPeopleCsv,
  unarchivePerson,
  updatePerson,
} from "./actions";

export type PeopleDirectoryPerson = Pick<
  Person,
  | "id"
  | "email"
  | "full_name"
  | "job_title"
  | "manager_person_id"
  | "archived_at"
>;

type StatusFilter = "active" | "archived" | "all";

type ImportPreview = {
  ready: PeopleCsvRow[];
  existing: number;
  attention: string[];
};

function displayName(person: PeopleDirectoryPerson): string {
  return person.full_name?.trim() || person.email;
}

function managerLabel(
  managerId: string | null,
  byId: Record<string, PeopleDirectoryPerson>,
): string {
  if (!managerId) return "";
  const manager = byId[managerId];
  return manager ? displayName(manager) : "";
}

function fieldClassName() {
  return "mt-1.5 w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
}

export default function PeopleDirectory({
  people,
  flash,
}: {
  people: PeopleDirectoryPerson[];
  flash?: { error?: string; ok?: string };
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("active");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<PeopleDirectoryPerson | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(
    null,
  );
  const [importError, setImportError] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isImporting, startImport] = useTransition();

  const byId = useMemo(
    () => Object.fromEntries(people.map((p) => [p.id, p])),
    [people],
  );

  const activePeople = useMemo(
    () => people.filter((p) => !p.archived_at),
    [people],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return people
      .filter((p) => {
        if (status === "active" && p.archived_at) return false;
        if (status === "archived" && !p.archived_at) return false;
        if (!q) return true;
          const hay = [
          p.full_name ?? "",
          p.email,
          p.job_title ?? "",
          managerLabel(p.manager_person_id, byId),
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) =>
        displayName(a).localeCompare(displayName(b), undefined, {
          sensitivity: "base",
        }),
      );
  }, [people, status, query, byId]);

  const visibleIds = filtered.map((p) => p.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        for (const id of visibleIds) next.delete(id);
      } else {
        for (const id of visibleIds) next.add(id);
      }
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onPickCsv = async (file: File | null) => {
    setImportError(null);
    setImportPreview(null);
    setPendingFile(file);
    if (!file) return;
    if (file.size > 1_000_000) {
      setImportError("CSV must be under 1MB");
      return;
    }
    const text = await file.text();
    const { rows, errors } = parsePeopleCsv(text);
    if (!rows.length && errors.length) {
      setImportError(errors[0] ?? "No valid rows found");
      return;
    }
    const existingEmails = new Set(
      activePeople.map((p) => p.email.trim().toLowerCase()),
    );
    const ready = rows.filter((r) => !existingEmails.has(r.email));
    const existing = rows.length - ready.length;
    setImportPreview({
      ready,
      existing,
      attention: errors,
    });
  };

  const confirmImport = () => {
    if (!pendingFile || !importPreview?.ready.length) return;
    const data = new FormData();
    data.set("file", pendingFile);
    startImport(async () => {
      await importPeopleCsv(data);
    });
  };

  const empty = people.length === 0;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-medium tracking-tight text-foreground">
            People
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Employees and reviewers for appraisal campaigns.
          </p>
        </div>
        {!empty && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setImportOpen(true);
                setImportPreview(null);
                setImportError(null);
                setPendingFile(null);
              }}
            >
              Import
            </Button>
            <Button type="button" size="sm" onClick={() => setAddOpen(true)}>
              + Add person
            </Button>
          </div>
        )}
      </div>

      {flash?.error && (
        <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {flash.error}
        </div>
      )}
      {flash?.ok && (
        <div className="mt-3 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground">
          {flash.ok}
        </div>
      )}

      {empty ? (
        <div className="mt-10 max-w-md">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Add your first person or import a CSV to get started.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" onClick={() => setAddOpen(true)}>
              + Add person
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setImportOpen(true)}
            >
              Import CSV
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="people-search">
              Search people
            </label>
            <input
              id="people-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people…"
              className="min-w-[14rem] flex-1 rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <label className="sr-only" htmlFor="people-status">
              Status filter
            </label>
            <select
              id="people-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
              className="rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="all">All people</option>
            </select>
            <p className="text-xs text-muted-foreground tabular-nums">
              {filtered.length}{" "}
              {filtered.length === 1 ? "person" : "people"}
            </p>
          </div>

          {selected.size > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-border/80 bg-card/60 px-3 py-2 text-sm">
              <span className="text-muted-foreground">
                {selected.size} selected
              </span>
              <Link
                href="/dashboard/campaigns/new"
                className="font-medium text-primary hover:underline"
              >
                Create appraisal
              </Link>
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setSelected(new Set())}
              >
                Clear
              </button>
            </div>
          )}

          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="w-10 py-2.5 pr-2 font-medium">
                    <input
                      type="checkbox"
                      aria-label="Select all visible people"
                      checked={allVisibleSelected}
                      onChange={toggleAll}
                      className="h-4 w-4 rounded border-input"
                    />
                  </th>
                  <th className="py-2.5 pr-3 font-medium">Name</th>
                  <th className="hidden py-2.5 pr-3 font-medium sm:table-cell">
                    Email
                  </th>
                  <th className="hidden py-2.5 pr-3 font-medium md:table-cell">
                    Job title
                  </th>
                  <th className="hidden py-2.5 pr-3 font-medium lg:table-cell">
                    Manager
                  </th>
                  <th className="py-2.5 pr-3 font-medium">Status</th>
                  <th className="w-10 py-2.5 font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No people match this search.
                    </td>
                  </tr>
                ) : (
                  filtered.map((person) => {
                    const manager = person.manager_person_id
                      ? byId[person.manager_person_id]
                      : null;
                    const archived = Boolean(person.archived_at);
                    return (
                      <tr
                        key={person.id}
                        className="group border-b border-border/70 last:border-b-0 hover:bg-card/70"
                      >
                        <td className="py-3 pr-2 align-middle">
                          <input
                            type="checkbox"
                            aria-label={`Select ${displayName(person)}`}
                            checked={selected.has(person.id)}
                            onChange={() => toggleOne(person.id)}
                            className="h-4 w-4 rounded border-input"
                          />
                        </td>
                        <td className="py-3 pr-3 align-middle">
                          <button
                            type="button"
                            className="text-left font-medium text-foreground hover:underline"
                            onClick={() => setEditing(person)}
                          >
                            {displayName(person)}
                          </button>
                          <p className="mt-0.5 text-xs text-muted-foreground sm:hidden">
                            {person.email}
                          </p>
                        </td>
                        <td className="hidden py-3 pr-3 align-middle text-muted-foreground sm:table-cell">
                          {person.email}
                        </td>
                        <td className="hidden py-3 pr-3 align-middle text-muted-foreground md:table-cell">
                          {person.job_title?.trim() || "—"}
                        </td>
                        <td className="hidden py-3 pr-3 align-middle text-muted-foreground lg:table-cell">
                          {manager ? displayName(manager) : "—"}
                        </td>
                        <td className="py-3 pr-3 align-middle">
                          <span
                            className={cn(
                              "text-xs",
                              archived
                                ? "text-muted-foreground"
                                : "text-foreground/80",
                            )}
                          >
                            {archived ? "Archived" : "Active"}
                          </span>
                        </td>
                        <td className="relative py-3 align-middle text-right">
                          <button
                            type="button"
                            aria-label={`Actions for ${displayName(person)}`}
                            aria-expanded={menuFor === person.id}
                            className="rounded-md px-2 py-1 text-muted-foreground hover:bg-surface hover:text-foreground"
                            onClick={() =>
                              setMenuFor((id) =>
                                id === person.id ? null : person.id,
                              )
                            }
                          >
                            ···
                          </button>
                          {menuFor === person.id && (
                            <div className="absolute right-0 z-20 mt-1 w-40 rounded-lg border border-border bg-card py-1 shadow-md">
                              <button
                                type="button"
                                className="block w-full px-3 py-2 text-left text-sm hover:bg-surface"
                                onClick={() => {
                                  setEditing(person);
                                  setMenuFor(null);
                                }}
                              >
                                Edit
                              </button>
                              {archived ? (
                                <form
                                  action={unarchivePerson.bind(null, person.id)}
                                >
                                  <button
                                    type="submit"
                                    className="block w-full px-3 py-2 text-left text-sm hover:bg-surface"
                                  >
                                    Restore
                                  </button>
                                </form>
                              ) : (
                                <form
                                  action={archivePerson.bind(null, person.id)}
                                >
                                  <button
                                    type="submit"
                                    className="block w-full px-3 py-2 text-left text-sm text-destructive hover:bg-surface"
                                  >
                                    Archive
                                  </button>
                                </form>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <AddPersonSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        managers={activePeople}
      />

      <EditPersonSheet
        person={editing}
        managers={activePeople}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      />

      <Sheet open={importOpen} onOpenChange={setImportOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 overflow-y-auto bg-card sm:max-w-md"
        >
          <SheetHeader className="text-left">
            <SheetTitle>Import people</SheetTitle>
            <SheetDescription>
              Columns: <span className="font-medium text-foreground">email</span>{" "}
              (required), full_name, job_title. Existing emails are skipped.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <input
              aria-label="People CSV file"
              type="file"
              accept=".csv,text/csv"
              className="w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-surface file:px-3 file:py-2 file:text-sm"
              onChange={(e) => onPickCsv(e.target.files?.[0] ?? null)}
            />

            {importError && (
              <p className="text-sm text-destructive" role="alert">
                {importError}
              </p>
            )}

            {importPreview && (
              <div className="rounded-xl border border-border bg-surface/60 px-4 py-3 text-sm">
                <p className="font-medium text-foreground">
                  {importPreview.ready.length} ready to import
                </p>
                <p className="mt-1 text-muted-foreground">
                  {importPreview.existing} already exist
                  {importPreview.attention.length
                    ? ` · ${importPreview.attention.length} need attention`
                    : ""}
                </p>
                {importPreview.attention.length > 0 && (
                  <ul className="mt-2 max-h-28 space-y-1 overflow-y-auto text-xs text-muted-foreground">
                    {importPreview.attention.slice(0, 8).map((msg) => (
                      <li key={msg}>{msg}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <SheetFooter className="mt-auto gap-2 pt-8 sm:justify-start">
            <Button
              type="button"
              disabled={
                isImporting || !importPreview || importPreview.ready.length === 0
              }
              onClick={confirmImport}
            >
              {isImporting
                ? "Importing…"
                : importPreview
                  ? `Import ${importPreview.ready.length}`
                  : "Import"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setImportOpen(false)}
            >
              Cancel
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function AddPersonSheet({
  open,
  onOpenChange,
  managers,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  managers: PeopleDirectoryPerson[];
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col overflow-y-auto bg-card sm:max-w-md"
      >
        <SheetHeader className="text-left">
          <SheetTitle>Add person</SheetTitle>
          <SheetDescription>
            Add someone who can take part in appraisals or 360 feedback.
          </SheetDescription>
        </SheetHeader>
        <form action={createPerson} className="mt-6 flex flex-1 flex-col gap-4">
          <PersonFields managers={managers} />
          <SheetFooter className="mt-auto gap-2 pt-4 sm:justify-start">
            <FormSubmit>Add person</FormSubmit>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function EditPersonSheet({
  person,
  managers,
  onOpenChange,
}: {
  person: PeopleDirectoryPerson | null;
  managers: PeopleDirectoryPerson[];
  onOpenChange: (open: boolean) => void;
}) {
  if (!person) return null;
  const archived = Boolean(person.archived_at);

  return (
    <Sheet open={Boolean(person)} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col overflow-y-auto bg-card sm:max-w-md"
      >
        <SheetHeader className="text-left">
          <SheetTitle>{displayName(person)}</SheetTitle>
          <SheetDescription>{person.email}</SheetDescription>
        </SheetHeader>

        <form
          action={updatePerson.bind(null, person.id)}
          className="mt-6 flex flex-1 flex-col gap-4"
        >
          <PersonFields
            managers={managers.filter((m) => m.id !== person.id)}
            defaults={{
              full_name: person.full_name ?? "",
              job_title: person.job_title ?? "",
              manager_person_id: person.manager_person_id ?? "",
            }}
            hideEmail
          />
          <p className="text-xs text-muted-foreground">
            Email can&apos;t be changed here. Archive and re-add if the address
            needs updating.
          </p>
          <SheetFooter className="mt-auto flex-col gap-2 pt-4 sm:flex-col sm:space-x-0">
            <FormSubmit className="w-full">Save changes</FormSubmit>
            {archived ? (
              <FormSubmit
                formAction={unarchivePerson.bind(null, person.id)}
                variant="outline"
                className="w-full"
              >
                Restore person
              </FormSubmit>
            ) : (
              <FormSubmit
                formAction={archivePerson.bind(null, person.id)}
                variant="outline"
                className="w-full"
              >
                Archive person
              </FormSubmit>
            )}
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function PersonFields({
  managers,
  defaults,
  hideEmail = false,
}: {
  managers: PeopleDirectoryPerson[];
  defaults?: {
    full_name?: string;
    job_title?: string;
    manager_person_id?: string;
  };
  hideEmail?: boolean;
}) {
  return (
    <>
      <label className="block text-sm">
        <span className="font-medium text-foreground">Full name</span>
        <input
          name="full_name"
          type="text"
          defaultValue={defaults?.full_name ?? ""}
          autoComplete="name"
          className={fieldClassName()}
        />
      </label>
      {!hideEmail && (
        <label className="block text-sm">
          <span className="font-medium text-foreground">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className={fieldClassName()}
          />
        </label>
      )}
      <label className="block text-sm">
        <span className="font-medium text-foreground">Job title</span>
        <input
          name="job_title"
          type="text"
          defaultValue={defaults?.job_title ?? ""}
          className={fieldClassName()}
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium text-foreground">Manager</span>
        <select
          name="manager_person_id"
          defaultValue={defaults?.manager_person_id ?? ""}
          className={fieldClassName()}
        >
          <option value="">No default manager</option>
          {managers.map((m) => (
            <option key={m.id} value={m.id}>
              {displayName(m)}
            </option>
          ))}
        </select>
        <span className="mt-1.5 block text-xs text-muted-foreground">
          Used to pre-fill annual appraisals. Campaigns can still override this.
        </span>
      </label>
    </>
  );
}
