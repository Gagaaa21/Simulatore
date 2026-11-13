import type { Sim } from '../../engine/engine';
import type { EquipmentId } from '../../data/equipment';
import { bodyGeometry, capsule, limbWidthAt, pointOnLimb, type BodyGeo, type Pt } from './body';
import { skinFor } from './Patient';
import { shade } from './color';

function geo(sim: Sim): BodyGeo {
  return bodyGeometry(sim.p.look.build, sim.p.position);
}

/** Ancoraggi per la posizione laterale (disegno adulto). */
const LAT = {
  mouth: { x: 264, y: 318 },
  face: { x: 258, y: 312 },
  hand: { x: 254, y: 342 },
};

export function UnderPatient({ sim }: { sim: Sim }) {
  const g = geo(sim);
  const im = sim.immob;
  const b = sim.p.bleeding;
  const loss = sim.p.bloodLossMl;
  const x0 = g.head.c.x - g.head.rx - 30;
  const x1 = g.legL.tip.x + 30;
  const hw = g.torso.hwTop + 34 * g.s;
  const els: JSX.Element[] = [];
  if (sim.cooling?.method === 'immersione') {
    els.push(
      <g key="vasca">
        <rect x={x0 - 14} y={300 - hw - 24} width={x1 - x0 + 28} height={(hw + 24) * 2} rx="44" fill="#cfd8e0" stroke="#9fb0c0" strokeWidth="3" />
        <rect x={x0} y={300 - hw - 10} width={x1 - x0} height={(hw + 10) * 2} rx="34" fill="#2d7fae" opacity="0.88" />
        <path d={`M${x0 + 30} ${300 - hw + 10} q 30 -10 60 0 t 60 0 M${x1 - 200} ${300 + hw - 10} q 30 -10 60 0 t 60 0`} stroke="#bfe9ff" strokeWidth="3" fill="none" opacity="0.6" className="onda" />
      </g>,
    );
  }
  if (sim.cooling?.method === 'taco') {
    els.push(<rect key="taco" x={x0} y={300 - hw} width={x1 - x0} height={hw * 2} rx="26" fill="#2f6fb0" opacity="0.82" stroke="#1f4f80" strokeWidth="3" />);
  }
  if (im.has('materasso')) {
    els.push(
      <g key="mat">
        <rect x={x0} y={300 - hw} width={x1 - x0} height={hw * 2} rx={hw} fill="#d9561a" />
        <rect x={x0 + 14} y={300 - hw + 14} width={x1 - x0 - 28} height={hw * 2 - 28} rx={hw - 14} fill="#f07a35" />
        {Array.from({ length: 10 }).map((_, i) => (
          <circle key={i} cx={x0 + 40 + i * ((x1 - x0 - 80) / 9)} cy={300 - hw + 7} r="3" fill="#9c3a0c" opacity="0.7" />
        ))}
        {Array.from({ length: 10 }).map((_, i) => (
          <circle key={`b${i}`} cx={x0 + 40 + i * ((x1 - x0 - 80) / 9)} cy={300 + hw - 7} r="3" fill="#9c3a0c" opacity="0.7" />
        ))}
      </g>,
    );
  }
  if (im.has('tavola')) {
    els.push(
      <g key="tav">
        <rect x={x0} y={300 - g.torso.hwTop - 14} width={x1 - x0} height={(g.torso.hwTop + 14) * 2} rx="30" fill="#f2c21b" stroke="#c49a10" strokeWidth="4" />
        {[0.15, 0.35, 0.55, 0.75].map((t) => (
          <rect key={t} x={x0 + (x1 - x0) * t} y={300 - g.torso.hwTop - 8} width="18" height="10" rx="3" fill="#1d1f22" />
        ))}
      </g>,
    );
  }
  if (im.has('cucchiaio') && !im.has('materasso')) {
    els.push(
      <g key="cuc" fill="none" strokeLinecap="round">
        <path d={`M${x0 + 10} ${300 - hw + 18} Q ${x0 - 4} 300 ${x0 + 10} ${300 + hw - 18} M${x0 + 10} ${300 - hw + 18} L${x1 - 10} ${300 - hw + 18} M${x0 + 10} ${300 + hw - 18} L${x1 - 10} ${300 + hw - 18} M${x1 - 10} ${300 - hw + 18} Q ${x1 + 6} 300 ${x1 - 10} ${300 + hw - 18}`} stroke="#8a95a1" strokeWidth="11" />
        <path d={`M${x0 + 10} ${300 - hw + 18} L${x1 - 10} ${300 - hw + 18} M${x0 + 10} ${300 + hw - 18} L${x1 - 10} ${300 + hw - 18}`} stroke="#c3cbd3" strokeWidth="4" />
      </g>,
    );
  }
  if (b && loss > 40 && sim.p.position !== 'laterale' && sim.p.position !== 'in_piedi') {
    const pt = pointOnLimb(g, b.region, b.pos);
    const r = Math.min(120, 14 + Math.sqrt(loss) * 2.6) * Math.max(0.6, g.s);
    els.push(
      <g key="sangue">
        <ellipse cx={pt.x + 10} cy={pt.y + pt.side * (r * 0.5)} rx={r * 1.18} ry={r * 0.74} fill="#4f0a11" opacity="0.95" />
        <ellipse cx={pt.x} cy={pt.y + pt.side * (r * 0.42)} rx={r * 0.74} ry={r * 0.44} fill="#6e0f18" opacity="0.85" />
        <ellipse cx={pt.x - r * 0.2} cy={pt.y + pt.side * (r * 0.3)} rx={r * 0.22} ry={r * 0.1} fill="#c84a52" opacity="0.35" />
      </g>,
    );
  }
  return <g pointerEvents="none">{els}</g>;
}

