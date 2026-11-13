/** Marchio di Sirena 118: lampeggiante stilizzato con fasci di luce. */
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className="logo-mark">
      <path d="M6 18 L14 22 M4 30 L13 30 M42 18 L34 22 M44 30 L35 30 M24 4 V12" stroke="#ff7a1a" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M13 38 V30 a11 11 0 0 1 22 0 V38 Z" fill="#3f8cff" />
      <path d="M17 30 a7 7 0 0 1 7 -7" stroke="#cfe3ff" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <rect x="9" y="38" width="30" height="6" rx="2" fill="#c9d4df" />
    </svg>
  );
}
