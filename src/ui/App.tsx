import { useCallback, useEffect, useState } from 'react';
import type { Scenario } from '../engine/types';
import type { EquipmentId } from '../data/equipment';
import type { Sim } from '../engine/engine';
import type { Report } from '../engine/scoring';
import { CAREER_SCENARIOS, SCENARIO_BY_ID } from '../data/scenarios';
import { applyMission, type Career, type MissionOutcome } from '../data/career';
import type { ProtocolId } from '../engine/types';
import { loadCareer, loadProgress, loadSettings, recordResult, saveCareer, saveSettings, type ScenarioRecord, type Settings } from './store';
import { setAudioPrefs, stopVoice, unlockAudio } from './audio';
import { MainMenu } from './screens/MainMenu';
import { ScenarioSelect } from './screens/ScenarioSelect';
import { Briefing } from './screens/Briefing';
import { Mission } from './screens/Mission';
import { Debrief } from './screens/Debrief';
import { Library } from './screens/Library';
import { TriageGame } from './screens/TriageGame';
import { EventPlanner } from './screens/EventPlanner';
import { CprTrainer } from './screens/CprTrainer';
import { Sources } from './screens/Sources';
import { Gallery } from './screens/Gallery';
import { Travel } from './screens/Travel';
import { Profile } from './screens/Profile';
import { ShiftSummary } from './screens/ShiftSummary';

export type Screen =
  | { name: 'menu' }
  | { name: 'scenari' }
  | { name: 'briefing'; scenario: Scenario }
  | { name: 'viaggio'; scenario: Scenario; brought: EquipmentId[] }
  | { name: 'missione'; scenario: Scenario; brought: EquipmentId[]; key: number }
  | { name: 'debriefing'; scenario: Scenario; sim: Sim; report: Report; brought: EquipmentId[]; outcome: MissionOutcome }
  | { name: 'protocolli'; focus?: ProtocolId | string }
  | { name: 'triage' }
  | { name: 'eventi' }
  | { name: 'rcp' }
  | { name: 'fonti' }
  | { name: 'galleria' }
  | { name: 'profilo' }
  | { name: 'fine_turno' };

const HASH_SCREENS = ['scenari', 'protocolli', 'triage', 'eventi', 'rcp', 'fonti', 'galleria', 'profilo'] as const;

export interface Shift {
  queue: string[];
  index: number;
  results: { id: string; score: number; grade: string; xp: number }[];
  badges: string[];
}

const PEDIATRIC = ['fbao-lattante', 'pbls-lattante', 'ustione-bambino'];

/** Sceglie tre missioni diverse, privilegiando quelle mai giocate e mescolando territorio ed eventi. */
function pickShift(progress: Record<string, ScenarioRecord>): string[] {
  const pool = CAREER_SCENARIOS.filter((s) => s.role !== 'laico').map((s) => s.id);
  const weight = (id: string) => (progress[id] ? 1 : 3) * (0.5 + Math.random());
  const pick = pool.sort((a, b) => weight(b) - weight(a)).slice(0, 3);
  // in ordine cronologico, con il turno che inizia alle 7 del mattino
  const minutes = (id: string) => {
    const [h, m] = SCENARIO_BY_ID[id].dispatch.time.split(':').map(Number);
    return ((h - 7 + 24) % 24) * 60 + m;
  };
  return pick.sort((a, b) => minutes(a) - minutes(b));
}

function screenFromHash(): Screen {
  try {
    const h = window.location.hash.replace('#', '');
    if ((HASH_SCREENS as readonly string[]).includes(h)) return { name: h } as Screen;
  } catch {
    /* ignora */
  }
  return { name: 'menu' };
}

