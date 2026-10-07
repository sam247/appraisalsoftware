import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AssignmentStatus } from "@/lib/types/database";
import { responseProgress } from "./presentation";
import { draftPrimaryAction } from "./draft-action";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
  redirect: vi.fn((url: string): never => {
    throw new Error(url);
  }),
}));
vi.mock("@/lib/auth/session", () => ({
  requireOrgAdmin: async () => ({ org: { id: "org" }, userId: "owner" }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ from: mocks.from, rpc: mocks.rpc }),
}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import {
  createCampaign,
  activateCampaign,
  saveSubjectsAndAssignments,
  scheduleCampaign,
  sendCampaign,
  closeCampaign,
  renameCampaign,
  archiveCampaign,
  deleteCampaign,
  sendCampaignReminders,
  saveAnnualTiming,
  finalizeAnnualDraft,
  saveFeedback360Cohort,
  saveFeedback360Template,
  saveFeedback360Timing,
  finalizeFeedback360Draft,
} from "./actions";
import { upsertQuestion } from "../templates/actions";
import {
  createPerson,
  updatePerson,
  archivePerson,
  importPeopleCsv,
} from "../people/actions";

function query(result: object) {
  const chain: Record<string, unknown> = {};
  for (const method of [
    "select",
    "eq",
    "is",
    "in",
    "neq",
    "insert",
    "update",
    "delete",
    "order",
  ])
    chain[method] = vi.fn(() => chain);
  chain.single = vi.fn(async () => result);
  chain.maybeSingle = vi.fn(async () => result);
  chain.then = (resolve: (value: object) => unknown) =>
    Promise.resolve(result).then(resolve);
  return chain;
}
const form = (values: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.rpc.mockResolvedValue({ error: null });
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: true })),
  );
});

