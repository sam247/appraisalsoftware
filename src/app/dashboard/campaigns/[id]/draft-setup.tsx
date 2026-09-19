"use client";
import { useState } from "react";
import AssignWizard, { type SubjectRow } from "./assign-wizard";
import type { Person } from "@/lib/types/database";
export default function DraftSetup({
  campaignId,
  people,
  initialSubjects,
  children,
}: {
  campaignId: string;
  people: Person[];
  initialSubjects: SubjectRow[];
  children: React.ReactNode;
}) {
  const [dirty, setDirty] = useState(false);
  return (
    <>
      <AssignWizard
        campaignId={campaignId}
        people={people}
        initialSubjects={initialSubjects}
        onDirtyChange={setDirty}
      />
      {dirty ? (
        <p role="status" className="mt-6 text-sm text-muted-foreground">
          You have unsaved participant changes. Save them before reviewing or
          sending this appraisal.
        </p>
      ) : (
        children
      )}
    </>
  );
}
