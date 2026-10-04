"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { BrandMark } from "@/components/home/Logo";
import { PRIMARY_CTA_LABEL, PRIMARY_CTA_URL, SIGN_IN_URL } from "@/lib/links";
import { ROUTES } from "@/lib/routes";

const nav = [
  { label: "How it works", href: ROUTES.howItWorks },
  { label: "Pricing", href: ROUTES.pricing },
  { label: "Resources", href: ROUTES.resources },
  { label: "Contact", href: ROUTES.contact },
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
    <>
      <div className="no-print bg-[#171815] px-4 py-2 text-center text-xs text-white sm:text-[13px]">
        A clearer review cycle starts here.{" "}
        <a href={PRIMARY_CTA_URL} className="inline-flex items-center gap-1 font-semibold text-[#a9e8c2] underline-offset-4 hover:underline">
          {PRIMARY_CTA_LABEL} <ArrowRight className="size-3.5" aria-hidden />
        </a>
      </div>
      <header
        className={
          "no-print sticky top-0 z-50 transition-all duration-300 " +
          (scrolled
            ? "border-b border-border bg-background/95 backdrop-blur-md"
            : "border-b border-border bg-background")
        }
      >
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-3.5 lg:px-8">
          <Link href={ROUTES.home} className="shrink-0" aria-label="appraisal.software home">
            <BrandMark size={30} />
          </Link>
          <noscript><nav aria-label="Navigation without JavaScript" className="flex flex-wrap gap-3 text-xs lg:hidden">{nav.map((item) => <a key={item.label} href={item.href} className="underline">{item.label}</a>)}</nav></noscript>
          <div className="ml-auto flex items-center gap-3 sm:gap-5">
            <nav aria-label="Main navigation" className="hidden items-center gap-5 lg:flex">
              {nav.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <a
              href={SIGN_IN_URL}
              className="hidden text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground lg:block"
            >
              Sign in
            </a>
            <Button size="sm" className="px-3 sm:px-4" asChild>
              <a href={PRIMARY_CTA_URL}>{PRIMARY_CTA_LABEL}</a>
            </Button>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button size="icon" variant="ghost" className="lg:hidden" aria-label="Open menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[86%] max-w-xs">
                <SheetTitle className="sr-only">Site navigation</SheetTitle>
                <SheetDescription className="sr-only">Browse appraisal pages, templates and resources.</SheetDescription>
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
    </>
  );
}
