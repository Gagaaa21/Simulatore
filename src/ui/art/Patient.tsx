import { useId, type ReactNode } from 'react';
import type { BodyRegion, Patient } from '../../engine/types';
import { mix, shade } from './color';
import { bodyGeometry, capsule, type BodyGeo, type Limb, type Pt } from './body';

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

export function skinFor(p: Patient): string {
  const base = p.look.skinTone;
  switch (p.skin.color) {
    case 'pallida':
      return mix(base, '#ece7e1', 0.42);
    case 'cianotica':
      return mix(base, '#8ea2c7', 0.3);
    case 'grigiastra':
      return mix(base, '#8f9396', 0.5);
    case 'arrossata':
      return mix(base, '#e05a4a', 0.28);
    case 'marezzata':
      return mix(base, '#b7a2b6', 0.32);
    default:
      return base;
  }
}

function lipsFor(p: Patient, skin: string): string {
  if (p.skin.color === 'cianotica' || p.skin.color === 'grigiastra') return '#5a6fa8';
  return shade(mix(skin, '#c0505a', 0.42), -0.06);
}

const ink = (c: string) => shade(c, -0.5);

/** Gradiente cilindrico: luce dall'alto a sinistra. */
function Grad({ id, c }: { id: string; c: string }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0.15" y2="1">
      <stop offset="0" stopColor={shade(c, 0.16)} />
      <stop offset="0.45" stopColor={c} />
      <stop offset="1" stopColor={shade(c, -0.22)} />
    </linearGradient>
  );
}

function Hit({
  region,
  hover,
  s,
  children,
}: {
  region: BodyRegion;
  hover: boolean;
  s: PatientArtState;
  children: ReactNode;
}) {
  return (
    <g
      className={`hit${hover ? ' hit-on' : ''}`}
      role="button"
      tabIndex={-1}
      aria-label={region}
      onPointerEnter={() => s.onHover?.(region)}
      onPointerLeave={() => s.onHover?.(null)}
      onClick={(e) => {
        const svg = (e.currentTarget as SVGGElement).ownerSVGElement;
        const r = svg?.getBoundingClientRect();
        s.onRegion?.(region, e.clientX - (r?.left ?? 0), e.clientY - (r?.top ?? 0));
      }}
    >
      {children}
    </g>
  );
}

// ───────────────────────── volto (visto dall'alto, fronte verso sinistra)
function Face({ p, skin, c, rx, ry }: { p: Patient; skin: string; c: Pt; rx: number; ry: number }) {
  const k = rx / 39;
  const open = p.avpu === 'A' || p.avpu === 'V' || p.seizing;
  const lips = lipsFor(p, skin);
  const infant = p.look.build === 'neonato' || p.look.build === 'bambino';
  const brow = shade(p.look.hair, -0.05);
  const lid = shade(skin, -0.42);
  const eyeX = c.x + 5 * k;
  const eyeDy = ry * 0.38;
  const eyeR = (infant ? 1.25 : 1) * k;
  const pupil = p.pupils === 'miotiche' ? 0.9 : p.pupils === 'midriatiche' ? 2.4 : 1.6;
  const mx = c.x + 25 * k;
  const droop = p.stroke?.face;
  const mouthOpen = p.speech === 'assente' && p.avpu === 'U';
  return (
    <g pointerEvents="none">
      {/* sopracciglia */}
      {!infant && (
        <>
          <path d={`M${c.x - 6 * k} ${c.y - eyeDy - 7 * k} q ${-4 * k} ${-4 * k} ${-1 * k} ${-10 * k}`} stroke={brow} strokeWidth={2.6 * k} fill="none" strokeLinecap="round" />
          <path d={`M${c.x - 6 * k} ${c.y + eyeDy + 7 * k} q ${-4 * k} ${4 * k} ${-1 * k} ${10 * k}`} stroke={brow} strokeWidth={2.6 * k} fill="none" strokeLinecap="round" />
        </>
      )}
      {/* occhi */}
      {[-1, 1].map((sd) => {
        const ey = c.y + sd * eyeDy;
        return open ? (
          <g key={sd}>
            <ellipse cx={eyeX} cy={ey} rx={4.4 * eyeR} ry={6.4 * eyeR} fill="#f6f2ec" stroke={lid} strokeWidth={0.9 * k} />
            <circle cx={eyeX + 0.8 * k + (p.seizing ? -1.5 * k : 0)} cy={ey} r={3.3 * eyeR} fill={p.seizing ? '#5b4636' : '#4a3626'} />
            <circle cx={eyeX + 0.8 * k + (p.seizing ? -1.5 * k : 0)} cy={ey} r={pupil * eyeR * (sd === 1 && p.pupils === 'anisocoriche' ? 1.6 : 1)} fill="#120c08" />
            <circle cx={eyeX - 0.6 * k} cy={ey - 1.4 * k} r={0.9 * k} fill="#fff" opacity="0.9" />
            <path d={`M${eyeX - 3.6 * eyeR} ${ey - 5.6 * eyeR} q ${-2 * k} ${5.6 * eyeR} 0 ${11.2 * eyeR}`} stroke={lid} strokeWidth={1.4 * k} fill="none" />
          </g>
        ) : (
          <path key={sd} d={`M${eyeX - 1 * k} ${ey - 5.5 * eyeR} q ${4.5 * k} ${5.5 * eyeR} 0 ${11 * eyeR}`} stroke={lid} strokeWidth={1.8 * k} fill="none" strokeLinecap="round" />
        );
      })}
      {/* naso */}
      <ellipse cx={c.x + 15 * k} cy={c.y} rx={(infant ? 4 : 6.5) * k} ry={(infant ? 3.4 : 4.6) * k} fill={shade(skin, 0.05)} />
      <path d={`M${c.x + 19 * k} ${c.y - 3.4 * k} q ${3 * k} ${3.4 * k} 0 ${6.8 * k}`} stroke={shade(skin, -0.28)} strokeWidth={1.4 * k} fill="none" strokeLinecap="round" />
      <ellipse cx={c.x + 12 * k} cy={c.y - 1.2 * k} rx={2 * k} ry={1.4 * k} fill={shade(skin, 0.25)} opacity="0.7" />
      {/* guance */}
      {infant && (
        <>
          <ellipse cx={c.x + 14 * k} cy={c.y - ry * 0.55} rx={5 * k} ry={4 * k} fill="#ff8f8f" opacity="0.28" />
          <ellipse cx={c.x + 14 * k} cy={c.y + ry * 0.55} rx={5 * k} ry={4 * k} fill="#ff8f8f" opacity="0.28" />
        </>
      )}
      {/* bocca */}
      {mouthOpen ? (
        <ellipse cx={mx} cy={c.y} rx={3.6 * k} ry={6.4 * k} fill="#3a1c1c" stroke={lips} strokeWidth={2 * k} />
      ) : droop ? (
        <path d={`M${mx - 1 * k} ${c.y - 8 * k} q ${4 * k} ${8 * k} ${7 * k} ${15 * k}`} stroke={lips} strokeWidth={2.8 * k} fill="none" strokeLinecap="round" />
      ) : p.speech === 'pianto' ? (
        <ellipse cx={mx} cy={c.y} rx={4.5 * k} ry={6 * k} fill="#5a2424" stroke={lips} strokeWidth={1.8 * k} />
      ) : (
        <path
          d={p.v.spo2 < 85 || p.airway === 'ostruzione_completa' ? `M${mx - 2 * k} ${c.y - 7 * k} q ${7 * k} ${7 * k} 0 ${14 * k}` : `M${mx} ${c.y - 7 * k} q ${3 * k} ${7 * k} 0 ${14 * k}`}
          stroke={lips}
          strokeWidth={2.8 * k}
          fill="none"
          strokeLinecap="round"
        />
      )}
      {/* sudore */}
      {p.skin.sweaty && (
        <g fill="#d5ecff" opacity="0.9">
          {[
            [-16, -8],
            [-14, 9],
            [-8, -22],
            [-6, 20],
          ].map(([dx, dy], i) => (
            <path key={i} d={`M${c.x + dx * k} ${c.y + dy * k} q ${2 * k} ${-4 * k} ${3 * k} 0 q ${-1 * k} ${3 * k} ${-3 * k} 0z`} />
          ))}
        </g>
      )}
    </g>
  );
}

