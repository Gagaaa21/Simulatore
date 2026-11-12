import { SOURCES } from '../../data/sources';

export function SourceChips({ ids }: { ids: string[] }) {
  if (!ids.length) return null;
  return (
    <span className="chips">
      {ids.map((id) => {
        const s = SOURCES[id];
        if (!s) return null;
        const title = `${s.title} — ${s.org}${s.year ? `, ${s.year}` : ''}${s.ref ? `. ${s.ref}` : ''}`;
        return s.url ? (
          <a key={id} className="chip" href={s.url} target="_blank" rel="noreferrer" title={title}>
            {s.short}
          </a>
        ) : (
          <span key={id} className="chip" title={title}>
            {s.short}
          </span>
        );
      })}
    </span>
  );
}
