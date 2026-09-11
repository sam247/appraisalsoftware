import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createCampaign } from "../actions";
import { Button } from "@/components/ui/button";
import type { Template } from "@/lib/types/database";

export default async function NewCampaignPage({
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

  const { data: rawTemplates } = await supabase
    .from("templates")
    .select("id, name, campaign_type_default")
    .eq("organization_id", orgAdmin.org.id)
    .is("archived_at", null)
    .order("name");

  const templates = (rawTemplates ?? []) as Pick<
    Template,
    "id" | "name" | "campaign_type_default"
  >[];

  const annualTemplates = templates.filter(
    (t) => t.campaign_type_default === "annual_appraisal",
  );

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
        New campaign
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Choose the type of appraisal cycle you want to run.
      </p>

      {params.error && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {decodeURIComponent(params.error)}
        </div>
      )}

      {/* Preset tiles */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <PresetCard
          title="Annual appraisal"
          description="Self + manager assessment for each employee. Ideal for end-of-year or mid-year reviews."
          available
        />
        <PresetCard
          title="360° feedback"
          description="Multi-rater feedback from peers, direct reports and managers."
          comingSoon
        />
        <PresetCard
          title="Probation review"
          description="Structured review at end of probation period."
          comingSoon
        />
        <PresetCard
          title="Self-assessment"
          description="Employee-only reflection form."
          comingSoon
        />
      </div>

      {/* Annual appraisal wizard form */}
      <div className="mt-10 rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-base font-semibold text-foreground mb-5">
          Annual appraisal details
        </h2>
        <form action={createCampaign} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Campaign name <span className="text-destructive">*</span>
            </label>
            <input
              name="name"
              type="text"
              required
              placeholder="e.g. 2026 Annual Appraisals"
              className="w-full rounded-lg border border-input bg-surface px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Question template
            </label>
            <select
              name="template_id"
              className="w-full rounded-lg border border-input bg-surface px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">— No template (add questions later) —</option>
              {annualTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
              {annualTemplates.length === 0 && templates.length > 0 && (
                <>
                  <optgroup label="Other templates">
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </optgroup>
                </>
              )}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              Questions are frozen when the campaign is activated.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Closes on (optional)
            </label>
            <input
              name="closes_at"
              type="date"
              className="rounded-lg border border-input bg-surface px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit">Create draft</Button>
            <a href="/app/campaigns">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

function PresetCard({
  title,
  description,
  available,
  comingSoon,
}: {
  title: string;
  description: string;
  available?: boolean;
  comingSoon?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-5 py-4 ${
        available
          ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
          : "border-border bg-card opacity-60"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {available && (
          <span className="text-xs rounded-full bg-primary/10 text-primary px-2 py-0.5 font-medium">
            Available
          </span>
        )}
        {comingSoon && (
          <span className="text-xs rounded-full bg-muted text-muted-foreground px-2 py-0.5">
            Coming soon
          </span>
        )}
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
