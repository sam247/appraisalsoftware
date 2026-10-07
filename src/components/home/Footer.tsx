import Link from "next/link";

import { BrandMark } from "@/components/home/Logo";
import { CookieSettings } from "@/components/consent/CookieSettings";
import { DISCLOSURELY_URL } from "@/lib/links";
import { LEGAL_ROUTES, ROUTES } from "@/lib/routes";

const footerLinks = {
  product: [
    { label: "Employee appraisal software", href: ROUTES.employeeAppraisalSoftware },
    { label: "360 appraisals", href: ROUTES.feedback360Software },
    { label: "Pricing", href: ROUTES.pricing },
    { label: "How it works", href: ROUTES.howItWorks },
  ],
  resources: [
    { label: "All templates", href: ROUTES.templates },
    { label: "Resource library", href: ROUTES.resources },
  ],
  company: [
    { label: "Contact", href: ROUTES.contact },
    { label: "Privacy policy", href: LEGAL_ROUTES.privacy },
    { label: "Cookie policy", href: LEGAL_ROUTES.cookies },
  ],
};

const columns = [
  { heading: "Product", links: footerLinks.product },
  { heading: "Resources", links: footerLinks.resources },
  { heading: "Company", links: footerLinks.company },
];

export function Footer() {
  return (
    <footer className="no-print border-t border-border bg-surface/70">
      <div className="mx-auto max-w-6xl px-5 py-14 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.2fr_2fr]">
          <div>
            <Link href={ROUTES.home} className="inline-flex" aria-label="appraisal.software home">
              <BrandMark size={30} />
            </Link>
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-muted-foreground">
              Appraisal software for UK teams, with free review templates and practical
              guides. Run employee appraisals and anonymous 360 feedback without a
              heavyweight HR system.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {columns.map((col) => (
              <div key={col.heading}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground">
                  {col.heading}
                </p>
                <ul className="mt-3 space-y-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {link.href.startsWith("http") || link.href.startsWith("#") ? (
                        <a
                          href={link.href}
                          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                          {...(link.href.startsWith("http")
                            ? { target: "_blank", rel: "noopener noreferrer" }
                            : {})}
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                  {col.heading === "Company" ? <li><CookieSettings /></li> : null}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            From the team behind{" "}
            <a
              href={DISCLOSURELY_URL}
              className="font-medium text-foreground/70 underline decoration-border underline-offset-2 transition-colors hover:text-foreground"
              target="_blank"
              rel="noopener noreferrer"
            >
              Disclosurely
            </a>
            .
          </p>
          <p>© {new Date().getFullYear()} Appraisal Software. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
