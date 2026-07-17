interface MarkProps {
  className?: string;
}

/**
 * Karvon mark — three rising arcs: a caravan crossing (camel humps) and the
 * arches of a bazaar at once. Goods travelling from seller to buyer.
 *
 * Drawn in `currentColor`, so it takes the colour of whatever badge it sits
 * in. The viewBox is cropped to the arcs, so the wide mark centres itself
 * inside a square box.
 */
export function KarvonMark({ className }: MarkProps) {
  return (
    <svg
      viewBox="2 19 44 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Karvon"
    >
      <path d="M5.5 34 A5.5 5.5 0 0 1 16.5 34" stroke="currentColor" strokeWidth="4.2" />
      <path d="M14 34 A7.5 7.5 0 0 1 29 34" stroke="currentColor" strokeWidth="4.2" />
      <path d="M23.5 34 A10 10 0 0 1 43.5 34" stroke="currentColor" strokeWidth="4.2" />
    </svg>
  );
}

/**
 * The mark in its own colours, for a plain surface.
 */
export function KarvonMarkColor({ className }: MarkProps) {
  return (
    <svg
      viewBox="2 19 44 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Karvon"
    >
      <path d="M5.5 34 A5.5 5.5 0 0 1 16.5 34" stroke="#F59E0B" strokeWidth="4.2" />
      <path d="M14 34 A7.5 7.5 0 0 1 29 34" stroke="#FAB417" strokeWidth="4.2" />
      <path d="M23.5 34 A10 10 0 0 1 43.5 34" stroke="#FBBF24" strokeWidth="4.2" />
    </svg>
  );
}
