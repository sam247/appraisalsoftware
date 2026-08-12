import { Logo } from "@/components/home/Logo";
import { DISCLOSURELY_URL } from "@/lib/links";

const columns = [
  {
    heading: "Product",
    links: ["Product", "360° Feedback", "Appraisals", "Pricing"],
  },
  {
    heading: "Resources",
    links: [
      "360° Feedback Question Generator",
      "Employee Appraisal Template",
      "360° Feedback Template",
      "Appraisal Questions",
    ],
  },
  {
    heading: "Company",
    links: ["Privacy", "Terms", "Contact"],
  },
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
                  {col.links.map((l) => (
                    <li key={l}>
                      <a
                        href="#top"
                        className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {l}
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
              target="_blank"
              rel="noopener noreferrer"
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
