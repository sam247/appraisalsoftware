import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/email/resend", () => ({ sendViaResend: vi.fn() }));
import { sendViaResend } from "@/lib/email/resend";
import { POST } from "./route";
const send = vi.mocked(sendViaResend);
const valid = {
  name: "Sam <Test>",
  email: "sam@example.com",
  organisation: "Team & Co",
  type: "pricing",
  plan: "Pro",
  message: "Please help us plan our reviews.",
  website: "",
  submissionId: "acb4f68c-b0b9-4e79-9a42-a686277c098d",
};
let ip = 0;
function request(body: unknown = valid, headers: Record<string, string> = {}) {
  return new Request("https://appraisalsoftware.co.uk/api/contact", {
    method: "POST",
    headers: {
      origin: "https://appraisalsoftware.co.uk",
      "content-type": "application/json",
      "x-real-ip": String(++ip),
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}
beforeEach(() => {
  send.mockReset();
  send.mockResolvedValue({ ok: true, providerId: "mail-1" });
  vi.stubEnv("RESEND_API_KEY", "test-key");
  vi.stubEnv("CONTACT_TO_EMAIL", "sampettiford@googlemail.com");
});
describe("contact delivery", () => {
  it("sends validated escaped content with a reply address and stable retry key", async () => {
    expect((await POST(request())).status).toBe(200);
    expect((await POST(request())).status).toBe(200);
    const mail = send.mock.calls[0][0];
    expect(mail.to).toBe("sampettiford@googlemail.com");
    expect(mail.replyTo).toBe("sam@example.com");
    expect(mail.html).toContain("Sam &lt;Test&gt;");
    expect(mail.html).toContain("Team &amp; Co");
    expect(mail.html).toContain('src="https://appraisalsoftware.co.uk/brand/icon-192.png"');
    expect(mail.text).toContain("Plan: Pro");
    expect(mail.idempotencyKey).toBe(send.mock.calls[1][0].idempotencyKey);
  });
  it("gives edited content a distinct provider key", async () => {
    await POST(request());
    await POST(request({ ...valid, message: "A different question" }));
    expect(send.mock.calls[0][0].idempotencyKey).not.toBe(
      send.mock.calls[1][0].idempotencyKey,
    );
  });
  it("does not report success after a provider failure", async () => {
    send.mockResolvedValue({
      ok: false,
      error: "private provider details",
      retryable: true,
    });
    const response = await POST(request());
    expect(response.status).toBe(502);
    expect((await response.json()).ok).toBe(false);
    expect(JSON.stringify(await (await POST(request())).json())).not.toContain(
      "private provider details",
    );
  });
  it.each(["RESEND_API_KEY", "CONTACT_TO_EMAIL"])(
    "fails safely without %s",
    async (key) => {
      vi.stubEnv(key, "");
      expect((await POST(request())).status).toBe(503);
      expect(send).not.toHaveBeenCalled();
    },
  );
  it("rejects invalid fields with useful field errors", async () => {
    const response = await POST(
      request({
        ...valid,
        name: "",
        email: "invalid",
        type: "unknown",
        message: "",
        plan: "Enterprise",
      }),
    );
    expect(response.status).toBe(400);
    expect((await response.json()).errors).toMatchObject({
      name: expect.any(String),
      email: expect.any(String),
      type: expect.any(String),
      message: expect.any(String),
      plan: expect.any(String),
    });
    expect(send).not.toHaveBeenCalled();
  });
  it("rejects header injection and oversized field values", async () => {
    for (const body of [
      { ...valid, name: "Sam\nBcc: evil@example.com" },
      { ...valid, message: "a".repeat(5001) },
      { ...valid, email: "sam@example.com\r\n" + "X: injected" },
    ])
      expect((await POST(request(body))).status).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });
  it("rejects bots, malformed JSON, wrong origins and missing retry ids", async () => {
    for (const req of [
      request({ ...valid, website: "spam" }),
      request("{"),
      request(valid, { origin: "https://evil.example" }),
      request({ ...valid, submissionId: "" }),
      request(valid, { origin: "" }),
    ])
      expect((await POST(req)).status).toBeGreaterThanOrEqual(400);
    expect(send).not.toHaveBeenCalled();
  });
  it("limits request bytes even without a content-length header", async () => {
    expect((await POST(request(" ".repeat(16385)))).status).toBe(413);
    expect(
      (await POST(request(valid, { "content-length": "20000" }))).status,
    ).toBe(413);
    expect(send).not.toHaveBeenCalled();
  });
  it("bounds per-IP attempts and permits requests after the window expires", async () => {
    const headers = { "x-real-ip": "rate-limit-test" };
    for (let i = 0; i < 5; i++)
      expect((await POST(request(valid, headers))).status).toBe(200);
    expect((await POST(request(valid, headers))).status).toBe(429);
    const now = Date.now();
    const clock = vi.spyOn(Date, "now").mockReturnValue(now + 600001);
    expect((await POST(request(valid, headers))).status).toBe(200);
    clock.mockRestore();
  });
});