/** Soccorritore inginocchiato visto dall'alto: spalle, testa e bande rifrangenti della divisa. */
function Rescuer({ x, y, facing, uniform }: { x: number; y: number; facing: 'giu' | 'destra'; uniform: 'divisa' | 'civile' }) {
  const body = uniform === 'divisa' ? '#d9461b' : '#6b4f8f';
  const band = '#e9f04a';
  const vertical = facing === 'giu';
  return (
    <g opacity="0.97">
      <ellipse cx={x + 6} cy={y + 8} rx={vertical ? 56 : 36} ry={vertical ? 36 : 56} fill="#000" opacity="0.28" />
      <ellipse cx={x} cy={y} rx={vertical ? 50 : 28} ry={vertical ? 28 : 50} fill={body} stroke={shade(body, -0.4)} strokeWidth="1.5" />
      <ellipse cx={x - (vertical ? 0 : 6)} cy={y - (vertical ? 6 : 0)} rx={vertical ? 42 : 20} ry={vertical ? 18 : 42} fill={shade(body, 0.12)} opacity="0.5" />
      {uniform === 'divisa' &&
        (vertical ? (
          <>
            <rect x={x - 48} y={y - 4} width="96" height="7" fill={band} opacity="0.95" />
            <rect x={x - 48} y={y - 4} width="96" height="2" fill="#ffffff" opacity="0.7" />
          </>
        ) : (
          <>
            <rect x={x - 4} y={y - 48} width="7" height="96" fill={band} opacity="0.95" />
            <rect x={x - 4} y={y - 48} width="2" height="96" fill="#ffffff" opacity="0.7" />
          </>
        ))}
      <circle cx={vertical ? x : x - 6} cy={vertical ? y - 6 : y} r="19" fill={uniform === 'divisa' ? '#2a211b' : '#8a5a33'} stroke="#000" strokeOpacity="0.25" />
      <path d={vertical ? `M${x - 10} ${y - 16} q 10 -6 20 0` : `M${x - 16} ${y - 10} q -6 10 0 20`} stroke="#ffffff" strokeOpacity="0.25" strokeWidth="2" fill="none" />
    </g>
  );
}

/** Mani guantate (nitrile blu) con le braccia del soccorritore. */
function Hands({ x, y, k, from, anim }: { x: number; y: number; k: number; from: number; anim?: string }) {
  return (
    <g className={anim}>
      <path d={capsule({ x: x - 8, y: from }, { x: x - 6, y: y - 16 * k }, 13, 10 * k + 2)} fill="#3d4f6a" />
      <path d={capsule({ x: x + 12, y: from }, { x: x + 8, y: y - 16 * k }, 13, 10 * k + 2)} fill="#34445c" />
      <ellipse cx={x} cy={y} rx={20 * k} ry={24 * k} fill="#4f7fd6" stroke="#2f5cac" strokeWidth="2" />
      <ellipse cx={x + 3 * k} cy={y - 4 * k} rx={16 * k} ry={19 * k} fill="#6a96e6" />
      <path d={`M${x - 10 * k} ${y + 12 * k} q ${10 * k} ${8 * k} ${20 * k} 0`} stroke="#2f5cac" strokeWidth="1.5" fill="none" />
    </g>
  );
}

function Mask({ at, k, color, stroke }: { at: Pt; k: number; color: string; stroke: string }) {
  return (
    <g>
      <ellipse cx={at.x} cy={at.y} rx={19 * k} ry={23 * k} fill={color} opacity="0.55" stroke={stroke} strokeWidth="2" />
      <ellipse cx={at.x - 2 * k} cy={at.y - 4 * k} rx={9 * k} ry={10 * k} fill="#ffffff" opacity="0.25" />
      <path d={`M${at.x - 18 * k} ${at.y - 20 * k} q ${-12 * k} ${20 * k} 0 ${40 * k}`} stroke="#d8e2ea" strokeWidth="1.5" fill="none" opacity="0.8" />
    </g>
  );
}

/** Colore indicativo delle valvole Venturi più diffuse. */
const VENTURI_COLOR: Record<number, string> = { 24: '#3f7fd6', 28: '#f4f4f4', 31: '#f39c3d', 35: '#f2d43b', 40: '#e04848', 50: '#f19ac4', 60: '#43b56b' };

