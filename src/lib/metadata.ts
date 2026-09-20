import type { Metadata } from "next";

import { SITE_NAME, absoluteUrl } from "@/lib/site";

export function pageMetadata({
  title,
  description,
  path,
  ogType = "website",
  imagePath,
}: {
  title: string;
  description: string;
  path: string;
  ogType?: "website" | "article";
  /** Override default /social/{slug}.png mapping when a dedicated image is unavailable. */
  imagePath?: string;
}): Metadata {
  const url = absoluteUrl(path);
  const image = absoluteUrl(
    imagePath ??
      `/social/${path === "/" ? "home" : path.replace(/^\//, "").replace(/\//g, "-")}.png`,
  );

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: "en_GB",
      type: ogType,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      images: [image],
      title,
      description,
    },
  };
}
