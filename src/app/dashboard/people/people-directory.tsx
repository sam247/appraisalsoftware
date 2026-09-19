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
import type { Department, Person } from "@/lib/types/database";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  archivePerson,
  createDepartment,
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
  | "department_id"
  | "archived_at"
>;

export type PeopleDirectoryDepartment = Pick<Department, "id" | "name">;

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
  departments: initialDepartments,
  flash,
}: {
  people: PeopleDirectoryPerson[];
  departments: PeopleDirectoryDepartment[];
  flash?: { error?: string; ok?: string };
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("active");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [extraDepartments, setExtraDepartments] = useState<
    PeopleDirectoryDepartment[]
  >([]);
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

  const departments = useMemo(() => {
    const map = new Map(
      initialDepartments.map((d) => [d.id, d] as const),
    );
    for (const d of extraDepartments) map.set(d.id, d);
    return [...map.values()].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );
  }, [initialDepartments, extraDepartments]);

  const rememberDepartment = (dept: PeopleDirectoryDepartment) => {
    setExtraDepartments((prev) =>
      prev.some((d) => d.id === dept.id) ? prev : [...prev, dept],
    );
  };

  const byId = useMemo(
    () => Object.fromEntries(people.map((p) => [p.id, p])),
    [people],
  );
  const deptById = useMemo(
    () => Object.fromEntries(departments.map((d) => [d.id, d])),
    [departments],
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
        if (departmentFilter === "none" && p.department_id) return false;
        if (
          departmentFilter !== "all" &&
          departmentFilter !== "none" &&
          p.department_id !== departmentFilter
        )
          return false;
        if (!q) return true;
        const deptName = p.department_id
          ? (deptById[p.department_id]?.name ?? "")
          : "";
        const hay = [
          p.full_name ?? "",
          p.email,
          p.job_title ?? "",
          managerLabel(p.manager_person_id, byId),
          deptName,
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
  }, [people, status, query, byId, departmentFilter, deptById]);

  const visibleIds = filtered.map((p) => p.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const hasSelection = selected.size > 0;

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
    setImportPreview({ ready, existing, attention: errors });
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
          {/* Stable-height control strip — selection reuses this row */}
          <div className="mt-5 flex min-h-10 flex-wrap items-center gap-2">
            {hasSelection ? (
              <>
                <p className="text-sm font-medium text-foreground tabular-nums">
                  {selected.size} selected
                </p>
                <Link
                  href="/dashboard/campaigns/new"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Create appraisal
                </Link>
                <button
                  type="button"
                  className="text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setSelected(new Set())}
                >
                  Clear
                </button>
              </>
            ) : (
              <>
                <label className="sr-only" htmlFor="people-search">
                  Search people
                </label>
                <input
                  id="people-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search people…"
                  className="min-w-[12rem] flex-1 rounded-lg border border-input bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <label className="sr-only" htmlFor="people-department">
                  Department filter
                </label>
                <select
                  id="people-department"
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="rounded-lg border border-input bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="all">All departments</option>
                  <option value="none">No department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <label className="sr-only" htmlFor="people-status">
                  Status filter
                </label>
                <select
                  id="people-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusFilter)}
                  className="rounded-lg border border-input bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                  <option value="all">All people</option>
                </select>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {filtered.length}{" "}
                  {filtered.length === 1 ? "person" : "people"}
                </p>
              </>
            )}
          </div>

          <div className="mt-2">
            <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="w-10 py-2 pr-2 font-medium">
                    <input
                      type="checkbox"
                      aria-label="Select all visible people"
                      checked={allVisibleSelected}
                      onChange={toggleAll}
                      className="h-4 w-4 rounded border-input"
                    />
                  </th>
                  <th className="py-2 pr-3 font-medium">Name</th>
                  <th className="hidden py-2 pr-3 font-medium sm:table-cell">
                    Email
                  </th>
                  <th className="hidden py-2 pr-3 font-medium xl:table-cell">
                    Job title
                  </th>
                  <th className="hidden py-2 pr-3 font-medium md:table-cell">
                    Department
                  </th>
                  <th className="hidden py-2 pr-3 font-medium lg:table-cell">
                    Manager
                  </th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pl-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      No people match this search.
                    </td>
                  </tr>
                ) : (
                  filtered.map((person) => {
                    const manager = person.manager_person_id
                      ? byId[person.manager_person_id]
                      : null;
                    const department = person.department_id
                      ? deptById[person.department_id]
                      : null;
                    const archived = Boolean(person.archived_at);
                    return (
                      <tr
                        key={person.id}
                        className="group border-b border-border/70 last:border-b-0 hover:bg-card/70"
                      >
                        <td className="py-2 pr-2 align-middle">
                          <input
                            type="checkbox"
                            aria-label={`Select ${displayName(person)}`}
                            checked={selected.has(person.id)}
                            onChange={() => toggleOne(person.id)}
                            className="h-4 w-4 rounded border-input"
                          />
                        </td>
                        <td className="py-2 pr-3 align-middle">
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
                        <td className="hidden py-2 pr-3 align-middle text-muted-foreground sm:table-cell">
                          {person.email}
                        </td>
                        <td className="hidden py-2 pr-3 align-middle text-muted-foreground xl:table-cell">
                          {person.job_title?.trim() || "—"}
                        </td>
                        <td className="hidden py-2 pr-3 align-middle text-muted-foreground md:table-cell">
                          {department?.name ?? "—"}
                        </td>
                        <td className="hidden py-2 pr-3 align-middle text-muted-foreground lg:table-cell">
                          {manager ? displayName(manager) : "—"}
                        </td>
                        <td className="py-2 pr-3 align-middle">
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
                        <td className="py-2 align-middle text-right">
                          <RowActionsMenu
                            open={menuFor === person.id}
                            onOpenChange={(open) =>
                              setMenuFor(open ? person.id : null)
                            }
                            label={displayName(person)}
                          >
                            <button
                              type="button"
                              className="block w-full px-3 py-1.5 text-left text-sm hover:bg-surface"
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
                                  className="block w-full px-3 py-1.5 text-left text-sm hover:bg-surface"
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
                                  className="block w-full px-3 py-1.5 text-left text-sm text-destructive hover:bg-surface"
                                >
                                  Archive
                                </button>
                              </form>
                            )}
                          </RowActionsMenu>
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
        departments={departments}
        onDepartmentCreated={rememberDepartment}
      />

      <EditPersonSheet
        person={editing}
        managers={activePeople}
        departments={departments}
        onDepartmentCreated={rememberDepartment}
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
              Columns:{" "}
              <span className="font-medium text-foreground">email</span>{" "}
              (required), full_name, job_title, department. Existing emails are
              skipped. New department names are created automatically.
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
                isImporting ||
                !importPreview ||
                importPreview.ready.length === 0
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

/** Portal menu — avoids clipping by overflow/table boundaries. */
function RowActionsMenu({
  open,
  onOpenChange,
  label,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  children: ReactNode;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{
    top: number;
    right: number;
    openUp: boolean;
  } | null>(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setCoords(null);
      return;
    }
    const rect = triggerRef.current.getBoundingClientRect();
    const openUp = window.innerHeight - rect.bottom < 120;
    setCoords({
      top: openUp ? rect.top - 4 : rect.bottom + 4,
      right: window.innerWidth - rect.right,
      openUp,
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t))
        return;
      onOpenChange(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    const onScroll = () => onOpenChange(false);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, onOpenChange]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Actions for ${label}`}
        aria-expanded={open}
        className="rounded-md px-2 py-0.5 text-muted-foreground hover:bg-surface hover:text-foreground"
        onClick={() => onOpenChange(!open)}
      >
        ···
      </button>
      {open &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="fixed z-50 w-40 rounded-lg border border-border bg-card py-1 shadow-md"
            style={{
              top: coords.openUp ? undefined : coords.top,
              bottom: coords.openUp
                ? window.innerHeight - coords.top
                : undefined,
              right: coords.right,
            }}
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}

function AddPersonSheet({
  open,
  onOpenChange,
  managers,
  departments,
  onDepartmentCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  managers: PeopleDirectoryPerson[];
  departments: PeopleDirectoryDepartment[];
  onDepartmentCreated: (dept: PeopleDirectoryDepartment) => void;
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
          <PersonFields
            key={open ? "add-open" : "add-closed"}
            managers={managers}
            departments={departments}
            onDepartmentCreated={onDepartmentCreated}
          />
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
  departments,
  onDepartmentCreated,
  onOpenChange,
}: {
  person: PeopleDirectoryPerson | null;
  managers: PeopleDirectoryPerson[];
  departments: PeopleDirectoryDepartment[];
  onDepartmentCreated: (dept: PeopleDirectoryDepartment) => void;
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
            key={person.id}
            managers={managers.filter((m) => m.id !== person.id)}
            departments={departments}
            onDepartmentCreated={onDepartmentCreated}
            defaults={{
              full_name: person.full_name ?? "",
              job_title: person.job_title ?? "",
              manager_person_id: person.manager_person_id ?? "",
              department_id: person.department_id ?? "",
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
  departments,
  onDepartmentCreated,
  defaults,
  hideEmail = false,
}: {
  managers: PeopleDirectoryPerson[];
  departments: PeopleDirectoryDepartment[];
  onDepartmentCreated: (dept: PeopleDirectoryDepartment) => void;
  defaults?: {
    full_name?: string;
    job_title?: string;
    manager_person_id?: string;
    department_id?: string;
  };
  hideEmail?: boolean;
}) {
  const [departmentId, setDepartmentId] = useState(
    defaults?.department_id ?? "",
  );
  const [creatingDept, setCreatingDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [deptError, setDeptError] = useState<string | null>(null);
  const [creating, startCreate] = useTransition();

  const addDepartment = () => {
    setDeptError(null);
    startCreate(async () => {
      const result = await createDepartment(newDeptName);
      if ("error" in result) {
        setDeptError(result.error);
        return;
      }
      onDepartmentCreated(result);
      setDepartmentId(result.id);
      setNewDeptName("");
      setCreatingDept(false);
    });
  };

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
      <div className="block text-sm">
        <span className="font-medium text-foreground">Department</span>
        <input type="hidden" name="department_id" value={departmentId} />
        <select
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          className={fieldClassName()}
          aria-label="Department"
        >
          <option value="">No department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        {!creatingDept ? (
          <button
            type="button"
            className="mt-2 text-xs font-medium text-primary hover:underline"
            onClick={() => setCreatingDept(true)}
          >
            + Create department
          </button>
        ) : (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
              placeholder="e.g. Procurement"
              className="min-w-0 flex-1 rounded-lg border border-input bg-surface px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addDepartment();
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              disabled={creating || !newDeptName.trim()}
              onClick={addDepartment}
            >
              {creating ? "Adding…" : "Add"}
            </Button>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                setCreatingDept(false);
                setNewDeptName("");
                setDeptError(null);
              }}
            >
              Cancel
            </button>
          </div>
        )}
        {deptError && (
          <p className="mt-1.5 text-xs text-destructive" role="alert">
            {deptError}
          </p>
        )}
      </div>
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