// ───────────────────────── capelli
function Hair({ p, c, rx, ry, prone }: { p: Patient; c: Pt; rx: number; ry: number; prone: boolean }) {
  const h = p.look.hair;
  const hi = shade(h, 0.22);
  const st = p.look.hairStyle;
  if (prone) {
    return (
      <g pointerEvents="none">
        {st === 'lunghi' && <path d={`M${c.x - rx * 0.4} ${c.y - ry} Q ${c.x + rx * 1.6} ${c.y - ry * 1.6} ${c.x + rx * 1.9} ${c.y} Q ${c.x + rx * 1.6} ${c.y + ry * 1.6} ${c.x - rx * 0.4} ${c.y + ry} Z`} fill={shade(h, -0.08)} />}
        <ellipse cx={c.x} cy={c.y} rx={rx * 1.02} ry={ry * 1.04} fill={h} />
        <path d={`M${c.x - rx * 0.6} ${c.y - ry * 0.3} q ${rx * 0.6} ${-ry * 0.4} ${rx * 1.2} ${ry * 0.1}`} stroke={hi} strokeWidth="2" fill="none" opacity="0.6" />
        <circle cx={c.x - rx * 0.1} cy={c.y} r={3} fill={shade(h, -0.25)} />
      </g>
    );
  }
  const cap = `M${c.x - rx * 0.05} ${c.y - ry * 1.02} Q ${c.x - rx * 1.22} ${c.y - ry * 1.05} ${c.x - rx * 1.12} ${c.y} Q ${c.x - rx * 1.22} ${c.y + ry * 1.05} ${c.x - rx * 0.05} ${c.y + ry * 1.02} Q ${c.x - rx * 0.5} ${c.y + ry * 0.6} ${c.x - rx * 0.42} ${c.y + ry * 0.2} Q ${c.x - rx * 0.28} ${c.y} ${c.x - rx * 0.42} ${c.y - ry * 0.2} Q ${c.x - rx * 0.5} ${c.y - ry * 0.6} ${c.x - rx * 0.05} ${c.y - ry * 1.02} Z`;
  switch (st) {
    case 'calvo':
      return (
        <g pointerEvents="none" opacity="0.85">
          <path d={`M${c.x - rx * 0.55} ${c.y - ry * 0.95} q ${-rx * 0.4} ${ry * 0.2} ${-rx * 0.5} ${ry * 0.55}`} stroke={h} strokeWidth={5} fill="none" strokeLinecap="round" />
          <path d={`M${c.x - rx * 0.55} ${c.y + ry * 0.95} q ${-rx * 0.4} ${-ry * 0.2} ${-rx * 0.5} ${-ry * 0.55}`} stroke={h} strokeWidth={5} fill="none" strokeLinecap="round" />
        </g>
      );
    case 'lunghi':
      return (
        <g pointerEvents="none">
          <path d={`M${c.x - rx * 0.2} ${c.y - ry * 1.05} C ${c.x - rx * 1.8} ${c.y - ry * 1.9}, ${c.x - rx * 2.5} ${c.y - ry * 0.6}, ${c.x - rx * 2.2} ${c.y} C ${c.x - rx * 2.5} ${c.y + ry * 0.6}, ${c.x - rx * 1.8} ${c.y + ry * 1.9}, ${c.x - rx * 0.2} ${c.y + ry * 1.05} Z`} fill={shade(h, -0.08)} />
          {[-0.6, -0.2, 0.2, 0.6].map((t) => (
            <path key={t} d={`M${c.x - rx * 0.9} ${c.y + ry * t} Q ${c.x - rx * 1.6} ${c.y + ry * t * 1.6} ${c.x - rx * 2.05} ${c.y + ry * t * 1.2}`} stroke={hi} strokeWidth="1.5" fill="none" opacity="0.45" />
          ))}
          <path d={cap} fill={h} />
        </g>
      );
    case 'raccolti':
      return (
        <g pointerEvents="none">
          <circle cx={c.x - rx * 1.25} cy={c.y} r={ry * 0.48} fill={shade(h, -0.05)} />
          <path d={cap} fill={h} />
          <path d={`M${c.x - rx * 0.9} ${c.y - ry * 0.5} q ${-rx * 0.2} ${ry * 0.5} 0 ${ry}`} stroke={hi} strokeWidth="1.6" fill="none" opacity="0.5" />
        </g>
      );
    case 'bimbo':
      return (
        <g pointerEvents="none">
          <path d={`M${c.x - rx * 0.5} ${c.y - ry * 0.85} Q ${c.x - rx * 1.12} ${c.y} ${c.x - rx * 0.5} ${c.y + ry * 0.85} Q ${c.x - rx * 0.62} ${c.y} ${c.x - rx * 0.5} ${c.y - ry * 0.85} Z`} fill={h} opacity="0.9" />
          <path d={`M${c.x - rx * 0.55} ${c.y - ry * 0.2} q ${rx * 0.25} ${ry * 0.1} ${rx * 0.18} ${ry * 0.35}`} stroke={h} strokeWidth="2" fill="none" />
        </g>
      );
    default:
      return (
        <g pointerEvents="none">
          <path d={cap} fill={h} />
          <path d={`M${c.x - rx * 0.95} ${c.y - ry * 0.6} q ${-rx * 0.15} ${ry * 0.6} 0 ${ry * 1.2}`} stroke={hi} strokeWidth="1.8" fill="none" opacity="0.55" />
        </g>
      );
  }
}

