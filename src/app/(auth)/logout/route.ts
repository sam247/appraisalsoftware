import { createClient } from "@/lib/supabase/server";
import { getAppOrigin } from "@/lib/app-origin";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", getAppOrigin()), {
    status: 302,
  });
}