export function OverPatient({ sim, now }: { sim: Sim; now: number }) {
  const p = sim.p;
  const g = geo(sim);
  const k = g.s;
  const pos = p.position;
  const supine = pos === 'supino' || pos === 'semiseduto' || pos === 'seduto' || pos === 'prono';
  const face: Pt = pos === 'laterale' ? LAT.face : { x: g.head.c.x + g.head.rx * 0.5, y: 300 };
  const els: JSX.Element[] = [];
  const skin = skinFor(p);

  if (p.vomitInMouth) {
    const m = pos === 'laterale' ? LAT.mouth : g.mouth;
    els.push(
      <g key="vomito">
        <path d={`M${m.x + 2} ${m.y + 8 * k} q ${18 * k} ${8 * k} ${30 * k} ${30 * k} q ${-20 * k} ${12 * k} ${-36 * k} ${-2 * k} q ${-8 * k} ${-14 * k} ${6 * k} ${-28 * k}z`} fill="#b9a94f" opacity="0.92" />
        <circle cx={m.x + 16 * k} cy={m.y + 26 * k} r={3 * k} fill="#8c7d34" />
      </g>,
    );
  }
  if (supine && sim.covered) {
    const x0 = g.neck.x1 + 4;
    const x1 = g.legL.tip.x + 14;
    const hw = g.torso.hwTop + 6;
    els.push(
      <g key="telo" opacity="0.94">
        <path d={`M${x0} ${300 - hw} L${x1} ${300 - hw * 0.62} L${x1 + 6} ${300 + hw * 0.62} L${x0} ${300 + hw} Z`} fill="url(#oro)" stroke="#a37a1f" strokeWidth="1.5" />
        <path d={`M${x0 + 30} ${300 - hw * 0.6} l 40 ${hw * 0.9} l 50 ${-hw * 0.7} l 60 ${hw * 1.0} l 70 ${-hw * 0.9} l 60 ${hw * 0.8}`} stroke="#fff3c4" strokeWidth="1.5" fill="none" opacity="0.55" />
      </g>,
    );
  }
  if (supine && sim.scenario.exam.extra?.ustione) els.push(<Burn key="ustione" sim={sim} g={g} />);
  if (supine && sim.cooling && sim.cooling.method !== 'immersione') {
    if (sim.cooling.method === 'impacchi' || sim.cooling.method === 'taco') {
      const pts: Pt[] = [
        { x: g.neck.x0 + 6, y: 300 - g.neck.hw - 12 * k },
        { x: g.neck.x0 + 6, y: 300 + g.neck.hw + 12 * k },
        { x: g.armL.root.x + 10, y: g.armL.root.y + 14 * k },
        { x: g.armR.root.x + 10, y: g.armR.root.y - 14 * k },
        { x: g.legL.root.x - 6, y: g.legL.root.y },
        { x: g.legR.root.x - 6, y: g.legR.root.y },
      ];
      els.push(
        <g key="ghiaccio">
          <path d={`M${g.neck.x1} ${300 - g.torso.hwTop} L${g.legL.end.x} ${300 - g.torso.hwTop * 0.7} L${g.legL.end.x} ${300 + g.torso.hwTop * 0.7} L${g.neck.x1} ${300 + g.torso.hwTop} Z`} fill="#7fc4f0" opacity="0.3" />
          {pts.map((pt, i) => (
            <rect key={i} x={pt.x - 12 * k} y={pt.y - 9 * k} width={24 * k} height={18 * k} rx={5 * k} fill="#e9f6ff" stroke="#9cc7e6" strokeWidth="2" />
          ))}
        </g>,
      );
    } else {
      els.push(
        <g key="nebbia" className="nebbia">
          {Array.from({ length: 22 }).map((_, i) => (
            <circle key={i} cx={g.torso.x0 + ((i * 47) % (g.legL.end.x - g.torso.x0))} cy={300 - g.torso.hwTop + ((i * 31) % (g.torso.hwTop * 2))} r={4 + (i % 4)} fill="#d6f0ff" opacity="0.5" />
          ))}
        </g>,
      );
    }
  }
  if (supine && sim.immob.has('pelvica')) {
    const cx = (g.pelvis.x0 + g.pelvis.x1) / 2;
    els.push(
      <g key="pelvica">
        <rect x={cx - 16} y={300 - g.pelvis.hw - 8} width="32" height={(g.pelvis.hw + 8) * 2} rx="7" fill="#1b1d20" stroke="#ff7a1a" strokeWidth="3" />
        <rect x={cx - 8} y={292} width="16" height="16" rx="3" fill="#ff7a1a" />
      </g>,
    );
  }
  // ferita, medicazione, compressione
  const b = p.bleeding;
  if (b && supine) {
    const pt = pointOnLimb(g, b.region, b.pos);
    const w = limbWidthAt(g, b.region, b.pos);
    if (sim.dressing) els.push(<rect key="med" x={pt.x - w - 4} y={pt.y - w - 4} width={(w + 4) * 2} height={(w + 4) * 2} rx="6" fill="#f4f4f2" stroke="#c9c9c4" strokeWidth="2" />);
    else els.push(<path key="ferita" d={`M${pt.x - w * 0.8} ${pt.y - 2} q ${w * 0.8} ${-w * 0.6} ${w * 1.6} 0 q ${-w * 0.8} ${w * 0.6} ${-w * 1.6} 0z`} fill="#7d0b16" stroke="#3d0208" strokeWidth="1.5" />);
    if (sim.pressure && !sim.tourniquet?.ok) {
      els.push(<ellipse key="pressione" cx={pt.x} cy={pt.y - 4} rx={w + 8} ry={w + 4} fill="#4f7fd6" stroke="#2f5cac" strokeWidth="2" />);
    }
  }
  if (sim.tourniquet && supine) {
    const pt = pointOnLimb(g, sim.tourniquet.region, sim.tourniquet.pos);
    const w = limbWidthAt(g, sim.tourniquet.region, sim.tourniquet.pos);
    const ora = sim.clock(sim.tourniquet.at);
    els.push(
      <g key="tq">
        <rect x={pt.x - 8} y={pt.y - w - 5} width="16" height={(w + 5) * 2} rx="4" fill="#15171a" stroke="#000" />
        <rect x={pt.x - 3} y={pt.y - w - 5} width="2" height={(w + 5) * 2} fill="#ff7a1a" opacity="0.8" />
        <rect x={pt.x - 22} y={pt.y + pt.side * (w + 2) - 4} width="44" height="8" rx="3" fill="#2b2f35" />
        <g transform={`translate(${pt.x + 8} ${pt.y + pt.side * (w + 34)})`}>
          <rect x="-4" y="-12" width="70" height="24" rx="4" fill="#d32f2f" stroke="#7f1717" />
          <text x="31" y="5" textAnchor="middle" fontSize="13" fontFamily="var(--f-display)" fontWeight="700" fill="#fff">
            TQ {ora}
          </text>
        </g>
      </g>,
    );
  }
  // frattura esposta: ferita con il moncone, poi garze e telo sterile
  const fr = sim.scenario.lesioni?.frattura;
  if (fr && supine) els.push(<Frattura key="frattura" sim={sim} g={g} />);
  if (supine && sim.immob.has('stecca')) {
    const region = fr?.region ?? 'gamba_dx';
    const a = pointOnLimb(g, region, 0.12);
    const b = pointOnLimb(g, region, 1);
    els.push(
      <g key="stecca">
        <path d={capsule(a, b, limbWidthAt(g, region, 0.12) + 7, limbWidthAt(g, region, 1) + 7)} fill="#f39c3d" opacity="0.85" stroke="#b5631a" strokeWidth="2" />
        {[0.3, 0.55, 0.8].map((t) => {
          const q = pointOnLimb(g, region, t);
          const w = limbWidthAt(g, region, t) + 8;
          return <rect key={t} x={q.x - 4} y={q.y - w} width="8" height={w * 2} rx="2" fill="#2a2d31" opacity="0.75" />;
        })}
      </g>,
    );
  }
  // gravidanza e neonato
  if (p.look.pregnant && supine) els.push(<Pancia key="pancia" sim={sim} g={g} />);
  if (sim.flags.natoAt !== undefined && supine) els.push(<Neonato key="neonato" sim={sim} g={g} />);
  if (supine && sim.immob.has('collare')) {
    const nx = (g.neck.x0 + g.neck.x1) / 2;
    els.push(
      <g key="collare">
        <rect x={nx - 18 * k} y={300 - g.neck.hw - 16 * k} width={36 * k} height={(g.neck.hw + 16 * k) * 2} rx={10 * k} fill="#f0f0ee" stroke="#9ea4aa" strokeWidth="2" />
        <rect x={nx - 7 * k} y={300 - 10 * k} width={14 * k} height={20 * k} rx={4 * k} fill="#ff7a1a" />
        <line x1={nx - 18 * k} y1={300 - g.neck.hw - 4} x2={nx + 18 * k} y2={300 - g.neck.hw - 4} stroke="#c8ccd0" />
      </g>,
    );
  }
  if (p.look.helmet && supine) {
    const c = g.head.c;
    els.push(
      <g key="casco">
        <ellipse cx={c.x - 4} cy={c.y} rx={g.head.rx * 1.35} ry={g.head.ry * 1.42} fill="#1d2430" stroke="#0a0d12" strokeWidth="3" />
        <ellipse cx={c.x - 12} cy={c.y - 10} rx={g.head.rx * 0.8} ry={g.head.ry * 0.7} fill="#ffffff" opacity="0.08" />
        <path d={`M${c.x + 12} ${c.y - g.head.ry * 1.05} Q ${c.x + g.head.rx * 1.45} ${c.y} ${c.x + 12} ${c.y + g.head.ry * 1.05} L ${c.x + 4} ${c.y + g.head.ry * 0.95} Q ${c.x + g.head.rx * 1.1} ${c.y} ${c.x + 4} ${c.y - g.head.ry * 0.95} Z`} fill="#2c4a6e" opacity="0.95" />
        <path d={`M${c.x - g.head.rx * 1.05} ${c.y - 22} Q ${c.x - g.head.rx * 0.9} ${c.y} ${c.x - g.head.rx * 1.05} ${c.y + 22}`} stroke="#c4271f" strokeWidth="7" fill="none" />
      </g>,
    );
  }
  const bvmVisible = (sim.bvm || (sim.cpr.active && sim.cpr.ventilation === 'pallone')) && supine;
  // soccorritore alla testa (ventilazione o stabilizzazione)
  if (supine && (bvmVisible || sim.immob.has('mils'))) {
    els.push(<Rescuer key="testa" x={g.head.c.x - g.head.rx - 80} y={300} facing="destra" uniform={sim.scenario.role === 'laico' ? 'civile' : 'divisa'} />);
  }
  if (sim.immob.has('mils') && supine) {
    const c = g.head.c;
    els.push(
      <g key="mils">
        <path d={capsule({ x: c.x - g.head.rx - 60, y: 270 }, { x: c.x - g.head.rx * 0.5, y: c.y - g.head.ry - 4 }, 12, 9)} fill="#3d4f6a" />
        <path d={capsule({ x: c.x - g.head.rx - 60, y: 330 }, { x: c.x - g.head.rx * 0.5, y: c.y + g.head.ry + 4 }, 12, 9)} fill="#34445c" />
        <ellipse cx={c.x - g.head.rx * 0.3} cy={c.y - g.head.ry - 2} rx={18 * k + 2} ry={12 * k + 2} fill="#4f7fd6" stroke="#2f5cac" strokeWidth="2" />
        <ellipse cx={c.x - g.head.rx * 0.3} cy={c.y + g.head.ry + 2} rx={18 * k + 2} ry={12 * k + 2} fill="#4f7fd6" stroke="#2f5cac" strokeWidth="2" />
      </g>,
    );
  }
  // piastre DAE
  if (sim.aed.pads && supine) {
    const pw = 40 * Math.max(0.7, k);
    const ph = 30 * Math.max(0.7, k);
    const pads =
      sim.aed.pads === 'anteroposteriore'
        ? [
            { c: g.padAP, back: false },
            { c: { x: g.sternum.x, y: 300 - g.torso.hwTop - ph * 0.2 }, back: true },
          ]
        : sim.aed.pads === 'errata'
          ? [
              { c: { x: g.torso.x0 + 40 * k, y: 300 - g.torso.hwTop * 0.55 }, back: false },
              { c: { x: g.torso.x0 + 82 * k, y: 300 - g.torso.hwTop * 0.55 }, back: false },
            ]
          : [
              { c: g.padR, back: false },
              { c: g.padL, back: false },
            ];
    els.push(
      <g key="piastre">
        {pads.map((d, i) => (
          <g key={i} opacity={d.back ? 0.6 : 1}>
            <path d={`M${d.c.x} ${d.c.y + ph / 2} C ${d.c.x - 10} ${d.c.y + 120}, ${g.head.c.x + 10} 470, ${g.head.c.x} 476`} stroke="#d9dde2" strokeWidth="3" fill="none" />
            <rect x={d.c.x - pw / 2} y={d.c.y - ph / 2} width={pw} height={ph} rx="7" fill="#f7f7f5" stroke={d.back ? '#ff7a1a' : '#8f98a2'} strokeWidth="2" strokeDasharray={d.back ? '4 3' : undefined} />
            <rect x={d.c.x - pw / 2 + 4} y={d.c.y - ph / 2 + 4} width={pw - 8} height={ph - 8} rx="5" fill="none" stroke="#dfe3e7" />
            <path d={`M${d.c.x - 2} ${d.c.y - 7} l 6 7 l -5 0 l 4 7`} stroke="#d32f2f" strokeWidth="2" fill="none" />
          </g>
        ))}
      </g>,
    );
  }
  // saturimetro sul dito
  if (sim.pulseOx) {
    const h = pos === 'laterale' ? LAT.hand : pos === 'in_piedi' ? { x: 486, y: 308 } : g.armR.tip;
    els.push(
      <g key="spo2">
        <path d={`M${h.x + 10} ${h.y + 6} C ${h.x + 60} ${h.y + 90}, 820 470, 900 480`} stroke="#9ab0c8" strokeWidth="3" fill="none" />
        <rect x={h.x + 2} y={h.y - 8} width="22" height="16" rx="6" fill="#2f6fd0" stroke="#1b4489" strokeWidth="1.5" />
        <circle cx={h.x + 18} cy={h.y} r="2.6" fill="#ff3d55" className="spo2-led" />
      </g>,
    );
  }
  // ossigeno
  if (sim.o2 && !sim.bvm && pos !== 'in_piedi') {
    if (sim.o2.device === 'occhialini') {
      els.push(
        <g key="o2">
          <path d={`M${face.x - 10 * k} ${face.y - 30 * k} Q ${face.x + 4 * k} ${face.y} ${face.x - 10 * k} ${face.y + 30 * k}`} stroke="#9fe2c4" strokeWidth="3" fill="none" />
          <circle cx={face.x - 4 * k} cy={face.y - 4 * k} r="2.5" fill="#9fe2c4" />
          <circle cx={face.x - 4 * k} cy={face.y + 4 * k} r="2.5" fill="#9fe2c4" />
          <path d={`M${face.x - 10 * k} ${face.y - 30 * k} C 180 200, 140 170, 100 150`} stroke="#9fe2c4" strokeWidth="3" fill="none" />
        </g>,
      );
    } else {
      const res = sim.o2.device === 'reservoir';
      const full = sim.o2.flow >= 10;
      els.push(
        <g key="o2">
          <path d={`M${face.x + 4} ${face.y} C 200 200, 140 170, 100 150`} stroke="#9fe2c4" strokeWidth="3" fill="none" />
          {res && <ellipse cx={face.x + 50 * k} cy={face.y} rx={(full ? 26 : 12) * k} ry={(full ? 18 : 8) * k} fill="#bfe8d6" opacity="0.85" stroke="#7fc9a8" strokeWidth="1.5" />}
          <Mask at={face} k={k} color="#c7f0dc" stroke="#7fc9a8" />
          {sim.o2.device === 'venturi' && (
            <g>
              <rect x={face.x + 14 * k} y={face.y - 6 * k} width={22 * k} height={12 * k} rx={4 * k} fill={VENTURI_COLOR[sim.o2.fio2 ?? 28] ?? '#ffffff'} stroke="#5d6b75" strokeWidth="1.2" />
              <text x={face.x + 25 * k} y={face.y + 22 * k} textAnchor="middle" fontSize={11 * k} fontFamily="var(--f-display)" fontWeight="700" fill="#e9f6ff">
                {sim.o2.fio2}%
              </text>
            </g>
          )}
        </g>,
      );
    }
  }
  // pallone autoespansibile
  if (bvmVisible) {
    const c = g.head.c;
    els.push(
      <g key="bvm">
        <Mask at={face} k={k} color="#cfe6f6" stroke="#7aa6c8" />
        <path d={`M${face.x - 18 * k} ${face.y} L ${c.x - g.head.rx - 6} ${c.y}`} stroke="#7aa6c8" strokeWidth={6 * k} />
        <rect x={c.x - g.head.rx - 92 * k} y={c.y - 15 * k} width={86 * k} height={30 * k} rx={15 * k} fill="#2d6ec9" stroke="#1b4c96" strokeWidth="1.5" className="bvm-anim" />
        <ellipse cx={c.x - g.head.rx - 100 * k} cy={c.y} rx={16 * k} ry={12 * k} fill="#bfe8d6" opacity="0.88" />
        <path d={`M${c.x - g.head.rx - 100 * k} ${c.y} C 130 260, 120 200, 100 150`} stroke="#9fe2c4" strokeWidth="3" fill="none" />
      </g>,
    );
  }
  if (sim.flags.guedel && supine) {
    els.push(<rect key="guedel" x={g.mouth.x - 4 * k} y={g.mouth.y - 6 * k} width={12 * k} height={12 * k} rx={3 * k} fill="#ffd84d" stroke="#b38e12" />);
  }
  // chi comprime e le sue mani
  if (sim.cpr.active && supine) {
    const civ = sim.cpr.by === 'astante' || sim.scenario.role === 'laico';
    const ry = 300 - g.torso.hwTop - 72;
    els.push(<Rescuer key="compressore" x={g.sternum.x} y={ry} facing="giu" uniform={civ ? 'civile' : 'divisa'} />);
    els.push(<Hands key="rcp" x={g.sternum.x} y={300} k={Math.max(0.6, k)} from={ry + 16} anim="cpr-hands" />);
  }
  void now;
  void skin;
  return <g pointerEvents="none">{els}</g>;
}

