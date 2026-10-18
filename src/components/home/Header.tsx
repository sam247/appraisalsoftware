import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/home/Logo";
import { NetwiskLogo } from "@/components/brand/NetwiskLogo";
import { DISCLOSURELY_URL, PRIMARY_CTA_LABEL, PRIMARY_CTA_URL, SIGN_IN_URL } from "@/lib/links";
import { ROUTES } from "@/lib/routes";

/** Family strip, Intuit-style: Netwisk and its products side by side. */
function FamilyBar() {
  return (
    <div className="no-print border-b border-border bg-surface-2/70">
      <div className="mx-auto flex max-w-6xl items-center gap-5 px-5 py-1.5 text-[11px] lg:px-8">
        <span className="inline-flex text-foreground/80" aria-label="Netwisk">
          <NetwiskLogo size={14} />
        </span>
        <nav aria-label="Netwisk products" className="flex items-center gap-4 border-l border-border pl-5">
          <a href={DISCLOSURELY_URL} className="text-muted-foreground transition-colors hover:text-foreground">
            Whistleblowing
          </a>
          <span aria-current="page" className="font-semibold text-foreground">
            Appraisals
          </span>
        </nav>
        <span className="ml-auto hidden text-muted-foreground md:inline">Secure people software for UK organisations</span>
      </div>
    </div>
  );
}

export function Header() {
  return (
    <>
    <FamilyBar />
    <header className="no-print sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3.5 sm:gap-6 lg:px-8">
        <Link href={ROUTES.home} className="shrink-0" aria-label="appraisal.software home">
          <BrandMark size={30} />
        </Link>
        <nav aria-label="Main navigation" className="ml-auto flex items-center gap-3 sm:gap-5">
          <Link href={ROUTES.pricing} className="text-xs font-medium text-muted-foreground hover:text-foreground sm:text-[13px]">Pricing</Link>
          <a href={SIGN_IN_URL} className="whitespace-nowrap text-xs font-medium text-muted-foreground hover:text-foreground sm:text-[13px]">Sign in</a>
          <Button size="sm" className="px-3 text-xs sm:px-4 sm:text-sm" asChild>
            <a href={PRIMARY_CTA_URL}>{PRIMARY_CTA_LABEL}</a>
          </Button>
        </nav>
      </div>
    </header>
    </>
  );
}
