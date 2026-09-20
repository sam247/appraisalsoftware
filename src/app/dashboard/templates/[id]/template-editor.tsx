"use client";

import FormSubmit from "@/app/dashboard/form-submit";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Template, TemplateQuestion } from "@/lib/types/database";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  archiveTemplate,
  deleteQuestion,
  updateTemplate,
  upsertQuestion,
} from "../actions";

function typeLabel(type: string) {
  if (type === "text") return "Written response";
  if (type === "rating") return "Rating";
  return type.replaceAll("_", " ");
}

export default function TemplateEditor({
  template,
  questions,
  error,
}: {
  template: Template;
  questions: TemplateQuestion[];
  error?: string;
}) {
  const [editingDetails, setEditingDetails] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [pageMenuOpen, setPageMenuOpen] = useState(false);

  const closeEditor = useCallback(() => setOpenId(null), []);

  return (
    <div className="w-full max-w-7xl">
      <p className="mb-3 text-xs">
        <Link
          href="/dashboard/templates"
          className="text-muted-foreground hover:text-foreground"
        >
          ← Templates
        </Link>
      </p>

      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {editingDetails ? (
            <TemplateDetailsForm
              template={template}
              onCancel={() => setEditingDetails(false)}
              onSaved={() => setEditingDetails(false)}
            />
          ) : (
            <>
              <h1 className="text-xl font-medium tracking-tight text-foreground">
                {template.name}
              </h1>
              {template.description && (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {template.description}
                </p>
              )}
              <button
                type="button"
                className="mt-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setEditingDetails(true)}
              >
                Edit details
              </button>
            </>
          )}
        </div>

        <PageMenu
          open={pageMenuOpen}
          onOpenChange={setPageMenuOpen}
          templateId={template.id}
        />
      </header>

      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <p className="mt-5 text-xs text-muted-foreground">
        Changes apply to new drafts; sent campaigns keep locked questions.
      </p>

      <div className="mt-4 border-y border-border">
        {questions.length === 0 && openId !== "new" && (
          <p className="py-6 text-sm text-muted-foreground">
            No questions yet. Add the first one below.
          </p>
        )}

        {questions.map((q, idx) => {
          const expanded = openId === q.id;
          return (
            <div
              key={q.id}
              className={cn(
                "border-b border-border last:border-b-0",
                expanded && "bg-card/40",
              )}
            >
              {!expanded ? (
                <button
                  type="button"
                  className="flex w-full items-start gap-3 px-1 py-3.5 text-left transition-colors hover:bg-surface/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                  onClick={() => setOpenId(q.id)}
                  aria-expanded={false}
                >
                  <span className="w-6 shrink-0 pt-0.5 text-sm tabular-nums text-muted-foreground">
                    {idx + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground">
                      {q.prompt}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {typeLabel(q.type)}
                      {q.required ? " · Required" : " · Optional"}
                    </span>
                  </span>
                </button>
              ) : (
                <QuestionEditor
                  index={idx + 1}
                  templateId={template.id}
                  question={q}
                  onCancel={closeEditor}
                  onSaved={closeEditor}
                />
              )}
            </div>
          );
        })}

        {openId === "new" && (
          <div className="border-b border-border bg-card/40 last:border-b-0">
            <QuestionEditor
              index={questions.length + 1}
              templateId={template.id}
              question={null}
              sortOrder={questions.length}
              onCancel={closeEditor}
              onSaved={closeEditor}
            />
          </div>
        )}
      </div>

      {openId !== "new" && (
        <button
          type="button"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          onClick={() => setOpenId("new")}
        >
          <span aria-hidden>+</span> Add question
        </button>
      )}
    </div>
  );
}

function TemplateDetailsForm({
  template,
  onCancel,
  onSaved,
}: {
  template: Template;
  onCancel: () => void;
  onSaved: () => void;
}) {
  return (
    <form
      className="space-y-3"
      action={async (formData) => {
        await updateTemplate(template.id, formData);
        onSaved();
      }}
    >
      <div>
        <label htmlFor="template-name" className="sr-only">
          Template name
        </label>
        <input
          id="template-name"
          name="name"
          type="text"
          required
          defaultValue={template.name}
          autoFocus
          className="w-full rounded-lg border border-input bg-card px-3 py-2 text-lg font-medium tracking-tight text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div>
        <label htmlFor="template-description" className="sr-only">
          Description
        </label>
        <input
          id="template-description"
          name="description"
          type="text"
          defaultValue={template.description ?? ""}
          placeholder="Description (optional)"
          className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <FormSubmit size="sm">Save</FormSubmit>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function QuestionEditor({
  index,
  templateId,
  question,
  sortOrder,
  onCancel,
  onSaved,
}: {
  index: number;
  templateId: string;
  question: TemplateQuestion | null;
  sortOrder?: number;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const isNew = question === null;
  const formKey = isNew ? "new" : question.id;
  const promptId = useId();
  const typeId = useId();
  const helpId = useId();

  return (
    <div className="px-1 py-4">
      <div className="flex items-start gap-3">
        <span className="w-6 shrink-0 pt-1 text-sm tabular-nums text-muted-foreground">
          {index}
        </span>
        <div className="min-w-0 flex-1">
          {!isNew && (
            <p className="mb-3 text-sm font-medium text-foreground">
              {question.prompt}
            </p>
          )}
          {isNew && (
            <p className="mb-3 text-sm font-medium text-foreground">
              New question
            </p>
          )}

          <form
            key={formKey}
            className="space-y-4"
            action={async (formData) => {
              await upsertQuestion(
                templateId,
                isNew ? null : question.id,
                formData,
              );
              onSaved();
            }}
          >
            <input
              type="hidden"
              name="sort_order"
              value={isNew ? (sortOrder ?? 0) : question.sort_order}
            />

            <div>
              <label
                htmlFor={promptId}
                className="block text-xs font-medium text-muted-foreground"
              >
                Question
              </label>
              <input
                id={promptId}
                name="prompt"
                type="text"
                required
                autoFocus
                defaultValue={question?.prompt ?? ""}
                placeholder="What should people answer?"
                className="mt-1.5 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <div>
                <label
                  htmlFor={typeId}
                  className="block text-xs font-medium text-muted-foreground"
                >
                  Response type
                </label>
                <select
                  id={typeId}
                  name="type"
                  defaultValue={question?.type ?? "text"}
                  className="mt-1.5 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring sm:max-w-xs"
                >
                  <option value="text">Open text</option>
                  <option value="rating">Rating</option>
                  {question &&
                    !["text", "rating"].includes(question.type) && (
                      <option value={question.type}>
                        {typeLabel(question.type)}
                      </option>
                    )}
                </select>
              </div>
              <label className="flex items-center gap-2 pb-2 text-sm text-foreground">
                <input
                  name="required"
                  type="checkbox"
                  defaultChecked={question?.required ?? true}
                  className="h-4 w-4 rounded border-input"
                />
                Required
              </label>
            </div>

            <div>
              <label
                htmlFor={helpId}
                className="block text-xs font-medium text-muted-foreground"
              >
                Help text
              </label>
              <input
                id={helpId}
                name="help_text"
                type="text"
                defaultValue={question?.help_text ?? ""}
                placeholder="Optional guidance for the reviewer…"
                className="mt-1.5 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
                Cancel
              </Button>
              <FormSubmit size="sm">
                {isNew ? "Add question" : "Save question"}
              </FormSubmit>
            </div>
          </form>

          {!isNew && (
            <form
              className="mt-4 border-t border-border/70 pt-3"
              action={async () => {
                await deleteQuestion(templateId, question.id);
                onSaved();
              }}
            >
              <FormSubmit
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                pendingLabel="Deleting…"
              >
                Delete question
              </FormSubmit>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function PageMenu({
  open,
  onOpenChange,
  templateId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
}) {
  return (
    <QuietMenu
      open={open}
      onOpenChange={onOpenChange}
      label="Template actions"
    >
      <form action={archiveTemplate.bind(null, templateId)}>
        <button
          type="submit"
          role="menuitem"
          className="block w-full px-3 py-1.5 text-left text-sm text-muted-foreground hover:bg-surface hover:text-destructive"
          onClick={() => onOpenChange(false)}
        >
          Archive template
        </button>
      </form>
    </QuietMenu>
  );
}

/** Same portal ··· pattern as People — keeps menus from clipping. */
function QuietMenu({
  open,
  onOpenChange,
  label,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  children: ReactNode;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{
    top: number;
    right: number;
    openUp: boolean;
  } | null>(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setCoords(null);
      return;
    }
    const rect = triggerRef.current.getBoundingClientRect();
    const openUp = window.innerHeight - rect.bottom < 120;
    setCoords({
      top: openUp ? rect.top - 4 : rect.bottom + 4,
      right: window.innerWidth - rect.right,
      openUp,
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t))
        return;
      onOpenChange(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    const onScroll = () => onOpenChange(false);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, onOpenChange]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        className="rounded-md px-2 py-0.5 text-muted-foreground hover:bg-surface hover:text-foreground"
        onClick={() => onOpenChange(!open)}
      >
        ···
      </button>
      {open &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="fixed z-50 w-44 rounded-lg border border-border bg-card py-1 shadow-md"
            style={{
              top: coords.openUp ? undefined : coords.top,
              bottom: coords.openUp
                ? window.innerHeight - coords.top
                : undefined,
              right: coords.right,
            }}
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}
