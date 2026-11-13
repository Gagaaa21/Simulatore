import type { Sim } from './engine';
import type { O2Device, O2Order } from './types';

/** Venturi: flusso consigliato per ogni valvola (L/min). */
export const VENTURI_FLOW: Record<number, number> = { 24: 2, 28: 4, 31: 6, 35: 8, 40: 10, 50: 12, 60: 15 };

/** Descrizione leggibile di un presidio per l'ossigeno. */
export function describeO2(device: O2Device, flow: number, fio2?: number): string {
  if (device === 'venturi') return `maschera Venturi al ${fio2 ?? 28}% (${VENTURI_FLOW[fio2 ?? 28] ?? flow} L/min)`;
  if (device === 'reservoir') return `maschera con reservoir a ${flow} L/min`;
  if (device === 'occhialini') return `occhialini nasali a ${flow} L/min`;
  return `maschera semplice a ${flow} L/min`;
}

/**
 * Situazione di emergenza: l'equipaggio può dare in autonomia ossigeno al 100%
 * (maschera con reservoir a 15 L/min o pallone autoespansibile), poi lo riferisce alla SORES.
 * Arresto o respiro inefficace, coscienza compromessa, crisi in corso, quadro critico
 * (shock, trauma maggiore, anafilassi) o saturazione molto bassa fuori dal BPCO.
 */
export function emergenzaO2(sim: Sim): boolean {
  const p = sim.p;
  if (sim.inArrest() || p.breathing === 'assente' || p.breathing === 'agonico') return true;
  if ((p.breathing === 'bradipnoico' || p.breathing === 'superficiale') && p.v.rr < 8) return true;
  if (p.avpu === 'P' || p.avpu === 'U' || p.seizing) return true;
  const ox = sim.scenario.oxygen ?? {};
  if (ox.critical) return true;
  return !ox.copd && sim.pulseOx && p.v.spo2 < 85;
}

/** Ossigeno al 100%: maschera con reservoir ad alti flussi. */
export const altiFlussi = (device: O2Device | null, flow: number) => device === 'reservoir' && flow >= 12;

/** Ossigeno gestito bene: come indicato dalla SORES, o ad alti flussi in emergenza e poi riferito. */
export function o2Adeguato(sim: Sim): boolean {
  const o = sim.o2Order;
  const riferito = sim.flags.o2RiferitoAt !== undefined || !!sim.report?.items.includes('spo2');
  // alti flussi avviati in emergenza dopo l'ultima indicazione
  if (o && Number(sim.flags.o2AutonomoAt ?? -1) >= o.t && altiFlussi(sim.o2?.device ?? null, sim.o2?.flow ?? 0)) return true;
  if (o) {
    if (o.device === null) return !sim.o2;
    return !!sim.o2 && sim.o2.device === o.device && (o.device !== 'venturi' || sim.o2.fio2 === o.fio2);
  }
  return sim.flags.o2AutonomoAt !== undefined && !!sim.o2 && riferito;
}

/**
 * Indicazione della SORES sull'ossigeno dopo che il soccorritore ha riferito la saturazione.
 * Criteri BTS 2017: critico → reservoir 15 L/min; rischio di ipercapnia → Venturi 24–28%, obiettivo 88–92%;
 * ipossiemia → obiettivo 94–98%; nessun ossigeno se la saturazione è già nel target.
 */
export function soresO2Order(sim: Sim): O2Order {
  const spo2 = Math.round(sim.p.v.spo2);
  const ox = sim.scenario.oxygen ?? {};
  const base = { spo2, t: sim.t };
  if (sim.inArrest() || sim.p.breathing === 'assente' || sim.p.breathing === 'agonico') return { ...base, device: 'reservoir', flow: 15, target: [94, 98] };
  // in emergenza la SORES conferma gli alti flussi già avviati dall'equipaggio
  if (emergenzaO2(sim) && altiFlussi(sim.o2?.device ?? null, sim.o2?.flow ?? 0)) return { ...base, device: 'reservoir', flow: sim.o2!.flow, target: [94, 98] };
  if (ox.copd) {
    if (spo2 < 88) return { ...base, device: 'venturi', flow: VENTURI_FLOW[28], fio2: 28, target: [88, 92] };
    if (sim.o2 && spo2 > 92) return { ...base, device: 'venturi', flow: VENTURI_FLOW[24], fio2: 24, target: [88, 92] };
    return { ...base, device: sim.o2?.device ?? null, flow: sim.o2?.flow ?? 0, fio2: sim.o2?.fio2, target: [88, 92] };
  }
  if (ox.critical || spo2 < 85) return { ...base, device: 'reservoir', flow: 15, target: [94, 98] };
  if (spo2 < 94) return { ...base, device: 'venturi', flow: VENTURI_FLOW[35], fio2: 35, target: [94, 98] };
  return { ...base, device: null, flow: 0, target: [94, 98] };
}
