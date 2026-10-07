import { expect, it, vi } from "vitest";
import { drainEmailOutbox } from "./outbox-drain";
import { createServiceClient } from "@/lib/supabase/admin";
import { sendViaResend } from "./resend";

vi.mock("@/lib/supabase/admin", () => ({ createServiceClient: vi.fn() }));
vi.mock("./resend", () => ({ sendViaResend: vi.fn() }));

it.each([null, "https://example.com/current-logo.png"])("uses current company branding for queued mail, including a removed logo: %s", async (logo_url) => {
  const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: { organizations: { name: "Example Company", logo_url } } }) };
  const rpc = vi.fn(async (name: string) => {
    if (name === "claim_email_outbox_batch") return { data: [{ id: "mail-preview", kind: "appraisal_invite", organization_id: "org-preview", to_email: "preview@example.com", payload: { campaign_id: "campaign-preview", raw_token: "preview-token", org_logo_url: "https://example.com/old-logo.png" } }], error: null };
    return { data: true, error: null };
  });
  vi.mocked(createServiceClient).mockReturnValue({ from: () => query, rpc } as unknown as ReturnType<typeof createServiceClient>);
  vi.mocked(sendViaResend).mockReset().mockResolvedValue({ ok: true, providerId: "mock-email" });
  const log = vi.spyOn(console, "info").mockImplementation(() => {});
  try {
    expect((await drainEmailOutbox()).sent).toBe(1);
    const html = vi.mocked(sendViaResend).mock.calls[0][0].html;
    expect(html).toContain(logo_url ?? "https://appraisalsoftware.co.uk/brand/icon-192.png");
    expect(html).not.toContain("https://example.com/old-logo.png");
  } finally {
    log.mockRestore();
  }
});
