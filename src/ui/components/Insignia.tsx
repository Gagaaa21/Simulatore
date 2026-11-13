import type { Badge } from '../../data/career';

/** Grado: scudetto con galloni a V, come sulle divise. */
export function RankInsignia({ stripes, size = 56 }: { stripes: number; size?: number }) {
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 60 69" aria-hidden="true" className="insignia">
      <path d="M30 2 L56 10 L56 36 Q56 58 30 67 Q4 58 4 36 L4 10 Z" fill="#13233a" stroke="#c9d4df" strokeWidth="2.5" />
      <path d="M30 6 L52 13 L52 36 Q52 55 30 63 Q8 55 8 36 L8 13 Z" fill="none" stroke="#ff7a1a" strokeWidth="1.2" opacity="0.6" />
      {stripes === 0 ? (
        <circle cx="30" cy="34" r="6" fill="#ff7a1a" />
      ) : (
        Array.from({ length: stripes }).map((_, i) => {
          const y = 22 + i * 8.5 - (stripes - 1) * 2.5;
          return <path key={i} d={`M14 ${y} L30 ${y + 8} L46 ${y}`} stroke={i % 2 ? '#c9d4df' : '#ff7a1a'} strokeWidth="5" fill="none" strokeLinejoin="round" strokeLinecap="round" />;
        })
      )}
    </svg>
  );
}

function Glyph({ shape }: { shape: Badge['shape'] }) {
  switch (shape) {
    case 'cuore':
      return <path d="M30 44 C14 34 14 22 22 20 C26 19 29 21 30 24 C31 21 34 19 38 20 C46 22 46 34 30 44 Z" />;
    case 'fulmine':
      return <path d="M33 14 L20 33 L29 33 L26 46 L40 26 L31 26 Z" />;
    case 'stella':
      return <path d="M30 14 L34 25 L46 25 L36 32 L40 44 L30 37 L20 44 L24 32 L14 25 L26 25 Z" />;
    case 'croce':
      return <path d="M26 15 H34 V26 H45 V34 H34 V45 H26 V34 H15 V26 H26 Z" />;
    case 'radio':
      return (
        <g>
          <rect x="22" y="20" width="16" height="24" rx="3" />
          <rect x="31" y="12" width="3" height="10" />
          <path d="M14 24 Q10 30 14 36 M46 24 Q50 30 46 36" stroke="currentColor" strokeWidth="2.5" fill="none" />
        </g>
      );
    case 'laccio':
      return (
        <g>
          <rect x="16" y="26" width="28" height="8" rx="3" />
          <rect x="27" y="16" width="6" height="28" rx="2" />
        </g>
      );
    case 'orologio':
      return (
        <g>
          <circle cx="30" cy="30" r="13" fill="none" stroke="currentColor" strokeWidth="4" />
          <path d="M30 22 V30 L36 34" stroke="currentColor" strokeWidth="3" fill="none" />
        </g>
      );
    case 'scudo':
      return <path d="M30 14 L43 19 V30 Q43 41 30 46 Q17 41 17 30 V19 Z" />;
    case 'bimbo':
      return (
        <g>
          <circle cx="30" cy="23" r="8" />
          <path d="M18 45 Q30 26 42 45 Z" />
        </g>
      );
    case 'tenda':
      return <path d="M30 14 L46 44 H14 Z M30 26 L36 44 H24 Z" fillRule="evenodd" />;
    case 'mappa':
      return <path d="M14 18 L24 14 L36 18 L46 14 V42 L36 46 L24 42 L14 46 Z" />;
    case 'luna':
      return <path d="M36 14 A16 16 0 1 0 46 38 A13 13 0 1 1 36 14 Z" />;
    case 'mani':
      return (
        <g>
          <ellipse cx="30" cy="34" rx="12" ry="9" />
          <rect x="24" y="14" width="12" height="16" rx="5" />
        </g>
      );
    default:
      return null;
  }
}

/** Distintivo: medaglia con glifo; grigio se ancora bloccato. */
export function BadgeMedal({ badge, locked, size = 64 }: { badge: Badge; locked?: boolean; size?: number }) {
  const c = locked ? '#3a4b62' : badge.color;
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" aria-hidden="true" className={`medal${locked ? ' locked' : ''}`}>
      <circle cx="30" cy="30" r="27" fill="#0d1826" stroke={c} strokeWidth="3" />
      <circle cx="30" cy="30" r="22" fill={locked ? '#16243a' : '#13233a'} stroke={c} strokeOpacity="0.4" strokeWidth="1.2" strokeDasharray="2 3" />
      <g fill={c} color={c}>
        <Glyph shape={badge.shape} />
      </g>
    </svg>
  );
}
