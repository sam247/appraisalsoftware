import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { closeCampaign } from "../actions";
import AnnualDraftBuilder from "./annual-draft-builder";
import Feedback360DraftReview from "./feedback-360-draft-review";
import ActivateButton from "./activate-button";
import {
  campaignLabels,
  responseLabels,
  campaignDate,
  responseProgress,
  setupCompleteness,
  campaignTypeLabel,
  statusTone,
} from "../presentation";
import {
  StatusBadge,
  ResponseStrip,
  NextAction,
} from "../../chrome";
import type {
  Campaign,
  CampaignAssignment,
  CampaignSubject,
  Department,
  Person,
  TemplateQuestion,
  Template,
} from "@/lib/types/database";

export default async function CampaignDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; step?: string }>;
}) {
  const { id } = await params;
  const { error, step: stepParam } = await searchParams;
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
    deptResult,
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
    supabase
      .from("departments")
      .select("id, name")
      .eq("organization_id", org.id)
      .order("name"),
  ]);
  if (
    [
      subjectResult,
      assignmentResult,
      peopleResult,
      questionResult,
      templateResult,
      deptResult,
    ].some((r) => r.error)
  )
    throw new Error("Unable to load campaign details");
  const subjects = (subjectResult.data ?? []) as CampaignSubject[];
  const assignments = (assignmentResult.data ??
    []) as unknown as CampaignAssignment[];
  const people = (peopleResult.data ?? []) as Person[];
  const questions = (questionResult.data ?? []) as TemplateQuestion[];
  const templates = (templateResult.data ?? []) as Template[];
  const departments = (deptResult.data ?? []) as Department[];
  const peopleById = Object.fromEntries(people.map((p) => [p.id, p]));
  const progress = responseProgress(assignments);
  const setup = setupCompleteness({
    campaign,
    subjectCount: subjects.length,
    assignmentCount: assignments.length,
    questionCount: questions.length,
  });
  const ready = setup.ready;
  const initialSubjects = subjects.map((s) => ({
    personId: s.person_id,
    managerPersonId:
      assignments.find(
        (a) =>
          a.subject_person_id === s.person_id && a.relationship === "manager",
      )?.respondent_person_id ?? null,
  }));
  const templateName =
    templates.find((t) => t.id === campaign.template_id)?.name ?? null;

  if (campaign.status === "draft" && !is360) {
    const step =
      stepParam === "review" || (subjects.length > 0 && stepParam !== "people")
        ? "review"
        : "people";
    return (
      <>
        {error && (
          <p
            role="alert"
            className="mb-4 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        )}
        <AnnualDraftBuilder
          key={`${JSON.stringify(initialSubjects)}-${step}`}
          campaignId={id}
          campaignName={campaign.name}
          templateName={templateName}
          questionCount={questions.length}
          questions={questions}
          closesAt={campaign.closes_at}
          timezone={campaign.timezone}
          people={people
            .filter((p) => !p.archived_at)
            .map((p) => ({
              id: p.id,
              full_name: p.full_name,
              email: p.email,
              department_id: p.department_id,
              manager_person_id: p.manager_person_id,
            }))}
          departments={departments.map((d) => ({ id: d.id, name: d.name }))}
          initialSubjects={initialSubjects}
          ready={ready}
          initialStep={step}
        />
      </>
    );
  }

  if (campaign.status === "draft" && is360) {
    return (
      <>
        {error && (
          <p
            role="alert"
            className="mb-4 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        )}
        <Feedback360DraftReview
          campaign={campaign}
          subject={peopleById[subjects[0]?.person_id] ?? null}
          assignments={assignments}
          peopleById={peopleById}
          questions={questions}
          templateName={templateName}
          ready={ready}
        />
      </>
    );
  }

  const meta = [
    campaignTypeLabel(campaign.campaign_type),
    campaign.closes_at
      ? `Closes ${campaignDate(campaign.closes_at, campaign.timezone)}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const showResults =
    ["active", "closed"].includes(campaign.status) &&
    progress.complete > 0 &&
    (!is360 || campaign.status === "closed");

  const responseMeta = [
    progress.outstanding > 0
      ? `${progress.outstanding} outstanding`
      : progress.total > 0
        ? "All responses in"
        : null,
    progress.inProgress > 0 ? `${progress.inProgress} in progress` : null,
    campaign.closes_at
      ? `Closes ${campaignDate(campaign.closes_at, campaign.timezone)}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-5">
      <header>
        <Link
          href="/dashboard/campaigns"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← Campaigns
        </Link>

        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={statusTone(campaign.status)}>
                {campaignLabels[campaign.status]}
              </StatusBadge>
              <h1 className="text-xl font-medium tracking-tight text-foreground">
                {campaign.name}
              </h1>
            </div>
            {meta && (
              <p className="mt-0.5 text-xs text-muted-foreground">{meta}</p>
            )}
          </div>
          {showResults && (
            <Button asChild size="sm">
              <Link href={`/dashboard/campaigns/${id}/results`}>
                View results
              </Link>
            </Button>
          )}
        </div>

        <div className="mt-4 border-t border-border pt-3">
          {campaign.status === "scheduled" && (
            <ResponseStrip
              label={
                campaign.opens_at
                  ? `Scheduled · Sends ${campaignDate(campaign.opens_at, campaign.timezone, true)}`
                  : "Scheduled to send"
              }
              complete={progress.complete}
              total={progress.total}
              percent={progress.percent}
              meta="Invitations go out automatically. Questions are locked."
            />
          )}
          {campaign.status === "active" && (
            <ResponseStrip
              label="Collecting responses"
              complete={progress.complete}
              total={progress.total}
              percent={progress.percent}
              meta={responseMeta}
              attention={
                progress.attention > 0
                  ? `${progress.attention} invitation${progress.attention === 1 ? "" : "s"} could not be delivered`
                  : undefined
              }
            />
          )}
          {campaign.status === "closed" && (
            <ResponseStrip
              label="Closed"
              complete={progress.complete}
              total={progress.total}
              percent={progress.percent}
              meta={
                showResults
                  ? "Results are ready for the review conversation."
                  : "No submitted responses to show."
              }
            />
          )}
        </div>

        <div className="mt-3">
          <CockpitNext
            campaign={campaign}
            progress={progress}
            is360={is360}
            id={id}
            showResults={showResults}
          />
        </div>
      </header>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      {campaign.schedule_error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          Invitations could not be sent on schedule: {campaign.schedule_error}
        </p>
      )}

      {campaign.status === "scheduled" && (
        <details className="text-sm">
          <summary className="cursor-pointer font-medium text-primary">
            Need to send earlier?
          </summary>
          <div className="mt-2">
            <ActivateButton campaignId={id} label="Send now instead" />
          </div>
        </details>
      )}

      {is360 && campaign.status === "active" && (
        <p className="text-xs text-muted-foreground">
          {progress.complete >= 5
            ? "Five-reviewer minimum met. "
            : "At least five reviewers must complete feedback. "}
          Results unlock after closure.
        </p>
      )}

      <section>
        <h2 className="text-sm font-semibold text-foreground">Participants</h2>
        <div className="mt-2 divide-y divide-border border-t border-border">
          {assignments.map((a) => (
            <div
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-2 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium break-words">
                  {peopleById[a.respondent_person_id]?.full_name ??
                    peopleById[a.respondent_person_id]?.email ??
                    "Archived reviewer"}
                </p>
                <p className="text-xs text-muted-foreground">
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
                className={`text-xs font-medium ${
                  a.status === "submitted"
                    ? "text-primary"
                    : a.status === "bounced"
                      ? "text-destructive"
                      : "text-muted-foreground"
                }`}
              >
                {responseLabels[a.status] ?? a.status}
              </span>
            </div>
          ))}
          {!assignments.length && (
            <p className="py-3 text-sm text-muted-foreground">
              No participants in this appraisal.
            </p>
          )}
        </div>
      </section>

      {campaign.status === "active" && (
        <details className="border-t border-border pt-3">
          <summary className="cursor-pointer text-sm text-muted-foreground">
            Close this appraisal
          </summary>
          <p className="mt-2 text-sm text-muted-foreground">
            Closing stops further submissions. Submitted responses stay
            available.
          </p>
          <form action={closeCampaign.bind(null, id)} className="mt-2">
            <Button variant="outline" type="submit" size="sm">
              Close appraisal
            </Button>
          </form>
        </details>
      )}
    </div>
  );
}

function CockpitNext({
  campaign,
  progress,
  is360,
  id,
  showResults,
}: {
  campaign: Campaign;
  progress: ReturnType<typeof responseProgress>;
  is360: boolean;
  id: string;
  showResults: boolean;
}) {
  if (campaign.status === "scheduled") {
    return (
      <NextAction
        compact
        label="Waiting to send"
        detail={
          campaign.opens_at
            ? `Invitations go out ${campaignDate(campaign.opens_at, campaign.timezone, true)}.`
            : "This appraisal is scheduled."
        }
      />
    );
  }

  if (campaign.status === "active") {
    if (progress.attention > 0) {
      return (
        <NextAction
          compact
          tone="warn"
          label="Fix delivery"
          detail={`${progress.attention} invitation${progress.attention === 1 ? "" : "s"} bounced. Update emails in People.`}
        />
      );
    }
    if (progress.outstanding === 0 && progress.total > 0) {
      return (
        <NextAction
          compact
          label={is360 ? "Close to unlock results" : "Review and close"}
          detail={
            is360
              ? "All responses are in. Close to release anonymous results."
              : "All responses are in."
          }
        >
          {showResults ? (
            <Button asChild size="sm">
              <Link href={`/dashboard/campaigns/${id}/results`}>
                View results
              </Link>
            </Button>
          ) : null}
        </NextAction>
      );
    }
    return (
      <NextAction
        compact
        label={
          progress.outstanding === 1
            ? "Waiting for 1 response"
            : `Waiting for ${progress.outstanding} responses`
        }
        detail={`${progress.complete} of ${progress.total} complete`}
      />
    );
  }

  if (campaign.status === "closed") {
    return (
      <NextAction
        compact
        label={showResults ? "View results" : "Appraisal closed"}
        detail={
          showResults
            ? "Open results for the review conversation."
            : "No submitted responses to show."
        }
        href={
          showResults ? `/dashboard/campaigns/${id}/results` : undefined
        }
      />
    );
  }

  return null;
}
