import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createCampaign } from "../actions";
import { Button } from "@/components/ui/button";
import FormSubmit from "@/app/app/form-submit";
import Link from "next/link";
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

  const { data: rawTemplates, error: templateError } = await supabase
    .from("templates")
    .select("id, name, campaign_type_default")
    .eq("organization_id", orgAdmin.org.id)
    .is("archived_at", null)
    .order("name");

  if (templateError) throw new Error("Unable to load templates");
  const templates = (rawTemplates ?? []) as Pick<
    Template,
    "id" | "name" | "campaign_type_default"
  >[];

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
        Create an annual appraisal
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Start with a name and a question template. You’ll choose participants
        and review everything before sending.
      </p>

      {params.error && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {params.error}
        </div>
      )}

      <ol
        aria-label="Appraisal setup"
        className="mt-8 flex flex-wrap gap-4 text-sm text-muted-foreground"
      >
        <li className="text-primary font-medium">1. Details &amp; template</li>
        <li>2. People</li>
        <li>3. Review &amp; send</li>
      </ol>
      <p className="mt-5 text-sm text-muted-foreground">
        Annual appraisals collect separate self and manager responses. 360
        feedback and anonymous feedback are planned.
      </p>

      {/* Annual appraisal wizard form */}
      <div className="mt-10 rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-base font-semibold text-foreground mb-5">
          Annual appraisal details
        </h2>
        {!templates.length && (
          <p className="mb-5 text-sm">
            <Link href="/app/templates" className="text-primary underline">
              Create a question template
            </Link>{" "}
            to start your appraisal.
          </p>
        )}
        <form action={createCampaign} className="space-y-4">
          <div>
            <label
              htmlFor="campaign-name"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Campaign name <span className="text-destructive">*</span>
            </label>
            <input
              id="campaign-name"
              name="name"
              type="text"
              required
              placeholder="e.g. 2026 Annual Appraisals"
              className="w-full rounded-lg border border-input bg-surface px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label
              htmlFor="campaign-template"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Question template (required)
            </label>
            <select
              id="campaign-template"
              required
              name="template_id"
              className="w-full rounded-lg border border-input bg-surface px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Choose a question template</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              A template with questions is required to send. You can review it
              in the next step.
            </p>
          </div>

          <div>
            <label
              htmlFor="close-date"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Closes on (optional)
            </label>
            <input
              id="close-date"
              name="closes_at"
              type="date"
              className="rounded-lg border border-input bg-surface px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <p className="text-sm text-muted-foreground">
            Dates use {orgAdmin.org.timezone || "Europe/London"}. The close date
            includes the full local day; GMT/BST changes are handled
            automatically.
          </p>
          <div className="flex gap-3 pt-2">
            <FormSubmit disabled={!templates.length}>
              Create draft &amp; choose people
            </FormSubmit>
            <Button asChild variant="outline">
              <Link href="/app/campaigns">Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
