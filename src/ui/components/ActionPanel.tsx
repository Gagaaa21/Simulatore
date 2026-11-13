import { useMemo, useRef, useState, useEffect } from 'react';
import type { Sim } from '../../engine/engine';
import { ACTION_LIST, GROUP_LABEL } from '../../engine/actions';
import { nextStep } from '../../engine/coach';
import type { ActionDef, ActionGroup } from '../../engine/types';
import { EQUIPMENT } from '../../data/equipment';

/** Le schede seguono l'ordine della procedura insegnata nei corsi. */
const GROUPS: ActionGroup[] = ['scena', 'A', 'B', 'C', 'D', 'E', 'anamnesi', 'centrale'];
const TAB_SHORT: Record<ActionGroup, string> = {
  scena: 'Scena',
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
  E: 'E',
  anamnesi: 'Anamnesi',
  centrale: 'SORES e trasporto',
};

/** Una fase si considera svolta quando sono state fatte le sue valutazioni di base. */
function groupDone(sim: Sim, g: ActionGroup): boolean {
  const p = sim.p;
  switch (g) {
    case 'scena':
      return sim.phase !== 'scena';
    case 'A':
      return sim.did('coscienza') && !p.airway.startsWith('ostruzione') && !p.vomitInMouth && p.airway !== 'gorgogliante';
    case 'B':
      return sim.inArrest() ? sim.cpr.active : sim.did('gas') || sim.pulseOx;
    case 'C':
      return sim.inArrest() ? sim.cpr.active : sim.didAny('pressione', 'polso_radiale', 'polso_carotideo');
    case 'D':
      return sim.didAny('pupille', 'cincinnati', 'orientamento', 'motilita');
    case 'E':
      return sim.didAny('testa_piedi', 'telo', 'temperatura', 'raffredda_ustione');
    case 'anamnesi':
      return ['q_sintomi', 'q_dolore', 'q_allergie', 'q_farmaci', 'q_patologie', 'q_pasto', 'q_eventi', 'q_esordio', 'q_testimoni'].filter((q) => sim.did(q)).length >= 2;
    case 'centrale':
      return sim.report !== null || sim.scenario.role === 'laico' && sim.didAny('chiama_112');
  }
}

function durationOf(a: ActionDef, sim: Sim) {
  const d = typeof a.duration === 'function' ? a.duration(sim) : a.duration;
  return d >= 60 ? `${Math.round((d / 60) * 10) / 10} min` : `${d} s`;
}

export function ActionButton({ a, sim, onAction, next }: { a: ActionDef; sim: Sim; onAction: (id: string) => void; next?: boolean }) {
  const avail = sim.actionAvailability(a.id);
  const missing = (a.needs ?? []).filter((e) => !sim.brought.has(e));
  const disabled = avail !== true || !!sim.busy;
  const done = sim.count(a.id);
  return (
    <button
      data-action={a.id}
      className={`act${missing.length ? ' act-missing' : ''}${done ? ' act-done' : ''}${next ? ' act-next' : ''}`}
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

export function ActionPanel({ sim, onAction, coach, onProtocol }: { sim: Sim; onAction: (id: string) => void; coach: boolean; onProtocol: () => void }) {
  const [tab, setTab] = useState<ActionGroup>('scena');
  const [q, setQ] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const step = coach ? nextStep(sim) : null;
  const stepKey = step ? `${step.action ?? ''}|${step.protocol ? 'p' : ''}|${step.text}` : '';

  // quando il passo consigliato cambia, apri la sua scheda
  const lastKey = useRef('');
  useEffect(() => {
    if (!coach || !step || stepKey === lastKey.current) return;
    lastKey.current = stepKey;
    if (step.group) setTab(step.group);
  }, [coach, step, stepKey]);
  // senza guida: dalla scena si passa ad A appena raggiunto il paziente
  const prevPhase = useRef(sim.phase);
  useEffect(() => {
    if (!coach && prevPhase.current === 'scena' && sim.phase === 'paziente') setTab('A');
    prevPhase.current = sim.phase;
  }, [sim.phase, coach]);
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
  const visible = useMemo(() => ACTION_LIST.filter((a) => (a.visible ? a.visible(sim) : true)), [sim, sim.t, sim.phase, sim.busy]); // eslint-disable-line react-hooks/exhaustive-deps
  const query = q.trim().toLowerCase();
  const list = query
    ? visible.filter((a) => a.label.toLowerCase().includes(query) || (a.short ?? '').toLowerCase().includes(query))
    : visible.filter((a) => a.group === tab);
  return (
    <section className="actions" aria-label="Azioni">
      {step && (
        <div className="next-step" role="status" aria-live="polite">
          <span className="next-step-h">Prossimo passo</span>
          <p>{step.text}</p>
          {step.protocol && (
            <button className="btn btn-small btn-arancio" onClick={onProtocol}>
              Scegli il protocollo
            </button>
          )}
          {step.group && step.group !== tab && !query && (
            <button className="btn btn-small" onClick={() => setTab(step.group!)}>
              Vai a {TAB_SHORT[step.group]}
            </button>
          )}
        </div>
      )}
      <div className="tabs" role="tablist" aria-label="Fasi della procedura">
        {GROUPS.map((g) => {
          const done = groupDone(sim, g);
          return (
            <button
              key={g}
              role="tab"
              aria-selected={tab === g && !query}
              className={`tab tab-${g}${tab === g && !query ? ' on' : ''}${done ? ' done' : ''}${step?.group === g ? ' suggested' : ''}`}
              onClick={() => {
                setQ('');
                setTab(g);
              }}
              title={GROUP_LABEL[g]}
            >
              {TAB_SHORT[g]}
              {done && <span className="tab-check" aria-label="fatto">✓</span>}
            </button>
          );
        })}
      </div>
      {!query && <h3 className="actions-title">{GROUP_LABEL[tab]}</h3>}
      <div className="act-list">
        {list.length === 0 && <p className="muted">Nessuna azione trovata.</p>}
        {list.map((a) => (
          <ActionButton key={a.id} a={a} sim={sim} onAction={onAction} next={step?.action === a.id} />
        ))}
      </div>
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
    </section>
  );
}
