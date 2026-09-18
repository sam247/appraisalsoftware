import type { CampaignAssignment } from "@/lib/types/database";

export const campaignLabels: Record<string, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  active: "Collecting responses",
  closed: "Closed",
  archived: "Archived",
};
export const responseLabels: Record<string, string> = {
  pending: "Not sent",
  sent: "Not started",
  opened: "Opened",
  started: "In progress",
  submitted: "Complete",
  bounced: "Delivery failed",
  revoked: "Access closed",
};

export function responseProgress(
  assignments: Pick<CampaignAssignment, "status">[],
) {
  const complete = assignments.filter((a) => a.status === "submitted").length;
  const inProgress = assignments.filter((a) => a.status === "started").length;
  const notStarted = assignments.filter((a) =>
    ["pending", "sent", "opened"].includes(a.status),
  ).length;
  const attention = assignments.filter((a) => a.status === "bounced").length;
  const revoked = assignments.filter((a) => a.status === "revoked").length;
  return {
    total: assignments.length,
    complete,
    inProgress,
    notStarted,
    attention,
    revoked,
    percent: assignments.length
      ? Math.round((complete / assignments.length) * 100)
      : 0,
  };
}

export function campaignDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/London",
  });
}
