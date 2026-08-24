import Link from "next/link";

import { Logo } from "@/components/home/Logo";
import {
  CONTACT_URL,
  DISCLOSURELY_URL,
  PRIMARY_CTA_LABEL,
  PRIMARY_CTA_URL,
  PRIVACY_URL,
  PRODUCT_PAGE_URL,
  TERMS_URL,
} from "@/lib/links";
import { ROUTES } from "@/lib/routes";

const footerLinks = {
  product: [
    { label: "Annual appraisal software", href: ROUTES.annualAppraisalSoftware },
    { label: "Employee appraisal software", href: ROUTES.employeeAppraisalSoftware },
    { label: "360 feedback software", href: ROUTES.feedback360Software },
    { label: PRIMARY_CTA_LABEL, href: PRIMARY_CTA_URL },
  ],
  resources: [
    { label: "Annual appraisal template", href: ROUTES.annualAppraisalTemplate },
    { label: "Appraisal questions", href: ROUTES.appraisalQuestions },
    { label: "360 feedback template", href: ROUTES.feedback360Template },
  ],
  company: [
    { label: "Appraisals on Disclosurely", href: PRODUCT_PAGE_URL },
    { label: "Privacy", href: PRIVACY_URL },
    { label: "Terms", href: TERMS_URL },
    { label: "Contact", href: CONTACT_URL },
  ],
};

const columns = [
  { heading: "Product", links: footerLinks.product },
  { heading: "Resources", links: footerLinks.resources },
  { heading: "Company", links: footerLinks.company },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface/70">
      <div className="mx-auto max-w-6xl px-5 py-14 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.2fr_2fr]">
          <div>
            <Link href={ROUTES.home}>
              <Logo size="lg" showAttribution={false} />
            </Link>
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-muted-foreground">
              AppraisalSoftware.co.uk is the specialist site for annual appraisals and 360° feedback
              for UK teams. The product is built and hosted by{" "}
              <a
                href={DISCLOSURELY_URL}
                className="font-medium text-foreground/80 underline decoration-border underline-offset-2 hover:text-foreground"
              >
                Disclosurely
              </a>
              . Not a full HR system — just a clean way to run appraisal cycles.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {columns.map((col) => (
              <div key={col.heading}>
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                  {col.heading}
                </p>
                <ul className="mt-3 space-y-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {link.href.startsWith("http") ? (
                        <a
                          href={link.href}
                          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                          target="_blank"
                          rel="noopener noreferrer"
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
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-border pt-6 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            A product by{" "}
            <a
              href={DISCLOSURELY_URL}
              className="font-medium text-foreground/80 underline decoration-border underline-offset-2 transition-colors hover:text-foreground"
            >
              Disclosurely
            </a>
            .
          </p>
          <p>© {new Date().getFullYear()} Disclosurely. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
