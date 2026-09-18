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
  searchParams: Promise<{ error?: string; type?: string }>;
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
  let templates = (rawTemplates ?? []) as Pick<
    Template,
    "id" | "name" | "campaign_type_default"
  >[];

  const enabled = process.env.ENABLE_360_FEEDBACK === "true";
  const is360 = enabled && params.type === "360";
  const { data: people, error: peopleError } = is360
    ? await supabase
        .from("people")
        .select("id,full_name,email")
        .eq("organization_id", orgAdmin.org.id)
        .is("archived_at", null)
        .order("full_name")
    : { data: [], error: null };
  if (peopleError) throw new Error("Unable to load people");
  if (is360) {
    const { data: qs, error } = await supabase
      .from("template_questions")
      .select("template_id,type")
      .eq("organization_id", orgAdmin.org.id);
    if (error) throw new Error("Unable to load questionnaires");
    templates = templates.filter(
      (t) =>
        qs?.some((q) => q.template_id === t.id) &&
        !qs?.some(
          (q) => q.template_id === t.id && !["rating", "text"].includes(q.type),
        ),
    );
  }
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
        {is360 ? "Create anonymous 360 feedback" : "Create an annual appraisal"}
      </h1>
      {enabled && (
        <nav aria-label="Campaign type" className="my-5 flex gap-5 text-sm">
          <Link href="/app/campaigns/new" className="text-primary underline">
            Annual appraisal
          </Link>
          <Link
            href="/app/campaigns/new?type=360"
            className="text-primary underline"
          >
            Anonymous 360
          </Link>
        </nav>
      )}
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
        {is360
          ? "Reviewers are combined into one anonymous group. At least five distinct reviewers must respond; results are released only after closure. Each question also needs five answers. The subject cannot review themselves."
          : "Annual appraisals collect identified self and manager responses."}
      </p>

      {/* Annual appraisal wizard form */}
      <div className="mt-10 rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-base font-semibold text-foreground mb-5">
          {is360 ? "360 campaign details" : "Annual appraisal details"}
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
          <input
            type="hidden"
            name="campaign_type"
            value={is360 ? "feedback_360" : "annual_appraisal"}
          />
          {is360 && (
            <>
              <label className="block text-sm font-medium">
                Person receiving feedback
                <select
                  name="subject_id"
                  required
                  className="mt-2 w-full rounded-lg border border-input bg-surface p-3"
                >
                  <option value="">Choose a person</option>
                  {people?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name || p.email}
                    </option>
                  ))}
                </select>
              </label>
              <fieldset>
                <legend className="text-sm font-medium">
                  Choose at least five reviewers
                </legend>
                <p className="mt-2 text-sm text-muted-foreground">
                  Select colleagues other than the person receiving feedback.
                  Relationship labels help organise invitations; results never
                  separate these groups.
                </p>
                <div className="mt-4 space-y-3">
                  {people?.map((p) => (
                    <div
                      key={p.id}
                      className="flex flex-wrap items-center gap-3"
                    >
                      <label className="flex flex-1 items-center gap-3">
                        <input
                          type="checkbox"
                          name="reviewer_id"
                          value={p.id}
                        />
                        {p.full_name || p.email}
                      </label>
                      <select
                        name={`relationship_${p.id}`}
                        aria-label={`Relationship for ${p.full_name || p.email}`}
                        className="rounded-lg border border-input bg-surface p-2 text-sm"
                      >
                        <option value="peer">Peer</option>
                        <option value="manager">Manager</option>
                        <option value="direct_report">Direct report</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  ))}
                </div>
              </fieldset>
              <section className="rounded-lg bg-surface p-4 text-sm leading-relaxed">
                <h2 className="font-semibold">Anonymity policy</h2>
                <p className="mt-2">
                  Your organisation receives combined feedback without reviewer
                  names or response times. Results require five reviewers and
                  campaign closure. Written comments may identify their author.
                  Trusted platform operators can access operational records.
                </p>
                <label className="mt-3 flex items-start gap-2">
                  <input type="checkbox" required name="privacy_ack" />I
                  understand the five-reviewer policy and written-comment
                  limitations.
                </label>
              </section>
            </>
          )}

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
              {is360 ? "Create draft & review" : "Create draft & choose people"}
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
