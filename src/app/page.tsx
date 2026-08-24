import { Header } from "@/components/home/Header";
import { Hero } from "@/components/home/Hero";
import {
  CtaSection,
  DifferentiatorSection,
  OwnershipSection,
  ResourcesSection,
  RunAppraisalSection,
  SpreadsheetSection,
  WhoItsForSection,
} from "@/components/home/Sections";
import { CompleteAppraisalSection } from "@/components/home/AppraisalSection";
import { UnderstandResultsSection } from "@/components/home/Feedback360";
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
        <WhoItsForSection />
        <SpreadsheetSection />
        <RunAppraisalSection />
        <CompleteAppraisalSection />
        <UnderstandResultsSection />
        <DifferentiatorSection />
        <ResourcesSection />
        <OwnershipSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
