/**
 * Wordmark + restrained Disclosurely attribution.
 * Swap in a logo image via `src` when the new mark is ready — keep attribution below.
 */
export function Logo({
  size = "md",
  showAttribution = true,
}: {
  size?: "md" | "lg";
  showAttribution?: boolean;
}) {
  return (
    <span className="flex items-center gap-2.5 leading-none">
      {/* Logo image slot — add <Image> here when the new mark ships */}
      <span className="flex flex-col">
        <span
          className={
            size === "lg"
              ? "font-display text-xl font-semibold tracking-tight text-foreground"
              : "font-display text-base font-semibold tracking-tight text-foreground sm:text-[17px]"
          }
        >
          Appraisal Software
        </span>
        {showAttribution ? (
          <span className="mt-0.5 w-fit text-[10px] font-medium tracking-[0.14em] uppercase text-muted-foreground">
            Powered by Disclosurely
          </span>
        ) : null}
      </span>
    </span>
  );
}
