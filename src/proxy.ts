/**
 * proxy.ts — Next.js 16 Proxy (formerly middleware.ts).
 *
 * NOTE: In Next.js 16, the file convention was renamed from `middleware.ts`
 * to `proxy.ts` and the export from `middleware()` to `proxy()`.
 * This file provides session refresh for all routes and protects /app/*.
 */
import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  // Protect /app/* — redirect unauthenticated visitors to /login
  if (pathname === "/app" || pathname.startsWith("/app/")) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If already signed in, skip auth pages
  if (user && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Run on all paths except static files, images, and metadata.
     * Proxy still runs for /_next/data/* despite the exclusion — intentional.
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
