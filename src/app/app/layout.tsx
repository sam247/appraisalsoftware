import type { Metadata } from "next";
import { requireOrgAdmin } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import NavLink from "./nav-link";
import { Logo } from "@/components/home/Logo";

export const metadata: Metadata = { robots: { index: false, follow: false } };

const NAV = [
  { href: "/app", label: "Overview", exact: true },
  { href: "/app/campaigns", label: "Campaigns" },
  { href: "/app/people", label: "People" },
  { href: "/app/templates", label: "Templates" },
  { href: "/app/settings", label: "Settings" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let orgAdmin;
  try {
    orgAdmin = await requireOrgAdmin();
  } catch {
    redirect("/login");
  }

  const { org } = orgAdmin;

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 flex-col border-r border-border bg-card">
        {/* Product identity and organisation */}
        <div className="px-5 py-5 border-b border-border">
          <Link href="/app" className="mb-3 block" aria-label="appraisal.software overview">
            <Logo />
          </Link>
          <div>
            <span className="font-display text-sm font-semibold text-foreground leading-tight line-clamp-2">
              {org.name}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>

        {/* Sign out */}
        <div className="border-t border-border px-3 py-3">
          <form action="/logout" method="POST">
            <button
              type="submit"
              className="w-full text-left rounded-md px-2.5 py-2 text-sm text-muted-foreground hover:bg-surface hover:text-foreground transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-10 flex items-center justify-between border-b border-border bg-card px-4 h-14">
        <Link
          href="/app"
          className="font-display text-sm font-semibold text-foreground"
        >
          <Logo />
        </Link>
        <span className="ml-3 truncate text-xs text-muted-foreground">{org.name}</span>
        {/* ponytail: mobile nav drawer deferred to Phase 2 */}
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto md:pt-0 pt-14">
        <div className="mx-auto max-w-4xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