// ───────────────────────── arti
type Seg = [Pt, Pt, number, number];

/** Segmenti uniti con un solo contorno continuo: prima il bordo, poi il riempimento. */
function Segs({ segs, fill, edge }: { segs: Seg[]; fill: string; edge: string }) {
  return (
    <g>
      {segs.map(([a, b, ra, rb], i) => (
        <path key={`e${i}`} d={capsule(a, b, ra + 1.3, rb + 1.3)} fill={edge} opacity="0.55" />
      ))}
      {segs.map(([a, b, ra, rb], i) => (
        <path key={`f${i}`} d={capsule(a, b, ra, rb)} fill={fill} />
      ))}
    </g>
  );
}

const lerp = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

function ArmShape({ l, skin, sleeve, sleeves, gid, side }: { l: Limb; skin: string; sleeve: string | null; sleeves: 'corte' | 'lunghe'; gid: string; side: -1 | 1 }) {
  const hand = l.tip;
  const skinSegs: Seg[] = [
    [l.root, l.mid, l.w[0], l.w[1]],
    [l.mid, l.end, l.w[1], l.w[2]],
  ];
  const sleeveSegs: Seg[] =
    sleeves === 'lunghe'
      ? [
          [l.root, l.mid, l.w[0] + 2, l.w[1] + 1.8],
          [l.mid, lerp(l.mid, l.end, 0.92), l.w[1] + 1.8, l.w[2] + 2],
        ]
      : [[l.root, lerp(l.root, l.mid, 0.55), l.w[0] + 2.2, l.w[0] * 0.9 + 2]];
  return (
    <g>
      <Segs segs={skinSegs} fill={`url(#${gid}-skin)`} edge={ink(skin)} />
      {/* mano: palmo, pollice, dita */}
      <ellipse cx={hand.x} cy={hand.y} rx={l.w[2] * 1.75 + 1.3} ry={l.w[2] * 1.2 + 1.3} fill={ink(skin)} opacity="0.55" />
      <ellipse cx={hand.x} cy={hand.y} rx={l.w[2] * 1.75} ry={l.w[2] * 1.2} fill={`url(#${gid}-skin)`} />
      <ellipse cx={hand.x - l.w[2] * 0.6} cy={hand.y - side * l.w[2] * 1.05} rx={l.w[2] * 0.78} ry={l.w[2] * 0.44} fill={shade(skin, -0.03)} stroke={ink(skin)} strokeWidth="0.9" strokeOpacity="0.35" transform={`rotate(${side * 30} ${hand.x - l.w[2] * 0.6} ${hand.y - side * l.w[2] * 1.05})`} />
      {[-0.5, 0, 0.5].map((t) => (
        <line key={t} x1={hand.x + l.w[2] * 0.75} y1={hand.y + t * l.w[2] * 0.9} x2={hand.x + l.w[2] * 1.6} y2={hand.y + t * l.w[2] * 0.95} stroke={ink(skin)} strokeWidth="0.8" strokeOpacity="0.35" />
      ))}
      {sleeve && <Segs segs={sleeveSegs} fill={`url(#${gid}-shirt)`} edge={ink(sleeve)} />}
      {sleeve && sleeves === 'lunghe' && (
        <path d={`M${lerp(l.mid, l.end, 0.92).x} ${lerp(l.mid, l.end, 0.92).y - l.w[2] - 2} l 0 ${(l.w[2] + 2) * 2}`} stroke={shade(sleeve, -0.3)} strokeWidth="1.4" />
      )}
    </g>
  );
}

