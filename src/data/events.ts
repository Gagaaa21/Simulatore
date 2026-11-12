/**
 * Accordo Conferenza Unificata 5 agosto 2014 (Rep. Atti 91/CU)
 * Allegato A1 – calcolo del livello di rischio; Allegato A2 – algoritmo di Maurer.
 * Valori come riportati nel testo dell'Accordo e nei recepimenti regionali (es. DGR FVG 1653/2025).
 */

export interface A1Option {
  id: string;
  label: string;
  points: number;
}
export interface A1Group {
  id: string;
  label: string;
  multi: boolean; // più scelte
  section: 'evento' | 'pubblico';
  options: A1Option[];
}

export const A1: A1Group[] = [
  {
    id: 'periodicita', label: 'Ogni quanto si verifica l’evento', multi: false, section: 'evento',
    options: [
      { id: 'annuale', label: 'Annualmente', points: 1 },
      { id: 'mensile', label: 'Mensilmente', points: 2 },
      { id: 'quotidiano', label: 'Tutti i giorni', points: 3 },
      { id: 'occasionale', label: 'Occasionalmente / all’improvviso', points: 4 },
    ],
  },
  {
    id: 'tipo', label: 'Tipo di evento', multi: false, section: 'evento',
    options: [
      { id: 'religioso', label: 'Religioso', points: 1 },
      { id: 'sportivo', label: 'Sportivo', points: 1 },
      { id: 'intrattenimento', label: 'Intrattenimento', points: 2 },
      { id: 'politico', label: 'Politico, sociale', points: 3 },
      { id: 'rock', label: 'Concerto pop/rock', points: 4 },
    ],
  },
  {
    id: 'altre', label: 'Altre variabili', multi: true, section: 'evento',
    options: [
      { id: 'alcol', label: 'Prevista vendita/consumo di alcol', points: 1 },
      { id: 'droghe', label: 'Possibile consumo di droghe', points: 1 },
      { id: 'deboli', label: 'Presenza di categorie deboli (bambini, anziani, disabili)', points: 1 },
      { id: 'media', label: 'Evento ampiamente pubblicizzato dai media', points: 1 },
      { id: 'figure', label: 'Presenza di figure politiche/religiose', points: 1 },
      { id: 'viabilita', label: 'Possibili difficoltà alla viabilità', points: 1 },
      { id: 'tensioni', label: 'Presenza di tensioni socio-politiche', points: 1 },
    ],
  },
  {
    id: 'durata', label: 'Durata', multi: false, section: 'evento',
    options: [
      { id: 'breve', label: 'Meno di 12 ore', points: 1 },
      { id: 'media', label: 'Da 12 ore a 3 giorni', points: 2 },
      { id: 'lunga', label: 'Oltre 3 giorni', points: 3 },
    ],
  },
  {
    id: 'dove', label: 'Dove si verifica', multi: true, section: 'evento',
    options: [
      { id: 'citta', label: 'In città', points: 0 },
      { id: 'periferia', label: 'In periferia, paesi o piccoli centri urbani', points: 1 },
      { id: 'acqua', label: 'In ambiente acquatico (lago, fiume, mare, piscina)', points: 1 },
      { id: 'altro', label: 'Altro (montano, impervio, ambiente rurale)', points: 1 },
    ],
  },
  {
    id: 'luogo', label: 'Caratteristiche del luogo', multi: true, section: 'evento',
    options: [
      { id: 'coperto', label: 'Al coperto', points: 1 },
      { id: 'aperto', label: 'All’aperto', points: 2 },
      { id: 'localizzato', label: 'Localizzato e ben definito', points: 1 },
      { id: 'esteso', label: 'Esteso, più di un campo da calcio', points: 2 },
      { id: 'non_delimitato', label: 'Non delimitato da recinzioni', points: 1 },
      { id: 'delimitato', label: 'Delimitato da recinzioni', points: 2 },
      { id: 'scale', label: 'Presenza di scale in entrata e/o in uscita', points: 2 },
      { id: 'temporanee', label: 'Recinzioni temporanee', points: 3 },
      { id: 'palco', label: 'Ponteggio temporaneo, palco, coperture', points: 3 },
    ],
  },
  {
    id: 'logistica', label: 'Logistica del posto', multi: true, section: 'evento',
    options: [
      { id: 'bagni', label: 'Servizi igienici disponibili', points: -1 },
      { id: 'acqua', label: 'Disponibilità d’acqua', points: -1 },
      { id: 'ristoro', label: 'Punto di ristoro', points: -1 },
    ],
  },
  {
    id: 'partecipanti', label: 'Stima dei partecipanti', multi: false, section: 'pubblico',
    options: [
      { id: 'p0', label: '0 – 4.999', points: 0 },
      { id: 'p1', label: '5.000 – 24.999', points: 1 },
      { id: 'p2', label: '25.000 – 99.999', points: 2 },
      { id: 'p3', label: '100.000 – 500.000', points: 3 },
      { id: 'p4', label: 'Oltre 500.000', points: 4 },
    ],
  },
  {
    id: 'eta', label: 'Età prevalente', multi: false, section: 'pubblico',
    options: [
      { id: 'adulti', label: '25 – 65 anni', points: 1 },
      { id: 'estremi', label: 'Sotto i 25 o sopra i 65 anni', points: 2 },
    ],
  },
  {
    id: 'densita', label: 'Densità (persone/m²)', multi: false, section: 'pubblico',
    options: [
      { id: 'bassa', label: 'Bassa: 1–2', points: 1 },
      { id: 'media', label: 'Media: 3–4', points: 2 },
      { id: 'alta', label: 'Alta: 5–8', points: 3 },
      { id: 'estrema', label: 'Estrema: oltre 8', points: 4 },
    ],
  },
  {
    id: 'condizione', label: 'Condizione dei partecipanti', multi: false, section: 'pubblico',
    options: [
      { id: 'rilassato', label: 'Rilassato', points: 1 },
      { id: 'eccitato', label: 'Eccitato', points: 2 },
      { id: 'aggressivo', label: 'Aggressivo', points: 3 },
    ],
  },
  {
    id: 'posizione', label: 'Posizione', multi: false, section: 'pubblico',
    options: [
      { id: 'seduti', label: 'Seduti', points: 1 },
      { id: 'parte', label: 'In parte seduti', points: 2 },
      { id: 'piedi', label: 'In piedi', points: 3 },
    ],
  },
];

