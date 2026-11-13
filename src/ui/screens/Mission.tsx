import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Sim, fmtClock } from '../../engine/engine';
import type { Scenario } from '../../engine/types';
import type { EquipmentId } from '../../data/equipment';
import { EQUIPMENT } from '../../data/equipment';
import { ACTIONS } from '../../engine/actions';
import { evaluate, type Report } from '../../engine/scoring';
import { CRITICITA } from '../../data/codes';
import { PROTOCOLS } from '../../data/protocols';
import type { Settings } from '../store';
import { pulseBeep, sfx, speak, startAmbience, stopAmbience, stopVoice } from '../audio';
import { SettingsModal } from '../components/SettingsModal';
import { TUTORIAL_STEPS } from '../../data/scenarios/tutorial';
import { Scene } from '../components/Scene';
import { ActionPanel } from '../components/ActionPanel';
import { PatientAlert, PatientStatus } from '../components/PatientStatus';
import { LogFeed } from '../components/LogFeed';
import { GuideNote } from '../components/GuideNote';
import { Monitor } from '../components/Monitor';
import { AedPanel } from '../components/AedPanel';
import { CprPanel } from '../components/CprPanel';
import { Modal } from '../components/Modal';
import {
  CentralePicker,
  CoolingPicker,
  OxygenPicker,
  PadsPicker,
  PositionPicker,
  ProtocolPicker,
  TourniquetPicker,
  TransportPicker,
} from '../components/Pickers';

const AUTO_PHASES = ['analisi', 'carica', 'erogato', 'non_consigliato'];

type Picker = { id: string; kind: string } | null;

