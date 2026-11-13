import { describe, expect, it } from 'vitest';
import { Sim } from '../src/engine/engine';
import { evaluate } from '../src/engine/scoring';
import { nextStep, type CoachStep } from '../src/engine/coach';
import { CAREER_SCENARIOS, SCENARIO_BY_ID } from '../src/data/scenarios';
import { CAPACITY, EQUIPMENT, type EquipmentId } from '../src/data/equipment';

/** Le scelte che il giocatore farebbe nei pannelli seguendo il testo della guida. */
function paramsFor(sim: Sim, st: CoachStep): Record<string, unknown> | undefined {
  switch (st.action) {
    case 'ossigeno': {
      const o = sim.o2Order;
      return o?.device && !sim.bvm && !sim.inArrest() ? { device: o.device, flow: o.flow, fio2: o.fio2 } : { device: 'reservoir', flow: 15 };
    }
    case 'posizione':
      return { pos: st.pos ?? sim.p.position };
    case 'comunica':
      return { items: Array.from(sim.measurements.keys()) };
    case 'trasporta':
      return { mode: sim.has('sedia') && sim.scenario.protocol.correct.includes('dispnea') ? 'sedia' : 'barella', pos: sim.p.position === 'in_piedi' ? 'seduto' : sim.p.position };
    case 'tourniquet': {
      const b = sim.p.bleeding!;
      return { region: b.region, pos: Math.max(0.02, b.pos - 0.06), joint: false };
    }
    case 'raffredda':
      return { method: sim.scenario.dispatch.extra?.includes('vasca') ? 'immersione' : sim.has('kit_raffreddamento') ? 'taco' : 'ventilazione' };
    case 'dae_piastre':
      return sim.p.weightKg < 25 ? { pos: 'anteroposteriore', pediatric: true } : { pos: 'anterolaterale', pediatric: false };
    default:
      return undefined;
  }
}

/** Gioca la missione eseguendo sempre il passo suggerito dalla guida. */
function followCoach(id: string, soloEssenziali = false) {
  const sc = SCENARIO_BY_ID[id];
  const kit: EquipmentId[] = [];
  if (sc.loadout) {
    for (const e of soloEssenziali ? sc.loadout.essential : [...sc.loadout.essential, ...sc.loadout.recommended]) {
      if (kit.reduce((a, k) => a + EQUIPMENT[k].slots, 0) + EQUIPMENT[e].slots <= CAPACITY) kit.push(e);
    }
  }
  const sim = new Sim(sc, 'addestramento', kit);
  sim.start();
  let last = '';
  let same = 0;
  for (let i = 0; i < 600 && !sim.ended; i++) {
    const st = nextStep(sim);
    if (!st) break;
    if (st.protocol) {
      sim.declareProtocol(sc.protocol.correct[0]);
      continue;
    }
    if (st.cprRatio) {
      sim.cpr.ratio = st.cprRatio;
      sim.set('ratioScelto', st.cprRatio);
      continue;
    }
    if (!st.action) {
      // l'unico passo «a mano» è il pulsante Shock del DAE: lo preme solo quando la guida lo dice
      if (/premi Shock/.test(st.text)) {
        sim.advance(1);
        sim.aedShock();
      } else sim.advance(/DAE/.test(st.text) ? 1 : 5);
      continue;
    }
    same = st.action === last ? same + 1 : 0;
    last = st.action;
    if (same > 8) {
      sim.advance(10);
      continue;
    }
    const r = sim.startAction(st.action, paramsFor(sim, st));
    if (!r.ok) {
      if (r.missing?.length) {
        sim.fetchEquipment(r.missing);
        while (sim.busy) sim.advance(1);
      } else sim.advance(5);
      continue;
    }
    while (sim.busy) sim.advance(1);
    sim.advance(2); // il tempo di leggere il passo successivo
  }
  return { sim, rep: evaluate(sim, kit) };
}

export { followCoach };

describe('la guida «Prossimo passo» porta a un buon intervento', () => {
  for (const sc of CAREER_SCENARIOS) {
    it(sc.id, () => {
      const { sim, rep } = followCoach(sc.id);
      const critici = sim.penalties.filter((p) => p.severity !== 'lieve').map((p) => p.id);
      expect(critici, `errori seguendo la guida in ${sc.id}`).toEqual([]);
      expect(sim.ended, `${sc.id}: la guida non porta alla fine della missione`).not.toBeNull();
      expect(rep.score, `${sc.id}: ${rep.results.filter((r) => !r.ok).map((r) => r.obj.id).join(', ')}`).toBeGreaterThanOrEqual(90);
    });
  }
});

describe('la guida funziona anche con i soli presidi essenziali (fa recuperare il resto)', () => {
  for (const sc of CAREER_SCENARIOS) {
    it(sc.id, () => {
      const { sim, rep } = followCoach(sc.id, true);
      const gravi = sim.penalties.filter((p) => p.severity === 'critico').map((p) => p.id);
      expect(gravi, `errori critici in ${sc.id}`).toEqual([]);
      expect(sim.ended, `${sc.id}: la guida non porta alla fine della missione`).not.toBeNull();
      expect(rep.score, `${sc.id}: ${rep.results.filter((r) => !r.ok).map((r) => r.obj.id).join(', ')}`).toBeGreaterThanOrEqual(75);
    });
  }
});
