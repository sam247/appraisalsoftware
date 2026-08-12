import { Logo } from "@/components/home/Logo";
import { DISCLOSURELY_URL } from "@/lib/links";

const footerLinks = {
  product: [
    { label: "Product", href: "#product" },
    { label: "360° Feedback", href: "#feedback-360" },
    { label: "Appraisals", href: "#appraisals" },
    { label: "Pricing", href: "#pricing" },
  ],
  resources: [
    { label: "360° Feedback Question Generator", href: "#resources" },
    { label: "Employee Appraisal Template", href: "#resources" },
    { label: "360° Feedback Template", href: "#resources" },
    { label: "Appraisal Questions", href: "#resources" },
  ],
  company: [
    { label: "Privacy", href: `${DISCLOSURELY_URL}/privacy` },
    { label: "Terms", href: `${DISCLOSURELY_URL}/terms` },
    { label: "Contact", href: `${DISCLOSURELY_URL}/contact` },
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
            <Logo size="lg" />
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-muted-foreground">
              Employee appraisal and 360° feedback software for UK organisations.
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
                      <a
                        href={link.href}
                        className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                        {...(link.href.startsWith("http")
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-border pt-6 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            Appraisal Software is a product by{" "}
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
