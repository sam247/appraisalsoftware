import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { SiteChrome } from "@/components/layout/SiteChrome";
import {
  PageHero,
  FaqSection,
  CtaBand,
  homeCrumb,
} from "@/components/marketing/PageSections";
import { ProcessRail } from "@/components/resources/ResourceVisual";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { PRIMARY_CTA_URL } from "@/lib/links";
import { pageMetadata } from "@/lib/metadata";
import { PRIMARY_CTA_LABEL } from "@/lib/links";
import { plans, planContactHref } from "@/lib/pricing";

const availablePlans = plans;

export const metadata = pageMetadata({
  title: "Pricing | Appraisal Software",
  description:
    "Free appraisal software for up to 10 employees. Compare Free forever, Pro at £39.99 and Organisation at £89.99 per month + VAT.",
  path: "/pricing",
});
export default function PricingPage() {
  return (
    <SiteChrome>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Pricing", path: "/pricing" },
        ])}
      />
      <PageHero
        eyebrow="Straightforward pricing"
        title={
          <>
            A clear plan for{" "}
            <span className="marketing-editorial text-primary">
              your next review.
            </span>
          </>
        }
        description="Start Free with a complete employee appraisal workflow for up to 10 people. No card required. Upgrade for more capacity or anonymous 360 feedback. Paid plans are activated with our team."
        breadcrumbs={[homeCrumb(), { label: "Pricing", href: "/pricing" }]}
      />
      <section className="px-5 pb-16 pt-12 lg:px-0 lg:pb-24">
        <div className="mx-auto max-w-6xl lg:px-8">
          <div className="grid gap-5 lg:grid-cols-3">
            {availablePlans.map((plan) => (
              <article
                key={plan.name}
                className={`marketing-card flex flex-col rounded-2xl border bg-card p-7 ${plan.name === "Pro" ? "border-primary ring-1 ring-primary" : "border-border"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold">{plan.name}</h2>
                  {plan.name === "Pro" ? (
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      For growing teams
                    </span>
                  ) : null}
                </div>
                <p className="mt-6 text-4xl font-semibold tracking-tight">
                  {plan.price}
                  <span className="text-sm font-normal text-muted-foreground">
                    {plan.name === "Free" ? "" : " /month"}
                  </span>
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {plan.name === "Free"
                    ? "Forever. No card required."
                    : "Per workspace per month + VAT."}
                </p>
                <p className="mt-6 min-h-12 text-sm leading-relaxed text-muted-foreground">
                  {plan.audience}
                </p>
                <ul className="my-7 space-y-3 text-sm">
                  {[
                    `${plan.employees} active employees`,
                    `${plan.campaigns} active campaign${plan.campaigns === 1 ? "" : "s"}`,
                    `${plan.admins} admin${plan.admins === 1 ? "" : "s"}, including the owner`,
                    "Employee / annual appraisals",
                    ...(plan.feedback360 ? ["Anonymous 360 appraisals"] : []),
                    plan.templates,
                    "Results and history retained",
                    plan.support,
                    ...(plan.setup ? ["Optional setup session"] : []),
                  ].map((item) => (
                    <li key={item} className="flex gap-2">
                      <Check
                        className="size-4 shrink-0 text-primary"
                        aria-hidden
                      />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button
                  size="lg"
                  variant={plan.name === "Organisation" ? "outline" : "default"}
                  className="mt-auto w-full"
                  asChild
                >
                  <a
                    href={plan.name === "Free" ? PRIMARY_CTA_URL : planContactHref(plan.name)}
                  >
                    {plan.name === "Free" ? PRIMARY_CTA_LABEL : `Contact us about ${plan.name}`}
                    <ArrowRight className="size-4" aria-hidden />
                  </a>
                </Button>
              </article>
            ))}
          </div>
          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            These are workspace capacity limits. Paid activation and
            capacity are managed with our team. If you need more than 250
            employees,{" "}
            <Link
              href="/contact?type=pricing"
              className="font-medium text-primary underline underline-offset-4"
            >
              tell us about your team
            </Link>
            .
          </p>
        </div>
      </section>
      <section className="border-y border-border bg-surface/60 px-5 py-16 lg:px-0 lg:py-24">
        <div className="mx-auto max-w-6xl lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Compare the details
          </p>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            The workflow stays complete.
          </h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
            Choose by capacity, rather than losing the tools you need to finish
            a review.
          </p>
          <div className="mt-10 overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full min-w-[620px] text-left text-sm">
              <caption className="sr-only">
                Appraisal Software plan comparison
              </caption>
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th scope="col" className="p-5 font-semibold">
                    Included per workspace
                  </th>
                  {availablePlans.map((p) => (
                    <th key={p.name} scope="col" className="p-5 font-semibold">
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Employees", values: availablePlans.map((p) => p.employees) },
                  {
                    label: "Active campaigns",
                    values: availablePlans.map((p) => p.campaigns),
                  },
                  {
                    label: "Admins (including owner)",
                    values: availablePlans.map((p) => p.admins),
                  },
                  { label: "Employee appraisals", values: availablePlans.map(() => "Included") },
                  { label: "Anonymous 360 appraisals", values: availablePlans.map((p) => p.feedback360 ? "Included" : "Available on Pro") },
                  { label: "Templates", values: availablePlans.map((p) => p.templates) },
                  { label: "Results / history", values: availablePlans.map(() => "Retained") },
                  { label: "Branding", values: availablePlans.map(() => "Logo / accent; platform branding retained") },
                  { label: "Support", values: availablePlans.map((p) => p.support) },
                ].map((row) => (
                  <tr
                    key={row.label}
                    className="border-b border-border last:border-0"
                  >
                    <th scope="row" className="p-5 font-medium">
                      {row.label}
                    </th>
                    {row.values.map((value, i) => (
                      <td
                        key={availablePlans[i].name}
                        className="p-5 text-muted-foreground"
                      >
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-7 grid gap-6 text-sm leading-relaxed text-muted-foreground md:grid-cols-3">
            <p>
              <strong className="text-foreground">Employees</strong> are the
              active people held in your workspace. Archived employees do not count. External 360 reviewers do not use
              employee capacity.
            </p>
            <p>
              <strong className="text-foreground">Active campaigns</strong> are
              scheduled or open campaigns. Drafts and closed campaigns do not
              count.
            </p>
            <p>
              <strong className="text-foreground">360 results</strong> require
              closure and at least five completed reviewers. Each reported
              question also needs five valid answers.
            </p>
          </div>
        </div>
      </section>
      <section className="px-5 py-16 lg:px-0 lg:py-24">
        <div className="mx-auto max-w-6xl lg:px-8">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">
            Choose around the way your team works.
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {availablePlans.map((p, i) => (
              <div key={p.name} className="border-t border-border pt-6">
                <p className="text-xs font-semibold text-primary">
                  0{i + 1} · {p.name}
                </p>
                <h3 className="mt-4 text-xl font-semibold">{p.audience}</h3>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  {p.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <ProcessRail
        eyebrow="Moving to a paid plan"
        title="A conversation, then a clear next step."
        copy="Your enquiry does not commit you to a paid plan. We confirm the plan, included capacity and terms before activation."
        steps={[
          {
            title: "Tell us about your team",
            copy: "Choose Pro or Organisation and share the size of your team and the reviews you want to run.",
          },
          {
            title: "Confirm the details",
            copy: "We discuss your capacity, monthly price, VAT and the activation arrangements.",
          },
          {
            title: "Activate your workspace",
            copy: "Our team handles paid activation. Organisation includes an optional setup session.",
          },
        ]}
      />
      <FaqSection
        items={[
          {
            question: "Is Free really permanent?",
            answer: "Yes. Free includes up to 10 active employees, 1 scheduled or active employee appraisal campaign and 1 admin. No card is required. Close a campaign, keep its results and run the next one. Upgrade to Pro when you need more capacity or anonymous 360 feedback.",
          },
          {
            question: "Are prices per employee?",
            answer:
              "No. Paid prices are per workspace per month, excluding VAT, with the employee capacity shown above.",
          },
          {
            question: "Can I buy a paid plan online?",
            answer:
              "Paid activation is handled by our team. Send an enquiry and we will confirm the terms and next step before you commit.",
          },
          {
            question: "What happens when we need more capacity?",
            answer:
              "Capacity is checked when you add employees or admins and schedule or send a campaign. We can discuss moving to the next plan or a larger arrangement.",
          },
          {
            question: "Can I copy the free templates without an account?",
            answer: (
              <>
                Yes. Our{" "}
                <Link href="/templates" className="text-primary underline">
                  template library
                </Link>{" "}
                is ungated. Copy a form or use your browser to print or save it
                as a PDF.
              </>
            ),
          },
          {
            question: "What about cancellation and billing terms?",
            answer:
              "We confirm billing and cancellation terms during paid-plan activation. There is no online checkout on this site.",
          },
        ]}
      />
      <CtaBand
        title="Start with a real employee appraisal."
        copy="Free forever for up to 10 active employees. No card required. Keep your results and upgrade when your team needs more."
        secondaryLabel="See how it works"
        secondaryHref="/how-it-works"
      />
    </SiteChrome>
  );
}
