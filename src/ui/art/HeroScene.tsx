import { useMemo } from 'react';
import { Sim } from '../../engine/engine';
import { SCENARIO_BY_ID } from '../../data/scenarios';
import { PatientFigure } from './Patient';
import { OverPatient, UnderPatient } from './Overlays';

/** Scena della pagina d'ingresso, costruita con il motore vero: motociclista stabilizzato, collare, ossigeno. */
function heroSim(): Sim {
  const sim = new Sim(SCENARIO_BY_ID['trauma-moto'], 'addestramento', ['zaino', 'collari', 'ossigeno']);
  sim.phase = 'paziente';
  sim.p.look = { ...sim.p.look, helmet: false };
  sim.immob.add('mils');
  sim.immob.add('collare');
  sim.pulseOx = true;
  sim.o2 = { device: 'reservoir', flow: 15, since: 0 };
  return sim;
}

/** Ambulanza 118 vista dall'alto, muso verso destra; origine al centro del tetto. */
function Ambulance() {
  return (
    <g>
      <rect x="-158" y="-60" width="334" height="140" rx="18" fill="#000" opacity="0.5" filter="url(#hs-sfoca)" />
      <rect x="-165" y="-70" width="330" height="140" rx="16" fill="#f4f6f8" />
      {/* modulo sanitario */}
      <rect x="-158" y="-62" width="246" height="124" rx="10" fill="#fbfcfd" stroke="#d6dce2" strokeWidth="2" />
      <rect x="-165" y="-70" width="262" height="9" fill="#ff7a1a" />
      <rect x="-165" y="61" width="262" height="9" fill="#ff7a1a" />
      <rect x="-165" y="-70" width="330" height="140" rx="16" fill="none" stroke="#c7cfd6" strokeWidth="2" />
      {/* bande retroriflettenti sul retro */}
      <g clipPath="url(#hs-retro)">
        {Array.from({ length: 9 }).map((_, i) => (
          <path key={i} d={`M-170 ${-80 + i * 20} l 22 22 v 10 l -22 -22 z`} fill={i % 2 ? '#f5c21b' : '#e5323b'} />
        ))}
      </g>
      {/* climatizzatore e scritta sul tetto */}
      <rect x="-136" y="-28" width="34" height="56" rx="6" fill="#e1e6eb" stroke="#cdd4da" />
      <text x="-12" y="22" textAnchor="middle" fontFamily="'Saira Condensed', sans-serif" fontWeight="800" fontSize="66" fill="#ff7a1a" letterSpacing="2">
        118
      </text>
      {/* cabina */}
      <path d="M98 -58 L128 -50 L128 50 L98 58 Z" fill="#17212c" />
      <path d="M104 -50 L122 -45 L122 -10 L104 -14 Z" fill="#41566b" opacity="0.7" />
      <rect x="128" y="-62" width="34" height="124" rx="12" fill="#e9edf0" />
      <rect x="116" y="-80" width="10" height="12" rx="3" fill="#c9d0d6" />
      <rect x="116" y="68" width="10" height="12" rx="3" fill="#c9d0d6" />
      {/* barra luminosa */}
      <rect x="82" y="-60" width="15" height="120" rx="4" fill="#26303b" />
      <rect className="hs-lamp hs-lamp-a" x="84" y="-57" width="11" height="40" rx="3" fill="#3f8cff" />
      <rect x="84" y="-14" width="11" height="28" rx="3" fill="#e8eef6" />
      <rect className="hs-lamp hs-lamp-b" x="84" y="17" width="11" height="40" rx="3" fill="#3f8cff" />
      <rect className="hs-lamp hs-lamp-b" x="-162" y="-62" width="8" height="12" rx="2" fill="#3f8cff" />
      <rect className="hs-lamp hs-lamp-a" x="-162" y="50" width="8" height="12" rx="2" fill="#3f8cff" />
    </g>
  );
}

function Cone({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-15" y="-15" width="30" height="30" rx="5" fill="#1d1f22" opacity="0.8" />
      <circle r="12" fill="#ff7a1a" />
      <circle r="7.5" fill="#f2f2f2" />
      <circle r="4" fill="#ff7a1a" />
    </g>
  );
}

/**
 * Notte su una strada del Friuli: l'ambulanza con i lampeggianti accesi, l'equipaggio sul motociclista.
 * Coordinate pensate per 1440 × 660 (pagina d'ingresso su schermo largo); `focus` restringe l'inquadratura.
 */
