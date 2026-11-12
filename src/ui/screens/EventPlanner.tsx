import { useState } from 'react';
import { A1, EVENTS, MAURER_TYPES, a1Score, maurerA, maurerB, maurerResources, maurerScore, riskClass, type A1Selection, type EventCase } from '../../data/events';
import { SourceChips } from '../components/SourceChip';
import { loadExtra, saveExtra } from '../store';
import { sfx } from '../audio';

type Step = 'scegli' | 'a1' | 'a2' | 'esito';

interface A2Input {
  a: number | '';
  b: number | '';
  type: string;
  d: number | '';
  e: boolean;
}

export function EventPlanner({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<Step>('scegli');
  const [ev, setEv] = useState<EventCase | null>(null);
  const [sel, setSel] = useState<A1Selection>({});
  const [a2, setA2] = useState<A2Input>({ a: '', b: '', type: '', d: '', e: false });

  const toggle = (gid: string, oid: string, multi: boolean) => {
    sfx('click');
    setSel((s) => {
      const cur = s[gid] ?? [];
      if (multi) return { ...s, [gid]: cur.includes(oid) ? cur.filter((x) => x !== oid) : [...cur, oid] };
      return { ...s, [gid]: [oid] };
    });
  };

  const facts = ev && (
    <section className="ev-facts">
      <h2>{ev.title}</h2>
      <ul>
        {ev.facts.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
    </section>
  );

  if (step === 'scegli' || !ev) {
    return (
      <div className="page eventi">
        <header className="page-head">
          <button className="back" onClick={onBack}>
            ‹ Menu
          </button>
          <div>
            <p className="muted">Eventi e manifestazioni programmate</p>
            <h1>Pianifica il soccorso sanitario</h1>
            <p className="muted">
              Per ogni evento l’organizzatore calcola il livello di rischio (Allegato A1) e dimensiona le risorse con l’algoritmo di Maurer (Allegato A2). Leggi la scheda dell’evento e compila le tabelle come faresti per la Centrale 118. <SourceChips ids={['ACCORDO_EVENTI_2014', 'FVG_EVENTI_2025']} />
            </p>
          </div>
        </header>
        <div className="scen-grid">
          {EVENTS.map((e) => (
            <button key={e.id} className="scen" onClick={() => {
              setEv(e);
              setSel({});
              setA2({ a: '', b: '', type: '', d: '', e: false });
              setStep('a1');
            }}>
              <span className="scen-title">{e.title}</span>
              <span className="scen-sub">{e.facts[0]}</span>
              <span className="scen-meta">
                <span className="num">{e.expected.toLocaleString('it-IT')} presenze attese</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const myA1 = a1Score(sel);
  const okA1 = a1Score(ev.a1);
  const typeF = MAURER_TYPES.find((t) => t.id === a2.type)?.factor ?? 0;
  const myScore = a2.a !== '' && a2.b !== '' && a2.type ? maurerScore(Number(a2.a), Number(a2.b), typeF, Number(a2.d || 0), a2.e) : null;
  const okA = maurerA(ev.capacity, ev.indoor);
  const okB = maurerB(ev.expected);
  const okC = MAURER_TYPES.find((t) => t.id === ev.type)!.factor;
  const okScore = maurerScore(okA, okB, okC, ev.personalita, ev.disordini);
  const okRes = maurerResources(okScore);
  const myRes = myScore !== null ? maurerResources(myScore) : null;

  if (step === 'a1') {
    const sections: { id: 'evento' | 'pubblico'; label: string }[] = [
      { id: 'evento', label: 'Variabili legate all’evento' },
      { id: 'pubblico', label: 'Variabili legate al pubblico' },
    ];
    return (
      <div className="page eventi">
        <header className="page-head">
          <button className="back" onClick={() => setStep('scegli')}>
            ‹ Eventi
          </button>
          <div>
            <p className="muted">Passo 1 di 2 · Allegato A1</p>
            <h1>Livello di rischio</h1>
          </div>
        </header>
        <div className="ev-grid">
          {facts}
          <section className="ev-form">
            {sections.map((sec) => (
              <div key={sec.id}>
                <h3 className="mini-h">{sec.label}</h3>
                {A1.filter((g) => g.section === sec.id).map((g) => (
                  <fieldset key={g.id} className="ev-group">
                    <legend>
                      {g.label}
                      {g.multi && <small> · più scelte</small>}
                    </legend>
                    <div className="ev-opts">
                      {g.options.map((o) => {
                        const on = (sel[g.id] ?? []).includes(o.id);
                        return (
                          <button key={o.id} className={`ev-opt${on ? ' on' : ''}`} onClick={() => toggle(g.id, o.id, g.multi)} aria-pressed={on}>
                            <span>{o.label}</span>
                            <span className="num">{o.points > 0 ? `+${o.points}` : o.points}</span>
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                ))}
              </div>
            ))}
            <div className="ev-total">
              <span>
                Punteggio <strong className="num">{myA1}</strong> · {riskClass(myA1).label}
              </span>
              <button className="btn btn-arancio" onClick={() => setStep('a2')}>
                Passa all’algoritmo di Maurer
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (step === 'a2') {
    const num = (v: string): number | '' => (v === '' ? '' : Math.max(0, Number(v)));
    return (
      <div className="page eventi">
        <header className="page-head">
          <button className="back" onClick={() => setStep('a1')}>
            ‹ Allegato A1
          </button>
          <div>
            <p className="muted">Passo 2 di 2 · Allegato A2</p>
            <h1>Algoritmo di Maurer</h1>
            <p className="muted">Punteggio = (A + B) × C + D + E</p>
          </div>
        </header>
        <div className="ev-grid">
          {facts}
          <section className="ev-form">
            <div className="ev-field">
              <label htmlFor="m-a">A · capienza massima consentita (punti)</label>
              <p className="muted">500 → 1, 1.000 → 2, 1.500 → 3, 3.000 → 4, 6.000 → 5, 10.000 → 6, 20.000 → 7, +1 ogni ulteriori 10.000; raddoppia se al chiuso.</p>
              <input id="m-a" type="number" inputMode="numeric" min={0} value={a2.a} onChange={(e) => setA2({ ...a2, a: num(e.target.value) })} />
            </div>
            <div className="ev-field">
              <label htmlFor="m-b">B · visitatori effettivamente previsti (1 punto ogni 500)</label>
              <input id="m-b" type="number" inputMode="numeric" min={0} value={a2.b} onChange={(e) => setA2({ ...a2, b: num(e.target.value) })} />
            </div>
            <div className="ev-field">
              <label htmlFor="m-c">C · tipo di manifestazione</label>
              <select id="m-c" value={a2.type} onChange={(e) => setA2({ ...a2, type: e.target.value })}>
                <option value="">Scegli…</option>
                {MAURER_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label} ({String(t.factor).replace('.', ',')})
                  </option>
                ))}
              </select>
            </div>
            <div className="ev-field">
              <label htmlFor="m-d">D · personalità presenti (numero)</label>
              <p className="muted">10 punti ogni 5 personalità.</p>
              <input id="m-d" type="number" inputMode="numeric" min={0} value={a2.d} onChange={(e) => setA2({ ...a2, d: num(e.target.value) })} />
            </div>
            <label className="check ev-check">
              <input type="checkbox" id="m-e" checked={a2.e} onChange={(e) => setA2({ ...a2, e: e.target.checked })} /> E · rischio di violenza o disordini segnalato dalle Forze dell’ordine (+10)
            </label>
            <div className="ev-total">
              <span>
                Punteggio di Maurer <strong className="num">{myScore === null ? '—' : String(myScore).replace('.', ',')}</strong>
              </span>
              <button
                className="btn btn-arancio"
                disabled={myScore === null}
                onClick={() => {
                  sfx('bip');
                  setStep('esito');
                }}
              >
                Confronta con la soluzione
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  // esito
  const groups = A1.map((g) => {
    const mine = new Set(sel[g.id] ?? []);
    const right = new Set(ev.a1[g.id] ?? []);
    const ok = mine.size === right.size && [...mine].every((x) => right.has(x));
    return { g, ok, mine, right };
  });
  const a1ok = groups.filter((x) => x.ok).length;
  const fields = [
    { label: 'A · capienza', mine: a2.a, ok: okA },
    { label: 'B · visitatori', mine: a2.b, ok: okB },
    { label: 'C · fattore', mine: typeF, ok: okC },
    { label: 'D · personalità', mine: Math.floor(Number(a2.d || 0) / 5) * 10, ok: Math.floor(ev.personalita / 5) * 10 },
    { label: 'E · disordini', mine: a2.e ? 10 : 0, ok: ev.disordini ? 10 : 0 },
  ];
  const a2ok = fields.filter((f) => Number(f.mine) === f.ok).length;
  const classOk = riskClass(myA1).level === riskClass(okA1).level;
  const score = Math.round((a1ok / groups.length) * 45 + (classOk ? 15 : 0) + (a2ok / fields.length) * 40);
  const best = Math.max(loadExtra().eventiBest ?? 0, score);
  saveExtra({ eventiBest: best });
  const resRows: { k: keyof ReturnType<typeof maurerResources>; label: string }[] = [
    { k: 'soccorso', label: 'Ambulanze di soccorso' },
    { k: 'trasporto', label: 'Ambulanze di trasporto' },
    { k: 'piedi', label: 'Soccorritori a piedi' },
    { k: 'medici', label: 'Medici (unità medicalizzate)' },
  ];
  return (
    <div className="page eventi">
      <header className="page-head">
        <button className="back" onClick={() => setStep('scegli')}>
          ‹ Eventi
        </button>
        <div>
          <p className="muted">Soluzione · {ev.title}</p>
          <h1>
            {score}/100 <small className="muted num">record {best}</small>
          </h1>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => setStep('a1')}>
            Correggi le tabelle
          </button>
        </div>
      </header>
      <div className="ev-result">
        <section className="lib-page">
          <h2>Livello di rischio</h2>
          <p>
            Tu: <strong className="num">{myA1}</strong> ({riskClass(myA1).label}) · Soluzione: <strong className="num">{okA1}</strong> ({riskClass(okA1).label})
          </p>
          <table className="lib-table">
            <tbody>
              {groups.map(({ g, ok, right }) => (
                <tr key={g.id} className={ok ? 'ok' : 'ko'}>
                  <td>{ok ? '✓' : '✗'}</td>
                  <td>
                    <strong>{g.label}</strong>:{' '}
                    {right.size === 0 ? 'nessuna voce' : g.options.filter((o) => right.has(o.id)).map((o) => `${o.label} (${o.points > 0 ? '+' : ''}${o.points})`).join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted">Per i livelli moderato/elevato e molto elevato il piano di soccorso va verificato e validato dalla Centrale 118 competente, con i tempi di preavviso fissati dalla Regione.</p>
        </section>
        <section className="lib-page">
          <h2>Algoritmo di Maurer</h2>
          <table className="lib-table">
            <tbody>
              {fields.map((f) => (
                <tr key={f.label} className={Number(f.mine) === f.ok ? 'ok' : 'ko'}>
                  <td>{Number(f.mine) === f.ok ? '✓' : '✗'}</td>
                  <td>
                    {f.label}: tu <span className="num">{String(f.mine === '' ? '—' : f.mine).replace('.', ',')}</span> · corretto <span className="num">{String(f.ok).replace('.', ',')}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            Punteggio corretto: ({okA} + {okB}) × {String(okC).replace('.', ',')} + {Math.floor(ev.personalita / 5) * 10} + {ev.disordini ? 10 : 0} = <strong className="num">{String(okScore).replace('.', ',')}</strong>
          </p>
          <dl className="numbers">
            {resRows.map((r) => (
              <div key={r.k}>
                <dt>{r.label}</dt>
                <dd className="num">
                  {okRes[r.k]}
                  {myRes && myRes[r.k] !== okRes[r.k] && <small className="muted"> (tu {myRes[r.k]})</small>}
                </dd>
              </div>
            ))}
          </dl>
          <p className="muted">I valori dell’algoritmo sono indicativi: il Servizio di Emergenza Territoriale 118 può integrarli o modificarli in base alle caratteristiche dell’evento.</p>
          <p className="lib-src">
            Fonti: <SourceChips ids={['ACCORDO_EVENTI_2014', 'FVG_EVENTI_2025']} />
          </p>
        </section>
      </div>
    </div>
  );
}
