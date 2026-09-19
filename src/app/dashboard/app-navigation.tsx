"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Logo } from "@/components/home/Logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import NavLink from "./nav-link";

const NAV = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/campaigns", label: "Campaigns" },
  { href: "/dashboard/people", label: "People" },
  { href: "/dashboard/templates", label: "Templates" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default function AppNavigation({
  organization,
}: {
  organization: string;
}) {
  const [open, setOpen] = useState(false);
  const links = (mobile = false) => (
    <nav
      aria-label={mobile ? "Mobile application" : "Application"}
      className="space-y-1"
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
  const signOut = (
    <form action="/logout" method="POST">
      <Button
        type="submit"
        variant="ghost"
        className="w-full justify-start text-muted-foreground"
      >
        Sign out
      </Button>
    </form>
  );
  return (
    <>
      <aside className="hidden md:flex sticky top-0 h-screen w-64 shrink-0 flex-col bg-card px-5 py-8">
        <Link href="/dashboard" aria-label="Appraisal Software overview">
          <Logo />
        </Link>
        <p className="mt-8 mb-6 px-4 text-sm font-medium break-words">
          {organization}
        </p>
        {links()}
        <div className="mt-auto pt-8">
          {signOut}
          <p className="mt-4 px-4 text-xs text-muted-foreground">
            Annual appraisals, made clear.
          </p>
        </div>
      </aside>
      <header className="md:hidden sticky top-0 z-30 flex h-16 items-center justify-between bg-card border-b border-border px-4">
        <Link href="/dashboard" aria-label="Appraisal Software overview">
          <Logo />
        </Link>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open application navigation"
            >
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="bg-card flex flex-col w-[min(90vw,320px)]"
          >
            <SheetTitle className="font-display mt-5">
              Your workspace
            </SheetTitle>
            <SheetDescription className="break-words mb-6">
              {organization}
            </SheetDescription>
            {links(true)}
            <div className="mt-auto">{signOut}</div>
          </SheetContent>
        </Sheet>
      </header>
    </>
  );
}
