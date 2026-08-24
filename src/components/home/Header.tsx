"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/home/Logo";
import { PRIMARY_CTA_LABEL, PRIMARY_CTA_URL, SIGN_IN_URL } from "@/lib/links";
import { ROUTES } from "@/lib/routes";

const nav = [
  { label: "Appraisal Software", href: ROUTES.annualAppraisalSoftware },
  { label: "360 Feedback", href: ROUTES.feedback360Software },
  { label: "Resources", href: "/#resources" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={
        "font-display sticky top-0 z-50 transition-colors duration-300 " +
        (scrolled
          ? "border-b border-border bg-background/90 backdrop-blur-md shadow-sm"
          : "border-b border-transparent bg-background")
      }
    >
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-3 lg:px-8">
        <Link href={ROUTES.home} className="shrink-0">
          <Logo />
        </Link>
        <nav className="hidden flex-1 items-center justify-center gap-7 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <a
            href={SIGN_IN_URL}
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Sign in
          </a>
          <Button size="sm" className="px-4" asChild>
            <a href={PRIMARY_CTA_URL}>{PRIMARY_CTA_LABEL}</a>
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="ghost" className="lg:hidden" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[86%] max-w-xs">
              <div className="mt-8 flex flex-col gap-1">
                {nav.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-surface"
                  >
                    {item.label}
                  </Link>
                ))}
                <a
                  href={SIGN_IN_URL}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-base font-medium text-muted-foreground"
                >
                  Sign in
                </a>
                <Button className="mt-3" asChild>
                  <a href={PRIMARY_CTA_URL}>{PRIMARY_CTA_LABEL}</a>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
