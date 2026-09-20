import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CreateCampaignForm, {
  type CreatePersonOption,
  type CreateTemplateOption,
} from "./create-campaign-form";

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
  const enabled = process.env.ENABLE_360_FEEDBACK === "true";
  const is360 = enabled && params.type === "360";
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
  if (is360) {
    const { data, error: peopleError } = await supabase
      .from("people")
      .select("id, full_name, email")
      .eq("organization_id", orgAdmin.org.id)
      .is("archived_at", null)
      .order("full_name");
    if (peopleError) throw new Error("Unable to load people");
    people = (data ?? []) as CreatePersonOption[];
  }

  return (
    <CreateCampaignForm
      is360={is360}
      enabled360={enabled}
      templates={templates}
      people={people}
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