export type A1Selection = Record<string, string[]>;

export function a1Score(sel: A1Selection): number {
  return A1.reduce((tot, g) => tot + (sel[g.id] ?? []).reduce((a, id) => a + (g.options.find((o) => o.id === id)?.points ?? 0), 0), 0);
}

export function riskClass(score: number): { label: string; level: 0 | 1 | 2 } {
  if (score < 18) return { label: 'Molto basso / basso', level: 0 };
  if (score <= 36) return { label: 'Moderato / elevato', level: 1 };
  return { label: 'Molto elevato', level: 2 };
}

// ───────────────────────── Allegato A2 – Maurer
export const MAURER_TYPES: { id: string; label: string; factor: number }[] = [
  { id: 'sport', label: 'Manifestazione sportiva generica', factor: 0.3 },
  { id: 'esposizione', label: 'Esposizione', factor: 0.3 },
  { id: 'bazar', label: 'Bazar', factor: 0.3 },
  { id: 'corteo', label: 'Dimostrazione o corteo', factor: 0.8 },
  { id: 'fuochi', label: 'Fuochi d’artificio', factor: 0.4 },
  { id: 'mercatino', label: 'Mercatino delle pulci o di Natale', factor: 0.3 },
  { id: 'airshow', label: 'Airshow', factor: 0.9 },
  { id: 'carnevale', label: 'Carnevale', factor: 0.7 },
  { id: 'mista', label: 'Mista (sport + musica + show)', factor: 0.35 },
  { id: 'concerto', label: 'Concerto', factor: 0.2 },
  { id: 'comizio', label: 'Comizio', factor: 0.5 },
  { id: 'motori', label: 'Gara auto/motociclistica', factor: 0.8 },
  { id: 'musicale', label: 'Manifestazione musicale', factor: 0.5 },
  { id: 'opera', label: 'Opera', factor: 0.2 },
  { id: 'ciclismo', label: 'Gara ciclistica', factor: 0.3 },
  { id: 'equitazione', label: 'Equitazione', factor: 0.1 },
  { id: 'rock', label: 'Concerto rock', factor: 1 },
  { id: 'teatro', label: 'Rappresentazione teatrale', factor: 0.2 },
  { id: 'parata', label: 'Show – parata', factor: 0.2 },
  { id: 'quartiere', label: 'Festa di quartiere o di strada', factor: 0.4 },
  { id: 'danza', label: 'Spettacolo di danza', factor: 0.3 },
  { id: 'folk', label: 'Festa folkloristica', factor: 0.4 },
  { id: 'fiera', label: 'Fiera', factor: 0.3 },
  { id: 'fondo', label: 'Gara di fondo', factor: 0.3 },
];

