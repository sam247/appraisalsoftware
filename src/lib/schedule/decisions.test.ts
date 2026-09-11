import { describe, expect, it } from "vitest";
import {
  isCloseDue,
  isSendDue,
  nextReminderDue,
  nextRetryAt,
  shouldRetryOutbox,
} from "@/lib/schedule/decisions";
import {
  buildAppraisalInviteHtml,
  buildAppraisalInviteSubject,
} from "@/lib/email/appraisal-invite";
import { safeOutboxLog } from "@/lib/email/outbox-drain";

describe("schedule decisions", () => {
  const now = new Date("2026-09-11T12:00:00.000Z");

  it("detects scheduled activation due", () => {
    expect(
      isSendDue(
        {
          status: "scheduled",
          opens_at: "2026-09-11T11:00:00.000Z",
          send_claimed_at: null,
        },
        now,
      ),
    ).toBe(true);
    expect(
      isSendDue(
        {
          status: "scheduled",
          opens_at: "2026-09-11T11:00:00.000Z",
          send_claimed_at: "2026-09-11T11:05:00.000Z",
        },
        now,
      ),
    ).toBe(false);
    expect(
      isSendDue(
        {
          status: "draft",
          opens_at: "2026-09-11T11:00:00.000Z",
          send_claimed_at: null,
        },
        now,
      ),
    ).toBe(false);
  });

  it("detects campaign close due", () => {
    expect(
      isCloseDue(
        { status: "active", closes_at: "2026-09-11T11:00:00.000Z" },
        now,
      ),
    ).toBe(true);
    expect(
      isCloseDue(
        { status: "active", closes_at: "2026-09-12T11:00:00.000Z" },
        now,
      ),
    ).toBe(false);
    expect(
      isCloseDue({ status: "closed", closes_at: "2026-09-11T11:00:00.000Z" }, now),
    ).toBe(false);
  });

  it("cadence reminder eligibility", () => {
    const base = {
      settings: { enabled: true, strategy: "cadence" as const, cadenceDays: 3 },
      closesAt: "2026-09-30T00:00:00.000Z",
      lastRemindedAt: null as string | null,
      baselineAt: "2026-09-07T12:00:00.000Z",
      now,
      assignmentStatus: "sent",
      campaignStatus: "active",
    };
    expect(nextReminderDue(base).due).toBe(true);

    expect(
      nextReminderDue({
        ...base,
        baselineAt: "2026-09-10T12:00:00.000Z",
      }).due,
    ).toBe(false);
  });

  it("never reminds submitted, revoked, or closed", () => {
    const base = {
      settings: { enabled: true, strategy: "cadence" as const, cadenceDays: 1 },
      closesAt: "2026-09-30T00:00:00.000Z",
      lastRemindedAt: null,
      baselineAt: "2026-09-01T12:00:00.000Z",
      now,
      assignmentStatus: "sent",
      campaignStatus: "active",
    };
    expect(
      nextReminderDue({ ...base, assignmentStatus: "submitted" }).due,
    ).toBe(false);
    expect(nextReminderDue({ ...base, assignmentStatus: "revoked" }).due).toBe(
      false,
    );
    expect(nextReminderDue({ ...base, campaignStatus: "closed" }).due).toBe(
      false,
    );
  });

  it("reminder idempotency marker for cadence bucket", () => {
    const decision = nextReminderDue({
      settings: { enabled: true, strategy: "cadence", cadenceDays: 3 },
      closesAt: null,
      lastRemindedAt: null,
      baselineAt: "2026-09-01T12:00:00.000Z",
      now,
      assignmentStatus: "started",
      campaignStatus: "active",
    });
    expect(decision.due).toBe(true);
    expect(decision.marker).toBe("cadence:2026-09-11");
  });

  it("outbox retry bounds", () => {
    expect(shouldRetryOutbox(1)).toBe(true);
    expect(shouldRetryOutbox(5)).toBe(false);
    const retry = nextRetryAt(3, now);
    expect(retry.getTime()).toBe(now.getTime() + 8 * 60_000);
  });
});

describe("appraisal invite email", () => {
  it("builds self and manager copy without exposing raw token outside URL", () => {
    process.env.NEXT_PUBLIC_APP_ORIGIN = "https://app.appraisalsoftware.co.uk";
    const token = "abc123token";
    const self = buildAppraisalInviteHtml({
      campaign_name: "2026 Annual",
      relationship: "self",
      raw_token: token,
      org_name: "Acme Ltd",
      respondent_name: "Sam",
      subject_name: "Sam",
      closes_at: "2026-09-30T23:59:00.000Z",
    });
    expect(self.respondUrl).toBe(
      `https://app.appraisalsoftware.co.uk/r/${token}`,
    );
    expect(self.html).toContain("Acme Ltd");
    expect(self.html).toContain("self-appraisal");
    expect(self.html).toContain(self.respondUrl);
    // token only as part of URL path, not as labelled secret
    expect(self.html).not.toMatch(/raw[_ ]?token/i);
    expect(buildAppraisalInviteSubject({ relationship: "self", org_name: "Acme Ltd" })).toContain(
      "Acme Ltd",
    );

    const manager = buildAppraisalInviteHtml({
      campaign_name: "2026 Annual",
      relationship: "manager",
      raw_token: token,
      org_name: "Acme Ltd",
      respondent_name: "Alex",
      subject_name: "Sam Pettiford",
    });
    expect(manager.html).toContain("Sam Pettiford");
    expect(manager.html).toContain("Manager appraisal");
    expect(
      buildAppraisalInviteSubject({
        relationship: "manager",
        subject_name: "Sam Pettiford",
      }),
    ).toContain("Sam Pettiford");
  });
});

describe("outbox log safety", () => {
  it("does not include payload or token fields", () => {
    const log = safeOutboxLog({
      id: "1",
      kind: "appraisal_invite",
      to_email: "a@b.com",
      status: "sending",
      attempts: 1,
      idempotency_key: "invite:x",
    });
    expect(log).not.toHaveProperty("payload");
    expect(JSON.stringify(log)).not.toContain("raw_token");
  });
});
