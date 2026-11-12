import { useMemo, useState } from 'react';
import { COST, TAG_INFO, VICTIMS, WALKING, type Tag, type Victim } from '../../data/triage';
import { Floor, W, H } from '../art/Floors';
import { PatientFigure } from '../art/Patient';
import type { Patient } from '../../engine/types';
import { fmtClock } from '../../engine/engine';
import { loadExtra, saveExtra } from '../store';
import { SourceChips } from '../components/SourceChip';
import { sfx } from '../audio';

interface VState {
  checks: string[];
  findings: string[];
  tag: Tag | null;
  time: number; // secondi spesi su questo ferito
  airwayOpened: boolean;
  rescue: boolean;
  bleedingControlled: boolean;
}

function toPatient(v: Victim, st: VState): Patient {
  const breathing = v.breathes || (st.airwayOpened && v.breathesAfterAirway) || (st.rescue && v.breathesAfterRescue);
  return {
    name: v.label,
    age: v.age,
    sex: v.sex,
    weightKg: v.child ? 20 : 70,
    avpu: v.avpu === 'Pinappropriato' ? 'P' : v.avpu,
    gcs: 15,
    airway: 'pervie',
    breathing: breathing ? 'normale' : 'assente',
    rhythm: 'sinusale',
    pulseRadial: v.radial,
    v: { hr: 100, rr: breathing ? v.rr : 0, spo2: 94, sbp: 110, dbp: 70, glu: 100, temp: 36.5, crt: v.crt },
    spo2Air: 94,
    skin: { color: v.correct === 'nero' ? 'grigiastra' : !v.radial ? 'pallida' : 'rosea', temp: 'normale', sweaty: !v.radial },
    pupils: 'normali',
    speech: v.avpu === 'A' ? 'normale' : 'assente',
    position: 'supino',
    canSwallow: true,
    seizing: false,
    vomitInMouth: false,
    bloodLossMl: 0,
    notes: [],
    look: v.look,
  };
}

const fresh = (): VState => ({ checks: [], findings: [], tag: null, time: 0, airwayOpened: false, rescue: false, bleedingControlled: false });

