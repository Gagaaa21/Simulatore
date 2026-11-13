import type { Sim } from '../../engine/engine';

const HEAD = { errore: 'Errore', ok: 'Bene', consiglio: 'Nota' } as const;

/** Errore, conferma o suggerimento appena avvenuto: compare solo dentro la guida. */
export function GuideNote({ sim }: { sim: Sim }) {
  const n = sim.lastNote();
  if (!n || (n.kind !== 'errore' && n.kind !== 'ok' && n.kind !== 'consiglio')) return null;
  const [what, why] = n.text.split(' — ');
  return (
    <div key={n.id} className={`guide-note gn-${n.kind}`} role="status">
      <span className="gn-h">{HEAD[n.kind]}</span>
      <span className="gn-t">
        {what}
        {why && <span className="gn-why"> {why}</span>}
      </span>
    </div>
  );
}
