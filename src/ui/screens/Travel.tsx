import { useEffect, useMemo, useRef, useState } from 'react';
import type { Scenario } from '../../engine/types';
import { sfx } from '../audio';

/** Generatore pseudo-casuale deterministico per disegnare una mappa diversa per ogni missione. */
function rng(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const COLS = 9;
const ROWS = 5;
const CELL = 100;

/** Tragitto dal punto di partenza all'evento, con sirena e lampeggianti. */
export function Travel({ scenario, onArrive }: { scenario: Scenario; onArrive: () => void }) {
  const pathRef = useRef<SVGPathElement>(null);
  const arriveRef = useRef(onArrive);
  arriveRef.current = onArrive;
  const [pos, setPos] = useState({ x: 50, y: 450, a: 0 });
  const [prog, setProg] = useState(0);
  const minutes = Math.max(1, Math.round((scenario.dispatch.travel ?? 480) / 60));
  const map = useMemo(() => {
    const r = rng(scenario.id);
    const blocks: { x: number; y: number; w: number; h: number; c: string; park: boolean }[] = [];
    for (let i = 0; i < COLS; i++)
      for (let j = 0; j < ROWS; j++) {
        const park = r() < 0.1;
        blocks.push({ x: i * CELL + 14, y: j * CELL + 14, w: CELL - 28, h: CELL - 28, c: park ? '#16301f' : ['#1a2738', '#1d2b3f', '#18263a'][Math.floor(r() * 3)], park });
      }
    // percorso a gradini lungo le strade, da sinistra in basso a destra in alto
    const pts: [number, number][] = [[0, 500]];
    let cx = 0;
    let cy = 500;
    const tx = 800 + Math.floor(r() * 2) * 100;
    const ty = 100 + Math.floor(r() * 2) * 100;
    while (cx < tx || cy > ty) {
      if (cx < tx && (r() < 0.6 || cy <= ty)) cx += 100;
      else cy -= 100;
      pts.push([cx, cy]);
    }
    const cars = Array.from({ length: 14 }).map(() => {
      const v = r() < 0.5;
      const lane = Math.floor(r() * (v ? COLS : ROWS)) * CELL;
      const along = r() * (v ? ROWS : COLS) * CELL;
      return { x: v ? lane + 5 : along, y: v ? along : lane + 5, v, c: ['#c9d4df', '#8a95a1', '#d0a33b', '#9e3b3b'][Math.floor(r() * 4)] };
    });
    return { blocks, cars, d: pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' '), dest: { x: tx, y: ty } };
  }, [scenario.id]);

  useEffect(() => {
    sfx('sirena');
    const el = pathRef.current;
    if (!el) return;
    const len = el.getTotalLength();
    const dur = 3600;
    const t0 = performance.now();
    let raf = 0;
    let done = false;
    const loop = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      const p = el.getPointAtLength(e * len);
      const q = el.getPointAtLength(Math.min(len, e * len + 2));
      setPos({ x: p.x, y: p.y, a: (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI });
      setProg(e);
      if (k < 1) raf = requestAnimationFrame(loop);
      else if (!done) {
        done = true;
        window.setTimeout(() => arriveRef.current(), 650);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const left = Math.max(0, Math.round(minutes * (1 - prog)));
  return (
    <div className="travel">
      <div className="hud-stripe" aria-hidden="true" />
      <div className="travel-head">
        <div>
          <p className="travel-k">{scenario.role === 'squadra' ? 'In movimento verso il punto' : 'In viaggio con sirena e lampeggianti'}</p>
          <h1>{scenario.dispatch.address}</h1>
        </div>
        <div className="travel-eta">
          <span className="num">{left}</span>
          <small>min all’arrivo</small>
        </div>
      </div>
      <div className="travel-map">
        <svg viewBox="-20 -20 940 540" role="img" aria-label="Mappa del tragitto verso l’evento">
          <rect x="-20" y="-20" width="940" height="540" fill="#0b1522" />
          {map.blocks.map((b, i) => (
            <g key={i}>
              <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="6" fill={b.c} />
              {b.park ? (
                [0.25, 0.7, 0.45].map((t, k) => <circle key={k} cx={b.x + b.w * t} cy={b.y + b.h * ((k * 0.37 + 0.25) % 1)} r="9" fill="#21462c" />)
              ) : (
                <>
                  <rect x={b.x + 8} y={b.y + 8} width={b.w - 16} height={b.h - 16} rx="4" fill="#ffffff" opacity="0.03" />
                  <rect x={b.x + 14 + (i % 3) * 8} y={b.y + 14} width="8" height="6" rx="1" fill="#ffffff" opacity="0.06" />
                </>
              )}
            </g>
          ))}
          {map.cars.map((c, i) => (
            <rect key={`c${i}`} x={c.x - 6} y={c.y - 3} width="12" height="6" rx="2" fill={c.c} opacity="0.8" transform={c.v ? `rotate(90 ${c.x} ${c.y})` : undefined} />
          ))}
          <g transform="translate(0 500)">
            <rect x="-14" y="-14" width="28" height="28" rx="6" fill="#ff7a1a" />
            <text y="5" textAnchor="middle" fontSize="13" fontWeight="800" fontFamily="var(--f-display)" fill="#1c0d00">
              118
            </text>
          </g>
          {Array.from({ length: COLS + 1 }).map((_, i) => (
            <line key={`v${i}`} x1={i * CELL} y1="0" x2={i * CELL} y2={ROWS * CELL} stroke="#25364c" strokeWidth="3" strokeDasharray="10 12" />
          ))}
          {Array.from({ length: ROWS + 1 }).map((_, j) => (
            <line key={`h${j}`} x1="0" y1={j * CELL} x2={COLS * CELL} y2={j * CELL} stroke="#25364c" strokeWidth="3" strokeDasharray="10 12" />
          ))}
          <path d={map.d} stroke="#ff7a1a" strokeOpacity="0.25" strokeWidth="14" fill="none" strokeLinejoin="round" />
          <path ref={pathRef} d={map.d} stroke="#ffa25c" strokeWidth="5" fill="none" strokeLinejoin="round" strokeDasharray="1600" strokeDashoffset={1600 - prog * 1600} />
          <g transform={`translate(${map.dest.x} ${map.dest.y})`}>
            <circle r="26" fill="#e5323b" opacity="0.25" className="dest-ping" />
            <circle r="11" fill="#e5323b" stroke="#fff" strokeWidth="3" />
          </g>
          <g transform={`translate(${pos.x} ${pos.y}) rotate(${pos.a})`}>
            <circle r="34" fill="#3f8cff" opacity="0.18" className="amb-flash" />
            <rect x="-22" y="-11" width="44" height="22" rx="5" fill="#f4f6f8" stroke="#0b1522" strokeWidth="2" />
            <rect x="8" y="-11" width="14" height="22" rx="4" fill="#cfd8e2" />
            <rect x="-18" y="-11" width="22" height="5" fill="#ff7a1a" />
            <rect x="-18" y="6" width="22" height="5" fill="#ff7a1a" />
            <rect x="0" y="-4" width="6" height="8" rx="1" fill="#3f8cff" className="amb-flash" />
          </g>
        </svg>
      </div>
      <div className="travel-foot">
        <p className="muted">{scenario.dispatch.extra ?? 'La SORES vi aggiornerà via radio durante il tragitto.'}</p>
        <button className="btn" onClick={onArrive}>
          Salta il tragitto
        </button>
      </div>
    </div>
  );
}
