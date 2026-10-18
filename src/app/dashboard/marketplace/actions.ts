"use server";

import { getAppOrigin } from "@/lib/app-origin";
import { requireOrgAdmin } from "@/lib/auth/session";
import { ensureWorkspaceCustomer } from "@/lib/billing/customer";
import { billingConfigured, stripe } from "@/lib/billing/stripe";
import { friendlyError } from "@/lib/errors";
import { packAccess, packBySlug, packTemplateQuestions, type TemplatePack } from "@/lib/marketplace";
import { createClient } from "@/lib/supabase/server";
import { installedVersion, workspacePackState } from "./state";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const MARKET = "/dashboard/marketplace";

function fail(message: string): never {
  redirect(`${MARKET}?error=${encodeURIComponent(message)}`);
}

export async function buyPack(formData: FormData): Promise<void> {
  const { org, email } = await requireOrgAdmin();
  const pack = packBySlug(String(formData.get("pack") ?? ""));
  if (!pack) fail("That template pack isn't available.");
  if (!billingConfigured()) fail("Online purchases aren't available yet. Please contact us.");

  const { plan, purchased } = await workspacePackState(org.id);
  const access = packAccess(pack, plan, purchased);
  if (access === "owned" || access === "included") redirect(`${MARKET}?ok=${encodeURIComponent(`You already have ${pack.name}`)}`);
  if (access === "needs_pro") fail(`${pack.name} runs anonymous 360 feedback, which needs Pro. Upgrade first, then add the pack.`);

  let url: string | null = null;
  try {
    const customer = await ensureWorkspaceCustomer(org, email);
    const origin = getAppOrigin();
    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      customer,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "gbp",
            unit_amount: pack.price,
            tax_behavior: "exclusive",
            product_data: {
              name: `${pack.name} — appraisal template pack`,
              description: pack.summary,
              tax_code: "txcd_10103001",
              metadata: { pack_slug: pack.slug },
            },
          },
        },
      ],
      client_reference_id: org.id,
      metadata: { organization_id: org.id, pack_slug: pack.slug, kind: "template_pack" },
      payment_intent_data: { metadata: { organization_id: org.id, pack_slug: pack.slug } },
      invoice_creation: { enabled: true },
      billing_address_collection: "required",
      tax_id_collection: { enabled: true },
      customer_update: { address: "auto", name: "auto" },
      // No VAT is charged (Umbrella Rank Ltd), so Stripe must never add tax.
      automatic_tax: { enabled: false },
      success_url: `${origin}${MARKET}?purchased=${pack.slug}`,
      cancel_url: `${origin}${MARKET}/${pack.slug}`,
    });
    url = session.url;
  } catch (error) {
    console.error("[marketplace] checkout failed", error instanceof Error ? error.message : error);
  }
  if (!url) fail("We couldn't start checkout. Please try again in a moment.");
  redirect(url);
}

/** Template name for a pack version; v1 keeps the plain pack name. */
function versionedName(pack: TemplatePack): string {
  if (pack.version === 1) return pack.name;
  const released = pack.changelog.find((c) => c.version === pack.version)?.date;
  const month = released ? new Date(`${released}T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }) : "";
  return `${pack.name} (v${pack.version}${month ? `, ${month}` : ""})`;
}

/**
 * Copies the current version of the pack into the workspace's templates once;
 * returns the template id. Older versions stay as they are, so an update adds
 * a new template and past or running reviews never change.
 */
async function installPack(pack: TemplatePack, org: { id: string }, userId: string): Promise<string> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("templates")
    .select("id, settings")
    .eq("organization_id", org.id)
    .is("archived_at", null)
    .eq("settings->>marketplace_pack", pack.slug);
  const current = (existing ?? []).find((t) => installedVersion(t.settings as Record<string, unknown> | null) === pack.version);
  if (current?.id) return current.id as string;

  const { data: template, error } = await supabase
    .from("templates")
    .insert({
      organization_id: org.id,
      name: versionedName(pack),
      description: pack.summary,
      campaign_type_default: pack.campaignType,
      settings: { marketplace_pack: pack.slug, marketplace_pack_version: pack.version },
      created_by: userId,
    })
    .select("id")
    .single();
  if (error || !template) throw new Error(error ? friendlyError(error) : "Template not created");

  const { error: questionsError } = await supabase
    .from("template_questions")
    .insert(packTemplateQuestions(pack).map((q) => ({ ...q, template_id: template.id, organization_id: org.id })));
  if (questionsError) {
    await supabase.from("templates").delete().eq("id", template.id);
    throw new Error(friendlyError(questionsError));
  }
  return template.id as string;
}

export async function usePack(formData: FormData): Promise<void> {
  const { org, userId } = await requireOrgAdmin();
  const pack = packBySlug(String(formData.get("pack") ?? ""));
  if (!pack) fail("That template pack isn't available.");
  const { plan, purchased } = await workspacePackState(org.id);
  const access = packAccess(pack, plan, purchased);
  if (access === "needs_pro") fail(`${pack.name} runs anonymous 360 feedback, which needs Pro.`);
  if (access === "available") fail(`Add ${pack.name} to your workspace to use it.`);

  let destination: string;
  try {
    const templateId = await installPack(pack, org, userId);
    revalidatePath("/dashboard/templates");
    if (pack.campaignType === "feedback_360") {
      const supabase = await createClient();
      const { data: campaignId, error } = await supabase.rpc("create_feedback_360_draft", {
        p_name: pack.name,
        p_organization_id: org.id,
      });
      if (error || !campaignId) throw new Error(error ? friendlyError(error) : "Draft not created");
      const attached = await supabase.rpc("save_feedback_360_template", { p_campaign_id: campaignId, p_template: templateId });
      destination = attached.error
        ? `/dashboard/campaigns/${campaignId}?error=${encodeURIComponent("Draft created — choose the template under Questions.")}`
        : `/dashboard/campaigns/${campaignId}?ok=${encodeURIComponent(`Draft created from ${pack.name}`)}`;
    } else {
      destination = `/dashboard/campaigns/new?template=${templateId}`;
    }
  } catch (error) {
    fail(error instanceof Error ? error.message : "We couldn't set up that template. Please try again.");
  }
  redirect(destination);
}
