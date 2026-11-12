import { useState } from 'react';
import type { Mode, Scenario } from '../../engine/types';
import { CAPACITY, EQUIPMENT, EQUIPMENT_ORDER, type EquipmentId } from '../../data/equipment';
import { CRITICITA, LUOGO, PATOLOGIA } from '../../data/codes';
import { sfx } from '../audio';

const ROLE_TXT: Record<Scenario['role'], string> = {
  msb: 'Sei il capo equipaggio di un mezzo di soccorso di base (MSB) con altri due soccorritori.',
  squadra: 'Sei in una squadra a piedi del servizio sanitario dell’evento, con un collega. Il PMA è vicino.',
  laico: 'Sei fuori servizio: niente divisa, niente zaino. Hai il telefono e quello che trovi sul posto.',
};

export function Briefing({ scenario, mode, onBack, onStart }: { scenario: Scenario; mode: Mode; onBack: () => void; onStart: (brought: EquipmentId[]) => void }) {
  const [sel, setSel] = useState<EquipmentId[]>([]);
  const d = scenario.dispatch;
  const c = CRITICITA[d.criticita];
  const lo = scenario.loadout;
  const used = sel.reduce((a, e) => a + EQUIPMENT[e].slots, 0);
  const toggle = (e: EquipmentId) => {
    sfx('click');
    setSel((s) => (s.includes(e) ? s.filter((x) => x !== e) : used + EQUIPMENT[e].slots > CAPACITY ? s : [...s, e]));
  };
  const items = EQUIPMENT_ORDER.filter((e) => !lo?.unavailable?.includes(e));
  return (
    <div className="page briefing">
      <header className="page-head">
        <button className="back" onClick={onBack}>
          ‹ Missioni
        </button>
        <div>
          <p className="muted">{mode === 'esame' ? 'Modalità esame' : 'Modalità addestramento'}</p>
          <h1>{scenario.title}</h1>
        </div>
      </header>

      <div className="brief-grid">
        <section className="tablet" aria-label="Scheda missione della Centrale">
          <div className="tablet-bar">
            <span>Centrale Operativa 118</span>
            <span className="num">{d.time}</span>
          </div>
          <div className="tablet-body">
            <p className="tablet-label">Missione</p>
            <div className="dispatch-codes">
              <div className="dcode" title={LUOGO[d.luogo].def}>
                <span className="dcode-k num">{d.luogo}</span>
                <span className="dcode-v">{LUOGO[d.luogo].label}</span>
              </div>
              <div className="dcode" title={PATOLOGIA[d.patologia]}>
                <span className="dcode-k num">{d.patologia}</span>
                <span className="dcode-v">{PATOLOGIA[d.patologia].replace('Patologia di origine ', '')}</span>
              </div>
              <div className="dcode dcode-crit" style={{ ['--cc' as string]: c.hex }} title={c.def}>
                <span className="dcode-k">{c.label}</span>
                <span className="dcode-v">{c.def.split(':')[0]}</span>
              </div>
            </div>
            <dl className="dispatch">
              <div>
                <dt>Indirizzo</dt>
                <dd>{d.address}</dd>
              </div>
              <div>
                <dt>Chiamante</dt>
                <dd>{d.caller}</dd>
              </div>
              <div>
                <dt>Note dell’operatore</dt>
                <dd>{d.text}</dd>
              </div>
              {d.extra && (
                <div>
                  <dt>Risorse</dt>
                  <dd>{d.extra.replace(/^Centrale: «|»$/g, '')}</dd>
                </div>
              )}
            </dl>
            <p className="tablet-role">{ROLE_TXT[scenario.role]}</p>
          </div>
        </section>

        <section className="shelf" aria-label="Presidi da portare">
          {lo ? (
            <>
              <div className="shelf-head">
                <div>
                  <h2>Che cosa porti al paziente?</h2>
                  <p className="muted">
                    Il resto rimane {scenario.role === 'squadra' ? 'al PMA' : 'sul mezzo'}: tornare a prenderlo costa circa {Math.round(lo.fetchTime / 6) / 10} minuti.
                  </p>
                </div>
                <div className="slots" aria-label={`Spazio occupato ${used} su ${CAPACITY}`}>
                  {Array.from({ length: CAPACITY }).map((_, i) => (
                    <i key={i} className={i < used ? 'on' : ''} />
                  ))}
                  <span className="num">
                    {used}/{CAPACITY}
                  </span>
                </div>
              </div>
              <div className="eq-grid">
                {items.map((e) => {
                  const on = sel.includes(e);
                  const full = !on && used + EQUIPMENT[e].slots > CAPACITY;
                  return (
                    <button key={e} className={`eq${on ? ' on' : ''}`} onClick={() => toggle(e)} disabled={full} aria-pressed={on}>
                      <span className="eq-top">
                        <span className="eq-name">{EQUIPMENT[e].name}</span>
                        <span className="eq-slots num" aria-label={`ingombro ${EQUIPMENT[e].slots}`}>
                          {'▮'.repeat(EQUIPMENT[e].slots)}
                        </span>
                      </span>
                      <span className="eq-what">{EQUIPMENT[e].what}</span>
                      {EQUIPMENT[e].contains && on && <span className="eq-contains">{EQUIPMENT[e].contains!.join(' · ')}</span>}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="shelf-empty">
              <h2>Nessun presidio</h2>
              <p>{scenario.scene.publicAed ? `Sul posto c’è un DAE pubblico ${scenario.scene.publicAed.where}.` : 'Solo le tue mani e il telefono.'}</p>
            </div>
          )}
          <div className="shelf-foot">
            <button
              className="btn btn-big btn-arancio"
              onClick={() => {
                sfx('sirena');
                onStart(sel);
              }}
            >
              {scenario.role === 'laico' ? 'Intervieni' : 'Partenza'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
