"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PickerPerson = {
  id: string;
  full_name: string | null;
  email: string;
  department_id: string | null;
  manager_person_id: string | null;
};

export type PickerDepartment = {
  id: string;
  name: string;
};

const RELATIONSHIPS = [
  { value: "peer", label: "Peer" },
  { value: "manager", label: "Manager" },
  { value: "direct_report", label: "Direct report" },
  { value: "other", label: "Other" },
] as const;

function personLabel(p: PickerPerson) {
  return p.full_name || p.email;
}

export default function PeoplePicker({
  people,
  departments,
  selectedIds,
  onChange,
  excludeIds = [],
  mode,
  relationships,
  onRelationshipChange,
  managerOverrides,
  onManagerChange,
}: {
  people: PickerPerson[];
  departments: PickerDepartment[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  excludeIds?: string[];
  mode: "annual" | "360";
  relationships?: Record<string, string>;
  onRelationshipChange?: (personId: string, relationship: string) => void;
  managerOverrides?: Record<string, string | null>;
  onManagerChange?: (personId: string, managerId: string | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const exclude = useMemo(() => new Set(excludeIds), [excludeIds]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const peopleById = useMemo(
    () => Object.fromEntries(people.map((p) => [p.id, p])),
    [people],
  );
  const deptName = useMemo(
    () => Object.fromEntries(departments.map((d) => [d.id, d.name])),
    [departments],
  );

  const eligible = useMemo(
    () => people.filter((p) => !exclude.has(p.id)),
    [people, exclude],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return eligible.filter((p) => {
      if (departmentId && p.department_id !== departmentId) return false;
      if (!q) return true;
      return (
        (p.full_name ?? "").toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q)
      );
    });
  }, [eligible, query, departmentId]);

  const toggle = (id: string) => {
    if (selectedSet.has(id)) onChange(selectedIds.filter((x) => x !== id));
    else onChange([...selectedIds, id]);
  };

  const selectFiltered = () => {
    const next = new Set(selectedIds);
    for (const p of filtered) next.add(p.id);
    onChange([...next]);
  };

  const selectEveryone = () => {
    onChange(eligible.map((p) => p.id));
  };

  const selectDepartment = () => {
    if (!departmentId) return;
    const next = new Set(selectedIds);
    for (const p of eligible) {
      if (p.department_id === departmentId) next.add(p.id);
    }
    onChange([...next]);
  };

  const clearSelected = () => onChange([]);

  const selectedPeople = selectedIds
    .map((id) => peopleById[id])
    .filter(Boolean) as PickerPerson[];

  const resolvedManager = (p: PickerPerson) => {
    if (managerOverrides && p.id in managerOverrides) {
      const mid = managerOverrides[p.id];
      return mid && peopleById[mid] ? peopleById[mid] : null;
    }
    const mid = p.manager_person_id;
    return mid && peopleById[mid] ? peopleById[mid] : null;
  };

  const noManagerCount =
    mode === "annual"
      ? selectedPeople.filter((p) => !resolvedManager(p)).length
      : 0;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,1fr)] lg:gap-6">
      <div className="min-w-0 rounded-xl border border-border/80 bg-card/40">
        <div className="space-y-3 border-b border-border/70 p-3 sm:p-4">
          <div className="flex flex-wrap items-end gap-2">
            <label className="min-w-[10rem] flex-1 text-sm">
              <span className="sr-only">Search people</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search people…"
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="text-sm">
              <span className="sr-only">Department</span>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={selectEveryone}
            >
              Everyone
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!departmentId}
              onClick={selectDepartment}
            >
              This department
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={filtered.length === 0}
              onClick={selectFiltered}
            >
              Select shown
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {filtered.length} shown · {eligible.length} available
          </p>
        </div>

        <ul className="max-h-[28rem] divide-y divide-border/60 overflow-y-auto">
          {filtered.length === 0 ? (
            <li className="px-4 py-6 text-sm text-muted-foreground">
              No people match these filters.
            </li>
          ) : (
            filtered.map((p) => {
              const checked = selectedSet.has(p.id);
              return (
                <li key={p.id}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-3 px-3 py-2.5 sm:px-4",
                      checked && "bg-accent/40",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(p.id)}
                      className="h-4 w-4 rounded border-input"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {personLabel(p)}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {p.email}
                        {p.department_id && deptName[p.department_id]
                          ? ` · ${deptName[p.department_id]}`
                          : ""}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })
          )}
        </ul>
      </div>

      <aside className="min-w-0 rounded-xl border border-border/80 bg-surface/50 p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            {mode === "360" ? "Selected reviewers" : "Selected people"}
          </h3>
          <span className="text-sm font-medium text-foreground">
            {selectedIds.length}
          </span>
        </div>

        {mode === "360" && (
          <p className="mt-2 text-xs text-muted-foreground">
            {selectedIds.length < 5
              ? `${selectedIds.length} reviewer${selectedIds.length === 1 ? "" : "s"} selected · Choose at least ${5 - selectedIds.length} more`
              : "Minimum reviewer requirement met ✓"}
          </p>
        )}
        {mode === "360" && (
          <p className="mt-1 text-xs text-muted-foreground">
            At least five completed reviewer responses are required before
            results can be shown.
          </p>
        )}
        {mode === "annual" && noManagerCount > 0 && (
          <p className="mt-2 text-xs text-amber-800 dark:text-amber-200">
            {noManagerCount} selected{" "}
            {noManagerCount === 1 ? "person has" : "people have"} no manager
            assigned.
          </p>
        )}

        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={clearSelected}
            className="mt-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Clear selected
          </button>
        )}

        {selectedPeople.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            {mode === "360"
              ? "Select reviewers from the list."
              : "Select people from the list."}
          </p>
        ) : (
          <ul className="mt-3 max-h-[24rem] space-y-2 overflow-y-auto">
            {selectedPeople.map((p) => {
              const manager = resolvedManager(p);
              const managerValue =
                managerOverrides && p.id in managerOverrides
                  ? (managerOverrides[p.id] ?? "")
                  : (p.manager_person_id ?? "");
              return (
                <li
                  key={p.id}
                  className="rounded-lg border border-border/60 bg-card/60 px-3 py-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {personLabel(p)}
                      </p>
                      {mode === "annual" && !onManagerChange && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {manager
                            ? `Manager: ${personLabel(manager)}`
                            : "Manager: not assigned"}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove ${personLabel(p)}`}
                      onClick={() => toggle(p.id)}
                      className="shrink-0 text-xs text-muted-foreground hover:text-destructive"
                    >
                      Remove
                    </button>
                  </div>
                  {mode === "annual" && onManagerChange && (
                    <label className="mt-2 block text-xs text-muted-foreground">
                      Manager
                      <select
                        value={managerValue}
                        onChange={(e) =>
                          onManagerChange(p.id, e.target.value || null)
                        }
                        aria-label={`Manager for ${personLabel(p)}`}
                        className="mt-1 w-full rounded-md border border-input bg-card px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">Not assigned</option>
                        {people
                          .filter((m) => m.id !== p.id)
                          .map((m) => (
                            <option key={m.id} value={m.id}>
                              {personLabel(m)}
                            </option>
                          ))}
                      </select>
                    </label>
                  )}
                  {mode === "360" && relationships && onRelationshipChange && (
                    <label className="mt-2 block text-xs text-muted-foreground">
                      Relationship
                      <select
                        value={relationships[p.id] ?? "peer"}
                        onChange={(e) =>
                          onRelationshipChange(p.id, e.target.value)
                        }
                        aria-label={`Relationship for ${personLabel(p)}`}
                        className="mt-1 w-full rounded-md border border-input bg-card px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {RELATIONSHIPS.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </aside>
    </div>
  );
}