describe("annual appraisal UX safeguards", () => {
  it("derives the final action from saved timing and readiness", () => {
    expect(draftPrimaryAction("", false)).toMatchObject({
      label: "Send",
      enabled: false,
    });
    expect(draftPrimaryAction("now", false)).toMatchObject({
      label: "Send now",
      enabled: false,
    });
    expect(draftPrimaryAction("now", true)).toMatchObject({
      label: "Send now",
      enabled: true,
      confirmLabel: "Send appraisal",
    });
    expect(draftPrimaryAction("later", false)).toMatchObject({
      label: "Schedule",
      enabled: false,
    });
    expect(draftPrimaryAction("later", true)).toMatchObject({
      label: "Schedule",
      enabled: true,
      confirmLabel: "Schedule appraisal",
    });
  });

  it("counts responses without treating bounced or revoked invitations as not started", () => {
    expect(
      responseProgress(
        [
          "submitted",
          "started",
          "sent",
          "opened",
          "pending",
          "bounced",
          "revoked",
        ].map((status) => ({ status: status as AssignmentStatus })),
      ),
    ).toEqual({
      total: 7,
      complete: 1,
      inProgress: 1,
      notStarted: 3,
      attention: 1,
      revoked: 1,
      outstanding: 4,
      percent: 14,
    });
  });
  it("creates a named draft without requiring questions first, but rejects an invalid deep link", async () => {
    mocks.from.mockReturnValueOnce(query({ data: { id: "campaign" } }));
    await expect(createCampaign(form({ name: "Annual" }))).rejects.toThrow("/dashboard/campaigns/campaign");
    expect(mocks.from).toHaveBeenCalledTimes(1);
    vi.clearAllMocks();
    await expect(createCampaign(form({ name: " " }))).rejects.toThrow("Name+is+required");
    expect(mocks.from).not.toHaveBeenCalled();
    mocks.from
      .mockReturnValueOnce(query({ data: { id: "template" } }))
      .mockReturnValueOnce(query({ count: 0 }));
    await expect(
      createCampaign(form({ name: "Annual", template_id: "template" })),
    ).rejects.toThrow("Add%20at%20least%20one%20question");
    expect(mocks.from).toHaveBeenCalledTimes(2);
  });
  it("creates a draft with a validated template", async () => {
    mocks.from
      .mockReturnValueOnce(query({ data: { id: "template" } }))
      .mockReturnValueOnce(query({ count: 2 }))
      .mockReturnValueOnce(query({ data: { id: "campaign" } }));
    await expect(
      createCampaign(form({ name: "Annual", template_id: "template" })),
    ).rejects.toThrow("/dashboard/campaigns/campaign");
  });
  it("persists explicit timing through the annual transaction", async () => {
    expect(await saveAnnualTiming("campaign", "later", "2027-02-30", "")).toHaveProperty("error");
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(await saveAnnualTiming("campaign", "now", "", "")).toEqual({});
    expect(mocks.rpc).toHaveBeenCalledWith("save_annual_draft_timing", {
      p_campaign_id: "campaign", p_mode: "now", p_send_date: null, p_close_date: null,
    });
  });
  it("requires saved timing at final submission", async () => {
    mocks.from.mockReturnValueOnce(query({ data: { id: "campaign", campaign_type: "annual_appraisal", status: "draft", settings: {}, opens_at: null } }));
    expect(await finalizeAnnualDraft("campaign")).toEqual({ error: "Save a delivery choice before sending" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("keeps draft 360 sends on the acknowledged finalisation path", async () => {
    mocks.from.mockReturnValue(query({ data: { id: "campaign", campaign_type: "feedback_360", status: "draft" } }));
    expect(await activateCampaign("campaign")).toHaveProperty("error");
    await expect(sendCampaign("campaign", form({ delivery: "later", opens_at: "2999-01-01" })))
      .rejects.toThrow("Review+and+Send");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("delegates participant replacement once to the guarded database transaction", async () => {
    const rows = [
      {
        personId: "employee",
        selfPersonId: "employee",
        managerPersonId: "manager",
      },
    ];
    expect(await saveSubjectsAndAssignments("campaign", rows)).toEqual({});
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith(
      "save_appraisal_participants",
      {
        p_campaign_id: "campaign",
        p_participants: [
          { person_id: "employee", manager_person_id: "manager" },
        ],
      },
    );
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("rejects substituted self reviewers and reports transactional failures without a partial fallback", async () => {
    expect(
      await saveSubjectsAndAssignments("campaign", [
        { personId: "employee", selfPersonId: "other", managerPersonId: null },
      ]),
    ).toHaveProperty("error");
    expect(mocks.rpc).not.toHaveBeenCalled();
    mocks.rpc.mockResolvedValueOnce({
      error: { message: "Employee unavailable" },
    });
    expect(
      await saveSubjectsAndAssignments("campaign", [
        {
          personId: "employee",
          selfPersonId: "employee",
          managerPersonId: null,
        },
      ]),
    ).toEqual({ error: "Employee unavailable" });
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("rejects malformed dates before the scheduling transaction and reports database boundaries", async () => {
    mocks.from.mockReturnValue(query({ data: { campaign_type: "annual_appraisal" } }));
    for (const value of ["invalid", "2027-02-30"])
      await expect(
        scheduleCampaign("campaign", form({ opens_at: value })),
      ).rejects.toThrow("Invalid+send+date");
    expect(mocks.rpc).not.toHaveBeenCalled();
    mocks.rpc.mockResolvedValueOnce({
      error: { message: "Send time must be in the future" },
    });
    await expect(
      scheduleCampaign("campaign", form({ opens_at: "2000-01-01" })),
    ).rejects.toThrow("future");
    mocks.rpc.mockResolvedValueOnce({
      error: { message: "Close time must be after the send time" },
    });
    await expect(
      scheduleCampaign("campaign", form({ opens_at: "2999-01-02" })),
    ).rejects.toThrow("after");
    expect(mocks.from).toHaveBeenCalledWith("campaigns");
  });
  it("schedules through one guarded RPC, retaining existing activation and closing", async () => {
    mocks.from.mockReturnValue(query({ data: { id: "campaign", campaign_type: "annual_appraisal", status: "draft" } }));
    await expect(
      sendCampaign(
        "campaign",
        form({ delivery: "later", opens_at: "2999-01-01" }),
      ),
    ).rejects.toThrow("/dashboard/campaigns/campaign");
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith(
      "schedule_appraisal_campaign",
      { p_campaign_id: "campaign", p_send_date: "2999-01-01" },
    );
    await expect(
      sendCampaign("campaign", form({ delivery: "now" })),
    ).rejects.toThrow("/dashboard/campaigns/campaign");
    expect(mocks.rpc).toHaveBeenCalledWith("activate_campaign", {
      p_campaign_id: "campaign",
    });
    await closeCampaign("campaign");
    expect(mocks.rpc).toHaveBeenCalledWith("close_campaign", {
      p_campaign_id: "campaign",
    });
  });
  it("renames, archives, deletes drafts, and queues manual reminders", async () => {
    const rename = query({ data: { id: "campaign" } });
    mocks.from.mockReturnValue(rename);
    await expect(
      renameCampaign("campaign", form({ name: "Q4 Reviews" })),
    ).rejects.toThrow("/dashboard/campaigns");
    expect(rename.update).toHaveBeenCalledWith({ name: "Q4 Reviews" });

    await expect(archiveCampaign("campaign")).rejects.toThrow(
      "/dashboard/campaigns",
    );
    expect(mocks.rpc).toHaveBeenCalledWith("archive_campaign", {
      p_campaign_id: "campaign",
    });

    const del = query({ data: { id: "campaign" } });
    mocks.from.mockReturnValue(del);
    await expect(deleteCampaign("campaign")).rejects.toThrow(
      "/dashboard/campaigns",
    );
    expect(del.delete).toHaveBeenCalled();

    mocks.rpc.mockResolvedValueOnce({ data: 2, error: null });
    await expect(sendCampaignReminders("campaign")).rejects.toThrow(
      "Queued%202%20reminders",
    );
    expect(mocks.rpc).toHaveBeenCalledWith("send_campaign_reminders", {
      p_campaign_id: "campaign",
    });
  });
  it("snapshots the organisation timezone without preconfiguring draft timing", async () => {
    const insert = query({ data: { id: "campaign" } });
    mocks.from.mockReturnValueOnce(insert);
    await expect(
      createCampaign(form({ name: "Annual" })),
    ).rejects.toThrow("/dashboard/campaigns/campaign");
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(insert.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        timezone: "Europe/London",
        template_id: null,
      }),
    );
  });
  it("rejects unsupported template types rather than silently turning them into text", async () => {
    mocks.from.mockReturnValue(query({ data: { id: "template" } }));
    await expect(
      upsertQuestion(
        "template",
        null,
        form({ prompt: "Question", type: "yes_no" }),
      ),
    ).rejects.toThrow("supported+question+type");
    expect(mocks.from).toHaveBeenCalledTimes(1);
  });
  it("reports People save errors and preserves archive as a soft delete", async () => {
    mocks.from.mockReturnValue(
      query({ error: { message: "Duplicate email" } }),
    );
    await expect(
      createPerson(form({ email: "a@example.test" })),
    ).rejects.toThrow("Duplicate%20email");
    const edit = query({ error: null });
    mocks.from
      .mockReturnValueOnce(query({ data: { id: "person" } }))
      .mockReturnValueOnce(edit);
    await expect(
      updatePerson(
        "person",
        form({ full_name: "Alex", job_title: "Designer" }),
      ),
    ).rejects.toThrow("/dashboard/people");
    expect(edit.update).toHaveBeenCalledWith({
      full_name: "Alex",
      job_title: "Designer",
      reviewer_only: false,
      manager_person_id: null,
      department_id: null,
    });
    const archive = query({ error: null });
    mocks.from.mockReturnValue(archive);
    await archivePerson("person");
    expect(archive.update).toHaveBeenCalledWith({
      archived_at: expect.any(String),
    });
    expect(archive.delete).not.toHaveBeenCalled();
  });

  it("stores a default manager on the person without rewriting campaign assignments", async () => {
    const insert = query({ error: null });
    mocks.from
      .mockReturnValueOnce(query({ data: { id: "manager" } }))
      .mockReturnValueOnce(insert);
    await expect(
      createPerson(
        form({
          email: "sam@example.test",
          full_name: "Sam",
          manager_person_id: "manager",
        }),
      ),
    ).rejects.toThrow("/dashboard/people");
    expect(insert.insert).toHaveBeenCalledWith({
      organization_id: "org",
      email: "sam@example.test",
      full_name: "Sam",
      job_title: null,
      manager_person_id: "manager",
      department_id: null,
      created_by: "owner",
    });
  });

  it("rejects an over-limit CSV before creating departments or inserting any employees", async () => {
    mocks.from.mockReset();
    mocks.rpc.mockResolvedValueOnce({ data: { plan: "free" }, error: null });
    const existing = query({ data: Array.from({ length: 9 }, (_, i) => ({ email: `person${i}@example.test`, reviewer_only: false })) });
    mocks.from.mockReturnValueOnce(existing);
    const data = new FormData();
    data.set("file", new File(["email,department\nnew1@example.test,New department\nnew2@example.test,New department"], "people.csv"));
    await expect(importPeopleCsv(data)).rejects.toThrow("Import%20would%20result%20in%2011%20active%20employees");
    expect(mocks.from).toHaveBeenCalledTimes(1);
    expect(existing.insert).not.toHaveBeenCalled();
  });

  it("counts reviewer-only people as existing emails but not employee capacity", async () => {
    mocks.from.mockReset();
    mocks.rpc.mockResolvedValueOnce({ data: { plan: "free" }, error: null });
    const existing = query({ data: [{ email: "reviewer@example.test", reviewer_only: true }, ...Array.from({ length: 9 }, (_, i) => ({ email: `person${i}@example.test`, reviewer_only: false }))] });
    const departments = query({ data: [] });
    const insert = query({ error: null });
    mocks.from.mockReturnValueOnce(existing).mockReturnValueOnce(departments).mockReturnValueOnce(insert);
    const data = new FormData();
    data.set("file", new File(["email\nreviewer@example.test\nnew@example.test"], "people.csv"));
    await expect(importPeopleCsv(data)).rejects.toThrow("ok=1%20ready%20imported");
    expect(insert.insert).toHaveBeenCalledWith([expect.objectContaining({ email: "new@example.test" })]);
  });

  it("returns contextual people imports to the campaign participant workspace", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: { plan: "free" }, error: null });
    const existing = query({ data: [{ email: "existing@example.test" }] });
    const departments = query({ data: [] });
    const insert = query({ error: null });
    mocks.from
      .mockReturnValueOnce(existing)
      .mockReturnValueOnce(departments)
      .mockReturnValueOnce(insert);
    const data = new FormData();
    data.set(
      "file",
      new File(["email,full_name\nnew@example.test,New Person"], "people.csv"),
    );
    data.set("return_to", "/dashboard/campaigns/campaign/people");

    await expect(importPeopleCsv(data)).rejects.toThrow(
      "/dashboard/campaigns/campaign/people?ok=1%20ready%20imported",
    );
    expect(insert.insert).toHaveBeenCalledWith([
      expect.objectContaining({
        email: "new@example.test",
        full_name: "New Person",
      }),
    ]);
  });
});

describe("360 draft assembly actions", () => {
  it("creates an inert named draft through the dedicated 360 RPC", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: "feedback-draft", error: null });
    await expect(createCampaign(form({ campaign_type: "feedback_360", name: "Leadership feedback" })))
      .rejects.toThrow("/dashboard/campaigns/feedback-draft");
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith("create_feedback_360_draft", {
      p_name: "Leadership feedback", p_organization_id: "org",
    });
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("keeps 360 cohort, question and timing saves on their dedicated contracts", async () => {
    expect(await saveFeedback360Cohort("c", "subject", [{ personId: "reviewer", relationship: "peer" }])).toEqual({});
    expect(await saveFeedback360Template("c", "template")).toEqual({});
    expect(await saveFeedback360Timing("c", "now", "", "")).toEqual({});
    expect(mocks.rpc.mock.calls.map((call) => call[0])).toEqual([
      "save_feedback_360_cohort", "save_feedback_360_template", "save_feedback_360_timing",
    ]);
  });
  it("requires a fresh anonymity acknowledgement at final action", async () => {
    expect(await finalizeFeedback360Draft("c", false)).toHaveProperty("error");
    expect(mocks.from).not.toHaveBeenCalled();
    mocks.from.mockReturnValueOnce(query({ data: { id: "c", campaign_type: "feedback_360", status: "draft", settings: { draft_delivery_mode: "later" } } }));
    expect(await finalizeFeedback360Draft("c", true)).toEqual({});
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith("finalize_feedback_360_draft", { p_campaign_id: "c", p_acknowledged: true });
  });
});
