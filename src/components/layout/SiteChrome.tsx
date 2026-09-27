import { Header } from "@/components/home/Header";
import { Footer } from "@/components/home/Footer";

export function SiteChrome({ children, commercial = false }: { children: React.ReactNode; commercial?: boolean }) {
  return (
    <div className={`marketing-site min-h-screen bg-background${commercial ? " commercial-site" : ""}`}>
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
