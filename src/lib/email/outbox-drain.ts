import {
  buildAppraisalInviteHtml,
  buildAppraisalInviteSubject,
  type AppraisalEmailPayload,
} from "@/lib/email/appraisal-invite";
import { sendViaResend } from "@/lib/email/resend";
import { nextRetryAt, shouldRetryOutbox } from "@/lib/schedule/decisions";
import { createServiceClient } from "@/lib/supabase/admin";
import type { EmailOutbox } from "@/lib/types/database";

export type DrainSummary = {
  claimed: number;
  sent: number;
  failed: number;
  skipped: number;
};

/** Strip secrets from structured logs */
export function safeOutboxLog(row: Pick<EmailOutbox, "id" | "kind" | "to_email" | "status" | "attempts" | "idempotency_key">) {
  return {
    id: row.id,
    kind: row.kind,
    to: row.to_email,
    status: row.status,
    attempts: row.attempts,
    idempotencyKey: row.idempotency_key,
  };
}

export async function drainEmailOutbox(limit = 50): Promise<DrainSummary> {
  const supabase = createServiceClient();
  const summary: DrainSummary = { claimed: 0, sent: 0, failed: 0, skipped: 0 };

  const { data: claimed, error: claimErr } = await supabase.rpc(
    "claim_email_outbox_batch",
    { p_limit: limit },
  );

  if (claimErr) {
    throw new Error(`claim_email_outbox_batch failed: ${claimErr.message}`);
  }

  const rows = (claimed ?? []) as EmailOutbox[];
  summary.claimed = rows.length;

  for (const row of rows) {
    console.info("[drain-outbox] processing", safeOutboxLog(row));

    try {
      if (row.kind === "appraisal_invite" || row.kind === "appraisal_reminder" || row.kind === "campaign_invite") {
        await deliverAppraisalEmail(supabase, row, summary);
      } else {
        await markFailed(
          supabase,
          row,
          `Unsupported outbox kind: ${row.kind}`,
          false,
        );
        summary.failed++;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown drain error";
      console.error("[drain-outbox] error", { ...safeOutboxLog(row), error: message });
      await markFailed(supabase, row, message, true);
      summary.failed++;
    }
  }

  return summary;
}

/** Prefer live organisation branding so pending emails pick up logo/accent updates. */
async function enrichPayloadBranding(
  supabase: ReturnType<typeof createServiceClient>,
  payload: AppraisalEmailPayload,
): Promise<AppraisalEmailPayload> {
  const campaignId = (payload as { campaign_id?: string }).campaign_id;
  if (!campaignId) return payload;

  const { data } = await supabase
    .from("campaigns")
    .select("organizations(name, logo_url, brand_color)")
    .eq("id", campaignId)
    .maybeSingle();

  const org = (
    data as {
      organizations?: {
        name?: string | null;
        logo_url?: string | null;
        brand_color?: string | null;
      } | null;
    } | null
  )?.organizations;

  if (!org) return payload;

  return {
    ...payload,
    org_name: org.name ?? payload.org_name,
    org_logo_url: org.logo_url ?? payload.org_logo_url,
    org_brand_color: org.brand_color ?? payload.org_brand_color,
  };
}

async function deliverAppraisalEmail(
  supabase: ReturnType<typeof createServiceClient>,
  row: EmailOutbox,
  summary: DrainSummary,
) {
  const payload = (row.payload ?? {}) as AppraisalEmailPayload;
  const enriched = await enrichPayloadBranding(supabase, payload);

  // Never log payload (contains raw_token)
  let html: string;
  let text: string;
  try {
    ({ html, text } = buildAppraisalInviteHtml({
      ...enriched,
      is_reminder: row.kind === "appraisal_reminder" || Boolean(enriched.is_reminder),
    }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Template build failed";
    await markFailed(supabase, row, message, false);
    summary.failed++;
    return;
  }

  const subject =
    row.subject?.trim() ||
    buildAppraisalInviteSubject({
      ...enriched,
      is_reminder: row.kind === "appraisal_reminder",
    });

  const result = await sendViaResend({
    to: row.to_email,
    subject,
    html,
    text,
    idempotencyKey: row.idempotency_key,
  });

  if (result.ok) {
    const { error } = await supabase.rpc("mark_email_outbox_result", {
      p_id: row.id,
      p_ok: true,
      p_provider_id: result.providerId,
      p_error: null,
      p_retry_at: null,
    });
    if (error) throw new Error(error.message);
    console.info("[drain-outbox] sent", {
      ...safeOutboxLog(row),
      providerId: result.providerId,
    });
    summary.sent++;
    return;
  }

  const retry = result.retryable && shouldRetryOutbox(row.attempts);
  await markFailed(supabase, row, result.error, retry);
  summary.failed++;
  console.warn("[drain-outbox] failed", {
    ...safeOutboxLog(row),
    error: result.error,
    retry,
  });
}

async function markFailed(
  supabase: ReturnType<typeof createServiceClient>,
  row: EmailOutbox,
  error: string,
  retry: boolean,
) {
  const retryAt = retry ? nextRetryAt(row.attempts).toISOString() : null;
  // Terminal when no retry: leave scheduled_for as-is; attempts already incremented on claim
  const { error: rpcErr } = await supabase.rpc("mark_email_outbox_result", {
    p_id: row.id,
    p_ok: false,
    p_provider_id: null,
    p_error: error.slice(0, 2000),
    p_retry_at: retryAt,
  });
  if (rpcErr) {
    console.error("[drain-outbox] mark failed", {
      id: row.id,
      error: rpcErr.message,
    });
  }
}
