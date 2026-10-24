import { absoluteUrl } from "@/lib/site";

export const PRODUCT_VIDEO = {
  youtubeId: "geUpzkJdH1M",
  title: "Meet Appraisal Software",
  description:
    "A 55-second tour of Appraisal Software: start from a ready-made template, set the questions, add people, launch the campaign and track responses in one place.",
  poster: "/marketing/meet-appraisal-software.jpg",
  durationIso: "PT55S",
  durationLabel: "0:55",
  uploadDate: "2026-10-23T03:44:48-07:00",
} as const;

export function productVideoSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: PRODUCT_VIDEO.title,
    description: PRODUCT_VIDEO.description,
    thumbnailUrl: absoluteUrl(PRODUCT_VIDEO.poster),
    uploadDate: PRODUCT_VIDEO.uploadDate,
    duration: PRODUCT_VIDEO.durationIso,
    embedUrl: `https://www.youtube.com/embed/${PRODUCT_VIDEO.youtubeId}`,
    contentUrl: `https://www.youtube.com/watch?v=${PRODUCT_VIDEO.youtubeId}`,
    inLanguage: "en-GB",
  };
}
