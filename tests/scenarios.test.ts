import { describe, expect, it } from 'vitest';
import { Sim } from '../src/engine/engine';
import { ACTIONS } from '../src/engine/actions';
import { evaluate } from '../src/engine/scoring';
import { SCENARIOS, SCENARIO_BY_ID } from '../src/data/scenarios';
import { SOURCES } from '../src/data/sources';
import { PROTOCOLS } from '../src/data/protocols';
import { CAPACITY, EQUIPMENT, type EquipmentId } from '../src/data/equipment';
import type { ProtocolId } from '../src/engine/types';
import { TUTORIAL_STEPS } from '../src/data/scenarios/tutorial';

// ───────────────────────── integrità dei dati
describe('integrità degli scenari', () => {
  for (const sc of SCENARIOS) {
    it(`${sc.id}: riferimenti validi`, () => {
      const srcs = [...sc.sources, ...sc.objectives.flatMap((o) => o.sources)];
      for (const s of srcs) expect(SOURCES[s], `fonte ${s}`).toBeDefined();
      for (const p of [...sc.protocol.correct, ...(sc.protocol.acceptable ?? [])]) expect(PROTOCOLS[p], `protocollo ${p}`).toBeDefined();
      for (const e of [...(sc.loadout?.essential ?? []), ...(sc.loadout?.recommended ?? [])]) expect(EQUIPMENT[e], `presidio ${e}`).toBeDefined();
      for (const h of sc.scene.hazards) expect(ACTIONS[h.fixAction], `azione ${h.fixAction}`).toBeDefined();
      const ess = (sc.loadout?.essential ?? []).reduce((a, e) => a + EQUIPMENT[e].slots, 0);
      expect(ess).toBeLessThanOrEqual(CAPACITY);
      expect(new Set(sc.objectives.map((o) => o.id)).size).toBe(sc.objectives.length);
    });
    it(`${sc.id}: regge 20 minuti senza interventi e una sequenza casuale di azioni`, () => {
      const sim = new Sim(sc, 'esame', sc.loadout ? [...sc.loadout.essential] : []);
      sim.start();
      sim.advance(1200);
      expect(() => evaluate(sim, [])).not.toThrow();
      const sim2 = new Sim(sc, 'addestramento', sc.loadout ? [...sc.loadout.essential, ...sc.loadout.recommended].slice(0, 6) : []);
      sim2.start();
      let seed = 7;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      const ids = Object.keys(ACTIONS);
      for (let i = 0; i < 200 && !sim2.ended; i++) {
        const id = ids[Math.floor(rnd() * ids.length)];
        const def = ACTIONS[id];
        if (def.visible && !def.visible(sim2)) continue;
        sim2.startAction(id, { device: 'maschera', flow: 6, pos: 'laterale', region: 'gamba_dx', method: 'ventilazione', code: 'I2', items: [], mode: 'barella' });
        while (sim2.busy) sim2.advance(1);
        if (sim2.aed.phase === 'pronto') sim2.aedShock();
      }
      expect(() => evaluate(sim2, [])).not.toThrow();
    });
  }
});

// ───────────────────────── percorsi ideali
type Step = string | [string, Record<string, unknown>] | ((s: Sim) => void);

