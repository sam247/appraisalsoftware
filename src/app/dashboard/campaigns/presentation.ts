import type {
  Campaign,
  CampaignAssignment,
  CampaignStatus,
} from "@/lib/types/database";

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
    outstanding: inProgress + notStarted,
    percent: assignments.length
      ? Math.round((complete / assignments.length) * 100)
      : 0,
  };
}

export function campaignDate(
  value: string,
  timezone = "Europe/London",
  includeTime = false,
) {
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: timezone,
    ...(includeTime
      ? { hour: "2-digit", minute: "2-digit", timeZoneName: "short" as const }
      : {}),
  });
}

export function campaignTypeLabel(type: Campaign["campaign_type"]): string {
  return type === "feedback_360"
    ? "Anonymous 360"
    : "Annual appraisal";
}

export type SetupStep = {
  key: string;
  label: string;
  done: boolean;
};

export type SetupCompleteness = {
  steps: SetupStep[];
  doneCount: number;
  total: number;
  percent: number;
  ready: boolean;
  nextLabel: string;
};

/** Genuine draft setup completeness — not a cosmetic wizard. */
export function setupCompleteness(input: {
  campaign: Pick<Campaign, "campaign_type" | "template_id" | "name">;
  subjectCount: number;
  assignmentCount: number;
  questionCount: number;
}): SetupCompleteness {
  const is360 = input.campaign.campaign_type === "feedback_360";
  const hasPeople = is360
    ? input.subjectCount > 0 && input.assignmentCount >= 5
    : input.subjectCount > 0 && input.assignmentCount >= 1;
  const hasQuestions =
    !!input.campaign.template_id && input.questionCount > 0;
  const steps: SetupStep[] = is360
    ? [
        { key: "details", label: "Details", done: !!input.campaign.name.trim() },
        {
          key: "people",
          label: "Subject & reviewers",
          done: hasPeople,
        },
        { key: "questions", label: "Questions", done: hasQuestions },
        {
          key: "review",
          label: "Ready to send",
          done: hasPeople && hasQuestions,
        },
      ]
    : [
        { key: "details", label: "Details", done: !!input.campaign.name.trim() },
        { key: "people", label: "People", done: hasPeople },
        { key: "questions", label: "Questions", done: hasQuestions },
        {
          key: "review",
          label: "Ready to send",
          done: hasPeople && hasQuestions,
        },
      ];

  const doneCount = steps.filter((s) => s.done).length;
  const ready = hasPeople && hasQuestions;
  let nextLabel = "Continue setup";
  if (!hasPeople) {
    nextLabel = is360 ? "Add reviewers" : "Add people";
  } else if (!hasQuestions) {
    nextLabel = "Choose questions";
  } else {
    nextLabel = "Review and send";
  }

  return {
    steps,
    doneCount,
    total: steps.length,
    percent: Math.round((doneCount / steps.length) * 100),
    ready,
    nextLabel,
  };
}

export type AttentionKind =
  | "needs_setup"
  | "ready_to_send"
  | "scheduled"
  | "collecting"
  | "delivery_issue"
  | "ready_to_close"
  | "view_results";

export type AttentionItem = {
  campaign: Campaign;
  kind: AttentionKind;
  title: string;
  detail: string;
  actionLabel: string;
  priority: number;
};

