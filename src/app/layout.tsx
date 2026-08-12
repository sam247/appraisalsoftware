import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

const siteUrl = "https://appraisalsoftware.co.uk";
const title = "Employee Appraisal Software & 360° Feedback | Appraisal Software";
const description =
  "Run employee appraisals, 360° feedback and structured performance reviews without spreadsheets. Reusable forms, completion tracking and clear reports. Free to start.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  authors: [{ name: "Disclosurely", url: "https://disclosurely.com" }],
  openGraph: {
    title,
    description,
    type: "website",
    url: siteUrl,
    siteName: "Appraisal Software",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${montserrat.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">{children}</body>
    </html>
  );
}
