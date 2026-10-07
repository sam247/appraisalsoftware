import Link from "next/link";
import { marketingType } from "@/lib/marketing-typography";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PRIMARY_CTA_LABEL, PRIMARY_CTA_URL } from "@/lib/links";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

export function TextLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const classes = cn(
    "font-medium text-foreground underline decoration-border underline-offset-2 transition-colors hover:text-primary",
    className,
  );
  const external = href.startsWith("http");

  if (external) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
  breadcrumbs,
  compact = false,
  showCta = false,
  visual,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description: string;
  breadcrumbs?: { label: string; href: string }[];
  compact?: boolean;
  showCta?: boolean;
  visual?: React.ReactNode;
}) {
  return (
    <section className="border-b border-border bg-background">
      <div
        className={cn(
          "mx-auto max-w-6xl px-5 lg:px-8",
          compact ? "py-10 sm:py-14" : "py-16 lg:py-20",
        )}
      >
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              {breadcrumbs.map((crumb, index) => (
                <li key={crumb.href} className="flex items-center gap-1.5">
                  {index > 0 ? <span aria-hidden>/</span> : null}
                  {index === breadcrumbs.length - 1 ? (
                    <span className="text-foreground">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} className="hover:text-foreground">
                      {crumb.label}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
        <div
          className={cn(
            visual &&
              "grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16",
          )}
        >
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-primary">
                {eyebrow}
              </p>
            ) : null}
            <h1
              className={cn(
                "mt-4 max-w-3xl",
                compact
                  ? "font-display text-[2rem] font-semibold leading-[1.1] tracking-[-0.035em] sm:text-[2.5rem]"
                  : marketingType.h1Home,
              )}
            >
              {title}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {description}
            </p>
            {showCta ? (
              <Button size="lg" className="mt-8 px-7" asChild>
                <a href={PRIMARY_CTA_URL}>
                  {PRIMARY_CTA_LABEL}
                  <ArrowRight className="size-4" />
                </a>
              </Button>
            ) : null}
          </div>
          {visual ? <div className="min-w-0">{visual}</div> : null}
        </div>
      </div>
    </section>
  );
}

export function ContentSection({
  id,
  title,
  children,
  layout = "reading",
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
  layout?: "reading" | "split";
}) {
  return (
    <section
      id={id}
      className="marketing-content-section border-b border-border py-16 lg:py-20"
    >
      <div
        className={cn(
          "mx-auto max-w-6xl px-5 lg:px-8",
          layout === "split" &&
            "grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16",
        )}
      >
        <h2 className={cn("max-w-3xl", marketingType.h2)}>{title}</h2>
        <div
          className={cn(
            "max-w-3xl space-y-4 text-base leading-[1.75] text-muted-foreground",
            layout === "reading" && "mt-6",
          )}
        >
          {children}
        </div>
      </div>
    </section>
  );
}

export function FaqSection({
  items,
  collapsible = false,
}: {
  items: { question: string; answer: React.ReactNode }[];
  collapsible?: boolean;
}) {
  return (
    <section className="border-b border-border py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <h2 className={marketingType.h2}>FAQs</h2>
        {collapsible ? (
          <div className="mt-8 divide-y divide-border border-y border-border">
            {items.map((item) => (
              <details key={item.question} className="group">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-[15px] font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
                  <span>{item.question}</span>
                  <span aria-hidden="true" className="shrink-0 text-lg leading-6 text-primary">
                    <span className="group-open:hidden">+</span>
                    <span className="hidden group-open:inline">−</span>
                  </span>
                </summary>
                <div className="max-w-3xl pb-5 text-sm leading-relaxed text-muted-foreground">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        ) : (
          <dl className="mt-8 divide-y divide-border border-t border-border">
            {items.map((item) => (
              <div key={item.question} className="py-5">
                <dt className="text-[15px] font-semibold text-foreground">
                  {item.question}
                </dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.answer}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}

export function CtaBand({
  title,
  copy,
  primaryLabel = PRIMARY_CTA_LABEL,
  primaryHref = PRIMARY_CTA_URL,
  secondaryHref,
  secondaryLabel,
}: {
  title: string;
  copy: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <section className="marketing-contrast no-print px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-6xl py-2 text-center sm:py-5">
        <h2 className={marketingType.h2}>{title}</h2>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
          {copy}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" className="w-full px-7 sm:w-auto" asChild>
            <a href={primaryHref}>
              {primaryLabel}
              <ArrowRight className="size-4" />
            </a>
          </Button>
          {secondaryHref && secondaryLabel ? (
            <Button
              size="lg"
              variant="outline"
              className="w-full px-7 sm:w-auto"
              asChild
            >
              <Link href={secondaryHref}>{secondaryLabel}</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function RelatedLinks({
  title = "Related pages",
  links,
}: {
  title?: string;
  links: { href: string; label: string; copy: string }[];
}) {
  return (
    <section className="border-b border-border py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <h2 className={marketingType.h2}>{title}</h2>
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="marketing-card block h-full rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
              >
                <p className="text-sm font-semibold text-foreground">
                  {link.label}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {link.copy}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function homeCrumb() {
  return { label: "Home", href: ROUTES.home };
}
