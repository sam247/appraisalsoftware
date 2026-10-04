import { createHash } from "node:crypto";
import { sendViaResend } from "@/lib/email/resend";
import { enquiryTypes, validateContact } from "@/lib/contact";

export const runtime = "nodejs";
const MAX_BYTES = 16_384;
const WINDOW_MS = 10 * 60_000;
// ponytail: per-instance protection only, capped at 1,000 IPs; use a shared limiter if traffic spans many instances.
const attempts = new Map<string, { count: number; until: number }>();
function permit(ip: string) {
  const now = Date.now();
  for (const [key, entry] of attempts)
    if (entry.until <= now) attempts.delete(key);
  const entry = attempts.get(ip);
  if (entry && entry.count >= 5) return false;
  if (!entry && attempts.size >= 1000) return false;
  attempts.set(ip, {
    count: (entry?.count ?? 0) + 1,
    until: entry?.until ?? now + WINDOW_MS,
  });
  return true;
}
const escapeHtml = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
const fail = (error: string, status: number, extra = {}) =>
  Response.json({ ok: false, error, ...extra }, { status });

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return fail("Please send your enquiry from our contact page.", 403);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return fail("Unsupported request format.", 415);
  if (
    !permit(
      request.headers.get("x-real-ip") ??
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        "unknown",
    )
  )
    return fail("Too many attempts. Please try again in ten minutes.", 429);
  if (Number(request.headers.get("content-length")) > MAX_BYTES)
    return fail("Your enquiry is too large.", 413);
  const reader = request.body?.getReader();
  if (!reader) return fail("Enter your enquiry details.", 400);
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  let input: Record<string, unknown>;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BYTES) {
        await reader.cancel();
        return fail("Your enquiry is too large.", 413);
      }
      chunks.push(value);
    }
    const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return fail("Enter your enquiry details.", 400);
    input = parsed as Record<string, unknown>;
  } catch {
    return fail("We could not read your enquiry. Please try again.", 400);
  }
  if (input.website !== "")
    return fail("We could not accept this enquiry.", 400);
  if (
    typeof input.submissionId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      input.submissionId,
    )
  )
    return fail("Please refresh the contact page and try again.", 400);
  const { fields, errors } = validateContact(input);
  if (Object.keys(errors).length)
    return fail("Check the highlighted fields.", 400, { errors });
  const recipient = process.env.CONTACT_TO_EMAIL?.trim();
  if (!recipient || !process.env.RESEND_API_KEY?.trim())
    return fail(
      "The enquiry service is temporarily unavailable. Please try again later.",
      503,
    );
  const text = [
    "Appraisal Software contact enquiry",
    `Name: ${fields.name}`,
    `Email: ${fields.email}`,
    `Organisation: ${fields.organisation || "Not supplied"}`,
    `Enquiry: ${enquiryTypes[fields.type as keyof typeof enquiryTypes]}`,
    `Plan: ${fields.plan || "Not specified"}`,
    "",
    fields.message,
  ].join("\n");
  const contentHash = createHash("sha256").update(text).digest("hex");
  const result = await sendViaResend({
    to: recipient,
    replyTo: fields.email,
    subject: `Appraisal Software: ${enquiryTypes[fields.type as keyof typeof enquiryTypes]}${fields.plan ? ` · ${fields.plan}` : ""}`,
    text,
    html: `<div style="white-space:pre-wrap">${escapeHtml(text)}</div>`,
    idempotencyKey: `contact-${input.submissionId}-${contentHash}`,
  });
  if (!result.ok)
    return fail(
      "We could not send your enquiry. Your message is still here; please try again.",
      502,
    );
  return Response.json({ ok: true });
}
