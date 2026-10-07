import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { createElement as h } from "react";
import type { Campaign, CampaignQuestion, CampaignAssignment } from "@/lib/types/database";
import AppNavigation from "./app-navigation";
import ReportsDirectory from "./reports/reports-directory";
import FormBuilder from "./campaigns/[id]/form/form-builder";
import AnnualDraftBuilder from "./campaigns/[id]/annual-draft-builder";
import DraftPreview from "./campaigns/[id]/draft-preview";
import { PageHeader } from "./chrome";
import type { ReportEntry } from "./reports/presentation";
import CampaignsDirectory from "./campaigns/campaigns-directory";
import PeopleDirectory from "./people/people-directory";
import PeopleWorkspace from "./campaigns/[id]/people/people-workspace";

const navigation = vi.hoisted(() => ({ path: "/dashboard/reports" }));
const database = vi.hoisted(() => ({ rows: {} as Record<string, unknown[]>, rpc: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => navigation.path, useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/lib/auth/session", () => ({ requireOrgAdmin: async () => ({ org: { id: "fixture" } }) }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({
  rpc: database.rpc,
  from: (table: string) => {
    const query = {
      select: () => query, eq: () => query, neq: () => query, order: () => query,
      then: (resolve: (result: { data: unknown[]; error: null }) => unknown) => Promise.resolve({ data: database.rows[table] ?? [], error: null }).then(resolve),
    };
    return query;
  },
}) }));
vi.mock("./campaigns/[id]/form/actions", () => ({ saveCampaignForm: vi.fn(), startCampaignForm: vi.fn() }));
vi.mock("./campaigns/actions", () => ({ saveSubjectsAndAssignments: vi.fn(), finalizeAnnualDraft: vi.fn(), saveAnnualName: vi.fn(), saveAnnualTiming: vi.fn(), archiveCampaign: vi.fn(), deleteCampaign: vi.fn(), renameCampaign: vi.fn(), sendCampaignReminders: vi.fn() }));
vi.mock("./people/actions", () => ({ archivePerson: vi.fn(), createDepartment: vi.fn(), createPerson: vi.fn(), importPeopleCsv: vi.fn(), unarchivePerson: vi.fn(), updatePerson: vi.fn() }));
// Vite's test transform uses the classic JSX runtime for these existing TSX files.
vi.stubGlobal("React", React);

