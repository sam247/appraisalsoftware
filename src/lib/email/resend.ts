import { Resend } from "resend";

const DEFAULT_FROM = "Appraisal Software <invites@appraisalsoftware.co.uk>";

export type ResendSendResult =
  | { ok: true; providerId: string }
  | { ok: false; error: string; retryable: boolean };

export function getResendFrom(): string {
  return process.env.RESEND_FROM?.trim() || DEFAULT_FROM;
}

export async function sendViaResend(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey?: string;
}): Promise<ResendSendResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY is not configured", retryable: false };
  }

  const resend = new Resend(apiKey);

  try {
    const { data, error } = await resend.emails.send(
      {
        from: getResendFrom(),
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      },
      params.idempotencyKey
        ? { idempotencyKey: params.idempotencyKey }
        : undefined,
    );

    if (error) {
      const message = error.message || "Resend send failed";
      const retryable = isRetryableResendError(message, error.name);
      return { ok: false, error: message, retryable };
    }

    if (!data?.id) {
      return { ok: false, error: "Resend returned no message id", retryable: true };
    }

    return { ok: true, providerId: data.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Resend request failed";
    return { ok: false, error: message, retryable: true };
  }
}

function isRetryableResendError(message: string, name?: string): boolean {
  const m = `${name ?? ""} ${message}`.toLowerCase();
  if (m.includes("rate") || m.includes("timeout") || m.includes("429") || m.includes("5")) {
    return true;
  }
  if (m.includes("invalid") || m.includes("validation") || m.includes("forbidden")) {
    return false;
  }
  return true;
}
