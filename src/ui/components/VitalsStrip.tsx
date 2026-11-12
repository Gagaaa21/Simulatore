import { useMemo, useState } from 'react';
import type { Sim } from '../../engine/engine';
import { fmtClock } from '../../engine/engine';

interface Marker {
  t: number;
  label: string;
}

/** Eventi da segnare sulla striscia, ricavati dal registro delle azioni. */
export function keyMarkers(sim: Sim): Marker[] {
  const out: Marker[] = [];
  const add = (id: string, label: string) => {
    const t = sim.firstAt(id);
    if (t !== null) out.push({ t, label });
  };
  add('avvicinati', 'Contatto');
  const crew = sim.flags.crewCprAt;
  if (crew !== undefined) out.push({ t: Number(crew), label: 'RCP' });
  if (sim.aed.lastShockAt !== null) out.push({ t: sim.aed.lastShockAt, label: `Shock ×${sim.aed.shocks}` });
  if (sim.arrest.roscAt !== null) out.push({ t: sim.arrest.roscAt, label: 'ROSC' });
  if (sim.flags.o2At !== undefined) out.push({ t: Number(sim.flags.o2At), label: 'O₂' });
  if (sim.tourniquet) out.push({ t: sim.tourniquet.at, label: 'Tourniquet' });
  if (sim.flags.zuccheroAt !== undefined) out.push({ t: Number(sim.flags.zuccheroAt), label: 'Zucchero' });
  if (sim.flags.raffreddamentoAt !== undefined) out.push({ t: Number(sim.flags.raffreddamentoAt), label: 'Raffreddamento' });
  if (sim.flags.adrenalina1At !== undefined) out.push({ t: Number(sim.flags.adrenalina1At), label: 'Adrenalina' });
  if (sim.bvm && sim.flags.bvmAt !== undefined) out.push({ t: Number(sim.flags.bvmAt), label: 'Pallone' });
  return out.filter((m) => m.t >= 0).sort((a, b) => a.t - b.t);
}

const PANELS = [
  { key: 'spo2' as const, label: 'SpO₂ %', min: 50, max: 100, ticks: [60, 80, 100] },
  { key: 'hr' as const, label: 'FC /min', min: 0, max: 180, ticks: [0, 60, 120, 180] },
  { key: 'sbp' as const, label: 'PA sistolica mmHg', min: 0, max: 200, ticks: [0, 100, 200] },
];

