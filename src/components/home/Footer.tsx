import Link from "next/link";

import { Logo } from "@/components/home/Logo";
import {
  CONTACT_URL,
  DISCLOSURELY_URL,
  PRIMARY_CTA_LABEL,
  PRIMARY_CTA_URL,
  PRIVACY_URL,
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
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-5 py-14 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.2fr_2fr]">
          <div>
            <Link href={ROUTES.home}>
              <Logo size="lg" />
            </Link>
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-muted-foreground">
              Simple appraisal and 360° feedback software for UK organisations. Create, send,
              collect and understand — without the heavyweight HR system.
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
