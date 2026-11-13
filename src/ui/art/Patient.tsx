import type { ReactNode } from 'react';
import type { BodyRegion, Patient } from '../../engine/types';
import { mix, shade } from './color';

export interface PatientArtState {
  p: Patient;
  arrest: boolean;
  cprActive: boolean;
  breathingRate: number; // atti/min per l'animazione del torace
  hoverRegion: BodyRegion | null;
  onRegion?: (r: BodyRegion, x: number, y: number) => void;
  onHover?: (r: BodyRegion | null) => void;
  /** elementi disegnati sotto e sopra il paziente, nella stessa scala */
  under?: ReactNode;
  over?: ReactNode;
}

function skinFor(p: Patient): string {
  const base = p.look.skinTone;
  switch (p.skin.color) {
    case 'pallida':
      return mix(base, '#e9e4df', 0.45);
    case 'cianotica':
      return mix(base, '#8ea2c7', 0.3);
    case 'grigiastra':
      return mix(base, '#8f9396', 0.5);
    case 'arrossata':
      return mix(base, '#e05a4a', 0.32);
    case 'marezzata':
      return mix(base, '#b7a2b6', 0.35);
    default:
      return base;
  }
}

function lipsFor(p: Patient, skin: string): string {
  if (p.skin.color === 'cianotica' || p.skin.color === 'grigiastra') return '#5a6fa8';
  return shade(mix(skin, '#c0505a', 0.45), -0.08);
}

/** Regione cliccabile: rettangolo o ellisse invisibile con evidenziazione al passaggio */
function Hit({
  region,
  hover,
  onRegion,
  onHover,
  children,
}: {
  region: BodyRegion;
  hover: boolean;
  onRegion?: PatientArtState['onRegion'];
  onHover?: PatientArtState['onHover'];
  children: JSX.Element;
}) {
  return (
    <g
      className={`hit${hover ? ' hit-on' : ''}`}
      role="button"
      tabIndex={-1}
      aria-label={region}
      onPointerEnter={() => onHover?.(region)}
      onPointerLeave={() => onHover?.(null)}
      onClick={(e) => {
        const svg = (e.currentTarget as SVGGElement).ownerSVGElement;
        const r = svg?.getBoundingClientRect();
        onRegion?.(region, e.clientX - (r?.left ?? 0), e.clientY - (r?.top ?? 0));
      }}
    >
      {children}
    </g>
  );
}

function Face({ p, skin, cx, cy, scale = 1 }: { p: Patient; skin: string; cx: number; cy: number; scale?: number }) {
  const open = p.avpu === 'A' || p.avpu === 'V' || p.seizing;
  const lips = lipsFor(p, skin);
  const droop = p.stroke?.face;
  const s = scale;
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      {/* sopracciglia */}
      <path d="M-4 -17 q -6 -4 -10 2" stroke={shade(p.look.hair, -0.1)} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M-4 17 q -6 4 -10 -2" stroke={shade(p.look.hair, -0.1)} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      {/* occhi */}
      {open ? (
        <>
          <ellipse cx="2" cy="-11" rx="4.2" ry="5.5" fill="#f4f1ec" />
          <ellipse cx="2" cy="11" rx="4.2" ry="5.5" fill="#f4f1ec" />
          <circle cx={p.seizing ? -1 : 2.5} cy="-11" r={p.pupils === 'miotiche' ? 1.2 : p.pupils === 'midriatiche' ? 3 : 2.2} fill="#2a2018" />
          <circle cx={p.seizing ? -1 : 2.5} cy="11" r={p.pupils === 'miotiche' ? 1.2 : p.pupils === 'anisocoriche' ? 3 : p.pupils === 'midriatiche' ? 3 : 2.2} fill="#2a2018" />
        </>
      ) : (
        <>
          <path d="M2 -16 q 3 5 0 10" stroke={shade(skin, -0.45)} strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M2 6 q 3 5 0 10" stroke={shade(skin, -0.45)} strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </>
      )}
      {/* naso */}
      <path d="M8 -3 q 8 3 0 6" stroke={shade(skin, -0.25)} strokeWidth="2" fill={shade(skin, -0.05)} />
      {/* bocca */}
      {p.speech === 'assente' && p.avpu === 'U' ? (
        <ellipse cx="21" cy="0" rx="3.2" ry="6" fill="#3a1c1c" stroke={lips} strokeWidth="2" />
      ) : droop ? (
        <path d="M20 -8 q 3 8 6 15" stroke={lips} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      ) : (
        <path d={p.v.spo2 < 85 || p.airway === 'ostruzione_completa' ? 'M19 -7 q 6 7 0 14' : 'M21 -7 q 2 7 0 14'} stroke={lips} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      )}
      {/* sudore */}
      {p.skin.sweaty && (
        <g fill="#cfe8ff" opacity="0.85">
          <path d="M-14 -6 q 2 -4 3 0 q -1 3 -3 0z" />
          <path d="M-12 8 q 2 -4 3 0 q -1 3 -3 0z" />
          <path d="M-6 -24 q 2 -4 3 0 q -1 3 -3 0z" />
        </g>
      )}
    </g>
  );
}

