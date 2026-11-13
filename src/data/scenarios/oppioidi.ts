import type { Scenario } from '../../engine/types';
import { afterContact, contact } from './helpers';

/** Sovradosaggio da oppioidi: ventilare e chiamare il mezzo avanzato. */
export const oppioidi: Scenario = {
  id: 'oppioidi',
  title: 'Parcheggio del palazzetto',
  subtitle: 'Uomo a terra accanto all’auto, respira appena',
  category: '118',
  difficulty: 2,
  minutes: 12,
  setting: 'parcheggio',
  timeOfDay: 'notte',
  role: 'msb',
  crew: 3,
  dispatch: {
    luogo: 'S',
    patologia: 'C7',
    criticita: 'R',
    address: 'Parcheggio del palazzetto dello sport, settore B',
    caller: 'Passante',
    time: '00:18',
    travel: 420,
    text: 'Uomo a terra accanto a un’auto, «non si sveglia e fa un rumore strano». Il passante ha visto una siringa.',
  },
  loadout: {
    essential: ['zaino', 'pallone', 'ossigeno'],
    recommended: ['aspiratore', 'dae', 'dpi_extra'],
    fetchTime: 90,
    note: 'Sospetta intossicazione con depressione respiratoria: pallone e ossigeno sono i presidi decisivi.',
  },
  scene: {
    intro: 'Parcheggio semibuio. Un uomo è supino tra due auto, con il respiro rumoroso e lentissimo. Vicino alla sua mano una siringa con l’ago scoperto.',
    hazards: [
      {
        id: 'siringa',
        label: 'Siringa con ago scoperto accanto al paziente',
        fixAction: 'siringa',
        consequence: 'Una puntura accidentale espone a HIV, epatite B e C.',
      },
    ],
    bystanders: 'Il passante che ha chiamato.',
  },
  patient: {
    name: 'Sconosciuto',
    age: 32,
    sex: 'M',
    weightKg: 66,
    avpu: 'P',
    gcs: 7,
    airway: 'russante',
    breathing: 'bradipnoico',
    rhythm: 'bradicardia',
    pulseRadial: true,
    v: { hr: 56, rr: 5, spo2: 78, sbp: 104, dbp: 64, glu: 96, temp: 35.6, crt: 3 },
    spo2Air: 78,
    skin: { color: 'cianotica', temp: 'fredda', sweaty: false },
    pupils: 'miotiche',
    speech: 'lamento',
    position: 'supino',
    canSwallow: false,
    seizing: false,
    vomitInMouth: false,
    look: { skinTone: '#d8b08e', hair: '#5a3e2b', hairStyle: 'corti', shirt: '#3d3d46', pants: '#2b3549', build: 'adulto', top: 'felpa', shoes: '#33363d' },
  },
  trauma: false,
  answers: {
    testimoni: '[Passante] L’ho trovato così, cinque minuti fa. C’era la siringa per terra, non l’ho toccata.',
    eventi: '[Passante] Non so niente, ero venuto a prendere la macchina.',
  },
  exam: { testaPiedi: 'Segni di punture recenti alla piega del gomito sinistro. Nessun trauma.', cavoOrale: 'Libero.' },
  protocol: { correct: ['oppioidi'], acceptable: ['intossicazione'] },
  valutazione: { correct: ['I3'] },
  reportKeys: ['fr', 'spo2', 'pupille'],
  msa: { available: true, eta: 480 },
  timeLimit: 1500,
  objectives: [
    {
      id: 'ventila',
      label: 'Ventilazione con pallone entro 60 s dal contatto',
      category: 'trattamento',
      points: 16,
      critical: true,
      check: (s) => afterContact(s, 'pallone') <= 60,
      why: 'Con 5 atti al minuto il problema è la ventilazione: l’ossigeno da solo non basta, serve il pallone.',
      sources: ['ERC_FA_2025'],
    },
    {
      id: 'o2',
      label: 'Pallone collegato all’ossigeno ad alti flussi',
      category: 'trattamento',
      points: 8,
      check: (s) => s.bvm && !!s.o2 && s.o2.flow >= 10,
      why: 'La ventilazione con ossigeno corregge rapidamente l’ipossiemia.',
      sources: ['ERC_FA_2025', 'BTS_O2_2017'],
    },
    {
      id: 'pupille',
      label: 'Pupille valutate (miosi)',
      category: 'valutazione',
      points: 6,
      check: (s) => s.did('pupille'),
      why: 'Respiro lento, sopore e pupille a punta di spillo orientano verso gli oppioidi.',
      sources: ['ERC_FA_2025'],
    },
    {
      id: 'glicemia',
      label: 'Glicemia controllata',
      category: 'valutazione',
      points: 6,
      check: (s) => s.did('glicemia'),
      why: 'In ogni alterazione della coscienza si esclude l’ipoglicemia.',
      sources: ['ERC_FA_2025'],
    },
    {
      id: 'msa',
      label: 'Mezzo avanzato richiesto entro 3 minuti (naloxone)',
      category: 'comunicazione',
      points: 8,
      check: (s) => s.requests.msa !== undefined && s.requests.msa - contact(s) <= 180,
      why: 'Il naloxone lo somministra il personale sanitario o chi è formato; fino ad allora si ventila.',
      sources: ['ERC_FA_2025'],
    },
  ],
  teaching: [
    'Respiro lento o assente, sopore estremo e pupille a punta di spillo: sospetta un sovradosaggio da oppioidi.',
    'Se il respiro è inefficace si ventila con pallone e ossigeno; se non respira normalmente si inizia la RCP.',
    'Il naloxone (se disponibile e se sei formato) antagonizza l’oppioide, ma il suo effetto può finire prima.',
    'Siringhe e aghi: guanti, contenitore rigido, mai reincappucciare.',
  ],
  sources: ['ERC_FA_2025', 'ERC_LAY_2025'],
  hooks: {
    tick: (s) => {
      const p = s.p;
      if (!s.bvm && !s.flags.naloxone) p.spo2Air = Math.max(45, p.spo2Air - 0.04);
      if (s.msaOnScene && !s.flags.naloxone) {
        s.set('naloxone', s.t);
        s.say('evento', 'L’infermiere dell’MSA somministra naloxone.');
      }
      const n = s.flags.naloxone === undefined ? null : Number(s.flags.naloxone);
      if (n !== null && s.t - n === 60) {
        p.avpu = 'A';
        p.speech = 'confuso';
        p.breathing = 'normale';
        p.airway = 'pervie';
        p.spo2Air = 95;
        s.base.rr = 14;
        s.base.hr = 92;
        s.bvm = false;
        s.say('paziente', 'L’uomo si sveglia di colpo, agitato: «Che volete? Lasciatemi andare!». Va convinto: l’effetto del naloxone può finire prima di quello dell’oppioide.');
      }
    },
  },
};