export function HeroScene({ focus = false }: { focus?: boolean }) {
  const sim = useMemo(heroSim, []);
  const s = 0.56;
  return (
    <svg viewBox={focus ? '530 60 500 410' : '0 0 1440 660'} preserveAspectRatio={focus ? 'xMidYMid slice' : 'xMidYMin slice'} className="hs-svg" role="img" aria-label="Di notte, un’ambulanza con i lampeggianti accesi protegge l’equipaggio che soccorre un motociclista a terra">
      <defs>
        <filter id="hs-asfalto" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" />
          <feColorMatrix values="0 0 0 0 0.15  0 0 0 0 0.16  0 0 0 0 0.19  0 0 0 0.6 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <filter id="hs-sfoca" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter id="sfoca" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <radialGradient id="hs-blu">
          <stop offset="0" stopColor="#3f8cff" stopOpacity="0.75" />
          <stop offset="0.45" stopColor="#3f8cff" stopOpacity="0.22" />
          <stop offset="1" stopColor="#3f8cff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hs-lampione" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffb860" stopOpacity="0.32" />
          <stop offset="1" stopColor="#ffb860" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="oro" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f7d774" />
          <stop offset="1" stopColor="#b98a2a" />
        </linearGradient>
        <clipPath id="hs-retro">
          <rect x="-165" y="-62" width="12" height="124" />
        </clipPath>
      </defs>
      <rect width="1440" height="660" fill="#22262c" />
      <rect width="1440" height="660" fill="#22262c" filter="url(#hs-asfalto)" />
      {/* marciapiede e lampione */}
      <rect x="0" y="0" width="1440" height="44" fill="#3a3f46" />
      <rect x="0" y="40" width="1440" height="8" fill="#555b62" />
      <circle cx="1180" cy="40" r="260" fill="url(#hs-lampione)" />
      {/* segnaletica */}
      {Array.from({ length: 10 }).map((_, i) => (
        <rect key={i} x={i * 160 - 30} y="612" width="86" height="10" fill="#d9d6cb" opacity="0.6" />
      ))}
      {/* frenata e moto */}
      <path d="M320 520 C 560 500, 760 480, 1010 452" stroke="#141619" strokeWidth="9" fill="none" opacity="0.7" />
      <path d="M320 540 C 560 522, 760 502, 1010 472" stroke="#141619" strokeWidth="9" fill="none" opacity="0.6" />
      <g transform="translate(1120 420) rotate(18)">
        <ellipse cx="0" cy="0" rx="92" ry="22" fill="#0e1012" opacity="0.5" transform="translate(6 10)" />
        <rect x="-80" y="-12" width="40" height="24" rx="10" fill="#1d1f22" />
        <rect x="42" y="-12" width="40" height="24" rx="10" fill="#1d1f22" />
        <rect x="-50" y="-18" width="100" height="36" rx="14" fill="#c4271f" />
        <rect x="-20" y="-11" width="45" height="22" rx="8" fill="#1b1b1d" />
        <rect x="52" y="-30" width="8" height="60" rx="3" fill="#8a9097" />
      </g>
      {/* luce blu dei lampeggianti sull'asfalto */}
      <g transform="translate(800 160) rotate(-4)">
        <circle className="hs-glow hs-glow-a" cx="89" cy="-40" r="230" fill="url(#hs-blu)" />
        <circle className="hs-glow hs-glow-b" cx="89" cy="40" r="230" fill="url(#hs-blu)" />
        <circle className="hs-glow hs-glow-b" cx="-160" cy="-56" r="120" fill="url(#hs-blu)" />
        <circle className="hs-glow hs-glow-a" cx="-160" cy="56" r="120" fill="url(#hs-blu)" />
        <Ambulance />
      </g>
      <Cone x={622} y={98} />
      <Cone x={606} y={186} />
      <Cone x={640} y={268} />
      {/* paziente e soccorritore */}
      <g transform={`translate(${660 - 150 * s} ${400 - 300 * s}) scale(${s})`}>
        <PatientFigure p={sim.p} arrest={false} cprActive={false} breathingRate={22} hoverRegion={null} under={<UnderPatient sim={sim} />} over={<OverPatient sim={sim} now={0} />} />
      </g>
    </svg>
  );
}
