import { Header } from "@/components/home/Header";
import { Hero } from "@/components/home/Hero";
import {
  WorkflowTypesSection,
  HomeFaqSection,
  FinalCtaSection,
} from "@/components/home/Sections";
import { HumanStory } from "@/components/home/HumanStory";
import { GdprCommitment, MidPageCta } from "@/components/home/HomeBands";
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
    <div className="marketing-site min-h-screen bg-background">
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
        <MidPageCta />
        <HumanStory />
        <GdprCommitment />
        <HomeFaqSection />
        <FinalCtaSection />
      </main>
      <Footer />
    </div>
  );
}
