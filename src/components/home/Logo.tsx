import Image from "next/image";
import { cn } from "@/lib/utils";

/** Outlined wordmark with the signature jade dot. */
export function Logo({
  size = "md",
  className,
}: {
  size?: "md" | "lg";
  className?: string;
}) {
  return (
    <Image
      src="/brand/wordmark.svg"
      alt="appraisal.software"
      width={857}
      height={152}
      className={cn("h-auto", size === "lg" ? "w-[210px]" : "w-[170px]", className)}
      unoptimized
    />
  );
}

export function BrandMark({ size = 40 }: { size?: number }) {
  return <Image src="/brand/app-icon.svg" alt="appraisal.software" width={size} height={size} className="brand-mark" unoptimized />;
}
