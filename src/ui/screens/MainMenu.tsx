import type { Screen } from '../App';
import type { ScenarioRecord, Settings } from '../store';
import { loadExtra } from '../store';
import { SCENARIOS } from '../../data/scenarios';
import { Floor, W, H } from '../art/Floors';
import { PatientFigure } from '../art/Patient';
import type { Patient } from '../../engine/types';

const HERO_PATIENT: Patient = {
  name: 'demo',
  age: 34,
  sex: 'M',
  weightKg: 78,
  avpu: 'V',
  gcs: 13,
  airway: 'pervie',
  breathing: 'tachipnoico',
  rhythm: 'sinusale',
  pulseRadial: true,
  v: { hr: 112, rr: 22, spo2: 95, sbp: 108, dbp: 70, glu: 110, temp: 36.2, crt: 2 },
  spo2Air: 92,
  skin: { color: 'pallida', temp: 'fredda', sweaty: true },
  pupils: 'normali',
  speech: 'confuso',
  position: 'supino',
  canSwallow: true,
  seizing: false,
  vomitInMouth: false,
  bloodLossMl: 0,
  notes: [],
  look: { skinTone: '#d9a882', hair: '#2b211b', hairStyle: 'corti', shirt: '#2a2f3a', pants: '#1f3b5c', build: 'adulto' },
};

export function MainMenu({
  go,
  settings,
  setSettings,
  progress,
}: {
  go: (s: Screen) => void;
  settings: Settings;
  setSettings: (p: Partial<Settings>) => void;
  progress: Record<string, ScenarioRecord>;
}) {
  const done = SCENARIOS.filter((s) => progress[s.id]).length;
  const avg = done ? Math.round(SCENARIOS.filter((s) => progress[s.id]).reduce((a, s) => a + progress[s.id].best, 0) / done) : null;
  const extra = loadExtra();
  return (
    <div className="menu">
      <div className="hud-stripe tall" aria-hidden="true" />
      <section className="hero">
        <div className="hero-copy">
          <p className="hero-kicker">Simulatore di soccorso sanitario extraospedaliero</p>
          <h1 className="hero-title">
            Sirena<span className="hero-118 num">118</span>
          </h1>
          <p className="hero-lead">
            Ricevi la missione dalla Centrale, scegli i presidi, valuta la scena e il paziente, decidi il protocollo. Ogni scelta è confrontata con le linee guida ERC 2025 e con la normativa italiana.
          </p>
          <div className="hero-cta">
            <button className="btn btn-big btn-arancio" onClick={() => go({ name: 'scenari' })}>
              Inizia il turno
            </button>
            <div className="seg" role="radiogroup" aria-label="Modalità">
              <button role="radio" aria-checked={settings.mode === 'addestramento'} className={settings.mode === 'addestramento' ? 'on' : ''} onClick={() => setSettings({ mode: 'addestramento' })}>
                Addestramento
              </button>
              <button role="radio" aria-checked={settings.mode === 'esame'} className={settings.mode === 'esame' ? 'on' : ''} onClick={() => setSettings({ mode: 'esame' })}>
                Esame
              </button>
            </div>
          </div>
          <p className="hero-mode muted">
            {settings.mode === 'addestramento'
              ? 'Addestramento: errori e suggerimenti compaiono subito, con la fonte.'
              : 'Esame: nessun suggerimento durante la missione; tutto nel debriefing.'}
          </p>
        </div>
        <div className="hero-art" aria-hidden="true">
          <svg viewBox={`120 120 ${W - 240} ${H - 200}`}>
            <defs>
              <filter id="sfoca" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="10" />
              </filter>
            </defs>
            <Floor setting="strada" timeOfDay="notte" />
            <PatientFigure p={HERO_PATIENT} arrest={false} cprActive={false} breathingRate={22} hoverRegion={null} />
            <g>
              <rect x="258" y="270" width="36" height="60" rx="10" fill="#f0f0ee" stroke="#b9bcc0" strokeWidth="2" />
              <rect x="268" y="290" width="16" height="20" rx="4" fill="#ff7a1a" />
              <ellipse cx="206" cy="262" rx="18" ry="13" fill="#4f7fd6" />
              <ellipse cx="206" cy="338" rx="18" ry="13" fill="#4f7fd6" />
              <rect x="462" y="371" width="22" height="18" rx="5" fill="#2f6fd0" />
            </g>
          </svg>
        </div>
      </section>

      <section className="modules" aria-label="Moduli">
        <button className="module module-main" onClick={() => go({ name: 'scenari' })}>
          <span className="module-h">Missioni</span>
          <span className="module-p">Scenari 118, concerti ed eventi, interventi fuori servizio.</span>
          <span className="module-meta num">
            {done}/{SCENARIOS.length} completati{avg !== null ? ` · media ${avg}` : ''}
          </span>
        </button>
        <button className="module" onClick={() => go({ name: 'rcp' })}>
          <span className="module-h">Allenamento RCP</span>
          <span className="module-p">Ritmo 100–120/min, rapporto 30:2 e 15:2, cambio ogni 2 minuti.</span>
          {extra.cprBest !== undefined && <span className="module-meta num">record {extra.cprBest}%</span>}
        </button>
        <button className="module" onClick={() => go({ name: 'triage' })}>
          <span className="module-h">Maxi-emergenza</span>
          <span className="module-p">Triage START e JumpSTART sotto pressione: calca all’uscita di un concerto.</span>
          {extra.triageBest !== undefined && <span className="module-meta num">record {extra.triageBest}%</span>}
        </button>
        <button className="module" onClick={() => go({ name: 'eventi' })}>
          <span className="module-h">Pianifica un evento</span>
          <span className="module-p">Livello di rischio e risorse con l’algoritmo di Maurer (Accordo Stato-Regioni 2014).</span>
          {extra.eventiBest !== undefined && <span className="module-meta num">record {extra.eventiBest}%</span>}
        </button>
        <button className="module" onClick={() => go({ name: 'protocolli' })}>
          <span className="module-h">Protocolli</span>
          <span className="module-p">Algoritmi, numeri chiave, errori frequenti, codici del 118.</span>
        </button>
        <button className="module" onClick={() => go({ name: 'fonti' })}>
          <span className="module-h">Fonti e avvertenze</span>
          <span className="module-p">Linee guida e norme su cui si basa ogni regola del simulatore.</span>
        </button>
      </section>

      <footer className="menu-foot">
        <p>
          Strumento didattico: non sostituisce i corsi certificati (BLSD, PTC, formazione regionale 118) né i protocolli della tua Centrale Operativa. In caso di emergenza reale chiama il <strong>112</strong>.
        </p>
        <div className="menu-prefs">
          <label className="check">
            <input type="checkbox" id="pref-sound" checked={settings.sound} onChange={(e) => setSettings({ sound: e.target.checked })} /> Audio
          </label>
          <label className="check">
            <input type="checkbox" id="pref-voice" checked={settings.voice} onChange={(e) => setSettings({ voice: e.target.checked })} /> Voce del DAE
          </label>
          <label className="check" title="Se disattivato il tempo avanza solo con le azioni, tranne durante la RCP e le fasi del DAE.">
            <input type="checkbox" id="pref-rt" checked={settings.realtime} onChange={(e) => setSettings({ realtime: e.target.checked })} /> Tempo reale
          </label>
        </div>
      </footer>
    </div>
  );
}
