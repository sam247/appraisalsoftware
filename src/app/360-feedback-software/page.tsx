import { SiteChrome } from "@/components/layout/SiteChrome";
import {
  ContentSection,
  CtaBand,
  PageHero,
  RelatedLinks,
  TextLink,
  homeCrumb,
} from "@/components/marketing/PageSections";
import { JsonLd } from "@/components/seo/JsonLd";
import { ProcessRail } from "@/components/resources/ResourceVisual";
import HeroWizardPreview from "@/components/home/HeroWizardPreview";
import { pageMetadata } from "@/lib/metadata";
import { breadcrumbSchema, softwareApplicationSchema } from "@/lib/schema";

const title = "360 Feedback Software for UK Teams | Appraisal Software";
const description =
  "Run anonymous 360 feedback campaigns for UK teams. Invite reviewers, collect combined observations and unlock results after closure — without a heavyweight HR system.";

export const metadata = pageMetadata({
  title,
  description,
  path: "/360-feedback-software",
});

export default function Page() {
  return (
    <SiteChrome commercial>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "360 Feedback Software", path: "/360-feedback-software" },
        ])}
      />
      <JsonLd
        data={softwareApplicationSchema({
          path: "/360-feedback-software",
          name: "360 Feedback Software",
          description,
        })}
      />
      <PageHero
        showCta
        eyebrow="360 feedback software"
        title="Anonymous multi-rater feedback, without a heavyweight HR suite"
        description={description}
        breadcrumbs={[
          homeCrumb(),
          { label: "360 Feedback Software", href: "/360-feedback-software" },
        ]}
      />
      <ProcessRail
        eyebrow="How a 360 campaign works"
        title="From subject and reviewers to combined, closed results"
        copy="Create a campaign for one person, choose at least five reviewers, send secure invitation links, then close the campaign to release anonymous combined feedback."
        steps={[
          {
            title: "Set up",
            copy: "Name the campaign, choose the person receiving feedback and pick a rating-and-text question template.",
          },
          {
            title: "Invite",
            copy: "Select managers, peers, direct reports or other reviewers and confirm the anonymity policy.",
          },
          {
            title: "Collect",
            copy: "Each reviewer gets a personal link. Your organisation sees completion, not individual written attribution.",
          },
          {
            title: "Release",
            copy: "Results unlock after campaign closure and at least five completed reviewer responses.",
          },
        ]}
      />
      <section className="border-b border-border py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-16 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Inside the product</p>
            <h2 className="mt-3 font-display text-2xl font-semibold text-foreground sm:text-3xl">Build a campaign around one person.</h2>
            <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">This illustrative campaign setup shows the subject, questions and reviewer cohort together before invitations are sent.</p>
          </div>
          <HeroWizardPreview />
        </div>
      </section>
      <ContentSection title="Built for anonymous multi-rater reviews">
        <p>
          Appraisal Software’s 360 workflow is designed for development-focused
          feedback from several relationships. Choose the subject, invite a
          reviewer cohort and use reusable questions so every respondent answers
          the same prompts.
        </p>
        <p>
          Annual appraisals remain identified employee and manager reviews. Use
          360 when you need perspectives beyond that pair — and keep the two
          purposes clear for everyone involved.
        </p>
      </ContentSection>
      <ContentSection title="Privacy that matches the process">
        <p>
          Combined feedback is shown without reviewer names or response times.
          Results require five completed reviewer responses and campaign
          closure. Written comments may still identify their author, so explain
          that before anyone starts.
        </p>
        <p>
          Free planning material remains available:{" "}
          <TextLink href="/360-feedback-questions">questions</TextLink>,{" "}
          <TextLink href="/360-feedback-examples">examples</TextLink>, a{" "}
          <TextLink href="/360-feedback-template">template</TextLink> and a{" "}
          <TextLink href="/360-degree-feedback">process guide</TextLink>.
        </p>
      </ContentSection>
      <RelatedLinks
        title="Prepare your 360 process"
        links={[
          {
            href: "/360-feedback-template",
            label: "360 feedback template",
            copy: "Copy or print a form with an example rating scale.",
          },
          {
            href: "/360-feedback-questions",
            label: "360 feedback questions",
            copy: "Select prompts by behaviour and reviewer relationship.",
          },
          {
            href: "/360-feedback-examples",
            label: "360 feedback examples",
            copy: "Read fictional comments and themes before writing your own.",
          },
          {
            href: "/360-degree-feedback",
            label: "What is 360 degree feedback?",
            copy: "Understand the purpose, process and limitations.",
          },
        ]}
      />
      <CtaBand
        title="Ready to run a 360 campaign?"
        copy="Create a free account, invite reviewers and collect anonymous combined feedback in Appraisal Software."
        secondaryHref="/how-it-works"
        secondaryLabel="See how it works"
      />
    </SiteChrome>
  );
}
