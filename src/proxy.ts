/**
 * proxy.ts — Next.js 16 Proxy (formerly middleware.ts).
 *
 * NOTE: In Next.js 16, the file convention was renamed from `middleware.ts`
 * to `proxy.ts` and the export from `middleware()` to `proxy()`.
 * This file provides session refresh for all routes and protects /app/*.
 */
import { updateSession } from "@/lib/supabase/middleware";
import {
  APP_HOST,
  isAppProductPath,
  isMarketingHostname,
  hostnameOf,
} from "@/lib/hosts";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const hostname = hostnameOf(
    request.headers.get("host") ?? request.nextUrl.host,
  );
  const pathname = request.nextUrl.pathname;

  // Apex marketing host → app subdomain for product surfaces (auth + workspace).
  // Do this before session work so login never starts on the wrong cookie host.
  // Skip localhost / preview hosts (they are not the marketing hostname).
  if (isMarketingHostname(hostname) && isAppProductPath(pathname)) {
    const target = request.nextUrl.clone();
    target.protocol = "https:";
    target.host = APP_HOST;
    return NextResponse.redirect(target, 308);
  }

  const { supabaseResponse, user } = await updateSession(request);

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
