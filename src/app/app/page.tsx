import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import CampaignList from "./campaigns/campaign-list";
import { responseProgress } from "./campaigns/presentation";
import type { Campaign, CampaignAssignment } from "@/lib/types/database";

export default async function OverviewPage() {
  const { org } = await requireOrgAdmin();
  const supabase = await createClient();
  const [campaignResult, peopleResult, assignmentResult] = await Promise.all([
    supabase
      .from("campaigns")
      .select("*")
      .eq("organization_id", org.id)
      .neq("status", "archived")
      .order("created_at", { ascending: false }),
    supabase
      .from("people")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", org.id)
      .is("archived_at", null),
    supabase
      .from("campaign_assignments")
      .select("*")
      .eq("organization_id", org.id),
  ]);
  if (campaignResult.error || peopleResult.error || assignmentResult.error)
    throw new Error("Unable to load your workspace");
  const campaigns = (campaignResult.data ?? []) as Campaign[];
  const assignments = (assignmentResult.data ?? []) as CampaignAssignment[];
  const hasPeople = (peopleResult.count ?? 0) > 0;
  const active = campaigns.filter((c) => c.status === "active");
  const draft = campaigns.find((c) => c.status === "draft");
  const progress = responseProgress(
    assignments.filter((a) => active.some((c) => c.id === a.campaign_id)),
  );
  const activeCampaign = active[0];
  const hasResults =
    activeCampaign &&
    activeCampaign.campaign_type !== "feedback_360" &&
    assignments.some(
      (a) => a.campaign_id === activeCampaign.id && a.status === "submitted",
    );
  const nextAction =
    !hasPeople && !campaigns.length
      ? { href: "/app/people", label: "Add people" }
      : draft
        ? {
            href: `/app/campaigns/${draft.id}`,
            label: "Continue appraisal setup",
          }
        : activeCampaign
          ? {
              href: `/app/campaigns/${activeCampaign.id}${hasResults ? "/results" : ""}`,
              label: hasResults ? "Review responses" : "Open active campaign",
            }
          : { href: "/app/campaigns/new", label: "Create appraisal" };
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-3">{org.name}</p>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
            {campaigns.length
              ? "Your appraisals, at a glance."
              : "Your first appraisal starts here."}
          </h1>
          <p className="mt-4 max-w-xl text-muted-foreground leading-relaxed">
            {campaigns.length
              ? "Keep your review cycles moving, from the first invitation to the final conversation."
              : "Bring people, reflection and manager feedback together in one annual appraisal campaign."}
          </p>
        </div>
        <Button asChild>
          <Link href={nextAction.href}>{nextAction.label}</Link>
        </Button>
      </div>
      {!campaigns.length ? (
        <section className="mt-10 bg-card rounded-2xl p-6 sm:p-9">
          <h2 className="font-display text-xl font-semibold">
            A clear path to your first review
          </h2>
          <ol className="mt-6 divide-y divide-border">
            {[
              [
                "Add your people",
                "Start with employees and their managers. No HR database to configure.",
                "/app/people",
                hasPeople ? "People added" : "Add people",
              ],
              [
                "Create an annual appraisal",
                "Name your campaign and choose a reusable question template.",
                "/app/campaigns/new",
                "Create appraisal",
              ],
              [
                "Review, then send",
                "Choose participants, check questions and send now or schedule for later.",
                "/app/campaigns/new",
                "Start with a draft",
              ],
            ].map(([title, text, href, label], i) => (
              <li key={title} className="flex gap-5 py-6">
                <span className="text-primary font-display text-2xl">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {text}
                  </p>
                  {i < 2 && (
                    <Link
                      href={href}
                      className="mt-3 inline-block text-sm text-primary underline underline-offset-4"
                    >
                      {label} →
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-5 text-sm text-muted-foreground">
            Annual appraisals are available today. 360 feedback and anonymous
            feedback are planned.
          </p>
        </section>
      ) : (
        <>
          <section
            aria-label="Active campaign summary"
            className="mt-10 flex flex-wrap gap-x-12 gap-y-6 py-6 border-y border-border"
          >
            {[
              [active.length, "Collecting responses"],
              [progress.complete, "Active responses complete"],
              [progress.inProgress, "Active responses in progress"],
              [progress.attention, "Delivery issues"],
            ].map(([value, label]) => (
              <div key={label}>
                <p className="font-display text-3xl font-semibold">{value}</p>
                <p className="mt-2 text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </section>
          <section className="mt-10">
            <div className="flex justify-between items-center gap-3">
              <h2 className="font-display text-xl font-semibold">Campaigns</h2>
              <Link href="/app/campaigns" className="text-sm text-primary">
                View all →
              </Link>
            </div>
            <CampaignList
              campaigns={campaigns.slice(0, 5)}
              assignments={assignments}
            />
          </section>
        </>
      )}
    </div>
  );
}
