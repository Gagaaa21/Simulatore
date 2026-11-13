import { useMemo, useRef, useState, useEffect } from 'react';
import type { Sim } from '../../engine/engine';
import { ACTION_LIST, ACTIONS, GROUP_LABEL, SECTION_ORDER } from '../../engine/actions';
import { nextStep } from '../../engine/coach';
import type { ActionDef, ActionGroup } from '../../engine/types';
import { EQUIPMENT } from '../../data/equipment';

/** Schede del pannello: dall'arrivo sulla scena al trasporto. */
const GROUPS: ActionGroup[] = ['scena', 'valutazione', 'parametri', 'anamnesi', 'trattamenti', 'centrale'];
const TAB_SHORT: Record<ActionGroup, string> = {
  scena: 'Scena',
  valutazione: 'Valutazione',
  parametri: 'Parametri',
  anamnesi: 'Anamnesi',
  trattamenti: 'Trattamenti',
  centrale: 'SORES',
};

const slug = (t: string) =>
  t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** Una scheda si considera svolta quando sono state fatte le sue valutazioni di base. */
function groupDone(sim: Sim, g: ActionGroup): boolean {
  switch (g) {
    case 'scena':
      return sim.phase !== 'scena';
    case 'valutazione':
      return sim.did('coscienza') && sim.didAny('gas', 'polso_carotideo', 'osserva_torace');
    case 'parametri':
      return sim.inArrest() ? sim.cpr.active : sim.pulseOx && sim.didAny('pressione', 'polso_radiale');
    case 'anamnesi':
      return ['q_sintomi', 'q_dolore', 'q_allergie', 'q_farmaci', 'q_patologie', 'q_pasto', 'q_eventi', 'q_esordio', 'q_testimoni'].filter((q) => sim.did(q)).length >= 2;
    case 'trattamenti':
      return false;
    case 'centrale':
      return sim.report !== null || (sim.scenario.role === 'laico' && sim.didAny('chiama_112'));
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

export function ActionPanel({ sim, onAction, coach, onProtocol, hintAction }: { sim: Sim; onAction: (id: string) => void; coach: boolean; onProtocol: () => void; hintAction?: string }) {
  const [tab, setTab] = useState<ActionGroup>('scena');
  const [section, setSection] = useState<string>('Vie aeree');
  const [q, setQ] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const step = coach ? nextStep(sim) : null;
  const stepKey = step ? `${step.action ?? ''}|${step.protocol ? 'p' : ''}|${step.text}` : '';
  const stepSection = step?.action ? ACTIONS[step.action]?.section : undefined;
  // sezione dell'azione suggerita (dalla guida o dalla missione guidata): aprendo i Trattamenti si va lì
  const focusAction = step?.action ?? hintAction;
  const focusSection = focusAction && ACTIONS[focusAction]?.group === 'trattamenti' ? ACTIONS[focusAction].section : undefined;

  // quando il passo consigliato cambia, apri la sua scheda (e la sua sezione)
  const lastKey = useRef('');
  useEffect(() => {
    if (!coach || !step || stepKey === lastKey.current) return;
    lastKey.current = stepKey;
    if (step.group) setTab(step.group);
    if (step.group === 'trattamenti' && stepSection) setSection(stepSection);
  }, [coach, step, stepKey, stepSection]);
  // senza guida: dalla scena si passa alla valutazione appena raggiunto il paziente
  const prevPhase = useRef(sim.phase);
  useEffect(() => {
    if (!coach && prevPhase.current === 'scena' && sim.phase === 'paziente') setTab('valutazione');
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
  const inTab = visible.filter((a) => a.group === tab);
  // sezioni della scheda corrente, nell'ordine stabilito
  const sections = SECTION_ORDER.filter((s) => inTab.some((a) => a.section === s));
  const treatSection = tab === 'trattamenti' ? (sections.includes(section) ? section : sections[0]) : undefined;
  const list = query
    ? visible.filter((a) => a.label.toLowerCase().includes(query) || (a.short ?? '').toLowerCase().includes(query))
    : treatSection
      ? inTab.filter((a) => a.section === treatSection)
      : inTab;
  // titoli di sezione dentro l'elenco (valutazione ABCDE, SORES): solo se non si sta cercando e non nei trattamenti
  const grouped = !query && !treatSection && sections.length > 0;
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
          {step.group && (step.group !== tab || (step.group === 'trattamenti' && stepSection && stepSection !== treatSection)) && !query && (
            <button
              className="btn btn-small"
              onClick={() => {
                setTab(step.group!);
                if (stepSection) setSection(stepSection);
              }}
            >
              Vai a {step.group === 'trattamenti' && stepSection ? stepSection : TAB_SHORT[step.group]}
            </button>
          )}
        </div>
      )}
      <div className="tabs" role="tablist" aria-label="Schede delle azioni">
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
                if (g === 'trattamenti' && focusSection) setSection(focusSection);
              }}
              title={GROUP_LABEL[g]}
            >
              {TAB_SHORT[g]}
              {done && (
                <span className="tab-check" aria-label="fatto">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
      {!query && <h3 className="actions-title">{GROUP_LABEL[tab]}</h3>}
      {treatSection && !query && (
        <div className="sec-chips" role="tablist" aria-label="Tipi di trattamento">
          {sections.map((s) => (
            <button
              key={s}
              role="tab"
              aria-selected={s === treatSection}
              className={`sec-chip sec-${slug(s)}${s === treatSection ? ' on' : ''}${stepSection === s && step?.group === 'trattamenti' ? ' suggested' : ''}`}
              onClick={() => setSection(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <div className="act-list">
        {list.length === 0 && <p className="muted">Nessuna azione trovata.</p>}
        {grouped
          ? [...sections, undefined].map((s) => {
              const items = list.filter((a) => a.section === s);
              if (!items.length) return null;
              return (
                <div key={s ?? 'altro'} className="act-sec">
                  {s && <h4 className="act-sec-h">{s}</h4>}
                  {items.map((a) => (
                    <ActionButton key={a.id} a={a} sim={sim} onAction={onAction} next={step?.action === a.id} />
                  ))}
                </div>
              );
            })
          : list.map((a) => <ActionButton key={a.id} a={a} sim={sim} onAction={onAction} next={step?.action === a.id} />)}
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
