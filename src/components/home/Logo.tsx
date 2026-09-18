import Image from "next/image";

/** Outlined wordmark with the signature jade dot. */
export function Logo({
  size = "md",
}: {
  size?: "md" | "lg";
}) {
  return (
    <Image
      src="/brand/wordmark.svg"
      alt="appraisal.software"
      width={857}
      height={152}
      className={size === "lg" ? "h-auto w-[210px]" : "h-auto w-[170px]"}
      unoptimized
    />
  );
}

export function BrandMark({ size = 40 }: { size?: number }) {
  return <Image src="/brand/app-icon.svg" alt="appraisal.software" width={size} height={size} unoptimized />;
}
