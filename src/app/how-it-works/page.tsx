import { SiteChrome } from "@/components/layout/SiteChrome";
import { ContentSection, CtaBand, PageHero, RelatedLinks, homeCrumb } from "@/components/marketing/PageSections";
import { Panel } from "@/components/product/primitives";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/metadata";
import { breadcrumbSchema } from "@/lib/schema";

export const metadata = pageMetadata({ title: "How Appraisal Software Works | Employee and Manager Reviews", description: "See how to create an appraisal campaign, assign employees and managers, collect responses and review Self vs Manager results. Includes current and planned features.", path: "/how-it-works" });
const steps = [
  { title: "1. Create the form and campaign", copy: "Save the questions as a reusable template. Create a campaign with a clear review period and opening and closing dates. Use the same core questions across comparable roles, with changes only where the work requires them.", fields: [["Campaign", "Annual reviews"], ["Form", "Employee and manager reflection"], ["Dates", "1 May – 30 June"]] },
  { title: "2. Assign the employee and manager", copy: "Add the people being reviewed, then assign a self-assessment and manager response for each subject. Check assignments before activating the campaign so each person receives the right prompts.", fields: [["Subject", "Alex · Support adviser"], ["Self-assessment", "Alex"], ["Manager response", "Jordan"]] },
  { title: "3. Send invitations and collect responses", copy: "Activation prepares invitations. Respondents use their invitation link to answer the questions. Completion tracking shows outstanding responses, with scheduled invitations and reminders supported by the current appraisal flow.", fields: [["Self-assessment", "Submitted"], ["Manager response", "Outstanding"], ["Reminder", "Configured campaign cadence"]] },
  { title: "4. Review both perspectives", copy: "Read Self vs Manager answers for each subject and question. Use differences as discussion prompts, not an automatic judgement. Agree objectives, development actions and support in the review meeting.", fields: [["Question", "What went well?"], ["Self", "Improved the weekly handover checklist"], ["Manager", "Clearer records; escalation still needs practice"]] },
];
export default function Page() { return <SiteChrome>
  <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "How it works", path: "/how-it-works" }])} />
  <PageHero title="How Appraisal Software Works" description="A focused workflow for employee self-assessments and manager reviews. The panels below are illustrative examples, not live customer data." breadcrumbs={[homeCrumb(), { label: "How it works", href: "/how-it-works" }]} />
  {steps.map((step) => <ContentSection key={step.title} title={step.title}>
    <p>{step.copy}</p>
    <Panel title={step.title.slice(3)} meta="Illustrative example"><dl className="space-y-4 p-5">{step.fields.map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-sm font-medium text-foreground">{value}</dd></div>)}</dl></Panel>
  </ContentSection>)}
  <ContentSection title="Current workflow and planned additions"><p>The current product supports annual appraisal campaigns, reusable questions, self and manager assignments, invitations, completion tracking and Self vs Manager results.</p><p>360 collection, anonymity controls, Self vs Others analytics and PDF/CSV exports remain planned. They are not part of the current workflow shown here. Pricing details will be published when confirmed.</p></ContentSection>
  <RelatedLinks title="Prepare before you create a campaign" links={[{ href: "/annual-appraisal-template", label: "Annual appraisal template", copy: "Choose a useful review structure first." }, { href: "/annual-appraisal-guide", label: "Annual appraisal guide", copy: "Plan the preparation, meeting and follow-up." }]} />
  <CtaBand title="Set up an employee and manager review" copy="Create your questions and organise the appraisal cycle in Appraisal Software." />
</SiteChrome>; }