/** Presidi appoggiati a terra accanto al paziente (cliccabili). */
export const KIT_POS: Partial<Record<EquipmentId, { x: number; y: number }>> = {
  zaino: { x: 110, y: 430 },
  dae: { x: 230, y: 470 },
  ossigeno: { x: 90, y: 150 },
  pallone: { x: 120, y: 240 },
  aspiratore: { x: 70, y: 330 },
  kit_emorragie: { x: 380, y: 480 },
  collari: { x: 150, y: 520 },
  cucchiaio: { x: 600, y: 460 },
  materasso: { x: 760, y: 470 },
  tavola: { x: 760, y: 150 },
  ked: { x: 820, y: 280 },
  steccobende: { x: 520, y: 520 },
  cintura_pelvica: { x: 450, y: 520 },
  sedia: { x: 820, y: 400 },
  kit_ustioni: { x: 300, y: 520 },
  dpi_extra: { x: 40, y: 520 },
  kit_raffreddamento: { x: 680, y: 520 },
  kit_parto: { x: 640, y: 520 },
};

export function KitIcon({ id, onClick, active }: { id: EquipmentId; onClick?: () => void; active?: boolean }) {
  const pos = KIT_POS[id];
  if (!pos) return null;
  const { x, y } = pos;
  let shape: JSX.Element;
  switch (id) {
    case 'zaino':
      shape = (
        <g>
          <rect x="-34" y="-26" width="68" height="52" rx="12" fill="#e2551b" />
          <rect x="-26" y="-18" width="52" height="16" rx="5" fill="#f07a35" />
          <path d="M-8 8 h16 M0 0 v16" stroke="#fff" strokeWidth="5" />
        </g>
      );
      break;
    case 'dae':
      shape = (
        <g>
          <rect x="-30" y="-22" width="60" height="44" rx="10" fill="#d7e22a" />
          <rect x="-20" y="-14" width="26" height="16" rx="3" fill="#1f2a1e" />
          <circle cx="16" cy="6" r="8" fill="#ff7a1a" />
          <path d="M-14 12 l 4 -6 l 3 4 l 4 -7" stroke="#1f2a1e" strokeWidth="2" fill="none" />
        </g>
      );
      break;
    case 'ossigeno':
      shape = (
        <g>
          <rect x="-48" y="-12" width="96" height="24" rx="12" fill="#f2f4f5" />
          <rect x="-48" y="-12" width="28" height="24" rx="12" fill="#2fa36b" />
          <rect x="44" y="-6" width="14" height="12" rx="3" fill="#8a96a3" />
        </g>
      );
      break;
    case 'pallone':
      shape = (
        <g>
          <ellipse cx="-6" cy="0" rx="30" ry="14" fill="#2d6ec9" />
          <ellipse cx="30" cy="0" rx="10" ry="12" fill="#cfe6f6" stroke="#7aa6c8" />
        </g>
      );
      break;
    case 'aspiratore':
      shape = (
        <g>
          <rect x="-24" y="-20" width="48" height="40" rx="8" fill="#e8ecef" />
          <rect x="-14" y="-12" width="16" height="24" rx="4" fill="#9fc6e8" />
          <circle cx="12" cy="0" r="6" fill="#5b6672" />
        </g>
      );
      break;
    case 'kit_emorragie':
      shape = (
        <g>
          <rect x="-26" y="-16" width="52" height="32" rx="6" fill="#1f2328" />
          <rect x="-26" y="-4" width="52" height="8" fill="#d32f2f" />
        </g>
      );
      break;
    case 'cucchiaio':
      shape = <rect x="-90" y="-10" width="180" height="20" rx="10" fill="#9ea8b3" />;
      break;
    case 'materasso':
      shape = <rect x="-70" y="-20" width="140" height="40" rx="18" fill="#f07a35" />;
      break;
    case 'tavola':
      shape = <rect x="-90" y="-16" width="180" height="32" rx="12" fill="#f2c21b" />;
      break;
    case 'collari':
      shape = (
        <g>
          <path d="M-22 0 a 22 14 0 1 0 44 0" stroke="#f0f0ee" strokeWidth="10" fill="none" />
          <rect x="-6" y="4" width="12" height="10" fill="#ff7a1a" />
        </g>
      );
      break;
    case 'kit_parto':
      shape = (
        <g>
          <rect x="-28" y="-18" width="56" height="36" rx="7" fill="#f4f1ec" stroke="#c9c2b6" strokeWidth="2" />
          <rect x="-28" y="-5" width="56" height="10" fill="#e88aa8" />
          <circle cx="0" cy="0" r="7" fill="#fff" stroke="#e88aa8" strokeWidth="2" />
        </g>
      );
      break;
    case 'sedia':
      shape = (
        <g>
          <rect x="-26" y="-30" width="52" height="60" rx="8" fill="#3c4650" />
          <rect x="-20" y="-24" width="40" height="30" rx="5" fill="#d23b2a" />
        </g>
      );
      break;
    default:
      shape = <rect x="-24" y="-16" width="48" height="32" rx="6" fill="#56657a" />;
  }
  return (
    <g
      className={`kit${onClick ? ' kit-click' : ''}${active ? ' kit-active' : ''}`}
      transform={`translate(${x} ${y})`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      <ellipse cx="4" cy="8" rx="44" ry="18" fill="#000" opacity="0.25" />
      {shape}
    </g>
  );
}


/** Contorno irregolare chiuso (macchie, ustioni) attorno a un'ellisse. */
function blob(cx: number, cy: number, rx: number, ry: number, wobble: number[]): string {
  const n = wobble.length;
  const pts = wobble.map((w, i) => {
    const a = (i / n) * Math.PI * 2;
    return { x: cx + Math.cos(a) * rx * w, y: cy + Math.sin(a) * ry * w };
  });
  const mid = (a: Pt, b: Pt) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    const m = mid(a, b);
    d += i === 0 ? `M${mid(pts[n - 1], a).x.toFixed(1)} ${mid(pts[n - 1], a).y.toFixed(1)} ` : '';
    d += `Q${a.x.toFixed(1)} ${a.y.toFixed(1)} ${m.x.toFixed(1)} ${m.y.toFixed(1)} `;
  }
  return d + 'Z';
}

