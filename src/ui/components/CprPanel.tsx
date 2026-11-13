import { useCallback, useEffect, useRef, useState } from 'react';
import type { Sim } from '../../engine/engine';
import { fmtClock } from '../../engine/engine';
import { sfx } from '../audio';

/** Calcolo della frequenza dalle ultime pressioni. */
export function useCompressionPad(target: { min: number; max: number } = { min: 100, max: 120 }) {
  const taps = useRef<number[]>([]);
  const [rate, setRate] = useState(0);
  const [inRange, setInRange] = useState(0);
  const [count, setCount] = useState(0);
  const press = useCallback(() => {
    const now = performance.now();
    const arr = taps.current;
    arr.push(now);
    if (arr.length > 12) arr.shift();
    if (arr.length >= 3) {
      const ints = arr.slice(1).map((t, i) => t - arr[i]).filter((d) => d < 1500);
      if (ints.length) {
        const avg = ints.reduce((a, b) => a + b, 0) / ints.length;
        const r = Math.round(60000 / avg);
        setRate(r);
        const ok = ints.filter((d) => {
          const rr = 60000 / d;
          return rr >= target.min - 3 && rr <= target.max + 3;
        }).length;
        setInRange(ok / ints.length);
      }
    }
    setCount((c) => c + 1);
  }, [target.min, target.max]);
  const reset = useCallback(() => {
    taps.current = [];
    setCount(0);
  }, []);
  // se smetti di premere la frequenza decade
  useEffect(() => {
    const id = window.setInterval(() => {
      const last = taps.current[taps.current.length - 1];
      if (last && performance.now() - last > 1600) {
        setRate(0);
        setInRange(0);
      }
    }, 400);
    return () => window.clearInterval(id);
  }, []);
  return { rate, inRange, count, press, reset };
}

export function RateGauge({ rate, min = 100, max = 120 }: { rate: number; min?: number; max?: number }) {
  const lo = 60;
  const hi = 160;
  const pct = (x: number) => ((Math.max(lo, Math.min(hi, x)) - lo) / (hi - lo)) * 100;
  const ok = rate >= min && rate <= max;
  return (
    <div className="gauge" role="meter" aria-valuemin={lo} aria-valuemax={hi} aria-valuenow={rate} aria-label="Frequenza compressioni">
      <div className="gauge-band" style={{ left: `${pct(min)}%`, width: `${pct(max) - pct(min)}%` }} />
      {rate > 0 && <div className={`gauge-needle${ok ? ' ok' : ''}`} style={{ left: `${pct(rate)}%` }} />}
      <div className="gauge-ticks">
        <span>60</span>
        <span>100</span>
        <span>120</span>
        <span>160</span>
      </div>
    </div>
  );
}

