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
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("schedules through one guarded RPC, retaining existing activation and closing", async () => {
    await expect(
      sendCampaign(
        "campaign",
        form({ delivery: "later", opens_at: "2999-01-01" }),
      ),
    ).rejects.toThrow("/app/campaigns/campaign");
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith(
      "schedule_appraisal_campaign",
      { p_campaign_id: "campaign", p_send_date: "2999-01-01" },
    );
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
  it("creates close dates in the organisation timezone and snapshots it on the campaign", async () => {
    const insert = query({ data: { id: "campaign" } });
    mocks.from
      .mockReturnValueOnce(query({ data: { id: "template" } }))
      .mockReturnValueOnce(query({ count: 1 }))
      .mockReturnValueOnce(insert);
    mocks.rpc.mockResolvedValueOnce({
      data: [
        {
          opens_at: "2999-07-01T08:00:00Z",
          closes_at: "2999-07-01T22:59:59.999Z",
        },
      ],
      error: null,
    });
    await expect(
      createCampaign(
        form({
          name: "Annual",
          template_id: "template",
          closes_at: "2999-07-01",
        }),
      ),
    ).rejects.toThrow("/app/campaigns/campaign");
    expect(mocks.rpc).toHaveBeenCalledWith("campaign_date_instants", {
      p_date: "2999-07-01",
      p_timezone: "Europe/London",
    });
    expect(insert.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        timezone: "Europe/London",
        closes_at: "2999-07-01T22:59:59.999Z",
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
