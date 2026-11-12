import type { Mode } from '../engine/types';

export interface Settings {
  mode: Mode;
  sound: boolean;
  voice: boolean;
  realtime: boolean;
}

export interface ScenarioRecord {
  best: number;
  attempts: number;
  last: number;
  grade: string;
  at: number;
}

const KEY_SETTINGS = 'sirena118.settings.v1';
const KEY_PROGRESS = 'sirena118.progress.v1';
const KEY_EXTRA = 'sirena118.extra.v1';

export const DEFAULT_SETTINGS: Settings = { mode: 'addestramento', sound: true, voice: true, realtime: true };

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) } as T;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* archiviazione non disponibile: si continua senza salvare */
  }
}

export function loadSettings(): Settings {
  return read(KEY_SETTINGS, DEFAULT_SETTINGS);
}
export function saveSettings(s: Settings) {
  write(KEY_SETTINGS, s);
}

export function loadProgress(): Record<string, ScenarioRecord> {
  return read<Record<string, ScenarioRecord>>(KEY_PROGRESS, {});
}
export function recordResult(id: string, score: number, grade: string) {
  const all = loadProgress();
  const prev = all[id];
  all[id] = {
    best: Math.max(prev?.best ?? 0, score),
    attempts: (prev?.attempts ?? 0) + 1,
    last: score,
    grade: score >= (prev?.best ?? 0) ? grade : prev?.grade ?? grade,
    at: Date.now(),
  };
  write(KEY_PROGRESS, all);
  return all;
}

export interface ExtraRecords {
  triageBest?: number;
  cprBest?: number;
  eventiBest?: number;
}
export function loadExtra(): ExtraRecords {
  return read<ExtraRecords>(KEY_EXTRA, {});
}
export function saveExtra(patch: ExtraRecords) {
  write(KEY_EXTRA, { ...loadExtra(), ...patch });
}
