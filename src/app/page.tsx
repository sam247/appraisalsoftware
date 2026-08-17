import { Header } from "@/components/home/Header";
import { Hero } from "@/components/home/Hero";
import {
  CtaSection,
  DifferentiatorSection,
  FeaturesSection,
  PoweredBySection,
  ResourcesSection,
  SpreadsheetSection,
  WhoItsForSection,
  WorkflowSection,
} from "@/components/home/Sections";
import { Feedback360 } from "@/components/home/Feedback360";
import { AppraisalSection } from "@/components/home/AppraisalSection";
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
        <WorkflowSection />
        <SpreadsheetSection />
        <FeaturesSection />
        <AppraisalSection />
        <Feedback360 />
        <WhoItsForSection />
        <DifferentiatorSection />
        <ResourcesSection />
        <PoweredBySection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
