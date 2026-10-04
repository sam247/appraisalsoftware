import { describe, expect, it } from "vitest";
import type { Campaign } from "@/lib/types/database";
import { hasLaunchedCampaign, onboardingState } from "./workspace-state";
import { belongsInReports, filterReports, reportAvailability, type ReportEntry } from "./reports/presentation";

const campaign = (values: Partial<Campaign> = {}): Campaign => ({
  id: "draft", name: "Annual review", campaign_type: "annual_appraisal", status: "draft",
  questions_frozen_at: null, send_claimed_at: null, updated_at: "2026-10-01T00:00:00Z", ...values,
}) as Campaign;

describe("workspace onboarding from saved state", () => {
  it("starts empty and follows saved people and readiness", () => {
    expect(onboardingState([], 0, new Set()).percent).toBe(0);
    expect(onboardingState([campaign()], 1, new Set()).percent).toBe(33);
    expect(onboardingState([campaign()], 1, new Set(["draft"])).percent).toBe(67);
  });
  it("resumes the most recently updated draft without mutating the input", () => {
    const older = campaign();
    const newer = campaign({ id: "new", updated_at: "2026-10-03T00:00:00Z" });
    const campaigns = [older, newer];
    const state = onboardingState(campaigns, 1, new Set([older.id]));
    expect(state.draft?.id).toBe("new");
    expect(state.steps[1].done).toBe(true);
    expect(campaigns[0]).toBe(older);
  });
  it.each(["scheduled", "active", "closed"] as const)("completes after %s even if people later disappear", (status) => {
    expect(onboardingState([campaign({ status })], 0, new Set()).percent).toBe(100);
  });
  it("distinguishes archived drafts from archived launched campaigns", () => {
    expect(hasLaunchedCampaign(campaign({ status: "archived" }))).toBe(false);
    expect(hasLaunchedCampaign(campaign({ status: "archived", questions_frozen_at: "2026-10-01" }))).toBe(true);
    expect(hasLaunchedCampaign(campaign({ status: "archived", send_claimed_at: "2026-10-01" }))).toBe(true);
    expect(hasLaunchedCampaign(campaign({ status: "draft", questions_frozen_at: "2026-10-01" }))).toBe(false);
  });
});

describe("report library", () => {
  it("excludes unsent drafts and includes launched campaign history", () => {
    expect(belongsInReports(campaign())).toBe(false);
    expect(belongsInReports(campaign({ status: "archived" }))).toBe(false);
    expect(belongsInReports(campaign({ status: "active" }))).toBe(true);
    expect(belongsInReports(campaign({ status: "archived", questions_frozen_at: "2026-10-01" }))).toBe(true);
  });
  it("keeps annual partial reports and distinguishes missing responses or questions", () => {
    expect(reportAvailability(campaign({ status: "active" }), 1, true)).toEqual({ available: true, availability: "Partial report available" });
    expect(reportAvailability(campaign({ status: "closed" }), 2, true).available).toBe(true);
    expect(reportAvailability(campaign(), 0, true).available).toBe(false);
    expect(reportAvailability(campaign(), 1, false).available).toBe(false);
  });
  it("uses the authoritative 360 state rather than inferred reviewer counts", () => {
    const feedback = campaign({ campaign_type: "feedback_360", status: "closed" });
    expect(reportAvailability(feedback, 10, true, "not_closed").available).toBe(false);
    expect(reportAvailability(feedback, 10, true, "insufficient_responses").availability).toBe("Privacy minimum not met");
    expect(reportAvailability(feedback, 10, true, "unavailable").available).toBe(false);
    expect(reportAvailability(feedback, 0, true, "available").available).toBe(true);
  });
  it("combines case-insensitive search and campaign type filters", () => {
    const entries = [{ id: "a", name: "Annual Review", type: "annual_appraisal" }, { id: "b", name: "Leadership Review", type: "feedback_360" }] as ReportEntry[];
    expect(filterReports(entries, " REVIEW ", "all")).toHaveLength(2);
    expect(filterReports(entries, "review", "feedback_360").map((entry) => entry.id)).toEqual(["b"]);
    expect(filterReports(entries, "missing", "all")).toEqual([]);
  });
});
