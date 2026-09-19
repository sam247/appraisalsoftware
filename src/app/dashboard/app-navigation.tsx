"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { BrandMark } from "@/components/home/Logo";
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
  const signOut = (
    <form action="/logout" method="POST">
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="w-full justify-start text-muted-foreground"
      >
        Sign out
      </Button>
    </form>
  );
  return (
    <>
      <aside className="hidden md:flex sticky top-0 h-screen w-52 shrink-0 flex-col border-r border-border bg-card px-3 py-5">
        <Link href="/dashboard" aria-label="Appraisal Software overview" className="px-2">
          <BrandMark size={32} />
        </Link>
        <p className="mt-4 mb-3 px-2 text-xs font-medium text-muted-foreground break-words">
          {organization}
        </p>
        {links()}
        <div className="mt-auto pt-4">
          {signOut}
        </div>
      </aside>
      <header className="md:hidden sticky top-0 z-30 flex h-12 items-center justify-between bg-card border-b border-border px-3">
        <Link href="/dashboard" aria-label="Appraisal Software overview">
          <BrandMark size={28} />
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
