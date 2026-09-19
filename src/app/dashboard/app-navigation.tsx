"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  Plus,
  LayoutDashboard,
  Megaphone,
  Users,
  FileText,
  Settings,
  LogOut,
  Search,
} from "lucide-react";
import { BrandMark } from "@/components/home/Logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CONTACT_URL } from "@/lib/links";
import NavLink from "./nav-link";

const NAV = [
  { href: "/dashboard", label: "Home", exact: true, icon: LayoutDashboard },
  { href: "/dashboard/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/dashboard/people", label: "People", icon: Users },
  { href: "/dashboard/templates", label: "Templates", icon: FileText },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

function CreateButton({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href="/dashboard/campaigns/new"
      onClick={onNavigate}
      className="flex items-center justify-center gap-1.5 rounded-full border border-primary/35 bg-card px-3 py-2 text-[13px] font-semibold text-foreground transition-colors hover:bg-accent hover:border-primary/55"
    >
      <Plus className="size-3.5" aria-hidden />
      Create
    </Link>
  );
}

function SearchField() {
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <form
      role="search"
      className="relative w-full max-w-xl"
      onSubmit={(e) => {
        e.preventDefault();
        const query = q.trim();
        if (!query) return;
        router.push(`/dashboard/search?q=${encodeURIComponent(query)}`);
      }}
    >
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        type="search"
        name="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search people, campaigns, templates…"
        aria-label="Search workspace"
        className="h-9 w-full rounded-full border border-border bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </form>
  );
}

function AccountMenu({
  organization,
  email,
  role,
}: {
  organization: string;
  email: string;
  role: string;
}) {
  const [open, setOpen] = useState(false);
  const initial = (email[0] ?? organization[0] ?? "A").toUpperCase();

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground hover:opacity-90"
      >
        <span className="sr-only">Account menu</span>
        {initial}
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-label="Close account menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-border bg-card p-2 shadow-lg"
          >
            <div className="border-b border-border px-2.5 pb-2.5 pt-1.5">
              <p className="truncate text-sm font-semibold text-foreground">
                {organization}
              </p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
              <p className="mt-1 text-[11px] capitalize text-muted-foreground">
                {role}
              </p>
            </div>
            <Link
              href="/dashboard/settings"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="mt-1 flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-surface"
            >
              <Settings className="size-3.5 text-muted-foreground" aria-hidden />
              Account &amp; settings
            </Link>
            <form action="/logout" method="POST">
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-surface"
              >
                <LogOut className="size-3.5 text-muted-foreground" aria-hidden />
                Log out
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

function SidebarFooter({
  showUpgrade,
  onNavigate,
}: {
  showUpgrade: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="mt-auto space-y-2 border-t border-border pt-3">
      {showUpgrade && (
        <Link
          href="/dashboard/upgrade"
          onClick={onNavigate}
          className="flex items-center justify-center rounded-full bg-primary px-3 py-2 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          Upgrade
        </Link>
      )}
      <form action="/logout" method="POST">
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
        >
          <LogOut className="size-3.5" aria-hidden />
          Log out
        </button>
      </form>
    </div>
  );
}

export default function AppNavigation({
  organization,
  email,
  role,
  showUpgrade,
  children,
}: {
  organization: string;
  email: string;
  role: string;
  showUpgrade: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const links = (mobile = false) => (
    <nav
      aria-label={mobile ? "Mobile application" : "Application"}
      className="space-y-0.5"
    >
      {NAV.map((item) => (
        <NavLink
          key={item.href}
          {...item}
          onNavigate={mobile ? () => setOpen(false) : undefined}
        />
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Full-width top bar — logo, search, help, profile */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-card px-3 sm:px-4 md:px-5">
        <div className="flex shrink-0 items-center gap-1">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open application navigation"
              >
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="bg-card flex w-[min(90vw,300px)] flex-col"
            >
              <SheetTitle className="mt-4 text-base font-semibold">
                {organization}
              </SheetTitle>
              <SheetDescription className="sr-only">
                Application navigation
              </SheetDescription>
              <div className="mt-3 mb-4">
                <CreateButton onNavigate={() => setOpen(false)} />
              </div>
              <div className="flex-1 overflow-y-auto">{links(true)}</div>
              <SidebarFooter
                showUpgrade={showUpgrade}
                onNavigate={() => setOpen(false)}
              />
            </SheetContent>
          </Sheet>
          <Link
            href="/dashboard"
            aria-label="Appraisal Software home"
            className="shrink-0"
          >
            <BrandMark size={28} />
          </Link>
        </div>

        <div className="mx-auto flex min-w-0 flex-1 justify-center px-1 sm:px-4">
          <SearchField />
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <a
            href={CONTACT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline"
          >
            Help
          </a>
          <AccountMenu organization={organization} email={email} role={role} />
        </div>
      </header>

      <div className="md:flex">
        <aside className="hidden md:flex sticky top-14 h-[calc(100vh-3.5rem)] w-[13.5rem] shrink-0 flex-col border-r border-border bg-card px-3 py-4">
          <CreateButton />
          <div className="mt-4 flex-1 overflow-y-auto">{links()}</div>
          <SidebarFooter showUpgrade={showUpgrade} />
        </aside>

        <main id="main-content" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