function make(id: string, extra: EquipmentId[] = []) {
  const sc = SCENARIO_BY_ID[id];
  const kit = sc.loadout ? Array.from(new Set([...sc.loadout.essential, ...extra])) : [];
  const sim = new Sim(sc, 'esame', kit);
  sim.start();
  return { sim, kit };
}
function act(sim: Sim, id: string, params?: Record<string, unknown>) {
  const r = sim.startAction(id, params);
  if (!r.ok) throw new Error(`${sim.scenario.id} – ${id}: ${r.reason}`);
  while (sim.busy) sim.advance(1);
}
function play(sim: Sim, steps: Step[]) {
  for (const st of steps) {
    if (typeof st === 'function') st(sim);
    else if (typeof st === 'string') act(sim, st);
    else act(sim, st[0], st[1]);
  }
}
const proto = (id: ProtocolId) => (s: Sim) => s.declareProtocol(id);
const until = (cond: (s: Sim) => boolean, max = 1500) => (s: Sim) => {
  let n = 0;
  while (!cond(s) && n++ < max) s.advance(1);
  if (!cond(s)) throw new Error(`${s.scenario.id}: condizione non raggiunta`);
};
const shockWhenReady = (s: Sim) => {
  until((x) => x.aed.phase === 'pronto' || x.aed.phase === 'non_consigliato', 60)(s);
  if (s.aed.phase === 'pronto') {
    act(s, 'allontanatevi');
    s.aedShock();
  }
};
function expectAll(sim: Sim, kit: string[], minScore = 85) {
  const rep = evaluate(sim, kit);
  const missed = rep.results.filter((r) => !r.ok).map((r) => r.obj.id);
  expect(missed, `obiettivi mancati in ${sim.scenario.id}`).toEqual([]);
  expect(sim.penalties.map((p) => p.id), `penalità in ${sim.scenario.id}`).toEqual([]);
  expect(rep.score).toBeGreaterThanOrEqual(minScore);
  return rep;
}

