import { useCallback, useEffect, useRef, useState } from 'react';
import { RateGauge } from '../components/CprPanel';
import { SourceChips } from '../components/SourceChip';
import { Floor, W, H } from '../art/Floors';
import { PatientFigure } from '../art/Patient';
import { bodyGeometry } from '../art/body';
import type { Patient } from '../../engine/types';
import { loadCareer, loadExtra, saveCareer, saveExtra } from '../store';
import { unlockBadge } from '../../data/career';
import { sfx } from '../audio';

type Victim = 'adulto' | 'bambino' | 'lattante';
type Ratio = '30:2' | '15:2' | 'continue';

const VICTIM_INFO: Record<Victim, { label: string; depth: string; tech: string; ratio: Ratio }> = {
  adulto: { label: 'Adulto', depth: '5–6 cm', tech: 'Due mani sovrapposte, metà inferiore dello sterno, braccia tese.', ratio: '30:2' },
  bambino: { label: 'Bambino (1–12 anni)', depth: 'almeno 1/3 del torace (circa 5 cm)', tech: 'Una o due mani a seconda della corporatura.', ratio: '15:2' },
  lattante: { label: 'Lattante (< 1 anno)', depth: 'almeno 1/3 del torace (circa 4 cm)', tech: 'Due pollici avvolgenti sulla metà inferiore dello sterno.', ratio: '15:2' },
};

function mannequin(v: Victim): Patient {
  const build = v === 'adulto' ? 'adulto' : v === 'bambino' ? 'bambino' : 'neonato';
  return {
    name: 'manichino',
    age: v === 'adulto' ? 40 : v === 'bambino' ? 6 : 0.5,
    sex: 'M',
    weightKg: 70,
    avpu: 'U',
    gcs: 3,
    airway: 'pervie',
    breathing: 'assente',
    rhythm: 'asistolia',
    pulseRadial: false,
    v: { hr: 0, rr: 0, spo2: 0, sbp: 0, dbp: 0, glu: 100, temp: 36, crt: 6 },
    spo2Air: 0,
    skin: { color: 'rosea', temp: 'normale', sweaty: false },
    pupils: 'normali',
    speech: 'assente',
    position: 'supino',
    canSwallow: false,
    seizing: false,
    vomitInMouth: false,
    bloodLossMl: 0,
    notes: [],
    look: { skinTone: '#e6c3a8', hair: '#7d6a58', hairStyle: v === 'adulto' ? 'corti' : 'bimbo', shirt: '#d65d4a', pants: '#2e4a6b', build },
  };
}

interface Stats {
  compressions: number;
  inRange: number;
  intervals: number[];
  handsOff: number; // s di pausa oltre quelle per le ventilazioni
  vents: number;
  ventOk: number;
}

