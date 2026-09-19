import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  createPerson,
  updatePerson,
  archivePerson,
  importPeopleCsv,
} from "./actions";
import FormSubmit from "@/app/dashboard/form-submit";
import type { Person } from "@/lib/types/database";

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  let orgAdmin;
  try {
    orgAdmin = await requireOrgAdmin();
  } catch {
    redirect("/login");
  }

  const params = await searchParams;
  const supabase = await createClient();
  const { data: rawPeople, error: peopleError } = await supabase
    .from("people")
    .select("*")
    .eq("organization_id", orgAdmin.org.id)
    .is("archived_at", null)
    .order("full_name");

  if (peopleError) throw new Error("Unable to load people");
  const people = (rawPeople ?? []) as Person[];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
        People
      </h1>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Employees and reviewers for appraisal campaigns.
      </p>

      {params.error && (
        <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {params.error}
        </div>
      )}
      {params.ok && (
        <div className="mt-3 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground">
          {params.ok}
        </div>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">
            Add person
          </h2>
          <form action={createPerson} className="flex flex-wrap gap-2">
            <input
              aria-label="Full name"
              name="full_name"
              type="text"
              placeholder="Full name"
              className="flex-1 min-w-28 rounded-md border border-input bg-surface px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              aria-label="Email address"
              name="email"
              type="email"
              required
              placeholder="Email"
              className="flex-1 min-w-36 rounded-md border border-input bg-surface px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              aria-label="Job title"
              name="job_title"
              type="text"
              placeholder="Job title"
              className="flex-1 min-w-28 rounded-md border border-input bg-surface px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <FormSubmit size="sm">Add</FormSubmit>
          </form>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground mb-1">
            Import CSV
          </h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Columns: email (required), full_name, job_title. Existing emails are
            skipped.
          </p>
          <form action={importPeopleCsv} className="flex flex-wrap items-center gap-2">
            <input
              aria-label="People CSV file"
              name="file"
              type="file"
              accept=".csv,text/csv"
              required
              className="flex-1 min-w-0 text-sm file:mr-2 file:rounded-md file:border-0 file:bg-surface file:px-2.5 file:py-1.5 file:text-sm"
            />
            <FormSubmit size="sm" variant="outline">
              Upload
            </FormSubmit>
          </form>
        </div>
      </div>

      <div className="mt-5">
        {!people.length ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No people yet — add one or upload a CSV.
          </p>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border bg-card overflow-hidden">
            {people.map((person: Person) => (
              <PersonRow key={person.id} person={person} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PersonRow({ person }: { person: Person }) {
  return (
    <div className="px-3.5 py-2.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium break-words">
            {person.full_name ?? person.email}
          </p>
          <p className="text-xs text-muted-foreground break-words">
            {person.email}
            {person.job_title ? ` · ${person.job_title}` : ""}
          </p>
        </div>
        <details>
          <summary className="text-xs text-primary cursor-pointer">Edit</summary>
          <form
            action={updatePerson.bind(null, person.id)}
            className="mt-2 flex flex-wrap gap-2"
          >
            <input
              aria-label="Full name"
              name="full_name"
              defaultValue={person.full_name ?? ""}
              placeholder="Full name"
              className="min-w-32 flex-1 rounded-md border border-input bg-surface px-2.5 py-1.5 text-sm"
            />
            <input
              aria-label="Job title"
              name="job_title"
              defaultValue={person.job_title ?? ""}
              placeholder="Job title"
              className="min-w-32 flex-1 rounded-md border border-input bg-surface px-2.5 py-1.5 text-sm"
            />
            <FormSubmit size="sm">Save</FormSubmit>
          </form>
          <form action={archivePerson.bind(null, person.id)} className="mt-2">
            <FormSubmit variant="outline" size="sm">
              Archive
            </FormSubmit>
          </form>
        </details>
      </div>
    </div>
  );
}