function LegShape({ l, skin, pants, shorts, skirt, shoe, gid, infant }: { l: Limb; skin: string; pants: string; shorts: boolean; skirt?: boolean; shoe: string; gid: string; infant: boolean }) {
  const cover = skirt ? 0.82 : 0.55;
  const coverEnd = lerp(l.root, l.mid, cover);
  const sideOut = l.root.y < 300 ? -1 : 1;
  const legSegs: Seg[] = [
    [l.root, l.mid, l.w[0], l.w[1]],
    [l.mid, l.end, l.w[1], l.w[2]],
  ];
  const bare = shorts || skirt || infant;
  return (
    <g>
      <Segs segs={legSegs} fill={`url(#${gid}-${bare ? 'skin' : 'pants'})`} edge={ink(bare ? skin : pants)} />
      {(shorts || skirt) && (
        <Segs
          segs={[[{ x: l.root.x, y: skirt ? 300 + (l.root.y - 300) * 0.5 : l.root.y }, { x: coverEnd.x, y: skirt ? 300 + (coverEnd.y - 300) * 1.25 : coverEnd.y }, l.w[0] + (skirt ? 8 : 2), l.w[0] * 0.95 + (skirt ? 9 : 2)]]}
          fill={`url(#${gid}-pants)`}
          edge={ink(pants)}
        />
      )}
      {infant && <Segs segs={[[l.root, lerp(l.root, l.mid, 0.6), l.w[0] + 1.5, l.w[0] + 0.5]]} fill={`url(#${gid}-shirt)`} edge={ink(pants)} />}
      {!bare && <path d={`M${l.mid.x - 6} ${l.mid.y - l.w[1] * 0.55} q 6 ${l.w[1] * 0.55} 0 ${l.w[1] * 1.1}`} stroke={shade(pants, -0.3)} strokeWidth="1.2" fill="none" opacity="0.55" />}
      {/* piede: punta rivolta verso l'alto e leggermente verso l'esterno */}
      {infant ? (
        <g>
          <ellipse cx={l.tip.x} cy={l.tip.y + sideOut * 2} rx={l.w[2] * 1.05 + 1.2} ry={l.w[2] * 1.35 + 1.2} fill={ink(skin)} opacity="0.5" />
          <ellipse cx={l.tip.x} cy={l.tip.y + sideOut * 2} rx={l.w[2] * 1.05} ry={l.w[2] * 1.35} fill={`url(#${gid}-skin)`} />
        </g>
      ) : (
        <g transform={`rotate(${sideOut * 14} ${l.tip.x} ${l.tip.y})`}>
          <rect x={l.tip.x - l.w[2] * 0.95} y={l.tip.y - l.w[2] * 1.65} width={l.w[2] * 1.9} height={l.w[2] * 3.3} rx={l.w[2] * 0.95} fill={shoe} stroke={shade(shoe, -0.45)} strokeWidth="1.2" />
          <rect x={l.tip.x - l.w[2] * 0.55} y={l.tip.y - l.w[2] * 1.2} width={l.w[2] * 1.1} height={l.w[2] * 1.5} rx={l.w[2] * 0.5} fill={shade(shoe, 0.18)} opacity="0.7" />
        </g>
      )}
    </g>
  );
}

function torsoPath(g: BodyGeo, extra = 0): string {
  const { x0, x1, hwTop, hwWaist } = g.torso;
  const t = hwTop + extra;
  const w = hwWaist + extra;
  return `M${x0 + 8} ${300 - t} Q ${x0 - 6} ${300 - t} ${x0 - 4} ${300 - t + 16} L ${x0 - 4} ${300 + t - 16} Q ${x0 - 6} ${300 + t} ${x0 + 8} ${300 + t} L ${x1} ${300 + w} L ${x1} ${300 - w} Z`;
}

