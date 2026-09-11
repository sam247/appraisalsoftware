import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createPerson } from "./actions";
import { Button } from "@/components/ui/button";
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
  const { data: rawPeople } = await supabase
    .from("people")
    .select("*")
    .eq("organization_id", orgAdmin.org.id)
    .is("archived_at", null)
    .order("full_name");

  const people = (rawPeople ?? []) as Person[];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            People
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the people in your appraisal cycles.
          </p>
        </div>
      </div>

      {params.error && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {decodeURIComponent(params.error)}
        </div>
      )}

      {/* Add person form */}
      <div className="mt-8 rounded-xl border border-border bg-card p-5">
        <h2 className="font-display text-sm font-semibold text-foreground mb-4">
          Add person
        </h2>
        <form action={createPerson} className="flex flex-wrap gap-3">
          <input
            name="full_name"
            type="text"
            placeholder="Full name"
            className="flex-1 min-w-32 rounded-lg border border-input bg-surface px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="flex-1 min-w-40 rounded-lg border border-input bg-surface px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            name="job_title"
            type="text"
            placeholder="Job title (optional)"
            className="flex-1 min-w-32 rounded-lg border border-input bg-surface px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button type="submit" size="sm">
            Add
          </Button>
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
    <div className="flex items-center justify-between px-5 py-3.5">
      <div>
        <p className="text-sm font-medium text-foreground">
          {person.full_name ?? person.email}
        </p>
        {person.full_name && (
          <p className="text-xs text-muted-foreground">{person.email}</p>
        )}
        {person.job_title && (
          <p className="text-xs text-muted-foreground">{person.job_title}</p>
        )}
      </div>
    </div>
  );
}
