import type { Mode } from '../engine/types';
import { EMPTY_CAREER, type Career } from '../data/career';

export interface Settings {
  mode: Mode;
  sound: boolean;
  voice: boolean;
  realtime: boolean;
  volume: number; // 0..1
  ambience: boolean;
  textSize: 'normale' | 'grande';
  motion: 'piena' | 'ridotta';
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

export const DEFAULT_SETTINGS: Settings = { mode: 'addestramento', sound: true, voice: true, realtime: true, volume: 0.7, ambience: true, textSize: 'normale', motion: 'piena' };

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

// ───────────────────────── carriera
const KEY_CAREER = 'sirena118.career.v1';
export function loadCareer(): Career {
  const c = read<Career>(KEY_CAREER, EMPTY_CAREER);
  return { ...EMPTY_CAREER, ...c, badges: { ...(c.badges ?? {}) }, history: c.history ?? [], shifts: c.shifts ?? [] };
}
export function saveCareer(c: Career) {
  write(KEY_CAREER, c);
}
export function resetAll() {
  try {
    ['sirena118.settings.v1', KEY_PROGRESS, KEY_EXTRA, KEY_CAREER, 'sirena118.coach.v1'].forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* archiviazione non disponibile */
  }
}
