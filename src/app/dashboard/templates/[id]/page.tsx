import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { Template, TemplateQuestion } from "@/lib/types/database";
import { redirect, notFound } from "next/navigation";
import TemplateEditor from "./template-editor";

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

  return (
    <TemplateEditor template={template} questions={questions} error={error} />
  );
}
