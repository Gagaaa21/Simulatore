import type { Sim } from '../../engine/engine';
import { fmtClock } from '../../engine/engine';
import type { Report } from '../../engine/scoring';
import { PENALTY_POINTS } from '../../engine/scoring';
import type { ProtocolId, Scenario } from '../../engine/types';
import { CRITICITA, ETA_CODE, LUOGO, PATOLOGIA, VALUTAZIONE } from '../../data/codes';
import { PROTOCOLS } from '../../data/protocols';
import type { EquipmentId } from '../../data/equipment';
import { EQUIPMENT } from '../../data/equipment';
import { SourceChips } from '../components/SourceChip';
import { VitalsStrip } from '../components/VitalsStrip';

const CAT_LABEL: Record<string, string> = {
  sicurezza: 'Sicurezza',
  valutazione: 'Valutazione',
  trattamento: 'Trattamento',
  comunicazione: 'Comunicazione',
  tempi: 'Tempi',
  presidi: 'Presidi',
};

function timeline(sim: Sim): { label: string; t: number }[] {
  const out: { label: string; t: number }[] = [];
  const f = (k: string) => (sim.flags[k] !== undefined ? Number(sim.flags[k]) : null);
  const push = (label: string, t: number | null) => {
    if (t !== null && t >= 0) out.push({ label, t });
  };
  push('Contatto con il paziente', f('contattoAt'));
  push('Arresto riconosciuto', f('arrestoRiconosciutoAt'));
  push('Compressioni dell’equipaggio', f('crewCprAt'));
  push('DAE acceso', f('aedOnAt'));
  push('Piastre applicate', f('padsAt'));
  push('Primo shock', sim.aed.shocks ? sim.aed.lastShockAt !== null && sim.aed.shocks === 1 ? sim.aed.lastShockAt : null : null);
  push('Ritorno del circolo (ROSC)', sim.arrest.roscAt);
  push('Emostasi iniziata', f('emostasiAt'));
  push('Tourniquet', sim.tourniquet?.at ?? null);
  push('Saturimetro', f('saturimetroAt'));
  push('Ossigeno', f('o2At'));
  push('Glicemia', f('glicemiaAt'));
  push('Scala di Cincinnati', f('cincinnatiAt'));
  push('Zucchero per bocca', f('zuccheroAt'));
  push('Temperatura', f('temperaturaAt'));
  push('Raffreddamento attivo', f('raffreddamentoAt'));
  push('Adrenalina (1ª dose)', f('adrenalina1At'));
  push('Adrenalina (2ª dose)', f('adrenalina2At'));
  push('Protocollo scelto', sim.protocol?.t ?? null);
  push('Report alla Centrale', sim.report?.t ?? null);
  push('Mezzo avanzato sul posto', sim.msaOnScene && sim.msaAt !== null ? sim.msaAt : null);
  push('Fine missione', sim.ended?.t ?? null);
  return out.sort((a, b) => a.t - b.t);
}