// ───────────────────────── posizioni
function Supine({ s, g, gid, prone }: { s: PatientArtState; g: BodyGeo; gid: string; prone: boolean }) {
  const { p, hoverRegion: hv } = s;
  const lk = p.look;
  const skin = skinFor(p);
  const shirtC = lk.top === 'nudo' ? skin : lk.shirt;
  const infant = lk.build === 'neonato';
  const top = lk.top ?? (infant ? 'body' : 'tshirt');
  const sleeves = lk.sleeves ?? (top === 'tshirt' || top === 'body' ? 'corte' : 'lunghe');
  const shoe = lk.shoes ?? '#2a2d33';
  const breathing = !s.arrest && p.breathing !== 'assente' && s.breathingRate > 0;
  const torsoClass = s.cprActive ? 'torso cpr-anim' : breathing ? 'torso breath-anim' : 'torso';
  const torsoStyle = breathing && !s.cprActive ? { animationDuration: `${Math.max(1.2, 60 / Math.max(4, s.breathingRate))}s` } : undefined;
  const seize = p.seizing ? ' seizure' : '';
  const mottled = p.skin.color === 'marezzata' || p.skin.color === 'grigiastra';
  const { x0, x1 } = g.torso;
  const pel = g.pelvis;
  const sleeveColor = top === 'nudo' ? null : shirtC;
  return (
    <g>
      <ellipse cx={(g.head.c.x + g.legL.tip.x) / 2} cy={312} rx={(g.legL.tip.x - g.head.c.x) / 2 + 30} ry={g.torso.hwTop + 26} fill="#000" opacity="0.3" filter="url(#sfoca)" />
      {/* gambe */}
      <g className={`limb${seize}`}>
        <Hit region="gamba_sx" hover={hv === 'gamba_sx'} s={s}>
          <LegShape l={g.legL} skin={skin} pants={lk.pants} shorts={lk.bottom === 'shorts'} skirt={lk.bottom === 'gonna'} shoe={shoe} gid={gid} infant={infant} />
        </Hit>
        <Hit region="gamba_dx" hover={hv === 'gamba_dx'} s={s}>
          <LegShape l={g.legR} skin={skin} pants={lk.pants} shorts={lk.bottom === 'shorts'} skirt={lk.bottom === 'gonna'} shoe={shoe} gid={gid} infant={infant} />
        </Hit>
      </g>
      {/* bacino */}
      <Hit region="bacino" hover={hv === 'bacino'} s={s}>
        <path d={`M${pel.x0} ${300 - pel.hw} L${pel.x1 - 10} ${300 - pel.hw + 6} Q ${pel.x1 + 4} ${300} ${pel.x1 - 10} ${300 + pel.hw - 6} L${pel.x0} ${300 + pel.hw} Z`} fill={`url(#${gid}-${top === 'body' ? 'shirt' : 'pants'})`} stroke={ink(lk.pants)} strokeWidth="1.2" strokeOpacity="0.4" />
      </Hit>
      {top !== 'body' && !infant && lk.bottom !== 'gonna' && <rect x={pel.x0 + 1} y={300 - pel.hw + 1} width="7" height={pel.hw * 2 - 2} rx="2" fill={shade(lk.pants, -0.38)} pointerEvents="none" />}
      {/* braccia */}
      <g className={`limb${seize}`}>
        <Hit region="braccio_sx" hover={hv === 'braccio_sx'} s={s}>
          <ArmShape l={g.armL} skin={skin} sleeve={sleeveColor} sleeves={sleeves} gid={gid} side={-1} />
        </Hit>
        <Hit region="braccio_dx" hover={hv === 'braccio_dx'} s={s}>
          <ArmShape l={g.armR} skin={skin} sleeve={sleeveColor} sleeves={sleeves} gid={gid} side={1} />
        </Hit>
      </g>
      {mottled && (
        <g opacity="0.3" pointerEvents="none">
          {[g.armL.mid, g.armR.end, g.legL.mid, g.legR.end, g.legR.mid].map((pt, i) => (
            <circle key={i} cx={pt.x + 6} cy={pt.y} r={5 * g.s + 2} fill="#6a5a7c" />
          ))}
        </g>
      )}
      {/* tronco */}
      <g className={torsoClass} style={torsoStyle}>
        <Hit region="torace" hover={hv === 'torace'} s={s}>
          <path d={torsoPath(g)} fill={`url(#${gid}-shirt)`} stroke={ink(shirtC)} strokeWidth="1.3" strokeOpacity="0.45" />
        </Hit>
        <Hit region="addome" hover={hv === 'addome'} s={s}>
          <rect x={x0 + (x1 - x0) * 0.62} y={300 - g.torso.hwWaist - 2} width={(x1 - x0) * 0.38} height={(g.torso.hwWaist + 2) * 2} fill="transparent" />
        </Hit>
        <g pointerEvents="none">
          {top === 'nudo' && !prone && (
            <>
              <circle cx={x0 + (x1 - x0) * 0.3} cy={300 - g.torso.hwTop * 0.45} r={2.2 * g.s} fill={shade(skin, -0.3)} />
              <circle cx={x0 + (x1 - x0) * 0.3} cy={300 + g.torso.hwTop * 0.45} r={2.2 * g.s} fill={shade(skin, -0.3)} />
              <ellipse cx={x0 + (x1 - x0) * 0.82} cy={300} rx={2.2 * g.s} ry={1.6 * g.s} fill={shade(skin, -0.35)} />
              <path d={`M${x0 + (x1 - x0) * 0.42} ${300 - g.torso.hwTop * 0.7} q ${(x1 - x0) * 0.1} ${g.torso.hwTop * 0.7} 0 ${g.torso.hwTop * 1.4}`} stroke={shade(skin, -0.18)} strokeWidth="1.2" fill="none" opacity="0.6" />
            </>
          )}
          {!prone && top === 'camicia' && (
            <>
              <line x1={x0 + 4} y1={300} x2={x1} y2={300} stroke={shade(shirtC, -0.3)} strokeWidth="1.4" />
              {[0.25, 0.45, 0.65, 0.85].map((t) => (
                <circle key={t} cx={x0 + (x1 - x0) * t} cy={303} r={1.8} fill={shade(shirtC, 0.4)} stroke={shade(shirtC, -0.3)} strokeWidth="0.6" />
              ))}
            </>
          )}
          {!prone && top === 'felpa' && (
            <>
              <rect x={x0 + (x1 - x0) * 0.62} y={300 - g.torso.hwWaist * 0.62} width={(x1 - x0) * 0.26} height={g.torso.hwWaist * 1.24} rx="8" fill={shade(shirtC, -0.12)} stroke={shade(shirtC, -0.3)} strokeWidth="1" />
              <line x1={x0 + 14} y1={300 - 8} x2={x0 + 40} y2={300 - 10} stroke={shade(shirtC, 0.5)} strokeWidth="1.6" />
              <line x1={x0 + 14} y1={300 + 8} x2={x0 + 40} y2={300 + 10} stroke={shade(shirtC, 0.5)} strokeWidth="1.6" />
            </>
          )}
          {!prone && top === 'giacca' && (
            <>
              <line x1={x0 + 4} y1={300} x2={x1} y2={300} stroke={shade(shirtC, -0.4)} strokeWidth="2" />
              <rect x={x0 + (x1 - x0) * 0.35} y={300 - g.torso.hwTop + 6} width={(x1 - x0) * 0.08} height={g.torso.hwTop * 2 - 12} fill="#d8dde3" opacity="0.6" />
            </>
          )}
          {!prone && top === 'body' && (
            <>
              {[0.82, 0.9].map((t) => (
                <circle key={t} cx={x0 + (x1 - x0) * t} cy={300} r={1.4} fill={shade(shirtC, -0.3)} />
              ))}
            </>
          )}
          {!prone && top === 'tshirt' && <path d={`M${x0 + 2} ${300 - g.neck.hw - 4} Q ${x0 + 16} ${300} ${x0 + 2} ${300 + g.neck.hw + 4}`} stroke={shade(shirtC, -0.3)} strokeWidth="1.6" fill="none" />}
          {/* pieghe del tessuto */}
          {top !== 'nudo' && (
            <>
              <path d={`M${x0 + (x1 - x0) * 0.55} ${300 - g.torso.hwTop * 0.8} q 10 8 4 18`} stroke={shade(shirtC, -0.2)} strokeWidth="1.1" fill="none" opacity="0.6" />
              <path d={`M${x0 + (x1 - x0) * 0.7} ${300 + g.torso.hwTop * 0.75} q 8 -8 2 -16`} stroke={shade(shirtC, -0.2)} strokeWidth="1.1" fill="none" opacity="0.6" />
            </>
          )}
        </g>
      </g>
      {/* collo */}
      <Hit region="collo" hover={hv === 'collo'} s={s}>
        <g>
          <path d={capsule({ x: g.neck.x0, y: 300 }, { x: g.neck.x1, y: 300 }, g.neck.hw, g.neck.hw * 1.05)} fill={`url(#${gid}-skin)`} stroke={ink(skin)} strokeWidth="1.1" strokeOpacity="0.3" />
          <ellipse cx={g.neck.x0 + 4} cy={300} rx={5 * g.s} ry={g.neck.hw * 0.8} fill={shade(skin, -0.25)} opacity="0.35" />
        </g>
      </Hit>
      {/* testa */}
      <Hit region="testa" hover={hv === 'testa'} s={s}>
        <g>
          {!prone && lk.hairStyle === 'lunghi' && <Hair p={p} c={g.head.c} rx={g.head.rx} ry={g.head.ry} prone={false} />}
          <ellipse cx={g.head.c.x - g.head.rx * 0.05} cy={g.head.c.y - g.head.ry * 0.98} rx={g.head.rx * 0.18} ry={g.head.ry * 0.16} fill={shade(skin, -0.12)} />
          <ellipse cx={g.head.c.x - g.head.rx * 0.05} cy={g.head.c.y + g.head.ry * 0.98} rx={g.head.rx * 0.18} ry={g.head.ry * 0.16} fill={shade(skin, -0.12)} />
          <ellipse cx={g.head.c.x} cy={g.head.c.y} rx={g.head.rx} ry={g.head.ry} fill={`url(#${gid}-skin)`} stroke={ink(skin)} strokeWidth="1.3" strokeOpacity="0.4" />
          {prone ? (
            <Hair p={p} c={g.head.c} rx={g.head.rx} ry={g.head.ry} prone />
          ) : (
            <>
              {lk.hairStyle !== 'lunghi' && <Hair p={p} c={g.head.c} rx={g.head.rx} ry={g.head.ry} prone={false} />}
              {lk.hairStyle === 'lunghi' && (
                <path d={`M${g.head.c.x - g.head.rx * 0.05} ${g.head.c.y - g.head.ry * 1.02} Q ${g.head.c.x - g.head.rx * 1.2} ${g.head.c.y - g.head.ry} ${g.head.c.x - g.head.rx * 1.1} ${g.head.c.y} Q ${g.head.c.x - g.head.rx * 1.2} ${g.head.c.y + g.head.ry} ${g.head.c.x - g.head.rx * 0.05} ${g.head.c.y + g.head.ry * 1.02} Q ${g.head.c.x - g.head.rx * 0.65} ${g.head.c.y} ${g.head.c.x - g.head.rx * 0.05} ${g.head.c.y - g.head.ry * 1.02} Z`} fill={lk.hair} pointerEvents="none" />
              )}
              <Face p={p} skin={skin} c={g.head.c} rx={g.head.rx} ry={g.head.ry} />
            </>
          )}
        </g>
      </Hit>
    </g>
  );
}