export function buildAttentionItems(
  campaigns: Campaign[],
  assignments: CampaignAssignment[],
  subjectCounts: Record<string, number>,
): AttentionItem[] {
  const items: AttentionItem[] = [];

  for (const campaign of campaigns) {
    const campAssignments = assignments.filter(
      (a) => a.campaign_id === campaign.id,
    );
    const progress = responseProgress(campAssignments);
    const subjects = subjectCounts[campaign.id] ?? 0;
    const is360 = campaign.campaign_type === "feedback_360";
    const setup = setupCompleteness({
      campaign,
      subjectCount: subjects,
      assignmentCount: campAssignments.length,
      // Home does not load questions; template_id is the available signal.
      questionCount: campaign.template_id ? 1 : 0,
    });

    if (campaign.status === "draft") {
      if (setup.ready) {
        items.push({
          campaign,
          kind: "ready_to_send",
          title: campaign.name,
          detail: is360
            ? `${campAssignments.length} reviewers`
            : `${subjects} ${subjects === 1 ? "person" : "people"}`,
          actionLabel: "Review",
          priority: 20,
        });
      } else {
        items.push({
          campaign,
          kind: "needs_setup",
          title: campaign.name,
          detail: `${setup.percent}% ready · ${setup.nextLabel}`,
          actionLabel: setup.nextLabel === "Review and send" ? "Review" : setup.nextLabel,
          priority: 10,
        });
      }
      continue;
    }

    if (campaign.status === "scheduled") {
      items.push({
        campaign,
        kind: "scheduled",
        title: campaign.name,
        detail: campaign.opens_at
          ? `Sends ${campaignDate(campaign.opens_at, campaign.timezone, true)}`
          : "Scheduled to send",
        actionLabel: "Open",
        priority: 30,
      });
      continue;
    }

    if (campaign.status === "active") {
      if (progress.attention > 0) {
        items.push({
          campaign,
          kind: "delivery_issue",
          title: campaign.name,
          detail: `${progress.attention} invitation${progress.attention === 1 ? "" : "s"} failed`,
          actionLabel: "Fix",
          priority: 5,
        });
      }

      if (progress.outstanding > 0) {
        items.push({
          campaign,
          kind: "collecting",
          title: campaign.name,
          detail: `${progress.complete}/${progress.total}`,
          actionLabel: "Open",
          priority: 40,
        });
      } else if (progress.total > 0 && progress.complete === progress.total) {
        items.push({
          campaign,
          kind: "ready_to_close",
          title: campaign.name,
          detail: `${progress.complete}/${progress.total} · Ready to close`,
          actionLabel: "Close",
          priority: 25,
        });
      } else {
        items.push({
          campaign,
          kind: "collecting",
          title: campaign.name,
          detail: progress.total > 0 ? `${progress.complete}/${progress.total}` : "Collecting",
          actionLabel: "Open",
          priority: 45,
        });
      }
      continue;
    }

    if (campaign.status === "closed" && progress.complete > 0) {
      items.push({
        campaign,
        kind: "view_results",
        title: campaign.name,
        detail: `${progress.complete}/${progress.total}`,
        actionLabel: "Results",
        priority: 60,
      });
    }
  }

  return items.sort((a, b) => a.priority - b.priority);
}

/** One row per campaign for Home — keep the highest-priority attention signal. */
export function dedupeAttentionByCampaign(
  items: AttentionItem[],
): AttentionItem[] {
  const best = new Map<string, AttentionItem>();
  for (const item of items) {
    const prev = best.get(item.campaign.id);
    if (!prev || item.priority < prev.priority) {
      best.set(item.campaign.id, item);
    }
  }
  return [...best.values()].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return (
      new Date(b.campaign.updated_at ?? b.campaign.created_at).getTime() -
      new Date(a.campaign.updated_at ?? a.campaign.created_at).getTime()
    );
  });
}

export const HOME_WORK_LIMIT = 8;

export function homeWorkBadge(kind: AttentionKind): string {
  switch (kind) {
    case "needs_setup":
      return "Draft";
    case "ready_to_send":
      return "Ready to send";
    case "scheduled":
      return "Scheduled";
    case "collecting":
      return "Collecting";
    case "delivery_issue":
      return "Delivery issue";
    case "ready_to_close":
      return "Ready to close";
    case "view_results":
      return "Complete";
  }
}

export function homeWorkAction(kind: AttentionKind): string {
  switch (kind) {
    case "needs_setup":
      return "Continue";
    case "ready_to_send":
      return "Review";
    case "delivery_issue":
      return "Fix";
    case "ready_to_close":
      return "Close";
    case "view_results":
      return "Results";
    default:
      return "Open";
  }
}

export function homeWorkHref(item: AttentionItem): string {
  if (item.kind === "view_results") {
    return `/dashboard/campaigns/${item.campaign.id}/results`;
  }
  return `/dashboard/campaigns/${item.campaign.id}`;
}

export function statusTone(
  status: CampaignStatus | AttentionKind,
): "neutral" | "accent" | "warn" | "muted" {
  if (status === "delivery_issue") return "warn";
  if (
    status === "active" ||
    status === "collecting" ||
    status === "ready_to_send" ||
    status === "ready_to_close"
  )
    return "accent";
  if (status === "closed" || status === "view_results" || status === "archived")
    return "muted";
  return "neutral";
}
