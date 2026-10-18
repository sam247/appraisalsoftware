import { DISCLOSURELY_URL } from "@/lib/links";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";

export type FaqItem = {
  question: string;
  answer: string;
};

const SOFTWARE_FEATURES = [
  "Annual appraisal campaigns",
  "Anonymous 360 feedback campaigns",
  "Reusable appraisal questions",
  "Employee self-assessments and manager responses",
  "Multi-rater invitations and completion tracking",
  "Email invitations and reminders",
  "Self vs Manager results",
];

export function articleSchema({
  title,
  description,
  path,
  datePublished,
  dateModified,
}: {
  title: string;
  description: string;
  path: string;
  datePublished?: string;
  dateModified: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    mainEntityOfPage: absoluteUrl(path),
    image: absoluteUrl(
      path.startsWith("/blog/")
        ? "/social/blog.png"
        : `/social/${path.replace(/^\//, "")}.png`,
    ),
    ...(datePublished ? { datePublished } : {}),
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

/**
 * Product markup for a pack's interactive template licence, the only thing on
 * the page that can be bought. Null when it can't be bought by any workspace
 * (checkout not configured, or a 360 pack that needs Pro first). Downloadable
 * documents are never included until they are actually for sale.
 */
export function packProductSchema(
  pack: { slug: string; name: string; summary: string; category: string; price: number; campaignType: string },
  { path, purchasable }: { path: string; purchasable: boolean },
) {
  if (!purchasable || pack.campaignType === "feedback_360") return null;
  const url = absoluteUrl(path);
  const price = (pack.price / 100).toFixed(2);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: pack.name,
    description: pack.summary,
    sku: pack.slug,
    category: pack.category,
    image: absoluteUrl("/social/marketplace.png"),
    url,
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      url,
      price,
      priceCurrency: "GBP",
      // The page shows prices "+ VAT"; say so rather than imply VAT is included.
      priceSpecification: { "@type": "UnitPriceSpecification", price, priceCurrency: "GBP", valueAddedTaxIncluded: false },
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    },
  };
}
