import { Header } from "@/components/home/Header";
import { Hero } from "@/components/home/Hero";
import {
  WorkflowTypesSection,
  WorkflowStepsSection,
  PositioningSection,
  CampaignSection,
  TemplatesSection,
  PricingSection,
  HomeFaqSection,
  FinalCtaSection,
} from "@/components/home/Sections";
import { CompleteAppraisalSection } from "@/components/home/AppraisalSection";
import { UnderstandResultsSection } from "@/components/home/Feedback360";
import { RelatedLinks } from "@/components/marketing/PageSections";
import { Footer } from "@/components/home/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/metadata";
import { ROUTES } from "@/lib/routes";
import { softwareApplicationSchema } from "@/lib/schema";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site";

export const metadata = pageMetadata({
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  path: ROUTES.home,
});

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <JsonLd
        data={softwareApplicationSchema({
          path: ROUTES.home,
          description: SITE_DESCRIPTION,
        })}
      />
      <Header />
      <main>
        <Hero />
        <WorkflowTypesSection />
        <WorkflowStepsSection />
        <CompleteAppraisalSection />
        <UnderstandResultsSection />
        <PositioningSection />
        <CampaignSection />
        <TemplatesSection />
        <PricingSection />
        <RelatedLinks title="Prepare for a useful review" links={[
          { href: "/annual-appraisal-guide", label: "Annual appraisal guide", copy: "Plan the preparation, meeting and follow-up." },
          { href: "/appraisal-answers", label: "Employee appraisal answers", copy: "Use evidence to explain achievements and development needs." },
          { href: "/appraisal-comments", label: "Manager appraisal comments", copy: "Write observations that help the next conversation." },
          { href: "/resources", label: "All appraisal resources", copy: "Find practical guides, original examples and free forms." },
        ]} />
        <HomeFaqSection />
        <FinalCtaSection />
      </main>
      <Footer />
    </div>
  );
}