/** Posizione laterale di sicurezza vista dall'alto (adulto; scalata per i bambini). */
function Lateral({ s, gid }: { s: PatientArtState; gid: string }) {
  const { p, hoverRegion: hv } = s;
  const lk = p.look;
  const skin = skinFor(p);
  const shirtC = lk.top === 'nudo' ? skin : lk.shirt;
  const shoe = lk.shoes ?? '#2a2d33';
  return (
    <g>
      <ellipse cx="450" cy="312" rx="270" ry="80" fill="#000" opacity="0.3" filter="url(#sfoca)" />
      {/* gamba sotto, distesa */}
      <Hit region="gamba_dx" hover={hv === 'gamba_dx'} s={s}>
        <g>
          <path d={capsule({ x: 488, y: 296 }, { x: 600, y: 292 }, 20, 15)} fill={`url(#${gid}-pants)`} stroke={ink(lk.pants)} strokeOpacity="0.4" />
          <path d={capsule({ x: 600, y: 292 }, { x: 690, y: 290 }, 15, 11)} fill={`url(#${gid}-pants)`} stroke={ink(lk.pants)} strokeOpacity="0.4" />
          <rect x="690" y="278" width="34" height="22" rx="10" fill={shoe} />
        </g>
      </Hit>
      {/* gamba sopra, flessa in avanti */}
      <Hit region="gamba_sx" hover={hv === 'gamba_sx'} s={s}>
        <g>
          <path d={capsule({ x: 490, y: 318 }, { x: 566, y: 372 }, 21, 16)} fill={`url(#${gid}-pants)`} stroke={ink(lk.pants)} strokeOpacity="0.4" />
          <path d={capsule({ x: 566, y: 372 }, { x: 650, y: 362 }, 16, 12)} fill={`url(#${gid}-pants)`} stroke={ink(lk.pants)} strokeOpacity="0.4" />
          <rect x="648" y="350" width="34" height="22" rx="10" fill={shoe} />
        </g>
      </Hit>
      <Hit region="bacino" hover={hv === 'bacino'} s={s}>
        <path d="M430 264 Q 470 254 500 268 Q 512 304 498 336 Q 466 350 430 342 Z" fill={`url(#${gid}-pants)`} stroke={ink(lk.pants)} strokeOpacity="0.4" />
      </Hit>
      {/* braccio sotto, in avanti */}
      <Hit region="braccio_dx" hover={hv === 'braccio_dx'} s={s}>
        <g>
          <path d={capsule({ x: 312, y: 330 }, { x: 352, y: 382 }, 13, 10)} fill={`url(#${gid}-shirt)`} stroke={ink(shirtC)} strokeOpacity="0.4" />
          <path d={capsule({ x: 352, y: 382 }, { x: 412, y: 394 }, 10, 8)} fill={`url(#${gid}-skin)`} stroke={ink(skin)} strokeOpacity="0.35" />
          <ellipse cx="426" cy="396" rx="14" ry="10" fill={`url(#${gid}-skin)`} />
        </g>
      </Hit>
      <Hit region="torace" hover={hv === 'torace'} s={s}>
        <path d="M288 270 Q 300 254 332 256 L 436 264 Q 448 300 436 338 L 332 346 Q 296 348 288 332 Z" fill={`url(#${gid}-shirt)`} stroke={ink(shirtC)} strokeOpacity="0.45" />
      </Hit>
      {/* braccio sopra: mano sotto la guancia */}
      <Hit region="braccio_sx" hover={hv === 'braccio_sx'} s={s}>
        <g>
          <path d={capsule({ x: 334, y: 282 }, { x: 304, y: 340 }, 13, 10)} fill={`url(#${gid}-shirt)`} stroke={ink(shirtC)} strokeOpacity="0.45" />
          <path d={capsule({ x: 304, y: 340 }, { x: 266, y: 344 }, 10, 8)} fill={`url(#${gid}-skin)`} stroke={ink(skin)} strokeOpacity="0.35" />
          <ellipse cx="254" cy="342" rx="13" ry="10" fill={`url(#${gid}-skin)`} stroke={ink(skin)} strokeOpacity="0.35" />
        </g>
      </Hit>
      <Hit region="collo" hover={hv === 'collo'} s={s}>
        <path d={capsule({ x: 262, y: 302 }, { x: 292, y: 300 }, 13, 14)} fill={`url(#${gid}-skin)`} />
      </Hit>
      <Hit region="testa" hover={hv === 'testa'} s={s}>
        <g>
          <ellipse cx="232" cy="306" rx="38" ry="31" fill={`url(#${gid}-skin)`} stroke={ink(skin)} strokeOpacity="0.4" />
          <path d={`M206 280 Q 196 306 208 330 Q 236 306 224 280 Z`} fill={lk.hair} />
          {lk.hairStyle === 'lunghi' && <path d="M206 280 Q 150 300 170 350 Q 196 340 208 330 Z" fill={shade(lk.hair, -0.08)} />}
          <ellipse cx="236" cy="290" rx="8" ry="5.5" fill={shade(skin, -0.14)} />
          <path d="M246 312 q 4 3 8 0" stroke={shade(skin, -0.45)} strokeWidth="1.6" fill="none" />
          <path d="M260 322 q 6 2 9 -2" stroke={lipsFor(p, skin)} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <ellipse cx="262" cy="310" rx="5" ry="3.5" fill={shade(skin, 0.05)} />
        </g>
      </Hit>
    </g>
  );
}