export function VitalsStrip({ sim }: { sim: Sim }) {
  const data = sim.history;
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const tMax = Math.max(60, data[data.length - 1]?.t ?? 60);
  const markers = useMemo(() => keyMarkers(sim), [sim]);
  const W = 720;
  const PH = 74;
  const GAP = 30;
  const L = 52;
  const R = 12;
  const TOP = 36;
  const totalH = TOP + PANELS.length * (PH + GAP) + 18;
  const x = (t: number) => L + ((W - L - R) * t) / tMax;
  const near = hover === null ? null : data.reduce((best, d) => (Math.abs(d.t - hover) < Math.abs(best.t - hover) ? d : best), data[0]);
  const minuteTicks = Array.from({ length: Math.floor(tMax / 60) + 1 }, (_, i) => i * 60).filter((t, _, a) => a.length < 12 || t % 120 === 0);

  if (data.length < 2) return <p className="muted">Missione troppo breve per tracciare i parametri.</p>;
  return (
    <div className="strip">
      <div className="strip-scroll">
        <svg
          viewBox={`0 0 ${W} ${totalH}`}
          className="strip-svg"
          role="img"
          aria-label="Andamento di SpO₂, frequenza cardiaca e pressione sistolica durante la missione"
          onPointerMove={(e) => {
            const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
            const px = ((e.clientX - r.left) / r.width) * W;
            if (px < L) return setHover(null);
            setHover(((px - L) / (W - L - R)) * tMax);
          }}
          onPointerLeave={() => setHover(null)}
        >
          <rect x="0" y="0" width={W} height={totalH} fill="var(--strip-bg)" />
          {/* griglia millimetrata */}
          {Array.from({ length: Math.ceil((W - L) / 12) }).map((_, i) => (
            <line key={i} x1={L + i * 12} x2={L + i * 12} y1={TOP - 6} y2={totalH - 18} stroke="var(--strip-grid)" strokeWidth={i % 5 === 0 ? 1 : 0.5} />
          ))}
          {/* marcatori (etichette sfalsate su due righe per evitare sovrapposizioni) */}
          {(() => {
            let lastX = [-1e9, -1e9];
            return markers.map((m, i) => {
              const mx = x(m.t);
              const row = mx - lastX[0] >= 74 ? 0 : mx - lastX[1] >= 74 ? 1 : 0;
              lastX = row === 0 ? [mx, lastX[1]] : [lastX[0], mx];
              return (
                <g key={i}>
                  <line x1={mx} x2={mx} y1={TOP - 4} y2={totalH - 18} stroke="var(--strip-mark)" strokeWidth="1.2" strokeDasharray="3 3" />
                  <text x={mx + 3} y={row === 0 ? TOP - 8 : TOP - 18} fontSize="11" fill="var(--strip-mark)" fontFamily="var(--f-display)" fontWeight="700">
                    {m.label}
                  </text>
                </g>
              );
            });
          })()}
          {PANELS.map((p, i) => {
            const y0 = TOP + i * (PH + GAP);
            const y = (v: number) => y0 + PH - ((Math.max(p.min, Math.min(p.max, v)) - p.min) / (p.max - p.min)) * PH;
            let pen = false;
            const path = data
              .map((d) => {
                const val = d[p.key];
                if (val === null) {
                  pen = false;
                  return '';
                }
                const cmd = `${pen ? 'L' : 'M'}${x(d.t).toFixed(1)} ${y(val).toFixed(1)}`;
                pen = true;
                return cmd;
              })
              .join(' ');
            return (
              <g key={p.key}>
                <text x={L} y={y0 - 8} fontSize="12" fill="var(--strip-ink)" fontFamily="var(--f-display)" fontWeight="700">
                  {p.label}
                </text>
                {p.ticks.map((tk) => (
                  <g key={tk}>
                    <line x1={L} x2={W - R} y1={y(tk)} y2={y(tk)} stroke="var(--strip-grid)" strokeWidth="1" />
                    <text x={L - 6} y={y(tk) + 4} fontSize="10" textAnchor="end" fill="var(--strip-muted)" className="num">
                      {tk}
                    </text>
                  </g>
                ))}
                <path d={path} fill="none" stroke="var(--strip-ink)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                {near && near[p.key] !== null && <circle cx={x(near.t)} cy={y(near[p.key] as number)} r="4" fill="var(--strip-bg)" stroke="var(--strip-ink)" strokeWidth="2" />}
              </g>
            );
          })}
          {minuteTicks.map((t) => (
            <text key={t} x={x(t)} y={totalH - 4} fontSize="10" textAnchor="middle" fill="var(--strip-muted)">
              {Math.round(t / 60)}′
            </text>
          ))}
          {near && <line x1={x(near.t)} x2={x(near.t)} y1={TOP - 4} y2={totalH - 18} stroke="var(--strip-ink)" strokeWidth="1" opacity="0.5" />}
        </svg>
        {near && (
          <div className="strip-tip" style={{ left: `${(x(near.t) / W) * 100}%` }}>
            <strong className="num">{fmtClock(near.t)}</strong>
            <span>SpO₂ {near.spo2 ?? '–'}%</span>
            <span>FC {near.hr || '–'}</span>
            <span>PAS {near.sbp || '–'}</span>
          </div>
        )}
      </div>
      <button className="btn btn-small btn-ink" onClick={() => setTable((t) => !t)} aria-expanded={table}>
        {table ? 'Nascondi la tabella' : 'Mostra i valori in tabella'}
      </button>
      {table && (
        <div className="strip-table">
          <table>
            <thead>
              <tr>
                <th>Tempo</th>
                <th>SpO₂ %</th>
                <th>FC</th>
                <th>PAS</th>
                <th>FR</th>
              </tr>
            </thead>
            <tbody>
              {data
                .filter((d) => d.t % 30 === 0)
                .map((d) => (
                  <tr key={d.t}>
                    <td className="num">{fmtClock(d.t)}</td>
                    <td className="num">{d.spo2 ?? '–'}</td>
                    <td className="num">{d.hr}</td>
                    <td className="num">{d.sbp}</td>
                    <td className="num">{d.rr}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
