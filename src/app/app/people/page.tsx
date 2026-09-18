import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createPerson, updatePerson, archivePerson } from "./actions";
import FormSubmit from "@/app/app/form-submit";
import type { Person } from "@/lib/types/database";

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
            People
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Keep employees and reviewers ready for your next appraisal.
          </p>
        </div>
      </div>

      {params.error && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {params.error}
        </div>
      )}

      {/* Add person form */}
      <div className="mt-8 rounded-xl border border-border bg-card p-5">
        <h2 className="font-display text-sm font-semibold text-foreground mb-4">
          Add person
        </h2>
        <form action={createPerson} className="flex flex-wrap gap-3">
          <input
            aria-label="Full name"
            name="full_name"
            type="text"
            placeholder="Full name"
            className="flex-1 min-w-32 rounded-lg border border-input bg-surface px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            aria-label="Email address"
            name="email"
            type="email"
            required
            placeholder="Email"
            className="flex-1 min-w-40 rounded-lg border border-input bg-surface px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            aria-label="Job title"
            name="job_title"
            type="text"
            placeholder="Job title (optional)"
            className="flex-1 min-w-32 rounded-lg border border-input bg-surface px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <FormSubmit size="sm">Add</FormSubmit>
        </form>
      </div>

      {/* People list */}
      <div className="mt-6">
        {!people.length ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            No people yet — add the first one above.
          </p>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
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
    <div className="px-5 py-5">
      <div className="flex flex-wrap justify-between gap-4">
        <div className="min-w-0">
          <p className="font-display text-lg font-semibold break-words">
            {person.full_name ?? person.email}
          </p>
          <p className="mt-1 text-sm text-muted-foreground break-words">
            {person.email}
            {person.job_title ? ` · ${person.job_title}` : ""}
          </p>
        </div>
      </div>
      <details className="mt-4">
        <summary className="text-sm text-primary cursor-pointer">
          Edit person
        </summary>
        <form
          action={updatePerson.bind(null, person.id)}
          className="mt-4 flex flex-wrap gap-3"
        >
          <label className="text-sm flex-1 min-w-40">
            Full name
            <input
              name="full_name"
              defaultValue={person.full_name ?? ""}
              className="mt-2 w-full rounded-lg border border-input bg-surface p-3"
            />
          </label>
          <label className="text-sm flex-1 min-w-40">
            Job title
            <input
              name="job_title"
              defaultValue={person.job_title ?? ""}
              className="mt-2 w-full rounded-lg border border-input bg-surface p-3"
            />
          </label>
          <FormSubmit className="self-end">Save changes</FormSubmit>
        </form>
        <details className="mt-5">
          <summary className="text-sm text-muted-foreground cursor-pointer">
            Archive person
          </summary>
          <p className="mt-3 text-sm text-muted-foreground">
            Remove this person from new campaign selections. Existing campaigns
            and results remain available.
          </p>
          <form action={archivePerson.bind(null, person.id)} className="mt-3">
            <FormSubmit variant="outline">Confirm archive</FormSubmit>
          </form>
        </details>
      </details>
    </div>
  );
}
