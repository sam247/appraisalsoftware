import { NextRequest, NextResponse } from "next/server";

/**
 * Cron / worker auth. Production requires CRON_SECRET.
 * Never trust Host header for authorization.
 */
export function assertCronAuthorized(req: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET?.trim();

  if (!secret) {
    if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") {
      console.error("[cron] CRON_SECRET is required in production");
      return NextResponse.json(
        { error: "Server misconfigured" },
        { status: 500 },
      );
    }
    // Local/dev without secret — allow for dogfooding
    return null;
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
