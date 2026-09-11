/**
 * /api/cron/drain-outbox
 *
 * Phase 2: fake-send implementation.
 * - Picks up pending email_outbox rows
 * - Marks them sent (logs payload to console)
 * - Updates matching campaign_assignment to status=sent
 *
 * Real Resend integration comes in Phase 3. This keeps the outbox
 * drain pipeline wired end-to-end with no external dependency.
 *
 * Call this endpoint from a cron job or manually. Idempotent.
 *
 * Security: protected by CRON_SECRET env var if set.
 * Set CRON_SECRET in Vercel → cron → Authorization header.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EmailOutbox } from "@/lib/types/database";

const BATCH = 50;

export async function POST(req: NextRequest) {
  // Optional simple auth
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = await createClient();

  // Fetch pending rows
  const { data: rows, error: fetchErr } = await supabase
    .from("email_outbox")
    .select("*")
    .in("status", ["pending", "failed"])
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for")
    .limit(BATCH);

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  const outboxRows = (rows ?? []) as EmailOutbox[];
  let sent = 0;
  let failed = 0;

  for (const row of outboxRows) {
    // ponytail: Phase 2 fake-send — log and mark sent.
    // Replace this block with Resend call in Phase 3.
    console.log("[drain-outbox] fake-send", {
      id: row.id,
      kind: row.kind,
      to: row.to_email,
      subject: row.subject,
      payload: row.payload,
    });

    const { error: updateErr } = await supabase
      .from("email_outbox")
      .update({ status: "sent", attempts: row.attempts + 1, updated_at: new Date().toISOString() })
      .eq("id", row.id);

    if (updateErr) {
      failed++;
      continue;
    }

    // Update assignment to sent if this is an invite
    if (row.kind === "appraisal_invite") {
      const assignmentId = (row.payload as Record<string, unknown>)
        .assignment_id as string | undefined;
      if (assignmentId) {
        await supabase
          .from("campaign_assignments")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", assignmentId)
          .eq("status", "pending"); // only advance if still pending
      }
    }

    sent++;
  }

  return NextResponse.json({ processed: outboxRows.length, sent, failed });
}

// Allow GET for easy manual testing
export async function GET(req: NextRequest) {
  return POST(req);
}
