import type { Sim } from '../../engine/engine';
import type { BodyRegion } from '../../engine/types';
import type { EquipmentId } from '../../data/equipment';

/** Coordinate (nel disegno supino) della radice e dell'estremità di ogni arto. */
const LIMB: Partial<Record<BodyRegion, { x0: number; y0: number; x1: number; y1: number; side: number }>> = {
  braccio_sx: { x0: 300, y0: 230, x1: 468, y1: 220, side: -1 },
  braccio_dx: { x0: 300, y0: 370, x1: 468, y1: 380, side: 1 },
  gamba_sx: { x0: 488, y0: 276, x1: 704, y1: 268, side: -1 },
  gamba_dx: { x0: 488, y0: 324, x1: 704, y1: 332, side: 1 },
};

export function limbPoint(region: BodyRegion, pos: number) {
  const l = LIMB[region];
  if (!l) return { x: 400, y: 300, side: 1 };
  return { x: l.x0 + (l.x1 - l.x0) * pos, y: l.y0 + (l.y1 - l.y0) * pos, side: l.side };
}

export function UnderPatient({ sim }: { sim: Sim }) {
  const im = sim.immob;
  const b = sim.p.bleeding;
  const loss = sim.p.bloodLossMl;
  const els: JSX.Element[] = [];
  if (sim.cooling?.method === 'immersione') {
    els.push(
      <g key="vasca">
        <rect x="150" y="190" width="600" height="220" rx="40" fill="#cfd8e0" />
        <rect x="164" y="204" width="572" height="192" rx="32" fill="#2d7fae" opacity="0.85" />
        <path d="M190 240 q 30 -10 60 0 t 60 0 M520 360 q 30 -10 60 0 t 60 0" stroke="#bfe9ff" strokeWidth="3" fill="none" opacity="0.6" className="onda" />
      </g>,
    );
  }
  if (sim.cooling?.method === 'taco') {
    els.push(<rect key="taco" x="160" y="200" width="580" height="200" rx="24" fill="#2f6fb0" opacity="0.8" />);
  }
  if (im.has('materasso')) {
    els.push(
      <g key="mat">
        <rect x="168" y="200" width="572" height="200" rx="60" fill="#e5641e" />
        <rect x="186" y="218" width="536" height="164" rx="50" fill="#f07a35" />
        {Array.from({ length: 9 }).map((_, i) => (
          <circle key={i} cx={220 + i * 60} cy={300} r="4" fill="#c4520f" opacity="0.6" />
        ))}
      </g>,
    );
  }
  if (im.has('tavola')) {
    els.push(<rect key="tav" x="170" y="236" width="560" height="128" rx="28" fill="#f2c21b" stroke="#c49a10" strokeWidth="4" />);
  }
  if (im.has('cucchiaio') && !im.has('materasso')) {
    els.push(
      <g key="cuc" stroke="#9ea8b3" strokeWidth="9" fill="none" strokeLinecap="round">
        <path d="M180 250 Q 170 300 180 350 M180 250 L720 250 M180 350 L720 350 M720 250 Q 734 300 720 350" />
      </g>,
    );
  }
  if (b && loss > 40) {
    const w = b.region;
    const pt = limbPoint(w, b.pos);
    const r = Math.min(110, 14 + Math.sqrt(loss) * 2.6);
    els.push(
      <g key="sangue">
        <ellipse cx={pt.x + 10} cy={pt.y + pt.side * (r * 0.55)} rx={r * 1.15} ry={r * 0.75} fill="#5e0d14" opacity="0.92" />
        <ellipse cx={pt.x} cy={pt.y + pt.side * (r * 0.45)} rx={r * 0.7} ry={r * 0.42} fill="#7a1119" opacity="0.8" />
      </g>,
    );
  }
  return <g pointerEvents="none">{els}</g>;
}

function Hands({ x, y, anim }: { x: number; y: number; anim?: string }) {
  return (
    <g className={anim}>
      <path d={`M${x - 6} ${y - 150} L${x - 10} ${y - 18}`} stroke="#3d4f6a" strokeWidth="26" strokeLinecap="round" />
      <path d={`M${x + 14} ${y - 150} L${x + 10} ${y - 18}`} stroke="#34445c" strokeWidth="26" strokeLinecap="round" />
      <ellipse cx={x} cy={y} rx="20" ry="24" fill="#4f7fd6" stroke="#2f5cac" strokeWidth="2" />
      <ellipse cx={x + 3} cy={y - 4} rx="17" ry="20" fill="#6a96e6" />
    </g>
  );
}