export function TriageGame({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<'intro' | 'campo' | 'esito'>('intro');
  const [walkCalled, setWalkCalled] = useState(false);
  const [clock, setClock] = useState(0);
  const [cur, setCur] = useState(0);
  const [st, setSt] = useState<Record<string, VState>>(() => Object.fromEntries(VICTIMS.map((v) => [v.id, fresh()])));
  const [showAlgo, setShowAlgo] = useState(false);

  const v = VICTIMS[cur];
  const s = st[v.id];
  const spend = (sec: number, patch: Partial<VState>, finding?: string, check?: string) => {
    setClock((c) => c + sec);
    setSt((all) => {
      const prev = all[v.id];
      return {
        ...all,
        [v.id]: {
          ...prev,
          ...patch,
          time: prev.time + sec,
          checks: check ? [...prev.checks, check] : prev.checks,
          findings: finding ? [...prev.findings, finding] : prev.findings,
        },
      };
    });
    sfx('click');
  };

  const breathingNow = v.breathes || (s.airwayOpened && v.breathesAfterAirway) || (s.rescue && !!v.breathesAfterRescue);

  const doCheck = (k: string) => {
    switch (k) {
      case 'respira':
        spend(COST.respira, {}, breathingNow ? 'Respira.' : 'Non respira.', k);
        break;
      case 'vie_aeree':
        spend(COST.vie_aeree, { airwayOpened: true }, v.breathesAfterAirway ? 'Apri le vie aeree: riprende a respirare!' : 'Apri le vie aeree: continua a non respirare.', k);
        break;
      case 'ventilazioni':
        spend(COST.ventilazioni, { rescue: true }, v.child ? (v.breathesAfterRescue ? '5 ventilazioni: riprende a respirare!' : '5 ventilazioni: nessun respiro spontaneo.') : 'Le ventilazioni di soccorso non fanno parte del triage START dell’adulto.', k);
        break;
      case 'fr':
        spend(COST.fr, {}, breathingNow ? `Frequenza respiratoria circa ${v.rr}/min.` : 'Nessun atto respiratorio.', k);
        break;
      case 'polso':
        spend(COST.polso, {}, v.radial ? `Polso radiale presente, riempimento capillare ${v.crt <= 2 ? '≤ 2 s' : `${v.crt} s`}.` : `Polso radiale assente, riempimento capillare ${v.crt} s.`, k);
        break;
      case 'ordini':
        spend(COST.ordini, {}, v.child ? 'Nei bambini piccoli si usa l’AVPU.' : v.obeys ? 'Stringe la mano quando glielo chiedi: esegue ordini semplici.' : 'Non esegue ordini semplici.', k);
        break;
      case 'avpu':
        spend(COST.avpu, {}, `AVPU: ${v.avpu === 'Pinappropriato' ? 'P (risposta inappropriata)' : v.avpu}.`, k);
        break;
      case 'emorragia':
        spend(COST.emorragia, { bleedingControlled: true }, v.bleeding ? 'Applichi un tourniquet: l’emorragia si ferma.' : 'Non c’è un’emorragia massiva da trattare.', k);
        break;
      default:
        break;
    }
  };

  const tag = (t: Tag) => {
    spend(COST.tag, { tag: t });
    sfx('bip');
    const next = VICTIMS.findIndex((x, i) => i > cur && !st[x.id].tag);
    if (next >= 0) setCur(next);
  };

  const done = VICTIMS.every((x) => st[x.id].tag);
  const results = useMemo(() => {
    return VICTIMS.map((x) => {
      const r = st[x.id];
      const ok = r.tag === x.correct;
      const order: Tag[] = ['nero', 'verde', 'giallo', 'rosso'];
      const under = !ok && r.tag !== null && order.indexOf(r.tag) < order.indexOf(x.correct) && x.correct !== 'nero';
      const missedBleed = !!x.bleeding && !r.bleedingControlled;
      const missedAirway = x.correct === 'rosso' && !x.breathes && x.breathesAfterAirway && !r.airwayOpened;
      return { x, r, ok, under, missedBleed, missedAirway };
    });
  }, [st]);
  const correct = results.filter((r) => r.ok).length;
  const under = results.filter((r) => r.under).length;
  const avgTime = Math.round(VICTIMS.reduce((a, x) => a + st[x.id].time, 0) / VICTIMS.length);
  const score = Math.max(
    0,
    Math.round((correct / VICTIMS.length) * 100 - under * 6 - results.filter((r) => r.missedBleed).length * 8 - Math.max(0, avgTime - 45) * 0.6 - (walkCalled ? 0 : 10)),
  );

  if (phase === 'intro') {
    return (
      <div className="page triage">
        <header className="page-head">
          <button className="back" onClick={onBack}>
            ‹ Menu
          </button>
          <div>
            <p className="muted">Maxi-emergenza</p>
            <h1>Calca all’uscita sud</h1>
          </div>
        </header>
        <div className="triage-intro">
          <div className="lib-page">
            <p className="lib-sum">
              Fine concerto, ore 23:40. Un cancello si è bloccato e la folla in uscita si è schiacciata contro le transenne. Sei il primo soccorritore arrivato nel settore: davanti a te ci sono una ventina di persone a terra o che si lamentano.
            </p>
            <p>
              Il tuo compito non è curare, ma <strong>smistare</strong>: assegna a ciascuno il codice START (adulti) o JumpSTART (bambini) nel minor tempo possibile, eseguendo solo le manovre salvavita ammesse. Obiettivo: meno di 60 secondi per ferito.
            </p>
            <dl className="numbers">
              {(Object.keys(TAG_INFO) as Tag[]).map((t) => (
                <div key={t} style={{ borderColor: TAG_INFO[t].hex }}>
                  <dt>{TAG_INFO[t].label}</dt>
                  <dd style={{ color: t === 'nero' ? '#c9d4df' : TAG_INFO[t].hex, fontSize: 'var(--t-18)' }}>{TAG_INFO[t].meaning}</dd>
                </div>
              ))}
            </dl>
            <p className="lib-src">
              Fonti: <SourceChips ids={['START', 'DPCM_2001_MAXI']} />
            </p>
            <button className="btn btn-big btn-arancio" onClick={() => setPhase('campo')}>
              Entra nel settore
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'esito') {
    const extra = loadExtra();
    return (
      <div className="page triage">
        <header className="page-head">
          <button className="back" onClick={onBack}>
            ‹ Menu
          </button>
          <div>
            <p className="muted">Esito del triage</p>
            <h1>
              {correct}/{VICTIMS.length} codici corretti
            </h1>
          </div>
          <div className="page-actions">
            <button className="btn btn-arancio" onClick={() => {
              setSt(Object.fromEntries(VICTIMS.map((x) => [x.id, fresh()])));
              setClock(0);
              setCur(0);
              setWalkCalled(false);
              setPhase('intro');
            }}>
              Riprova
            </button>
          </div>
        </header>
        <div className="triage-summary">
          <div className="tri-score">
            <span className="num">{score}</span>
            <small>punti · record {Math.max(extra.triageBest ?? 0, score)}</small>
          </div>
          <ul className="tri-facts">
            <li>
              Tempo totale <strong className="num">{fmtClock(clock)}</strong>, media <strong className="num">{avgTime} s</strong> per ferito
            </li>
            <li>{walkCalled ? `I ${WALKING} feriti deambulanti sono stati indirizzati al punto di raccolta (VERDE).` : 'Non hai fatto spostare i feriti che camminano: il primo passo dello START è separarli.'}</li>
            <li>
              Sotto-triage (codice meno grave del dovuto): <strong>{under}</strong>
            </li>
          </ul>
        </div>
        <table className="tri-table">
          <thead>
            <tr>
              <th>Ferito</th>
              <th>Tuo codice</th>
              <th>Corretto</th>
              <th>Perché</th>
            </tr>
          </thead>
          <tbody>
            {results.map(({ x, r, ok, under: u, missedBleed, missedAirway }) => (
              <tr key={x.id} className={ok ? 'ok' : 'ko'}>
                <td>
                  {x.label}
                  <small className="muted"> · {r.time} s</small>
                </td>
                <td>{r.tag && <span className="tag" style={{ background: TAG_INFO[r.tag].hex, color: TAG_INFO[r.tag].text }}>{TAG_INFO[r.tag].label}</span>}</td>
                <td>
                  <span className="tag" style={{ background: TAG_INFO[x.correct].hex, color: TAG_INFO[x.correct].text }}>
                    {TAG_INFO[x.correct].label}
                  </span>
                </td>
                <td>
                  {x.why}
                  {u && <strong className="warn-t"> Sotto-triage: il ferito rischia di aspettare troppo.</strong>}
                  {missedBleed && <strong className="warn-t"> Emorragia massiva non controllata.</strong>}
                  {missedAirway && <strong className="warn-t"> Vie aeree non aperte.</strong>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const tagged = VICTIMS.filter((x) => st[x.id].tag).length;
  return (
    <div className="mission triage-field">
      <header className="hud">
        <div className="hud-stripe" aria-hidden="true" />
        <div className="hud-row">
          <div className="hud-codes">
            <span className="code-pill" style={{ ['--cc' as string]: '#e5323b' }}>
              <span>MAXI</span>
              <span>START</span>
            </span>
            <span className="hud-title">Calca all’uscita sud</span>
          </div>
          <div className="hud-clock">
            <span className="hud-clock-l">Tempo di triage</span>
            <span className="num hud-clock-v">{fmtClock(clock)}</span>
          </div>
          <div className="hud-tools">
            <span className="hud-eta num">
              {tagged}/{VICTIMS.length} classificati
            </span>
            <button className="btn btn-small" onClick={() => setShowAlgo((x) => !x)} aria-pressed={showAlgo}>
              {showAlgo ? 'Nascondi algoritmo' : 'Algoritmo'}
            </button>
            <button className="icon-btn" onClick={onBack} aria-label="Esci">
              ✕
            </button>
          </div>
        </div>
      </header>
      <div className="tri-grid">
        <aside className="tri-list" aria-label="Feriti">
          <button className={`tri-walk${walkCalled ? ' on' : ''}`} disabled={walkCalled} onClick={() => {
            setWalkCalled(true);
            setClock((c) => c + COST.chiama);
            sfx('radio');
          }}>
            {walkCalled ? `✓ ${WALKING} deambulanti al punto di raccolta (VERDE)` : '«Chi riesce a camminare vada verso la tenda bianca!»'}
          </button>
          {VICTIMS.map((x, i) => {
            const t = st[x.id].tag;
            return (
              <button key={x.id} className={`tri-item${i === cur ? ' on' : ''}`} onClick={() => setCur(i)}>
                <span className="tri-dot" style={{ background: t ? TAG_INFO[t].hex : 'transparent' }} />
                <span>
                  {i + 1}. {x.label}
                </span>
              </button>
            );
          })}
          <button className="btn btn-arancio" disabled={!done} onClick={() => {
            saveExtra({ triageBest: Math.max(loadExtra().triageBest ?? 0, score) });
            setPhase('esito');
          }}>
            {done ? 'Chiudi il triage' : `Mancano ${VICTIMS.length - tagged} feriti`}
          </button>
        </aside>
        <main className="tri-main">
          <div className="scene tri-scene">
            <svg viewBox={`120 150 ${W - 240} ${H - 280}`} className="scene-svg" role="img" aria-label={`Ferito: ${v.label}`}>
              <defs>
                <filter id="sfoca" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="10" />
                </filter>
              </defs>
              <Floor setting="concerto" timeOfDay="notte" />
              {v.bleeding && !s.bleedingControlled && <ellipse cx="420" cy="215" rx="70" ry="38" fill="#5e0d14" opacity="0.9" />}
              <PatientFigure p={toPatient(v, s)} arrest={false} cprActive={false} breathingRate={breathingNow ? v.rr : 0} hoverRegion={null} />
              {s.bleedingControlled && v.bleeding && <rect x="380" y="200" width="16" height="44" rx="4" fill="#15171a" stroke="#ff7a1a" strokeWidth="2" />}
              {s.tag && (
                <g transform="translate(560 190)">
                  <rect width="120" height="54" rx="8" fill={TAG_INFO[s.tag].hex} stroke="#fff" strokeWidth="3" />
                  <text x="60" y="35" textAnchor="middle" fontSize="24" fontWeight="800" fontFamily="var(--f-display)" fill={TAG_INFO[s.tag].text}>
                    {TAG_INFO[s.tag].label.toUpperCase()}
                  </text>
                </g>
              )}
            </svg>
          </div>
          <div className="tri-card">
            <h2>
              {cur + 1}. {v.label}
              {v.child && <span className="chip">JumpSTART</span>}
            </h2>
            <p>{v.desc}</p>
            {v.bleeding && <p className="warn-t">{v.bleeding}</p>}
            <ul className="tri-findings">
              {s.findings.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
            <p className="muted num">Tempo su questo ferito: {s.time} s</p>
          </div>
        </main>
        <aside className="tri-actions" aria-label="Valutazioni e codici">
          <h3>Valuta</h3>
          <div className="tri-checks">
            <button className="act" onClick={() => doCheck('respira')}>
              <span className="act-label">Respira?</span>
              <span className="act-meta num">{COST.respira} s</span>
            </button>
            <button className="act" onClick={() => doCheck('vie_aeree')}>
              <span className="act-label">Apri le vie aeree</span>
              <span className="act-meta num">{COST.vie_aeree} s</span>
            </button>
            {v.child && (
              <button className="act" onClick={() => doCheck('ventilazioni')}>
                <span className="act-label">5 ventilazioni (se apnea con polso)</span>
                <span className="act-meta num">{COST.ventilazioni} s</span>
              </button>
            )}
            <button className="act" onClick={() => doCheck('fr')}>
              <span className="act-label">Frequenza respiratoria</span>
              <span className="act-meta num">{COST.fr} s</span>
            </button>
            <button className="act" onClick={() => doCheck('polso')}>
              <span className="act-label">Polso radiale / riempimento capillare</span>
              <span className="act-meta num">{COST.polso} s</span>
            </button>
            {v.child ? (
              <button className="act" onClick={() => doCheck('avpu')}>
                <span className="act-label">AVPU</span>
                <span className="act-meta num">{COST.avpu} s</span>
              </button>
            ) : (
              <button className="act" onClick={() => doCheck('ordini')}>
                <span className="act-label">Esegue ordini semplici?</span>
                <span className="act-meta num">{COST.ordini} s</span>
              </button>
            )}
            <button className="act" onClick={() => doCheck('emorragia')}>
              <span className="act-label">Controlla l’emorragia massiva (tourniquet)</span>
              <span className="act-meta num">{COST.emorragia} s</span>
            </button>
          </div>
          <h3>Codice</h3>
          <div className="tri-tags">
            {(Object.keys(TAG_INFO) as Tag[]).map((t) => (
              <button key={t} className="tri-tag" style={{ background: TAG_INFO[t].hex, color: TAG_INFO[t].text }} onClick={() => tag(t)}>
                {TAG_INFO[t].label}
                <small>{TAG_INFO[t].meaning}</small>
              </button>
            ))}
          </div>
          {showAlgo && (
            <ol className="tri-algo">
              <li>Cammina? → VERDE</li>
              <li>Respira? No → apri le vie aeree → respira: ROSSO / no: NERO</li>
              <li>FR &gt; 30 → ROSSO</li>
              <li>Polso radiale assente o riempimento &gt; 2 s → ROSSO</li>
              <li>Non esegue ordini semplici → ROSSO, altrimenti GIALLO</li>
              <li>Bambini: apnea con polso → 5 ventilazioni; FR &lt; 15 o &gt; 45 → ROSSO; AVPU P inappropriato o U → ROSSO</li>
            </ol>
          )}
        </aside>
      </div>
    </div>
  );
}