/** Punti A: capienza massima consentita. */
export function maurerA(capacity: number, indoor: boolean): number {
  const steps: [number, number][] = [
    [500, 1],
    [1000, 2],
    [1500, 3],
    [3000, 4],
    [6000, 5],
    [10000, 6],
    [20000, 7],
  ];
  let pts = 0;
  for (const [cap, p] of steps) {
    if (capacity <= cap) {
      pts = p;
      break;
    }
  }
  if (!pts) pts = 7 + Math.ceil((capacity - 20000) / 10000);
  return indoor ? pts * 2 : pts;
}

/** Punti B: 1 punto ogni 500 visitatori effettivamente previsti. */
export const maurerB = (expected: number) => Math.ceil(expected / 500);

export function maurerScore(a: number, b: number, c: number, personalita: number, disordini: boolean) {
  return Math.round(((a + b) * c + Math.floor(personalita / 5) * 10 + (disordini ? 10 : 0)) * 10) / 10;
}

type Band = [number, number, number]; // da, a, risorse
const pick = (bands: Band[], score: number, overflow: number) => {
  for (const [lo, hi, n] of bands) if (score >= lo && score <= hi) return n;
  return score > bands[bands.length - 1][1] ? overflow : 0;
};

export function maurerResources(score: number) {
  return {
    soccorso: pick([[0, 6, 0], [6.1, 25.5, 1], [25.6, 45.5, 2], [45.6, 60.5, 3], [60.6, 75.5, 4], [75.6, 100, 5]], score, 6),
    trasporto: pick([[0, 4, 0], [4.1, 13, 1], [13.1, 25, 2], [25.1, 40, 3], [40.1, 60, 4], [60.1, 80, 5], [80.1, 100, 6], [100.1, 120, 8]], score, 8),
    piedi: pick([[0, 2, 0], [2.1, 4, 3], [4.1, 13.5, 5], [13.6, 22, 10], [22.1, 40, 20], [40.1, 60, 30], [60.1, 80, 40], [80.1, 100, 80], [100.1, 120, 120]], score, 120),
    medici: pick([[0, 13, 0], [13.1, 30, 1], [30.1, 60, 2], [60.1, 90, 3]], score, 4),
  };
}

// ───────────────────────── eventi da pianificare
export interface EventCase {
  id: string;
  title: string;
  facts: string[];
  a1: A1Selection;
  capacity: number;
  indoor: boolean;
  expected: number;
  type: string;
  personalita: number;
  disordini: boolean;
}

