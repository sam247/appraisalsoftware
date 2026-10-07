import Link from "next/link";
import { SiteChrome } from "@/components/layout/SiteChrome";
import {
  PageHero,
  FaqSection,
  RelatedLinks,
  homeCrumb,
} from "@/components/marketing/PageSections";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/metadata";
import { enquiryTypes } from "@/lib/contact";
import { ContactForm } from "./contact-form";

export const metadata = pageMetadata({
  title: "Contact | Appraisal Software",
  description:
    "Ask about Appraisal Software, compare paid plans or get help with your workspace. Contact the team behind the annual appraisal and 360 review workflows.",
  path: "/contact",
});
export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; plan?: string }>;
}) {
  const query = await searchParams;
  const initialType =
    typeof query.type === "string" && Object.hasOwn(enquiryTypes, query.type)
      ? query.type
      : "";
  const initialPlan =
    typeof query.plan === "string" &&
    ["Pro", "Organisation"].includes(query.plan)
      ? query.plan
      : "";
  return (
    <SiteChrome>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />
      <PageHero
        eyebrow="Talk to our team"
        title={
          <>
            A little clarity{" "}
            <span className="marketing-editorial text-primary">
              goes a long way.
            </span>
          </>
        }
        description="Ask about your next appraisal cycle, find the right plan or get help with an existing workspace. You will hear from the team behind Appraisal Software."
        breadcrumbs={[homeCrumb(), { label: "Contact", href: "/contact" }]}
      />
      <section className="bg-surface/60 px-5 py-16 lg:px-0 lg:py-24">
        <div className="mx-auto grid max-w-6xl lg:px-8 gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div>
            <h2 className="max-w-md text-3xl font-semibold leading-tight sm:text-4xl">
              Where are you in your review process?
            </h2>
            <div className="mt-8 divide-y divide-border border-t border-border">
              <div className="py-6">
                <h3 className="text-lg font-semibold">Choosing a plan</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  Tell us your team size, the reviews you want to run and any
                  questions about capacity. Paid plans are activated with our
                  team after the details are confirmed.
                </p>
                <Link
                  href="/pricing"
                  className="mt-4 inline-block text-sm font-semibold text-primary underline underline-offset-4"
                >
                  Compare the plans
                </Link>
              </div>
              <div className="py-6">
                <h3 className="text-lg font-semibold">Using your workspace</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  Describe what you were trying to do and where you got stuck.
                  Include the account email and campaign name if useful, without
                  sharing employee answers.
                </p>
              </div>
              <div className="py-6">
                <h3 className="text-lg font-semibold">
                  Planning your first cycle
                </h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  Our free guides and forms can help you choose questions and
                  prepare the process before you create a campaign.
                </p>
                <Link
                  href="/resources"
                  className="mt-4 inline-block text-sm font-semibold text-primary underline underline-offset-4"
                >
                  Browse free resources
                </Link>
              </div>
            </div>
          </div>
          <ContactForm initialType={initialType} initialPlan={initialPlan} />
        </div>
      </section>
      <RelatedLinks
        title="You may find your answer here"
        links={[
          {
            href: "/how-it-works",
            label: "Follow the workflow",
            copy: "From reusable questions and assignments to invitations and results.",
          },
          {
            href: "/pricing",
            label: "Understand the plans",
            copy: "See employee, active-campaign and admin capacity.",
          },
          {
            href: "/360-appraisals#privacy",
            label: "Read the 360 safeguards",
            copy: "Understand closure, minimum responses and written-comment limitations.",
          },
        ]}
      />
      <FaqSection
        items={[
          {
            question: "Does an enquiry commit me to a paid plan?",
            answer:
              "No. We confirm the plan, capacity and activation terms with you before any commitment.",
          },
          {
            question: "Who answers my enquiry?",
            answer:
              "The team behind Appraisal Software and Disclosurely handles product, pricing and workspace enquiries.",
          },
          {
            question: "Can I use a free template without contacting you?",
            answer:
              "Yes. All public templates are free to copy, print and adapt without an account or enquiry.",
          },
        ]}
      />
    </SiteChrome>
  );
}
