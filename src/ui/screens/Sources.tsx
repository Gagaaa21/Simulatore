import { SOURCES } from '../../data/sources';

export function Sources({ onBack }: { onBack: () => void }) {
  const list = Object.values(SOURCES).sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
  return (
    <div className="page sources">
      <header className="page-head">
        <button className="back" onClick={onBack}>
          ‹ Menu
        </button>
        <div>
          <h1>Fonti e avvertenze</h1>
          <p className="muted">Ogni regola, punteggio e messaggio del simulatore rimanda a una di queste fonti ufficiali.</p>
        </div>
      </header>
      <section className="src-note">
        <h2>Prima di iniziare</h2>
        <ul>
          <li>Sirena 118 è uno strumento di ripasso e di allenamento decisionale. Non rilascia certificazioni e non sostituisce i corsi BLSD, PBLSD, PTC e la formazione regionale per soccorritori.</li>
          <li>I protocolli operativi variano tra Regioni e Centrali Operative (presidi, farmaci, codici di rientro). In servizio vale sempre il protocollo della tua Centrale.</li>
          <li>La fisiologia del paziente è semplificata a scopo didattico: tempi e valori sono plausibili, non predittivi.</li>
          <li>Le linee guida usate sono quelle ERC 2025 (pubblicate a ottobre 2025), le più recenti al momento dello sviluppo.</li>
        </ul>
      </section>
      <ol className="src-list">
        {list.map((s) => (
          <li key={s.id}>
            <p className="src-title">{s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.title}</a> : s.title}</p>
            <p className="src-meta">
              {s.org}
              {s.year ? ` · ${s.year}` : ''}
              {s.ref ? ` · ${s.ref}` : ''}
            </p>
            {s.note && <p className="src-noteline">{s.note}</p>}
          </li>
        ))}
      </ol>
    </div>
  );
}
