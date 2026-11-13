import { describe, expect, it } from 'vitest';
import { EVENTS, MAURER_TYPES, a1Score, maurerA, maurerB, maurerResources, maurerScore, riskClass } from '../src/data/events';
import { fvgProcedura, scoreSores } from '../src/data/events';
import { VICTIMS } from '../src/data/triage';

describe('Accordo 2014 – A1 e Maurer', () => {
  it('soglie di capienza', () => {
    expect(maurerA(500, false)).toBe(1);
    expect(maurerA(6000, false)).toBe(5);
    expect(maurerA(20000, false)).toBe(7);
    expect(maurerA(40000, false)).toBe(9);
    expect(maurerA(3000, true)).toBe(8);
    expect(maurerB(35000)).toBe(70);
  });
  it('concerto rock allo stadio', () => {
    const e = EVENTS.find((x) => x.id === 'rock')!;
    expect(a1Score(e.a1)).toBe(33);
    expect(riskClass(33).label).toBe('Moderato / elevato');
    const f = MAURER_TYPES.find((t) => t.id === e.type)!.factor;
    const s = maurerScore(maurerA(e.capacity, e.indoor), maurerB(e.expected), f, e.personalita, e.disordini);
    expect(s).toBe(79);
    expect(maurerResources(s)).toEqual({ soccorso: 5, trasporto: 5, piedi: 40, medici: 3 });
  });
  it('sagra di paese', () => {
    const e = EVENTS.find((x) => x.id === 'sagra')!;
    expect(a1Score(e.a1)).toBe(18);
    const s = maurerScore(maurerA(e.capacity, e.indoor), maurerB(e.expected), 0.4, 0, false);
    expect(s).toBe(5.2);
    expect(maurerResources(s)).toEqual({ soccorso: 0, trasporto: 1, piedi: 5, medici: 0 });
  });
  it('corteo', () => {
    const e = EVENTS.find((x) => x.id === 'corteo')!;
    expect(a1Score(e.a1)).toBe(27);
    const s = maurerScore(maurerA(e.capacity, e.indoor), maurerB(e.expected), 0.8, e.personalita, e.disordini);
    expect(s).toBe(49.6);
    expect(maurerResources(s)).toEqual({ soccorso: 3, trasporto: 4, piedi: 30, medici: 2 });
  });
});

describe('triage START / JumpSTART', () => {
  /** Applica l'algoritmo ai dati della vittima e verifica che coincida con la soluzione. */
  it('ogni codice corrisponde all’algoritmo', () => {
    for (const v of VICTIMS) {
      let tag: string;
      if (v.walks) tag = 'verde';
      else if (!v.breathes) {
        if (v.breathesAfterAirway) tag = 'rosso';
        else if (v.child && v.breathesAfterRescue) tag = 'rosso';
        else tag = 'nero';
      } else if (v.child) {
        if (v.rr < 15 || v.rr > 45) tag = 'rosso';
        else if (!v.radial) tag = 'rosso';
        else if (v.avpu === 'U' || v.avpu === 'Pinappropriato') tag = 'rosso';
        else tag = 'giallo';
      } else if (v.rr > 30) tag = 'rosso';
      else if (!v.radial || v.crt > 2) tag = 'rosso';
      else if (!v.obeys) tag = 'rosso';
      else tag = 'giallo';
      expect(tag, v.id).toBe(v.correct);
    }
  });
});

describe('DGR FVG 1653/2025', () => {
  it('preavviso e validazione SORES per livello di rischio', () => {
    expect(fvgProcedura(0)).toEqual({ giorni: 15, piano: false, validazione: false });
    expect(fvgProcedura(1)).toEqual({ giorni: 30, piano: true, validazione: true });
    expect(fvgProcedura(2).giorni).toBe(45);
  });
  it('Score SORES: operatore sul posto oltre 5', () => {
    expect(scoreSores(5, 2000, 1)).toMatchObject({ m: 1, a: 1, s: 1, score: 3, operatore: false });
    expect(scoreSores(30, 15000, 4)).toMatchObject({ m: 4, a: 4, s: 2, score: 10, operatore: true });
    expect(scoreSores(13.5, 6000, 3).score).toBe(5);
  });
});
