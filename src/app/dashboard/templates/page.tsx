import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createTemplate } from "./actions";
import { PageHeader } from "../chrome";
import FormSubmit from "@/app/dashboard/form-submit";
import Link from "next/link";
import type { Template } from "@/lib/types/database";

export default async function TemplatesPage({
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
  const { data: rawTemplates, error: templateError } = await supabase
    .from("templates")
    .select("*")
    .eq("organization_id", orgAdmin.org.id)
    .is("archived_at", null)
    .order("created_at");

  if (templateError) throw new Error("Unable to load templates");
  const templates = (rawTemplates ?? []) as Template[];

  return (
    <div>
      <PageHeader title="Templates" subtitle="Reusable question sets for appraisal campaigns." />

      {params.error && (
        <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {params.error}
        </div>
      )}

      <div className="mt-5 max-w-3xl">
        <h2 className="mb-3 text-sm font-medium text-foreground">
          New template
        </h2>
        <form action={createTemplate} className="flex flex-wrap gap-2">
          <input
            aria-label="Template name"
            name="name"
            type="text"
            required
            placeholder="Template name"
            className="flex-1 min-w-36 field bg-surface"
          />
          <input
            aria-label="Template description"
            name="description"
            type="text"
            placeholder="Description (optional)"
            className="flex-1 min-w-36 field bg-surface"
          />
          <FormSubmit size="sm">Create</FormSubmit>
        </form>
      </div>

      <div className="mt-4">
        {!templates.length ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No templates yet — create one above.
          </p>
        ) : (
          <div className="directory-table divide-y divide-border">
            {templates.map((t: Template) => (
              <Link
                key={t.id}
                href={`/dashboard/templates/${t.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-surface transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {t.name}
                  </p>
                  {t.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {t.description}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0 ml-3">
                  Edit →
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