/** Paziente supino visto dall'alto: testa a sinistra, piedi a destra. Il lato destro del paziente è in basso. */
function Supine({ s, prone = false }: { s: PatientArtState; prone?: boolean }) {
  const { p, hoverRegion: hv, onRegion, onHover } = s;
  const skin = skinFor(p);
  const shirt = p.look.shirt;
  const pants = p.look.pants;
  const hair = p.look.hair;
  const limbShade = shade(skin, -0.12);
  const breathing = !s.arrest && p.breathing !== 'assente' && s.breathingRate > 0;
  const torsoClass = s.cprActive ? 'torso cpr-anim' : breathing ? 'torso breath-anim' : 'torso';
  const torsoStyle = breathing && !s.cprActive ? { animationDuration: `${Math.max(1.2, 60 / Math.max(4, s.breathingRate))}s` } : undefined;
  const seizing = p.seizing ? ' seizure' : '';
  const sleeveLen = 52;
  const mottled = p.skin.color === 'marezzata' || p.skin.color === 'grigiastra';
  return (
    <g>
      {/* ombra */}
      <ellipse cx="450" cy="312" rx="270" ry="92" fill="#000" opacity="0.28" filter="url(#sfoca)" />
      {/* gambe */}
      <g className={`limb${seizing}`}>
        <Hit region="gamba_sx" hover={hv === 'gamba_sx'} onRegion={onRegion} onHover={onHover}>
          <g>
            <path d="M488 276 L600 274 L690 270" stroke={pants} strokeWidth="38" strokeLinecap="round" fill="none" />
            <ellipse cx="704" cy="268" rx="13" ry="19" fill={p.look.build === 'neonato' ? skin : '#2a2d33'} />
          </g>
        </Hit>
        <Hit region="gamba_dx" hover={hv === 'gamba_dx'} onRegion={onRegion} onHover={onHover}>
          <g>
            <path d="M488 324 L600 326 L690 330" stroke={pants} strokeWidth="38" strokeLinecap="round" fill="none" />
            <ellipse cx="704" cy="332" rx="13" ry="19" fill={p.look.build === 'neonato' ? skin : '#2a2d33'} />
          </g>
        </Hit>
      </g>
      {/* bacino */}
      <Hit region="bacino" hover={hv === 'bacino'} onRegion={onRegion} onHover={onHover}>
        <rect x="430" y="250" width="66" height="100" rx="20" fill={pants} />
      </Hit>
      <rect x="430" y="248" width="16" height="104" rx="6" fill={shade(pants, -0.25)} pointerEvents="none" />
      {/* braccia */}
      <g className={`limb${seizing}`}>
        <Hit region="braccio_sx" hover={hv === 'braccio_sx'} onRegion={onRegion} onHover={onHover}>
          <g>
            <path d={`M300 230 L${300 + sleeveLen} 225`} stroke={shirt} strokeWidth="30" strokeLinecap="round" />
            <path d={`M${300 + sleeveLen} 225 L392 222 L452 220`} stroke={limbShade} strokeWidth="24" strokeLinecap="round" fill="none" />
            <circle cx="468" cy="220" r="12" fill={skin} />
          </g>
        </Hit>
        <Hit region="braccio_dx" hover={hv === 'braccio_dx'} onRegion={onRegion} onHover={onHover}>
          <g>
            <path d={`M300 370 L${300 + sleeveLen} 375`} stroke={shirt} strokeWidth="30" strokeLinecap="round" />
            <path d={`M${300 + sleeveLen} 375 L392 378 L452 380`} stroke={limbShade} strokeWidth="24" strokeLinecap="round" fill="none" />
            <circle cx="468" cy="380" r="12" fill={skin} />
          </g>
        </Hit>
      </g>
      {mottled && (
        <g opacity="0.35" pointerEvents="none">
          {[
            [410, 222],
            [430, 378],
            [600, 272],
            [640, 330],
            [560, 328],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="7" fill="#6a5a7c" />
          ))}
        </g>
      )}
      {/* tronco */}
      <g className={torsoClass} style={torsoStyle}>
        <Hit region="torace" hover={hv === 'torace'} onRegion={onRegion} onHover={onHover}>
          <path d="M284 244 Q 290 226 312 226 L 390 230 L 390 370 L 312 374 Q 290 374 284 356 Z" fill={shirt} />
        </Hit>
        <Hit region="addome" hover={hv === 'addome'} onRegion={onRegion} onHover={onHover}>
          <path d="M388 230 L 440 248 L 440 352 L 388 370 Z" fill={shade(shirt, -0.06)} />
        </Hit>
        {!prone && <path d="M300 300 L 430 300" stroke={shade(shirt, -0.2)} strokeWidth="2" opacity="0.5" pointerEvents="none" />}
        {!prone && (
          <g pointerEvents="none" opacity="0.6">
            <circle cx="330" cy="300" r="2.4" fill={shade(shirt, -0.3)} />
            <circle cx="362" cy="300" r="2.4" fill={shade(shirt, -0.3)} />
            <circle cx="394" cy="300" r="2.4" fill={shade(shirt, -0.3)} />
          </g>
        )}
      </g>
      {/* collo */}
      <Hit region="collo" hover={hv === 'collo'} onRegion={onRegion} onHover={onHover}>
        <rect x="262" y="284" width="28" height="32" rx="8" fill={limbShade} />
      </Hit>
      {/* testa */}
      <Hit region="testa" hover={hv === 'testa'} onRegion={onRegion} onHover={onHover}>
        <g>
          <ellipse cx="232" cy="300" rx="40" ry="33" fill={skin} />
          {prone ? (
            <ellipse cx="232" cy="300" rx="40" ry="33" fill={hair} />
          ) : p.look.hairStyle === 'calvo' ? (
            <path d="M200 280 Q 192 300 200 320" stroke={hair} strokeWidth="6" fill="none" strokeLinecap="round" />
          ) : p.look.hairStyle === 'lunghi' ? (
            <path d="M196 268 Q 176 300 196 332 L 180 352 Q 150 300 180 248 Z M196 268 Q 214 262 220 270 Q 206 300 220 330 Q 214 338 196 332 Q 186 300 196 268 Z" fill={hair} />
          ) : p.look.hairStyle === 'bimbo' ? (
            <path d="M196 274 Q 190 300 196 326 Q 212 300 196 274 Z" fill={hair} />
          ) : (
            <path d="M194 274 Q 186 300 194 326 Q 214 320 214 300 Q 214 280 194 274 Z" fill={hair} />
          )}
          {!prone && <Face p={p} skin={skin} cx={242} cy={300} />}
          {/* orecchie */}
          <ellipse cx="236" cy="266" rx="7" ry="4" fill={limbShade} />
          <ellipse cx="236" cy="334" rx="7" ry="4" fill={limbShade} />
        </g>
      </Hit>
    </g>
  );
}

