import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EARLY_ACCESS_URL } from "@/lib/links";
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
}: {
  eyebrow?: string;
  title: string;
  description: string;
  breadcrumbs?: { label: string; href: string }[];
}) {
  return (
    <section className="border-b border-border bg-surface/50">
      <div className="mx-auto max-w-3xl px-5 py-14 lg:px-8 lg:py-20">
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
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-3 text-3xl font-semibold text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
          {title}
        </h1>
        <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
          {description}
        </p>
      </div>
    </section>
  );
}

export function ContentSection({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="border-b border-border py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-5 lg:px-8">
        <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">{title}</h2>
        <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {children}
        </div>
      </div>
    </section>
  );
}

export function FaqSection({
  items,
}: {
  items: { question: string; answer: React.ReactNode }[];
}) {
  return (
    <section className="border-b border-border py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-5 lg:px-8">
        <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">FAQs</h2>
        <dl className="mt-8 space-y-6">
          {items.map((item) => (
            <div key={item.question} className="rounded-2xl border border-border bg-card p-5">
              <dt className="text-base font-semibold text-foreground">{item.question}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export function CtaBand({
  title,
  copy,
  primaryLabel = "Request early access",
  secondaryHref,
  secondaryLabel,
}: {
  title: string;
  copy: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <section className="px-5 py-16 lg:px-8">
      <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-primary/20 bg-primary/5 px-6 py-12 text-center sm:px-10">
        <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">{title}</h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {copy}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" className="w-full rounded-full px-6 sm:w-auto" asChild>
            <a href={EARLY_ACCESS_URL}>
              {primaryLabel}
              <ArrowRight className="size-4" />
            </a>
          </Button>
          {secondaryHref && secondaryLabel ? (
            <Button
              size="lg"
              variant="outline"
              className="w-full rounded-full border-border bg-card px-6 sm:w-auto"
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
    <section className="border-b border-border bg-surface/50 py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-5 lg:px-8">
        <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">{title}</h2>
        <ul className="mt-6 grid gap-3">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="block rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
              >
                <p className="text-sm font-semibold text-foreground">{link.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{link.copy}</p>
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
