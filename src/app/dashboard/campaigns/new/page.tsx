import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CreateCampaignForm, {
  type CreatePersonOption,
  type CreateTemplateOption,
} from "./create-campaign-form";
import type { PickerDepartment } from "../people-picker";

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; type?: string; template?: string }>;
}) {
  let orgAdmin;
  try {
    orgAdmin = await requireOrgAdmin();
  } catch {
    redirect("/login");
  }

  const params = await searchParams;
  const supabase = await createClient();
  const is360 = params.type === "360";
  const initialTemplateId = params.template?.trim() || "";

  const { data: rawTemplates, error: templateError } = await supabase
    .from("templates")
    .select("id, name, campaign_type_default")
    .eq("organization_id", orgAdmin.org.id)
    .is("archived_at", null)
    .order("name");

  if (templateError) throw new Error("Unable to load templates");

  const { data: rawQuestions, error: questionsError } = await supabase
    .from("template_questions")
    .select("id, template_id, prompt, type, sort_order")
    .eq("organization_id", orgAdmin.org.id)
    .order("sort_order");

  if (questionsError) throw new Error("Unable to load template questions");

  const questionsByTemplate = new Map<
    string,
    { id: string; prompt: string; type: string }[]
  >();
  for (const q of rawQuestions ?? []) {
    const list = questionsByTemplate.get(q.template_id) ?? [];
    list.push({ id: q.id, prompt: q.prompt, type: q.type });
    questionsByTemplate.set(q.template_id, list);
  }

  let templates: CreateTemplateOption[] = (rawTemplates ?? []).map((t) => {
    const questions = questionsByTemplate.get(t.id) ?? [];
    return {
      id: t.id,
      name: t.name,
      campaign_type_default: t.campaign_type_default,
      questionCount: questions.length,
      questions,
    };
  });

  if (is360) {
    templates = templates.filter(
      (t) =>
        t.questionCount > 0 &&
        !t.questions.some((q) => !["rating", "text"].includes(q.type)),
    );
  }

  let people: CreatePersonOption[] = [];
  let departments: PickerDepartment[] = [];
  if (is360) {
    const [peopleResult, deptResult] = await Promise.all([
      supabase
        .from("people")
        .select(
          "id, full_name, email, department_id, manager_person_id",
        )
        .eq("organization_id", orgAdmin.org.id)
        .is("archived_at", null)
        .order("full_name"),
      supabase
        .from("departments")
        .select("id, name")
        .eq("organization_id", orgAdmin.org.id)
        .order("name"),
    ]);
    if (peopleResult.error) throw new Error("Unable to load people");
    if (deptResult.error) throw new Error("Unable to load departments");
    people = (peopleResult.data ?? []) as CreatePersonOption[];
    departments = (deptResult.data ?? []) as PickerDepartment[];
  }

  return (
    <CreateCampaignForm
      is360={is360}
      templates={templates}
      people={people}
      departments={departments}
      timezone={orgAdmin.org.timezone || "Europe/London"}
      error={params.error}
      initialTemplateId={
        templates.some((t) => t.id === initialTemplateId)
          ? initialTemplateId
          : ""
      }
    />
  );
}
