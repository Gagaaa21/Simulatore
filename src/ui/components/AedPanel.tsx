import { useEffect, useRef } from 'react';
import type { Sim } from '../../engine/engine';
import { fmtClock } from '../../engine/engine';

function Rhythm({ sim }: { sim: Sim }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const simRef = useRef(sim);
  simRef.current = sim;
  useEffect(() => {
    const c = ref.current;
    const g = c?.getContext('2d');
    if (!c || !g) return;
    let raf = 0;
    let x = 0;
    let t = 0;
    let prev = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dpr = window.devicePixelRatio || 1;
      const w = c.clientWidth;
      const h = c.clientHeight;
      if (c.width !== Math.round(w * dpr)) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        g.fillStyle = '#16200f';
        g.fillRect(0, 0, w, h);
      }
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const s = simRef.current;
      const steps = Math.max(1, Math.round(dt * 70));
      for (let i = 0; i < steps; i++) {
        t += 1 / 70;
        let y = 0;
        const r = s.p.rhythm;
        if (s.cpr.active) {
          y = Math.sin(t * Math.PI * 2 * 1.85) * 0.55; // artefatto delle compressioni
        } else if (r === 'fv') {
          y = Math.sin(t * 31) * 0.35 + Math.sin(t * 19 + 1) * 0.25 + Math.sin(t * 7) * 0.15;
        } else if (r === 'tv_senza_polso') {
          y = Math.sin(t * Math.PI * 2 * 3) * 0.7;
        } else if (r === 'asistolia') {
          y = (Math.random() - 0.5) * 0.03;
        } else {
          const hr = Math.max(30, s.p.v.hr || 70);
          const ph = (t * hr) / 60 % 1;
          y = ph < 0.04 ? -0.15 : ph < 0.07 ? 0.95 : ph < 0.1 ? -0.3 : ph > 0.3 && ph < 0.42 ? 0.18 * Math.sin(((ph - 0.3) / 0.12) * Math.PI) : 0;
        }
        const py = h / 2 - y * h * 0.38;
        g.fillStyle = '#16200f';
        g.fillRect(x, 0, 10, h);
        g.strokeStyle = '#b7f26b';
        g.lineWidth = 1.6;
        g.beginPath();
        g.moveTo(x - 1, prev || py);
        g.lineTo(x, py);
        g.stroke();
        prev = py;
        x = (x + 1) % w;
        if (x === 0) prev = 0;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="aed-ecg" aria-hidden="true" />;
}

const PHASE_LABEL: Record<string, string> = {
  spento: 'Spento',
  acceso: 'Applicare le piastre',
  analisi: 'Analisi in corso',
  carica: 'Carica',
  pronto: 'Shock pronto',
  erogato: 'Shock erogato',
  non_consigliato: 'Shock non consigliato',
  rcp: 'RCP',
};

export function AedPanel({ sim, onAction, available }: { sim: Sim; onAction: (id: string) => void; available: boolean }) {
  const a = sim.aed;
  const on = a.phase !== 'spento';
  const ready = a.phase === 'pronto';
  const rcpLeft = a.phase === 'rcp' ? Math.max(0, 120 - (sim.t - a.phaseAt)) : null;
  if (!available) {
    return (
      <section className="aed aed-missing" aria-label="Defibrillatore">
        <p className="aed-missing-text">{sim.aedFetchAt !== null ? `DAE in arrivo tra ${fmtClock(sim.aedFetchAt - sim.t)}` : 'Nessun DAE con te'}</p>
      </section>
    );
  }
  return (
    <section className={`aed${ready ? ' aed-ready' : ''}`} aria-label="Defibrillatore semiautomatico">
      <div className="aed-top">
        <button className={`aed-power${on ? ' on' : ''}`} onClick={() => !on && onAction('dae_accendi')} aria-label="Accendi il DAE" disabled={on}>
          <span aria-hidden="true">⏻</span>
        </button>
        <div className="aed-screen">
          <div className="aed-phase">
            <span>{PHASE_LABEL[a.phase]}</span>
            <span className="num">{on ? `shock ${a.shocks}` : ''}</span>
          </div>
          {on && a.pads && a.pads !== 'errata' ? <Rhythm sim={sim} /> : <div className="aed-ecg aed-ecg-off" />}
          <p className="aed-prompt" aria-live="assertive">
            {on ? a.prompt : 'Premi il pulsante verde per accendere'}
          </p>
          {rcpLeft !== null && <div className="aed-timer num">prossima analisi tra {fmtClock(rcpLeft)}</div>}
        </div>
      </div>
      <div className="aed-bottom">
        <button className="aed-btn" disabled={!on || (!!a.pads && a.pads !== 'errata')} onClick={() => onAction('dae_piastre')}>
          {a.pads && a.pads !== 'errata' ? 'Piastre applicate' : 'Applica piastre'}
        </button>
        <button className="aed-btn" disabled={!on} onClick={() => onAction('allontanatevi')}>
          Via tutti!
        </button>
        <button className={`aed-shock${ready ? ' blink' : ''}`} disabled={!ready} onClick={() => sim.aedShock()} aria-label="Eroga lo shock">
          <span aria-hidden="true">⚡</span>
        </button>
      </div>
    </section>
  );
}
