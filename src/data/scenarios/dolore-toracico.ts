import type { Scenario } from '../../engine/types';
import { afterContact, contact, flagT } from './helpers';

/** Sospetto infarto con evoluzione in fibrillazione ventricolare. */
export const doloreToracico: Scenario = {
  id: 'dolore-toracico',
  title: 'Un peso sul petto',
  subtitle: 'Dolore toracico da 40 minuti: tieni il DAE a portata di mano',
  category: '118',
  difficulty: 2,
  minutes: 14,
  setting: 'casa',
  timeOfDay: 'notte',
  role: 'msb',
  crew: 3,
  dispatch: {
    luogo: 'K',
    patologia: 'C2',
    criticita: 'G',
    address: 'Via Mazzini 40, secondo piano senza ascensore',
    caller: 'Il paziente',
    time: '03:12',
    travel: 540,
    text: 'Uomo di 62 anni con dolore al petto «come un peso» da circa 40 minuti, sudato. Cosciente, risponde al telefono.',
  },
  loadout: {
    essential: ['zaino', 'dae', 'sedia'],
    recommended: ['ossigeno', 'pallone'],
    fetchTime: 120,
    note: 'Dolore toracico: DAE sempre (rischio di aritmie maligne) e sedia portantina per evitare che il paziente faccia le scale a piedi.',
  },
  scene: {
    intro: 'Camera da letto. Il paziente è seduto sul bordo del letto, pallido e sudato, una mano sul petto. La moglie vi apre la porta.',
    hazards: [],
    bystanders: 'La moglie.',
  },
  patient: {
    name: 'Franco',
    age: 62,
    sex: 'M',
    weightKg: 90,
    avpu: 'A',
    gcs: 15,
    airway: 'pervie',
    breathing: 'normale',
    rhythm: 'sinusale',
    pulseRadial: true,
    v: { hr: 96, rr: 20, spo2: 96, sbp: 150, dbp: 92, glu: 142, temp: 36.4, crt: 2 },
    skin: { color: 'pallida', temp: 'fredda', sweaty: true },
    pupils: 'normali',
    speech: 'normale',
    position: 'seduto',
    canSwallow: true,
    seizing: false,
    vomitInMouth: false,
    look: { skinTone: '#dcaa84', hair: '#5f5a55', hairStyle: 'corti', shirt: '#7b8fa6', pants: '#2f3a4a', build: 'robusto' },
  },
  trauma: false,
  arrest: { shockable: true, roscAfterShocks: 1 },
  answers: {
    sintomi: 'Ho un peso qui sul petto, come un macigno, e mi viene da vomitare. Sono tutto sudato.',
    dolore: 'È iniziato a riposo, mentre dormivo. Non cambia se respiro o se mi muovo. Va al braccio sinistro e alla mandibola. Da 1 a 10… 8. Non passa da 40 minuti.',
    esordio: 'Verso le 2 e mezza.',
    patologie: 'Diabete, colesterolo alto. Fumo un pacchetto al giorno.',
    farmaci: 'Metformina e una statina.',
    allergie: 'Nessuna allergia.',
    pasto: 'Ho cenato verso le nove.',
    eventi: 'Mi sono svegliato con questo dolore. Pensavo fosse la digestione.',
    testimoni: '[Moglie] Si è svegliato con il dolore, era bianco come un lenzuolo.',
  },
  exam: {
    testaPiedi: 'Nessun trauma, nessun edema agli arti inferiori.',
    torace: 'Espansione simmetrica; nessuna dispnea evidente.',
    extra: { ecg: 'Tracciato trasmesso. La Centrale: «Sopraslivellamento del tratto ST in sede inferiore. Attiviamo l’emodinamica, inviamo l’MSA»', motilita: 'Normale.' },
  },
  protocol: { correct: ['dolore_toracico'], acceptable: ['bls_adulto'] },
  valutazione: { correct: ['I2', 'I3'] },
  reportKeys: ['pa', 'esordio'],
  msa: { available: true, eta: 480, label: 'L’MSA' },
  timeLimit: 1500,
  objectives: [
    {
      id: 'riposo',
      label: 'Paziente a riposo, seduto o semiseduto, mai a piedi',
      category: 'trattamento',
      points: 8,
      check: (s) => !s.penalties.some((p) => p.id === 'fatto_camminare') && (s.p.position === 'semiseduto' || s.p.position === 'seduto' || s.p.position === 'supino'),
      why: 'Lo sforzo aumenta il consumo di ossigeno del cuore ischemico.',
      sources: ['ERC_FA_2025'],
    },
    {
      id: 'parametri',
      label: 'SpO₂, frequenza e pressione rilevate entro 3 minuti',
      category: 'valutazione',
      points: 8,
      check: (s) => afterContact(s, 'saturimetro') <= 180 && afterContact(s, 'pressione') <= 180,
      why: 'I parametri servono alla Centrale per decidere risorse e destinazione.',
      sources: ['ERC_FA_2025'],
    },
    {
      id: 'no_o2',
      label: 'Ossigeno solo se SpO₂ < 90% (prima dell’arresto)',
      category: 'trattamento',
      points: 6,
      check: (s) => {
        const o = flagT(s, 'o2At');
        const a = s.arrest.startedAt;
        return o === null || (a !== null && o >= a);
      },
      why: 'Nella sindrome coronarica con SpO₂ normale l’ossigeno non serve e può essere dannoso.',
      sources: ['ESC_ACS_2023', 'ERC_FA_2025'],
    },
    {
      id: 'opqrst',
      label: 'Dolore caratterizzato (OPQRST) e ora di esordio',
      category: 'valutazione',
      points: 6,
      check: (s) => s.did('q_dolore') && s.did('q_esordio'),
      why: 'L’ora di esordio guida la strategia di riperfusione.',
      sources: ['ESC_ACS_2023'],
    },
    {
      id: 'ecg',
      label: 'ECG a 12 derivazioni trasmesso',
      category: 'valutazione',
      points: 8,
      check: (s) => s.did('ecg'),
      why: 'L’ECG precoce permette di attivare direttamente la sala di emodinamica.',
      sources: ['ESC_ACS_2023'],
    },
    {
      id: 'msa',
      label: 'Mezzo avanzato richiesto entro 5 minuti dal contatto',
      category: 'comunicazione',
      points: 6,
      check: (s) => s.requests.msa !== undefined && s.requests.msa - contact(s) <= 300,
      why: 'Il dolore toracico tipico richiede supporto avanzato e centralizzazione.',
      sources: ['ESC_ACS_2023'],
    },
    {
      id: 'dae_rapido',
      label: 'In arresto: piastre del DAE applicate entro 60 s',
      category: 'tempi',
      points: 12,
      critical: true,
      check: (s) => {
        const a = s.arrest.startedAt;
        if (a === null) return s.has('dae');
        const pads = flagT(s, 'padsAt');
        return pads !== null && pads - a <= 60;
      },
      why: 'Con il DAE già al paziente la defibrillazione può avvenire in meno di un minuto.',
      sources: ['ERC_BLS_2025'],
    },
    {
      id: 'shock',
      label: 'Shock erogato e compressioni riprese subito',
      category: 'trattamento',
      points: 8,
      check: (s) => (s.arrest.startedAt === null ? s.has('dae') : s.aed.shocks >= 1 && s.arrest.shockToCpr.every((d) => d <= 10)),
      why: 'Dopo lo shock si riprende la RCP immediatamente per 2 minuti.',
      sources: ['ERC_BLS_2025'],
    },
  ],
  teaching: [
    'Il paziente con dolore toracico non deve camminare: sedia portantina anche per poche rampe di scale.',
    'Ossigeno solo se la SpO₂ è sotto il 90%.',
    'Ora di esordio e caratteristiche del dolore sono informazioni decisive per la Centrale.',
    'Dove previsto, l’ECG a 12 derivazioni trasmesso attiva direttamente l’emodinamica.',
    'Nell’infarto acuto l’arresto può arrivare all’improvviso: DAE accanto al paziente, non nel mezzo.',
  ],
  sources: ['ESC_ACS_2023', 'ERC_FA_2025', 'ERC_BLS_2025'],
  hooks: {
    onStart: (s) => {
      s.set('ecgDisponibile', true);
      s.set('nonCamminare', 'Nel sospetto di sindrome coronarica il paziente non deve camminare: lo sforzo aumenta il danno al cuore e il rischio di aritmie.');
    },
    tick: (s) => {
      const c = contact(s);
      if (c > 1e8) return;
      // la fibrillazione ventricolare arriva circa 4 minuti dopo il contatto
      const trigger = c + 250;
      if (s.t === trigger && !s.inArrest() && !s.ended) {
        s.p.position = s.p.position === 'seduto' ? 'supino' : s.p.position;
        s.enterArrest('fv', 'Il paziente si irrigidisce, ha uno scatto e si accascia: non risponde più!');
        s.hint('Arresto cardiaco testimoniato: RCP e DAE subito.');
      }
    },
    outcome: (s) => {
      if (s.arrest.startedAt !== null && s.arrest.roscAt !== null && !s.inArrest())
        return { status: 'ottimo', title: 'Defibrillato in pochi secondi', text: 'Con il DAE già accanto al paziente lo shock è arrivato subito: Franco va in emodinamica con circolo spontaneo.' };
      if (s.inArrest()) return { status: 'critico', title: 'Arresto in corso', text: 'Il DAE non era pronto o lo shock è arrivato tardi.' };
      return { status: 'buono', title: 'Paziente centralizzato', text: 'Il paziente è stato affidato all’équipe avanzata e indirizzato all’emodinamica.' };
    },
  },
};
