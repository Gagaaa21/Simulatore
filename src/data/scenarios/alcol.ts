import type { Scenario } from '../../engine/types';
import { afterContact, contact } from './helpers';

/** Intossicazione alcolica in una minorenne, con vomito, ipoglicemia e ipotermia. */
export const alcol: Scenario = {
  id: 'alcol',
  title: 'L’ultima vodka',
  subtitle: 'Sedicenne incosciente dietro i bagni chimici di un concerto',
  category: 'eventi',
  difficulty: 2,
  minutes: 12,
  setting: 'concerto',
  timeOfDay: 'notte',
  role: 'squadra',
  crew: 2,
  dispatch: {
    luogo: 'Z',
    patologia: 'C7',
    criticita: 'G',
    address: 'Area concerti, dietro i bagni chimici del settore C',
    caller: 'Amiche della ragazza',
    time: '01:12',
    travel: 150,
    text: 'Ragazza giovanissima che «non si sveglia», ha bevuto molto. Le amiche l’hanno trovata sdraiata sull’erba.',
  },
  loadout: {
    essential: ['zaino', 'aspiratore'],
    recommended: ['ossigeno', 'dae', 'pallone'],
    fetchTime: 120,
    note: 'Coscienza ridotta da alcol: il rischio principale sono le vie aeree (vomito), quindi aspiratore sempre.',
  },
  scene: {
    intro: 'Dietro i bagni chimici, al buio. Una ragazza è supina sull’erba umida, in maglietta, accanto a una pozza di vomito. Le amiche la chiamano senza risposta.',
    hazards: [],
    bystanders: 'Due amiche, spaventate e anche loro alticce.',
  },
  patient: {
    name: 'Sofia',
    age: 16,
    sex: 'F',
    weightKg: 52,
    avpu: 'P',
    gcs: 8,
    airway: 'russante',
    breathing: 'bradipnoico',
    rhythm: 'sinusale',
    pulseRadial: true,
    v: { hr: 64, rr: 10, spo2: 91, sbp: 98, dbp: 58, glu: 56, temp: 35.3, crt: 3 },
    skin: { color: 'pallida', temp: 'fredda', sweaty: false },
    pupils: 'normali',
    speech: 'lamento',
    position: 'supino',
    canSwallow: false,
    seizing: false,
    vomitInMouth: true,
    look: { skinTone: '#f0c7a7', hair: '#c49a62', hairStyle: 'lunghi', shirt: '#e8e8ee', pants: '#2a2e45', build: 'adolescente', top: 'tshirt', bottom: 'gonna', shoes: '#c94f7c' },
  },
  trauma: false,
  answers: {
    testimoni: '[Amica] Ha bevuto un sacco di shot di vodka, tipo otto o dieci, in un’ora. Poi è venuta qui a vomitare e l’abbiamo persa di vista. Non è caduta, si è sdraiata lei.',
    eventi: '[Amica] Si è sdraiata qui mezz’ora fa, pensavamo dormisse.',
    farmaci: '[Amica] Niente, che io sappia. Droghe no, giuro.',
    allergie: '[Amica] Non lo so.',
    patologie: '[Amica] Niente.',
    pasto: '[Amica] Non ha cenato.',
  },
  exam: {
    testaPiedi: 'Nessun trauma cranico né altre lesioni. Cute fredda e umida di rugiada, indumenti leggeri.',
    cavoOrale: 'Residui di vomito nel cavo orale.',
  },
  protocol: { correct: ['intossicazione'], acceptable: ['ipoglicemia', 'abcde'] },
  valutazione: { correct: ['I3'], acceptable: ['I2'] },
  reportKeys: ['avpu', 'glicemia', 'spo2'],
  msa: { available: true, eta: 420, label: 'L’MSA del servizio' },
  timeLimit: 1500,
  objectives: [
    {
      id: 'vie_aeree',
      label: 'Vie aeree liberate (aspirazione o posizione laterale) entro 60 s dal contatto',
      category: 'trattamento',
      points: 12,
      critical: true,
      check: (s) => afterContact(s, 'aspira', 'posizione') <= 60,
      why: 'Coscienza ridotta + vomito in bocca = rischio di inalazione: le vie aeree vengono prima di tutto.',
      sources: ['ERC_FA_2025'],
    },
    {
      id: 'pls',
      label: 'Posizione laterale di sicurezza',
      category: 'trattamento',
      points: 10,
      check: (s) => s.flags.pos_laterale !== undefined,
      why: 'Coscienza ridotta, respiro presente, nessun trauma: posizione laterale.',
      sources: ['ERC_FA_2025'],
    },
    {
      id: 'glicemia',
      label: 'Glicemia misurata',
      category: 'valutazione',
      points: 10,
      critical: true,
      check: (s) => s.did('glicemia'),
      why: 'L’alcol può provocare ipoglicemia, soprattutto nei giovani che non hanno mangiato.',
      sources: ['ERC_FA_2025'],
    },
    {
      id: 'ipotermia',
      label: 'Telo isotermico',
      category: 'trattamento',
      points: 6,
      check: (s) => s.covered,
      why: 'L’alcol favorisce la dispersione di calore: di notte sull’erba bagnata l’ipotermia arriva in fretta.',
      sources: ['ERC_FA_2025'],
    },
    {
      id: 'ossigeno',
      label: 'SpO₂ riportata tra 94 e 98%',
      category: 'trattamento',
      points: 6,
      check: (s) => s.pulseOx && s.p.v.spo2 >= 94,
      why: 'Target 94–98% nel paziente non a rischio di ipercapnia.',
      sources: ['ERC_FA_2025', 'BTS_O2_2017'],
    },
    {
      id: 'avanzato',
      label: 'Mezzo avanzato richiesto (coma e ipoglicemia: serve glucosio in vena)',
      category: 'comunicazione',
      points: 8,
      check: (s) => s.requests.msa !== undefined && s.requests.msa - contact(s) <= 480,
      why: 'Una paziente che non deglutisce non può ricevere zucchero per bocca: lo darà il personale sanitario per via venosa.',
      sources: ['ERC_FA_2025'],
    },
  ],
  teaching: [
    'Nel paziente intossicato il pericolo immediato sono le vie aeree: vomito e inalazione.',
    'Aspira il cavo orale e metti in posizione laterale se respira e non ci sono traumi.',
    'Misura sempre la glicemia: l’alcol nei giovani a digiuno causa ipoglicemia.',
    'Nulla per bocca a chi non è sveglio, nemmeno lo zucchero; niente cannula orofaringea se reagisce al dolore.',
    'Copri: alcol e notte all’aperto portano all’ipotermia. E non lasciarla mai sola con gli amici.',
  ],
  sources: ['ERC_FA_2025', 'BTS_O2_2017'],
  hooks: {
    tick: (s) => {
      const p = s.p;
      const c = contact(s);
      if (!s.covered) s.base.temp = Math.max(34.2, s.base.temp - 0.0008);
      // nuovo episodio di vomito se rimane supina
      if (c < 1e8 && (s.t - c) % 150 === 0 && s.t > c && p.position === 'supino' && !p.vomitInMouth) {
        p.vomitInMouth = true;
        p.airway = 'gorgogliante';
        s.say('paziente', 'Sofia ha un conato e vomita di nuovo: gorgoglio in gola.');
      }
      if (!p.vomitInMouth && p.airway === 'gorgogliante') p.airway = p.position === 'laterale' ? 'pervie' : 'russante';
      // l'MSA somministra glucosio
      if (s.msaOnScene && !s.flags.glucosio) {
        s.set('glucosio', s.t);
        s.say('evento', 'L’infermiere dell’MSA posiziona un accesso venoso e somministra glucosio.');
      }
      if (s.flags.glucosio) s.base.glu = Math.min(100, s.base.glu + 0.08);
      if (s.flags.glucosio && s.base.glu > 80 && p.avpu === 'P') {
        p.avpu = 'V';
        s.say('paziente', 'Sofia apre gli occhi alla voce e borbotta qualcosa.');
      }
    },
  },
};
