import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createTemplate } from "./actions";
import FormSubmit from "@/app/app/form-submit";
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
      <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
        Templates
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Reusable starting points for thoughtful annual appraisals. Choose one
        when creating a campaign.
      </p>

      {params.error && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {params.error}
        </div>
      )}

      {/* Create template form */}
      <div className="mt-8 rounded-xl border border-border bg-card p-5">
        <h2 className="font-display text-sm font-semibold text-foreground mb-4">
          New template
        </h2>
        <form action={createTemplate} className="flex flex-wrap gap-3">
          <input
            aria-label="Template name"
            name="name"
            type="text"
            required
            placeholder="Template name"
            className="flex-1 min-w-40 rounded-lg border border-input bg-surface px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            aria-label="Template description"
            name="description"
            type="text"
            placeholder="Description (optional)"
            className="flex-1 min-w-40 rounded-lg border border-input bg-surface px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <FormSubmit size="sm">Create</FormSubmit>
        </form>
      </div>

      {/* Templates list */}
      <div className="mt-6">
        {!templates.length ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            No templates yet — create one above.
          </p>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
            {templates.map((t: Template) => (
              <Link
                key={t.id}
                href={`/app/templates/${t.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-surface transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t.name}
                  </p>
                  {t.description && (
                    <p className="text-sm text-muted-foreground">
                      {t.description}
                    </p>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  View questions →
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