export function Debrief({
  scenario,
  sim,
  report,
  brought,
  onRetry,
  onMenu,
  onProtocol,
}: {
  scenario: Scenario;
  sim: Sim;
  report: Report;
  brought: EquipmentId[];
  onRetry: () => void;
  onMenu: () => void;
  onProtocol: (id: ProtocolId) => void;
}) {
  const d = scenario.dispatch;
  const c = CRITICITA[d.criticita];
  const byCat = Object.entries(
    report.results.reduce<Record<string, typeof report.results>>((acc, r) => {
      (acc[r.obj.category] ??= []).push(r);
      return acc;
    }, {}),
  );
  const correctCode = scenario.valutazione.correct[0];
  const tl = timeline(sim);
  const ess = scenario.loadout?.essential ?? [];
  return (
    <div className="page debrief">
      <header className="page-head">
        <button className="back" onClick={onMenu}>
          ‹ Missioni
        </button>
        <div>
          <p className="muted">Debriefing</p>
          <h1>{scenario.title}</h1>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => onProtocol(scenario.protocol.correct[0])}>
            Rivedi il protocollo
          </button>
          <button className="btn btn-arancio" onClick={onRetry}>
            Riprova
          </button>
        </div>
      </header>

      <article className="scheda" aria-label="Scheda di intervento">
        <header className="scheda-head">
          <div>
            <p className="scheda-org">Servizio Emergenza Territoriale 118 · esercitazione</p>
            <h2>Scheda di intervento</h2>
          </div>
          <div className="scheda-codes">
            <span className="box">
              <small>Luogo</small>
              <b className="num">{d.luogo}</b>
              <em>{LUOGO[d.luogo].label}</em>
            </span>
            <span className="box">
              <small>Patologia</small>
              <b className="num">{d.patologia}</b>
              <em>{PATOLOGIA[d.patologia].replace('Patologia di origine ', '')}</em>
            </span>
            <span className="box" style={{ ['--cc' as string]: c.hex }}>
              <small>Criticità</small>
              <b>{c.label}</b>
            </span>
            <span className="box">
              <small>Età</small>
              <b className="num">{ETA_CODE(scenario.patient.age).split(' ')[0]}</b>
            </span>
          </div>
        </header>

        <section className="scheda-score">
          <div className={`score-ring g-${report.grade.replace(/\s/g, '').toLowerCase()}`} style={{ ['--p' as string]: `${report.score * 3.6}deg` }}>
            <span className="num">{report.score}</span>
            <small>/100</small>
          </div>
          <div className="score-text">
            <p className="stamp">{report.grade}</p>
            <h3 className={`outcome o-${report.outcome.status}`}>{report.outcome.title}</h3>
            <p>{report.outcome.text}</p>
            <p className="scheda-small">
              Obiettivi {report.earned}/{report.total} punti · penalità −{report.penaltyPoints}
              {report.criticalMissed.length > 0 ? ` · ${report.criticalMissed.length} obiettivo critico mancato` : ''}
            </p>
          </div>
          <div className="scheda-fields">
            <div className="field">
              <small>Valutazione sanitaria comunicata</small>
              <span className="mano">{sim.report ? `${sim.report.code} – ${VALUTAZIONE[sim.report.code].def}` : 'non comunicata'}</span>
            </div>
            <div className="field">
              <small>Attesa</small>
              <span className="mano">
                {correctCode} – {VALUTAZIONE[correctCode].def}
              </span>
            </div>
            <div className="field">
              <small>Protocollo</small>
              <span className="mano">{sim.protocol ? PROTOCOLS[sim.protocol.id].name : 'non dichiarato'}</span>
            </div>
            <div className="field">
              <small>Esito della missione</small>
              <span className="mano">{sim.ended?.reason ?? '—'}</span>
            </div>
          </div>
        </section>

        <section className="scheda-sec">
          <h3>Obiettivi</h3>
          {byCat.map(([cat, rs]) => (
            <div key={cat} className="obj-group">
              <h4>{CAT_LABEL[cat] ?? cat}</h4>
              <ul className="obj-list">
                {rs.map((r) => (
                  <li key={r.obj.id} className={r.ok ? 'ok' : 'ko'}>
                    <span className="obj-mark" aria-label={r.ok ? 'raggiunto' : 'mancato'}>
                      {r.ok ? '✓' : '✗'}
                    </span>
                    <div>
                      <p className="obj-label">
                        {r.obj.label}
                        {r.obj.critical && !r.ok && <span className="crit">critico</span>}
                        <span className="obj-pts num">{r.ok ? `+${r.obj.points}` : `0/${r.obj.points}`}</span>
                      </p>
                      <p className="obj-why">
                        {r.obj.why} <SourceChips ids={r.obj.sources} />
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        {report.penalties.length > 0 && (
          <section className="scheda-sec">
            <h3>Errori rilevati</h3>
            <ul className="pen-list">
              {report.penalties.map((p) => (
                <li key={p.id} className={`sev-${p.severity}`}>
                  <span className="pen-t num">{fmtClock(p.t)}</span>
                  <div>
                    <p className="obj-label">
                      {p.text}
                      <span className="sev">{p.severity}</span>
                      <span className="obj-pts num">−{PENALTY_POINTS[p.severity]}</span>
                    </p>
                    <p className="obj-why">
                      {p.why} <SourceChips ids={p.sources} />
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="scheda-sec">
          <h3>Parametri nel tempo</h3>
          <p className="obj-why strip-note">Andamento reale del paziente, come lo vede l’istruttore: anche i valori che non avevi ancora misurato. Durante l’arresto la SpO₂ non è rilevabile.</p>
          <VitalsStrip sim={sim} />
        </section>

        <section className="scheda-sec two">
          <div>
            <h3>Tempi della missione</h3>
            <table className="tl">
              <tbody>
                {tl.map((e, i) => (
                  <tr key={i}>
                    <td className="num">{fmtClock(e.t)}</td>
                    <td className="num muted">{sim.clock(e.t)}</td>
                    <td>{e.label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <h3>Presidi</h3>
            <ul className="eq-check">
              {brought.map((e) => (
                <li key={e} className="ok">
                  ✓ {EQUIPMENT[e].name}
                </li>
              ))}
              {ess
                .filter((e) => !brought.includes(e))
                .map((e) => (
                  <li key={e} className="ko">
                    ✗ {EQUIPMENT[e].name} (essenziale, non portato)
                  </li>
                ))}
            </ul>
            {scenario.loadout?.note && <p className="obj-why">{scenario.loadout.note}</p>}
          </div>
        </section>

        <section className="scheda-sec">
          <h3>Punti chiave</h3>
          <ol className="teach">
            {scenario.teaching.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ol>
          <p className="scheda-small">
            Fonti dello scenario: <SourceChips ids={scenario.sources} />
          </p>
        </section>
      </article>
    </div>
  );
}
