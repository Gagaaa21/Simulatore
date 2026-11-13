import type { Scenario } from '../../engine/types';
import { afterContact, flagT } from './helpers';

/** Fuori servizio: arresto cardiaco al supermercato, con il DAE pubblico all'ingresso. */
export const acrSupermercato: Scenario = {
  id: 'acr-supermercato',
  title: 'Alla cassa 4',
  subtitle: 'Sei fuori servizio: un uomo crolla davanti a te al supermercato',
  category: 'fuori_servizio',
  difficulty: 1,
  minutes: 10,
  setting: 'supermercato',
  timeOfDay: 'giorno',
  role: 'laico',
  crew: 2,
  dispatch: {
    luogo: 'P',
    patologia: 'C9',
    criticita: 'R',
    address: 'Sacile, supermercato di quartiere, casse',
    caller: 'Tu',
    time: '17:40',
    travel: 0,
    text: 'Sei in fila alla cassa. L’uomo davanti a te si accascia di colpo sul pavimento. Hai solo il telefono; all’ingresso c’è un DAE pubblico.',
  },
  loadout: null,
  scene: {
    intro: 'Pavimento a piastrelle, carrelli, una cassiera che urla. L’uomo è a terra, supino, immobile. Attorno a te una decina di clienti.',
    hazards: [],
    bystanders: 'La cassiera e diversi clienti, disponibili ad aiutare.',
    publicAed: { fetchTime: 100, where: 'all’ingresso, accanto alle casse automatiche' },
  },
  patient: {
    name: 'Sconosciuto',
    age: 68,
    sex: 'M',
    weightKg: 82,
    avpu: 'U',
    gcs: 3,
    airway: 'pervie',
    breathing: 'agonico',
    rhythm: 'fv',
    pulseRadial: false,
    v: { hr: 0, rr: 0, spo2: 88, sbp: 0, dbp: 0, glu: 110, temp: 36.5, crt: 6 },
    spo2Air: 88,
    skin: { color: 'grigiastra', temp: 'normale', sweaty: false },
    pupils: 'midriatiche',
    speech: 'assente',
    position: 'supino',
    canSwallow: false,
    seizing: false,
    vomitInMouth: false,
    look: { skinTone: '#dcad8a', hair: '#bfc3c7', hairStyle: 'calvo', shirt: '#5b4a3a', pants: '#3a3a3f', build: 'adulto', top: 'giacca', shoes: '#3a2e25' },
  },
  trauma: false,
  arrest: { shockable: true, roscAfterShocks: 1 },
  answers: {
    testimoni: '[Cassiera] Stava pagando, ha detto che gli girava la testa ed è caduto. Non so chi sia.',
    eventi: '[Cassiera] È crollato adesso, davanti a tutti.',
  },
  exam: { testaPiedi: 'Nessun trauma evidente.' },
  protocol: { correct: ['bls_adulto'] },
  valutazione: { correct: ['I3'] },
  reportKeys: [],
  msa: { available: true, eta: 420, label: 'L’ambulanza del 118' },
  timeLimit: 1080,
  objectives: [
    {
      id: 'chiama',
      label: 'Chiamato il 112 in vivavoce subito, appena non risponde',
      category: 'comunicazione',
      points: 12,
      critical: true,
      check: (s) => afterContact(s, 'chiama_112') <= 25,
      why: 'Novità ERC 2025: per chiunque non risponda si chiama subito, senza aspettare di aver valutato il respiro; l’operatore ti guida.',
      sources: ['ERC_BLS_2025'],
    },
    {
      id: 'dae',
      label: 'Qualcuno mandato a prendere il DAE entro 30 s',
      category: 'tempi',
      points: 10,
      check: (s) => afterContact(s, 'manda_dae') <= 30,
      why: 'Se ci sono altri presenti, uno va subito a prendere il DAE mentre tu inizi la RCP.',
      sources: ['ERC_BLS_2025', 'ERC_LAY_2025'],
    },
    {
      id: 'rcp',
      label: 'Compressioni iniziate entro 15 s dal riconoscimento dell’arresto',
      category: 'tempi',
      points: 12,
      critical: true,
      check: (s) => {
        const r = flagT(s, 'arrestoRiconosciutoAt');
        const c = flagT(s, 'crewCprAt');
        return r !== null && c !== null && c - r <= 15;
      },
      why: 'Non risponde e non respira normalmente: compressioni subito, 100–120 al minuto, 5–6 cm.',
      sources: ['ERC_BLS_2025'],
    },
    {
      id: 'piastre',
      label: 'DAE acceso e collegato entro 30 s dall’arrivo',
      category: 'tempi',
      points: 10,
      check: (s) => {
        const a = flagT(s, 'daeArrivatoAt');
        const p = flagT(s, 'padsAt');
        return a !== null && p !== null && p - a <= 30;
      },
      why: 'Il DAE va usato appena arriva; chiunque può usarlo (Legge 116/2021).',
      sources: ['ERC_BLS_2025', 'L116_2021'],
    },
    {
      id: 'shock',
      label: 'Shock erogato e compressioni riprese subito',
      category: 'trattamento',
      points: 8,
      check: (s) => s.aed.shocks >= 1 && s.arrest.shockToCpr.every((d) => d <= 10),
      why: 'Segui le istruzioni del DAE e riprendi le compressioni subito dopo lo shock.',
      sources: ['ERC_BLS_2025'],
    },
    {
      id: 'cambio',
      label: 'Cambio alle compressioni con un presente',
      category: 'trattamento',
      points: 4,
      check: (s) => s.did('cambio_compressore'),
      why: 'Comprimere bene stanca in fretta: fatti dare il cambio ogni 2 minuti, istruendo chi ti aiuta.',
      sources: ['ERC_BLS_2025'],
    },
  ],
  teaching: [
    'ERC 2025: chiama il 112 per chiunque non risponda, poi valuta il respiro mentre l’operatore risponde, in vivavoce.',
    'Coinvolgi i presenti: uno va a prendere il DAE, un altro ti darà il cambio.',
    'Compressioni al centro del torace, 5–6 cm, 100–120/min. Se non te la senti di ventilare, compressioni continue.',
    'Il DAE può essere usato da chiunque: in Italia la Legge 116/2021 tutela chi interviene.',
    'Continua finché arriva l’ambulanza, finché il paziente dà chiari segni di vita o finché non sei esausto.',
  ],
  sources: ['ERC_BLS_2025', 'ERC_LAY_2025', 'L116_2021', 'CP_593'],
  hooks: {
    onStart: (s) => {
      s.arrest.startedAt = -10;
      s.cpr.ratio = '30:2';
    },
  },
};