export function OverPatient({ sim, now }: { sim: Sim; now: number }) {
  const p = sim.p;
  const pos = p.position;
  const supine = pos === 'supino' || pos === 'semiseduto' || pos === 'seduto' || pos === 'prono';
  const els: JSX.Element[] = [];

  if (p.vomitInMouth) {
    els.push(<path key="vomito" d="M266 312 q 18 8 30 30 q -20 12 -36 -2 q -8 -14 6 -28z" fill="#b9a94f" opacity="0.9" />);
  }
  if (supine && sim.covered) {
    els.push(
      <g key="telo" opacity="0.92">
        <path d="M296 226 L716 236 L722 366 L296 376 Z" fill="url(#oro)" />
        <path d="M330 240 l 40 60 l 50 -50 l 60 70 l 70 -60 l 60 70 l 60 -40" stroke="#fff3c4" strokeWidth="1.5" fill="none" opacity="0.5" />
      </g>,
    );
  }
  if (supine && sim.cooling && sim.cooling.method !== 'immersione') {
    if (sim.cooling.method === 'impacchi' || sim.cooling.method === 'taco') {
      els.push(
        <g key="ghiaccio">
          {[
            [276, 268],
            [276, 332],
            [318, 238],
            [318, 362],
            [470, 268],
            [470, 332],
          ].map(([x, y], i) => (
            <rect key={i} x={x - 12} y={y - 9} width="24" height="18" rx="5" fill="#e9f6ff" stroke="#9cc7e6" strokeWidth="2" />
          ))}
          <path d="M300 230 L700 240 L700 360 L300 372 Z" fill="#7fc4f0" opacity="0.32" />
        </g>,
      );
    } else {
      els.push(
        <g key="nebbia" className="nebbia">
          {Array.from({ length: 18 }).map((_, i) => (
            <circle key={i} cx={300 + ((i * 47) % 400)} cy={240 + ((i * 31) % 120)} r={4 + (i % 4)} fill="#d6f0ff" opacity="0.5" />
          ))}
        </g>,
      );
    }
  }
  // cintura pelvica
  if (supine && sim.immob.has('pelvica')) {
    els.push(<rect key="pelvica" x="452" y="244" width="30" height="112" rx="6" fill="#1b1d20" stroke="#ff7a1a" strokeWidth="3" />);
  }
  // emorragia e medicazione sull'arto
  const b = p.bleeding;
  if (b && supine) {
    const pt = limbPoint(b.region, b.pos);
    if (sim.dressing) els.push(<rect key="med" x={pt.x - 16} y={pt.y - 16} width="32" height="32" rx="6" fill="#f4f4f2" stroke="#c9c9c4" strokeWidth="2" />);
    else els.push(<ellipse key="ferita" cx={pt.x} cy={pt.y} rx="14" ry="9" fill="#8d0f1b" />);
    if (sim.pressure && !sim.tourniquet?.ok) {
      els.push(<ellipse key="pressione" cx={pt.x} cy={pt.y - 4} rx="20" ry="16" fill="#4f7fd6" stroke="#2f5cac" strokeWidth="2" />);
    }
  }
  if (sim.tourniquet && supine) {
    const pt = limbPoint(sim.tourniquet.region, sim.tourniquet.pos);
    const ora = sim.clock(sim.tourniquet.at);
    els.push(
      <g key="tq">
        <rect x={pt.x - 9} y={pt.y - 26} width="18" height="52" rx="4" fill="#15171a" />
        <rect x={pt.x - 22} y={pt.y - 4} width="44" height="8" rx="3" fill="#2b2f35" />
        <g transform={`translate(${pt.x + 8} ${pt.y + pt.side * 40})`}>
          <rect x="-4" y="-12" width="66" height="24" rx="4" fill="#d32f2f" />
          <text x="29" y="5" textAnchor="middle" fontSize="13" fontFamily="var(--f-display)" fontWeight="700" fill="#fff">
            T {ora}
          </text>
        </g>
      </g>,
    );
  }
  if (supine && sim.immob.has('stecca')) {
    els.push(<rect key="stecca" x="520" y="306" width="170" height="40" rx="10" fill="#f39c3d" opacity="0.85" />);
  }
  // collare
  if (supine && sim.immob.has('collare')) {
    els.push(
      <g key="collare">
        <rect x="258" y="270" width="36" height="60" rx="10" fill="#f0f0ee" stroke="#b9bcc0" strokeWidth="2" />
        <rect x="268" y="290" width="16" height="20" rx="4" fill="#ff7a1a" />
      </g>,
    );
  }
  // casco
  if (p.look.helmet && supine) {
    els.push(
      <g key="casco">
        <ellipse cx="228" cy="300" rx="52" ry="46" fill="#1d2430" stroke="#0e1218" strokeWidth="3" />
        <path d="M244 266 Q 286 300 244 334 L 236 330 Q 270 300 236 270 Z" fill="#2c4a6e" opacity="0.9" />
        <path d="M188 280 Q 200 300 188 320" stroke="#c4271f" strokeWidth="6" fill="none" />
      </g>,
    );
  }
  // stabilizzazione manuale del capo
  if (sim.immob.has('mils') && supine) {
    els.push(
      <g key="mils">
        <ellipse cx="206" cy="262" rx="18" ry="13" fill="#4f7fd6" stroke="#2f5cac" strokeWidth="2" />
        <ellipse cx="206" cy="338" rx="18" ry="13" fill="#4f7fd6" stroke="#2f5cac" strokeWidth="2" />
        <path d="M150 250 L196 262 M150 350 L196 338" stroke="#3d4f6a" strokeWidth="18" strokeLinecap="round" />
      </g>,
    );
  }
  // piastre DAE
  if (sim.aed.pads && supine) {
    const ap = sim.aed.pads === 'anteroposteriore';
    const pads = ap
      ? [
          { x: 332, y: 268, w: 40, h: 30 },
          { x: 300, y: 214, w: 40, h: 30, back: true },
        ]
      : sim.aed.pads === 'errata'
        ? [
            { x: 330, y: 240, w: 40, h: 30 },
            { x: 384, y: 236, w: 40, h: 30 },
          ]
        : [
            { x: 296, y: 316, w: 40, h: 30 },
            { x: 372, y: 236, w: 40, h: 30 },
          ];
    els.push(
      <g key="piastre">
        {pads.map((d, i) => (
          <g key={i} opacity={d.back ? 0.55 : 1}>
            <rect x={d.x} y={d.y} width={d.w} height={d.h} rx="6" fill="#f7f7f5" stroke={d.back ? '#ff7a1a' : '#9aa3ad'} strokeWidth="2" strokeDasharray={d.back ? '4 3' : undefined} />
            <path d={`M${d.x + d.w / 2} ${d.y + 8} l 6 6 l -6 6 l -6 -6 z`} fill="#d32f2f" />
            <path d={`M${d.x + d.w / 2} ${d.y + d.h} C ${d.x} ${d.y + 120}, 240 470, 230 476`} stroke="#d9dde2" strokeWidth="3" fill="none" />
          </g>
        ))}
      </g>,
    );
  }
  // saturimetro
  if (sim.pulseOx) {
    const hx = pos === 'laterale' ? 252 : pos === 'in_piedi' ? 484 : 468;
    const hy = pos === 'laterale' ? 340 : pos === 'in_piedi' ? 308 : 380;
    els.push(
      <g key="spo2">
        <path d={`M${hx + 10} ${hy + 6} C ${hx + 60} ${hy + 90}, 820 470, 900 480`} stroke="#9ab0c8" strokeWidth="3" fill="none" />
        <rect x={hx - 6} y={hy - 9} width="22" height="18" rx="5" fill="#2f6fd0" />
        <circle cx={hx + 9} cy={hy} r="2.6" fill="#ff3d55" className="spo2-led" />
      </g>,
    );
  }
  // ossigeno
  if (sim.o2 && !sim.bvm && pos !== 'in_piedi') {
    const fx = pos === 'laterale' ? 258 : 262;
    const fy = pos === 'laterale' ? 312 : 300;
    if (sim.o2.device === 'occhialini') {
      els.push(
        <g key="o2">
          <path d={`M${fx - 12} ${fy - 30} Q ${fx + 2} ${fy} ${fx - 12} ${fy + 30}`} stroke="#9fe2c4" strokeWidth="3" fill="none" />
          <path d={`M${fx - 12} ${fy - 30} C 180 200, 140 170, 100 150`} stroke="#9fe2c4" strokeWidth="3" fill="none" />
        </g>,
      );
    } else {
      const res = sim.o2.device === 'reservoir';
      const full = sim.o2.flow >= 10;
      els.push(
        <g key="o2">
          <path d={`M${fx + 4} ${fy} C 200 200, 140 170, 100 150`} stroke="#9fe2c4" strokeWidth="3" fill="none" />
          {res && <ellipse cx={fx + 52} cy={fy} rx={full ? 26 : 12} ry={full ? 18 : 8} fill="#bfe8d6" opacity="0.8" stroke="#7fc9a8" />}
          <ellipse cx={fx} cy={fy} rx="20" ry="24" fill="#c7f0dc" opacity="0.55" stroke="#7fc9a8" strokeWidth="2" />
        </g>,
      );
    }
  }
  // pallone
  const bvmVisible = (sim.bvm || (sim.cpr.active && sim.cpr.ventilation === 'pallone')) && supine;
  if (bvmVisible) {
    els.push(
      <g key="bvm">
        <ellipse cx="262" cy="300" rx="22" ry="26" fill="#cfe6f6" opacity="0.65" stroke="#7aa6c8" strokeWidth="2" />
        <rect x="160" y="286" width="84" height="28" rx="14" fill="#2d6ec9" className="bvm-anim" />
        <ellipse cx="150" cy="300" rx="16" ry="12" fill="#bfe8d6" opacity="0.85" />
        <path d="M150 300 C 130 260, 120 200, 100 150" stroke="#9fe2c4" strokeWidth="3" fill="none" />
      </g>,
    );
  }
  if (sim.flags.guedel && supine) {
    els.push(<rect key="guedel" x="272" y="294" width="12" height="12" rx="3" fill="#ffd84d" />);
  }
  // mani per la RCP
  if (sim.cpr.active && supine) {
    els.push(<Hands key="rcp" x={352} y={300} anim="cpr-hands" />);
  }
  void now;
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
