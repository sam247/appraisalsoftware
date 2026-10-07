import { SiteChrome } from "@/components/layout/SiteChrome";
import { PageHero, TextLink, homeCrumb } from "@/components/marketing/PageSections";
import { CookieSettings } from "@/components/consent/CookieSettings";
import { JsonLd } from "@/components/seo/JsonLd";
import { LEGAL_ROUTES } from "@/lib/routes";
import { breadcrumbSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/metadata";

export const metadata = {
  ...pageMetadata({ title: "Cookie Policy | Appraisal Software", description: "Cookies, browser storage and your measurement choices on Appraisal Software. Open cookie settings to update your consent.", path: LEGAL_ROUTES.cookies, imagePath: "/social/home.png" }),
  robots: { index: false, follow: true },
};

export default function CookiesPage() {
  return (
    <SiteChrome>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Cookie policy", path: LEGAL_ROUTES.cookies }])} />
      <PageHero compact eyebrow="Your browser, your choices" title="Cookie policy" description="How Appraisal Software uses cookies and browser storage, and how you can control optional website measurement." breadcrumbs={[homeCrumb(), { label: "Cookie policy", href: LEGAL_ROUTES.cookies }]} />
      <article className="mx-auto max-w-3xl space-y-10 px-5 py-12 text-sm leading-relaxed text-muted-foreground sm:text-base lg:px-8">
        <p>Last updated: <time dateTime="2026-10-07">7 October 2026</time>. This policy covers appraisalsoftware.co.uk and app.appraisalsoftware.co.uk, operated by Umbrella Rank Ltd.</p>
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-semibold text-foreground">Change your choices</h2>
          <p>Our c15t controls let you accept, reject or customise optional cookies. Necessary storage keeps sign-in and consent choices working. Google Analytics loads only after measurement consent. You can reopen the controls here, through the footer, or using the privacy settings icon.</p>
          <CookieSettings />
          <p>Withdrawing measurement consent stops further measurement from this site and attempts to remove accessible Google Analytics cookies. It does not delete information already sent to Google. Your browser may keep separate choices on the website and app subdomain; check settings on each when you use both.</p>
        </section>
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-semibold text-foreground">Storage used by the site</h2>
          <dl className="divide-y divide-border border-y border-border">
            <div className="space-y-2 py-5"><dt className="font-semibold text-foreground">Consent preferences — c15t</dt><dd>Necessary cookie and local storage remembering your choices. The default cookie lifetime is 365 days; local storage can remain until it is cleared, with the consent record’s expiry checked by the manager.</dd></div>
            <div className="space-y-2 py-5"><dt className="font-semibold text-foreground">Sign-in — Supabase authentication</dt><dd>Necessary session cookies on the app, with names beginning sb- and ending in auth-token, sometimes split into chunks. These maintain and refresh your signed-in session, subject to expiry and sign-out.</dd></div>
            <div className="space-y-2 py-5"><dt className="font-semibold text-foreground">Website measurement — Google Analytics</dt><dd>Optional cookies such as _ga and _ga_ followed by an identifier. They distinguish visits and maintain session information after you consent. Google’s default expiry is two years, with browsers potentially imposing shorter limits. See <TextLink href="https://support.google.com/analytics/answer/11397207">Google’s cookie information</TextLink>.</dd></div>
            <div className="space-y-2 py-5"><dt className="font-semibold text-foreground">Support chat — Better Ranking</dt><dd>The support widget loads on visits and uses local storage for a conversation token and whether its welcome message has been seen. Keys begin br_chat_session: and br_chat_opening_seen:. This storage can remain until cleared in your browser; c15t’s measurement switch does not clear chat history.</dd></div>
          </dl>
          <p>Hosting and authentication services may also use technical security or routing storage. Cookie names can vary between releases and browsers. Appraisal answers and written feedback are stored in the workspace database, rather than used as analytics cookies.</p>
        </section>
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-semibold text-foreground">What measurement includes</h2>
          <p>With your permission, we measure public page visits and events such as signup and enquiries. Our measurement code excludes appraisal responses, names, email addresses, invitation tokens and dashboard or respondent URLs. Advertising personalisation and Google Signals are disabled in the site’s Google Analytics configuration. No advertising tags are currently configured.</p>
          <p>The consent manager may show a marketing category. That category does not itself add an advertising tag. Allowing or refusing optional measurement does not change who can access your workspace reviews.</p>
        </section>
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-semibold text-foreground">Browser controls and privacy questions</h2>
          <p>You can also clear cookies and local storage, or block them, in your browser. Clearing necessary storage may sign you out, reset preferences or disconnect a support conversation. If you clear consent storage, the site may ask you to choose again.</p>
          <p>Read our <TextLink href={LEGAL_ROUTES.privacy}>privacy policy</TextLink> for information about personal data. For a privacy request, email <TextLink href="mailto:privacy@appraisalsoftware.co.uk">privacy@appraisalsoftware.co.uk</TextLink>.</p>
        </section>
      </article>
    </SiteChrome>
  );
}
