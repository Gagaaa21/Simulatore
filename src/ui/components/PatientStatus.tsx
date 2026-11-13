import { useState } from 'react';
import { AIRWAY_TXT, AVPU_TXT, BREATH_TXT, type PatientChange, type Sim } from '../../engine/engine';

/** Secondi per cui un cambiamento resta in evidenza. */
const RECENT = 8;

/** L'ultimo gruppo di cambiamenti (stesso secondo) e da quanto è avvenuto. */
export function lastChanges(sim: Sim): PatientChange[] {
  const last = sim.changes[sim.changes.length - 1];
  if (!last) return [];
  return sim.changes.filter((c) => c.t === last.t);
}

/** Avviso sulla scena quando il paziente peggiora o migliora. */
export function PatientAlert({ sim }: { sim: Sim }) {
  const [dismissed, setDismissed] = useState(-1);
  const batch = lastChanges(sim);
  if (!batch.length) return null;
  const t = batch[0].t;
  if (t === dismissed || sim.t - t > RECENT || sim.ended) return null;
  const arrest = batch.find((c) => c.key === 'arresto');
  const worse = batch.some((c) => c.dir === 'peggiora');
  const kind = arrest?.dir === 'peggiora' ? 'critico' : worse ? 'peggiora' : 'migliora';
  const title = arrest ? arrest.text : worse ? 'Il paziente peggiora' : 'Il paziente migliora';
  // descrizione dello scenario nello stesso istante, se c'è
  const story = [...sim.log].reverse().find((l) => l.kind === 'paziente' && Math.abs(l.t - t) <= 1);
  return (
    <div className={`p-alert p-alert-${kind}${sim.busy ? ' p-alert-low' : ''}`} role="alert">
      <span className="p-alert-ico" aria-hidden="true">
        {kind === 'migliora' ? '▲' : '▼'}
      </span>
      <div className="p-alert-body">
        <p className="p-alert-title">{title}</p>
        {!arrest && (
          <ul>
            {batch.map((c) => (
              <li key={c.key} className={`dir-${c.dir}`}>
                {c.text}
              </li>
            ))}
          </ul>
        )}
        {story && <p className="p-alert-story">{story.text}</p>}
      </div>
      <button className="p-alert-x" onClick={() => setDismissed(t)} aria-label="Chiudi l’avviso">
        ×
      </button>
    </div>
  );
}

/** Ultima direzione di un elemento negli ultimi 90 secondi. */
function trend(sim: Sim, keys: PatientChange['key'][]): PatientChange['dir'] | null {
  for (let i = sim.changes.length - 1; i >= 0; i--) {
    const c = sim.changes[i];
    if (sim.t - c.t > 90) break;
    if (keys.includes(c.key)) return c.dir;
  }
  return null;
}

/**
 * Stato del paziente come lo percepisce il soccorritore: i valori compaiono dopo averli valutati
 * e da lì restano aggiornati, con la tendenza dell'ultimo minuto e mezzo.
 */
export function PatientStatus({ sim }: { sim: Sim }) {
  if (sim.phase === 'scena') return null;
  const p = sim.p;
  // l'arresto compare solo dopo che il soccorritore l'ha riconosciuto
  const arrest = sim.inArrest() && sim.arrest.recognizedAt !== null;
  const rows: { k: string; label: string; value: string | null; keys: PatientChange['key'][] }[] = [
    { k: 'coscienza', label: 'Coscienza', value: sim.did('coscienza') ? `${p.avpu} · ${AVPU_TXT[p.avpu]}` : null, keys: ['coscienza'] },
    { k: 'vie', label: 'Vie aeree', value: sim.didAny('ispeziona_bocca', 'apri_vie_aeree', 'gas', 'aspira', 'sublussazione') || p.airway === 'russante' || p.airway === 'gorgogliante' ? AIRWAY_TXT[p.airway] : null, keys: ['vie_aeree'] },
    { k: 'respiro', label: 'Respiro', value: sim.didAny('gas', 'conta_fr', 'osserva_torace') ? BREATH_TXT[p.breathing] : null, keys: ['respiro'] },
    { k: 'cute', label: 'Cute', value: `${p.skin.color}${p.skin.sweaty ? ', sudata' : ''}`, keys: ['cute'] },
  ];
  return (
    <section className={`p-status${arrest ? ' p-status-arrest' : ''}`} aria-label="Stato del paziente">
      <header>
        <span>Stato del paziente</span>
        {p.seizing && <span className="p-badge p-badge-warn">Crisi in corso</span>}
      </header>
      {arrest ? (
        <p className="p-arrest">Arresto cardiaco</p>
      ) : (
        <dl>
          {rows.map((r) => {
            const tr = r.value ? trend(sim, r.keys) : null;
            return (
              <div key={r.k} className={tr ? `tr-${tr}` : ''}>
                <dt>{r.label}</dt>
                <dd>
                  {r.value ?? <span className="p-todo">non valutato</span>}
                  {tr && tr !== 'neutro' && (
                    <span className="p-trend" aria-label={tr === 'peggiora' ? 'in peggioramento' : 'in miglioramento'}>
                      {tr === 'peggiora' ? '▼' : '▲'}
                    </span>
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      )}
    </section>
  );
}
