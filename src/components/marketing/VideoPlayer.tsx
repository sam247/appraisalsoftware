"use client";

import Image from "next/image";
import { useState } from "react";
import { Play } from "lucide-react";
import type { ProductVideoConfig } from "@/lib/video";

/**
 * Click-to-play: YouTube is only contacted once the visitor presses play, and
 * then through the privacy-enhanced youtube-nocookie.com domain.
 *
 * Posters already carry their own on-screen copy, so they are shown uncropped
 * (object-contain on a matching background) with only the play control on top.
 */
export function VideoPlayer({ video, sizes, className = "" }: { video: ProductVideoConfig; sizes: string; className?: string }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className={`relative aspect-video bg-[rgb(250_249_244)] ${className}`}>
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
          title={video.title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 size-full bg-black"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 size-full"
          aria-label={`Play video: ${video.title} (${video.durationLabel})`}
        >
          <Image src={video.poster} alt="" fill sizes={sizes} className="object-contain" />
          <span className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/5" aria-hidden />
          <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
            <span className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_12px_30px_-8px_rgb(0_0_0/0.45)] ring-8 ring-primary/15 transition-transform duration-300 group-hover:scale-105 sm:size-20">
              <Play className="ml-1 size-7 fill-current sm:size-8" />
            </span>
          </span>
          <span className="absolute right-4 top-4 rounded-full bg-black/75 px-3 py-1 text-xs font-medium text-white sm:right-5 sm:top-5">
            {video.durationLabel}
          </span>
        </button>
      )}
    </div>
  );
}
