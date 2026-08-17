"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/home/Logo";
import { DISCLOSURELY_SIGN_IN, EARLY_ACCESS_URL } from "@/lib/links";
import { ROUTES } from "@/lib/routes";

const nav = [
  { label: "Features", href: "/#features" },
  { label: "Annual Appraisals", href: ROUTES.annualAppraisalSoftware },
  { label: "360 Feedback", href: ROUTES.feedback360Software },
  { label: "Templates", href: "/#resources" },
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
          ? "border-b border-border bg-background/85 backdrop-blur-md"
          : "border-b border-transparent bg-background")
      }
    >
      <div className="mx-auto flex h-18 max-w-6xl items-center gap-6 px-5 py-3 lg:px-8">
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
            href={DISCLOSURELY_SIGN_IN}
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Sign in
          </a>
          <Button size="sm" className="rounded-full px-4" asChild>
            <a href={EARLY_ACCESS_URL}>Request early access</a>
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
                  href={DISCLOSURELY_SIGN_IN}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-base font-medium text-muted-foreground"
                >
                  Sign in
                </a>
                <Button className="mt-3 rounded-full" asChild>
                  <a href={EARLY_ACCESS_URL}>Request early access</a>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
