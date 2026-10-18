/**
 * Netwisk — the umbrella brand for Disclosurely and Appraisal Software.
 * Mark: an N drawn as one connected path through four nodes; the jade node
 * echoes the dot in the Appraisal Software "a." mark. Inherits currentColor.
 */
export function NetwiskMark({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <path d="M7 25V7l18 18V7" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="7" cy="25" r="3.6" fill="currentColor" />
      <circle cx="7" cy="7" r="3.6" fill="currentColor" />
      <circle cx="25" cy="25" r="3.6" fill="currentColor" />
      <circle cx="25" cy="7" r="3.6" fill="var(--primary)" />
    </svg>
  );
}

export function NetwiskLogo({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className ?? ""}`}>
      <NetwiskMark size={size} />
      <span className="font-display font-bold tracking-[-0.03em]" style={{ fontSize: size * 0.93 }}>
        netwisk
      </span>
    </span>
  );
}
