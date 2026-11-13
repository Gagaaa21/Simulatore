/** Carriera: gradi, punti esperienza e distintivi. */
import type { Sim } from '../engine/engine';
import type { Report } from '../engine/scoring';
import type { Mode, ProtocolId, Scenario } from '../engine/types';

export interface Rank {
  id: string;
  name: string;
  xp: number;
  stripes: number;
}

export const RANKS: Rank[] = [
  { id: 'aspirante', name: 'Aspirante soccorritore', xp: 0, stripes: 0 },
  { id: 'formazione', name: 'Soccorritore in formazione', xp: 250, stripes: 1 },
  { id: 'soccorritore', name: 'Soccorritore', xp: 700, stripes: 2 },
  { id: 'esperto', name: 'Soccorritore esperto', xp: 1400, stripes: 3 },
  { id: 'capo', name: 'Capo equipaggio', xp: 2400, stripes: 4 },
  { id: 'istruttore', name: 'Istruttore', xp: 3800, stripes: 5 },
];

export function rankFor(xp: number): { rank: Rank; next: Rank | null; progress: number } {
  let i = 0;
  while (i + 1 < RANKS.length && xp >= RANKS[i + 1].xp) i++;
  const rank = RANKS[i];
  const next = RANKS[i + 1] ?? null;
  const progress = next ? (xp - rank.xp) / (next.xp - rank.xp) : 1;
  return { rank, next, progress };
}

export interface MissionRecord {
  id: string;
  score: number;
  grade: string;
  at: number;
  mode: Mode;
  protocol: ProtocolId;
  clean: boolean;
}

export interface Career {
  xp: number;
  missions: number;
  history: MissionRecord[];
  badges: Record<string, number>;
  shifts: { at: number; avg: number; ids: string[] }[];
  goodReports: number;
}

export const EMPTY_CAREER: Career = { xp: 0, missions: 0, history: [], badges: {}, shifts: [], goodReports: 0 };

export function xpFor(report: Report, scenario: Scenario, mode: Mode): number {
  const diff = scenario.difficulty === 3 ? 1.5 : scenario.difficulty === 2 ? 1.25 : 1;
  return Math.round(report.score * diff * (mode === 'esame' ? 1.2 : 1));
}

export interface Badge {
  id: string;
  name: string;
  desc: string;
  /** forma dell'emblema */
  shape: 'cuore' | 'fulmine' | 'stella' | 'croce' | 'radio' | 'laccio' | 'orologio' | 'scudo' | 'bimbo' | 'tenda' | 'mappa' | 'luna' | 'mani';
  color: string;
}

export const BADGES: Badge[] = [
  { id: 'primo', name: 'Prima uscita', desc: 'Completa la tua prima missione.', shape: 'croce', color: '#ff7a1a' },
  { id: 'scarica', name: 'Scarica rapida', desc: 'Primo shock entro 90 secondi dal contatto con il paziente.', shape: 'fulmine', color: '#f5c21b' },
  { id: 'rosc', name: 'Il cuore riparte', desc: 'Ottieni il ritorno del circolo spontaneo in un arresto cardiaco.', shape: 'cuore', color: '#e5323b' },
  { id: 'pulito', name: 'Mani pulite', desc: 'Concludi una missione senza alcun errore.', shape: 'scudo', color: '#4be38a' },
  { id: 'eccellenza', name: 'Eccellenza', desc: 'Ottieni almeno 90 punti in una missione.', shape: 'stella', color: '#ffd84d' },
  { id: 'esame', name: 'Esame superato', desc: 'Ottieni almeno 75 punti in modalità esame.', shape: 'scudo', color: '#8ab8ff' },
  { id: 'laccio', name: 'Emostasi', desc: 'Tourniquet efficace entro 2 minuti dal contatto.', shape: 'laccio', color: '#d32f2f' },
  { id: 'radio', name: 'Voce chiara', desc: 'Valutazione e dati chiave riferiti alla SORES in 5 missioni.', shape: 'radio', color: '#3f8cff' },
  { id: 'pediatra', name: 'Piccoli pazienti', desc: 'Almeno 75 punti in tutte le missioni pediatriche.', shape: 'bimbo', color: '#f2a6c1' },
  { id: 'tutte', name: 'Visto tutto', desc: 'Completa ogni missione almeno una volta.', shape: 'mappa', color: '#c9d4df' },
  { id: 'turno', name: 'Fine turno', desc: 'Completa un turno di tre chiamate.', shape: 'luna', color: '#c8a6ff' },
  { id: 'notte', name: 'Turno perfetto', desc: 'Chiudi un turno con una media di almeno 85 punti.', shape: 'stella', color: '#ff7a1a' },
  { id: 'ritmo', name: 'Ritmo giusto', desc: 'Almeno 85% di compressioni nel ritmo corretto nell’allenamento RCP.', shape: 'mani', color: '#4be38a' },
  { id: 'triage', name: 'Triagista', desc: 'Almeno 85 punti nella maxi-emergenza.', shape: 'tenda', color: '#e5323b' },
  { id: 'planner', name: 'Pianificatore', desc: 'Almeno 90 punti nella pianificazione di un evento.', shape: 'orologio', color: '#ff9fcf' },
];

