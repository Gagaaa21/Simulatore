import { useEffect, useState } from 'react';
import type { Screen } from '../App';
import type { ScenarioRecord, Settings } from '../store';
import { loadExtra } from '../store';
import { CAREER_SCENARIOS as SCENARIOS, SCENARIO_BY_ID } from '../../data/scenarios';
import { BADGES, rankFor, type Career } from '../../data/career';
import { CRITICITA, LUOGO, PATOLOGIA } from '../../data/codes';
import { VICTIMS } from '../../data/triage';
import type { Scenario } from '../../engine/types';
import { RankInsignia } from '../components/Insignia';
import { LogoMark } from '../components/Logo';
import { SettingsModal } from '../components/SettingsModal';
import { HeroScene } from '../art/HeroScene';
import { CodePill } from './ScenarioSelect';

function useNarrow(query = '(max-width: 1100px)') {
  const get = () => (typeof window !== 'undefined' && 'matchMedia' in window ? window.matchMedia(query).matches : false);
  const [narrow, setNarrow] = useState(get);
  useEffect(() => {
    if (!('matchMedia' in window)) return;
    const mq = window.matchMedia(query);
    const on = () => setNarrow(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return narrow;
}

/** Dove avviene la chiamata, per la coda del turno: comune o tipo di servizio. */
function placeOf(s: Scenario): string {
  if (s.category === 'eventi') return 'Servizio a un evento';
  return s.dispatch.address.split(',')[0];
}

const CATS: { id: Scenario['category']; label: string }[] = [
  { id: '118', label: 'Territorio' },
  { id: 'eventi', label: 'Concerti ed eventi' },
  { id: 'fuori_servizio', label: 'Fuori servizio' },
];

/** Traccia di compressioni toraciche dentro la fascia 100–120/min. */
function CprGlyph() {
  const peaks = Array.from({ length: 11 }, (_, i) => i);
  return (
    <svg viewBox="0 0 220 64" className="tool-glyph" aria-hidden="true">
      <rect x="0" y="14" width="220" height="22" fill="#4be38a" opacity="0.12" />
      <path d={`M0 50 ${peaks.map((i) => `L${10 + i * 19} 50 L${16 + i * 19} 18 L${22 + i * 19} 50`).join(' ')} L220 50`} stroke="#4be38a" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
    </svg>
  );
}

/** Cartellini di triage START: verde, giallo, rosso, nero. */
function TriageGlyph() {
  const tags = ['#2db34f', '#f5c21b', '#e5323b', '#20262e'];
  return (
    <svg viewBox="0 0 220 64" className="tool-glyph" aria-hidden="true">
      {tags.map((c, i) => (
        <g key={c} transform={`translate(${8 + i * 52} ${8 + (i % 2) * 4}) rotate(${i % 2 ? 4 : -3})`}>
          <path d="M0 6 L8 0 H40 V48 H0 Z" fill={c} stroke={i === 3 ? '#8399b4' : 'none'} strokeWidth="1.5" />
          <circle cx="10" cy="9" r="3" fill="#0d1826" />
        </g>
      ))}
    </svg>
  );
}

/** Scala del livello di rischio (DGR FVG 1653/2025): sotto 18, 18–36, 37–55. */
function RiskGlyph() {
  return (
    <svg viewBox="0 0 220 64" className="tool-glyph" aria-hidden="true">
      <rect x="0" y="22" width="72" height="16" rx="3" fill="#2db34f" />
      <rect x="75" y="22" width="72" height="16" rx="3" fill="#f5c21b" />
      <rect x="150" y="22" width="70" height="16" rx="3" fill="#e5323b" />
      <path d="M118 12 l7 9 l7 -9 z" fill="#e9eef5" />
      <text x="0" y="56" fontSize="12" fill="#a7b7ca" fontFamily="'Saira Condensed', sans-serif">0</text>
      <text x="75" y="56" fontSize="12" fill="#a7b7ca" fontFamily="'Saira Condensed', sans-serif">18</text>
      <text x="150" y="56" fontSize="12" fill="#a7b7ca" fontFamily="'Saira Condensed', sans-serif">37</text>
    </svg>
  );
}

export function MainMenu({
  go,
  settings,
  setSettings,
  progress,
  career,
  shiftPreview,
  onShift,
}: {
  go: (s: Screen) => void;
  settings: Settings;
  setSettings: (p: Partial<Settings>) => void;
  progress: Record<string, ScenarioRecord>;
  career: Career;
  shiftPreview: string[];
  onShift: () => void;
}) {
  const narrow = useNarrow();
  const [showSettings, setShowSettings] = useState(false);
  const rk = rankFor(career.xp);
  const played = SCENARIOS.filter((s) => progress[s.id]);
  const avg = played.length ? Math.round(played.reduce((a, s) => a + progress[s.id].best, 0) / played.length) : null;
  const extra = loadExtra();
  const first = SCENARIO_BY_ID[shiftPreview[0]];
  const later = shiftPreview.slice(1).map((id) => SCENARIO_BY_ID[id]);
  const crit = CRITICITA[first.dispatch.criticita];
  const isNew = career.missions === 0;
  const byCat = (c: Scenario['category']) => SCENARIOS.filter((s) => s.category === c);

  return (
    <div className="ingresso">
      <div className="hud-stripe tall" aria-hidden="true" />
      <section className="hall" aria-labelledby="titolo">
        <header className="hall-top">
          <div className="brand">
            <LogoMark size={34} />
            <span className="top-brand-text">Sirena 118</span>
          </div>
          <div className="topbar-right">
            <button className="icon-btn gear" onClick={() => setShowSettings(true)} aria-label="Impostazioni" title="Impostazioni">
              ⚙
            </button>
            <button className="rank-chip" onClick={() => go({ name: 'profilo' })} title="Apri il profilo">
              <RankInsignia stripes={rk.rank.stripes} size={30} />
              <span className="rank-chip-text">
                <strong>{rk.rank.name}</strong>
                <span className="xp-mini">
                  <span style={{ width: `${Math.round(rk.progress * 100)}%` }} />
                </span>
              </span>
            </button>
          </div>
        </header>

        <div className="hall-inner">
          <div className="hall-copy">
            <h1 className="hall-title" id="titolo">
              Sirena<span className="hero-118 num">118</span>
            </h1>
            <p className="hall-line">Il turno comincia quando chiama la SORES.</p>
            <p className="hall-lead">
              Missioni di soccorso con le regole del Friuli Venezia Giulia: valuti scena e paziente, riferisci alla SORES, applichi il protocollo. Alla fine ogni scelta è confrontata con linee guida e normativa, citando la fonte.
            </p>
            <div className="hall-cta">
              {isNew ? (
                <>
                  <button className="btn btn-big btn-arancio" onClick={() => go({ name: 'briefing', scenario: SCENARIO_BY_ID['tutorial'] })}>
                    Inizia dalla missione guidata
                  </button>
                  <button className="btn btn-big" onClick={onShift}>
                    Inizia il turno
                  </button>
                </>
              ) : (
                <>
                  <button className="btn btn-big btn-arancio" onClick={onShift}>
                    Inizia il turno
                  </button>
                  <button className="btn btn-big" onClick={() => go({ name: 'scenari' })}>
                    Scegli una missione
                  </button>
                </>
              )}
            </div>
            <div className="hall-mode">
              <div className="seg" role="radiogroup" aria-label="Modalità">
                <button role="radio" aria-checked={settings.mode === 'addestramento'} className={settings.mode === 'addestramento' ? 'on' : ''} onClick={() => setSettings({ mode: 'addestramento' })}>
                  Addestramento
                </button>
                <button role="radio" aria-checked={settings.mode === 'esame'} className={settings.mode === 'esame' ? 'on' : ''} onClick={() => setSettings({ mode: 'esame' })}>
                  Esame
                </button>
              </div>
              <p>{settings.mode === 'addestramento' ? 'Errori e suggerimenti compaiono subito, con la fonte.' : 'Nessun aiuto durante la missione: tutto nel debriefing.'}</p>
            </div>
          </div>

          <div className="hall-scene">
            <HeroScene focus={narrow} />
          </div>

          <button className="hall-tablet" onClick={onShift} aria-label={`Inizia il turno. Prima chiamata alle ${first.dispatch.time}: ${first.dispatch.address}`}>
            <span className="ht-bar">
              <span className="ht-dot" aria-hidden="true" />
              <span>{first.role === 'squadra' ? 'Coordinamento evento' : 'SORES FVG'}</span>
              <span className="num">{first.dispatch.time}</span>
            </span>
            <span className="ht-body">
              <span className="ht-codes">
                <b className="ht-code num" title={LUOGO[first.dispatch.luogo].label}>
                  {first.dispatch.luogo}
                </b>
                <b className="ht-code num" title={PATOLOGIA[first.dispatch.patologia]}>
                  {first.dispatch.patologia}
                </b>
                <b className="ht-code ht-crit" style={{ ['--cc' as string]: crit.hex }}>
                  {crit.label}
                </b>
              </span>
              <span className="ht-what">
                {LUOGO[first.dispatch.luogo].label}, {PATOLOGIA[first.dispatch.patologia].charAt(0).toLowerCase() + PATOLOGIA[first.dispatch.patologia].slice(1)}
              </span>
              <span className="ht-addr">{first.dispatch.address}</span>
              <span className="ht-note">{first.dispatch.text}</span>
              <span className="ht-queue">
                <span className="ht-queue-h">Poi, nello stesso turno</span>
                {later.map((s) => (
                  <span key={s.id} className="ht-row">
                    <span className="num">{s.dispatch.time}</span>
                    <CodePill s={s} />
                    <span className="ht-place">{placeOf(s)}</span>
                  </span>
                ))}
              </span>
            </span>
            <span className="ht-foot">Tocca per prendere la chiamata</span>
          </button>
        </div>
      </section>
      {showSettings && <SettingsModal settings={settings} setSettings={setSettings} onClose={() => setShowSettings(false)} />}

      {isNew ? (
        <section className="percorso" aria-labelledby="perc-h">
          <h2 id="perc-h">Come si svolge una missione</h2>
          <ol>
            <li>
              <strong>Arriva la chiamata</strong>
              <span>La SORES ti invia con codice di luogo, patologia e criticità, indirizzo e note dell’operatore.</span>
            </li>
            <li>
              <strong>Scegli cosa portare</strong>
              <span>Zaino, DAE, ossigeno, presidi per il trauma: quello che lasci sul mezzo costa minuti.</span>
            </li>
            <li>
              <strong>Scena e paziente</strong>
              <span>Sicurezza, valutazione ABCDE, parametri, saturazione alla SORES, protocollo, consegna all’équipe.</span>
            </li>
            <li>
              <strong>Debriefing</strong>
              <span>La scheda di intervento confronta ogni scelta con linee guida e normativa e ti dice dove migliorare.</span>
            </li>
          </ol>
          <p className="percorso-nota">La prima volta la missione guidata ti indica ogni comando: circa 8 minuti.</p>
        </section>
      ) : (
        <section className="ruolino" aria-label="Il tuo stato">
          <RankInsignia stripes={rk.rank.stripes} size={56} />
          <div className="ruolino-grado">
            <strong>{rk.rank.name}</strong>
            <span className="xp-bar" aria-hidden="true">
              <span style={{ width: `${Math.round(rk.progress * 100)}%` }} />
            </span>
            <small>{rk.next ? `${rk.next.xp - career.xp} punti al grado di ${rk.next.name.toLowerCase()}` : 'Hai raggiunto il grado più alto'}</small>
          </div>
          <dl className="ruolino-dati">
            <div>
              <dt>Missioni</dt>
              <dd className="num">
                {played.length}/{SCENARIOS.length}
              </dd>
            </div>
            <div>
              <dt>Media</dt>
              <dd className="num">{avg ?? '–'}</dd>
            </div>
            <div>
              <dt>Distintivi</dt>
              <dd className="num">
                {Object.keys(career.badges).length}/{BADGES.length}
              </dd>
            </div>
          </dl>
          <button className="btn" onClick={() => go({ name: 'profilo' })}>
            Apri il profilo
          </button>
        </section>
      )}

      <section className="catalogo" aria-labelledby="cat-h">
        <div className="sez-head">
          <h2 id="cat-h">Missioni</h2>
          <p>{SCENARIOS.length} casi, ognuno costruito su linee guida e normativa. Il codice è quello con cui la SORES ti invia.</p>
          <button className="btn btn-small" onClick={() => go({ name: 'scenari' })}>
            Filtra e scegli
          </button>
        </div>
        <div className="cat-grid">
          {CATS.map((c) => (
            <div key={c.id} className={`cat-col cat-${c.id}`}>
              <h3>
                {c.label} <span className="num">{byCat(c.id).length}</span>
              </h3>
              <ul>
                {byCat(c.id).map((s) => {
                  const rec = progress[s.id];
                  return (
                    <li key={s.id}>
                      <button className="cat-row" onClick={() => go({ name: 'briefing', scenario: s })}>
                        <CodePill s={s} />
                        <span className="cat-title">{s.title}</span>
                        <span className={`cat-best num${rec ? '' : ' nuova'}`} title={rec ? `Miglior punteggio: ${rec.best}` : `Durata indicativa: ${s.minutes} minuti`}>
                          {rec ? rec.best : `${s.minutes} min`}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="allenamenti" aria-labelledby="all-h">
        <div className="sez-head">
          <h2 id="all-h">Allenamenti</h2>
          <p>Brevi esercizi su una sola abilità, da ripetere finché diventa automatica.</p>
        </div>
        <div className="tools">
          <button className="tool" onClick={() => go({ name: 'rcp' })}>
            <CprGlyph />
            <span className="tool-h">Compressioni toraciche</span>
            <span className="tool-p">Ritmo 100–120 al minuto con il metronomo, rapporti 30:2 e 15:2, cambio ogni 2 minuti.</span>
            <span className="tool-rec num">{extra.cprBest !== undefined ? `Il tuo record: ${extra.cprBest}%` : 'Non ancora provato'}</span>
          </button>
          <button className="tool" onClick={() => go({ name: 'triage' })}>
            <TriageGlyph />
            <span className="tool-h">Maxi-emergenza</span>
            <span className="tool-p">{VICTIMS.length} feriti dopo una calca all’uscita di un concerto: triage START e JumpSTART contro il tempo.</span>
            <span className="tool-rec num">{extra.triageBest !== undefined ? `Il tuo record: ${extra.triageBest}%` : 'Non ancora provato'}</span>
          </button>
          <button className="tool" onClick={() => go({ name: 'eventi' })}>
            <RiskGlyph />
            <span className="tool-h">Pianifica un evento</span>
            <span className="tool-p">Livello di rischio, risorse con l’algoritmo di Maurer e Score SORES, come prevede la DGR FVG 1653/2025.</span>
            <span className="tool-rec num">{extra.eventiBest !== undefined ? `Il tuo record: ${extra.eventiBest}%` : 'Non ancora provato'}</span>
          </button>
        </div>
      </section>

      <section className="consulta" aria-label="Consulta">
        <button className="consulta-link" onClick={() => go({ name: 'protocolli' })}>
          <span className="consulta-h">Protocolli e codici</span>
          <span>Algoritmi, numeri chiave, errori frequenti, codici di invio e competenze del soccorritore in FVG.</span>
        </button>
        <button className="consulta-link" onClick={() => go({ name: 'fonti' })}>
          <span className="consulta-h">Fonti e avvertenze</span>
          <span>Le linee guida, le delibere regionali e le norme su cui si basa ogni regola del simulatore.</span>
        </button>
      </section>

      <footer className="menu-foot">
        <p>
          Strumento didattico: non sostituisce i corsi certificati (BLSD, PTC, formazione regionale) né le indicazioni operative della SORES e del tuo ente. In caso di emergenza reale chiama il <strong>112</strong>.
        </p>
        <button className="btn btn-small" onClick={() => setShowSettings(true)}>
          Impostazioni
        </button>
      </footer>
    </div>
  );
}