export function CprPanel({ sim, onAction, suggestRatio }: { sim: Sim; onAction: (id: string) => void; suggestRatio?: '15:2' }) {
  const c = sim.cpr;
  const [mine, setMine] = useState(false);
  const [metro, setMetro] = useState(true);
  const [vent, setVent] = useState(0);
  const per = c.ratio === '15:2' ? 15 : 30;
  const pad = useCompressionPad();
  const padRef = useRef(pad);
  padRef.current = pad;

  // il giocatore comprime
  useEffect(() => {
    if (!mine) return;
    if (!c.active) sim.startCpr('giocatore');
    else {
      c.by = 'giocatore';
      c.compressorSince = sim.t;
    }
    sim.emit();
    return () => {
      if (sim.cpr.active && sim.cpr.by === 'giocatore') {
        sim.cpr.by = 'equipaggio';
        sim.cpr.quality = 0.88;
        sim.cpr.compressorSince = sim.t;
        sim.say('azione', 'Un collega riprende le compressioni.');
        sim.emit();
      }
    };
  }, [mine]); // eslint-disable-line react-hooks/exhaustive-deps

  // dopo una pausa (analisi del DAE) le compressioni riprendono con te
  useEffect(() => {
    if (mine && c.active && c.by !== 'giocatore') {
      c.by = 'giocatore';
      c.compressorSince = sim.t;
    }
  }, [mine, c.active]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mine) return;
    const q = pad.rate === 0 ? 0.2 : 0.35 + pad.inRange * 0.6;
    sim.cpr.quality = sim.cpr.quality * 0.7 + q * 0.3;
  }, [pad.rate, pad.inRange, mine, sim]);

  // metronomo
  useEffect(() => {
    if (!mine || !metro) return;
    const id = window.setInterval(() => sfx('metronomo'), 60000 / 110);
    return () => window.clearInterval(id);
  }, [mine, metro]);

  const cycleCount = pad.count % per;
  const needVent = mine && c.ratio !== 'solo_compressioni' && pad.count > 0 && cycleCount === 0 && vent < 2;

  const compress = useCallback(() => {
    if (needVent) return;
    padRef.current.press();
    setVent(0);
  }, [needVent]);

  useEffect(() => {
    if (!mine) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        compress();
      } else if (e.key === 'v' || e.key === 'V') {
        setVent((v) => Math.min(2, v + 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mine, compress]);

  // compare quando l'arresto è stato riconosciuto (o la RCP è già iniziata), non prima
  if (!c.active && !(sim.inArrest() && sim.arrest.recognizedAt !== null)) return null;
  const since = c.active ? sim.t - c.compressorSince : 0;
  const tired = since >= 120;
  const who = c.by === 'giocatore' || sim.scenario.role === 'laico' ? 'tu' : c.by === 'astante' ? 'un astante' : 'un collega';
  return (
    <section className={`cpr${c.active ? ' on' : ''}`} aria-label="Rianimazione cardiopolmonare">
      <div className="cpr-head">
        <div>
          <h3>{c.active ? 'RCP in corso' : 'RCP ferma'}</h3>
          <p className="cpr-sub">{c.active ? `Comprime ${who} · ${c.ratio === 'solo_compressioni' ? 'solo compressioni' : c.ratio}` : 'Compressioni ferme.'}</p>
        </div>
        {c.active && (
          <div className={`cpr-ring${tired ? ' tired' : ''}`} style={{ ['--p' as string]: `${Math.min(1, since / 120) * 360}deg` }}>
            <span className="num">{fmtClock(since)}</span>
          </div>
        )}
      </div>
      {c.active && (
        <div className="cpr-quality">
          <span>Qualità</span>
          <div className="bar">
            <div className={`bar-fill${c.quality < 0.6 ? ' low' : ''}`} style={{ width: `${Math.round(c.quality * 100)}%` }} />
          </div>
        </div>
      )}
      {!c.active && (
        <button className="btn btn-big btn-arancio" onClick={() => onAction('rcp')}>
          Inizia le compressioni
        </button>
      )}
      {c.active && (
        <div className="cpr-actions">
          {sim.scenario.crew > 1 && (
            <button className="btn" onClick={() => onAction('cambio_compressore')}>
              {sim.scenario.role === 'laico' ? 'Fatti dare il cambio' : 'Cambio compressore'}
            </button>
          )}
          <button className={`btn${mine ? ' btn-on' : ''}`} onClick={() => setMine((m) => !m)} aria-pressed={mine}>
            {mine ? 'Smetti il minigioco' : sim.scenario.role === 'laico' ? 'Comprimi a ritmo (minigioco)' : 'Comprimi tu'}
          </button>
          <div className="seg" role="group" aria-label="Rapporto compressioni ventilazioni">
            {(['30:2', '15:2'] as const).map((r) => (
              <button
                key={r}
                className={`${c.ratio === r ? 'on' : ''}${suggestRatio === r && c.ratio !== r ? ' seg-next' : ''}`}
                onClick={() => {
                  sim.cpr.ratio = r;
                  sim.set('ratioScelto', r);
                  sim.emit();
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}
      {mine && c.active && (
        <div className="cpr-game">
          <RateGauge rate={pad.rate} />
          <div className="cpr-counter">
            <span className="num big">{pad.rate || '––'}</span>
            <span className="unit">/min</span>
            <span className="num cycle">
              {needVent ? `Ventila (${vent}/2) – tasto V` : `${cycleCount || (pad.count ? per : 0)}/${per}`}
            </span>
          </div>
          <div className="cpr-pad-row">
            <button className="cpr-pad" onPointerDown={(e) => { e.preventDefault(); compress(); }} disabled={needVent}>
              Comprimi
              <small>tocca o barra spaziatrice</small>
            </button>
            <button className="cpr-pad vent" onClick={() => setVent((v) => Math.min(2, v + 1))} disabled={!needVent}>
              Ventila
              <small>tasto V</small>
            </button>
          </div>
          <label className="check">
            <input type="checkbox" id="metro" checked={metro} onChange={(e) => setMetro(e.target.checked)} /> Metronomo a 110/min
          </label>
        </div>
      )}
    </section>
  );
}
