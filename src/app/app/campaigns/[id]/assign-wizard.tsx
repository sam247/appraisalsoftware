"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { saveSubjectsAndAssignments } from "../actions";
import type { Person } from "@/lib/types/database";

interface SubjectRow {
  personId: string;
  managerPersonId: string | null;
}

export default function AssignWizard({
  campaignId,
  people,
}: {
  campaignId: string;
  people: Person[];
}) {
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const addSubject = () => {
    if (!selectedId || subjects.some((s) => s.personId === selectedId)) return;
    const person = people.find((p) => p.id === selectedId)!;
    setSubjects((prev) => [
      ...prev,
      {
        personId: selectedId,
        // Pre-fill manager from person.manager_person_id if they're in the list
        managerPersonId:
          person.manager_person_id &&
          people.some((p) => p.id === person.manager_person_id)
            ? person.manager_person_id
            : null,
      },
    ]);
    setSelectedId("");
  };

  const removeSubject = (id: string) => {
    setSubjects((prev) => prev.filter((s) => s.personId !== id));
  };

  const setManager = (personId: string, managerId: string | null) => {
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
    startTransition(async () => {
      const rows = subjects.map((s) => ({
        personId: s.personId,
        selfPersonId: s.personId, // subject is their own self-respondent
        managerPersonId: s.managerPersonId,
      }));
      const result = await saveSubjectsAndAssignments(campaignId, rows);
      if (result.error) setError(result.error);
    });
  };

  const availableToAdd = people.filter(
    (p) => !subjects.some((s) => s.personId === p.id),
  );

  return (
    <div className="mt-6 rounded-xl border border-border bg-card p-5">
      <h2 className="font-display text-sm font-semibold text-foreground mb-4">
        Subjects &amp; assignments
      </h2>
      <p className="text-xs text-muted-foreground mb-4">
        For each subject, a{" "}
        <span className="font-medium text-foreground">self</span> form is sent
        to the subject and a{" "}
        <span className="font-medium text-foreground">manager</span> form is
        sent to their manager.
      </p>

      {/* Add subject */}
      <div className="flex gap-2 mb-5">
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="flex-1 rounded-lg border border-input bg-surface px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">— Select subject —</option>
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
          disabled={!selectedId}
        >
          Add
        </Button>
      </div>

      {/* Subject rows */}
      {subjects.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          No subjects added yet.
        </p>
      ) : (
        <div className="space-y-3 mb-5">
          {subjects.map((s) => {
            const person = people.find((p) => p.id === s.personId)!;
            const managerCandidates = people.filter(
              (p) => p.id !== s.personId,
            );
            return (
              <div
                key={s.personId}
                className="rounded-lg border border-border bg-surface px-4 py-3 flex flex-wrap items-center gap-3"
              >
                <div className="flex-1 min-w-40">
                  <p className="text-sm font-medium text-foreground">
                    {person.full_name ?? person.email}
                  </p>
                  {person.full_name && (
                    <p className="text-xs text-muted-foreground">
                      {person.email}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Manager:</span>
                  <select
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
        <p className="text-sm text-destructive mb-3">{error}</p>
      )}

      <Button
        type="button"
        size="sm"
        onClick={handleSave}
        disabled={isPending || subjects.length === 0}
      >
        {isPending ? "Saving…" : "Save assignments"}
      </Button>
    </div>
  );
}
