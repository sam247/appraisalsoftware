import { SiteChrome } from "@/components/layout/SiteChrome";
import { ContentSection, PageHero, RelatedLinks, TextLink, homeCrumb } from "@/components/marketing/PageSections";
import { JsonLd } from "@/components/seo/JsonLd";
import { ProcessRail } from "@/components/resources/ResourceVisual";
import { pageMetadata } from "@/lib/metadata";
import { breadcrumbSchema } from "@/lib/schema";

const title = "360 Feedback Resources for UK Teams | Appraisal Software";
const description = "Practical 360 feedback questions, examples, templates and guidance for UK teams planning a thoughtful multi-rater review.";
export const metadata = pageMetadata({ title, description, path: "/360-feedback-software" });
export default function Page() { return <SiteChrome>
  <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "360 Feedback Software", path: "/360-feedback-software" }])} />
  <PageHero eyebrow="Practical 360 guidance" title="Plan a thoughtful 360 review" description={description} breadcrumbs={[homeCrumb(), { label: "360 Feedback Resources", href: "/360-feedback-software" }]} />
  <ProcessRail
    eyebrow="Planning sequence"
    title="Keep the exercise clear from purpose to follow-up"
    copy="This is an educational planning aid for a separate multi-rater exercise. It does not represent a live 360 campaign builder, results view or anonymous product workflow."
    steps={[
      { title: "Purpose", copy: "Decide what the subject should understand or develop." },
      { title: "Reviewers", copy: "Choose people with enough recent experience to give useful observations." },
      { title: "Questions", copy: "Ask about observable behaviours and explain how responses will be handled." },
      { title: "Themes", copy: "Discuss patterns, context and practical development actions with the subject." },
    ]}
  />
  <ContentSection title="Start with the purpose"><p>A multi-rater process gathers observations from people who see someone’s work from different perspectives. Start by deciding what the exercise should help the subject understand, then choose reviewers and questions that serve that purpose.</p><p>Appraisal Software’s current campaign workflow focuses on identified employee and manager appraisals. These 360 resources are designed to help you plan a separate exercise clearly and proportionately.</p></ContentSection>
  <ContentSection title="Build the review around useful evidence"><ol className="list-decimal space-y-3 pl-5"><li>Choose a small number of behaviours or outcomes that matter for the role.</li><li>Invite reviewers who have enough direct experience to give specific observations.</li><li>Use questions that ask what happened, what helped and what could improve.</li><li>Explain who will see responses and how comments will be handled before collecting feedback.</li><li>Discuss themes with the subject and agree practical development actions.</li></ol></ContentSection>
  <ContentSection title="Privacy needs careful wording"><p>Removing names alone does not guarantee anonymity. Small groups, distinctive comments and outside knowledge can identify a reviewer. Be accurate about who can access responses and avoid promising more privacy than the process can provide.</p><p>Our <TextLink href="/360-feedback-examples">fictional feedback examples</TextLink> show how to turn observations into a useful development conversation rather than a score-only verdict.</p></ContentSection>
  <RelatedLinks title="Prepare your 360 process" links={[{ href: "/360-feedback-template", label: "360 feedback template", copy: "Copy or print a form with an example rating scale." }, { href: "/360-feedback-questions", label: "360 feedback questions", copy: "Select prompts by behaviour and reviewer relationship." }, { href: "/360-feedback-examples", label: "360 feedback examples", copy: "Read fictional comments and themes before writing your own." }, { href: "/360-degree-feedback", label: "What is 360 degree feedback?", copy: "Understand the purpose, process and limitations." }]} />
</SiteChrome>; }
