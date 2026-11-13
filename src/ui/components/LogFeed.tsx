import { useEffect, useRef } from 'react';
import type { Sim } from '../../engine/engine';
import { fmtClock } from '../../engine/engine';
import type { LogKind } from '../../engine/types';
import { SourceChips } from './SourceChip';

const ICON: Record<LogKind, string> = {
  azione: '›',
  reperto: '◆',
  evento: '!',
  errore: '✕',
  radio: '◉',
  paziente: '●',
  sistema: '·',
  ok: '✓',
  consiglio: '?',
};
const KIND_LABEL: Record<LogKind, string> = {
  azione: 'Azione',
  reperto: 'Reperto',
  evento: 'Evento',
  errore: 'Errore',
  radio: 'Radio',
  paziente: 'Paziente',
  sistema: 'Scena',
  ok: 'Corretto',
  consiglio: 'Suggerimento',
};

export function LogFeed({ sim, compact }: { sim: Sim; compact?: boolean }) {
  const ref = useRef<HTMLOListElement>(null);
  // errori, suggerimenti e conferme stanno nel riquadro della guida, non nel diario
  const log = sim.log.filter((e) => e.kind !== 'errore' && e.kind !== 'consiglio' && e.kind !== 'ok');
  const n = log.length;
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [n]);
  const entries = compact ? log.slice(-40) : log;
  return (
    <section className="log" aria-label="Diario di missione">
      <header className="log-head">
        <h3>Diario</h3>
        <span className="muted num">{n} voci</span>
      </header>
      <ol ref={ref} className="log-list" aria-live="polite">
        {entries.map((e) => (
          <li key={e.id} className={`log-item k-${e.kind}`}>
            <span className="log-t num">{fmtClock(e.t)}</span>
            <span className="log-i" aria-label={KIND_LABEL[e.kind]}>
              {ICON[e.kind]}
            </span>
            <span className="log-x">
              {e.text}
              {e.sources && e.sources.length > 0 && <SourceChips ids={e.sources} />}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
