import { describe, expect, it } from "vitest";
import {
  setupCompleteness,
  buildAttentionItems,
  responseProgress,
  homeWorkMeta,
  statusTone,
  dedupeAttentionByCampaign,
  campaignLocalDate,
  reminderSummary,
} from "./presentation";
import type { Campaign, CampaignAssignment } from "@/lib/types/database";

function campaign(
  overrides: Partial<Campaign> & Pick<Campaign, "id" | "name" | "status">,
): Campaign {
  return {
    organization_id: "org",
    campaign_type: "annual_appraisal",
    template_id: null,
    settings: {},
    reminder_settings: {},
    opens_at: null,
    closes_at: null,
    timezone: "Europe/London",
    questions_frozen_at: null,
    form_started_at: null,
    form_revision: 0,
    send_claimed_at: null,
    schedule_error: null,
    schedule_attempts: 0,
    cloned_from_campaign_id: null,
    created_by: null,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    ...overrides,
  };
}

describe("setupCompleteness", () => {
  it("keeps a campaign-specific invalid template override separate from a shared Annual template", () => {
    const annual = campaign({ id: "annual", name: "Annual", status: "draft", template_id: "shared", settings: { draft_delivery_mode: "now" } });
    const feedback = campaign({ ...annual, id: "feedback", name: "Feedback", campaign_type: "feedback_360" });
    const assignments = [
      { campaign_id: "annual", status: "pending" },
      ...Array.from({ length: 5 }, () => ({ campaign_id: "feedback", status: "pending" })),
    ] as CampaignAssignment[];
    const items = buildAttentionItems([annual, feedback], assignments, { annual: 1, feedback: 1 }, { shared: 2, feedback: 0 }, { feedback: 5 });
    expect(items.find((item) => item.campaign.id === "annual")?.kind).toBe("ready_to_send");
    expect(items.find((item) => item.campaign.id === "feedback")?.kind).toBe("needs_setup");
  });
  it("uses saved campaign questions for a scratch form without a template", () => {
    const draft = campaign({ id: "scratch", name: "Scratch", status: "draft", form_started_at: "2026-01-01", settings: { draft_delivery_mode: "now" } });
    expect(setupCompleteness({ campaign: draft, subjectCount: 1, assignmentCount: 1, questionCount: 1 }).ready).toBe(true);
    expect(setupCompleteness({ campaign: draft, subjectCount: 1, assignmentCount: 1, questionCount: 0 }).ready).toBe(false);
  });
  it("requires five 360 reviewers and saved timing", () => {
    const draft = campaign({ id: "360", name: "360", status: "draft", campaign_type: "feedback_360", template_id: "template", settings: { anonymity: { mode: "anonymous" }, draft_delivery_mode: "now" } });
    expect(setupCompleteness({ campaign: draft, subjectCount: 1, assignmentCount: 4, questionCount: 2 }).ready).toBe(false);
    expect(setupCompleteness({ campaign: draft, subjectCount: 1, assignmentCount: 5, questionCount: 2 }).ready).toBe(true);
    const assignments = Array.from({ length: 5 }, (_, i) => ({ campaign_id: "360", respondent_person_id: `r${i}`, subject_person_id: "subject", relationship: "peer", status: "pending" })) as CampaignAssignment[];
    expect(buildAttentionItems([draft], assignments, { "360": 1 }, { template: 2 }, { "360": 4 })[0].kind).toBe("needs_setup");
    expect(buildAttentionItems([draft], assignments, { "360": 1 }, { template: 2 }, { "360": 5 })[0].kind).toBe("ready_to_send");
  });
  it("formats campaign dates across GMT and BST for saved timing", () => {
    expect(campaignLocalDate("2026-03-29T08:00:00Z", "Europe/London")).toBe("2026-03-29");
    expect(campaignLocalDate("2026-10-25T09:00:00Z", "Europe/London")).toBe("2026-10-25");
  });
  it("shows only the reminder policy the scheduler actually runs", () => {
    expect(reminderSummary({ enabled: true, strategy: "cadence", cadenceDays: 3 })).toContain("Every 3 days");
    expect(reminderSummary({ enabled: true, strategy: "before_close", daysBeforeClose: [3] })).toBe("Automatic reminders off");
  });
  it("keeps legacy drafts incomplete until timing is explicitly saved", () => {
    const setup = setupCompleteness({
      campaign: campaign({ id: "legacy", name: "Legacy", status: "draft", template_id: "template" }),
      subjectCount: 1, assignmentCount: 1, questionCount: 2,
    });
    expect(setup.steps.map((s) => s.done)).toEqual([true, true, true, false]);
    expect(setup.nextLabel).toBe("Set timing");
    expect(setup.ready).toBe(false);
  });
  it("allows a self-only annual appraisal when every saved area is configured", () => {
    const setup = setupCompleteness({
      campaign: campaign({ id: "self", name: "Self only", status: "draft", template_id: "template", settings: { draft_delivery_mode: "now" } }),
      subjectCount: 1, assignmentCount: 1, questionCount: 1,
    });
    expect(setup.ready).toBe(true);
  });
  it("rejects a past scheduled instant and an empty template", () => {
    const draft = campaign({ id: "bad", name: "Bad", status: "draft", template_id: "template", settings: { draft_delivery_mode: "later" }, opens_at: "2000-01-01T09:00:00Z" });
    expect(setupCompleteness({ campaign: draft, subjectCount: 1, assignmentCount: 1, questionCount: 2 }).ready).toBe(false);
    expect(setupCompleteness({ campaign: { ...draft, settings: { draft_delivery_mode: "now" } }, subjectCount: 1, assignmentCount: 1, questionCount: 0 }).ready).toBe(false);
  });
  it("scores annual draft from real configuration", () => {
    const incomplete = setupCompleteness({
      campaign: campaign({
        id: "1",
        name: "Q1",
        status: "draft",
        template_id: null,
      }),
      subjectCount: 0,
      assignmentCount: 0,
      questionCount: 0,
    });
    expect(incomplete.percent).toBe(25);
    expect(incomplete.ready).toBe(false);
    expect(incomplete.nextLabel).toBe("Add people");

    const ready = setupCompleteness({
      campaign: campaign({
        id: "1",
        name: "Q1",
        status: "draft",
        template_id: "t1",
        settings: { draft_delivery_mode: "now" },
      }),
      subjectCount: 2,
      assignmentCount: 4,
      questionCount: 5,
    });
    expect(ready.ready).toBe(true);
    expect(ready.percent).toBe(100);
    expect(ready.nextLabel).toBe("Review and send");
  });
});

