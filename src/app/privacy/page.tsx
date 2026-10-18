import { SiteChrome } from "@/components/layout/SiteChrome";
import { PageHero, TextLink, homeCrumb } from "@/components/marketing/PageSections";
import { JsonLd } from "@/components/seo/JsonLd";
import { COMPANY, REGISTERED_OFFICE } from "@/lib/company";
import { LEGAL_ROUTES, ROUTES } from "@/lib/routes";
import { breadcrumbSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/metadata";

export const metadata = {
  ...pageMetadata({ title: "Privacy Policy | Appraisal Software", description: "How Appraisal Software handles website enquiries, account information, payments, employee appraisals and 360 feedback.", path: LEGAL_ROUTES.privacy, imagePath: "/social/home.png" }),
  robots: { index: false, follow: true },
};

const UPDATED = { iso: "2026-10-18", label: "18 October 2026" };

const h2 = "font-display text-2xl font-semibold text-foreground";
const cell = "border-b border-border px-3 py-2.5 text-left align-top";

/** What we do with information we control: purpose, lawful basis and how long we keep it. */
const ACTIVITIES: { activity: string; data: string; basis: string; retention: string }[] = [
  {
    activity: "Running your account and workspace",
    data: "Name, email, organisation, sign-in details, workspace membership and settings",
    basis: "Contract (or legitimate interests where your employer holds the contract)",
    retention: "While the account is open, then up to 90 days to allow restoration, unless a longer period is needed for a dispute",
  },
  {
    activity: "Subscriptions and template-pack purchases",
    data: "Billing name, email, address, plan or pack bought, amounts, invoices and payment status. Card details are handled by Stripe; we never see them",
    basis: "Contract; legal obligation for accounting records",
    retention: "6 years after the end of the financial year of the transaction",
  },
  {
    activity: "Service emails (invitations, reminders, receipts, account notices)",
    data: "Email address, name, the message and its delivery status",
    basis: "Contract, or legitimate interests in operating the service",
    retention: "Delivery records for up to 12 months",
  },
  {
    activity: "Enquiries and support chat",
    data: "Name, email, organisation, your message and our reply",
    basis: "Legitimate interests in answering enquiries and supporting customers",
    retention: "Up to 24 months after the conversation ends",
  },
  {
    activity: "Security, fraud prevention and troubleshooting",
    data: "Network requests, sign-in and authentication events, error records",
    basis: "Legitimate interests in keeping the service secure and reliable; legal obligation where applicable",
    retention: "Up to 12 months, longer where needed for an investigation",
  },
  {
    activity: "Optional website measurement",
    data: "Pages viewed and limited usage information through Google Analytics, without appraisal content or app page addresses",
    basis: "Consent, which you can withdraw in Cookie settings",
    retention: "No longer than 14 months in Google Analytics",
  },
];

const PROVIDERS: { name: string; role: string }[] = [
  { name: "Supabase", role: "Database, authentication and file storage" },
  { name: "Vercel", role: "Website and application hosting" },
  { name: "Resend", role: "Email delivery" },
  { name: "Stripe", role: "Payments, subscriptions, invoices and receipts. Stripe also acts as an independent controller for its own fraud prevention and legal obligations" },
  { name: "Better Ranking", role: "Support chat" },
  { name: "Google", role: "Website measurement, only with your consent" },
  { name: "c15t", role: "Storing your cookie choices (a hosted consent service when configured)" },
];

export default function PrivacyPage() {
  return (
    <SiteChrome>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Privacy policy", path: LEGAL_ROUTES.privacy }])} />
      <PageHero compact eyebrow="Privacy and data protection" title="Privacy policy" description="How we handle your information when you visit Appraisal Software, buy from us, or use its employee appraisal and 360 feedback workflows." breadcrumbs={[homeCrumb(), { label: "Privacy policy", href: LEGAL_ROUTES.privacy }]} />
      <article className="mx-auto max-w-6xl space-y-10 px-5 py-12 text-sm leading-relaxed text-muted-foreground sm:text-base lg:px-8">
        <p>Last updated: <time dateTime={UPDATED.iso}>{UPDATED.label}</time>. This notice covers appraisalsoftware.co.uk and app.appraisalsoftware.co.uk.</p>

        <section className="space-y-4">
          <h2 className={h2}>Who is responsible for your information?</h2>
          <p>
            {COMPANY.tradingName} is a trading name of {COMPANY.legalName}, registered in {COMPANY.registeredIn}
            {COMPANY.companyNumber ? ` (company number ${COMPANY.companyNumber})` : ""}. Registered office: {REGISTERED_OFFICE}. For privacy questions or requests, email{" "}
            <TextLink href={`mailto:${COMPANY.privacyEmail}`}>{COMPANY.privacyEmail}</TextLink> or write to us at that address.
          </p>
          <p>We have two roles:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-foreground">Controller</strong> for our website, enquiries, customer accounts, billing and purchases, service
              communications, security and website measurement. This notice explains that processing.
            </li>
            <li>
              <strong className="text-foreground">Processor</strong> for the people, questions and review information an organisation puts into its
              workspace. The organisation running the appraisal is the controller and decides why and how that information is used. We process it only
              on its instructions, under our customer terms.
            </li>
          </ul>
          <p>This is an Appraisal Software notice. Disclosurely has its own policy for its separate service.</p>
        </section>

        <section className="space-y-4">
          <h2 className={h2}>What we collect and where it comes from</h2>
          <ul className="list-disc space-y-3 pl-5">
            <li>Account and workspace details you provide, including your name, email, organisation, sign-in credentials and workspace membership.</li>
            <li>Billing details when you subscribe or buy a template pack. Stripe collects your payment card and billing address; we receive the customer record, plan or pack, amounts, invoices and payment status.</li>
            <li>People and campaign information supplied by workspace administrators, including names, email addresses, manager relationships, selected reviewers, questions, dates and invitation status.</li>
            <li>Appraisal ratings, written responses and completion information supplied by employees, managers and 360 reviewers.</li>
            <li>Your name, email, organisation and message when you send an enquiry, plus anything you choose to share through support chat.</li>
            <li>Technical information needed to deliver and secure the service, such as network requests, authentication events and error records. With measurement consent, Google Analytics also receives limited website usage information.</li>
          </ul>
          <p>
            Only add information that is relevant to the review or enquiry. Don&apos;t add sensitive details, such as health information, about yourself or
            another person unless your organisation has a lawful reason to process them. Templates for children&apos;s homes and early years settings
            ask about work with children: refer to children by initials or role, never by full name.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className={h2}>How we use it, our lawful basis and how long we keep it</h2>
          <p>For information we control:</p>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[42rem] border-collapse text-sm">
              <thead className="bg-surface/70 text-foreground">
                <tr>
                  <th scope="col" className={cell}>What we do</th>
                  <th scope="col" className={cell}>Information</th>
                  <th scope="col" className={cell}>Lawful basis</th>
                  <th scope="col" className={cell}>How long we keep it</th>
                </tr>
              </thead>
              <tbody>
                {ACTIVITIES.map((a) => (
                  <tr key={a.activity}>
                    <th scope="row" className={`${cell} font-medium text-foreground`}>{a.activity}</th>
                    <td className={cell}>{a.data}</td>
                    <td className={cell}>{a.basis}</td>
                    <td className={cell}>{a.retention}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Where we rely on legitimate interests, we have weighed them against your rights, and you can object (see &ldquo;Your choices and rights&rdquo;).
            We don&apos;t use appraisal responses for analytics or marketing. Backups follow a shorter, rolling cycle, after which deleted information is gone.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className={h2}>Downloadable templates (not yet available)</h2>
          <p>
            We plan to sell some templates as Word and PDF downloads. They aren&apos;t on sale yet. When they are, we will collect the buyer&apos;s email
            address, an order reference, the template and version bought, the time you agreed to immediate download, and a record of each download.
            We won&apos;t keep IP addresses or device details for downloads, and the files themselves contain no buyer information. Payment is handled by
            Stripe. We&apos;ll use this information to deliver your files and updates, handle refunds and keep accounting records (contract and legal
            obligation; 6 years after the end of the financial year). We&apos;ll update this notice before downloads launch.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className={h2}>Employee reviews and 360 privacy</h2>
          <p>Employee and manager appraisals use identified responses. In the 360 workflow, reports combine reviewer answers without reviewer names or response times. Results require campaign closure and at least five completed reviewer responses; each displayed question also requires at least five valid answers.</p>
          <p>Written comments, shared invitation links and outside knowledge can still identify a reviewer. Ordinary workspace administrators cannot query the private reviewer-to-answer mapping; trusted platform and database operators can access operational records. Read the <TextLink href={`${ROUTES.feedback360Software}#privacy`}>360 privacy safeguards</TextLink> before explaining anonymity to participants.</p>
          <p>The software presents information for a conversation. It does not make automated decisions about anyone.</p>
          <p>Workspace information is kept for as long as the organisation keeps its workspace and follows its instructions. A completed campaign is not deleted automatically when it closes, and changing plan doesn&apos;t delete records. Removing a reviewer assignment doesn&apos;t necessarily remove an anonymous response already submitted. Ask your organisation about its retention and deletion process.</p>
        </section>

        <section className="space-y-4">
          <h2 className={h2}>Marketing</h2>
          <p>
            We send product and service emails you need, such as invitations, receipts and account notices. We only send marketing emails if you have
            agreed to them, or if you are a customer and didn&apos;t opt out when we asked. Every marketing email has an unsubscribe link, and you can
            also email us to stop them.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className={h2}>Who receives information</h2>
          <p>Workspace information is available to the people your organisation authorises, within the workflow&apos;s access controls. We use these providers to run the service:</p>
          <ul className="list-disc space-y-2 pl-5">
            {PROVIDERS.map((p) => (
              <li key={p.name}>
                <strong className="text-foreground">{p.name}</strong>: {p.role}.
              </li>
            ))}
          </ul>
          <p>We may also share information with professional advisers, or with authorities when the law requires it, or to establish or defend legal claims. We do not sell personal information.</p>
          <p>Some providers process information outside the UK. Where that is a restricted transfer, we rely on safeguards such as UK adequacy regulations or the UK International Data Transfer Agreement or Addendum. Contact us for details of the providers, locations and safeguards that apply.</p>
        </section>

        <section className="space-y-4">
          <h2 className={h2}>Security</h2>
          <p>We protect information with authentication, workspace access controls, encryption in transit and restricted access to operational records. Download links, when available, will be time-limited and individual. No online service can guarantee that every incident will be prevented; if a breach affects you, we will tell you and the ICO where the law requires.</p>
        </section>

        <section className="space-y-4">
          <h2 className={h2}>Your choices and rights</h2>
          <p>Under UK data protection law you can ask to access, correct or delete your personal information, to restrict how we use it, and to receive it in a portable format. You can object to processing based on legitimate interests and to direct marketing at any time. You can withdraw consent for optional measurement without affecting processing that already took place.</p>
          <p>For appraisal or reviewer information in a workspace, contact the organisation running the campaign first; we will help it respond. For information we control, email <TextLink href={`mailto:${COMPANY.privacyEmail}`}>{COMPANY.privacyEmail}</TextLink>. We aim to respond within one month and may need to confirm your identity first.</p>
          <p>You can complain to the UK Information Commissioner&apos;s Office at <TextLink href="https://ico.org.uk/make-a-complaint/">ico.org.uk</TextLink>. We&apos;d appreciate the chance to help first.</p>
        </section>

        <section className="space-y-4">
          <h2 className={h2}>Cookies and changes to this notice</h2>
          <p>Our <TextLink href={LEGAL_ROUTES.cookies}>cookie policy</TextLink> explains browser storage and how to change your choices. We update this notice when the product or our processing changes, and show the date at the top. For questions, use our privacy email or <TextLink href={ROUTES.contact}>contact page</TextLink>.</p>
        </section>
      </article>
    </SiteChrome>
  );
}
