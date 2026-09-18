import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { upsertQuestion, archiveTemplate } from "../actions";
import FormSubmit from "@/app/app/form-submit";
import type { Template, TemplateQuestion } from "@/lib/types/database";

export default async function TemplateDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  let orgAdmin;
  try {
    orgAdmin = await requireOrgAdmin();
  } catch {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: rawTemplate } = await supabase
    .from("templates")
    .select("*")
    .eq("id", id)
    .eq("organization_id", orgAdmin.org.id)
    .single();

  if (!rawTemplate) notFound();
  const template = rawTemplate as Template;

  const { data: rawQuestions } = await supabase
    .from("template_questions")
    .select("*")
    .eq("template_id", id)
    .order("sort_order");

  const questions = (rawQuestions ?? []) as TemplateQuestion[];

  const addQuestion = upsertQuestion.bind(null, id, null);
  const doArchive = archiveTemplate.bind(null, id);

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            {template.name}
          </h1>
          {template.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {template.description}
            </p>
          )}
        </div>
        <form action={doArchive}>
          <FormSubmit
            variant="outline"
            size="sm"

            className="text-muted-foreground"
          >
            Archive
          </FormSubmit>
        </form>
      </div>

      {error && (
        <p role="alert" className="mt-5 text-sm text-destructive">
          {error}
        </p>
      )}
      <p className="mt-6 text-sm text-muted-foreground">
        Reusable questions for your appraisal campaigns. Changes apply to
        drafts; sent and scheduled campaigns retain their own locked questions.
      </p>
      {/* Questions */}
      <div className="mt-8 space-y-3">
        {questions.map((q: TemplateQuestion, idx) => (
          <div
            key={q.id}
            className="rounded-xl border border-border bg-card px-5 py-4"
          >
            <p className="text-sm font-medium text-foreground">
              {idx + 1}. {q.prompt}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {q.type === "text"
                ? "Written response"
                : q.type === "rating"
                  ? "Rating"
                  : q.type}
              {q.help_text ? ` · ${q.help_text}` : ""}
            </p>
          </div>
        ))}
      </div>

      {/* Add question */}
      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <h2 className="font-display text-sm font-semibold text-foreground mb-4">
          Add question
        </h2>
        <form action={addQuestion} className="space-y-3">
          <input
            aria-label="Question prompt"
            name="prompt"
            type="text"
            required
            placeholder="Question prompt"
            className="w-full rounded-lg border border-input bg-surface px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex flex-wrap gap-3">
            <select
              aria-label="Response type"
              name="type"
              defaultValue="text"
              className="rounded-lg border border-input bg-surface px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="text">Open text</option>
              <option value="rating">Rating</option>
            </select>
            <input
              aria-label="Help text"
              name="help_text"
              type="text"
              placeholder="Help text (optional)"
              className="flex-1 min-w-40 rounded-lg border border-input bg-surface px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <input name="required" type="checkbox" defaultChecked />
              Required
            </label>
            <input name="sort_order" type="hidden" value={questions.length} />
          </div>
          <FormSubmit size="sm">Add question</FormSubmit>
        </form>
      </div>
    </div>
  );
}
