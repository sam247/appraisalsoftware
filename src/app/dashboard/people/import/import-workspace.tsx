"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { importPeopleCsv } from "../actions";
import { parsePeopleCsv, type PeopleCsvRow } from "@/lib/people/csv";

type Preview = {
  ready: PeopleCsvRow[];
  existing: number;
  attention: string[];
};

export default function ImportWorkspace({
  returnTo,
  existingEmails,
  error,
}: {
  returnTo: string;
  existingEmails: string[];
  error?: string;
}) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  async function chooseFile(nextFile: File | null) {
    setFile(nextFile);
    setPreview(null);
    setClientError(null);
    if (!nextFile) return;
    if (nextFile.size > 1_000_000) {
      setClientError("CSV must be under 1MB");
      return;
    }
    const result = parsePeopleCsv(await nextFile.text());
    if (!result.rows.length && result.errors.length) {
      setClientError(result.errors[0] ?? "No valid rows found");
      return;
    }
    const existing = new Set(existingEmails.map((email) => email.toLowerCase()));
    const ready = result.rows.filter((row) => !existing.has(row.email));
    setPreview({
      ready,
      existing: result.rows.length - ready.length,
      attention: result.errors,
    });
  }

  const message = clientError ?? error;

  return (
    <div className="dashboard-workspace max-w-3xl space-y-6 pb-10">
      <header className="page-header">
        <Link href={returnTo} className="text-xs text-muted-foreground hover:text-foreground">
          ← {returnTo === "/dashboard/people" ? "People" : "Campaign participants"}
        </Link>
        <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Workspace people
        </p>
        <h1 className="mt-1 font-display text-[26px] md:text-[28px] font-semibold tracking-tight">
          Import people
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Add people to the organisation from a CSV. Departments and default managers belong to People.
          {returnTo !== "/dashboard/people" && " Return to the campaign to select participants; importing does not add them automatically."}
        </p>
      </header>

      {message && <p role="alert" className="text-sm text-destructive">{message}</p>}

      <form action={importPeopleCsv} encType="multipart/form-data">
        <input type="hidden" name="return_to" value={returnTo} />
        <section className="border-t border-border pt-5">
        <p className="text-sm text-muted-foreground">
          Required column: <span className="font-medium text-foreground">email</span>.
          Optional columns: full_name, job_title and department. Existing
          emails are skipped.
        </p>
        <input
          aria-label="People CSV file"
          name="file"
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => void chooseFile(event.target.files?.[0] ?? null)}
          className="mt-5 w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-surface file:px-3 file:py-2 file:text-sm"
        />
        </section>

      {preview && (
        <section className="border-y border-border py-4 text-sm">
          <p className="font-medium text-foreground">
            {preview.ready.length} ready to import
          </p>
          <p className="mt-1 text-muted-foreground">
            {preview.existing} already exist
            {preview.attention.length
              ? ` · ${preview.attention.length} need attention`
              : ""}
          </p>
          {preview.attention.length > 0 && (
            <ul className="mt-3 max-h-32 space-y-1 overflow-y-auto text-xs text-muted-foreground">
              {preview.attention.slice(0, 8).map((item) => <li key={item}>{item}</li>)}
            </ul>
          )}
        </section>
      )}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={!file || !preview?.ready.length}>
            {preview ? `Import ${preview.ready.length}` : "Import people"}
          </Button>
          <Button type="button" variant="ghost" asChild>
            <Link href={returnTo}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
