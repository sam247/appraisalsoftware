"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  FileBarChart,
  CircleCheck,
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
  { href: "/dashboard/reports", label: "Reports", icon: FileBarChart },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

function CreateButton({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href="/dashboard/campaigns/new"
      onClick={onNavigate}
      className="flex h-10 items-center justify-center gap-2 rounded-md border border-input bg-card px-3 text-[13px] font-medium text-foreground transition-colors hover:bg-surface"
    >
      <Plus className="size-4" aria-hidden />
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
        className="field h-10 w-full rounded-md bg-card pl-9"
      />
    </form>
  );
}

function AccountMenu({
  displayName,
  email,
  role,
  avatarUrl,
}: {
  displayName: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const initial = (displayName[0] ?? email[0] ?? "A").toUpperCase();
  const roleLabel = role === "owner" ? "Owner" : role === "admin" ? "Admin" : role;

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-foreground text-xs font-medium text-background transition-opacity hover:opacity-90"
      >
        <span className="sr-only">Account menu</span>
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="size-full object-cover" />
        ) : (
          initial
        )}
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
            className="menu-surface absolute right-0 z-50 mt-2 w-64 p-1.5"
          >
            <div className="px-2.5 pb-2.5 pt-1.5">
              <div className="flex items-center gap-2.5">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt=""
                    className="size-8 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-medium text-background">
                    {initial}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {displayName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{email}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {roleLabel}
                  </p>
                </div>
              </div>
            </div>
            <Link
              href="/dashboard/account"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="mt-1 flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-surface"
            >
              <Settings className="size-4 text-muted-foreground" aria-hidden />
              My account
            </Link>
            <form action="/logout" method="POST">
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-surface"
              >
                <LogOut className="size-4 text-muted-foreground" aria-hidden />
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
    <div className="mt-auto space-y-1 pt-3">
      {showUpgrade && (
        <Link
          href="/dashboard/upgrade"
          onClick={onNavigate}
          className="flex h-8 items-center justify-center rounded-md bg-primary px-3 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          Upgrade
        </Link>
      )}
      <form action="/logout" method="POST">
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
        >
          <LogOut className="size-4" aria-hidden />
          Log out
        </button>
      </form>
    </div>
  );
}

function AppLinks({
  mobile,
  showGettingStarted,
  onNavigate,
}: {
  mobile?: boolean;
  showGettingStarted: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav
      aria-label={mobile ? "Mobile application" : "Application"}
      className="space-y-0.5"
    >
      {showGettingStarted && <NavLink href="/dashboard/getting-started" label="Getting Started" icon={CircleCheck} onNavigate={onNavigate} />}
      {NAV.map((item) => (
        <NavLink key={item.href} {...item} onNavigate={onNavigate} />
      ))}

    </nav>
  );
}

export default function AppNavigation({
  organization,
  displayName,
  email,
  role,
  avatarUrl,
  showUpgrade,
  showGettingStarted,
  children,
}: {
  organization: string;
  displayName: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  showUpgrade: boolean;
  showGettingStarted: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const focusedForm = /^\/dashboard\/campaigns\/(new|[^/]+\/(form|people|reviewers))$/.test(usePathname());

  return (
    <div className="admin-shell min-h-screen bg-background">
      {!focusedForm && <header className="app-header sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border/80 bg-background/90 px-3 backdrop-blur-md sm:px-4 md:px-5">
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
              className="admin-overlay bg-card flex w-[min(90vw,300px)] flex-col"
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
              <div className="flex-1 overflow-y-auto">
                <AppLinks mobile showGettingStarted={showGettingStarted} onNavigate={() => setOpen(false)} />
              </div>
              <SidebarFooter
                showUpgrade={showUpgrade}
                onNavigate={() => setOpen(false)}
              />
            </SheetContent>
          </Sheet>
          <Link href="/dashboard" aria-label="Appraisal Software home" className="shrink-0"><BrandMark size={32} /></Link>
        </div>

        <div className="mx-auto flex min-w-0 flex-1 justify-center px-1 sm:px-4"><SearchField /></div>

        <div className="flex shrink-0 items-center gap-3">
          <a
            href={CONTACT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline"
          >
            Help
          </a>
          <AccountMenu
            displayName={displayName}
            email={email}
            role={role}
            avatarUrl={avatarUrl}
          />
        </div>
      </header>}

      <div className="md:flex">
        {!focusedForm && <aside className="app-sidebar sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 flex-col border-r border-border bg-card px-3 py-5 md:flex">
          <CreateButton />
          <div className="mt-4 flex-1 overflow-y-auto">
            <AppLinks showGettingStarted={showGettingStarted} />
          </div>
          <SidebarFooter showUpgrade={showUpgrade} />
        </aside>}

        <main id="main-content" className="dashboard-main min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
