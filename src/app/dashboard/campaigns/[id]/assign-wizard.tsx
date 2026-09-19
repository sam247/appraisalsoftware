"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { saveSubjectsAndAssignments } from "../actions";
import type { Person } from "@/lib/types/database";

export interface SubjectRow {
  personId: string;
  managerPersonId: string | null;
}

export default function AssignWizard({
  campaignId,
  people,
  initialSubjects,
  onDirtyChange,
}: {
  campaignId: string;
  people: Person[];
  initialSubjects: SubjectRow[];
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [subjects, setSubjects] = useState<SubjectRow[]>(initialSubjects);
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const addSubject = () => {
    if (!selectedId || subjects.some((s) => s.personId === selectedId)) return;
    const person = people.find((p) => p.id === selectedId)!;
    onDirtyChange(true);
    setSubjects((prev) => [
      ...prev,
      {
        personId: selectedId,
        // Pre-fill manager from person.manager_person_id if they're in the list
        managerPersonId:
          person.manager_person_id &&
          people.some(
            (p) => p.id === person.manager_person_id && !p.archived_at,
          )
            ? person.manager_person_id
            : null,
      },
    ]);
    setSelectedId("");
  };

  const removeSubject = (id: string) => {
    onDirtyChange(true);
    setSubjects((prev) => prev.filter((s) => s.personId !== id));
  };

  const setManager = (personId: string, managerId: string | null) => {
    onDirtyChange(true);
    setSubjects((prev) =>
      prev.map((s) =>
        s.personId === personId
          ? { ...s, managerPersonId: managerId || null }
          : s,
      ),
    );
  };

  const handleSave = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const rows = subjects.map((s) => ({
        personId: s.personId,
        selfPersonId: s.personId, // subject is their own self-respondent
        managerPersonId: s.managerPersonId,
      }));
      const result = await saveSubjectsAndAssignments(campaignId, rows);
      if (result.error) setError(result.error);
      else {
        setSaved(true);
        onDirtyChange(false);
        router.refresh();
      }
    });
  };

  const availableToAdd = people.filter(
    (p) => !p.archived_at && !subjects.some((s) => s.personId === p.id),
  );

  return (
    <div className="mt-6 rounded-xl border border-border bg-card p-5">
      <h2 className="font-display text-sm font-semibold text-foreground mb-4">
        Choose your participants
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Each employee receives a{" "}
        <span className="font-medium text-foreground">self appraisal</span> to
        complete, and a{" "}
        <span className="font-medium text-foreground">manager review</span> goes
        to their chosen manager.
      </p>

      {people.filter((p) => !p.archived_at).length === 0 && (
        <p className="mb-4 text-sm">
          <Link href="/dashboard/people" className="text-primary underline">
            Add people to your workspace
          </Link>{" "}
          before choosing participants.
        </p>
      )}
      {/* Add subject */}
      <div className="flex gap-2 mb-5">
        <select
          aria-label="Employee to add"
          disabled={isPending}
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="flex-1 rounded-lg border border-input bg-surface px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Select an employee</option>
          {availableToAdd.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name ?? p.email}
            </option>
          ))}
        </select>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={addSubject}
          disabled={!selectedId || isPending}
        >
          Add
        </Button>
      </div>

      {/* Subject rows */}
      {subjects.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          No participants yet. Add an employee to begin.
        </p>
      ) : (
        <div className="space-y-3 mb-5">
          {subjects.map((s) => {
            const person = people.find((p) => p.id === s.personId);
            const managerCandidates = people.filter(
              (p) =>
                p.id !== s.personId &&
                (!p.archived_at || p.id === s.managerPersonId),
            );
            return (
              <div
                key={s.personId}
                className="rounded-lg border border-border bg-surface px-4 py-3 flex flex-wrap items-center gap-3"
              >
                <div className="flex-1 min-w-40">
                  <p className="text-sm font-medium text-foreground">
                    {person?.full_name ?? person?.email ?? "Archived employee"}
                  </p>
                  {person?.full_name && (
                    <p className="text-xs text-muted-foreground">
                      {person.email}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Manager:
                  </span>
                  <select
                    aria-label={`Manager for ${person?.full_name ?? person?.email ?? "employee"}`}
                    disabled={isPending}
                    value={s.managerPersonId ?? ""}
                    onChange={(e) =>
                      setManager(s.personId, e.target.value || null)
                    }
                    className="rounded-md border border-input bg-card px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">— None —</option>
                    {managerCandidates.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name ?? m.email}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  disabled={isPending}
                  aria-label={`Remove ${person?.full_name ?? person?.email ?? "employee"}`}
                  onClick={() => removeSubject(s.personId)}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive mb-3">
          {error}
        </p>
      )}

      {saved && (
        <p role="status" className="mb-3 text-sm text-primary">
          Participants saved. Review the campaign below before sending.
        </p>
      )}
      <Button
        type="button"
        size="sm"
        onClick={handleSave}
        disabled={
          isPending || (subjects.length === 0 && initialSubjects.length === 0)
        }
      >
        {isPending ? "Saving…" : "Save participants"}
      </Button>
    </div>
  );
}
