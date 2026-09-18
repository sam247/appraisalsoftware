import { describe, expect, it } from "vitest";
import { campaignDate } from "@/app/app/campaigns/presentation";
import { buildAppraisalInviteHtml } from "@/lib/email/appraisal-invite";

describe("timezone presentation", () => {
  it("formats the same local send time on both sides of GMT/BST transitions", () => {
    for (const [instant, abbreviation] of [
      ["2026-03-28T09:00:00Z", "GMT"],
      ["2026-03-29T08:00:00Z", "BST"],
      ["2026-10-24T08:00:00Z", "BST"],
      ["2026-10-25T09:00:00Z", "GMT"],
    ]) {
      const display = campaignDate(instant, "Europe/London", true);
      expect(display).toContain("09:00");
      expect(display).toContain(abbreviation);
    }
  });
  it("uses the campaign timezone rather than the runtime timezone for email deadlines", () => {
    const output = buildAppraisalInviteHtml({
      raw_token: "fixture-token",
      closes_at: "2026-07-01T23:00:00Z",
      timezone: "Europe/London",
    });
    expect(output.text).toContain("Thursday, 2 July 2026");
    expect(
      buildAppraisalInviteHtml({
        raw_token: "fixture-token",
        closes_at: "2026-07-01T23:00:00Z",
        timezone: "America/New_York",
      }).text,
    ).toContain("Wednesday, 1 July 2026");
  });
  it("uses the UK timezone for historic outbox payloads without timezone metadata", () => {
    expect(
      buildAppraisalInviteHtml({
        raw_token: "fixture-token",
        closes_at: "2026-07-01T22:59:59.999Z",
      }).text,
    ).toContain("Wednesday, 1 July 2026");
  });
});
