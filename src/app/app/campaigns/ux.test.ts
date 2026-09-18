import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AssignmentStatus } from "@/lib/types/database";
import { responseProgress } from "./presentation";

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
  saveSubjectsAndAssignments,
  scheduleCampaign,
  sendCampaign,
  closeCampaign,
} from "./actions";
import { upsertQuestion } from "../templates/actions";
import { createPerson, updatePerson, archivePerson } from "../people/actions";

function query(result: object) {
  const chain: Record<string, unknown> = {};
  for (const method of [
    "select",
    "eq",
    "is",
    "in",
    "insert",
    "update",
    "delete",
    "order",
  ])
    chain[method] = vi.fn(() => chain);
  chain.single = vi.fn(async () => result);
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
      percent: 14,
    });
  });
  it("rejects missing or empty templates before creating a draft", async () => {
    await expect(createCampaign(form({ name: "Annual" }))).rejects.toThrow(
      "Choose+a+question+template",
    );
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
    ).rejects.toThrow("/app/campaigns/campaign");
  });
  it("rejects duplicate or cross-workspace participants before deleting saved selections", async () => {
    mocks.from.mockReturnValue(query({ data: { status: "draft" } }));
    const row = {
      personId: "employee",
      selfPersonId: "employee",
      managerPersonId: "manager",
    };
    expect(
      await saveSubjectsAndAssignments("campaign", [row, row]),
    ).toHaveProperty("error");
    expect(mocks.from).toHaveBeenCalledTimes(1);
    mocks.from
      .mockReturnValueOnce(query({ data: { status: "draft" } }))
      .mockReturnValueOnce(query({ data: [] }));
    expect(await saveSubjectsAndAssignments("campaign", [row])).toHaveProperty(
      "error",
    );
    expect(mocks.from).toHaveBeenCalledTimes(3);
  });
  it("preserves employee self and manager assignment relationships", async () => {
    const assignmentQuery = query({ error: null });
    mocks.from
      .mockReturnValueOnce(query({ data: { status: "draft" } }))
      .mockReturnValueOnce(
        query({ data: [{ id: "employee" }, { id: "manager" }] }),
      )
      .mockReturnValueOnce(query({ error: null }))
      .mockReturnValueOnce(query({ error: null }))
      .mockReturnValueOnce(query({ error: null }))
      .mockReturnValueOnce(assignmentQuery);
    expect(
      await saveSubjectsAndAssignments("campaign", [
        {
          personId: "employee",
          selfPersonId: "employee",
          managerPersonId: "manager",
        },
      ]),
    ).toEqual({});
    expect(assignmentQuery.insert).toHaveBeenCalledWith([
      expect.objectContaining({
        respondent_person_id: "employee",
        subject_person_id: "employee",
        relationship: "self",
      }),
      expect.objectContaining({
        respondent_person_id: "manager",
        subject_person_id: "employee",
        relationship: "manager",
      }),
    ]);
  });
  it("rejects malformed, past and after-close schedule dates before freezing", async () => {
    await expect(
      scheduleCampaign("campaign", form({ opens_at: "invalid" })),
    ).rejects.toThrow("Invalid+send+date");
    await expect(
      scheduleCampaign("campaign", form({ opens_at: "2027-02-30" })),
    ).rejects.toThrow("Invalid+send+date");
    mocks.from.mockReturnValue(
      query({ data: { status: "draft", closes_at: "2000-01-02" } }),
    );
    await expect(
      scheduleCampaign("campaign", form({ opens_at: "2000-01-01" })),
    ).rejects.toThrow("future");
    mocks.from.mockReturnValue(
      query({ data: { status: "draft", closes_at: "2999-01-01" } }),
    );
    await expect(
      scheduleCampaign("campaign", form({ opens_at: "2999-01-02" })),
    ).rejects.toThrow("after");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("schedules using the existing freeze RPC, then sends through existing activation", async () => {
    mocks.from
      .mockReturnValueOnce(
        query({ data: { status: "draft", closes_at: null } }),
      )
      .mockReturnValueOnce(query({ count: 2 }))
      .mockReturnValueOnce(query({ error: null }));
    await expect(
      sendCampaign(
        "campaign",
        form({ delivery: "later", opens_at: "2999-01-01" }),
      ),
    ).rejects.toThrow("/app/campaigns/campaign");
    expect(mocks.rpc).toHaveBeenCalledWith("freeze_campaign_questions", {
      p_campaign_id: "campaign",
    });
    mocks.from.mockReturnValue(query({ data: { id: "campaign" } }));
    await expect(
      sendCampaign("campaign", form({ delivery: "now" })),
    ).rejects.toThrow("/app/campaigns/campaign");
    expect(mocks.rpc).toHaveBeenCalledWith("activate_campaign", {
      p_campaign_id: "campaign",
    });
    await closeCampaign("campaign");
    expect(mocks.rpc).toHaveBeenCalledWith("close_campaign", {
      p_campaign_id: "campaign",
    });
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
    await updatePerson(
      "person",
      form({ full_name: "Alex", job_title: "Designer" }),
    );
    expect(edit.update).toHaveBeenCalledWith({
      full_name: "Alex",
      job_title: "Designer",
    });
    const archive = query({ error: null });
    mocks.from.mockReturnValue(archive);
    await archivePerson("person");
    expect(archive.update).toHaveBeenCalledWith({
      archived_at: expect.any(String),
    });
    expect(archive.delete).not.toHaveBeenCalled();
  });
});