/** Posizione laterale di sicurezza vista dall'alto. */
function Lateral({ s }: { s: PatientArtState }) {
  const { p, hoverRegion: hv, onRegion, onHover } = s;
  const skin = skinFor(p);
  const shirt = p.look.shirt;
  const pants = p.look.pants;
  const limbShade = shade(skin, -0.12);
  return (
    <g>
      <ellipse cx="450" cy="300" rx="260" ry="70" fill="#000" opacity="0.28" filter="url(#sfoca)" />
      {/* gamba sotto, distesa */}
      <Hit region="gamba_dx" hover={hv === 'gamba_dx'} onRegion={onRegion} onHover={onHover}>
        <path d="M486 292 L600 288 L690 286" stroke={shade(pants, -0.15)} strokeWidth="34" strokeLinecap="round" fill="none" />
      </Hit>
      {/* gamba sopra, flessa */}
      <Hit region="gamba_sx" hover={hv === 'gamba_sx'} onRegion={onRegion} onHover={onHover}>
        <path d="M486 312 L560 360 L640 352" stroke={pants} strokeWidth="36" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </Hit>
      <Hit region="bacino" hover={hv === 'bacino'} onRegion={onRegion} onHover={onHover}>
        <rect x="430" y="268" width="66" height="66" rx="22" fill={pants} />
      </Hit>
      {/* braccio sotto in avanti */}
      <Hit region="braccio_dx" hover={hv === 'braccio_dx'} onRegion={onRegion} onHover={onHover}>
        <path d="M300 330 L340 380 L400 392" stroke={limbShade} strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </Hit>
      <Hit region="torace" hover={hv === 'torace'} onRegion={onRegion} onHover={onHover}>
        <path d="M284 270 Q 300 258 330 258 L 440 268 L 440 336 L 330 344 Q 296 344 284 330 Z" fill={shirt} />
      </Hit>
      {/* braccio sopra, mano sotto la guancia */}
      <Hit region="braccio_sx" hover={hv === 'braccio_sx'} onRegion={onRegion} onHover={onHover}>
        <g>
          <path d="M330 280 L300 340 L262 344" stroke={shade(shirt, 0.06)} strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="252" cy="340" r="11" fill={skin} />
        </g>
      </Hit>
      <Hit region="collo" hover={hv === 'collo'} onRegion={onRegion} onHover={onHover}>
        <rect x="262" y="286" width="26" height="30" rx="8" fill={limbShade} />
      </Hit>
      <Hit region="testa" hover={hv === 'testa'} onRegion={onRegion} onHover={onHover}>
        <g>
          <ellipse cx="232" cy="304" rx="38" ry="30" fill={skin} />
          <path d="M200 284 Q 194 304 204 326 Q 232 300 220 280 Z" fill={p.look.hair} />
          <ellipse cx="236" cy="290" rx="8" ry="5" fill={limbShade} />
          <path d="M256 314 q 6 2 10 -2" stroke={lipsFor(p, skin)} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M246 300 q 4 3 8 0" stroke={shade(skin, -0.45)} strokeWidth="1.6" fill="none" />
        </g>
      </Hit>
    </g>
  );
}

