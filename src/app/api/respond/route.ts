/**
 * /api/respond — respondent save/submit proxy.
 *
 * Calls SECURITY DEFINER RPCs (respond_save / respond_submit) via the anon key.
 * The RPCs validate the raw token themselves, so no service role key is needed.
 *
 * If you later want server-side service-role enforcement, set
 * SUPABASE_SERVICE_ROLE_KEY in .env.local and swap createClient for
 * createServiceClient below.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RespondBody {
  action: "save" | "submit";
  token: string;
  answers: Array<{
    campaign_question_id: string;
    numeric_value?: number | null;
    text_value?: string | null;
    choice_values?: unknown[];
  }>;
}

export async function POST(req: NextRequest) {
  let body: RespondBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object")
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const { action, token, answers } = body;

  if (
    typeof token !== "string" ||
    !token ||
    !action ||
    !Array.isArray(answers)
  ) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (action !== "save" && action !== "submit") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: kind, error: kindError } = await supabase.rpc(
    "respond_campaign_kind",
    { p_raw_token: token },
  );
  if (kindError)
    return NextResponse.json(
      { error: "Invalid or expired personal link" },
      { status: 422 },
    );
  if (kind === "feedback_360") {
    const { error } = await supabase.rpc("feedback_360_write", {
      p_raw_token: token,
      p_answers: answers as unknown as Record<string, unknown>[],
      p_submit: action === "submit",
    });
    return error
      ? NextResponse.json(
          {
            error:
              error.message === "Please answer every required question"
                ? error.message
                : "Feedback could not be saved. This request may have closed or been submitted; reopen your personal link to check.",
          },
          { status: 422 },
        )
      : NextResponse.json({ ok: true });
  }
  const rpcName = action === "submit" ? "respond_submit" : "respond_save";

  const { error } = await supabase.rpc(rpcName, {
    p_raw_token: token,
    p_answers: answers,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 422 });
  }

  return NextResponse.json({ ok: true });
}