/** Ustione da liquido: torace anteriore e avambraccio destro, con raffreddamento e medicazione. */
function Burn({ sim, g }: { sim: Sim; g: BodyGeo }) {
  const k = g.s;
  const t = g.torso;
  const shirtOn = sim.p.look.top !== 'nudo';
  const cx = t.x0 + (t.x1 - t.x0) * 0.46;
  const cy = 300 + t.hwTop * 0.18;
  const chest = blob(cx, cy, (t.x1 - t.x0) * 0.36, t.hwTop * 0.66, [1, 0.86, 1.08, 0.94, 1.12, 0.9, 1.02, 0.84, 1.06, 0.96]);
  const a = pointOnLimb(g, 'braccio_dx', 0.52);
  const b = pointOnLimb(g, 'braccio_dx', 0.86);
  const arm = capsule(a, b, limbWidthAt(g, 'braccio_dx', 0.52) * 0.95, limbWidthAt(g, 'braccio_dx', 0.86) * 0.95);
  const r = sim.flags.ustioneRaffreddataAt;
  const cooling = r !== undefined && sim.t - Number(r) < 1200;
  const covered = sim.flags.ustioneCopertaAt !== undefined;
  const blisters: Array<[number, number, number]> = [
    [cx - 14 * k, cy - 8 * k, 4.5],
    [cx + 10 * k, cy + 12 * k, 3.5],
    [cx + 22 * k, cy - 14 * k, 3],
    [(a.x + b.x) / 2, (a.y + b.y) / 2, 3.5],
  ];
  const head = { x: cx + 6 * k, y: 300 + t.hwTop + 64 * k };
  return (
    <g>
      {shirtOn ? (
        <path d={chest} fill="#4a1426" opacity="0.26" />
      ) : (
        <g>
          <path d={chest} fill="#d9453a" opacity="0.5" />
          <path d={blob(cx + 4 * k, cy + 2 * k, (t.x1 - t.x0) * 0.22, t.hwTop * 0.38, [1, 1.1, 0.9, 1.05, 0.92, 1.08, 0.95, 1])} fill="#b42f2a" opacity="0.32" />
        </g>
      )}
      <path d={arm} fill="#d9453a" opacity="0.5" />
      {blisters.map(([x, y, rr], i) =>
        shirtOn && i < 3 ? null : <circle key={i} cx={x} cy={y} r={rr * k} fill="#f6e2c9" stroke="#c99a7c" strokeWidth={0.8 * k} opacity="0.95" />,
      )}
      {cooling && !covered && (
        <g>
          <path d={chest} fill="#8fd3ff" opacity="0.3" />
          <path d={arm} fill="#8fd3ff" opacity="0.3" />
          <path d={`M${head.x} ${head.y - 10 * k} C ${head.x - 4 * k} ${head.y - 40 * k}, ${cx} ${cy + 30 * k}, ${cx} ${cy + 6 * k}`} stroke="#bfe6ff" strokeWidth={5 * k} fill="none" strokeDasharray={`${6 * k} ${5 * k}`} strokeDashoffset={-(sim.t * 7) % 22} opacity="0.85" />
          <path d={`M${head.x + 30 * k} ${head.y + 60 * k} Q ${head.x + 16 * k} ${head.y + 20 * k} ${head.x + 4 * k} ${head.y + 4 * k}`} stroke="#d5dadf" strokeWidth={7 * k} fill="none" strokeLinecap="round" />
          <ellipse cx={head.x} cy={head.y} rx={13 * k} ry={8 * k} fill="#e7ebef" stroke="#9aa3ab" strokeWidth={1.5 * k} transform={`rotate(-20 ${head.x} ${head.y})`} />
          {[0, 1, 2, 3, 4].map((i) => (
            <ellipse key={i} cx={cx - 30 * k + i * 15 * k} cy={cy + t.hwTop * 0.9 + ((i * 7) % 5) * k} rx={3 * k} ry={2 * k} fill="#bfe6ff" opacity="0.8" />
          ))}
        </g>
      )}
      {covered && (
        <g>
          <path d={chest} fill="#eef6ff" opacity="0.42" stroke="#ffffff" strokeOpacity="0.75" strokeWidth={2 * k} />
          <path d={arm} fill="#eef6ff" opacity="0.42" stroke="#ffffff" strokeOpacity="0.75" strokeWidth={2 * k} />
          <path d={`M${cx - 26 * k} ${cy - 20 * k} l ${40 * k} ${10 * k} M${cx - 18 * k} ${cy + 4 * k} l ${36 * k} ${9 * k}`} stroke="#ffffff" strokeWidth={2 * k} opacity="0.6" strokeLinecap="round" />
        </g>
      )}
    </g>
  );
}

