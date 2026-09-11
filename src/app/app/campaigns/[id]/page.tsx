import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { closeCampaign } from "../actions";
import ActivateButton from "./activate-button";
import AssignWizard from "./assign-wizard";
import type {
  Campaign,
  CampaignAssignment,
  CampaignSubject,
  Person,
} from "@/lib/types/database";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let orgAdmin;
  try {
    orgAdmin = await requireOrgAdmin();
  } catch {
    redirect("/login");
  }

  const supabase = await createClient();

  const { data: rawCampaign } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .eq("organization_id", orgAdmin.org.id)
    .single();

  if (!rawCampaign) notFound();
  const campaign = rawCampaign as Campaign;

  const { data: rawSubjects } = await supabase
    .from("campaign_subjects")
    .select("*")
    .eq("campaign_id", id)
    .eq("organization_id", orgAdmin.org.id);

  const subjects = (rawSubjects ?? []) as CampaignSubject[];

  const { data: rawAssignments } = await supabase
    .from("campaign_assignments")
    .select("*")
    .eq("campaign_id", id)
    .eq("organization_id", orgAdmin.org.id)
    .order("created_at");

  const assignments = (rawAssignments ?? []) as CampaignAssignment[];

  // Fetch all people for wizard + display
  const { data: rawPeople } = await supabase
    .from("people")
    .select("id, full_name, email, manager_person_id, job_title")
    .eq("organization_id", orgAdmin.org.id)
    .is("archived_at", null)
    .order("full_name");

  const people = (rawPeople ?? []) as Person[];
  const peopleById = Object.fromEntries(people.map((p) => [p.id, p]));

  // Completion counts
  const submitted = assignments.filter((a) => a.status === "submitted").length;
  const total = assignments.length;

  const doClose = closeCampaign.bind(null, id);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/app/campaigns"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Campaigns
            </Link>
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            {campaign.name}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <StatusBadge status={campaign.status} />
            {campaign.closes_at && (
              <span className="text-xs text-muted-foreground">
                Closes{" "}
                {new Date(campaign.closes_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {campaign.status === "draft" && assignments.length > 0 && (
            <ActivateButton campaignId={id} />
          )}
          {campaign.status === "active" && (
            <form action={doClose}>
              <Button variant="outline" size="sm" type="submit">
                Close campaign
              </Button>
            </form>
          )}
          {(campaign.status === "active" || campaign.status === "closed") &&
            submitted > 0 && (
              <Link href={`/app/campaigns/${id}/results`}>
                <Button variant="outline" size="sm">
                  View results
                </Button>
              </Link>
            )}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Subjects" value={subjects.length} />
        <StatCard label="Assignments" value={total} />
        <StatCard
          label="Completed"
          value={`${submitted} / ${total}`}
          highlight={submitted > 0}
        />
      </div>

      {/* Assignment list */}
      {assignments.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-sm font-semibold text-foreground mb-3">
            Assignments
          </h2>
          <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
            {assignments.map((a) => {
              const respondent = peopleById[a.respondent_person_id];
              const subject = a.subject_person_id
                ? peopleById[a.subject_person_id]
                : null;
              return (
                <div
                  key={a.id}
                  className="flex items-center justify-between px-5 py-3.5"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {respondent?.full_name ?? respondent?.email ?? "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {a.relationship
                        ? RELATIONSHIP_LABELS[a.relationship] ?? a.relationship
                        : "—"}
                      {subject
                        ? ` · about ${subject.full_name ?? subject.email}`
                        : ""}
                    </p>
                  </div>
                  <AssignmentStatusBadge status={a.status} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Wizard — only show when draft */}
      {campaign.status === "draft" && (
        <AssignWizard campaignId={id} people={people} />
      )}

      {campaign.status === "draft" && assignments.length === 0 && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Add subjects above, then click{" "}
          <strong>Send now</strong> to activate.
        </div>
      )}

      {campaign.status === "draft" && assignments.length > 0 && (
        <div className="mt-4 rounded-lg border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
          Ready to send? Click <strong>Send now</strong> to activate the
          campaign and queue invite emails.
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    scheduled: "bg-blue-50 text-blue-700",
    active: "bg-emerald-50 text-emerald-700",
    closed: "bg-muted text-muted-foreground",
    archived: "bg-muted text-muted-foreground",
  };
  const labels: Record<string, string> = {
    draft: "Draft",
    scheduled: "Scheduled",
    active: "Active",
    closed: "Closed",
    archived: "Archived",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] ?? "bg-muted text-muted-foreground"}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

function AssignmentStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-muted text-muted-foreground",
    sent: "bg-blue-50 text-blue-600",
    opened: "bg-blue-50 text-blue-700",
    started: "bg-amber-50 text-amber-700",
    submitted: "bg-emerald-50 text-emerald-700",
    bounced: "bg-destructive/10 text-destructive",
    revoked: "bg-muted text-muted-foreground line-through",
  };
  const labels: Record<string, string> = {
    pending: "Pending",
    sent: "Sent",
    opened: "Opened",
    started: "In progress",
    submitted: "Submitted",
    bounced: "Bounced",
    revoked: "Revoked",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] ?? ""}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-5 py-4 ${highlight ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-display font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  self: "Self",
  manager: "Manager",
  peer: "Peer",
  direct_report: "Direct report",
  other: "Other",
};
