import { describe, expect, it } from 'vitest';
import { Sim } from '../src/engine/engine';
import { evaluate } from '../src/engine/scoring';
import { acrCasa } from '../src/data/scenarios/acr-casa';

function run(sim: Sim, id: string, params?: Record<string, unknown>) {
  const r = sim.startAction(id, params);
  if (!r.ok) throw new Error(`${id}: ${r.reason}`);
  while (sim.busy) sim.advance(1);
}

describe('ACR a domicilio – percorso ideale', () => {
  it('porta al ROSC con punteggio alto', () => {
    const loadout = ['zaino', 'dae', 'pallone', 'ossigeno', 'aspiratore'] as const;
    const sim = new Sim(acrCasa, 'esame', [...loadout]);
    sim.start();
    run(sim, 'valuta_scena');
    run(sim, 'guanti');
    run(sim, 'avvicinati');
    run(sim, 'coscienza');
    run(sim, 'gas');
    sim.declareProtocol('bls_adulto');
    run(sim, 'rcp');
    expect(sim.cpr.by).toBe('equipaggio');
    run(sim, 'dae_accendi');
    run(sim, 'dae_piastre', { pos: 'anterolaterale' });
    // analisi + carica
    while (sim.aed.phase !== 'pronto') sim.advance(1);
    run(sim, 'allontanatevi');
    expect(sim.aedShock()).toBe(true);
    run(sim, 'rcp');
    run(sim, 'pallone');
    run(sim, 'ossigeno', { device: 'reservoir', flow: 15 });
    // fino alla seconda analisi
    let guard = 0;
    while ((sim.aed.phase as string) !== 'analisi' && guard++ < 200) {
      if (sim.t - sim.cpr.compressorSince >= 110 && !sim.busy) run(sim, 'cambio_compressore');
      sim.advance(1);
    }
    while (sim.aed.phase !== 'pronto') sim.advance(1);
    run(sim, 'allontanatevi');
    sim.aedShock();
    run(sim, 'rcp');
    guard = 0;
    while (sim.arrest.roscAt === null && guard++ < 200) sim.advance(1);
    expect(sim.arrest.roscAt).not.toBeNull();
    run(sim, 'stop_rcp');
    run(sim, 'gas');
    run(sim, 'saturimetro');
    run(sim, 'comunica', { code: 'I3', items: [] });
    while (!sim.msaOnScene) sim.advance(1);
    run(sim, 'consegna');
    const rep = evaluate(sim, [...loadout]);
    const missed = rep.results.filter((r) => !r.ok).map((r) => r.obj.id);
    expect(missed).toEqual([]);
    expect(rep.outcome.status).toBe('ottimo');
    expect(rep.score).toBeGreaterThanOrEqual(85);
  });

  it('penalizza la RCP su un paziente con circolo', () => {
    const sim = new Sim(acrCasa, 'addestramento', ['zaino']);
    sim.start();
    sim.rosc();
    sim.cpr.active = false;
    sim.phase = 'paziente';
    sim.startCpr('equipaggio');
    expect(sim.penalties.length).toBe(1);
  });
});

describe('cambiamenti di stato del paziente', () => {
  it('rileva il peggioramento della coscienza e lo classifica', async () => {
    const { SCENARIO_BY_ID } = await import('../src/data/scenarios');
    const sim = new Sim(SCENARIO_BY_ID['ipoglicemia'], 'addestramento', ['zaino']);
    sim.start();
    sim.startAction('avvicinati');
    while (sim.busy) sim.advance(1);
    sim.advance(400);
    const c = sim.changes.filter((x) => x.key === 'coscienza');
    expect(c.length).toBeGreaterThanOrEqual(2);
    expect(c.every((x) => x.dir === 'peggiora')).toBe(true);
    expect(sim.changes.some((x) => x.key === 'vie_aeree' && x.dir === 'peggiora')).toBe(true);
  });
  it('segnala arresto e ritorno del circolo', async () => {
    const { SCENARIO_BY_ID } = await import('../src/data/scenarios');
    const sim = new Sim(SCENARIO_BY_ID['dolore-toracico'], 'addestramento', ['zaino', 'dae']);
    sim.start();
    sim.startAction('avvicinati');
    while (sim.busy) sim.advance(1);
    sim.advance(300);
    expect(sim.changes.some((x) => x.key === 'arresto' && x.dir === 'peggiora')).toBe(true);
  });
});
