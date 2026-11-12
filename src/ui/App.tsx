import { useCallback, useEffect, useState } from 'react';
import type { Scenario } from '../engine/types';
import type { EquipmentId } from '../data/equipment';
import type { Sim } from '../engine/engine';
import type { Report } from '../engine/scoring';
import { SCENARIO_BY_ID } from '../data/scenarios';
import type { ProtocolId } from '../engine/types';
import { loadProgress, loadSettings, recordResult, saveSettings, type ScenarioRecord, type Settings } from './store';
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

export type Screen =
  | { name: 'menu' }
  | { name: 'scenari' }
  | { name: 'briefing'; scenario: Scenario }
  | { name: 'missione'; scenario: Scenario; brought: EquipmentId[]; key: number }
  | { name: 'debriefing'; scenario: Scenario; sim: Sim; report: Report; brought: EquipmentId[] }
  | { name: 'protocolli'; focus?: ProtocolId | string }
  | { name: 'triage' }
  | { name: 'eventi' }
  | { name: 'rcp' }
  | { name: 'fonti' };

const HASH_SCREENS = ['scenari', 'protocolli', 'triage', 'eventi', 'rcp', 'fonti'] as const;

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

  useEffect(() => {
    setAudioPrefs(settings);
    saveSettings(settings);
  }, [settings]);

  const setSettings = useCallback((patch: Partial<Settings>) => setSettingsState((s) => ({ ...s, ...patch })), []);

  const go = useCallback((s: Screen) => {
    stopVoice();
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
      return <MainMenu go={go} settings={settings} setSettings={setSettings} progress={progress} />;
    case 'scenari':
      return <ScenarioSelect go={go} progress={progress} settings={settings} setSettings={setSettings} />;
    case 'briefing':
      return (
        <Briefing
          scenario={screen.scenario}
          mode={settings.mode}
          onBack={() => go({ name: 'scenari' })}
          onStart={(brought) => go({ name: 'missione', scenario: screen.scenario, brought, key: Date.now() })}
        />
      );
    case 'missione':
      return (
        <Mission
          key={screen.key}
          scenario={screen.scenario}
          brought={screen.brought}
          settings={settings}
          setSettings={setSettings}
          onExit={() => go({ name: 'scenari' })}
          onEnd={(sim, report) => {
            setProgress(recordResult(screen.scenario.id, report.score, report.grade));
            go({ name: 'debriefing', scenario: screen.scenario, sim, report, brought: screen.brought });
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
          onRetry={() => go({ name: 'briefing', scenario: SCENARIO_BY_ID[screen.scenario.id] })}
          onMenu={() => go({ name: 'scenari' })}
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
    default:
      return null;
  }
}