export const BADGE_BY_ID: Record<string, Badge> = Object.fromEntries(BADGES.map((b) => [b.id, b]));

export interface MissionOutcome {
  xpGained: number;
  newBadges: string[];
  before: Rank;
  after: Rank;
  career: Career;
}

/** Aggiorna la carriera dopo una missione e restituisce punti e distintivi ottenuti. */
export function applyMission(career: Career, sim: Sim, report: Report, scenario: Scenario, mode: Mode, allScenarioIds: string[], pediatricIds: string[], bestById: Record<string, number>): MissionOutcome {
  const xpGained = xpFor(report, scenario, mode);
  const before = rankFor(career.xp).rank;
  const c: Career = {
    ...career,
    xp: career.xp + xpGained,
    missions: career.missions + 1,
    history: [
      { id: scenario.id, score: report.score, grade: report.grade, at: Date.now(), mode, protocol: scenario.protocol.correct[0], clean: report.penalties.length === 0 },
      ...career.history,
    ].slice(0, 60),
    badges: { ...career.badges },
    goodReports: career.goodReports + (report.results.some((r) => r.obj.id === 'c_sores' && r.ok) && !report.results.some((r) => r.obj.id === 'c_report' && !r.ok) ? 1 : 0),
  };
  const earned: string[] = [];
  const give = (id: string, cond: boolean) => {
    if (cond && !c.badges[id]) {
      c.badges[id] = Date.now();
      earned.push(id);
    }
  };
  const contact = sim.flags.contattoAt === undefined ? null : Number(sim.flags.contattoAt);
  give('primo', true);
  give('scarica', sim.aed.firstShockAt !== null && contact !== null && sim.aed.firstShockAt - contact <= 90);
  give('rosc', sim.arrest.roscAt !== null && !sim.inArrest());
  give('pulito', report.penalties.length === 0 && report.score >= 60);
  give('eccellenza', report.score >= 90);
  give('esame', mode === 'esame' && report.score >= 75);
  give('laccio', !!sim.tourniquet?.ok && contact !== null && sim.tourniquet.at - contact <= 120);
  give('radio', c.goodReports >= 5);
  give('pediatra', pediatricIds.every((id) => (bestById[id] ?? 0) >= 75));
  give('tutte', allScenarioIds.every((id) => bestById[id] !== undefined));
  return { xpGained, newBadges: earned, before, after: rankFor(c.xp).rank, career: c };
}

export function unlockBadge(career: Career, id: string): { career: Career; earned: boolean } {
  if (career.badges[id]) return { career, earned: false };
  return { career: { ...career, badges: { ...career.badges, [id]: Date.now() } }, earned: true };
}
