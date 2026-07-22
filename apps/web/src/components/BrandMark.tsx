export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="brand-mark" aria-hidden="true">
      <defs>
        <linearGradient id="brand-mark-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--series-1)" />
          <stop offset="100%" stopColor="var(--series-3)" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="24" fill="url(#brand-mark-gradient)" />
      <g stroke="#ffffff" strokeWidth="9" strokeLinecap="round" fill="none">
        <line x1="30" y1="30" x2="30" y2="70" />
        <line x1="43.3" y1="30" x2="43.3" y2="70" />
        <line x1="56.7" y1="30" x2="56.7" y2="70" />
        <line x1="70" y1="30" x2="70" y2="70" />
        <line x1="24" y1="66" x2="76" y2="34" />
      </g>
    </svg>
  );
}
