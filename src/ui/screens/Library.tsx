import { useState } from 'react';
import { PROTOCOLS, PROTOCOL_ORDER } from '../../data/protocols';
import type { ProtocolId } from '../../engine/types';
import { CRITICITA, LUOGO, PATOLOGIA, VALUTAZIONE, type CriticitaCode, type LuogoCode, type PatologiaCode, type ValutazioneCode } from '../../data/codes';
import { SourceChips } from '../components/SourceChip';

type PageId = ProtocolId | 'codici' | 'maxi' | 'eventi' | 'legale';

const EXTRA: { id: PageId; name: string }[] = [
  { id: 'codici', name: 'Codici del 118' },
  { id: 'maxi', name: 'Maxi-emergenza e triage START' },
  { id: 'eventi', name: 'Eventi e manifestazioni' },
  { id: 'legale', name: 'Aspetti legali' },
];

function ProtocolPage({ id }: { id: ProtocolId }) {
  const p = PROTOCOLS[id];
  return (
    <article className="lib-page">
      <p className="lib-fam">{p.family}</p>
      <h2>{p.name}</h2>
      <p className="lib-sum">{p.summary}</p>
      <ol className="flow">
        {p.steps.map((s, i) => (
          <li key={i} className={s.ask ? 'ask' : ''}>
            <span className="flow-n num">{i + 1}</span>
            <div>
              <p className="flow-t">{s.title}</p>
              {s.detail && <p className="flow-d">{s.detail}</p>}
            </div>
          </li>
        ))}
      </ol>
      {p.numbers && (
        <dl className="numbers">
          {p.numbers.map((n) => (
            <div key={n.label}>
              <dt>{n.label}</dt>
              <dd className="num">{n.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {p.pitfalls && (
        <>
          <h3>Errori frequenti</h3>
          <ul className="pitfalls">
            {p.pitfalls.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </>
      )}
      <p className="lib-src">
        Fonti: <SourceChips ids={p.sources} />
      </p>
    </article>
  );
}

function Codici() {
  return (
    <article className="lib-page">
      <p className="lib-fam">Normativa</p>
      <h2>Codici del 118</h2>
      <p className="lib-sum">
        Il DM 15 maggio 1992 stabilisce la codifica uniforme degli interventi di emergenza. Il giudizio di sintesi della Centrale è un codice di quattro caratteri: luogo, patologia presunta, criticità (es. <strong className="num">KC2R</strong>: casa, cardiocircolatoria, rosso).
      </p>
      <h3>Criticità dell’evento (codice colore di invio)</h3>
      <table className="lib-table">
        <tbody>
          {(Object.keys(CRITICITA) as CriticitaCode[]).map((k) => (
            <tr key={k}>
              <td>
                <span className="dot" style={{ background: CRITICITA[k].hex }} /> {CRITICITA[k].label}
              </td>
              <td>{CRITICITA[k].def}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Luogo dell’evento</h3>
      <table className="lib-table">
        <tbody>
          {(Object.keys(LUOGO) as LuogoCode[]).map((k) => (
            <tr key={k}>
              <td className="num">{k}</td>
              <td>
                <strong>{LUOGO[k].label}</strong> — {LUOGO[k].def}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Patologia prevalente presunta</h3>
      <table className="lib-table">
        <tbody>
          {(['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C0'] as PatologiaCode[]).map((k) => (
            <tr key={k}>
              <td className="num">{k}</td>
              <td>{PATOLOGIA[k]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Valutazione sanitaria sul posto</h3>
      <p>La comunica l’equipaggio dopo aver valutato il paziente. Molte Centrali la esprimono anche con un colore di rientro: verifica il protocollo della tua Regione.</p>
      <table className="lib-table">
        <tbody>
          {(Object.keys(VALUTAZIONE) as ValutazioneCode[]).map((k) => (
            <tr key={k}>
              <td className="num">
                <span className="dot" style={{ background: VALUTAZIONE[k].hex }} /> {k}
              </td>
              <td>
                {VALUTAZIONE[k].def} <span className="muted">({VALUTAZIONE[k].colore})</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Da non confondere: il triage del Pronto Soccorso</h3>
      <p>In ospedale dal 2019 si usano cinque codici numerici: 1 rosso (emergenza), 2 arancione (urgenza), 3 azzurro (urgenza differibile), 4 verde (urgenza minore), 5 bianco (non urgenza).</p>
      <p className="lib-src">
        Fonti: <SourceChips ids={['DM_1992', 'DPR_1992', 'TRIAGE_PS_2019']} />
      </p>
    </article>
  );
}

function Maxi() {
  return (
    <article className="lib-page">
      <p className="lib-fam">Maxi-emergenza</p>
      <h2>Triage START e JumpSTART</h2>
      <p className="lib-sum">Quando i feriti superano le risorse si cambia obiettivo: il massimo beneficio per il maggior numero. Il triage START classifica ogni ferito in meno di un minuto.</p>
      <ol className="flow">
        <li>
          <span className="flow-n num">1</span>
          <div>
            <p className="flow-t">Cammina?</p>
            <p className="flow-d">Chi riesce a camminare va verso un punto di raccolta: VERDE (minore). Lo rivaluterai.</p>
          </div>
        </li>
        <li className="ask">
          <span className="flow-n num">2</span>
          <div>
            <p className="flow-t">Respira?</p>
            <p className="flow-d">Se no, apri le vie aeree: se riprende a respirare è ROSSO, altrimenti NERO (deceduto o non salvabile con le risorse disponibili).</p>
          </div>
        </li>
        <li className="ask">
          <span className="flow-n num">3</span>
          <div>
            <p className="flow-t">Frequenza respiratoria oltre 30/min?</p>
            <p className="flow-d">Se sì: ROSSO.</p>
          </div>
        </li>
        <li className="ask">
          <span className="flow-n num">4</span>
          <div>
            <p className="flow-t">Perfusione</p>
            <p className="flow-d">Polso radiale assente o riempimento capillare oltre 2 s: ROSSO (controlla le emorragie).</p>
          </div>
        </li>
        <li className="ask">
          <span className="flow-n num">5</span>
          <div>
            <p className="flow-t">Esegue ordini semplici?</p>
            <p className="flow-d">No: ROSSO. Sì: GIALLO.</p>
          </div>
        </li>
      </ol>
      <h3>JumpSTART (bambini, circa 1–8 anni)</h3>
      <ul className="pitfalls">
        <li>Apnea con polso palpabile dopo l’apertura delle vie aeree: 5 ventilazioni. Se riprende a respirare ROSSO, altrimenti NERO.</li>
        <li>Frequenza respiratoria sotto 15 o sopra 45: ROSSO.</li>
        <li>Polso periferico assente: ROSSO.</li>
        <li>AVPU: P con risposta inappropriata o U: ROSSO; A, V o P appropriato: GIALLO.</li>
      </ul>
      <h3>Interventi ammessi durante il triage</h3>
      <p>Solo manovre rapide salvavita: apertura delle vie aeree, controllo delle emorragie massive (compressione o tourniquet), posizione laterale. Poi si passa al ferito successivo.</p>
      <h3>Organizzazione</h3>
      <p>I feriti vengono raccolti e stabilizzati nel Posto Medico Avanzato (PMA), dove si esegue un secondo triage prima dell’evacuazione verso gli ospedali.</p>
      <p className="lib-src">
        Fonti: <SourceChips ids={['START', 'DPCM_2001_MAXI']} />
      </p>
    </article>
  );
}

function Eventi() {
  return (
    <article className="lib-page">
      <p className="lib-fam">Eventi e manifestazioni programmate</p>
      <h2>Livello di rischio e risorse</h2>
      <p className="lib-sum">L’Accordo della Conferenza Unificata del 5 agosto 2014 (Rep. Atti 91/CU) obbliga l’organizzatore a garantire il soccorso sanitario, dimensionato con due tabelle.</p>
      <h3>Allegato A1 – livello di rischio</h3>
      <p>L’organizzatore somma i punti di variabili legate all’evento (periodicità, tipo, alcol, droghe, categorie deboli, durata, luogo, caratteristiche del sito, logistica) e al pubblico (numero stimato, età, densità, condizione, posizione).</p>
      <dl className="numbers">
        <div>
          <dt>Molto basso / basso</dt>
          <dd className="num">&lt; 18</dd>
        </div>
        <div>
          <dt>Moderato / elevato</dt>
          <dd className="num">18–36</dd>
        </div>
        <div>
          <dt>Molto elevato</dt>
          <dd className="num">37–55</dd>
        </div>
      </dl>
      <h3>Allegato A2 – algoritmo di Maurer</h3>
      <p>
        Punteggio = (A + B) × C + D + E. A: capienza massima (1 punto a 500 visitatori, 2 a 1.000, 3 a 1.500, 4 a 3.000, 5 a 6.000, 6 a 10.000, 7 a 20.000, +1 ogni ulteriori 10.000; raddoppia al chiuso). B: 1 punto ogni 500 visitatori previsti. C: fattore del tipo di manifestazione (es. concerto rock 1, manifestazione musicale 0,5, concerto 0,2). D: 10 punti ogni 5 personalità. E: +10 per rischio di disordini.
      </p>
      <p>Dal punteggio si leggono le ambulanze di soccorso e di trasporto, i soccorritori a piedi e i medici. Sono parametri indicativi: il Servizio di Emergenza Territoriale 118 può modificarli.</p>
      <h3>Chi c’è sul campo</h3>
      <ul className="pitfalls">
        <li>MSB – mezzo di soccorso di base: ambulanza con almeno un autista soccorritore e un soccorritore certificati BLSD e primo soccorso.</li>
        <li>MSA – mezzo di soccorso avanzato: in più un infermiere esperto di area critica o emergenza (e/o un medico, a seconda del modello regionale).</li>
        <li>Squadra a piedi: almeno due soccorritori con BLSD e primo soccorso.</li>
        <li>PMA – posto medico avanzato: struttura di triage e stabilizzazione sul posto.</li>
      </ul>
      <p className="lib-src">
        Fonti: <SourceChips ids={['ACCORDO_EVENTI_2014', 'FVG_EVENTI_2025']} />
      </p>
    </article>
  );
}

function Legale() {
  return (
    <article className="lib-page">
      <p className="lib-fam">Normativa</p>
      <h2>Aspetti legali essenziali</h2>
      <h3>Defibrillatore</h3>
      <p>
        La Legge 116/2021 consente l’uso del DAE anche a chi non è formato quando non è presente personale formato, in caso di sospetto arresto cardiaco; per chi interviene si applica l’art. 54 del codice penale (stato di necessità). La Legge 120/2001 aveva introdotto l’uso dei defibrillatori semiautomatici in ambiente extraospedaliero da parte di personale non medico formato.
      </p>
      <h3>Omissione di soccorso</h3>
      <p>L’art. 593 del codice penale punisce chi, trovando una persona ferita o in pericolo, omette di prestare l’assistenza occorrente o di darne immediato avviso all’Autorità. Chiamare il 112 è già un modo di adempiere.</p>
      <h3>Il tuo perimetro</h3>
      <p>Il soccorritore agisce secondo la formazione ricevuta e i protocolli della propria Centrale Operativa. Farmaci e manovre avanzate sono competenza del personale sanitario, salvo protocolli regionali specifici.</p>
      <p className="lib-src">
        Fonti: <SourceChips ids={['L116_2021', 'L120_2001', 'CP_593']} />
      </p>
    </article>
  );
}

export function Library({ focus, onBack }: { focus?: string; onBack: () => void }) {
  const [page, setPage] = useState<PageId>((focus as PageId) ?? 'bls_adulto');
  return (
    <div className="page library">
      <header className="page-head">
        <button className="back" onClick={onBack}>
          ‹ Menu
        </button>
        <div>
          <h1>Protocolli</h1>
          <p className="muted">Sequenze e numeri chiave tratti dalle linee guida ufficiali. Il protocollo della tua Centrale Operativa prevale sempre.</p>
        </div>
      </header>
      <div className="lib-grid">
        <nav className="lib-nav" aria-label="Protocolli">
          {Array.from(new Set(PROTOCOL_ORDER.map((id) => PROTOCOLS[id].family))).map((f) => (
            <div key={f}>
              <p className="lib-nav-h">{f}</p>
              {PROTOCOL_ORDER.filter((id) => PROTOCOLS[id].family === f).map((id) => (
                <button key={id} className={page === id ? 'on' : ''} onClick={() => setPage(id)}>
                  {PROTOCOLS[id].name}
                </button>
              ))}
            </div>
          ))}
          <div>
            <p className="lib-nav-h">Sistema 118</p>
            {EXTRA.map((e) => (
              <button key={e.id} className={page === e.id ? 'on' : ''} onClick={() => setPage(e.id)}>
                {e.name}
              </button>
            ))}
          </div>
        </nav>
        <div className="lib-body">
          {page === 'codici' ? <Codici /> : page === 'maxi' ? <Maxi /> : page === 'eventi' ? <Eventi /> : page === 'legale' ? <Legale /> : <ProtocolPage id={page} />}
        </div>
      </div>
    </div>
  );
}
