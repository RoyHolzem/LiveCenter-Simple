'use client';

export function XenaLogo({ size = 36, withWordmark = true }: { size?: number; withWordmark?: boolean }) {
  // The mark: an X formed by 4 inward-pointing arrow shapes (pinwheel),
  // alternating red / blue — same family as the Xena logo.
  const mark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Xena"
    >
      {/* top-left → red */}
      <path d="M4 4 L28 4 L32 28 L8 32 Z" fill="#E1182C" />
      {/* top-right → blue */}
      <path d="M60 4 L36 4 L32 28 L56 32 Z" fill="#1E73E8" />
      {/* bottom-left → blue */}
      <path d="M4 60 L28 60 L32 36 L8 32 Z" fill="#1E73E8" />
      {/* bottom-right → red */}
      <path d="M60 60 L36 60 L32 36 L56 32 Z" fill="#E1182C" />
      {/* center notch for crispness */}
      <circle cx="32" cy="32" r="3" fill="#0E2347" />
    </svg>
  );

  if (!withWordmark) return mark;

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      {mark}
      <span
        style={{
          fontWeight: 800,
          letterSpacing: '0.18em',
          fontSize: Math.round(size * 0.5),
          color: '#0E2347',
        }}
      >
        XENA
      </span>
    </span>
  );
}