/** In piedi visto dall'alto (es. soffocamento): testa, spalle, mani alla gola. */
function Standing({ s }: { s: PatientArtState }) {
  const { p, hoverRegion: hv, onRegion, onHover } = s;
  const skin = skinFor(p);
  return (
    <g>
      <ellipse cx="456" cy="312" rx="90" ry="62" fill="#000" opacity="0.3" filter="url(#sfoca)" />
      <Hit region="torace" hover={hv === 'torace'} onRegion={onRegion} onHover={onHover}>
        <ellipse cx="450" cy="300" rx="44" ry="82" fill={p.look.shirt} />
      </Hit>
      <Hit region="braccio_sx" hover={hv === 'braccio_sx'} onRegion={onRegion} onHover={onHover}>
        <path d="M454 226 L496 262 L486 292" stroke={p.look.shirt} strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </Hit>
      <Hit region="braccio_dx" hover={hv === 'braccio_dx'} onRegion={onRegion} onHover={onHover}>
        <path d="M454 374 L496 338 L486 308" stroke={p.look.shirt} strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </Hit>
      <circle cx="484" cy="292" r="11" fill={skin} />
      <circle cx="484" cy="308" r="11" fill={skin} />
      <Hit region="testa" hover={hv === 'testa'} onRegion={onRegion} onHover={onHover}>
        <g>
          <circle cx="450" cy="300" r="34" fill={p.look.hair} />
          <ellipse cx="476" cy="300" rx="10" ry="18" fill={skin} />
        </g>
      </Hit>
    </g>
  );
}

export function PatientFigure(s: PatientArtState) {
  const b = s.p.look.build;
  const pos = s.p.position;
  let fig: JSX.Element;
  if (pos === 'laterale') fig = <Lateral s={s} />;
  else if (pos === 'in_piedi') fig = <Standing s={s} />;
  else fig = <Supine s={s} prone={pos === 'prono'} />;
  // bambini e lattanti: ridotti attorno al centro del tronco
  const sc = b === 'neonato' ? 0.56 : b === 'bambino' ? 0.72 : b === 'adolescente' ? 0.93 : b === 'robusto' ? 1.04 : 1;
  const seated = pos === 'semiseduto' || pos === 'seduto';
  return (
    <g transform={`translate(${450 - 450 * sc} ${300 - 300 * sc}) scale(${sc})`}>
      {seated && (
        <g>
          <rect x="170" y="230" width="250" height="140" rx="16" fill="#4c5560" />
          <rect x="176" y="236" width="238" height="128" rx="12" fill="#5d6773" />
        </g>
      )}
      {s.under}
      {fig}
      {s.over}
    </g>
  );
}

export const REGION_LABEL: Record<BodyRegion, string> = {
  testa: 'Testa e vie aeree',
  collo: 'Collo',
  torace: 'Torace',
  addome: 'Addome',
  bacino: 'Bacino',
  braccio_sx: 'Braccio sinistro',
  braccio_dx: 'Braccio destro',
  gamba_sx: 'Gamba sinistra',
  gamba_dx: 'Gamba destra',
};
