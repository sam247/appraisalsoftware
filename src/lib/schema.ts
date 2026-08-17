import { DISCLOSURELY_URL } from "@/lib/links";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";

export type FaqItem = {
  question: string;
  answer: string;
};

const SOFTWARE_FEATURES = [
  "Appraisal cycles",
  "Reusable appraisal forms",
  "360° feedback",
  "Manager and employee responses",
  "Completion tracking",
  "Email reminders",
  "Reporting and export",
  "Secure review records",
  "Optional anonymous feedback",
];

export function websiteAndOrganizationGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: "en-GB",
        publisher: { "@id": `${SITE_URL}#organization` },
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        parentOrganization: {
          "@type": "Organization",
          name: "Disclosurely",
          url: DISCLOSURELY_URL,
        },
      },
    ],
  };
}

export function softwareApplicationSchema({
  path = "/",
  name = SITE_NAME,
  description = SITE_DESCRIPTION,
}: {
  path?: string;
  name?: string;
  description?: string;
} = {}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${absoluteUrl(path)}#software`,
    name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: absoluteUrl(path),
    description,
    featureList: SOFTWARE_FEATURES,
    inLanguage: "en-GB",
    creator: {
      "@type": "Organization",
      name: "Disclosurely",
      url: DISCLOSURELY_URL,
    },
    provider: {
      "@type": "Organization",
      name: "Disclosurely",
      url: DISCLOSURELY_URL,
    },
  };
}

export function faqPageSchema(faqs: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