export const EVENTS: EventCase[] = [
  {
    id: 'rock',
    title: 'Concerto rock allo stadio',
    facts: [
      'Tappa annuale del tour estivo di una band rock, ampiamente pubblicizzata da radio e TV.',
      'Stadio comunale in città, all’aperto: prato e tribune, area più estesa di un campo da calcio, recintata.',
      'Ingressi e uscite con scale verso le tribune; transenne temporanee davanti al palco montato per l’occasione.',
      'Capienza autorizzata 40.000 persone; biglietti venduti 35.000.',
      'Pubblico prevalentemente sotto i 25 anni, in piedi ed eccitato; densità alta sotto il palco (5–8 persone/m²).',
      'Vendita di birra prevista; possibile consumo di droghe. Difficoltà di viabilità attese a fine concerto.',
      'Durata: dalle 17 all’una di notte. Bagni chimici, punti acqua e stand gastronomici presenti.',
      'Nessuna personalità attesa; le Forze dell’ordine non segnalano rischi di disordini.',
    ],
    a1: {
      periodicita: ['annuale'],
      tipo: ['rock'],
      altre: ['alcol', 'droghe', 'media', 'viabilita'],
      durata: ['breve'],
      dove: ['citta'],
      luogo: ['aperto', 'esteso', 'delimitato', 'scale', 'temporanee', 'palco'],
      logistica: ['bagni', 'acqua', 'ristoro'],
      partecipanti: ['p2'],
      eta: ['estremi'],
      densita: ['alta'],
      condizione: ['eccitato'],
      posizione: ['piedi'],
    },
    capacity: 40000,
    indoor: false,
    expected: 35000,
    type: 'rock',
    personalita: 0,
    disordini: false,
  },
  {
    id: 'sagra',
    title: 'Sagra di paese',
    facts: [
      'Festa folkloristica che si ripete ogni anno, per tre serate consecutive, nella piazza di un piccolo centro.',
      'Piazza all’aperto, ben definita, senza recinzioni; un palco per la musica dal vivo.',
      'Capienza della piazza 6.000 persone; attese circa 4.000 presenze.',
      'Famiglie con bambini e molti anziani; densità bassa (1–2 persone/m²), pubblico rilassato, in parte seduto ai tavoli.',
      'Stand con vino e birra. Servizi igienici, fontanelle e punti di ristoro presenti.',
      'Nessuna personalità, nessuna criticità di ordine pubblico, viabilità regolare.',
    ],
    a1: {
      periodicita: ['annuale'],
      tipo: ['intrattenimento'],
      altre: ['alcol', 'deboli'],
      durata: ['media'],
      dove: ['periferia'],
      luogo: ['aperto', 'localizzato', 'non_delimitato', 'palco'],
      logistica: ['bagni', 'acqua', 'ristoro'],
      partecipanti: ['p0'],
      eta: ['estremi'],
      densita: ['bassa'],
      condizione: ['rilassato'],
      posizione: ['parte'],
    },
    capacity: 6000,
    indoor: false,
    expected: 4000,
    type: 'folk',
    personalita: 0,
    disordini: false,
  },
  {
    id: 'corteo',
    title: 'Corteo per una vertenza nazionale',
    facts: [
      'Manifestazione organizzata con pochi giorni di preavviso, a forte risonanza mediatica.',
      'Percorso di 3 km nelle vie del centro città, all’aperto, esteso e non recintato; meno di 12 ore.',
      'Area del percorso stimata per una capienza di 20.000 persone; attese 15.000.',
      'Prevalenza di giovani sotto i 25 anni, in piedi, eccitati; densità media (3–4 persone/m²).',
      'Prevista la presenza di 5 parlamentari. Le Forze dell’ordine segnalano tensioni e rischio di disordini.',
      'Chiusura di strade con difficoltà alla viabilità. Nessun servizio igienico, nessun punto acqua o ristoro dedicato.',
    ],
    a1: {
      periodicita: ['occasionale'],
      tipo: ['politico'],
      altre: ['media', 'figure', 'viabilita', 'tensioni'],
      durata: ['breve'],
      dove: ['citta'],
      luogo: ['aperto', 'esteso', 'non_delimitato'],
      logistica: [],
      partecipanti: ['p1'],
      eta: ['estremi'],
      densita: ['media'],
      condizione: ['eccitato'],
      posizione: ['piedi'],
    },
    capacity: 20000,
    indoor: false,
    expected: 15000,
    type: 'corteo',
    personalita: 5,
    disordini: true,
  },
];
