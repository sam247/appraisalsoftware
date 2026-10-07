import { NextRequest, NextResponse } from "next/server";
import { drainEmailOutbox } from "@/lib/email/outbox-drain";
import { assertCronAuthorized } from "@/lib/cron/auth";
import { createServiceClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Scheduler foundation for annual appraisal golden path:
 * 1) activate due scheduled campaigns
 * 2) close due campaigns
 * 3) enqueue cadence reminders into email_outbox
 * 4) drain outbox via Resend
 */
export async function POST(req: NextRequest) {
  const denied = assertCronAuthorized(req);
  if (denied) return denied;

  const supabase = createServiceClient();
  const result: Record<string, unknown> = { ok: true };

  try {
    const { data: activated, error: actErr } = await supabase.rpc(
      "claim_and_activate_due_campaigns",
      { p_limit: 20 },
    );
    if (actErr) throw new Error(`activate: ${actErr.message}`);
    result.activated = activated ?? 0;

    const { data: closed, error: closeErr } = await supabase.rpc(
      "close_due_campaigns",
      { p_limit: 50 },
    );
    if (closeErr) throw new Error(`close: ${closeErr.message}`);
    result.closed = closed ?? 0;

    const { data: reminded, error: remErr } = await supabase.rpc(
      "enqueue_appraisal_reminders",
      { p_limit: 100 },
    );
    if (remErr) throw new Error(`remind: ${remErr.message}`);
    result.remindersEnqueued = reminded ?? 0;

    // Drain after enqueue so invites/reminders leave promptly
    result.drain = await drainEmailOutbox(50);

    console.info("[scheduler]", {
      activated: result.activated,
      closed: result.closed,
      remindersEnqueued: result.remindersEnqueued,
      drain: result.drain,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scheduler failed";
    console.error("[scheduler]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
