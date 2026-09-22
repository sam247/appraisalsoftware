import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { ConsentManager } from "@/components/consent/ConsentManager";
import { JsonLd } from "@/components/seo/JsonLd";
import { websiteAndOrganizationGraph } from "@/lib/schema";
import {
  isProductionDeployment,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
} from "@/lib/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  robots: isProductionDeployment
    ? { index: true, follow: true }
    : { index: false, follow: false },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <JsonLd data={websiteAndOrganizationGraph()} />
        <ConsentManager>{children}</ConsentManager>
      </body>
    </html>
  );
}
