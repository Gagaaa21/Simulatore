import type { Sim } from './engine';
import type { Objective, Outcome, Penalty } from './types';
import { EQUIPMENT } from '../data/equipment';
import { PROTOCOLS } from '../data/protocols';

export const PENALTY_POINTS: Record<Penalty['severity'], number> = { critico: 15, grave: 8, lieve: 3 };

/** Obiettivi comuni a tutti gli scenari, generati dalla configurazione. */
export function commonObjectives(sim: Sim, initialLoadout: string[]): Objective[] {
  const s = sim.scenario;
  const out: Objective[] = [];
  out.push({
    id: 'c_scena',
    label: 'Sicurezza della scena valutata prima di avvicinarsi',
    category: 'sicurezza',
    points: 8,
    critical: s.scene.hazards.length > 0,
    check: (x) => x.did('valuta_scena') && (x.firstAt('valuta_scena') ?? 1e9) <= (x.firstAt('avvicinati') ?? 1e9),
    why: 'Autoprotezione e sicurezza della scena sono il primo anello di ogni intervento.',
    sources: ['ERC_FA_2025', 'ERC_BLS_2025'],
  });
  if (s.scene.hazards.length) {
    out.push({
      id: 'c_pericoli',
      label: 'Pericoli neutralizzati prima del contatto',
      category: 'sicurezza',
      points: 8,
      critical: true,
      check: (x) => s.scene.hazards.every((h) => {
        const fixed = x.firstAt(h.fixAction);
        const contact = x.firstAt('avvicinati');
        return fixed !== null && (contact === null || fixed <= contact);
      }),
      why: 'Un soccorritore ferito diventa un secondo paziente e nessuno soccorre il primo.',
      sources: ['ERC_FA_2025'],
    });
  }
  if (s.role !== 'laico') {
    out.push({
      id: 'c_guanti',
      label: 'Guanti indossati prima del contatto con il paziente',
      category: 'sicurezza',
      points: 4,
      check: (x) => !x.penalties.some((p) => p.id === 'no_gloves'),
      why: 'I dispositivi di protezione individuale proteggono te e il paziente.',
      sources: ['ERC_FA_2025'],
    });
  }
  if (s.loadout) {
    const ess = s.loadout.essential;
    out.push({
      id: 'c_presidi',
      label: `Presidi essenziali portati subito: ${ess.map((e) => EQUIPMENT[e].name).join(', ')}`,
      category: 'presidi',
      points: 10,
      check: () => ess.every((e) => initialLoadout.includes(e)),
      why: s.loadout.note ?? 'Il codice di invio e la patologia presunta indicano quali presidi servono al primo contatto.',
      sources: [],
    });
  }
  out.push({
    id: 'c_protocollo',
    label: `Protocollo corretto: ${s.protocol.correct.map((p) => PROTOCOLS[p].name).join(' / ')}`,
    category: 'valutazione',
    points: 12,
    check: (x) => !!x.protocol && (s.protocol.correct.includes(x.protocol.id) || !!s.protocol.acceptable?.includes(x.protocol.id)),
    why: 'Riconoscere il quadro permette di applicare la sequenza giusta senza perdere tempo.',
    sources: [],
  });
  if (s.role !== 'laico') {
    out.push({
      id: 'c_valutazione',
      label: `Valutazione sanitaria comunicata alla Centrale (${s.valutazione.correct.join(' / ')})`,
      category: 'comunicazione',
      points: 8,
      check: (x) => !!x.report && (s.valutazione.correct.includes(x.report.code) || !!s.valutazione.acceptable?.includes(x.report.code)),
      why: 'La Centrale decide destinazione e risorse sulla base della tua valutazione (codici I0–I4, DM 15/05/1992).',
      sources: ['DM_1992'],
    });
    if (s.reportKeys.length) {
      out.push({
        id: 'c_report',
        label: 'Report alla Centrale completo dei dati chiave',
        category: 'comunicazione',
        points: 6,
        check: (x) => !!x.report && s.reportKeys.every((k) => x.report!.items.includes(k)),
        why: `Per questo quadro la Centrale ha bisogno di: ${s.reportKeys.join(', ')}.`,
        sources: [],
      });
    }
  }
  return out;
}

export interface ObjectiveResult {
  obj: Objective;
  ok: boolean;
}

export interface Report {
  score: number;
  grade: 'Eccellente' | 'Buono' | 'Sufficiente' | 'Da rivedere';
  earned: number;
  total: number;
  results: ObjectiveResult[];
  penalties: Penalty[];
  penaltyPoints: number;
  criticalMissed: ObjectiveResult[];
  outcome: Outcome;
}

export function defaultOutcome(sim: Sim): Outcome {
  if (sim.inArrest()) {
    if (sim.arrest.irreversible) return { status: 'decesso', title: 'Paziente non rianimabile', text: 'Il tempo senza circolo è stato troppo lungo.' };
    return { status: 'critico', title: 'Arresto cardiaco in corso', text: 'La rianimazione continua con il mezzo avanzato.' };
  }
  if (sim.arrest.roscAt !== null) return { status: 'buono', title: 'Ritorno del circolo spontaneo', text: 'Il paziente ha ripreso il circolo ed è stato affidato alle cure avanzate.' };
  const v = sim.p.v;
  if (v.spo2 < 85 || v.sbp < 85 || sim.p.avpu === 'U') return { status: 'critico', title: 'Paziente instabile', text: 'All’arrivo in ospedale il paziente presenta funzioni vitali compromesse.' };
  return { status: 'buono', title: 'Paziente stabile', text: 'Il paziente arriva in ospedale in condizioni stabili.' };
}

export function evaluate(sim: Sim, initialLoadout: string[]): Report {
  const objectives = [...commonObjectives(sim, initialLoadout), ...sim.scenario.objectives];
  const results = objectives.map((obj) => {
    let ok = false;
    try {
      ok = obj.check(sim);
    } catch {
      ok = false;
    }
    return { obj, ok };
  });
  const total = objectives.reduce((a, o) => a + o.points, 0);
  const earned = results.filter((r) => r.ok).reduce((a, r) => a + r.obj.points, 0);
  const penaltyPoints = sim.penalties.reduce((a, p) => a + PENALTY_POINTS[p.severity], 0);
  const raw = total ? (earned / total) * 100 : 0;
  const score = Math.max(0, Math.round(raw - penaltyPoints));
  const criticalMissed = results.filter((r) => !r.ok && r.obj.critical);
  const hasCritical = criticalMissed.length > 0 || sim.penalties.some((p) => p.severity === 'critico');
  let grade: Report['grade'] = score >= 90 ? 'Eccellente' : score >= 75 ? 'Buono' : score >= 60 ? 'Sufficiente' : 'Da rivedere';
  if (hasCritical && (grade === 'Eccellente' || grade === 'Buono')) grade = 'Sufficiente';
  const outcome = sim.scenario.hooks?.outcome?.(sim) ?? defaultOutcome(sim);
  return { score, grade, earned, total, results, penalties: sim.penalties, penaltyPoints, criticalMissed, outcome };
}
