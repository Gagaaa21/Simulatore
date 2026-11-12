import type { Look } from '../engine/types';

export type Tag = 'rosso' | 'giallo' | 'verde' | 'nero';

export interface Victim {
  id: string;
  label: string;
  age: number;
  sex: 'M' | 'F';
  child: boolean; // usa JumpSTART
  look: Look;
  desc: string; // ciò che vedi avvicinandoti
  walks: boolean;
  breathes: boolean; // respira spontaneamente
  breathesAfterAirway: boolean; // se non respira: riprende aprendo le vie aeree?
  breathesAfterRescue?: boolean; // JumpSTART: dopo 5 ventilazioni
  rr: number;
  radial: boolean;
  crt: number; // s
  obeys: boolean; // adulto: esegue ordini semplici
  avpu: 'A' | 'V' | 'P' | 'Pinappropriato' | 'U';
  bleeding?: string; // emorragia massiva da trattare subito
  correct: Tag;
  why: string;
}

const L = (skinTone: string, hair: string, shirt: string, pants: string, hairStyle: Look['hairStyle'] = 'corti', build: Look['build'] = 'adulto'): Look => ({
  skinTone,
  hair,
  hairStyle,
  shirt,
  pants,
  build,
});

/** Ferite non deambulanti dopo la calca. I deambulanti vengono smistati con il primo comando. */
export const VICTIMS: Victim[] = [
  {
    id: 'v1', label: 'Uomo, circa 30 anni', age: 30, sex: 'M', child: false, look: L('#d9a882', '#2b211b', '#1d1d22', '#2f3f5e'),
    desc: 'Seduto a terra, si tiene la gamba destra deformata; ti chiama.',
    walks: false, breathes: true, breathesAfterAirway: true, rr: 22, radial: true, crt: 1.5, obeys: true, avpu: 'A',
    correct: 'giallo', why: 'Non cammina, respira con FR < 30, polso radiale presente, esegue gli ordini: GIALLO.',
  },
  {
    id: 'v2', label: 'Donna, circa 40 anni', age: 40, sex: 'F', child: false, look: L('#efc19d', '#7a4b2a', '#7b2d42', '#1f2633', 'lunghi'),
    desc: 'Supina, immobile, colorito grigio, schiacciata contro la transenna.',
    walks: false, breathes: false, breathesAfterAirway: false, rr: 0, radial: false, crt: 6, obeys: false, avpu: 'U',
    correct: 'nero', why: 'Non respira nemmeno dopo l’apertura delle vie aeree: NERO (deceduta o non salvabile con le risorse disponibili).',
  },
  {
    id: 'v3', label: 'Uomo, circa 25 anni', age: 25, sex: 'M', child: false, look: L('#c98f66', '#141414', '#3b8f6a', '#2c2f38'),
    desc: 'Supino, non risponde, sembra non respirare.',
    walks: false, breathes: false, breathesAfterAirway: true, rr: 28, radial: true, crt: 2, obeys: false, avpu: 'U',
    correct: 'rosso', why: 'Riprende a respirare con l’apertura delle vie aeree: ROSSO (e mantieni le vie aeree aperte con la posizione).',
  },
  {
    id: 'v4', label: 'Donna, circa 20 anni', age: 20, sex: 'F', child: false, look: L('#f0c7a7', '#c49a62', '#e8e8ee', '#2a2e45', 'lunghi'),
    desc: 'A terra, ansima, si tiene il torace con le mani.',
    walks: false, breathes: true, breathesAfterAirway: true, rr: 36, radial: true, crt: 2, obeys: true, avpu: 'A',
    correct: 'rosso', why: 'Frequenza respiratoria superiore a 30/min: ROSSO.',
  },
  {
    id: 'v5', label: 'Uomo, circa 35 anni', age: 35, sex: 'M', child: false, look: L('#e3b995', '#4a3626', '#f1a21c', '#3b4a63'),
    desc: 'Pallido e sudato, una pozza di sangue sotto il braccio sinistro: ferita profonda da vetro.',
    walks: false, breathes: true, breathesAfterAirway: true, rr: 24, radial: false, crt: 3.5, obeys: true, avpu: 'A',
    bleeding: 'Emorragia massiva dall’avambraccio sinistro',
    correct: 'rosso', why: 'Polso radiale assente / riempimento capillare > 2 s: ROSSO. L’emorragia massiva va controllata subito (tourniquet).',
  },
  {
    id: 'v6', label: 'Donna, circa 50 anni', age: 50, sex: 'F', child: false, look: L('#ebc3a6', '#cfcfd4', '#b5657a', '#3f4656', 'raccolti'),
    desc: 'Ha una ferita al capo, occhi aperti, sguardo perso.',
    walks: false, breathes: true, breathesAfterAirway: true, rr: 20, radial: true, crt: 1.5, obeys: false, avpu: 'V',
    correct: 'rosso', why: 'Respiro e perfusione nella norma ma non esegue ordini semplici: ROSSO.',
  },
  {
    id: 'v7', label: 'Uomo, circa 45 anni', age: 45, sex: 'M', child: false, look: L('#dcad8a', '#5f5a55', '#5b4a3a', '#3a3a3f'),
    desc: 'A terra, lamenta dolore al fianco, risponde in modo appropriato.',
    walks: false, breathes: true, breathesAfterAirway: true, rr: 18, radial: true, crt: 2, obeys: true, avpu: 'A',
    correct: 'giallo', why: 'Non cammina, FR < 30, polso radiale presente, esegue gli ordini: GIALLO.',
  },
  {
    id: 'v8', label: 'Bambino, circa 6 anni', age: 6, sex: 'M', child: true, look: L('#f0c8a8', '#c79a5e', '#3fa0d8', '#2a3a55', 'bimbo', 'bambino'),
    desc: 'Immobile, non respira; senti un polso carotideo debole.',
    walks: false, breathes: false, breathesAfterAirway: false, breathesAfterRescue: true, rr: 30, radial: true, crt: 2, obeys: false, avpu: 'U',
    correct: 'rosso', why: 'JumpSTART: apnea con polso dopo l’apertura delle vie aeree → 5 ventilazioni; riprende a respirare: ROSSO.',
  },
  {
    id: 'v9', label: 'Bambina, circa 4 anni', age: 4, sex: 'F', child: true, look: L('#f2cdb0', '#3a2c22', '#f2a6c1', '#5b6fa8', 'bimbo', 'bambino'),
    desc: 'Piange debolmente, respira molto veloce.',
    walks: false, breathes: true, breathesAfterAirway: true, rr: 52, radial: true, crt: 2, obeys: false, avpu: 'V',
    correct: 'rosso', why: 'JumpSTART: frequenza respiratoria oltre 45/min: ROSSO.',
  },
  {
    id: 'v10', label: 'Bambino, circa 7 anni', age: 7, sex: 'M', child: true, look: L('#d9a882', '#2b211b', '#e45d3a', '#2f3f5e', 'bimbo', 'bambino'),
    desc: 'Seduto, si tiene la caviglia, risponde alle domande.',
    walks: false, breathes: true, breathesAfterAirway: true, rr: 28, radial: true, crt: 1.5, obeys: true, avpu: 'A',
    correct: 'giallo', why: 'JumpSTART: FR tra 15 e 45, polso periferico presente, AVPU A: GIALLO.',
  },
  {
    id: 'v11', label: 'Donna, circa 30 anni', age: 30, sex: 'F', child: false, look: L('#d2a07a', '#1f1a17', '#4e7a52', '#2b2f38', 'lunghi'),
    desc: 'Incinta di qualche mese, seduta, spaventata, dolore al braccio.',
    walks: false, breathes: true, breathesAfterAirway: true, rr: 22, radial: true, crt: 1.5, obeys: true, avpu: 'A',
    correct: 'giallo', why: 'Non cammina, FR < 30, polso presente, esegue gli ordini: GIALLO (la gravidanza da sola non cambia il codice START).',
  },
  {
    id: 'v12', label: 'Uomo, circa 60 anni', age: 60, sex: 'M', child: false, look: L('#d8b08e', '#a7adb3', '#3c6e9f', '#3a3a48'),
    desc: 'Supino, respira lentamente e russando, non apre gli occhi.',
    walks: false, breathes: true, breathesAfterAirway: true, rr: 9, radial: true, crt: 2, obeys: false, avpu: 'P',
    correct: 'rosso', why: 'FR sotto 30 e polso presente, ma non esegue ordini semplici: ROSSO.',
  },
  {
    id: 'v13', label: 'Uomo, circa 22 anni', age: 22, sex: 'M', child: false, look: L('#e6bc98', '#151515', '#121214', '#2f3f5e'),
    desc: 'Prono, immobile; girato supino non respira.',
    walks: false, breathes: false, breathesAfterAirway: false, rr: 0, radial: false, crt: 6, obeys: false, avpu: 'U',
    correct: 'nero', why: 'Apnea persistente dopo l’apertura delle vie aeree: NERO.',
  },
  {
    id: 'v14', label: 'Donna, circa 28 anni', age: 28, sex: 'F', child: false, look: L('#e9b998', '#2a1d14', '#7a1f2a', '#1e2433', 'lunghi'),
    desc: 'Pallidissima, fredda, risponde ma con voce flebile.',
    walks: false, breathes: true, breathesAfterAirway: true, rr: 26, radial: false, crt: 3, obeys: true, avpu: 'A',
    correct: 'rosso', why: 'Polso radiale assente e riempimento capillare > 2 s: ROSSO.',
  },
];

/** Feriti deambulanti che si allontanano al primo comando. */
export const WALKING = 7;

export const TAG_INFO: Record<Tag, { label: string; hex: string; text: string; meaning: string }> = {
  rosso: { label: 'Rosso', hex: '#e5323b', text: '#fff', meaning: 'Immediato' },
  giallo: { label: 'Giallo', hex: '#f5c21b', text: '#1b1b1b', meaning: 'Differibile' },
  verde: { label: 'Verde', hex: '#2db34f', text: '#fff', meaning: 'Minore' },
  nero: { label: 'Nero', hex: '#20262e', text: '#fff', meaning: 'Deceduto / non salvabile' },
};

/** Costo in secondi delle valutazioni durante il triage. */
export const COST = {
  chiama: 20,
  respira: 5,
  vie_aeree: 5,
  ventilazioni: 10,
  fr: 10,
  polso: 5,
  ordini: 5,
  avpu: 5,
  emorragia: 20,
  tag: 3,
} as const;
