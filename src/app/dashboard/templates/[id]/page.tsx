import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import {
  upsertQuestion,
  archiveTemplate,
  updateTemplate,
  deleteQuestion,
} from "../actions";
import FormSubmit from "@/app/dashboard/form-submit";
import Link from "next/link";
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
  const saveTemplate = updateTemplate.bind(null, id);
  const doArchive = archiveTemplate.bind(null, id);

  return (
    <div>
      <p className="mb-3 text-xs">
        <Link href="/dashboard/templates" className="text-muted-foreground hover:text-foreground">
          ← Templates
        </Link>
      </p>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-medium tracking-tight text-foreground">
            {template.name}
          </h1>
          {template.description && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {template.description}
            </p>
          )}
        </div>
        <form action={doArchive}>
          <FormSubmit variant="outline" size="sm" className="text-muted-foreground">
            Archive
          </FormSubmit>
        </form>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="mt-4 rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground mb-3">
          Edit template
        </h2>
        <form action={saveTemplate} className="flex flex-wrap gap-2">
          <input
            aria-label="Template name"
            name="name"
            type="text"
            required
            defaultValue={template.name}
            className="flex-1 min-w-40 rounded-md border border-input bg-surface px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            aria-label="Template description"
            name="description"
            type="text"
            defaultValue={template.description ?? ""}
            placeholder="Description (optional)"
            className="flex-1 min-w-40 rounded-md border border-input bg-surface px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <FormSubmit size="sm">Save</FormSubmit>
        </form>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Changes apply to new drafts; sent campaigns keep locked questions.
      </p>

      <div className="mt-3 space-y-2">
        {questions.map((q: TemplateQuestion, idx) => {
          const saveQuestion = upsertQuestion.bind(null, id, q.id);
          const removeQuestion = deleteQuestion.bind(null, id, q.id);
          return (
            <div
              key={q.id}
              className="rounded-lg border border-border bg-card px-3.5 py-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {idx + 1}. {q.prompt}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {q.type === "text"
                      ? "Written response"
                      : q.type === "rating"
                        ? "Rating"
                        : q.type}
                    {q.required ? " · Required" : " · Optional"}
                    {q.help_text ? ` · ${q.help_text}` : ""}
                  </p>
                </div>
                <details>
                  <summary className="text-xs text-primary cursor-pointer whitespace-nowrap">
                    Edit
                  </summary>
                  <form action={saveQuestion} className="mt-2 space-y-2 min-w-[16rem]">
                    <input
                      aria-label="Question prompt"
                      name="prompt"
                      type="text"
                      required
                      defaultValue={q.prompt}
                      className="w-full rounded-md border border-input bg-surface px-2.5 py-1.5 text-sm"
                    />
                    <div className="flex flex-wrap gap-2">
                      <select
                        aria-label="Response type"
                        name="type"
                        defaultValue={q.type}
                        className="rounded-md border border-input bg-surface px-2.5 py-1.5 text-sm"
                      >
                        <option value="text">Open text</option>
                        <option value="rating">Rating</option>
                      </select>
                      <input
                        aria-label="Help text"
                        name="help_text"
                        type="text"
                        defaultValue={q.help_text ?? ""}
                        placeholder="Help text"
                        className="flex-1 min-w-28 rounded-md border border-input bg-surface px-2.5 py-1.5 text-sm"
                      />
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <input
                          name="required"
                          type="checkbox"
                          defaultChecked={q.required}
                        />
                        Required
                      </label>
                      <input
                        name="sort_order"
                        type="hidden"
                        value={q.sort_order}
                      />
                    </div>
                    <div className="flex gap-2">
                      <FormSubmit size="sm">Save question</FormSubmit>
                    </div>
                  </form>
                  <form action={removeQuestion} className="mt-2">
                    <FormSubmit variant="outline" size="sm">
                      Delete question
                    </FormSubmit>
                  </form>
                </details>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground mb-3">
          Add question
        </h2>
        <form action={addQuestion} className="space-y-2">
          <input
            aria-label="Question prompt"
            name="prompt"
            type="text"
            required
            placeholder="Question prompt"
            className="w-full rounded-md border border-input bg-surface px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex flex-wrap gap-2">
            <select
              aria-label="Response type"
              name="type"
              defaultValue="text"
              className="rounded-md border border-input bg-surface px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="text">Open text</option>
              <option value="rating">Rating</option>
            </select>
            <input
              aria-label="Help text"
              name="help_text"
              type="text"
              placeholder="Help text (optional)"
              className="flex-1 min-w-36 rounded-md border border-input bg-surface px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
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
