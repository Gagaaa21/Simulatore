import type { Shift } from '../App';
import { BADGE_BY_ID, rankFor, type Career } from '../../data/career';
import { SCENARIO_BY_ID } from '../../data/scenarios';
import { CRITICITA } from '../../data/codes';
import { BadgeMedal, RankInsignia } from '../components/Insignia';

export function ShiftSummary({ shift, career, onMenu, onAgain }: { shift: Shift; career: Career; onMenu: () => void; onAgain: () => void }) {
  const avg = Math.round(shift.results.reduce((a, r) => a + r.score, 0) / Math.max(1, shift.results.length));
  const xp = shift.results.reduce((a, r) => a + r.xp, 0);
  const r = rankFor(career.xp);
  return (
    <div className="page shift-end">
      <div className="hud-stripe tall" aria-hidden="true" />
      <header className="shift-head">
        <p className="hero-kicker">Fine turno</p>
        <h1>Smonti dal turno</h1>
        <p className="muted">Tre chiamate, tre pazienti. Ecco come è andata.</p>
      </header>
      <div className="shift-grid">
        <section className="shift-score">
          <span className="num">{avg}</span>
          <small>media del turno</small>
          <p className="reward-xp">
            <span className="num">+{xp}</span> punti esperienza
          </p>
        </section>
        <ol className="shift-list">
          {shift.results.map((res, i) => {
            const sc = SCENARIO_BY_ID[res.id];
            const c = CRITICITA[sc.dispatch.criticita];
            return (
              <li key={i}>
                <span className="shift-time num">{sc.dispatch.time}</span>
                <span className="code-pill" style={{ ['--cc' as string]: c.hex }}>
                  <span className="num">{sc.dispatch.luogo}</span>
                  <span className="num">{sc.dispatch.patologia}</span>
                  <span>{c.label}</span>
                </span>
                <span className="shift-title">{sc.title}</span>
                <span className="num shift-pts">{res.score}</span>
              </li>
            );
          })}
        </ol>
        <section className="shift-rank">
          <RankInsignia stripes={r.rank.stripes} size={64} />
          <div>
            <p className="prof-rank-name">{r.rank.name}</p>
            <div className="xp-bar">
              <div style={{ width: `${Math.round(r.progress * 100)}%` }} />
              <span className="num">{r.next ? `${career.xp}/${r.next.xp} verso ${r.next.name}` : 'Grado massimo'}</span>
            </div>
          </div>
        </section>
        {shift.badges.length > 0 && (
          <section className="reward-badges wide">
            {shift.badges.map((id) => (
              <div key={id} className="reward-badge pop">
                <BadgeMedal badge={BADGE_BY_ID[id]} size={56} />
                <span>{BADGE_BY_ID[id].name}</span>
              </div>
            ))}
          </section>
        )}
      </div>
      <div className="shift-actions">
        <button className="btn" onClick={onMenu}>
          Torna al menu
        </button>
        <button className="btn btn-big btn-arancio" onClick={onAgain}>
          Un altro turno
        </button>
      </div>
    </div>
  );
}
