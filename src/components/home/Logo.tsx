/**
 * Typographic wordmark — standalone Appraisal Software brand.
 * No inherited Disclosurely visual identity.
 */
export function Logo({
  size = "md",
}: {
  size?: "md" | "lg";
}) {
  return (
    <span className="flex items-center gap-2 leading-none">
      <span
        className={
          size === "lg"
            ? "font-display text-lg font-semibold tracking-[-0.04em] text-foreground sm:text-xl"
            : "font-display text-[15px] font-semibold tracking-[-0.04em] text-foreground"
        }
      >
        <span className="text-primary">appraisal</span>
        <span className="text-foreground">software</span>
      </span>
    </span>
  );
}
