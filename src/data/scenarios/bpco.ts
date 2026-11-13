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
  crew: 2,
  dispatch: {
    luogo: 'K',
    patologia: 'C3',
    criticita: 'G',
    address: 'Pordenone, via Carducci 5, quarto piano senza ascensore',
    extra: 'SORES: «ALS impegnata su un altro intervento: inviamo la vostra BLS. Riferite la saturazione appena la avete».',
    caller: 'Moglie del paziente',
    time: '04:35',
    travel: 540,
    text: 'Uomo di 76 anni con «bronchite cronica» che da due giorni respira sempre peggio, stanotte non riesce a stare sdraiato.',
  },
  loadout: {
    essential: ['zaino', 'ossigeno', 'sedia'],
    recommended: ['dae', 'pallone', 'aspiratore'],
    fetchTime: 150,
    note: 'Dispnea grave: bombola con maschere (anche Venturi) e sedia portantina, perché il paziente non deve fare le scale a piedi.',
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
  msa: { available: true, eta: 600, label: 'L’ALS' },
  oxygen: { copd: true },
  timeLimit: 1800,
  objectives: [
    {
      id: 'satur',
      label: 'Saturimetro applicato entro 2 minuti dal contatto',
      category: 'valutazione',
      points: 8,
      check: (s) => afterContact(s, 'saturimetro') <= 120,
      why: 'Senza la saturazione la SORES non può indicarti presidio e concentrazione dell’ossigeno.',
      sources: ['BTS_O2_2017', 'SORES_FVG'],
    },
    {
      id: 'o2',
      label: 'Saturazione e BPCO riferite alla SORES; ossigeno come indicato',
      category: 'trattamento',
      points: 10,
      check: (s) => s.o2Order?.device === 'venturi' && s.o2?.device === 'venturi' && s.o2.fio2 === s.o2Order.fio2,
      why: 'Sotto l’88% l’ipossiemia va corretta anche nel BPCO, ma a concentrazione controllata: la SORES indica di norma la maschera Venturi al 24–28%.',
      sources: ['BTS_O2_2017', 'SORES_FVG'],
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
      id: 'consegna',
      label: 'Consegne all’infermiere dell’ALS',
      category: 'comunicazione',
      points: 4,
      check: (s) => s.ended?.reason === 'Consegna al mezzo avanzato' || s.ended?.reason === 'Trasporto in ospedale',
      why: 'Lo spray e l’aerosol del paziente li gestisce l’infermiere: tu passi orari, saturazioni e ossigeno in corso.',
      sources: ['SORES_FVG'],
    },
  ],
  teaching: [
    'Nel BPCO a rischio di ipercapnia il target di SpO₂ è 88–92%, non 94–98%.',
    'Riferisci alla SORES saturazione e BPCO: la SORES indica presidio e concentrazione, spesso la maschera Venturi al 24–28%.',
    'Ricontrolla e riferisci di nuovo: se la saturazione supera il 92% la SORES riduce la concentrazione.',
    'Sonnolenza e confusione dopo ossigeno ad alti flussi fanno pensare alla narcosi da CO₂.',
    'Seduto, niente scale a piedi. Lo spray del paziente non lo somministra il soccorritore.',
  ],
  sources: ['ERC_FA_2025', 'BTS_O2_2017', 'SORES_FVG'],
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
    },
    onAdvanced: (s) => {
      s.say('evento', 'L’infermiere dell’ALS somministra il broncodilatatore per aerosol e valuta il paziente.');
      s.p.spo2Air = Math.min(87, s.p.spo2Air + 2);
      s.base.rr = Math.max(24, s.base.rr - 4);
    },
  },
};
