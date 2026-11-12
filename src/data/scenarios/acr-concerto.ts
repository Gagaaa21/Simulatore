import type { Scenario } from '../../engine/types';
import { afterContact, flagT } from './helpers';

/** Arresto cardiaco in un giovane durante un concerto: respiro quasi normale e scatti iniziali (novità ERC 2025). */
export const acrConcerto: Scenario = {
  id: 'acr-concerto',
  title: 'Ballava fino a un attimo fa',
  subtitle: 'Crollo nel pogo: sembra una crisi, ma è un arresto cardiaco',
  category: 'eventi',
  difficulty: 2,
  minutes: 10,
  setting: 'concerto',
  timeOfDay: 'notte',
  role: 'squadra',
  crew: 2,
  dispatch: {
    luogo: 'Y',
    patologia: 'C9',
    criticita: 'R',
    address: 'Parterre centrale, sotto la torre delle luci',
    caller: 'Security via radio',
    time: '23:21',
    travel: 60,
    text: 'Ragazzo crollato a terra nel pogo, «ha avuto delle convulsioni», ora non si muove ma «respira forte».',
    extra: 'Coordinamento sanitario: «Inviamo l’MSA del servizio dal PMA, arrivo stimato 6 minuti».',
  },
  loadout: {
    essential: ['zaino', 'dae'],
    recommended: ['pallone', 'ossigeno'],
    fetchTime: 90,
    note: 'Una squadra a piedi porta sempre il DAE: nei grandi eventi è il presidio che fa la differenza.',
  },
  scene: {
    intro: 'Parterre affollato, musica a tutto volume. Un ragazzo è supino, gli occhi semiaperti; gli amici gli hanno sollevato la testa. Respira in modo rumoroso e affannoso.',
    hazards: [
      {
        id: 'pogo',
        label: 'Pogo ancora in corso attorno al ragazzo: rischio di essere travolti',
        fixAction: 'apri_spazio',
        consequence: 'In mezzo al pogo la squadra e il paziente rischiano di essere calpestati.',
      },
    ],
    bystanders: 'Gli amici: «Ha avuto le convulsioni, mettiamolo di lato!».',
  },
  patient: {
    name: 'Kevin',
    age: 23,
    sex: 'M',
    weightKg: 74,
    avpu: 'U',
    gcs: 3,
    airway: 'pervie',
    breathing: 'agonico',
    rhythm: 'fv',
    pulseRadial: false,
    v: { hr: 0, rr: 0, spo2: 85, sbp: 0, dbp: 0, glu: 98, temp: 37.4, crt: 6 },
    spo2Air: 85,
    skin: { color: 'grigiastra', temp: 'normale', sweaty: true },
    pupils: 'midriatiche',
    speech: 'assente',
    position: 'supino',
    canSwallow: false,
    seizing: false,
    vomitInMouth: false,
    look: { skinTone: '#c98f66', hair: '#141414', hairStyle: 'corti', shirt: '#7a1f2a', pants: '#1e2433', build: 'adulto', wristband: '#3fe0ff' },
  },
  trauma: false,
  arrest: { shockable: true, roscAfterShocks: 1 },
  answers: {
    testimoni: '[Amico] Stava pogando, si è fermato, è crollato e ha fatto due o tre scatti con braccia e gambe. Adesso respira forte… è una crisi epilettica, vero?',
    eventi: '[Amico] Un minuto fa, è crollato all’improvviso, nessuno l’ha colpito.',
    patologie: '[Amico] Gioca a calcio, mai avuto niente. Una volta è svenuto in palestra.',
    farmaci: '[Amico] Niente.',
    allergie: '[Amico] No.',
    pasto: '[Amico] Ha bevuto due birre.',
  },
  exam: { testaPiedi: 'Nessun trauma. Cute grigiastra.', cavoOrale: 'Cavo orale libero.' },
  protocol: { correct: ['bls_adulto'] },
  valutazione: { correct: ['I3'] },
  reportKeys: [],
  msa: { available: true, eta: 360, autoDispatched: true, label: 'L’MSA del servizio' },
  timeLimit: 1200,
  objectives: [
    {
      id: 'riconosci',
      label: 'Arresto riconosciuto nonostante il «respiro» e gli scatti iniziali',
      category: 'valutazione',
      points: 14,
      critical: true,
      check: (s) => afterContact(s, 'gas') <= 30 && !s.penalties.some((p) => p.id === 'pls_arresto'),
      why: 'ERC 2025: all’esordio dell’arresto possono esserci brevi movimenti simil-convulsivi e, negli sportivi, un respiro quasi normale o affannoso. Non risponde e non respira normalmente = arresto.',
      sources: ['ERC_BLS_2025', 'ERC_LAY_2025'],
    },
    {
      id: 'rcp',
      label: 'Compressioni iniziate entro 15 s dal riconoscimento',
      category: 'tempi',
      points: 12,
      critical: true,
      check: (s) => {
        const r = flagT(s, 'arrestoRiconosciutoAt');
        const c = flagT(s, 'crewCprAt');
        return r !== null && c !== null && c - r <= 15;
      },
      why: 'Ogni secondo senza compressioni riduce la perfusione cerebrale.',
      sources: ['ERC_BLS_2025'],
    },
    {
      id: 'shock',
      label: 'Primo shock entro 2 minuti dal contatto',
      category: 'tempi',
      points: 14,
      critical: true,
      check: (s) => s.aed.lastShockAt !== null && s.aed.shocks >= 1 && afterContact(s, 'dae_accendi') <= 60 && (flagT(s, 'padsAt') ?? 1e9) - (flagT(s, 'contattoAt') ?? 0) <= 100,
      why: 'In fibrillazione ventricolare ogni minuto di ritardo nella defibrillazione riduce la sopravvivenza di circa il 10%.',
      sources: ['ERC_BLS_2025', 'ERC_LAY_2025'],
    },
    {
      id: 'ripresa',
      label: 'Compressioni riprese subito dopo lo shock',
      category: 'trattamento',
      points: 8,
      check: (s) => s.arrest.shockToCpr.length > 0 && s.arrest.shockToCpr.every((d) => d <= 10),
      why: 'Dopo lo shock si riprende la RCP senza ricontrollare il polso.',
      sources: ['ERC_BLS_2025'],
    },
  ],
  teaching: [
    'Novità ERC 2025: nei primi istanti dell’arresto lo sportivo può avere un respiro quasi normale o affannoso, e brevi scatti simil-convulsivi.',
    'Se non risponde e non respira normalmente: arresto cardiaco, anche se gli amici parlano di crisi epilettica.',
    'Nessuna posizione laterale in chi non respira normalmente: RCP subito.',
    'Ai grandi eventi la squadra porta sempre il DAE: lo shock nei primi minuti salva la vita.',
  ],
  sources: ['ERC_BLS_2025', 'ERC_LAY_2025', 'ACCORDO_EVENTI_2014'],
  hooks: {
    onStart: (s) => {
      s.arrest.startedAt = -60;
      s.arrest.noFlow = 60;
    },
    onAction: (s, id) => {
      if (id === 'gas' && s.inArrest() && s.t - (s.arrest.startedAt ?? 0) < 150 && s.p.breathing === 'agonico') {
        s.find('Respiro affannoso, rumoroso, irregolare: sembra quasi un respiro, ma è inefficace (gasping). Non è un respiro normale.');
        if (s.arrest.recognizedAt === null) {
          s.arrest.recognizedAt = s.t;
          s.set('arrestoRiconosciutoAt', s.t);
          s.hint('Non risponde e non respira normalmente: arresto cardiaco. Compressioni e DAE.');
        }
        return true;
      }
      return false;
    },
    outcome: (s) => {
      if (s.arrest.roscAt !== null && !s.inArrest())
        return { status: 'ottimo', title: 'ROSC al primo shock', text: 'Kevin riprende il circolo dopo il primo shock. In ospedale troveranno una cardiomiopatia mai diagnosticata.' };
      return { status: 'critico', title: 'Arresto in corso', text: 'La defibrillazione è arrivata tardi o non è arrivata.' };
    },
  },
};
