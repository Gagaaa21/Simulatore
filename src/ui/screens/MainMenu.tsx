import type { Screen } from '../App';
import type { ScenarioRecord, Settings } from '../store';
import { loadExtra } from '../store';
import { CAREER_SCENARIOS as SCENARIOS } from '../../data/scenarios';
import { Floor, W, H } from '../art/Floors';
import { PatientFigure } from '../art/Patient';
import { useMemo, useState } from 'react';
import { Sim } from '../../engine/engine';
import { SCENARIO_BY_ID } from '../../data/scenarios';
import { OverPatient, UnderPatient } from '../art/Overlays';
import { rankFor, type Career } from '../../data/career';
import { RankInsignia } from '../components/Insignia';
import { LogoMark } from '../components/Logo';
import { SettingsModal } from '../components/SettingsModal';

/** Scena dimostrativa costruita con il motore vero: motociclista con stabilizzazione, collare, ossigeno e saturimetro. */
function heroSim(): Sim {
  const sim = new Sim(SCENARIO_BY_ID['trauma-moto'], 'addestramento', ['zaino', 'collari', 'ossigeno']);
  sim.phase = 'paziente';
  sim.p.look = { ...sim.p.look, helmet: false };
  sim.immob.add('mils');
  sim.immob.add('collare');
  sim.pulseOx = true;
  sim.o2 = { device: 'reservoir', flow: 15, since: 0 };
  sim.covered = false;
  return sim;
}

export function MainMenu({
  go,
  settings,
  setSettings,
  progress,
  career,
  onShift,
}: {
  go: (s: Screen) => void;
  settings: Settings;
  setSettings: (p: Partial<Settings>) => void;
  progress: Record<string, ScenarioRecord>;
  career: Career;
  onShift: () => void;
}) {
  const rk = rankFor(career.xp);
  const hero = useMemo(heroSim, []);
  const [showSettings, setShowSettings] = useState(false);
  const done = SCENARIOS.filter((s) => progress[s.id]).length;
  const avg = done ? Math.round(SCENARIOS.filter((s) => progress[s.id]).reduce((a, s) => a + progress[s.id].best, 0) / done) : null;
  const extra = loadExtra();
  return (
    <div className="menu">
      <div className="hud-stripe tall" aria-hidden="true" />
      <div className="topbar">
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
      </div>
      {showSettings && <SettingsModal settings={settings} setSettings={setSettings} onClose={() => setShowSettings(false)} />}
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
            <button className="btn btn-big btn-arancio" onClick={onShift}>
              Inizia un turno
            </button>
            <button className="btn btn-big" onClick={() => go({ name: 'scenari' })}>
              Scegli una missione
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
          {career.missions === 0 && (
            <button className="tut-link" onClick={() => go({ name: 'briefing', scenario: SCENARIO_BY_ID['tutorial'] })}>
              Prima volta? Inizia dalla missione guidata
            </button>
          )}
          <p className="hero-mode muted">
            {settings.mode === 'addestramento'
              ? 'Addestramento: errori e suggerimenti compaiono subito, con la fonte.'
              : 'Esame: nessun suggerimento durante la missione; tutto nel debriefing.'}
          </p>
        </div>
        <div className="hero-art" aria-hidden="true">
          <svg viewBox={`40 110 ${W - 110} ${H - 180}`}>
            <defs>
              <filter id="sfoca" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="10" />
              </filter>
            </defs>
            <Floor setting="strada" timeOfDay="notte" />
            <defs>
              <linearGradient id="oro" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#f7d774" />
                <stop offset="1" stopColor="#b98a2a" />
              </linearGradient>
            </defs>
            <PatientFigure p={hero.p} arrest={false} cprActive={false} breathingRate={22} hoverRegion={null} under={<UnderPatient sim={hero} />} over={<OverPatient sim={hero} now={0} />} />
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
        <button className="module" onClick={() => go({ name: 'profilo' })}>
          <span className="module-h">Profilo</span>
          <span className="module-p">Grado, distintivi, padronanza dei protocolli, ultime missioni.</span>
          <span className="module-meta num">{Object.keys(career.badges).length} distintivi</span>
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
        <button className="btn btn-small" onClick={() => setShowSettings(true)}>
          Impostazioni
        </button>
      </footer>
    </div>
  );
}
