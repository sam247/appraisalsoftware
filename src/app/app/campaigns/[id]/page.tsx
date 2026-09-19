import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { closeCampaign, setCampaignTemplate } from "../actions";
import ActivateButton from "./activate-button";
import DraftSetup from "./draft-setup";
import SendControls from "./send-controls";
import {
  campaignLabels,
  responseLabels,
  campaignDate,
  responseProgress,
} from "../presentation";
import type {
  Campaign,
  CampaignAssignment,
  CampaignSubject,
  Person,
  TemplateQuestion,
  Template,
} from "@/lib/types/database";

export default async function CampaignDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const { org } = await requireOrgAdmin();
  const supabase = await createClient();
  const result = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .eq("organization_id", org.id)
    .single();
  if (result.error && result.error.code !== "PGRST116")
    throw new Error("Unable to load this campaign");
  if (!result.data) notFound();
  const campaign = result.data as Campaign;
  const is360 = campaign.campaign_type === "feedback_360";
  const [
    subjectResult,
    assignmentResult,
    peopleResult,
    questionResult,
    templateResult,
  ] = await Promise.all([
    supabase
      .from("campaign_subjects")
      .select("*")
      .eq("campaign_id", id)
      .eq("organization_id", org.id),
    supabase
      .from("campaign_assignments")
      .select(
        "id,campaign_id,organization_id,respondent_person_id,subject_person_id,relationship,status",
      )
      .eq("campaign_id", id)
      .eq("organization_id", org.id)
      .order("respondent_person_id"),
    supabase
      .from("people")
      .select("*")
      .eq("organization_id", org.id)
      .order("full_name"),
    campaign.questions_frozen_at
      ? supabase
          .from("campaign_questions")
          .select("*")
          .eq("campaign_id", id)
          .eq("organization_id", org.id)
          .order("sort_order")
      : supabase
          .from("template_questions")
          .select("*")
          .eq(
            "template_id",
            campaign.template_id ?? "00000000-0000-0000-0000-000000000000",
          )
          .eq("organization_id", org.id)
          .order("sort_order"),
    supabase
      .from("templates")
      .select("*")
      .eq("organization_id", org.id)
      .is("archived_at", null)
      .order("name"),
  ]);
  if (
    [
      subjectResult,
      assignmentResult,
      peopleResult,
      questionResult,
      templateResult,
    ].some((r) => r.error)
  )
    throw new Error("Unable to load campaign details");
  const subjects = (subjectResult.data ?? []) as CampaignSubject[];
  const assignments = (assignmentResult.data ??
    []) as unknown as CampaignAssignment[];
  const people = (peopleResult.data ?? []) as Person[];
  const questions = (questionResult.data ?? []) as TemplateQuestion[];
  const templates = (templateResult.data ?? []) as Template[];
  const peopleById = Object.fromEntries(people.map((p) => [p.id, p]));
  const progress = responseProgress(assignments);
  const ready =
    subjects.length > 0 &&
    assignments.length >= (is360 ? 5 : 1) &&
    questions.length > 0 &&
    !!campaign.template_id;
  const initialSubjects = subjects.map((s) => ({
    personId: s.person_id,
    managerPersonId:
      assignments.find(
        (a) =>
          a.subject_person_id === s.person_id && a.relationship === "manager",
      )?.respondent_person_id ?? null,
  }));
  return (
    <div>
      <Link
        href="/app/campaigns"
        className="text-sm text-muted-foreground hover:text-primary"
      >
        ← Campaigns
      </Link>
      <div className="mt-5 flex flex-wrap justify-between items-start gap-5">
        <div className="min-w-0">
          <p className="text-sm font-medium text-primary mb-3">
            {campaignLabels[campaign.status]}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight break-words">
            {campaign.name}
          </h1>
          <p className="mt-4 text-muted-foreground">
            {is360
              ? "Anonymous 360 · Combined reviewer feedback"
              : "Annual appraisal · Self and manager feedback"}
            {campaign.closes_at
              ? ` · Closes ${campaignDate(campaign.closes_at, campaign.timezone)}`
              : ""}
          </p>
        </div>
        {["active", "closed"].includes(campaign.status) &&
          progress.complete > 0 &&
          (!is360 || campaign.status === "closed") && (
            <Button asChild>
              <Link href={`/app/campaigns/${id}/results`}>View results</Link>
            </Button>
          )}
      </div>
      {error && (
        <p
          role="alert"
          className="mt-6 rounded-lg bg-destructive/5 p-4 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      {campaign.schedule_error && (
        <p role="alert" className="mt-6 text-sm text-destructive">
          Invitations could not be sent on schedule: {campaign.schedule_error}
        </p>
      )}
      {campaign.status === "scheduled" && campaign.opens_at && (
        <section className="mt-8 rounded-xl bg-card p-6">
          <h2 className="font-display text-lg font-semibold">
            Scheduled for{" "}
            {campaignDate(campaign.opens_at, campaign.timezone, true)}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Invitations will be queued automatically. The campaign questions are
            locked.
          </p>
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-primary">
              Need to send earlier?
            </summary>
            <div className="mt-4">
              <ActivateButton campaignId={id} label="Send now instead" />
            </div>
          </details>
        </section>
      )}
      <nav
        aria-label="Campaign sections"
        className="mt-8 flex flex-wrap gap-6 border-b border-border pb-4 text-sm"
      >
        <a href="#overview" className="text-primary">
          Overview
        </a>
        <a href="#participants">Participants</a>
        <Link href={`/app/campaigns/${id}/results`}>Results</Link>
      </nav>
      <section id="overview" className="scroll-mt-20 mt-8">
        <h2 className="sr-only">Campaign overview</h2>
        <div className="flex flex-wrap gap-x-10 gap-y-5">
          {[
            [subjects.length, "People being reviewed"],
            [progress.complete, "Responses complete"],
            [progress.inProgress, "In progress"],
            [progress.notStarted, "Not started"],
          ].map(([value, label]) => (
            <div key={label}>
              <p className="font-display text-3xl font-semibold">{value}</p>
              <p className="mt-2 text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
        {progress.total > 0 && (
          <div className="mt-6">
            <progress
              aria-label="Response completion"
              max={progress.total}
              value={progress.complete}
              className="h-2 w-full accent-primary"
            />
            <p className="mt-2 text-sm text-muted-foreground">
              {progress.complete} of {progress.total} expected responses
              complete
              {progress.revoked
                ? ` · ${progress.revoked} closed without submission`
                : ""}
            </p>
          </div>
        )}
        {progress.attention > 0 && (
          <p className="mt-4 text-sm text-destructive">
            {progress.attention} invitation{progress.attention === 1 ? "" : "s"}{" "}
            could not be delivered. Check the reviewer’s email address in
            People.
          </p>
        )}
      </section>
      {is360 && (
        <p className="mt-6 rounded-xl bg-card p-5 text-sm leading-relaxed">
          {progress.complete >= 5
            ? "The five-reviewer minimum is met. "
            : "At least five reviewers must complete their feedback. "}
          Results are unavailable until closure; each reported question also
          needs five answers. No relationship-level results are released.
          Automatic reminders go to outstanding reviewers every three days.
        </p>
      )}
      <section id="participants" className="mt-10 scroll-mt-20">
        <h2 className="font-display text-xl font-semibold">Participants</h2>
        {campaign.status === "draft" ? (
          is360 ? (
            <section className="mt-5 rounded-xl bg-card p-6 sm:p-8">
              <h3 className="font-display text-xl font-semibold">
                Review before sending
              </h3>
              <p className="mt-3 text-sm">
                Feedback for{" "}
                {peopleById[subjects[0]?.person_id]?.full_name ||
                  peopleById[subjects[0]?.person_id]?.email}{" "}
                · {assignments.length} reviewers · {questions.length} questions
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                This campaign combines all reviewers anonymously. Results
                require five responses and closure. Saved subject, reviewers and
                questions are locked; create a fresh draft to change the setup.
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {assignments.map((a) => (
                  <li key={a.id}>
                    {peopleById[a.respondent_person_id]?.full_name ||
                      peopleById[a.respondent_person_id]?.email}{" "}
                    · {(a.relationship || "other").replaceAll("_", " ")}
                  </li>
                ))}
              </ul>
              <details className="mt-5">
                <summary className="cursor-pointer text-primary text-sm">
                  Review questions
                </summary>
                <ol className="mt-3 list-decimal space-y-2 pl-5">
                  {questions.map((q) => (
                    <li key={q.id}>{q.prompt}</li>
                  ))}
                </ol>
              </details>
              {ready && (
                <SendControls feedback campaignId={id} timezone={campaign.timezone} />
              )}
            </section>
          ) : (
            <DraftSetup
              key={JSON.stringify(initialSubjects)}
              campaignId={id}
              people={people}
              initialSubjects={initialSubjects}
            >
              <section className="mt-10 bg-card rounded-2xl p-6 sm:p-8">
                <h2 className="font-display text-xl font-semibold">
                  Review before sending
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  {subjects.length} saved participants · {progress.total} email
                  invitations · {questions.length} questions
                </p>
                {(!campaign.template_id || !questions.length) && (
                  <form
                    action={setCampaignTemplate.bind(null, id)}
                    className="mt-5 space-y-3"
                  >
                    <label
                      htmlFor="repair-template"
                      className="block text-sm font-medium"
                    >
                      Choose a question template to continue
                    </label>
                    <select
                      id="repair-template"
                      name="template_id"
                      required
                      className="w-full rounded-lg border border-input p-3 bg-surface"
                    >
                      <option value="">Choose a template</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <Button type="submit" variant="outline">
                      Save template
                    </Button>
                  </form>
                )}
                <details className="mt-5">
                  <summary className="cursor-pointer text-sm text-primary">
                    Review campaign questions
                  </summary>
                  <ol className="mt-4 space-y-4 list-decimal pl-5">
                    {questions.map((q) => (
                      <li key={q.id} className="text-sm leading-relaxed">
                        {q.prompt}
                        {q.required && (
                          <span className="text-muted-foreground">
                            {" "}
                            (required)
                          </span>
                        )}
                      </li>
                    ))}
                  </ol>
                  {campaign.template_id && !campaign.questions_frozen_at && (
                    <Link
                      href={`/app/templates/${campaign.template_id}`}
                      className="mt-4 inline-block text-sm text-primary underline"
                    >
                      Edit this reusable template
                    </Link>
                  )}
                </details>
                {ready ? (
                  <SendControls campaignId={id} timezone={campaign.timezone} />
                ) : (
                  <p className="mt-6 text-sm text-muted-foreground">
                    Save at least one participant and choose a template with
                    questions before sending.
                  </p>
                )}
              </section>
            </DraftSetup>
          )
        ) : (
          <div className="mt-4 divide-y divide-border">
            {assignments.map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap justify-between items-center gap-3 py-4"
              >
                <div className="min-w-0">
                  <p className="font-medium break-words">
                    {peopleById[a.respondent_person_id]?.full_name ??
                      peopleById[a.respondent_person_id]?.email ??
                      "Archived reviewer"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {is360
                      ? (a.relationship || "other").replaceAll("_", " ")
                      : a.relationship === "self"
                        ? "Self appraisal"
                        : "Manager review"}{" "}
                    ·{" "}
                    {a.subject_person_id
                      ? (peopleById[a.subject_person_id]?.full_name ??
                        peopleById[a.subject_person_id]?.email ??
                        "Archived employee")
                      : "Employee review"}
                  </p>
                </div>
                <span
                  className={`text-sm ${a.status === "submitted" ? "text-primary" : a.status === "bounced" ? "text-destructive" : "text-muted-foreground"}`}
                >
                  {responseLabels[a.status] ?? a.status}
                </span>
              </div>
            ))}
            {!assignments.length && (
              <p className="mt-4 text-muted-foreground">
                No participants in this campaign.
              </p>
            )}
          </div>
        )}
      </section>

      {campaign.status === "active" && (
        <details className="mt-10 border-t border-border pt-6">
          <summary className="cursor-pointer text-sm text-muted-foreground">
            Close this campaign
          </summary>
          <p className="mt-4 text-sm text-muted-foreground">
            Closing prevents further submissions and removes access for
            outstanding reviewers. Submitted results remain available.
          </p>
          <form action={closeCampaign.bind(null, id)} className="mt-4">
            <Button variant="outline" type="submit">
              Close campaign
            </Button>
          </form>
        </details>
      )}
    </div>
  );
}
