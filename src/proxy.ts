/**
 * proxy.ts — Next.js 16 Proxy (formerly middleware.ts).
 *
 * Session refresh for all routes; product surfaces live on
 * app.appraisalsoftware.co.uk under /dashboard (legacy /app redirects).
 */
import { updateSession } from "@/lib/supabase/middleware";
import {
  APP_HOST,
  MARKETING_HOST,
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

  // Apex marketing host → app subdomain for product surfaces.
  if (isMarketingHostname(hostname) && isAppProductPath(pathname)) {
    const target = request.nextUrl.clone();
    target.protocol = "https:";
    target.host = APP_HOST;
    return NextResponse.redirect(target, 308);
  }

  // App host → marketing host for public pages (pricing, templates, blog…),
  // so leaving the product never strands visitors on app.appraisalsoftware.co.uk.
  // The bare app host is the workspace entrance (signed-out visitors go on to /login).
  if (hostname === APP_HOST && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url), 307);
  }
  if (
    hostname === APP_HOST &&
    !isAppProductPath(pathname) &&
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/_next/") &&
    !/\.[a-z0-9]+$/i.test(pathname)
  ) {
    const target = request.nextUrl.clone();
    target.protocol = "https:";
    target.host = MARKETING_HOST;
    target.port = "";
    return NextResponse.redirect(target, 308);
  }

  const { supabaseResponse, user } = await updateSession(request);

  // Legacy /app → /dashboard (preserve deep links)
  if (pathname === "/app" || pathname.startsWith("/app/")) {
    const target = request.nextUrl.clone();
    target.pathname = pathname.replace(/^\/app/, "/dashboard") || "/dashboard";
    return NextResponse.redirect(target, 308);
  }

  // Protect workspace + onboarding
  if (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/onboarding"
  ) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Signed-in users skip auth pages
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const plan = request.nextUrl.searchParams.get("plan");
    const next = plan === "pro" || plan === "organisation" ? "/dashboard/upgrade" : "/dashboard";
    return NextResponse.redirect(new URL(next, request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
