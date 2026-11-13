import { useEffect, useRef } from 'react';
import type { Sim } from '../../engine/engine';

function ago(sim: Sim, t: number | undefined) {
  if (t === undefined) return '';
  const d = sim.t - t;
  if (d < 60) return 'ora';
  return `${Math.floor(d / 60)} min fa`;
}

/** Curva pletismografica disegnata su canvas, sincronizzata con la frequenza. */
function Pleth({ sim, active }: { sim: Sim; active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const simRef = useRef(sim);
  simRef.current = sim;
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const g = c.getContext('2d');
    if (!g) return;
    let raf = 0;
    let x = 0;
    let phase = 0;
    let last = performance.now();
    let prevY = 0;
    const draw = (now: number) => {
      const dpr = window.devicePixelRatio || 1;
      const w = c.clientWidth;
      const h = c.clientHeight;
      if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        g.fillStyle = '#050b12';
        g.fillRect(0, 0, w, h);
        x = 0;
      }
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const s = simRef.current;
      const hr = s.p.v.hr;
      const perfusing = active && !s.inArrest() && s.p.v.sbp > 55;
      const speed = 60; // px/s
      const steps = Math.max(1, Math.round(dt * speed));
      for (let i = 0; i < steps; i++) {
        phase += perfusing ? hr / 60 / speed : 0;
        const ph = phase % 1;
        let yv = 0;
        if (perfusing) {
          // onda pletismografica: salita rapida, discesa con incisura dicrota
          yv = ph < 0.18 ? Math.sin((ph / 0.18) * Math.PI * 0.5) : Math.exp(-(ph - 0.18) * 3.2) * (1 + 0.12 * Math.sin((ph - 0.18) * 18));
          yv *= Math.min(1, s.p.v.sbp / 110);
        } else if (active) {
          yv = (Math.random() - 0.5) * 0.04;
        }
        const y = h * 0.82 - yv * h * 0.62;
        g.fillStyle = '#050b12';
        g.fillRect(x, 0, 14, h);
        if (active) {
          g.strokeStyle = '#46d5f7';
          g.lineWidth = 2;
          g.beginPath();
          g.moveTo(x - 1, prevY || y);
          g.lineTo(x, y);
          g.stroke();
        }
        prevY = y;
        x += 1;
        if (x > w) {
          x = 0;
          prevY = 0;
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [active]);
  return <canvas ref={ref} className="pleth" aria-hidden="true" />;
}

export function Monitor({ sim }: { sim: Sim }) {
  const v = sim.p.v;
  const m = sim.measurements;
  const ox = sim.pulseOx;
  const noSignal = ox && (sim.inArrest() || v.sbp < 55);
  const spo2 = Math.round(v.spo2 + (sim.t % 7 === 0 ? -1 : 0));
  const hr = Math.round(v.hr + ((sim.t * 7) % 3) - 1);
  const spo2Alarm = ox && !noSignal && spo2 < 90;
  const hrAlarm = ox && !noSignal && (hr > 130 || hr < 45);
  const pa = m.get('pa');
  const fr = m.get('fr');
  const glu = m.get('glicemia');
  const tmp = m.get('temperatura');
  return (
    <section className="monitor" aria-label="Monitor dei parametri">
      <header className="monitor-head">
        <span className="monitor-brand">Parametri</span>
        <span className="monitor-o2">{sim.o2 ? (sim.o2.device === 'venturi' ? `O₂ Venturi ${sim.o2.fio2}%` : `O₂ ${sim.o2.flow} L/min · ${sim.o2.device}`) : sim.bvm ? 'Ventilazione assistita' : 'aria ambiente'}</span>
      </header>
      <div className="monitor-row">
        <div className={`mtile mt-spo2${spo2Alarm ? ' alarm' : ''}`}>
          <span className="mt-label">SpO₂ %</span>
          <span className="mt-value num">{!ox ? '––' : noSignal ? '?' : spo2}</span>
          {noSignal && <span className="mt-note">nessun segnale</span>}
        </div>
        <div className={`mtile mt-fc${hrAlarm ? ' alarm' : ''}`}>
          <span className="mt-label">FC /min {ox && !noSignal && <span className="heart" style={{ animationDuration: `${60 / Math.max(30, hr)}s` }}>♥</span>}</span>
          <span className="mt-value num">{!ox ? '––' : noSignal ? '?' : hr}</span>
        </div>
      </div>
      <Pleth sim={sim} active={ox} />
      <div className="monitor-grid">
        <div className="mtile small mt-pa">
          <span className="mt-label">PA mmHg</span>
          <span className="mt-value num">{pa ? pa.value.replace(' mmHg', '') : '––'}</span>
          <span className="mt-note">{pa ? ago(sim, pa.t) : 'da misurare'}</span>
        </div>
        <div className="mtile small mt-fr">
          <span className="mt-label">FR /min</span>
          <span className="mt-value num">{fr ? fr.value.replace('/min', '') : '––'}</span>
          <span className="mt-note">{fr ? ago(sim, fr.t) : 'da contare'}</span>
        </div>
        <div className="mtile small mt-glu">
          <span className="mt-label">Glicemia</span>
          <span className="mt-value num">{glu ? glu.value.replace(' mg/dL', '') : '––'}</span>
          <span className="mt-note">{glu ? 'mg/dL · infermiere' : 'la misura l’infermiere'}</span>
        </div>
        <div className="mtile small mt-temp">
          <span className="mt-label">Temp. °C</span>
          <span className="mt-value num">{tmp ? tmp.value.replace(' °C', '') : '––'}</span>
          <span className="mt-note">{tmp ? ago(sim, tmp.t) : ''}</span>
        </div>
      </div>
    </section>
  );
}
