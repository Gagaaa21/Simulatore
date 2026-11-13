import { useState } from 'react';
import { BADGES, RANKS, rankFor, type Career } from '../../data/career';
import { CAREER_SCENARIOS as SCENARIOS, SCENARIO_BY_ID } from '../../data/scenarios';
import { PROTOCOLS } from '../../data/protocols';
import type { ScenarioRecord } from '../store';
import { loadExtra, resetAll } from '../store';
import { BadgeMedal, RankInsignia } from '../components/Insignia';

export function Profile({ career, progress, onBack, onReset }: { career: Career; progress: Record<string, ScenarioRecord>; onBack: () => void; onReset: () => void }) {
  const [confirm, setConfirm] = useState(false);
  const r = rankFor(career.xp);
  const played = SCENARIOS.filter((s) => progress[s.id]);
  const avg = played.length ? Math.round(played.reduce((a, s) => a + progress[s.id].best, 0) / played.length) : null;
  const extra = loadExtra();
  // padronanza per famiglia di protocolli: media dei migliori punteggi degli scenari relativi
  const fam = new Map<string, number[]>();
  for (const s of SCENARIOS) {
    const f = PROTOCOLS[s.protocol.correct[0]].family;
    if (!fam.has(f)) fam.set(f, []);
    fam.get(f)!.push(progress[s.id]?.best ?? 0);
  }
  return (
    <div className="page profile">
      <header className="page-head">
        <button className="back" onClick={onBack}>
          ‹ Menu
        </button>
        <div>
          <p className="muted">Profilo</p>
          <h1>Il tuo percorso</h1>
        </div>
      </header>

      <section className="prof-hero">
        <RankInsignia stripes={r.rank.stripes} size={92} />
        <div className="prof-rank">
          <p className="prof-rank-name">{r.rank.name}</p>
          <div className="xp-bar big">
            <div style={{ width: `${Math.round(r.progress * 100)}%` }} />
            <span className="num">{r.next ? `${career.xp} / ${r.next.xp} punti esperienza · prossimo grado: ${r.next.name}` : `${career.xp} punti esperienza · grado massimo`}</span>
          </div>
          <ol className="rank-ladder">
            {RANKS.map((k) => (
              <li key={k.id} className={career.xp >= k.xp ? 'on' : ''}>
                <span>{k.name}</span>
                <small className="num">{k.xp}</small>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <dl className="numbers prof-stats">
        <div>
          <dt>Missioni giocate</dt>
          <dd className="num">{career.missions}</dd>
        </div>
        <div>
          <dt>Scenari completati</dt>
          <dd className="num">
            {played.length}/{SCENARIOS.length}
          </dd>
        </div>
        <div>
          <dt>Media dei migliori</dt>
          <dd className="num">{avg ?? '–'}</dd>
        </div>
        <div>
          <dt>Turni completati</dt>
          <dd className="num">{career.shifts.length}</dd>
        </div>
        <div>
          <dt>Record RCP</dt>
          <dd className="num">{extra.cprBest !== undefined ? `${extra.cprBest}%` : '–'}</dd>
        </div>
        <div>
          <dt>Record triage</dt>
          <dd className="num">{extra.triageBest ?? '–'}</dd>
        </div>
      </dl>

      <section className="prof-sec">
        <h2>Distintivi</h2>
        <div className="badge-grid">
          {BADGES.map((b) => {
            const got = career.badges[b.id];
            return (
              <div key={b.id} className={`badge-card${got ? '' : ' locked'}`}>
                <BadgeMedal badge={b} locked={!got} size={56} />
                <div>
                  <p className="badge-name">{b.name}</p>
                  <p className="badge-desc">{b.desc}</p>
                  {got && <p className="badge-date num">{new Date(got).toLocaleDateString('it-IT')}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="prof-sec two">
        <div>
          <h2>Padronanza</h2>
          <ul className="mastery">
            {Array.from(fam.entries()).map(([f, scores]) => {
              const m = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
              return (
                <li key={f}>
                  <span>{f}</span>
                  <div className="bar">
                    <div className={`bar-fill${m < 60 ? ' low' : ''}`} style={{ width: `${m}%` }} />
                  </div>
                  <span className="num">{m}</span>
                </li>
              );
            })}
          </ul>
        </div>
        <div>
          <h2>Ultime missioni</h2>
          {career.history.length === 0 ? (
            <p className="muted">Nessuna missione ancora: inizia un turno dal menu.</p>
          ) : (
            <table className="tl">
              <tbody>
                {career.history.slice(0, 12).map((h, i) => (
                  <tr key={i}>
                    <td className="num muted">{new Date(h.at).toLocaleDateString('it-IT')}</td>
                    <td>{SCENARIO_BY_ID[h.id]?.title ?? h.id}</td>
                    <td className="num">{h.score}</td>
                    <td className="muted">{h.mode === 'esame' ? 'esame' : 'addestr.'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="prof-sec">
        {confirm ? (
          <div className="danger-box">
            <p>Cancellare grado, distintivi, punteggi e impostazioni salvati su questo dispositivo? L’operazione non si può annullare.</p>
            <div className="page-actions">
              <button className="btn" onClick={() => setConfirm(false)}>
                No, tienili
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  resetAll();
                  setConfirm(false);
                  onReset();
                }}
              >
                Sì, cancella tutto
              </button>
            </div>
          </div>
        ) : (
          <button className="btn btn-small" onClick={() => setConfirm(true)}>
            Azzera i progressi
          </button>
        )}
      </section>
    </div>
  );
}
