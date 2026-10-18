import { createClient } from "@/lib/supabase/server";
import { getAppOrigin } from "@/lib/app-origin";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // Production: back to the public site. Elsewhere (local, previews): stay put.
  const destination =
    process.env.VERCEL_ENV === "production" ? "https://appraisalsoftware.co.uk/" : new URL("/", getAppOrigin());
  return NextResponse.redirect(destination, {
    status: 302,
  });
}