export function App() {
  const [screen, setScreen] = useState<Screen>(screenFromHash);
  const [settings, setSettingsState] = useState<Settings>(loadSettings);
  const [progress, setProgress] = useState<Record<string, ScenarioRecord>>(loadProgress);
  const [career, setCareerState] = useState<Career>(loadCareer);
  const [shift, setShift] = useState<Shift | null>(null);
  const setCareer = useCallback((c: Career) => {
    setCareerState(c);
    saveCareer(c);
  }, []);

  useEffect(() => {
    setAudioPrefs(settings);
    saveSettings(settings);
    const root = document.documentElement;
    root.style.fontSize = settings.textSize === 'grande' ? '112.5%' : '';
    root.dataset.motion = settings.motion;
  }, [settings]);

  const setSettings = useCallback((patch: Partial<Settings>) => setSettingsState((s) => ({ ...s, ...patch })), []);

  const go = useCallback((s: Screen) => {
    stopVoice();
    // i moduli di allenamento possono sbloccare distintivi: rileggi la carriera salvata
    if (s.name === 'menu' || s.name === 'profilo') setCareerState(loadCareer());
    setScreen(s);
    try {
      const h = (HASH_SCREENS as readonly string[]).includes(s.name) ? `#${s.name}` : ' ';
      if (h.trim()) window.history.replaceState(null, '', h);
      else window.history.replaceState(null, '', window.location.pathname + window.location.search);
    } catch {
      /* la cronologia può non essere disponibile */
    }
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    const onHash = () => setScreen(screenFromHash());
    window.addEventListener('hashchange', onHash);
    const unlock = () => unlockAudio();
    window.addEventListener('pointerdown', unlock, { once: false });
    window.addEventListener('keydown', unlock, { once: false });
    return () => {
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  switch (screen.name) {
    case 'menu':
      return (
        <MainMenu
          go={go}
          settings={settings}
          setSettings={setSettings}
          progress={progress}
          career={career}
          onShift={() => {
            const queue = pickShift(progress);
            setShift({ queue, index: 0, results: [], badges: [] });
            go({ name: 'briefing', scenario: SCENARIO_BY_ID[queue[0]] });
          }}
        />
      );
    case 'scenari':
      return <ScenarioSelect go={go} progress={progress} settings={settings} setSettings={setSettings} />;
    case 'briefing':
      return (
        <Briefing
          scenario={screen.scenario}
          mode={settings.mode}
          shiftInfo={shift ? { index: shift.index, total: shift.queue.length } : undefined}
          onBack={() => {
            setShift(null);
            go({ name: shift ? 'menu' : 'scenari' });
          }}
          onStart={(brought) =>
            screen.scenario.role === 'laico'
              ? go({ name: 'missione', scenario: screen.scenario, brought, key: Date.now() })
              : go({ name: 'viaggio', scenario: screen.scenario, brought })
          }
        />
      );
    case 'viaggio':
      return <Travel scenario={screen.scenario} onArrive={() => go({ name: 'missione', scenario: screen.scenario, brought: screen.brought, key: Date.now() })} />;
    case 'missione':
      return (
        <Mission
          key={screen.key}
          scenario={screen.scenario}
          brought={screen.brought}
          settings={settings}
          setSettings={setSettings}
          onExit={() => {
            setShift(null);
            go({ name: 'scenari' });
          }}
          onEnd={(sim, report) => {
            const prog = recordResult(screen.scenario.id, report.score, report.grade);
            setProgress(prog);
            const best = Object.fromEntries(Object.entries(prog).map(([k, v]) => [k, v.best]));
            const outcome = applyMission(career, sim, report, screen.scenario, settings.mode, CAREER_SCENARIOS.map((x) => x.id), PEDIATRIC, best);
            setCareer(outcome.career);
            if (shift) {
              setShift({
                ...shift,
                results: [...shift.results, { id: screen.scenario.id, score: report.score, grade: report.grade, xp: outcome.xpGained }],
                badges: [...shift.badges, ...outcome.newBadges],
              });
            }
            go({ name: 'debriefing', scenario: screen.scenario, sim, report, brought: screen.brought, outcome });
          }}
        />
      );
    case 'debriefing':
      return (
        <Debrief
          scenario={screen.scenario}
          sim={screen.sim}
          report={screen.report}
          brought={screen.brought}
          outcome={screen.outcome}
          shift={shift ? { index: shift.index, total: shift.queue.length } : undefined}
          onNext={
            shift
              ? () => {
                  const next = shift.index + 1;
                  if (next >= shift.queue.length) {
                    const avg = Math.round(shift.results.reduce((a, r) => a + r.score, 0) / Math.max(1, shift.results.length));
                    let c: Career = { ...career, shifts: [{ at: Date.now(), avg, ids: shift.queue }, ...career.shifts].slice(0, 30), badges: { ...career.badges } };
                    const extra: string[] = [];
                    for (const [id, cond] of [
                      ['turno', true],
                      ['notte', avg >= 85],
                    ] as const) {
                      if (cond && !c.badges[id]) {
                        c = { ...c, badges: { ...c.badges, [id]: Date.now() } };
                        extra.push(id);
                      }
                    }
                    setCareer(c);
                    setShift({ ...shift, badges: [...shift.badges, ...extra] });
                    go({ name: 'fine_turno' });
                  } else {
                    setShift({ ...shift, index: next });
                    go({ name: 'briefing', scenario: SCENARIO_BY_ID[shift.queue[next]] });
                  }
                }
              : undefined
          }
          onRetry={() => go({ name: 'briefing', scenario: SCENARIO_BY_ID[screen.scenario.id] })}
          onMenu={() => {
            setShift(null);
            go({ name: 'scenari' });
          }}
          onProtocol={(id) => go({ name: 'protocolli', focus: id })}
        />
      );
    case 'protocolli':
      return <Library focus={screen.focus} onBack={() => go({ name: 'menu' })} />;
    case 'triage':
      return <TriageGame onBack={() => go({ name: 'menu' })} />;
    case 'eventi':
      return <EventPlanner onBack={() => go({ name: 'menu' })} />;
    case 'rcp':
      return <CprTrainer onBack={() => go({ name: 'menu' })} />;
    case 'fonti':
      return <Sources onBack={() => go({ name: 'menu' })} />;
    case 'galleria':
      return <Gallery />;
    case 'profilo':
      return (
        <Profile
          career={career}
          progress={progress}
          onBack={() => go({ name: 'menu' })}
          onReset={() => {
            const fresh = loadCareer();
            setCareerState(fresh);
            setProgress(loadProgress());
            setSettingsState(loadSettings());
          }}
        />
      );
    case 'fine_turno':
      return shift ? (
        <ShiftSummary
          shift={shift}
          career={career}
          onMenu={() => {
            setShift(null);
            go({ name: 'menu' });
          }}
          onAgain={() => {
            const queue = pickShift(progress);
            setShift({ queue, index: 0, results: [], badges: [] });
            go({ name: 'briefing', scenario: SCENARIO_BY_ID[queue[0]] });
          }}
        />
      ) : null;
    default:
      return null;
  }
}
