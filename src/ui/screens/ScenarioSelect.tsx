import { useState } from 'react';
import type { Screen } from '../App';
import type { ScenarioRecord, Settings } from '../store';
import { SCENARIOS } from '../../data/scenarios';
import { CRITICITA, LUOGO, PATOLOGIA } from '../../data/codes';
import type { Scenario } from '../../engine/types';

const CATS: { id: Scenario['category'] | 'tutti'; label: string }[] = [
  { id: 'tutti', label: 'Tutte' },
  { id: '118', label: 'Territorio 118' },
  { id: 'eventi', label: 'Concerti ed eventi' },
  { id: 'fuori_servizio', label: 'Fuori servizio' },
];
const ROLE: Record<Scenario['role'], string> = {
  msb: 'Equipaggio MSB',
  squadra: 'Squadra a piedi',
  laico: 'Da solo, senza presidi',
};

export function CodePill({ s }: { s: Scenario }) {
  const d = s.dispatch;
  const c = CRITICITA[d.criticita];
  return (
    <span className="code-pill" style={{ ['--cc' as string]: c.hex }} title={`${LUOGO[d.luogo].label} · ${PATOLOGIA[d.patologia]} · ${c.label}`}>
      <span className="num">{d.luogo}</span>
      <span className="num">{d.patologia}</span>
      <span>{c.label}</span>
    </span>
  );
}

export function ScenarioSelect({
  go,
  progress,
  settings,
  setSettings,
}: {
  go: (s: Screen) => void;
  progress: Record<string, ScenarioRecord>;
  settings: Settings;
  setSettings: (p: Partial<Settings>) => void;
}) {
  const [cat, setCat] = useState<(typeof CATS)[number]['id']>('tutti');
  const list = SCENARIOS.filter((s) => cat === 'tutti' || s.category === cat);
  return (
    <div className="page">
      <header className="page-head">
        <button className="back" onClick={() => go({ name: 'menu' })}>
          ‹ Menu
        </button>
        <div>
          <h1>Missioni</h1>
          <p className="muted">Scegli una missione. Il codice in alto è quello con cui la Centrale ti invia (luogo, patologia presunta, criticità – DM 15/05/1992).</p>
        </div>
        <div className="seg" role="radiogroup" aria-label="Modalità">
          <button className={settings.mode === 'addestramento' ? 'on' : ''} onClick={() => setSettings({ mode: 'addestramento' })}>
            Addestramento
          </button>
          <button className={settings.mode === 'esame' ? 'on' : ''} onClick={() => setSettings({ mode: 'esame' })}>
            Esame
          </button>
        </div>
      </header>
      <div className="seg seg-wrap filter" role="tablist" aria-label="Categorie">
        {CATS.map((c) => (
          <button key={c.id} role="tab" aria-selected={cat === c.id} className={cat === c.id ? 'on' : ''} onClick={() => setCat(c.id)}>
            {c.label}
          </button>
        ))}
      </div>
      <div className="scen-grid">
        {list.map((s) => {
          const rec = progress[s.id];
          return (
            <button key={s.id} className={`scen${s.tutorial ? ' scen-tut' : ''}`} onClick={() => go({ name: 'briefing', scenario: s })}>
              <span className="scen-top">
                <CodePill s={s} />
                <span className="scen-diff" aria-label={`Difficoltà ${s.difficulty} su 3`}>
                  {[1, 2, 3].map((i) => (
                    <i key={i} className={i <= s.difficulty ? 'on' : ''} />
                  ))}
                </span>
              </span>
              <span className="scen-title">{s.title}</span>
              <span className="scen-sub">{s.subtitle}</span>
              <span className="scen-meta">
                <span>{ROLE[s.role]}</span>
                <span className="num">~{s.minutes} min</span>
                {s.tutorial ? <span className="scen-new">guidata</span> : rec ? <span className="scen-best num">migliore {rec.best} · {rec.grade}</span> : <span className="scen-new">nuova</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
