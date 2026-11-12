import type { Scenario } from '../../engine/types';
import { before, flagT } from './helpers';

/** Annegamento in un ragazzo: arresto ipossico, 5 ventilazioni iniziali. */
export const annegamento: Scenario = {
  id: 'annegamento',
  title: 'Dal pontile',
  subtitle: 'Ragazzo recuperato dal lago dal bagnino: non risponde e non respira',
  category: '118',
  difficulty: 2,
  minutes: 12,
  setting: 'lago',
  timeOfDay: 'giorno',
  role: 'msb',
  crew: 3,
  dispatch: {
    luogo: 'Z',
    patologia: 'C3',
    criticita: 'R',
    address: 'Spiaggia libera del lago, accesso dal parcheggio nord',
    caller: 'Bagnino',
    time: '16:05',
    travel: 360,
    text: 'Ragazzo di 15 anni andato sott’acqua al largo del pontile. Il bagnino lo sta portando a riva, «non si muove».',
    extra: 'Centrale: «Inviata anche l’automedica, arrivo stimato 9 minuti».',
  },
  loadout: {
    essential: ['zaino', 'pallone', 'ossigeno', 'aspiratore', 'dae'],
    recommended: [],
    fetchTime: 120,
    note: 'Annegamento: arresto ipossico. Ventilare è essenziale (pallone e ossigeno), il vomito è frequente (aspiratore), il DAE va comunque applicato.',
  },
  scene: {
    intro: 'Spiaggia di sabbia. Il bagnino sta trascinando il ragazzo verso riva nell’acqua bassa, a una decina di metri da voi. Gli amici gridano dalla battigia.',
    hazards: [
      {
        id: 'acqua',
        label: 'Il ragazzo è ancora in acqua: il recupero spetta al bagnino',
        fixAction: 'messa_sicurezza_acqua',
        consequence: 'Entrare in acqua senza formazione e attrezzatura specifica mette a rischio il soccorritore.',
      },
    ],
    bystanders: 'Il bagnino e tre amici del ragazzo.',
  },
  patient: {
    name: 'Matteo',
    age: 15,
    sex: 'M',
    weightKg: 58,
    avpu: 'U',
    gcs: 3,
    airway: 'pervie',
    breathing: 'assente',
    rhythm: 'asistolia',
    pulseRadial: false,
    v: { hr: 0, rr: 0, spo2: 40, sbp: 0, dbp: 0, glu: 96, temp: 35.1, crt: 6 },
    spo2Air: 40,
    skin: { color: 'cianotica', temp: 'fredda', sweaty: false },
    pupils: 'midriatiche',
    speech: 'assente',
    position: 'supino',
    canSwallow: false,
    seizing: false,
    vomitInMouth: false,
    look: { skinTone: '#e9c09c', hair: '#3b2a1c', hairStyle: 'corti', shirt: '#e9c09c', pants: '#1d6fb0', build: 'adolescente' },
  },
  trauma: false,
  arrest: { shockable: false, roscAfterCprSeconds: 100, needsVentilation: true },
  answers: {
    testimoni: '[Amico] Si è tuffato dal pontile, è riemerso, poi è andato giù e non l’abbiamo più visto. Sarà stato sott’acqua tre o quattro minuti. Non ha battuto la testa, si è buttato di piedi.',
    eventi: '[Bagnino] L’ho preso sul fondo a due metri. In acqua non respirava.',
    patologie: '[Amico] Niente, nuota benissimo.',
    farmaci: '[Amico] Niente.',
    allergie: '[Amico] No.',
    pasto: '[Amico] Ha mangiato due panini un’ora fa.',
  },
  exam: { testaPiedi: 'Nessun trauma: tuffo di piedi, nessuna ferita al capo. Cute fredda e bagnata.', cavoOrale: 'Un po’ di schiuma e acqua.' },
  protocol: { correct: ['annegamento'], acceptable: ['bls_adulto', 'pbls'] },
  valutazione: { correct: ['I3'] },
  reportKeys: [],
  msa: { available: true, eta: 540, autoDispatched: true, label: 'L’automedica' },
  timeLimit: 1500,
  objectives: [
    {
      id: 'ventilazioni',
      label: '5 ventilazioni iniziali prima delle compressioni',
      category: 'trattamento',
      points: 14,
      critical: true,
      check: (s) => before(s, 'ventilazioni_iniziali', 'rcp'),
      why: 'Nell’annegamento l’arresto è causato dall’ipossia: si inizia con 5 ventilazioni.',
      sources: ['ERC_FA_2025', 'ERC_LAY_2025'],
    },
    {
      id: 'pallone',
      label: 'RCP con ventilazioni efficaci (pallone e ossigeno)',
      category: 'trattamento',
      points: 10,
      check: (s) => s.cpr.ventilation === 'pallone' && !!s.o2,
      why: 'Senza ventilazioni efficaci il circolo non riparte: pallone e ossigeno ad alti flussi.',
      sources: ['ERC_BLS_2025', 'ERC_FA_2025'],
    },
    {
      id: 'dae',
      label: 'DAE applicato dopo aver asciugato il torace',
      category: 'trattamento',
      points: 8,
      check: (s) => s.aed.pads !== null && s.aed.pads !== 'errata',
      why: 'Il DAE va sempre applicato; il torace va asciugato perché le piastre aderiscano.',
      sources: ['ERC_FA_2025'],
    },
    {
      id: 'vomito',
      label: 'Vomito gestito (aspirazione o posizione laterale)',
      category: 'trattamento',
      points: 8,
      check: (s) => {
        const v = flagT(s, 'vomitoAt');
        return v !== null && (s.didAny('aspira') || s.flags.pos_laterale !== undefined);
      },
      why: 'Nell’annegamento il vomito è frequente: va rimosso per non essere inalato.',
      sources: ['ERC_FA_2025'],
    },
    {
      id: 'ipotermia',
      label: 'Indumenti bagnati via e telo isotermico',
      category: 'trattamento',
      points: 6,
      check: (s) => s.covered,
      why: 'L’annegato è spesso ipotermico: protezione termica dopo la ripresa del circolo.',
      sources: ['ERC_FA_2025'],
    },
  ],
  teaching: [
    'Il recupero in acqua spetta a chi è formato e attrezzato: il soccorritore sanitario aspetta a riva.',
    'L’arresto da annegamento è ipossico: 5 ventilazioni iniziali, poi RCP 30:2.',
    'Il DAE va comunque applicato, dopo aver asciugato il torace.',
    'Vomito frequente: aspiratore pronto e, dopo la ripresa del circolo, posizione laterale se non ci sono traumi.',
    'Togli gli indumenti bagnati e copri.',
  ],
  sources: ['ERC_FA_2025', 'ERC_BLS_2025', 'ERC_LAY_2025'],
  hooks: {
    onStart: (s) => {
      s.arrest.startedAt = -200;
      s.arrest.noFlow = 120;
    },
    tick: (s) => {
      const p = s.p;
      if (s.did('ventilazioni_iniziali') && s.inArrest()) p.spo2Air = Math.max(p.spo2Air, 55);
      const r = s.arrest.roscAt;
      if (r !== null && s.t - r === 25 && !s.flags.vomitoAt) {
        p.vomitInMouth = true;
        p.airway = 'gorgogliante';
        s.set('vomitoAt', s.t);
        s.say('paziente', 'Matteo vomita acqua e cibo: gorgoglio in gola!');
      }
      if (r !== null && s.t - r === 200 && p.avpu === 'U') {
        p.avpu = 'P';
        s.say('paziente', 'Matteo geme e si muove allo stimolo.');
      }
    },
    onAction: (s, id) => {
      if (id === 'ventilazioni_iniziali' && s.inArrest() && s.arrest.recognizedAt === null) {
        s.arrest.recognizedAt = s.t;
        s.set('arrestoRiconosciutoAt', s.t);
      }
      return false;
    },
    outcome: (s) => {
      if (s.arrest.roscAt !== null && !s.inArrest())
        return { status: 'ottimo', title: 'Il circolo riparte', text: 'Grazie alle ventilazioni precoci Matteo ha ripreso il circolo e respira; arriva in rianimazione ipotermico ma con un buon recupero atteso.' };
      return { status: 'critico', title: 'Arresto ipossico in corso', text: 'Senza ventilazioni efficaci il cuore non riparte.' };
    },
  },
};
