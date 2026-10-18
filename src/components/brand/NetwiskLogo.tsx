/**
 * Netwisk — umbrella brand for Disclosurely and Appraisal Software.
 * A wordmark only: lowercase "netwisk" in Inter Bold, with the dot of the i
 * replaced by a small jade "whisk" stroke centred over the stem.
 * Text inherits currentColor; size it with font-size on the parent or `size`.
 */
export function NetwiskLogo({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <span
      className={`inline-flex items-baseline font-display font-bold leading-none tracking-[-0.045em] ${className ?? ""}`}
      style={{ fontSize: size }}
      aria-label="netwisk"
      role="img"
    >
      <span aria-hidden>netw</span>
      <span aria-hidden className="relative inline-block">
        ı
        <svg
          viewBox="0 0 22 13"
          className="absolute left-1/2 overflow-visible"
          style={{ top: "-0.06em", width: "0.34em", height: "0.2em", transform: "translateX(-62%)" }}
        >
          <path d="M2 11C6 4.5 13 2 20 4.5" fill="none" stroke="var(--primary)" strokeWidth={4.2} strokeLinecap="round" />
        </svg>
      </span>
      <span aria-hidden>sk</span>
    </span>
  );
}