export function Mission({
  scenario,
  brought,
  settings,
  setSettings,
  onEnd,
  onExit,
}: {
  scenario: Scenario;
  brought: EquipmentId[];
  settings: Settings;
  setSettings: (p: Partial<Settings>) => void;
  onEnd: (sim: Sim, report: Report) => void;
  onExit: () => void;
}) {
  const simRef = useRef<Sim | null>(null);
  if (!simRef.current) {
    simRef.current = new Sim(scenario, settings.mode, brought);
    simRef.current.start();
  }
  const sim = simRef.current;
  useSyncExternalStore(sim.subscribe, sim.getVersion);

  const [paused, setPaused] = useState(false);
  const [picker, setPicker] = useState<Picker>(null);
  const [protoOpen, setProtoOpen] = useState(false);
  const [missing, setMissing] = useState<{ id: string; items: EquipmentId[]; reason: string } | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  useEffect(() => {
    startAmbience(scenario.setting);
    return () => stopAmbience();
  }, [scenario.setting]);
  const [mobileTab, setMobileTab] = useState<'azioni' | 'strumenti' | 'diario'>('azioni');
  const [flash, setFlash] = useState<string | null>(null);
  const [coach, setCoach] = useState<boolean>(() => {
    try {
      return !scenario.tutorial && window.localStorage.getItem('sirena118.coach.v1') !== 'visto';
    } catch {
      return false;
    }
  });
  const endedRef = useRef(false);

  const closeCoach = () => {
    setCoach(false);
    try {
      window.localStorage.setItem('sirena118.coach.v1', 'visto');
    } catch {
      /* archiviazione non disponibile */
    }
  };

  // guida del tutorial: primo passo non ancora completato ed evidenziazione del comando
  const stepIdx = scenario.tutorial ? TUTORIAL_STEPS.findIndex((st) => !st.done(sim)) : -1;
  const step = stepIdx >= 0 ? TUTORIAL_STEPS[stepIdx] : null;
  // l'evidenziazione si riapplica di continuo: le schede possono cambiare senza che la missione si ridisegni
  const stepTarget = step?.target ?? null;
  useEffect(() => {
    if (!stepTarget) return;
    const apply = () => document.querySelectorAll(stepTarget).forEach((e) => e.classList.add('tut-target'));
    apply();
    const id = window.setInterval(apply, 300);
    return () => {
      window.clearInterval(id);
      document.querySelectorAll('.tut-target').forEach((e) => e.classList.remove('tut-target'));
    };
  }, [stepTarget]);

  const modalOpen = !!picker || protoOpen || !!missing || confirmExit || coach || showSettings;
  const running = !paused && !modalOpen && !sim.ended;

  // ciclo di gioco
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let beepAcc = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.25, (now - last) / 1000);
      last = now;
      const s = simRef.current!;
      if (running) {
        if (s.busy) {
          const dur = Math.max(1, s.busy.end - s.busy.start);
          const realDur = Math.max(0.5, Math.min(2.6, 0.5 + dur / 22));
          s.advance((dt * dur) / realDur);
        } else if (settings.realtime || s.cpr.active || AUTO_PHASES.includes(s.aed.phase) || s.aedFetchAt !== null) {
          s.advance(dt);
        }
      }
      // suoni e voce
      while (s.soundQueue.length) sfx(s.soundQueue.shift()!);
      if (s.voiceQueue.length) {
        const v = s.voiceQueue[s.voiceQueue.length - 1];
        s.voiceQueue.length = 0;
        speak(v);
      }
      // bip del saturimetro in tempo reale
      if (s.pulseOx && !s.inArrest() && s.p.v.sbp > 55 && running) {
        beepAcc += dt;
        const period = 60 / Math.max(30, s.p.v.hr);
        if (beepAcc >= period) {
          beepAcc = 0;
          pulseBeep(s.p.v.spo2);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running, settings.realtime]);

  // fine scenario → valutazione
  useEffect(() => {
    if (sim.ended && !endedRef.current) {
      endedRef.current = true;
      stopVoice();
      const rep = evaluate(sim, brought);
      const id = window.setTimeout(() => onEnd(sim, rep), 1400);
      return () => window.clearTimeout(id);
    }
    return undefined;
  });

  // motivo per cui un'azione non si può fare adesso (es. dalla scena): sparisce da solo
  useEffect(() => {
    if (!flash) return;
    const id = window.setTimeout(() => setFlash(null), 4000);
    return () => window.clearTimeout(id);
  }, [flash]);

  const trigger = useCallback(
    (id: string, params?: Record<string, unknown>) => {
      const def = ACTIONS[id];
      if (!def) return;
      if (def.picker && !params) {
        const avail = sim.actionAvailability(id);
        const miss = (def.needs ?? []).filter((e) => !sim.brought.has(e));
        if (avail === true && !miss.length && !sim.busy) {
          setPicker({ id, kind: def.picker });
          return;
        }
      }
      const r = sim.startAction(id, params);
      if (!r.ok) {
        if (r.missing && r.missing.length) setMissing({ id, items: r.missing, reason: r.reason ?? '' });
        else {
          setFlash(`info|${r.reason}`);
        }
        sfx('click');
      } else sfx('click');
    },
    [sim],
  );

  // scorciatoie da tastiera
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.key === 'p' || e.key === 'P') setPaused((x) => !x);
      if (e.key === 'Enter' && sim.aed.phase === 'pronto' && !modalOpen) sim.aedShock();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sim, modalOpen]);

  const confirmPicker = (params: Record<string, unknown>) => {
    if (!picker) return;
    const id = picker.id;
    setPicker(null);
    trigger(id, params);
  };

  const d = scenario.dispatch;
  const crit = CRITICITA[d.criticita];
  // nome del mezzo avanzato senza articolo: «L’automedica» → «Automedica»
  const advRaw = (scenario.msa.label ?? 'Mezzo avanzato').replace(/^(L’|L'|Il |La |Lo )/, '');
  const advName = advRaw.charAt(0).toUpperCase() + advRaw.slice(1);
  const showAed = sim.has('dae') || sim.aedFetchAt !== null || !!scenario.scene.publicAed || scenario.loadout !== null;
  const examHidden = settings.mode === 'esame' && paused;

  return (
    <div className="mission">
      <header className="hud">
        <div className="hud-stripe" aria-hidden="true" />
        <div className="hud-row">
          <div className="hud-codes" title={`${crit.label}: ${crit.def}`}>
            <span className="code-pill" style={{ ['--cc' as string]: crit.hex }}>
              <span className="num">{d.luogo}</span>
              <span className="num">{d.patologia}</span>
              <span>{crit.label}</span>
            </span>
            <span className="hud-title">{scenario.title}</span>
          </div>
          <div className="hud-clock" aria-label="Tempo di missione">
            <span className="hud-clock-l">Sul posto</span>
            <span className="num hud-clock-v">{fmtClock(sim.t)}</span>
            <span className="hud-clock-l num">{sim.clock()}</span>
          </div>
          <div className="hud-tools">
            <button className={`btn btn-small hud-proto${sim.protocol ? ' btn-on' : ' btn-pulse'}`} onClick={() => setProtoOpen(true)} disabled={sim.phase === 'scena'} title="Dichiara il protocollo">
              {sim.protocol ? PROTOCOLS[sim.protocol.id].name : 'Scegli protocollo'}
            </button>
            {sim.msaAt !== null && !sim.msaOnScene && (
              <span className="hud-eta" title="Mezzo avanzato in arrivo">
                {advName} <span className="num">{fmtClock(Math.max(0, sim.msaAt - sim.t))}</span>
              </span>
            )}
            {sim.msaOnScene && <span className="hud-eta on">{advName} sul posto</span>}
            <button className="icon-btn" onClick={() => setPaused((x) => !x)} aria-label={paused ? 'Riprendi' : 'Pausa'} title="Pausa (P)">
              {paused ? '▶' : '❚❚'}
            </button>
            <button className="icon-btn hud-audio" onClick={() => setSettings({ sound: !settings.sound })} aria-label={settings.sound ? 'Disattiva audio' : 'Attiva audio'} title="Audio">
              {settings.sound ? '♪' : '–'}
            </button>
            <button className="icon-btn" onClick={() => setShowSettings(true)} aria-label="Impostazioni" title="Impostazioni">
              ⚙
            </button>
            <button className="icon-btn" onClick={() => setConfirmExit(true)} aria-label="Esci dalla missione" title="Esci">
              ✕
            </button>
          </div>
        </div>
      </header>

      <div className={`mission-grid mt-${mobileTab}`}>
        <aside className="col-actions">
          <ActionPanel sim={sim} onAction={trigger} coach={settings.mode === 'addestramento' && !scenario.tutorial} onProtocol={() => setProtoOpen(true)} hintAction={step?.target.match(/data-action="([a-z_0-9]+)"/)?.[1]} />
        </aside>
        <main className="col-scene">
          {scenario.tutorial && (
            <div className="guide" role="status">
              <span className="guide-n num">{step ? `${stepIdx + 1}/${TUTORIAL_STEPS.length}` : '✓'}</span>
              <div className="guide-body">
                <p>{step ? step.text : 'Missione completata: tra poco il debriefing.'}</p>
                <GuideNote sim={sim} />
              </div>
            </div>
          )}
          <div className="scene-wrap">
            <Scene sim={sim} onAction={trigger} />
            <PatientAlert sim={sim} />
            {flash && (
              <div className={`flash flash-${flash.split('|')[0]}`} role="status">
                {flash.split('|').slice(1).join('|')}
              </div>
            )}
            {(paused || sim.ended) && (
              <div className={`pause-veil${examHidden ? ' solid' : ''}`}>
                {sim.ended ? (
                  <p className="pause-text">Missione conclusa: {sim.ended.reason}. Compilo la scheda…</p>
                ) : (
                  <>
                    <p className="pause-text">In pausa</p>
                    <button className="btn btn-arancio" onClick={() => setPaused(false)}>
                      Riprendi
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="col-log">
            <LogFeed sim={sim} compact />
          </div>
        </main>
        <aside className="col-tools">
          <PatientStatus sim={sim} />
          <Monitor sim={sim} />
          <CprPanel sim={sim} onAction={trigger} />
          {showAed && <AedPanel sim={sim} onAction={trigger} available={sim.has('dae')} />}
          <section className="kit-list" aria-label="Presidi con te">
            <h3>Con te</h3>
            <ul>
              {Array.from(sim.brought).map((e) => (
                <li key={e}>{EQUIPMENT[e].name}</li>
              ))}
              {sim.brought.size === 0 && <li className="muted">Niente: solo le tue mani e il telefono.</li>}
            </ul>
          </section>
        </aside>
      </div>

      <nav className="mobile-tabs" aria-label="Sezioni della missione">
        {(['azioni', 'strumenti', 'diario'] as const).map((t) => (
          <button key={t} className={mobileTab === t ? 'on' : ''} onClick={() => setMobileTab(t)}>
            {t === 'azioni' ? 'Azioni' : t === 'strumenti' ? 'Monitor e DAE' : 'Diario'}
          </button>
        ))}
      </nav>

      {picker?.kind === 'ossigeno' && <OxygenPicker sim={sim} onConfirm={confirmPicker} onCancel={() => setPicker(null)} />}
      {picker?.kind === 'tourniquet' && <TourniquetPicker sim={sim} onConfirm={confirmPicker} onCancel={() => setPicker(null)} />}
      {picker?.kind === 'raffreddamento' && <CoolingPicker sim={sim} onConfirm={confirmPicker} onCancel={() => setPicker(null)} />}
      {picker?.kind === 'posizione' && <PositionPicker sim={sim} onConfirm={confirmPicker} onCancel={() => setPicker(null)} />}
      {picker?.kind === 'dae_piastre' && <PadsPicker sim={sim} onConfirm={confirmPicker} onCancel={() => setPicker(null)} />}
      {picker?.kind === 'centrale' && <CentralePicker sim={sim} onConfirm={confirmPicker} onCancel={() => setPicker(null)} />}
      {picker?.kind === 'trasporto' && <TransportPicker sim={sim} onConfirm={confirmPicker} onCancel={() => setPicker(null)} />}
      {protoOpen && (
        <ProtocolPicker
          current={sim.protocol?.id ?? null}
          onCancel={() => setProtoOpen(false)}
          onConfirm={(id) => {
            setProtoOpen(false);
            sim.declareProtocol(id);
          }}
        />
      )}
      {missing && (
        <Modal
          title="Presidio non disponibile"
          kicker="Presidi"
          onClose={() => setMissing(null)}
          footer={
            <>
              <button className="btn" onClick={() => setMissing(null)}>
                Lascia stare
              </button>
              <button
                className="btn btn-arancio"
                onClick={() => {
                  sim.fetchEquipment(missing.items);
                  setMissing(null);
                }}
              >
                Vai a prenderlo ({fmtClock(sim.fetchTime())})
              </button>
            </>
          }
        >
          <p>{missing.reason}</p>
          <p className="muted">Il presidio è rimasto {scenario.role === 'squadra' ? 'al PMA' : 'sul mezzo'}: un collega può andare a prenderlo, ma il tempo scorre.</p>
        </Modal>
      )}
      {showSettings && <SettingsModal settings={settings} setSettings={setSettings} onClose={() => setShowSettings(false)} />}
      {coach && (
        <Modal
          title="Come si gioca"
          kicker="Prima missione"
          onClose={closeCoach}
          footer={
            <button className="btn btn-arancio" onClick={closeCoach}>
              Ho capito, inizia
            </button>
          }
        >
          <ol className="coach">
            <li>
              <strong>Prima la scena.</strong> Valuta la sicurezza, indossa i guanti e solo dopo avvicinati al paziente.
            </li>
            <li>
              <strong>Le schede.</strong> A sinistra: Scena, Valutazione (ABCDE), Parametri, Anamnesi, Trattamenti (vie aeree, ossigeno, RCP e DAE, emorragie, immobilizzazione…) e SORES; una spunta indica la scheda svolta. Puoi anche cliccare sul corpo del paziente o sui presidi a terra. Ogni azione richiede tempo: il paziente intanto cambia.
            </li>
            <li>
              <strong>Leggi gli strumenti.</strong> A destra il monitor (saturimetro e pressione; la glicemia compare quando la misura l’infermiere), il DAE e la RCP; sotto la scena il diario con reperti e messaggi radio.
            </li>
            <li>
              <strong>Decidi.</strong> In alto scegli il protocollo; dal gruppo «SORES» riferisci valutazione e parametri, chiedi rinforzi, trasporti o passi le consegne. L’ossigeno lo applichi con presidio e concentrazione indicati dalla SORES.
            </li>
            <li>
              Il tempo scorre: <kbd>P</kbd> mette in pausa, <kbd>/</kbd> cerca un’azione.{settings.mode === 'addestramento' ? ' In addestramento il riquadro «Prossimo passo» ti indica cosa fare e illumina il comando: errori e suggerimenti compaiono solo lì.' : ''}
            </li>
          </ol>
        </Modal>
      )}
      {confirmExit && (
        <Modal
          title="Abbandonare la missione?"
          onClose={() => setConfirmExit(false)}
          footer={
            <>
              <button className="btn" onClick={() => setConfirmExit(false)}>
                Continua la missione
              </button>
              <button className="btn" onClick={onExit}>
                Esci senza valutazione
              </button>
              <button
                className="btn btn-arancio"
                onClick={() => {
                  setConfirmExit(false);
                  sim.end('Missione interrotta');
                }}
              >
                Termina e valuta
              </button>
            </>
          }
        >
          <p>Puoi uscire senza punteggio oppure chiudere ora la missione e vedere la valutazione di ciò che hai fatto finora.</p>
        </Modal>
      )}
    </div>
  );
}
