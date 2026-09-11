/**
 * Typographic wordmark — appraisal.software
 * The coral period is the brand mark, recurring as a signature element.
 */
export function Logo({
  size = "md",
}: {
  size?: "md" | "lg";
}) {
  const text =
    size === "lg"
      ? "font-display text-lg font-semibold tracking-[-0.045em] text-foreground sm:text-xl"
      : "font-display text-[15px] font-semibold tracking-[-0.045em] text-foreground";

  return (
    <span className={text}>
      appraisal<span className="text-primary">.</span>software
    </span>
  );
}
