/**
 * Geometria del corpo visto dall'alto. Il paziente supino ha la testa a sinistra
 * e i piedi a destra; il suo lato destro è in basso (y > 300), il sinistro in alto.
 * Disegno e presidi applicati usano gli stessi punti di ancoraggio, così restano
 * allineati per adulti, bambini e lattanti e nelle diverse posizioni.
 */
import type { BodyRegion, Look, Position } from '../../engine/types';

export interface Pt {
  x: number;
  y: number;
}

export interface Limb {
  root: Pt;
  mid: Pt;
  end: Pt;
  tip: Pt; // centro della mano o del piede
  w: [number, number, number]; // raggio a radice, articolazione intermedia, estremità
}

export interface BodyGeo {
  s: number; // scala relativa all'adulto, per la dimensione dei presidi
  head: { c: Pt; rx: number; ry: number };
  neck: { x0: number; x1: number; hw: number };
  torso: { x0: number; x1: number; hwTop: number; hwWaist: number };
  pelvis: { x0: number; x1: number; hw: number };
  armL: Limb;
  armR: Limb;
  legL: Limb;
  legR: Limb;
  sternum: Pt;
  padR: Pt; // sottoclaveare destra
  padL: Pt; // ascellare sinistra
  padAP: Pt; // anteriore della posizione antero-posteriore
  mouth: Pt;
  /** compressione prospettica del busto quando lo schienale è sollevato */
  recline: number;
  pivotX: number;
}

interface Params {
  s: number;
  headX: number;
  headRx: number;
  headRy: number;
  neck: [number, number, number];
  torso: [number, number, number, number];
  pelvis: [number, number, number];
  arm: { x: [number, number, number, number]; y: [number, number, number, number]; w: [number, number, number] };
  leg: { x: [number, number, number, number]; y: [number, number, number, number]; w: [number, number, number] };
}

const ADULTO: Params = {
  s: 1,
  headX: 230,
  headRx: 39,
  headRy: 32,
  neck: [258, 292, 14],
  torso: [290, 438, 66, 50],
  pelvis: [430, 498, 52],
  arm: { x: [304, 382, 448, 466], y: [62, 72, 76, 78], w: [15, 11.5, 8.5] },
  leg: { x: [494, 598, 686, 704], y: [25, 28, 30, 32], w: [21, 15, 11] },
};

const BAMBINO: Params = {
  s: 0.72,
  headX: 290,
  headRx: 40,
  headRy: 34,
  neck: [320, 340, 11],
  torso: [338, 438, 48, 38],
  pelvis: [432, 482, 40],
  arm: { x: [348, 398, 444, 458], y: [46, 54, 58, 60], w: [10.5, 8.5, 6.5] },
  leg: { x: [480, 548, 610, 624], y: [19, 21, 22, 24], w: [15, 11, 8.5] },
};

const NEONATO: Params = {
  s: 0.56,
  headX: 336,
  headRx: 42,
  headRy: 37,
  neck: [366, 380, 10],
  torso: [376, 452, 42, 36],
  pelvis: [446, 484, 37],
  arm: { x: [384, 414, 444, 456], y: [42, 50, 54, 56], w: [9.5, 8.5, 7] },
  leg: { x: [482, 520, 556, 568], y: [16, 22, 24, 25], w: [12.5, 10.5, 8] },
};

function paramsFor(build: Look['build']): Params {
  if (build === 'neonato') return NEONATO;
  if (build === 'bambino') return BAMBINO;
  return ADULTO;
}

function limb(spec: Params['arm'], side: -1 | 1): Limb {
  return {
    root: { x: spec.x[0], y: 300 + side * spec.y[0] },
    mid: { x: spec.x[1], y: 300 + side * spec.y[1] },
    end: { x: spec.x[2], y: 300 + side * spec.y[2] },
    tip: { x: spec.x[3], y: 300 + side * spec.y[3] },
    w: spec.w,
  };
}

export function bodyGeometry(build: Look['build'], position: Position = 'supino'): BodyGeo {
  const P = paramsFor(build);
  const recline = position === 'semiseduto' ? 0.8 : position === 'seduto' ? 0.66 : 1;
  const pivotX = P.pelvis[0];
  const rx = (x: number) => (x < pivotX ? pivotX - (pivotX - x) * recline : x);
  const armL = limb(P.arm, -1);
  const armR = limb(P.arm, 1);
  const fixArm = (l: Limb): Limb => ({ ...l, root: { ...l.root, x: rx(l.root.x) }, mid: { ...l.mid, x: rx(l.mid.x) }, end: { ...l.end, x: rx(l.end.x) }, tip: { ...l.tip, x: rx(l.tip.x) } });
  const torsoX0 = rx(P.torso[0]);
  const sternumX = rx(P.torso[0] + (P.torso[1] - P.torso[0]) * 0.42);
  const g: BodyGeo = {
    s: P.s,
    head: { c: { x: rx(P.headX), y: 300 }, rx: P.headRx, ry: P.headRy },
    neck: { x0: rx(P.neck[0]), x1: rx(P.neck[1]), hw: P.neck[2] },
    torso: { x0: torsoX0, x1: P.torso[1], hwTop: P.torso[2], hwWaist: P.torso[3] },
    pelvis: { x0: P.pelvis[0], x1: P.pelvis[1], hw: P.pelvis[2] },
    armL: recline < 1 ? fixArm(armL) : armL,
    armR: recline < 1 ? fixArm(armR) : armR,
    legL: limb(P.leg, -1),
    legR: limb(P.leg, 1),
    sternum: { x: sternumX, y: 300 },
    padR: { x: torsoX0 + 24 * P.s, y: 300 + P.torso[2] * 0.42 },
    padL: { x: torsoX0 + 86 * P.s, y: 300 - P.torso[2] * 0.82 },
    padAP: { x: sternumX - 4 * P.s, y: 300 - 16 * P.s },
    mouth: { x: rx(P.headX) + P.headRx * 0.55, y: 300 },
    recline,
    pivotX,
  };
  return g;
}

