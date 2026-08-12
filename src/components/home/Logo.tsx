export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <span className="flex flex-col leading-none">
      <span
        className={
          size === "lg"
            ? "font-display text-xl font-semibold tracking-tight text-foreground"
            : "font-display text-base font-semibold tracking-tight text-foreground sm:text-[17px]"
        }
      >
        Appraisal Software
      </span>
      <span className="mt-0.5 text-[10px] font-medium tracking-[0.16em] uppercase text-muted-foreground">
        by Disclosurely
      </span>
    </span>
  );
}