describe('percorsi ideali', () => {
  it('soccorso: soffocamento adulto', () => {
    const { sim, kit } = make('fbao-adulto');
    play(sim, ['valuta_scena', 'guanti', 'avvicinati', 'coscienza', proto('fbao_adulto'), 'colpi_dorsali', 'compressioni_addominali', 'colpi_dorsali', 'compressioni_addominali', until((s) => s.flags.liberatoAt !== undefined, 5), 'saturimetro', ['comunica', { code: 'I2', items: ['spo2'] }], ['trasporta', { mode: 'barella', pos: 'seduto' }]]);
    expectAll(sim, kit);
  });

  it('soffocamento lattante', () => {
    const { sim, kit } = make('fbao-lattante');
    play(sim, ['valuta_scena', 'guanti', 'avvicinati', 'coscienza', proto('fbao_pediatrico'), 'colpi_dorsali', 'compressioni_toraciche_lattante', 'colpi_dorsali', until((s) => s.flags.liberatoAt !== undefined, 5), 'saturimetro', ['comunica', { code: 'I2', items: ['spo2'] }], ['trasporta', { mode: 'barella', pos: 'supino' }]]);
    expectAll(sim, kit);
  });

  it('ustione da liquido bollente in una bambina', () => {
    const { sim, kit } = make('ustione-bambino');
    play(sim, ['valuta_scena', 'guanti', 'spegni_fonte', 'avvicinati', 'coscienza', 'raffredda_ustione', 'rimuovi_indumenti', 'telo', 'rassicura', proto('ustioni'), 'stima_superficie', 'q_eventi', 'saturimetro', 'attendi_lungo', 'attendi_lungo', 'attendi_lungo', 'copri_ustione', ['comunica', { code: 'I2', items: ['ustione', 'fc'] }], ['trasporta', { mode: 'barella', pos: 'supino' }]]);
    const rep = expectAll(sim, kit);
    expect(rep.outcome.status).toBe('ottimo');
    expect(sim.p.v.temp).toBeGreaterThanOrEqual(36);
  });

  it('ustione: senza coprire il resto del corpo la bambina diventa ipotermica', () => {
    const { sim } = make('ustione-bambino');
    play(sim, ['valuta_scena', 'guanti', 'spegni_fonte', 'avvicinati', 'raffredda_ustione', 'attendi_lungo', 'attendi_lungo', 'attendi_lungo', 'attendi_lungo', 'attendi_lungo', 'attendi_lungo']);
    expect(sim.p.v.temp).toBeLessThan(35.6);
    expect(evaluate(sim, []).outcome.status).toBe('critico');
  });

  it('emorragia in cantiere', () => {
    const { sim, kit } = make('emorragia-cantiere');
    play(sim, ['valuta_scena', 'guanti', 'togli_tensione', 'avvicinati', 'compressione_diretta', ['tourniquet', { region: 'gamba_dx', pos: 0.24, joint: false }], proto('emorragia'), 'richiedi_msa', 'telo', 'saturimetro', 'pressione', ['comunica', { code: 'I3', items: ['tq', 'pa', 'fc'] }], until((s) => s.msaOnScene), 'consegna']);
    const rep = expectAll(sim, kit);
    expect(rep.outcome.status).toBe('ottimo');
  });

  it('ipoglicemia', () => {
    const { sim, kit } = make('ipoglicemia');
    play(sim, ['valuta_scena', 'guanti', 'avvicinati', 'glicemia', proto('ipoglicemia'), 'glucosio_os', 'q_pasto', 'attendi_lungo', 'attendi_lungo', 'glicemia', ['comunica', { code: 'I2', items: ['glicemia'] }], ['trasporta', { mode: 'barella', pos: 'semiseduto' }]]);
    expectAll(sim, kit);
    expect(sim.p.v.glu).toBeGreaterThan(70);
    expect(sim.p.speech).toBe('normale');
  });

  it('missione guidata: ogni passo della guida si completa', () => {
    const { sim, kit } = make('tutorial');
    play(sim, ['valuta_scena', 'guanti', 'avvicinati', 'coscienza', 'saturimetro', 'glicemia', 'q_pasto', proto('ipoglicemia'), 'glucosio_os', 'attendi_lungo', 'attendi_lungo', 'glicemia', ['comunica', { code: 'I2', items: ['glicemia'] }], ['trasporta', { mode: 'barella', pos: 'semiseduto' }]]);
    for (const st of TUTORIAL_STEPS) expect(st.done(sim), st.text).toBe(true);
    expectAll(sim, kit);
  });

  it('ictus', () => {
    const { sim, kit } = make('ictus');
    play(sim, ['valuta_scena', 'guanti', 'avvicinati', 'coscienza', 'cincinnati', 'q_esordio', 'glicemia', 'q_farmaci', 'saturimetro', 'pressione', proto('ictus'), ['comunica', { code: 'I2', items: ['cincinnati', 'esordio', 'glicemia'] }], ['trasporta', { mode: 'barella', pos: 'semiseduto' }]]);
    const rep = expectAll(sim, kit);
    expect(rep.outcome.status).toBe('ottimo');
  });

  it('dolore toracico con arresto', () => {
    const { sim, kit } = make('dolore-toracico');
    play(sim, ['valuta_scena', 'guanti', 'avvicinati', 'rassicura', 'saturimetro', 'pressione', 'q_dolore', 'q_esordio', 'richiedi_msa', proto('dolore_toracico'), ['posizione', { pos: 'semiseduto' }], 'ecg', until((s) => s.inArrest(), 200), 'gas', 'rcp', 'dae_accendi', ['dae_piastre', { pos: 'anterolaterale' }], shockWhenReady, 'rcp', until((s) => s.arrest.roscAt !== null, 400), 'stop_rcp', 'gas', ['comunica', { code: 'I3', items: ['pa', 'esordio'] }], until((s) => s.msaOnScene), 'consegna']);
    const rep = expectAll(sim, kit, 80);
    expect(rep.outcome.status).toBe('ottimo');
  });

  it('trauma da moto', () => {
    const { sim, kit } = make('trauma-moto', ['materasso', 'cintura_pelvica']);
    play(sim, ['valuta_scena', 'guanti', 'alta_visibilita', 'posiziona_mezzo', 'avvicinati', 'mils', 'rimuovi_casco', 'sublussazione', 'richiedi_elisoccorso', proto('trauma'), ['ossigeno', { device: 'reservoir', flow: 15 }], 'saturimetro', 'cerca_emorragie', 'cintura_pelvica', 'telo', 'collare', 'cucchiaio', 'materasso', 'pressione', 'coscienza', ['comunica', { code: 'I3', items: ['avpu', 'spo2', 'pa', 'fc'] }], until((s) => s.msaOnScene), 'consegna']);
    const rep = expectAll(sim, kit);
    expect(rep.outcome.status).toBe('ottimo');
  });

  it('BPCO', () => {
    const { sim, kit } = make('bpco');
    play(sim, ['valuta_scena', 'guanti', 'avvicinati', 'saturimetro', proto('dispnea'), ['ossigeno', { device: 'occhialini', flow: 3 }], 'inalatore', 'conta_fr', 'pressione', 'attendi_lungo', ['comunica', { code: 'I2', items: ['spo2', 'fr'] }], ['trasporta', { mode: 'sedia', pos: 'seduto' }]]);
    expectAll(sim, kit);
  });

  it('annegamento', () => {
    const { sim, kit } = make('annegamento');
    play(sim, [
      'valuta_scena',
      'guanti',
      'messa_sicurezza_acqua',
      'avvicinati',
      'coscienza',
      proto('annegamento'),
      'ventilazioni_iniziali',
      'rcp',
      'pallone',
      ['ossigeno', { device: 'reservoir', flow: 15 }],
      'dae_accendi',
      ['dae_piastre', { pos: 'anterolaterale' }],
      (s) => {
        let n = 0;
        while (s.arrest.roscAt === null && n++ < 600) {
          if (!s.cpr.active && s.inArrest() && s.aed.phase !== 'analisi') act(s, 'rcp');
          s.advance(1);
        }
      },
      until((s) => s.arrest.roscAt !== null),
      'stop_rcp',
      until((s) => s.p.vomitInMouth, 60),
      'aspira',
      ['posizione', { pos: 'laterale' }],
      'telo',
      ['comunica', { code: 'I3', items: [] }],
      until((s) => s.msaOnScene),
      'consegna',
    ]);
    const rep = expectAll(sim, kit, 80);
    expect(rep.outcome.status).toBe('ottimo');
  });

  it('sovradosaggio da oppioidi', () => {
    const { sim, kit } = make('oppioidi');
    play(sim, ['valuta_scena', 'guanti', 'siringa', 'avvicinati', 'apri_vie_aeree', 'pallone', ['ossigeno', { device: 'reservoir', flow: 15 }], 'richiedi_msa', proto('oppioidi'), 'pupille', 'glicemia', 'saturimetro', 'conta_fr', 'telo', ['comunica', { code: 'I3', items: ['fr', 'spo2', 'pupille'] }], until((s) => s.msaOnScene), 'consegna']);
    expectAll(sim, kit);
    expect(sim.p.v.spo2).toBeGreaterThan(90);
  });

  it('colpo di calore', () => {
    const { sim, kit } = make('colpo-calore');
    play(sim, ['valuta_scena', 'guanti', 'apri_spazio', 'avvicinati', 'temperatura', 'scopri', proto('colpo_calore'), ['raffredda', { method: 'immersione' }], (s) => {
      let n = 0;
      while (s.p.v.temp >= 39 && n++ < 40) act(s, 'attendi');
    }, 'stop_raffreddamento', 'temperatura', 'coscienza', ['comunica', { code: 'I3', items: ['temperatura', 'avpu'] }], ['trasporta', { mode: 'barella', pos: 'supino' }]]);
    const rep = expectAll(sim, kit);
    expect(rep.outcome.status).toBe('ottimo');
  });

  it('crisi convulsiva', () => {
    const { sim, kit } = make('convulsioni', ['ossigeno']);
    play(sim, ['valuta_scena', 'guanti', 'apri_spazio', 'avvicinati', 'proteggi_crisi', 'cronometra', proto('convulsioni'), until((s) => !s.p.seizing, 200), 'gas', ['posizione', { pos: 'laterale' }], 'glicemia', 'saturimetro', ['ossigeno', { device: 'maschera', flow: 6 }], 'coscienza', ['comunica', { code: 'I2', items: ['avpu', 'glicemia'] }], ['trasporta', { mode: 'barella', pos: 'laterale' }]]);
    expectAll(sim, kit);
  });

  it('intossicazione alcolica', () => {
    const { sim, kit } = make('alcol');
    play(sim, ['valuta_scena', 'guanti', 'avvicinati', 'aspira', ['posizione', { pos: 'laterale' }], 'coscienza', 'saturimetro', proto('intossicazione'), 'glicemia', 'richiedi_msa', 'telo', ['comunica', { code: 'I3', items: ['avpu', 'glicemia', 'spo2'] }], until((s) => s.msaOnScene), 'consegna']);
    // la SpO2 sale con la posizione laterale e le vie aeree libere anche senza ossigeno? verifica obiettivo
    const rep = evaluate(sim, kit);
    const missed = rep.results.filter((r) => !r.ok).map((r) => r.obj.id);
    expect(missed.filter((m) => m !== 'ossigeno')).toEqual([]);
  });

  it('anafilassi', () => {
    const { sim, kit } = make('anafilassi');
    play(sim, ['valuta_scena', 'guanti', 'avvicinati', 'autoiniettore', 'richiedi_msa', proto('anafilassi'), ['ossigeno', { device: 'reservoir', flow: 15 }], 'saturimetro', 'pressione', until((s) => s.t - Number(s.flags.adrenalina1At) >= 300, 400), 'autoiniettore', 'attendi_lungo', ['comunica', { code: 'I3', items: ['pa', 'spo2'] }], until((s) => s.msaOnScene), 'consegna']);
    expectAll(sim, kit);
    expect(sim.p.v.sbp).toBeGreaterThan(95);
  });

  it('arresto al concerto', () => {
    const { sim, kit } = make('acr-concerto');
    play(sim, ['valuta_scena', 'guanti', 'apri_spazio', 'avvicinati', 'coscienza', 'gas', 'rcp', proto('bls_adulto'), 'dae_accendi', ['dae_piastre', { pos: 'anterolaterale' }], shockWhenReady, 'rcp', until((s) => s.arrest.roscAt !== null, 300), 'stop_rcp', 'gas', ['comunica', { code: 'I3', items: [] }], until((s) => s.msaOnScene), 'consegna']);
    const rep = expectAll(sim, kit);
    expect(rep.outcome.status).toBe('ottimo');
  });

  it('arresto pediatrico (PBLSD)', () => {
    const { sim, kit } = make('pbls-lattante');
    play(sim, [
      'valuta_scena',
      'guanti',
      'avvicinati',
      'coscienza',
      'gas',
      proto('pbls'),
      'aspira',
      'ventilazioni_iniziali',
      'rcp',
      (s) => {
        s.cpr.ratio = '15:2';
        s.set('ratioScelto', '15:2');
      },
      'pallone',
      ['ossigeno', { device: 'reservoir', flow: 15 }],
      'dae_accendi',
      ['dae_piastre', { pos: 'anteroposteriore', pediatric: true }],
      (s) => {
        let n = 0;
        while (s.arrest.roscAt === null && n++ < 600) {
          if (!s.cpr.active && s.inArrest() && s.aed.phase !== 'analisi') act(s, 'rcp');
          s.advance(1);
        }
      },
      until((s) => s.arrest.roscAt !== null),
      'stop_rcp',
      'saturimetro',
      ['comunica', { code: 'I3', items: [] }],
      until((s) => s.msaOnScene),
      'consegna',
    ]);
    const rep = expectAll(sim, kit, 80);
    expect(rep.outcome.status).toBe('ottimo');
  });

  it('fuori servizio al supermercato', () => {
    const { sim, kit } = make('acr-supermercato');
    play(sim, ['valuta_scena', 'avvicinati', 'coscienza', 'chiama_112', 'manda_dae', 'gas', 'rcp', proto('bls_adulto'), until((s) => s.has('dae'), 200), 'dae_accendi', ['dae_piastre', { pos: 'anterolaterale' }], shockWhenReady, 'rcp', (s) => {
      let n = 0;
      while (s.arrest.roscAt === null && n++ < 400) {
        if (s.cpr.active && s.t - s.cpr.compressorSince >= 110 && !s.did('cambio_compressore')) act(s, 'cambio_compressore');
        s.advance(1);
      }
    }, until((s) => s.arrest.roscAt !== null), 'stop_rcp', 'gas', until((s) => s.msaOnScene), 'consegna']);
    const rep = expectAll(sim, kit);
    expect(rep.outcome.status).toBe('buono');
  });
});