/** Punto lungo un arto (0 = radice, 1 = estremità), per ferite e tourniquet. */
export function pointOnLimb(g: BodyGeo, region: BodyRegion, pos: number): Pt & { side: number } {
  const l = region === 'braccio_sx' ? g.armL : region === 'braccio_dx' ? g.armR : region === 'gamba_sx' ? g.legL : region === 'gamba_dx' ? g.legR : null;
  if (!l) return { x: g.sternum.x, y: 300, side: 1 };
  const side = l.root.y < 300 ? -1 : 1;
  // radice→intermedio = 0..0.5, intermedio→estremità = 0.5..1
  if (pos <= 0.5) {
    const t = pos / 0.5;
    return { x: l.root.x + (l.mid.x - l.root.x) * t, y: l.root.y + (l.mid.y - l.root.y) * t, side };
  }
  const t = (pos - 0.5) / 0.5;
  return { x: l.mid.x + (l.end.x - l.mid.x) * t, y: l.mid.y + (l.end.y - l.mid.y) * t, side };
}

export function limbWidthAt(g: BodyGeo, region: BodyRegion, pos: number): number {
  const l = region.startsWith('braccio') ? g.armL : g.legL;
  return pos <= 0.5 ? l.w[0] + (l.w[1] - l.w[0]) * (pos / 0.5) : l.w[1] + (l.w[2] - l.w[1]) * ((pos - 0.5) / 0.5);
}

/** Capsula affusolata tra due punti con raggi diversi (per arti e segmenti). */
export function capsule(a: Pt, b: Pt, ra: number, rb: number): string {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy;
  const ny = ux;
  const a1 = { x: a.x + nx * ra, y: a.y + ny * ra };
  const b1 = { x: b.x + nx * rb, y: b.y + ny * rb };
  const b2 = { x: b.x - nx * rb, y: b.y - ny * rb };
  const a2 = { x: a.x - nx * ra, y: a.y - ny * ra };
  const f = (n: number) => n.toFixed(1);
  return `M${f(a1.x)} ${f(a1.y)} L${f(b1.x)} ${f(b1.y)} A${f(rb)} ${f(rb)} 0 0 1 ${f(b2.x)} ${f(b2.y)} L${f(a2.x)} ${f(a2.y)} A${f(ra)} ${f(ra)} 0 0 1 ${f(a1.x)} ${f(a1.y)} Z`;
}

/** Arto come forma unica e continua (radice → articolazione → estremità), con estremità arrotondate. */
export function limbPath(pts: Pt[], ws: number[]): string {
  const n = pts.length;
  const dirs = pts.slice(1).map((p, i) => {
    const dx = p.x - pts[i].x;
    const dy = p.y - pts[i].y;
    const l = Math.hypot(dx, dy) || 1;
    return { x: dx / l, y: dy / l };
  });
  const normals = pts.map((_, i) => {
    const d = i === 0 ? dirs[0] : i === n - 1 ? dirs[n - 2] : { x: dirs[i - 1].x + dirs[i].x, y: dirs[i - 1].y + dirs[i].y };
    const l = Math.hypot(d.x, d.y) || 1;
    return { x: -d.y / l, y: d.x / l };
  });
  const top = pts.map((p, i) => ({ x: p.x + normals[i].x * ws[i], y: p.y + normals[i].y * ws[i] }));
  const bot = pts.map((p, i) => ({ x: p.x - normals[i].x * ws[i], y: p.y - normals[i].y * ws[i] }));
  const f = (v: number) => v.toFixed(1);
  let d = `M${f(top[0].x)} ${f(top[0].y)}`;
  for (let i = 1; i < n; i++) {
    if (i < n - 1) {
      // curva morbida attorno all'articolazione
      d += ` L${f((top[i - 1].x + top[i].x) / 2 + (top[i].x - top[i - 1].x) * 0.3)} ${f((top[i - 1].y + top[i].y) / 2 + (top[i].y - top[i - 1].y) * 0.3)}`;
      d += ` Q${f(top[i].x)} ${f(top[i].y)} ${f(top[i].x + (top[i + 1].x - top[i].x) * 0.2)} ${f(top[i].y + (top[i + 1].y - top[i].y) * 0.2)}`;
    } else d += ` L${f(top[i].x)} ${f(top[i].y)}`;
  }
  d += ` A${f(ws[n - 1])} ${f(ws[n - 1])} 0 0 1 ${f(bot[n - 1].x)} ${f(bot[n - 1].y)}`;
  for (let i = n - 2; i >= 0; i--) {
    if (i > 0) {
      d += ` L${f(bot[i].x + (bot[i + 1].x - bot[i].x) * 0.2)} ${f(bot[i].y + (bot[i + 1].y - bot[i].y) * 0.2)}`;
      d += ` Q${f(bot[i].x)} ${f(bot[i].y)} ${f(bot[i].x + (bot[i - 1].x - bot[i].x) * 0.2)} ${f(bot[i].y + (bot[i - 1].y - bot[i].y) * 0.2)}`;
    } else d += ` L${f(bot[i].x)} ${f(bot[i].y)}`;
  }
  d += ` A${f(ws[0])} ${f(ws[0])} 0 0 1 ${f(top[0].x)} ${f(top[0].y)} Z`;
  return d;
}