/** Addome di gravidanza a termine visto dall'alto. */
function Pancia({ sim, g }: { sim: Sim; g: BodyGeo }) {
  const t = g.torso;
  const cx = t.x0 + (t.x1 - t.x0) * 0.86;
  const rx = (t.x1 - t.x0) * 0.42;
  const ry = t.hwTop * 0.98;
  const shirt = sim.p.look.shirt;
  return (
    <g>
      <defs>
        <radialGradient id="pancia-luce" cx="0.42" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.32" />
          <stop offset="0.6" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.18" />
        </radialGradient>
      </defs>
      <ellipse cx={cx + 4} cy={306} rx={rx} ry={ry} fill="#000" opacity="0.18" />
      <ellipse cx={cx} cy={300} rx={rx} ry={ry} fill={shirt} />
      <ellipse cx={cx} cy={300} rx={rx} ry={ry} fill="url(#pancia-luce)" />
      <path d={`M${cx - rx * 0.6} ${300 - ry * 0.55} Q ${cx} ${300 - ry * 0.85} ${cx + rx * 0.6} ${300 - ry * 0.55}`} stroke={shade(shirt, -0.18)} strokeWidth="2" fill="none" opacity="0.6" />
    </g>
  );
}

/** Il neonato: bagnato e bluastro alla nascita, poi asciugato, avvolto e sul ventre della madre. */
function Neonato({ sim, g }: { sim: Sim; g: BodyGeo }) {
  const f = sim.flags;
  const sulVentre = f.sulVentreAt !== undefined;
  const avvolto = f.avvoltoAt !== undefined;
  const piange = f.piangeAt !== undefined;
  const t = g.torso;
  // tra le cosce della madre, poi sul ventre
  const c: Pt = sulVentre ? { x: t.x0 + (t.x1 - t.x0) * 0.62, y: 300 } : { x: g.pelvis.x1 + 58, y: 300 };
  const pelle = piange ? '#f2b9a6' : '#a9a7c6';
  const capo = { x: c.x - 30, y: c.y };
  const cordoneDa = { x: g.pelvis.x1 - 6, y: 300 };
  return (
    <g>
      {f.cordoneTagliato === undefined && (
        <path d={`M${c.x + 4} ${c.y + 6} C ${c.x + 30} ${c.y + 40}, ${cordoneDa.x + 30} ${cordoneDa.y + 30}, ${cordoneDa.x} ${cordoneDa.y}`} stroke="#c9b6c6" strokeWidth="4" fill="none" />
      )}
      {f.clampatoAt !== undefined && (
        <g>
          <rect x={c.x + 12} y={c.y + 14} width="9" height="5" rx="1" fill="#2f7fd6" />
          <rect x={c.x + 26} y={c.y + 26} width="9" height="5" rx="1" fill="#2f7fd6" />
        </g>
      )}
      <g transform={`translate(${c.x} ${c.y}) scale(1.25) translate(${-c.x} ${-c.y})`}>
      <ellipse cx={c.x + 3} cy={c.y + 4} rx="30" ry="18" fill="#000" opacity="0.2" />
      {avvolto ? (
        <g>
          <ellipse cx={c.x} cy={c.y} rx="30" ry="18" fill="#f4efe4" stroke="#d8cfbd" strokeWidth="2" />
          <path d={`M${c.x - 18} ${c.y - 14} Q ${c.x} ${c.y + 2} ${c.x + 20} ${c.y - 12}`} stroke="#d8cfbd" strokeWidth="2" fill="none" />
        </g>
      ) : (
        <g>
          <ellipse cx={c.x} cy={c.y} rx="24" ry="13" fill={pelle} />
          <ellipse cx={c.x + 10} cy={c.y - 12} rx="9" ry="4" fill={pelle} transform={`rotate(-30 ${c.x + 10} ${c.y - 12})`} />
          <ellipse cx={c.x + 10} cy={c.y + 12} rx="9" ry="4" fill={pelle} transform={`rotate(30 ${c.x + 10} ${c.y + 12})`} />
          {f.asciugatoAt === undefined && <ellipse cx={c.x - 4} cy={c.y - 4} rx="14" ry="5" fill="#ffffff" opacity="0.35" />}
        </g>
      )}
      <circle cx={capo.x} cy={capo.y} r="12" fill={pelle} />
      {avvolto && <path d={`M${capo.x - 12} ${capo.y} A 12 12 0 0 1 ${capo.x + 4} ${capo.y - 11.3} L ${capo.x + 4} ${capo.y + 11.3} A 12 12 0 0 1 ${capo.x - 12} ${capo.y}`} fill="#f2a7c3" />}
      {piange && (
        <g stroke="#ffffff" strokeWidth="2" fill="none" opacity="0.8" className="pianto">
          <path d={`M${capo.x - 20} ${capo.y - 10} q -6 10 0 20`} />
          <path d={`M${capo.x - 27} ${capo.y - 15} q -9 15 0 30`} />
        </g>
      )}
      </g>
    </g>
  );
}

