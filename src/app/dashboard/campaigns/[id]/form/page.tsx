import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Campaign, CampaignQuestion } from "@/lib/types/database";
import FormBuilder from "./form-builder";

export default async function CampaignFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { org } = await requireOrgAdmin();
  const supabase = await createClient();
  const [campaignResult, questionsResult, templatesResult, templateQuestionsResult, subjectResult] = await Promise.all([
    supabase.from("campaigns").select("*").eq("id", id).eq("organization_id", org.id).maybeSingle(),
    supabase.from("campaign_questions").select("*").eq("campaign_id", id).eq("organization_id", org.id).order("sort_order"),
    supabase.from("templates").select("id,name,campaign_type_default").eq("organization_id", org.id).is("archived_at", null).order("name"),
    supabase.from("template_questions").select("template_id,type").eq("organization_id", org.id),
    supabase.from("campaign_subjects").select("person_id,people(full_name,email)").eq("campaign_id", id).eq("organization_id", org.id).limit(1),
  ]);
  if (campaignResult.error || questionsResult.error || templatesResult.error || templateQuestionsResult.error || subjectResult.error)
    throw new Error("Unable to load campaign form");
  const campaign = campaignResult.data as Campaign | null;
  if (!campaign) notFound();
  const questions = (questionsResult.data ?? []) as CampaignQuestion[];
  const templateQuestions = templateQuestionsResult.data ?? [];
  const templates = (templatesResult.data ?? []).map((template) => {
    const types = templateQuestions.filter((q) => q.template_id === template.id).map((q) => q.type);
    return { id: template.id, name: template.name, questionCount: types.length, compatible: types.length > 0 && (campaign.campaign_type !== "feedback_360" || types.every((type) => type === "rating" || type === "text")) };
  }).filter((template) => template.compatible);
  const subjectRow = subjectResult.data?.[0];
  const person = subjectRow?.people as unknown as { full_name: string | null; email: string } | undefined;
  return <FormBuilder
    key={`${campaign.form_revision}-${campaign.questions_frozen_at ?? ""}`}
    campaign={campaign}
    initialQuestions={questions}
    templates={templates}
    org={{ name: org.name, logoUrl: org.logo_url, brandColor: org.brand_color }}
    subjectName={person?.full_name || person?.email || "your colleague"}
  />;
}
