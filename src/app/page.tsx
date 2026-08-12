import { Header } from "@/components/home/Header";
import { Hero } from "@/components/home/Hero";
import {
  AnonymousSection,
  CtaSection,
  FormsSection,
  PoweredBySection,
  ReportsSection,
  ResourcesSection,
  SpreadsheetSection,
  TrackingSection,
  WorkflowSection,
} from "@/components/home/Sections";
import { Feedback360 } from "@/components/home/Feedback360";
import { AppraisalSection } from "@/components/home/AppraisalSection";
import { Footer } from "@/components/home/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <SpreadsheetSection />
        <WorkflowSection />
        <Feedback360 />
        <AppraisalSection />
        <FormsSection />
        <TrackingSection />
        <ReportsSection />
        <AnonymousSection />
        <ResourcesSection />
        <PoweredBySection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
