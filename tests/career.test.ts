import { describe, expect, it } from 'vitest';
import { EMPTY_CAREER, RANKS, applyMission, rankFor, xpFor } from '../src/data/career';
import { Sim } from '../src/engine/engine';
import { evaluate } from '../src/engine/scoring';
import { SCENARIO_BY_ID } from '../src/data/scenarios';

describe('carriera', () => {
  it('gradi in ordine crescente e calcolo del progresso', () => {
    for (let i = 1; i < RANKS.length; i++) expect(RANKS[i].xp).toBeGreaterThan(RANKS[i - 1].xp);
    expect(rankFor(0).rank.id).toBe('aspirante');
    expect(rankFor(260).rank.id).toBe('formazione');
    expect(rankFor(99999).next).toBeNull();
  });
  it('una missione assegna esperienza e il distintivo della prima uscita', () => {
    const sc = SCENARIO_BY_ID['ipoglicemia'];
    const sim = new Sim(sc, 'esame', ['zaino']);
    sim.start();
    sim.end('test');
    const rep = evaluate(sim, ['zaino']);
    const out = applyMission(EMPTY_CAREER, sim, rep, sc, 'esame', ['ipoglicemia'], [], { ipoglicemia: rep.score });
    expect(out.xpGained).toBe(xpFor(rep, sc, 'esame'));
    expect(out.newBadges).toContain('primo');
    expect(out.newBadges).toContain('tutte');
    expect(out.career.missions).toBe(1);
    const again = applyMission(out.career, sim, rep, sc, 'esame', ['ipoglicemia'], [], { ipoglicemia: rep.score });
    expect(again.newBadges).not.toContain('primo');
  });
});
