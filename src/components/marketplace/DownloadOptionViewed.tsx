"use client";

import { useEffect, useRef } from "react";
import { trackDownloadEvent } from "@/lib/analytics/events";

/** Reports download_option_viewed once, when the coming-soon option scrolls into view. */
export function DownloadOptionViewed({ packSlug, children }: { packSlug: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        trackDownloadEvent("download_option_viewed", packSlug);
        observer.disconnect();
      },
      { threshold: 0.5 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [packSlug]);
  return <div ref={ref}>{children}</div>;
}
