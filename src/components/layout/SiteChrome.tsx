import { Header } from "@/components/home/Header";
import { Footer } from "@/components/home/Footer";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
