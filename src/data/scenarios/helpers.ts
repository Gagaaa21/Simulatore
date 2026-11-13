import type { Sim } from '../../engine/engine';

/** Secondo di missione in cui l'equipaggio ha raggiunto il paziente. */
export const contact = (s: Sim) => (s.flags.contattoAt === undefined ? 1e9 : Number(s.flags.contattoAt));

/** Secondi trascorsi dal contatto alla prima esecuzione di una o più azioni (1e9 se mai eseguita). */
export function afterContact(s: Sim, ...ids: string[]): number {
  const t = s.firstAny(...ids);
  if (t === null) return 1e9;
  return t - contact(s);
}

/** Vero se l'azione `a` è stata eseguita prima dell'azione `b` (o `b` non è mai stata eseguita). */
export function before(s: Sim, a: string, b: string): boolean {
  const ta = s.firstAt(a);
  const tb = s.firstAt(b);
  if (ta === null) return false;
  return tb === null || ta <= tb;
}

export function flagT(s: Sim, k: string): number | null {
  return s.flags[k] === undefined ? null : Number(s.flags[k]);
}

/** Avvicina gradualmente un valore intrinseco del paziente. */
export function drift(cur: number, target: number, perSecond: number): number {
  return cur < target ? Math.min(target, cur + perSecond) : Math.max(target, cur - perSecond);
}

/**
 * Primo momento in cui l'equipaggio ha informato la SORES (valutazione riferita o richiesta del mezzo avanzato
 * o dell'elisoccorso). L'invio automatico all'apertura della missione non conta. 1e9 se mai.
 */
export function soresInformedAt(s: Sim): number {
  const t: number[] = [];
  if (s.flags.primoReportAt !== undefined) t.push(Number(s.flags.primoReportAt));
  if (s.requests.msa !== undefined && !s.scenario.msa.autoDispatched) t.push(s.requests.msa);
  if (s.requests.elisoccorso !== undefined) t.push(s.requests.elisoccorso);
  return t.length ? Math.min(...t) : 1e9;
}