export function CprTrainer({ onBack }: { onBack: () => void }) {
  const [victim, setVictim] = useState<Victim>('adulto');
  const [ratio, setRatio] = useState<Ratio>('30:2');
  const [metro, setMetro] = useState(true);
  const [running, setRunning] = useState(false);
  const [left, setLeft] = useState(120);
  const [rate, setRate] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [vent, setVent] = useState(0);
  const [press, setPress] = useState(0);
  const [result, setResult] = useState<Stats | null>(null);
  const taps = useRef<number[]>([]);
  const stats = useRef<Stats>({ compressions: 0, inRange: 0, intervals: [], handsOff: 0, vents: 0, ventOk: 0 });
  const lastAct = useRef(0);

  const per = ratio === '30:2' ? 30 : ratio === '15:2' ? 15 : Infinity;
  const needVent = ratio !== 'continue' && cycle >= per && vent < 2;

  const start = () => {
    taps.current = [];
    stats.current = { compressions: 0, inRange: 0, intervals: [], handsOff: 0, vents: 0, ventOk: 0 };
    setCycle(0);
    setVent(0);
    setRate(0);
    setLeft(120);
    setResult(null);
    lastAct.current = performance.now();
    setRunning(true);
  };

  const finish = useCallback(() => {
    setRunning(false);
    const st = { ...stats.current };
    setResult(st);
    const pct = st.compressions ? Math.round((st.inRange / st.compressions) * 100) : 0;
    const best = Math.max(loadExtra().cprBest ?? 0, pct);
    saveExtra({ cprBest: best });
    if (pct >= 85) {
      const u = unlockBadge(loadCareer(), 'ritmo');
      if (u.earned) saveCareer(u.career);
    }
    sfx('ok');
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          finish();
          return 0;
        }
        return l - 1;
      });
      const idle = (performance.now() - lastAct.current) / 1000;
      if (idle > 1.2) stats.current.handsOff += 1;
      if (idle > 1.6) setRate(0);
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, finish]);

  useEffect(() => {
    if (!running || !metro) return;
    const id = window.setInterval(() => sfx('metronomo'), 60000 / 110);
    return () => window.clearInterval(id);
  }, [running, metro]);

  const compress = useCallback(() => {
    if (!running || needVent) return;
    const now = performance.now();
    const arr = taps.current;
    if (arr.length) {
      const d = now - arr[arr.length - 1];
      if (d < 1500) {
        const r = 60000 / d;
        stats.current.intervals.push(d);
        if (r >= 97 && r <= 123) stats.current.inRange++;
      }
    }
    arr.push(now);
    if (arr.length > 8) arr.shift();
    if (arr.length >= 3) {
      const ints = arr.slice(1).map((t, i) => t - arr[i]).filter((x) => x < 1500);
      if (ints.length) setRate(Math.round(60000 / (ints.reduce((a, b) => a + b, 0) / ints.length)));
    }
    stats.current.compressions++;
    lastAct.current = now;
    setCycle((c) => c + 1);
    setVent(0);
    setPress((p) => p + 1);
  }, [running, needVent]);

  const ventilate = useCallback(() => {
    if (!running || !needVent) return;
    stats.current.vents++;
    const sinceLast = (performance.now() - lastAct.current) / 1000;
    if (sinceLast < 6) stats.current.ventOk++;
    lastAct.current = performance.now();
    setVent((v) => {
      const n = v + 1;
      if (n >= 2) {
        setCycle(0);
        taps.current = [];
      }
      return n;
    });
  }, [running, needVent]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        compress();
      } else if (e.key === 'v' || e.key === 'V') ventilate();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [compress, ventilate]);

  const info = VICTIM_INFO[victim];
  const pct = result && result.compressions ? Math.round((result.inRange / result.compressions) * 100) : 0;
  const avgRate = result && result.intervals.length ? Math.round(60000 / (result.intervals.reduce((a, b) => a + b, 0) / result.intervals.length)) : 0;
  const geoM = bodyGeometry(victim === 'adulto' ? 'adulto' : victim === 'bambino' ? 'bambino' : 'neonato');
  const hx = geoM.sternum.x;

  return (
    <div className="page rcp">
      <header className="page-head">
        <button className="back" onClick={onBack}>
          ‹ Menu
        </button>
        <div>
          <p className="muted">Allenamento</p>
          <h1>RCP a ritmo</h1>
          <p className="muted">
            Due minuti di compressioni: il tempo dopo cui si cambia compressore. Premi la barra spaziatrice (o tocca il pulsante) a ogni compressione e V per le ventilazioni. <SourceChips ids={['ERC_BLS_2025', 'ERC_PLS_2025']} />
          </p>
        </div>
      </header>
      <div className="rcp-grid">
        <section className="rcp-setup">
          <h3 className="mini-h">Vittima</h3>
          <div className="seg seg-wrap">
            {(Object.keys(VICTIM_INFO) as Victim[]).map((v) => (
              <button key={v} className={victim === v ? 'on' : ''} disabled={running} onClick={() => {
                setVictim(v);
                setRatio(VICTIM_INFO[v].ratio);
              }}>
                {VICTIM_INFO[v].label}
              </button>
            ))}
          </div>
          <h3 className="mini-h">Rapporto</h3>
          <div className="seg seg-wrap">
            {(['30:2', '15:2', 'continue'] as Ratio[]).map((r) => (
              <button key={r} className={ratio === r ? 'on' : ''} disabled={running} onClick={() => setRatio(r)}>
                {r === 'continue' ? 'Solo compressioni' : r}
              </button>
            ))}
          </div>
          <dl className="numbers">
            <div>
              <dt>Frequenza</dt>
              <dd className="num">100–120/min</dd>
            </div>
            <div>
              <dt>Profondità</dt>
              <dd className="num" style={{ fontSize: 'var(--t-16)' }}>
                {info.depth}
              </dd>
            </div>
          </dl>
          <p className="muted">{info.tech}</p>
          <p className="muted">
            {victim === 'adulto'
              ? 'Adulto: 30:2 se addestrato a ventilare, altrimenti compressioni continue.'
              : 'Bambino e lattante: 5 ventilazioni iniziali, poi 15:2 se addestrato in PBLS (altrimenti 30:2).'}
          </p>
          <label className="check">
            <input type="checkbox" id="rcp-metro" checked={metro} onChange={(e) => setMetro(e.target.checked)} /> Metronomo a 110/min
          </label>
          {!running && (
            <button className="btn btn-big btn-arancio" onClick={start}>
              {result ? 'Ricomincia' : 'Inizia i 2 minuti'}
            </button>
          )}
          {running && (
            <button className="btn" onClick={finish}>
              Termina
            </button>
          )}
        </section>
        <section className="rcp-stage">
          <div className="scene">
            <svg viewBox={`150 160 ${W - 300} ${H - 300}`} className="scene-svg" role="img" aria-label="Manichino">
              <defs>
                <filter id="sfoca" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="10" />
                </filter>
              </defs>
              <Floor setting="casa" timeOfDay="giorno" />
              <PatientFigure p={mannequin(victim)} arrest cprActive={false} breathingRate={0} hoverRegion={null} />
              <g key={press} className={running ? 'press-once' : ''}>
                <ellipse cx={hx} cy="300" rx={victim === 'lattante' ? 12 : 20} ry={victim === 'lattante' ? 14 : 24} fill="#4f7fd6" stroke="#2f5cac" strokeWidth="2" />
              </g>
            </svg>
            <div className="rcp-timer num">{Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</div>
          </div>
          <RateGauge rate={rate} />
          <div className="cpr-counter">
            <span className="num big">{rate || '––'}</span>
            <span className="unit">/min</span>
            <span className="num cycle">{ratio === 'continue' ? `${stats.current.compressions} compressioni` : needVent ? `Ventila (${vent}/2) – tasto V` : `${cycle}/${per}`}</span>
          </div>
          <div className="cpr-pad-row">
            <button className="cpr-pad" disabled={!running || needVent} onPointerDown={(e) => {
              e.preventDefault();
              compress();
            }}>
              Comprimi
              <small>tocca o barra spaziatrice</small>
            </button>
            <button className="cpr-pad vent" disabled={!running || !needVent} onClick={ventilate}>
              Ventila
              <small>tasto V</small>
            </button>
          </div>
          {result && (
            <div className="rcp-result">
              <div className="tri-score">
                <span className="num">{pct}%</span>
                <small>compressioni nel ritmo corretto</small>
              </div>
              <ul className="tri-facts">
                <li>
                  Compressioni: <strong className="num">{result.compressions}</strong>, frequenza media <strong className="num">{avgRate || '–'}/min</strong>
                </li>
                <li>
                  Pause oltre il necessario: <strong className="num">{result.handsOff} s</strong> {result.handsOff > 20 ? '— troppo lunghe: ogni pausa fa crollare la pressione di perfusione.' : ''}
                </li>
                {ratio !== 'continue' && (
                  <li>
                    Ventilazioni: <strong className="num">{result.vents}</strong>, eseguite rapidamente <strong className="num">{result.ventOk}</strong>
                  </li>
                )}
                <li>{pct >= 80 ? 'Ottimo ritmo: ora cambio compressore!' : avgRate > 120 ? 'Troppo veloce: oltre 120/min il cuore non si riempie bene.' : avgRate && avgRate < 100 ? 'Troppo lento: sotto 100/min il flusso è insufficiente.' : 'Cerca di restare stabilmente tra 100 e 120/min.'}</li>
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
