import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { AppGraphicView } from "@/components/resources/AppGraphics";
import type { ResourceFigure } from "@/lib/resource-content";

export function resourcePhotoPath(id: string) {
  return `/resources/photos/${id}.jpg`;
}

/**
 * Photos are dropped into public/resources/photos/{id}.jpg. Until the file
 * exists, a placeholder shows the brief and the expected filename so the
 * missing photo is easy to spot and supply.
 */
function hasPhoto(id: string) {
  return fs.existsSync(path.join(process.cwd(), "public", resourcePhotoPath(id)));
}

export function ResourceFigureView({ figure }: { figure: ResourceFigure }) {
  if (figure.type === "app") {
    return (
      <figure className="no-print not-prose my-2">
        <div className="rounded-2xl bg-surface-2/60 p-3 sm:p-6">
          <AppGraphicView graphic={figure.graphic} />
        </div>
        <figcaption className="mt-3 text-sm leading-relaxed text-muted-foreground">{figure.caption}</figcaption>
      </figure>
    );
  }

  const src = resourcePhotoPath(figure.id);
  return (
    <figure className="no-print my-2">
      {hasPhoto(figure.id) ? (
        <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-surface-2">
          <Image src={src} alt={figure.alt} fill sizes="(min-width: 832px) 768px, calc(100vw - 40px)" className="object-cover" />
        </div>
      ) : (
        <div
          data-photo-placeholder={figure.id}
          className="flex aspect-[16/9] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-surface/60 px-6 text-center"
        >
          <ImageIcon className="size-8 text-muted-foreground" aria-hidden />
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Photo to come</p>
          <p className="max-w-md text-sm leading-relaxed text-foreground">{figure.brief}</p>
          <p className="font-mono text-[11px] text-muted-foreground">public{src} · 1600×900</p>
        </div>
      )}
      {figure.caption ? <figcaption className="mt-3 text-sm leading-relaxed text-muted-foreground">{figure.caption}</figcaption> : null}
    </figure>
  );
}
