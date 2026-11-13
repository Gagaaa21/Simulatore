import { useMemo, useRef, useState, useEffect } from 'react';
import type { Sim } from '../../engine/engine';
import { ACTION_LIST, GROUP_LABEL } from '../../engine/actions';
import type { ActionDef, ActionGroup } from '../../engine/types';
import { EQUIPMENT } from '../../data/equipment';

const GROUPS: ActionGroup[] = ['scena', 'A', 'B', 'C', 'D', 'E', 'anamnesi', 'trattamenti', 'immobilizzazione', 'centrale'];
const TAB_SHORT: Record<ActionGroup, string> = {
  scena: 'Scena',
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
  E: 'E',
  anamnesi: 'Anamnesi',
  trattamenti: 'Trattamenti',
  immobilizzazione: 'Immobilizza',
  centrale: 'Centrale',
};

function durationOf(a: ActionDef, sim: Sim) {
  const d = typeof a.duration === 'function' ? a.duration(sim) : a.duration;
  return d >= 60 ? `${Math.round((d / 60) * 10) / 10} min` : `${d} s`;
}

export function ActionButton({ a, sim, onAction }: { a: ActionDef; sim: Sim; onAction: (id: string) => void }) {
  const avail = sim.actionAvailability(a.id);
  const missing = (a.needs ?? []).filter((e) => !sim.brought.has(e));
  const disabled = avail !== true || !!sim.busy;
  const done = sim.count(a.id);
  return (
    <button
      data-action={a.id}
      className={`act${missing.length ? ' act-missing' : ''}${done ? ' act-done' : ''}`}
      disabled={disabled}
      onClick={() => onAction(a.id)}
      title={avail !== true ? avail : a.hint ?? a.label}
    >
      <span className="act-label">{a.label}</span>
      <span className="act-meta">
        <span className="num">{durationOf(a, sim)}</span>
        {missing.length > 0 && <span className="act-need">manca: {missing.map((m) => EQUIPMENT[m].name).join(', ')}</span>}
        {done > 0 && <span className="act-count">fatto{done > 1 ? ` ×${done}` : ''}</span>}
        {avail !== true && <span className="act-why">{avail}</span>}
      </span>
    </button>
  );
}

export function ActionPanel({ sim, onAction }: { sim: Sim; onAction: (id: string) => void }) {
  const [tab, setTab] = useState<ActionGroup>('scena');
  const [q, setQ] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const prevPhase = useRef(sim.phase);
  useEffect(() => {
    if (prevPhase.current === 'scena' && sim.phase === 'paziente') setTab('A');
    prevPhase.current = sim.phase;
  }, [sim.phase]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const visible = useMemo(() => ACTION_LIST.filter((a) => (a.visible ? a.visible(sim) : true)), [sim, sim.t, sim.phase]); // eslint-disable-line react-hooks/exhaustive-deps
  const query = q.trim().toLowerCase();
  const list = query
    ? visible.filter((a) => a.label.toLowerCase().includes(query) || (a.short ?? '').toLowerCase().includes(query))
    : visible.filter((a) => a.group === tab);
  return (
    <section className="actions" aria-label="Azioni">
      <div className="search">
        <input
          ref={searchRef}
          id="cerca-azione"
          type="search"
          placeholder="Cerca un’azione  ( / )"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Cerca un’azione"
        />
      </div>
      {!query && (
        <div className="tabs" role="tablist" aria-label="Gruppi di azioni">
          {GROUPS.map((g) => (
            <button key={g} role="tab" aria-selected={tab === g} className={`tab tab-${g}${tab === g ? ' on' : ''}`} onClick={() => setTab(g)} title={GROUP_LABEL[g]}>
              {TAB_SHORT[g]}
            </button>
          ))}
        </div>
      )}
      {!query && <h3 className="actions-title">{GROUP_LABEL[tab]}</h3>}
      <div className="act-list">
        {list.length === 0 && <p className="muted">Nessuna azione trovata.</p>}
        {list.map((a) => (
          <ActionButton key={a.id} a={a} sim={sim} onAction={onAction} />
        ))}
      </div>
    </section>
  );
}