describe("buildAttentionItems", () => {
  it("surfaces drafts and collecting campaigns without analytics noise", () => {
    const draft = campaign({
      id: "d1",
      name: "Draft A",
      status: "draft",
      template_id: "t1",
    });
    const live = campaign({
      id: "a1",
      name: "Live A",
      status: "active",
    });
    const assignments: CampaignAssignment[] = [
      {
        id: "x",
        campaign_id: "a1",
        organization_id: "org",
        respondent_person_id: "p",
        subject_person_id: "s",
        relationship: "self",
        status: "sent",
        sent_at: null,
        submitted_at: null,
        last_reminded_at: null,
        created_at: "",
        updated_at: "",
      },
    ];
    const items = buildAttentionItems(
      [draft, live],
      assignments,
      { d1: 0, a1: 1 },
    );
    expect(items[0]?.kind).toBe("needs_setup");
    expect(items.some((i) => i.kind === "collecting")).toBe(true);
  });

  it("flags delivery issues with denser response counts on collecting", () => {
    const live = campaign({
      id: "a1",
      name: "Live A",
      status: "active",
    });
    const assignments: CampaignAssignment[] = [
      {
        id: "b",
        campaign_id: "a1",
        organization_id: "org",
        respondent_person_id: "p1",
        subject_person_id: "s",
        relationship: "self",
        status: "bounced",
        sent_at: null,
        submitted_at: null,
        last_reminded_at: null,
        created_at: "",
        updated_at: "",
      },
      {
        id: "s",
        campaign_id: "a1",
        organization_id: "org",
        respondent_person_id: "p2",
        subject_person_id: "s",
        relationship: "manager",
        status: "sent",
        sent_at: null,
        submitted_at: null,
        last_reminded_at: null,
        created_at: "",
        updated_at: "",
      },
    ];
    const items = buildAttentionItems([live], assignments, { a1: 1 });
    expect(items.find((i) => i.kind === "delivery_issue")?.actionLabel).toBe(
      "Fix",
    );
    expect(items.find((i) => i.kind === "collecting")?.detail).toBe("0/2");
  });
});

describe("responseProgress outstanding", () => {
  it("counts incomplete live responses", () => {
    expect(
      responseProgress([{ status: "sent" }, { status: "started" }, { status: "submitted" }])
        .outstanding,
    ).toBe(2);
  });
});

describe("homeWorkMeta and statusTone", () => {
  it("formats response counts for Your work rows", () => {
    const item = {
      campaign: campaign({ id: "1", name: "Q1", status: "active" }),
      kind: "collecting" as const,
      title: "Q1",
      detail: "0/1",
      actionLabel: "Open",
      priority: 40,
    };
    expect(homeWorkMeta(item)).toBe("Annual appraisal · 0 of 1 responses");
  });

  it("maps ready states to amber and live states to green", () => {
    expect(statusTone("ready_to_send")).toBe("ready");
    expect(statusTone("collecting")).toBe("accent");
    expect(statusTone("needs_setup")).toBe("neutral");
    expect(statusTone("delivery_issue")).toBe("warn");
    expect(statusTone("view_results")).toBe("muted");
  });
});

describe("dedupeAttentionByCampaign", () => {
  it("keeps the higher-priority signal per campaign", () => {
    const live = campaign({ id: "a1", name: "Live", status: "active" });
    const assignments: CampaignAssignment[] = [
      {
        id: "1",
        campaign_id: "a1",
        organization_id: "org",
        respondent_person_id: "p1",
        subject_person_id: "p1",
        relationship: "self",
        status: "bounced",
        sent_at: null,
        submitted_at: null,
        last_reminded_at: null,
        created_at: "2026-01-01",
        updated_at: "2026-01-01",
      },
      {
        id: "2",
        campaign_id: "a1",
        organization_id: "org",
        respondent_person_id: "p2",
        subject_person_id: "p1",
        relationship: "manager",
        status: "sent",
        sent_at: null,
        submitted_at: null,
        last_reminded_at: null,
        created_at: "2026-01-01",
        updated_at: "2026-01-01",
      },
    ];
    const items = buildAttentionItems([live], assignments, { a1: 1 });
    const deduped = dedupeAttentionByCampaign(items);
    expect(deduped).toHaveLength(1);
    expect(deduped[0]?.kind).toBe("delivery_issue");
  });
});