const campaign: Campaign = {
  id: "fixture", organization_id: "fixture", name: "Annual appraisal · Product and engineering",
  campaign_type: "annual_appraisal", status: "draft", form_started_at: "2026-10-01", questions_frozen_at: null,
  form_revision: 1, settings: { draft_delivery_mode: "now" }, timezone: "Europe/London",
  template_id: null, reminder_settings: {}, opens_at: null, closes_at: null, send_claimed_at: null,
  schedule_error: null, schedule_attempts: 0, cloned_from_campaign_id: null, created_by: null,
  created_at: "2026-10-01", updated_at: "2026-10-01",
};
const questions: CampaignQuestion[] = [{
  id: "question", campaign_id: campaign.id, organization_id: "fixture", sort_order: 0,
  type: "rating", prompt: "How effectively have you collaborated with your team?", required: true,
  options: [], scale: { min: 1, max: 5 }, help_text: "Consider communication, shared goals and support.",
  stable_key: null, competency_key: null, competency_label: null, section_key: null, section_label: null,
  source_template_question_id: null, created_at: "2026-10-01",
}];
const org = { name: "Example workspace", logoUrl: null, brandColor: "#16886b" };
const entries: ReportEntry[] = [
  { id: "annual", name: "Annual appraisal · Product and engineering", type: "annual_appraisal", status: "active", completion: "12 of 24 responses", available: true, availability: "Partial report available", date: "2026-10-30T18:00:00Z", dateLabel: "Closes", timezone: "Europe/London" },
  { id: "feedback", name: "Leadership feedback", type: "feedback_360", status: "closed", completion: "4 of 8 responses", available: false, availability: "Privacy minimum not met", date: null, dateLabel: "Close date", timezone: "Europe/London" },
];
function render(name: string, path: string, child: React.ReactNode, started = false) {
  navigation.path = path;
  const html = renderToStaticMarkup(h(AppNavigation, {
    organization: org.name, displayName: "Test admin", email: "test@example.invalid", role: "owner",
    showUpgrade: false, showGettingStarted: started,
    children: h("div", { className: "dashboard-content" }, child),
  }));
  // Optional local visual fixtures. They contain fictional data and no auth bypass.
  if (process.env.ADMIN_SCREENSHOT_DIR) {
    mkdirSync(process.env.ADMIN_SCREENSHOT_DIR, { recursive: true });
    writeFileSync(`${process.env.ADMIN_SCREENSHOT_DIR}/${name}.html`, `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="admin.css"><title>Admin composition fixture</title><body>${html}</body></html>`);
  }
  return html;
}
describe("admin composition", () => {
  it("presents campaign context in a semantic directory table with a visible draft action", () => {
    const html = render("campaigns", "/dashboard/campaigns", h(React.Fragment, null, h(PageHeader, { title: "Campaigns", subtitle: "Manage your appraisal and feedback cycles." }), h(CampaignsDirectory, {
      campaigns: [campaign, { ...campaign, id: "live", name: "Leadership feedback", campaign_type: "feedback_360", status: "active" }],
      assignments: [{ campaign_id: campaign.id, status: "pending" }] as CampaignAssignment[],
      subjectCounts: { fixture: 1 }, questionCounts: { fixture: 1 }, valid360ReviewerCounts: {},
    })));
    expect(html).toContain('<table');
    expect(html).toContain('scope="col"');
    expect(html).toContain('aria-label="Campaigns"');
    expect(html).toContain('href="/dashboard/campaigns/fixture"');
    expect(html).toContain('>Edit</a>');
  });
  it("keeps organisational context and selection in People with visible error feedback", () => {
    const html = render("people", "/dashboard/people", h(PeopleDirectory, {
      employeeLimit: 10,
      people: [{ id: "person", full_name: "Test employee with a long name", email: "test@example.invalid", job_title: "Product designer", manager_person_id: null, department_id: "product", reviewer_only: false, archived_at: null }],
      departments: [{ id: "product", name: "Product and engineering" }], flash: { error: "Import could not be completed" },
    }));
    expect(html).toContain("Product and engineering");
    expect(html).toContain("Select all visible people");
    expect(html).toContain("Import could not be completed");
    expect(html).toContain("directory-table");
  });
  it("keeps campaign managers in contact rows and retains saved archived participants", () => {
    const people = [
      { id: "employee", full_name: "Employee", email: "employee@example.invalid", department_id: null, manager_person_id: "manager", archived_at: null },
      { id: "manager", full_name: "Manager", email: "manager@example.invalid", department_id: null, manager_person_id: null, archived_at: null },
      { id: "archived", full_name: "Former employee", email: "former@example.invalid", department_id: null, manager_person_id: null, archived_at: "2026-01-01" },
      { id: "unselected-archive", full_name: "Hidden archived person", email: "hidden@example.invalid", department_id: null, manager_person_id: null, archived_at: "2026-01-01" },
    ];
    const html = render("participants", "/dashboard/campaigns/fixture/people", h(PeopleWorkspace, {
      campaignId: "fixture", campaignName: "Annual appraisal", people, departments: [],
      initialSubjects: [{ personId: "employee", managerPersonId: "manager" }, { personId: "archived", managerPersonId: null }],
    }));
    expect(html).toContain('aria-label="Campaign participants"');
    expect(html).toContain('aria-label="Campaign manager for Employee"');
    expect(html).toContain('value="manager" selected="">Manager</option>');
    expect(html).toContain('aria-label="Select Former employee"');
    expect(html).not.toContain('Hidden archived person');
    expect(html).not.toContain('<aside');
    expect(html).toContain('2 selected');
    expect(html).toContain('1 manager reviews');
  });
  it("releases only report-library metadata from the authoritative 360 report", async () => {
    database.rows = {
      campaigns: [{ ...campaign, campaign_type: "feedback_360", status: "closed", questions_frozen_at: "2026-10-01" }, campaign],
      campaign_assignments: [{ campaign_id: campaign.id, status: "submitted" }],
      campaign_questions: [{ campaign_id: campaign.id }],
    };
    database.rpc.mockResolvedValue({ data: { state: "available", questions: [{ comments: ["PRIVATE_REPORT_CANARY"] }] }, error: null });
    const { default: ReportsPage } = await import("./reports/page");
    const html = renderToStaticMarkup(await ReportsPage());
    expect(database.rpc).toHaveBeenCalledWith("feedback_360_report", { p_campaign_id: campaign.id });
    expect(html).toContain("1 report");
    expect(html).toContain("View report");
    expect(html).not.toContain("PRIVATE_REPORT_CANARY");
  });
  it("fails clearly when report eligibility cannot be loaded", async () => {
    database.rpc.mockResolvedValue({ data: null, error: { message: "Unavailable" } });
    const { default: ReportsPage } = await import("./reports/page");
    await expect(ReportsPage()).rejects.toThrow("Unable to load report availability");
  });
  it("keeps Reports in the dashboard and routes unavailable reports to campaign management", () => {
    const html = render("reports", "/dashboard/reports", h(React.Fragment, null, h(PageHeader, { title: "Reports", subtitle: "Appraisal and feedback reports across your campaigns." }), h(ReportsDirectory, { entries })));
    expect(html).toContain('aria-label="Application"');
    expect(html).not.toContain("Getting Started");
    expect(html).toContain('href="/dashboard/campaigns/annual/results"');
    expect(html).toContain('href="/dashboard/campaigns/feedback"');
    expect(html).not.toContain('href="/dashboard/campaigns/feedback/results"');
    expect(html).toContain("Privacy minimum not met");
    expect(html).not.toContain("Analytics");
  });
  it("retains onboarding navigation for new workspaces and a useful empty report state", () => {
    const html = render("empty-reports", "/dashboard/reports", h(React.Fragment, null, h(PageHeader, { title: "Reports" }), h(ReportsDirectory, { entries: [] })), true);
    expect(html).toContain('href="/dashboard/getting-started"');
    expect(html).toContain("Your campaign reports will appear here");
  });
  it("gives the form builder one focused toolbar with appraisal controls and a real preview", () => {
    const html = render("builder", "/dashboard/campaigns/fixture/form", h(FormBuilder, { campaign, initialQuestions: questions, templates: [], org, subjectName: "Employee" }));
    expect(html).not.toContain('class="app-sidebar');
    expect(html).not.toContain('class="app-header');
    for (const label of ["Questions", "Respondent preview", "Save and exit", "Changes saved", "Employee", "Manager", "Duplicate"]) expect(html).toContain(label);
    expect(html).toContain("builder-canvas");
  });
  it("keeps draft assembly and its saved form preview in the same focused workspace", () => {
    const html = render("draft", "/dashboard/campaigns/fixture", h(AnnualDraftBuilder, {
      campaignId: campaign.id, campaignName: campaign.name, campaignSettings: campaign.settings, reminderSettings: {}, opensAt: null,
      templateId: null, templateName: null, formStartedAt: campaign.form_started_at, questionCount: 1, closesAt: null,
      timezone: campaign.timezone, initialSubjects: [{ personId: "employee", managerPersonId: "manager" }], pendingAssignmentCount: 2, ready: true,
      preview: h(DraftPreview, { campaign, questions, org, subjectName: "Employee" }),
    }));
    expect(html).toContain("data-focused-workspace");
    expect(html).toContain("draft-checklist");
    expect(html).toContain("draft-preview");
    expect(html).toContain("Finish later");
    expect(html).toContain("Edit people");
    expect(html).toContain("Edit form");
  });
  it("keeps anonymous 360 previews free of Employee/Manager switches and locks sent forms", () => {
    const html = render("feedback-builder", "/dashboard/campaigns/fixture/form", h(FormBuilder, { campaign: { ...campaign, campaign_type: "feedback_360", status: "active" }, initialQuestions: questions, templates: [], org, subjectName: "Test subject" }));
    expect(html).toContain("Anonymous reviewer");
    expect(html).not.toContain('<option value="manager">');
    expect(html).toMatch(/disabled=""[^>]*>Save and exit/);
  });
});