/** Frattura esposta: angolazione, ferita con il moncone, poi garze e telo sterile. */
function Frattura({ sim, g }: { sim: Sim; g: BodyGeo }) {
  const fr = sim.scenario.lesioni!.frattura!;
  const pt = pointOnLimb(g, fr.region, fr.pos);
  const w = limbWidthAt(g, fr.region, fr.pos);
  if (sim.flags.fratturaCopertaAt !== undefined) {
    return (
      <g>
        <rect x={pt.x - w - 10} y={pt.y - w - 8} width={(w + 10) * 2} height={(w + 8) * 2} rx="5" fill="#eef4f8" stroke="#7fb3d9" strokeWidth="2" />
        <path d={`M${pt.x - w - 4} ${pt.y - w} L${pt.x + w + 4} ${pt.y + w}`} stroke="#c9dceb" strokeWidth="2" />
        <circle cx={pt.x} cy={pt.y} r={w * 0.35} fill="#c0392b" opacity="0.25" />
      </g>
    );
  }
  return (
    <g>
      <ellipse cx={pt.x + 6} cy={pt.y + pt.side * (w + 16)} rx={w * 1.5} ry={w * 0.8} fill="#6b0a12" opacity="0.55" />
      <ellipse cx={pt.x} cy={pt.y} rx={w * 1.35} ry={w * 0.95} fill="#7d0b16" opacity="0.9" />
      <ellipse cx={pt.x - 2} cy={pt.y - 2} rx={w * 0.8} ry={w * 0.5} fill="#a3121f" />
      <path d={`M${pt.x - w * 0.7} ${pt.y + pt.side * w * 0.6} q ${w * 0.4} ${pt.side * w * 0.9} ${w * 1.4} ${pt.side * w * 1.7}`} stroke="#8c1a22" strokeWidth="4" fill="none" opacity="0.75" />
      <rect x={pt.x - 6} y={pt.y - w * 0.8} width="13" height={w * 1.3} rx="4" fill="#f4ecd8" stroke="#bfb293" strokeWidth="2" transform={`rotate(${pt.side * 28} ${pt.x} ${pt.y})`} />
    </g>
  );
}
