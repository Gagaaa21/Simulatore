import type { Scenario } from '../../engine/types';
import { before, flagT } from './helpers';

/** Arresto ipossico in un lattante con bronchiolite: PBLSD secondo ERC 2025. */
export const pblsLattante: Scenario = {
  id: 'pbls-lattante',
  title: 'Il respiro di Sara',
  subtitle: 'Lattante di 8 mesi con bronchiolite: «è diventata blu e non risponde»',
  category: '118',
  difficulty: 3,
  minutes: 12,
  setting: 'casa',
  timeOfDay: 'notte',
  role: 'msb',
  crew: 3,
  dispatch: {
    luogo: 'K',
    patologia: 'C3',
    criticita: 'R',
    address: 'Via San Francesco 27, primo piano',
    caller: 'Padre',
    time: '02:47',
    travel: 360,
    text: 'Lattante di 8 mesi con bronchiolite da tre giorni. Stanotte respirava sempre peggio, ora è «molle e blu». L’operatore ha guidato il padre nelle ventilazioni e nelle compressioni.',
    extra: 'Centrale: «Inviata anche l’automedica pediatrica, arrivo stimato 10 minuti».',
  },
  loadout: {
    essential: ['zaino', 'pallone', 'ossigeno', 'aspiratore', 'dae'],
    recommended: [],
    fetchTime: 90,
    note: 'Codice rosso respiratorio pediatrico: pallone e maschere pediatriche, ossigeno, aspiratore e DAE con piastre o chiave pediatrica.',
  },
  scene: {
    intro: 'Camera dei genitori, luce accesa. La bambina è sul fasciatoio rigido; il padre le preme il torace con due dita e piange. La madre tiene il telefono in vivavoce.',
    hazards: [],
    bystanders: 'Entrambi i genitori.',
  },
  patient: {
    name: 'Sara',
    age: 0.67,
    sex: 'F',
    weightKg: 8,
    avpu: 'U',
    gcs: 3,
    airway: 'gorgogliante',
    breathing: 'agonico',
    rhythm: 'aesp',
    pulseRadial: false,
    v: { hr: 0, rr: 0, spo2: 45, sbp: 0, dbp: 0, glu: 88, temp: 38.2, crt: 6 },
    spo2Air: 45,
    skin: { color: 'cianotica', temp: 'calda', sweaty: false },
    pupils: 'midriatiche',
    speech: 'assente',
    position: 'supino',
    canSwallow: false,
    seizing: false,
    vomitInMouth: false,
    look: { skinTone: '#f2cdb0', hair: '#3a2c22', hairStyle: 'bimbo', shirt: '#f4c6d9', pants: '#f4c6d9', build: 'neonato', top: 'body' },
  },
  trauma: false,
  arrest: { shockable: false, roscAfterCprSeconds: 75, needsVentilation: true },
  answers: {
    testimoni: '[Padre] Da tre giorni ha la bronchiolite, il pediatra ci ha detto di controllare il respiro. Stanotte faceva fatica, poi è diventata blu e molle. Sarà successo cinque minuti fa.',
    eventi: '[Padre] Respirava velocissimo, poi sempre più piano… poi più niente.',
    patologie: '[Madre] Nata a termine, sempre stata bene fino a questa bronchiolite.',
    farmaci: '[Madre] Solo il paracetamolo per la febbre e i lavaggi nasali.',
    allergie: '[Madre] Nessuna.',
    pasto: '[Madre] Ha preso poco latte, alle undici.',
  },
  exam: {
    testaPiedi: 'Nessun trauma. Cianosi diffusa, rientramenti al giugulo e tra le coste.',
    cavoOrale: 'Muco denso nel naso e in bocca.',
  },
  protocol: { correct: ['pbls'] },
  valutazione: { correct: ['I3'] },
  reportKeys: [],
  msa: { available: true, eta: 600, autoDispatched: true, label: 'L’automedica pediatrica' },
  timeLimit: 1500,
  objectives: [
    {
      id: 'ventilazioni',
      label: '5 ventilazioni iniziali prima delle compressioni',
      category: 'trattamento',
      points: 14,
      critical: true,
      check: (s) => before(s, 'ventilazioni_iniziali', 'rcp'),
      why: 'Nel bambino l’arresto è quasi sempre ipossico: la sequenza ERC inizia con 5 ventilazioni.',
      sources: ['ERC_PLS_2025'],
    },
    {
      id: 'aspirazione',
      label: 'Muco aspirato per liberare le vie aeree',
      category: 'trattamento',
      points: 8,
      check: (s) => s.did('aspira'),
      why: 'Nella bronchiolite le secrezioni ostruiscono le piccole vie aeree del lattante: senza vie aeree libere le ventilazioni non entrano.',
      sources: ['ERC_PLS_2025'],
    },
    {
      id: 'rapporto',
      label: 'Rapporto 15:2 (equipaggio addestrato in PBLS)',
      category: 'trattamento',
      points: 10,
      check: (s) => s.flags.ratioScelto === '15:2' || (s.cpr.ratio === '15:2' && s.cpr.startedAt !== null),
      why: 'ERC 2025: 15:2 se si è addestrati in PBLS; 30:2 solo per chi non lo è.',
      sources: ['ERC_PLS_2025'],
    },
    {
      id: 'pallone',
      label: 'Ventilazione con pallone pediatrico e ossigeno',
      category: 'trattamento',
      points: 8,
      check: (s) => s.cpr.ventilation === 'pallone' && !!s.o2 && s.o2.flow >= 10,
      why: 'I soccorritori addestrati ventilano con pallone e maschera della misura giusta, collegati all’ossigeno.',
      sources: ['ERC_PLS_2025'],
    },
    {
      id: 'piastre',
      label: 'DAE con piastre antero-posteriori e modalità pediatrica',
      category: 'trattamento',
      points: 10,
      check: (s) => s.aed.pads === 'anteroposteriore' && s.aed.pediatric,
      why: 'Sotto i 25 kg (circa 8 anni) modalità pediatrica se disponibile e piastre antero-posteriori: una al centro del torace, una tra le scapole.',
      sources: ['ERC_PLS_2025'],
    },
    {
      id: 'dopo',
      label: 'Dopo la ripresa: ossigeno e saturimetro',
      category: 'valutazione',
      points: 6,
      check: (s) => s.arrest.roscAt !== null && s.pulseOx && !!s.o2,
      why: 'Dopo il ritorno del circolo si mantiene l’ossigenazione e si monitorizza in attesa dell’équipe pediatrica.',
      sources: ['ERC_PLS_2025'],
    },
  ],
  teaching: [
    'Lattante: stimolo verbale e tattile, mai doloroso; capo in posizione neutra con un lieve sollevamento del mento.',
    'Arresto pediatrico = quasi sempre ipossico: 5 ventilazioni iniziali, poi compressioni.',
    'Lattante: due pollici avvolgenti sulla metà inferiore dello sterno, almeno un terzo del torace, 100–120/min; 15:2 se addestrati.',
    'DAE in tutte le età: sotto i 25 kg modalità pediatrica e piastre antero-posteriori.',
    'Aspira le secrezioni: nella bronchiolite sono loro a ostruire le vie aeree.',
  ],
  sources: ['ERC_PLS_2025'],
  hooks: {
    onStart: (s) => {
      s.arrest.startedAt = -120;
      s.arrest.noFlow = 40;
      s.arrest.lowFlow = 80;
      s.cpr.active = true;
      s.cpr.by = 'astante';
      s.cpr.quality = 0.4;
      s.cpr.startedAt = -80;
      s.cpr.segmentStart = -80;
      s.cpr.compressorSince = -80;
      s.cpr.ratio = '30:2';
    },
    tick: (s) => {
      // senza vie aeree libere le ventilazioni non sono efficaci
      if (s.inArrest() && s.p.airway === 'gorgogliante') s.cpr.goodSeconds = Math.min(s.cpr.goodSeconds, 10);
      const r = s.arrest.roscAt;
      if (r !== null) {
        if (s.t - r === 1) {
          s.p.breathing = 'tachipnoico';
          s.p.airway = 'pervie';
          s.base.hr = 150;
          s.base.rr = 44;
          s.p.spo2Air = 86;
          s.say('paziente', 'Sara tossisce, fa una smorfia e inizia a respirare; il colorito migliora.');
        }
        if (s.t - r === 120 && s.p.avpu === 'U') {
          s.p.avpu = 'V';
          s.p.speech = 'pianto';
          s.say('paziente', 'Sara emette un pianto debole.');
        }
      }
      void flagT;
    },
    onAction: (s, id) => {
      if (id === 'rcp' && s.isInfant()) {
        s.say('consiglio', 'Lattante: tecnica a due pollici avvolgenti, metà inferiore dello sterno, almeno un terzo del torace.');
      }
      if (id === 'aspira' && s.p.airway === 'gorgogliante') {
        s.p.airway = 'pervie';
        s.find('Aspiri il muco da naso e bocca con la sonda pediatrica: le vie aeree sono libere.');
        return true;
      }
      if (id === 'ventilazioni_iniziali' && s.p.airway === 'gorgogliante') {
        s.set('ventilazioniIniziali', s.t);
        s.say('azione', 'Dai 5 ventilazioni con pallone e maschera pediatrici, ma il torace si solleva poco: c’è muco nelle vie aeree.');
        if (s.arrest.recognizedAt === null) {
          s.arrest.recognizedAt = s.t;
          s.set('arrestoRiconosciutoAt', s.t);
        }
        return true;
      }
      if (id === 'ventilazioni_iniziali' && s.inArrest() && s.arrest.recognizedAt === null) {
        s.arrest.recognizedAt = s.t;
        s.set('arrestoRiconosciutoAt', s.t);
      }
      return false;
    },
    outcome: (s) => {
      if (s.arrest.roscAt !== null && !s.inArrest())
        return { status: 'ottimo', title: 'Il cuore di Sara riparte', text: 'Ventilazioni efficaci e compressioni di qualità hanno riportato il circolo: Sara viene trasferita in terapia intensiva pediatrica.' };
      return { status: 'critico', title: 'Arresto ipossico in corso', text: 'Senza vie aeree libere e ventilazioni efficaci il circolo non riparte.' };
    },
  },
};
