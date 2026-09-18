import { DISCLOSURELY_URL } from "@/lib/links";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";

export type FaqItem = {
  question: string;
  answer: string;
};

const SOFTWARE_FEATURES = [
  "Annual appraisal campaigns",
  "Reusable appraisal questions",
  "Employee self-assessments and manager responses",
  "Completion tracking",
  "Email invitations and reminders",
  "Self vs Manager results",
];

export function articleSchema({ title, description, path, dateModified }: { title: string; description: string; path: string; dateModified: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    mainEntityOfPage: absoluteUrl(path),
    image: absoluteUrl(`/social/${path.replace(/^\//, "")}.png`),
    dateModified,
    inLanguage: "en-GB",
    author: { "@type": "Organization", name: "Appraisal Software team", url: SITE_URL },
    publisher: { "@id": `${SITE_URL}#organization` },
  };
}

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
        logo: absoluteUrl("/brand/icon-512.png"),
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
      name: SITE_NAME,
      url: SITE_URL,
    },
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
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