/** In piedi visto dall'alto (es. soffocamento): testa, spalle, mani alla gola. */
function Standing({ s, gid }: { s: PatientArtState; gid: string }) {
  const { p, hoverRegion: hv } = s;
  const skin = skinFor(p);
  const lk = p.look;
  return (
    <g>
      <ellipse cx="462" cy="314" rx="96" ry="70" fill="#000" opacity="0.32" filter="url(#sfoca)" />
      <ellipse cx="452" cy="300" rx="20" ry="30" fill={lk.pants} opacity="0.5" transform="translate(16 0)" />
      <Hit region="torace" hover={hv === 'torace'} s={s}>
        <path d="M424 226 Q 470 216 482 240 L 486 360 Q 470 384 424 374 Q 404 300 424 226 Z" fill={`url(#${gid}-shirt)`} stroke={ink(lk.shirt)} strokeOpacity="0.45" />
      </Hit>
      <Hit region="braccio_sx" hover={hv === 'braccio_sx'} s={s}>
        <path d={`${capsule({ x: 448, y: 232 }, { x: 492, y: 258 }, 12, 10)} ${capsule({ x: 492, y: 258 }, { x: 488, y: 290 }, 10, 8)}`} fill={`url(#${gid}-shirt)`} stroke={ink(lk.shirt)} strokeOpacity="0.4" />
      </Hit>
      <Hit region="braccio_dx" hover={hv === 'braccio_dx'} s={s}>
        <path d={`${capsule({ x: 448, y: 368 }, { x: 492, y: 342 }, 12, 10)} ${capsule({ x: 492, y: 342 }, { x: 488, y: 310 }, 10, 8)}`} fill={`url(#${gid}-shirt)`} stroke={ink(lk.shirt)} strokeOpacity="0.4" />
      </Hit>
      <ellipse cx="486" cy="292" rx="11" ry="9" fill={`url(#${gid}-skin)`} stroke={ink(skin)} strokeOpacity="0.4" />
      <ellipse cx="486" cy="308" rx="11" ry="9" fill={`url(#${gid}-skin)`} stroke={ink(skin)} strokeOpacity="0.4" />
      <Hit region="testa" hover={hv === 'testa'} s={s}>
        <g>
          <ellipse cx="478" cy="300" rx="12" ry="20" fill={`url(#${gid}-skin)`} />
          <circle cx="452" cy="300" r="33" fill={lk.hair} stroke={shade(lk.hair, -0.3)} strokeWidth="1.2" />
          <path d="M430 288 q 20 -14 40 0" stroke={shade(lk.hair, 0.25)} strokeWidth="2" fill="none" opacity="0.6" />
          <circle cx="446" cy="300" r="3" fill={shade(lk.hair, -0.3)} />
        </g>
      </Hit>
    </g>
  );
}

