import type { Scenario } from '../../engine/types';
import { afterContact } from './helpers';

/** Riacutizzazione di BPCO: ossigeno titolato sul target 88–92%. */
export const bpco: Scenario = {
  id: 'bpco',
  title: 'Il fiato che manca',
  subtitle: 'Riacutizzazione di BPCO: quanto ossigeno è troppo?',
  category: '118',
  difficulty: 3,
  minutes: 14,
  setting: 'casa',
  timeOfDay: 'notte',
  role: 'msb',
  crew: 3,
  dispatch: {
    luogo: 'K',
    patologia: 'C3',
    criticita: 'G',
    address: 'Via Carducci 5, quarto piano senza ascensore',
    caller: 'Moglie del paziente',
    time: '04:35',
    travel: 540,
    text: 'Uomo di 76 anni con «bronchite cronica» che da due giorni respira sempre peggio, stanotte non riesce a stare sdraiato.',
  },
  loadout: {
    essential: ['zaino', 'ossigeno', 'sedia'],
    recommended: ['dae', 'pallone', 'aspiratore'],
    fetchTime: 150,
    note: 'Dispnea grave: ossigeno subito e sedia portantina, perché il paziente non deve fare le scale a piedi.',
  },
  scene: {
    room: 'camera',
    decor: ['inalatori'],
    intro: 'Camera da letto. Il paziente è seduto sul bordo del letto, le mani sulle ginocchia, spalle sollevate, labbra serrate. Sul comodino inalatori e un saturimetro da dito.',
    hazards: [],
    bystanders: 'La moglie.',
  },
  patient: {
    name: 'Renato',
    age: 76,
    sex: 'M',
    weightKg: 64,
    avpu: 'A',
    gcs: 15,
    airway: 'pervie',
    breathing: 'dispnoico',
    rhythm: 'tachicardia',
    pulseRadial: true,
    v: { hr: 112, rr: 30, spo2: 84, sbp: 152, dbp: 88, glu: 148, temp: 37.9, crt: 2 },
    spo2Air: 84,
    skin: { color: 'cianotica', temp: 'calda', sweaty: true },
    pupils: 'normali',
    speech: 'frasi_brevi',
    position: 'seduto',
    canSwallow: true,
    seizing: false,
    vomitInMouth: false,
    look: { skinTone: '#d9b293', hair: '#e4e4e8', hairStyle: 'calvo', shirt: '#6f7d64', pants: '#3a3a44', build: 'adulto', top: 'felpa', shoes: '#4a3b2f' },
  },
  trauma: false,
  answers: {
    sintomi: 'Non… respiro. Tosse… catarro giallo… da due giorni.',
    patologie: 'BPCO… ex fumatore. Due ricoveri… l’anno scorso.',
    farmaci: 'Gli spray… e l’ossigeno a casa… solo di notte, 1 litro.',
    allergie: 'Nessuna.',
    pasto: 'Ieri sera… poco.',
    eventi: '[Moglie] Da due giorni ha la febbre e tossisce. Stanotte non riesce a stare sdraiato.',
    testimoni: '[Moglie] Il pneumologo gli ha detto che la saturazione deve stare attorno a 90, non di più.',
  },
  exam: {
    testaPiedi: 'Torace a botte, uso dei muscoli accessori, labbra socchiuse. Nessun edema importante.',
    torace: 'Espansione ridotta e simmetrica, sibili e rumori umidi, espirazione prolungata.',
  },
  protocol: { correct: ['dispnea'] },
  valutazione: { correct: ['I2'], acceptable: ['I3'] },
  reportKeys: ['spo2', 'fr'],
  msa: { available: true, eta: 600 },
  timeLimit: 1800,
  objectives: [
    {
      id: 'satur',
      label: 'Saturimetro applicato entro 2 minuti dal contatto',
      category: 'valutazione',
      points: 8,
      check: (s) => afterContact(s, 'saturimetro') <= 120,
      why: 'L’ossigeno si titola sulla SpO₂: senza misurarla non si può scegliere né il presidio né il flusso.',
      sources: ['ERC_FA_2025', 'BTS_O2_2017'],
    },
    {
      id: 'o2',
      label: 'Ossigeno iniziato (SpO₂ < 88%)',
      category: 'trattamento',
      points: 8,
      check: (s) => s.flags.o2At !== undefined,
      why: 'Sotto l’88% l’ipossiemia è pericolosa anche nel BPCO: l’ossigeno va dato.',
      sources: ['ERC_FA_2025'],
    },
    {
      id: 'target',
      label: 'SpO₂ finale nel target 88–92%',
      category: 'trattamento',
      points: 14,
      critical: true,
      check: (s) => s.p.v.spo2 >= 87.5 && s.p.v.spo2 <= 92.5,
      why: 'Nei pazienti a rischio di ipercapnia il target è 88–92%: più ossigeno può far salire la CO₂ fino alla narcosi.',
      sources: ['ERC_FA_2025', 'BTS_O2_2017'],
    },
    {
      id: 'no_narcosi',
      label: 'Nessuna iperossigenazione prolungata',
      category: 'trattamento',
      points: 10,
      check: (s) => !s.flags.narcosi,
      why: 'SpO₂ alte e prolungate nel BPCO causano ritenzione di CO₂: sonnolenza, confusione, depressione respiratoria.',
      sources: ['BTS_O2_2017', 'ERC_FA_2025'],
    },
    {
      id: 'seduto',
      label: 'Paziente seduto e trasportato con la sedia portantina',
      category: 'trattamento',
      points: 6,
      check: (s) => s.transport?.mode === 'sedia' || (s.transport === null && s.p.position === 'seduto'),
      why: 'La posizione seduta facilita la respirazione; quattro piani di scale a piedi sono uno sforzo insostenibile.',
      sources: ['ERC_FA_2025'],
    },
    {
      id: 'spray',
      label: 'Aiutato a usare il proprio broncodilatatore',
      category: 'trattamento',
      points: 4,
      check: (s) => s.did('inalatore'),
      why: 'Il soccorritore può aiutare il paziente a usare il proprio inalatore.',
      sources: ['ERC_FA_2025'],
    },
  ],
  teaching: [
    'Nel BPCO a rischio di ipercapnia il target di SpO₂ è 88–92%, non 94–98%.',
    'Sotto l’88% si inizia con flussi adeguati e poi si titola verso il target.',
    'Occhialini a basso flusso permettono una titolazione fine.',
    'Sonnolenza e confusione dopo ossigeno ad alti flussi fanno pensare alla narcosi da CO₂.',
    'Seduto, niente scale a piedi, e aiuto con il proprio inalatore.',
  ],
  sources: ['ERC_FA_2025', 'BTS_O2_2017'],
  hooks: {
    onStart: (s) => {
      s.set('haInalatore', true);
      s.set('nonCamminare', 'Con una dispnea così grave quattro piani di scale a piedi possono portare all’esaurimento respiratorio.');
    },
    tick: (s) => {
      const p = s.p;
      const co2 = Number(s.flags.co2 ?? 0);
      const next = s.o2 && p.v.spo2 > 92.5 ? co2 + 1 : Math.max(0, co2 - 0.6);
      s.set('co2', next);
      if (next > 240 && p.avpu === 'A') {
        p.avpu = 'V';
        p.speech = 'confuso';
        s.base.rr = 14;
        s.set('narcosi', s.t);
        s.say('paziente', 'Renato si fa sonnolento e confuso, il respiro rallenta: segni di ritenzione di CO₂.');
      }
      if (next > 420 && p.avpu === 'V') {
        p.avpu = 'P';
        p.breathing = 'superficiale';
        s.base.rr = 9;
        s.say('paziente', 'Ora risponde solo al dolore e respira superficialmente.');
      }
      if (next < 100 && s.flags.narcosi && p.avpu !== 'A') {
        p.avpu = 'A';
        p.breathing = 'dispnoico';
        p.speech = 'frasi_brevi';
        s.base.rr = 26;
        s.say('paziente', 'Con meno ossigeno Renato torna più vigile.');
      }
      if (s.did('inalatore') && !s.flags.sprayEffetto) {
        s.set('sprayEffetto', true);
        p.spo2Air = Math.min(87, p.spo2Air + 2);
        s.base.rr = Math.max(24, s.base.rr - 4);
      }
    },
  },
};
