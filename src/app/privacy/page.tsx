import { SiteChrome } from "@/components/layout/SiteChrome";
import { PageHero, TextLink, homeCrumb } from "@/components/marketing/PageSections";
import { JsonLd } from "@/components/seo/JsonLd";
import { LEGAL_ROUTES, ROUTES } from "@/lib/routes";
import { breadcrumbSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/metadata";

export const metadata = {
  ...pageMetadata({ title: "Privacy Policy | Appraisal Software", description: "How Appraisal Software handles website enquiries, account information, employee appraisals and 360 feedback.", path: LEGAL_ROUTES.privacy, imagePath: "/social/home.png" }),
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  return (
    <SiteChrome>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Privacy policy", path: LEGAL_ROUTES.privacy }])} />
      <PageHero compact eyebrow="Privacy and data protection" title="Privacy policy" description="How we handle your information when you visit Appraisal Software or use its employee appraisal and 360 feedback workflows." breadcrumbs={[homeCrumb(), { label: "Privacy policy", href: LEGAL_ROUTES.privacy }]} />
      <article className="mx-auto max-w-3xl space-y-10 px-5 py-12 text-sm leading-relaxed text-muted-foreground sm:text-base lg:px-8">
        <p>Last updated: <time dateTime="2026-10-07">7 October 2026</time>. This notice covers appraisalsoftware.co.uk and app.appraisalsoftware.co.uk.</p>
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-semibold text-foreground">Who is responsible for your information?</h2>
          <p>Appraisal Software is operated by Umbrella Rank Ltd. For privacy questions or requests, email <TextLink href="mailto:privacy@appraisalsoftware.co.uk">privacy@appraisalsoftware.co.uk</TextLink>.</p>
          <p>We are the controller for our website enquiries, customer account administration, service communications and website measurement. Your employer or the organisation running an appraisal is the controller for the people, questions and review information it puts into its workspace. We process that workspace information to provide the service on its behalf.</p>
          <p>This is an Appraisal Software notice. Disclosurely has its own policy for its separate service.</p>
        </section>
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-semibold text-foreground">What we collect and where it comes from</h2>
          <ul className="list-disc space-y-3 pl-5">
            <li>Account and workspace details you provide, including your name, email, organisation, sign-in credentials and workspace membership.</li>
            <li>People and campaign information supplied by workspace administrators, including names, email addresses, manager relationships, selected reviewers, questions, dates and invitation status.</li>
            <li>Appraisal ratings, written responses and completion information supplied by employees, managers and 360 reviewers.</li>
            <li>Your name, email, organisation and message when you send an enquiry, plus messages and contact details you choose to provide through support chat.</li>
            <li>Technical information needed to deliver and secure the service, such as network requests, authentication events and error records. With measurement consent, Google Analytics also receives limited website usage information.</li>
          </ul>
          <p>Provide information relevant to the review or enquiry. Avoid adding sensitive personal details about yourself or another person unless your organisation has established a lawful reason to process them.</p>
        </section>
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-semibold text-foreground">How and why we use it</h2>
          <p>We use account information to establish and administer the service, and rely on contractual necessity where you are a party to the contract. For business contacts, support, security and service administration, we rely on our legitimate interests in running a reliable service and responding to enquiries. We also process information when needed to meet a legal obligation.</p>
          <p>We rely on consent for optional website measurement. You can change that choice through Cookie settings. We do not use appraisal responses as website analytics data. Review content is processed under the organisation’s instructions; that organisation is responsible for explaining its purposes and lawful basis to participants.</p>
          <p>Account information is needed to operate a workspace. Review administrators decide which questions participants must complete. Optional measurement is not required to use the site.</p>
        </section>
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-semibold text-foreground">Employee reviews and 360 privacy</h2>
          <p>Employee and manager appraisals use identified responses. In the 360 workflow, reports combine reviewer answers without reviewer names or response times. Results require campaign closure and at least five completed reviewer responses; each displayed question also requires at least five valid answers.</p>
          <p>Written comments, shared invitation links and outside knowledge can still identify a reviewer. Ordinary workspace administrators cannot query the private reviewer-to-answer mapping; trusted platform and database operators can access operational records. Read the <TextLink href={`${ROUTES.feedback360Software}#privacy`}>360 privacy safeguards</TextLink> before explaining anonymity to participants.</p>
          <p>The software presents information for a conversation. It does not automatically make employment decisions about a person.</p>
        </section>
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-semibold text-foreground">Who receives information</h2>
          <p>Workspace information is available to the people your organisation authorises, subject to the workflow’s access controls. We use infrastructure and service providers to operate the product: Supabase for authentication and database services, Vercel for website/application hosting, Resend for email delivery, and Better Ranking for support chat. Google receives website measurement information when you allow it. The c15t consent controls store your preferences, with a hosted consent service used when configured.</p>
          <p>We may also disclose information to professional advisers or authorities when required for legal obligations, claims or protecting the service. We do not sell appraisal responses.</p>
          <p>Providers may process information outside the UK. Where a restricted international transfer is involved, applicable data protection safeguards are required, such as an adequacy decision or approved contractual protections. Contact us for the providers, processing locations and transfer arrangements applicable to your workspace.</p>
        </section>
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-semibold text-foreground">Retention and security</h2>
          <p>Workspace information is kept to provide the service and follow the organisation’s instructions. A completed campaign is not automatically deleted when it closes, and trial expiry does not itself delete existing records. Removing a reviewer assignment does not necessarily remove an already submitted anonymous response. Ask your organisation about its review retention and deletion process.</p>
          <p>For account administration, enquiries, support and operational records, retention depends on the purpose, the customer relationship, outstanding support or disputes, and any accounting or legal requirements. Information is deleted or anonymised when it is no longer needed, subject to those requirements and backup lifecycles. Contact us for a retention or deletion request concerning your account.</p>
          <p>We use authentication, workspace access controls and restricted access to operational records to protect information. No online service can guarantee that every security incident will be prevented.</p>
        </section>
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-semibold text-foreground">Your choices and rights</h2>
          <p>Depending on the circumstances, you can request access, correction, deletion, restriction or portability of your personal information, and object to processing based on legitimate interests. You can withdraw consent for optional measurement without affecting processing that already took place lawfully.</p>
          <p>For appraisal or reviewer information, contact the organisation running the campaign first. For information we control, email our privacy address above. We may need to verify your identity and the scope of your request before acting.</p>
          <p>You can complain to the UK Information Commissioner’s Office at <TextLink href="https://ico.org.uk/make-a-complaint/">ico.org.uk</TextLink>. You can also contact the relevant data protection authority where you live.</p>
        </section>
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-semibold text-foreground">Cookies and changes to this notice</h2>
          <p>Our <TextLink href={LEGAL_ROUTES.cookies}>cookie policy</TextLink> explains browser storage and how to change your choices. We update this notice when the product or processing changes and show the revision date here. For questions, use our privacy email or <TextLink href={ROUTES.contact}>contact page</TextLink>.</p>
        </section>
      </article>
    </SiteChrome>
  );
}
