import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/home/Logo";
import { PRIMARY_CTA_LABEL, PRIMARY_CTA_URL, SIGN_IN_URL } from "@/lib/links";
import { ROUTES } from "@/lib/routes";

export function Header() {
  return (
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
  );
}
