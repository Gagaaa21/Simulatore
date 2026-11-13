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
 * Indicazione della SORES sull'ossigeno dopo che il soccorritore ha riferito la saturazione.
 * Criteri BTS 2017: critico → reservoir 15 L/min; rischio di ipercapnia → Venturi 24–28%, obiettivo 88–92%;
 * ipossiemia → obiettivo 94–98%; nessun ossigeno se la saturazione è già nel target.
 */
export function soresO2Order(sim: Sim): O2Order {
  const spo2 = Math.round(sim.p.v.spo2);
  const ox = sim.scenario.oxygen ?? {};
  const base = { spo2, t: sim.t };
  if (sim.inArrest() || sim.p.breathing === 'assente' || sim.p.breathing === 'agonico') return { ...base, device: 'reservoir', flow: 15, target: [94, 98] };
  if (ox.copd) {
    if (spo2 < 88) return { ...base, device: 'venturi', flow: VENTURI_FLOW[28], fio2: 28, target: [88, 92] };
    if (sim.o2 && spo2 > 92) return { ...base, device: 'venturi', flow: VENTURI_FLOW[24], fio2: 24, target: [88, 92] };
    return { ...base, device: sim.o2?.device ?? null, flow: sim.o2?.flow ?? 0, fio2: sim.o2?.fio2, target: [88, 92] };
  }
  if (ox.critical || spo2 < 85) return { ...base, device: 'reservoir', flow: 15, target: [94, 98] };
  if (spo2 < 94) return { ...base, device: 'venturi', flow: VENTURI_FLOW[35], fio2: 35, target: [94, 98] };
  return { ...base, device: null, flow: 0, target: [94, 98] };
}
