import { NextRequest, NextResponse } from "next/server";
import { drainEmailOutbox } from "@/lib/email/outbox-drain";
import { assertCronAuthorized } from "@/lib/cron/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Service-only outbox drain. Claims a bounded batch, sends via Resend,
 * updates sent/failed with retries. Idempotent under concurrent invocation.
 */
export async function POST(req: NextRequest) {
  const denied = assertCronAuthorized(req);
  if (denied) return denied;

  try {
    const summary = await drainEmailOutbox(50);
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Drain failed";
    console.error("[drain-outbox]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