export function PatientFigure(s: PatientArtState) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const gid = `pt${uid}`;
  const p = s.p;
  const pos = p.position;
  const b = p.look.build;
  const g = bodyGeometry(b, pos);
  const skin = skinFor(p);
  const shirtC = p.look.top === 'nudo' ? skin : p.look.shirt;
  let fig: ReactNode;
  if (pos === 'laterale') fig = <Lateral s={s} gid={gid} />;
  else if (pos === 'in_piedi') fig = <Standing s={s} gid={gid} />;
  else fig = <Supine s={s} g={g} gid={gid} prone={pos === 'prono'} />;
  // ritocchi di scala per corporature adulte; bambini e lattanti hanno proporzioni proprie
  const sc = b === 'adolescente' ? 0.94 : b === 'robusto' ? 1.04 : pos === 'laterale' && (b === 'bambino' || b === 'neonato') ? (b === 'neonato' ? 0.56 : 0.72) : 1;
  const seated = pos === 'semiseduto' || pos === 'seduto';
  return (
    <g transform={sc !== 1 ? `translate(${450 - 450 * sc} ${300 - 300 * sc}) scale(${sc})` : undefined}>
      <defs>
        <Grad id={`${gid}-skin`} c={skin} />
        <Grad id={`${gid}-shirt`} c={shirtC} />
        <Grad id={`${gid}-pants`} c={p.look.pants} />
      </defs>
      {seated && (
        <g>
          <rect x={g.head.c.x - g.head.rx - 26} y={300 - g.torso.hwTop - 22} width={g.pivotX - g.head.c.x + g.head.rx + 40} height={(g.torso.hwTop + 22) * 2} rx="18" fill="#3f4853" />
          <rect x={g.head.c.x - g.head.rx - 18} y={300 - g.torso.hwTop - 14} width={g.pivotX - g.head.c.x + g.head.rx + 26} height={(g.torso.hwTop + 14) * 2} rx="14" fill="#56616e" />
          <line x1={g.pivotX + 8} y1={300 - g.torso.hwTop - 22} x2={g.pivotX + 8} y2={300 + g.torso.hwTop + 22} stroke="#2b323a" strokeWidth="3" />
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
