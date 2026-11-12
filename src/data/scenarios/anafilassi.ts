import type { Scenario } from '../../engine/types';
import { afterContact, flagT } from './helpers';

/** Anafilassi da arachidi a uno stand gastronomico: adrenalina IM il prima possibile. */
export const anafilassi: Scenario = {
  id: 'anafilassi',
  title: 'La salsa sbagliata',
  subtitle: 'Allergia alle arachidi a uno stand gastronomico dell’evento',
  category: 'eventi',
  difficulty: 2,
  minutes: 12,
  setting: 'festival',
  timeOfDay: 'giorno',
  role: 'squadra',
  crew: 2,
  dispatch: {
    luogo: 'Z',
    patologia: 'C3',
    criticita: 'R',
    address: 'Area food, stand «Street Asia»',
    caller: 'Gestore dello stand via radio',
    time: '18:32',
    travel: 90,
    text: 'Ragazzo che dopo aver mangiato ha la faccia gonfia e respira male. L’amico dice che è allergico alle arachidi.',
  },
  loadout: {
    essential: ['zaino', 'ossigeno', 'dae'],
    recommended: ['pallone', 'aspiratore'],
    fetchTime: 90,
    note: 'Sospetta anafilassi: ossigeno e DAE subito; la reazione può progredire fino all’arresto.',
  },
  scene: {
    intro: 'Tavoli all’aperto davanti allo stand. Il ragazzo è seduto, le labbra gonfie, chiazze rosse sul collo, respira con un sibilo. L’amico agita un astuccio giallo: «Ha l’adrenalina, non sappiamo usarla!».',
    hazards: [],
    bystanders: 'L’amico, il gestore dello stand.',
  },
  patient: {
    name: 'Luca',
    age: 24,
    sex: 'M',
    weightKg: 72,
    avpu: 'A',
    gcs: 15,
    airway: 'ostruzione_parziale',
    breathing: 'sibili',
    rhythm: 'tachicardia',
    pulseRadial: true,
    v: { hr: 128, rr: 28, spo2: 91, sbp: 84, dbp: 48, glu: 102, temp: 36.8, crt: 3 },
    skin: { color: 'arrossata', temp: 'calda', sweaty: true },
    pupils: 'normali',
    speech: 'frasi_brevi',
    position: 'seduto',
    canSwallow: false,
    seizing: false,
    vomitInMouth: false,
    look: { skinTone: '#e9b998', hair: '#2a1d14', hairStyle: 'corti', shirt: '#3b8f6a', pants: '#2c2f38', build: 'adulto', wristband: '#ffd84d' },
  },
  trauma: false,
  answers: {
    sintomi: 'Gola… stretta… non respiro… mi prude tutto.',
    allergie: 'Arachidi… grave… ho l’adrenalina… nello zaino.',
    farmaci: 'L’adrenalina… e l’antistaminico.',
    patologie: 'Asma… da piccolo.',
    pasto: 'Il panino… con la salsa… dieci minuti fa.',
    eventi: 'Ho mangiato… e subito…',
    esordio: 'Dieci minuti… fa.',
    testimoni: '[Amico] Ha mangiato un panino con una salsa, non sapevamo ci fossero le arachidi. Dopo cinque minuti si è gonfiato.',
  },
  exam: {
    testaPiedi: 'Orticaria diffusa su collo e torace, labbra e lingua gonfie. Nessun trauma.',
    torace: 'Rientramenti, sibili espiratori diffusi, uso dei muscoli accessori.',
  },
  protocol: { correct: ['anafilassi'], acceptable: ['dispnea'] },
  valutazione: { correct: ['I3'] },
  reportKeys: ['pa', 'spo2'],
  msa: { available: true, eta: 300, label: 'Il medico del PMA' },
  timeLimit: 1500,
  objectives: [
    {
      id: 'adrenalina',
      label: 'Adrenalina con autoiniettore entro 2 minuti dal contatto',
      category: 'tempi',
      points: 16,
      critical: true,
      check: (s) => afterContact(s, 'autoiniettore') <= 120,
      why: 'Nell’anafilassi l’adrenalina intramuscolo va data il prima possibile: ritardarla aumenta il rischio di morte.',
      sources: ['ERC_FA_2025'],
    },
    {
      id: 'seconda',
      label: 'Seconda dose dopo almeno 5 minuti, perché i sintomi persistevano',
      category: 'trattamento',
      points: 10,
      check: (s) => {
        const a1 = flagT(s, 'adrenalina1At');
        const a2 = flagT(s, 'adrenalina2At');
        return a1 !== null && a2 !== null && a2 - a1 >= 280;
      },
      why: 'Se dopo 5 minuti non c’è miglioramento si somministra una seconda dose, possibilmente nell’altra coscia.',
      sources: ['ERC_FA_2025'],
    },
    {
      id: 'posizione',
      label: 'Posizione corretta: seduto con gambe distese (respira male), mai in piedi',
      category: 'trattamento',
      points: 6,
      check: (s) => !s.penalties.some((p) => p.id === 'fatto_camminare') && s.p.position !== 'in_piedi',
      why: 'Il paziente anafilattico non deve alzarsi: il passaggio in piedi può causare collasso.',
      sources: ['ERC_FA_2025'],
    },
    {
      id: 'ossigeno',
      label: 'Ossigeno ad alti flussi',
      category: 'trattamento',
      points: 6,
      check: (s) => !!s.o2 && s.o2.flow >= 10,
      why: 'Ipossiemia con broncospasmo ed edema: ossigeno ad alte concentrazioni.',
      sources: ['ERC_FA_2025', 'BTS_O2_2017'],
    },
    {
      id: 'avanzato',
      label: 'Supporto sanitario avanzato attivato subito',
      category: 'comunicazione',
      points: 6,
      check: (s) => s.requests.msa !== undefined && afterContact(s, 'richiedi_msa') <= 180,
      why: 'L’anafilassi richiede farmaci e monitoraggio avanzati: si chiama subito.',
      sources: ['ERC_FA_2025'],
    },
  ],
  teaching: [
    'Anafilassi: esordio rapido dopo l’esposizione con problemi di vie aeree, respiro o circolo, spesso con orticaria.',
    'Adrenalina intramuscolo nella parte esterna della coscia appena possibile, anche attraverso i vestiti.',
    'Se i sintomi persistono dopo 5 minuti, seconda dose nell’altra coscia.',
    'Sdraiato; seduto con le gambe distese se respira male. Mai in piedi.',
    'Allontana la causa e attiva subito il supporto avanzato.',
  ],
  sources: ['ERC_FA_2025'],
  hooks: {
    onStart: (s) => {
      s.set('haAutoiniettore', true);
      s.set('nonCamminare', 'Nell’anafilassi alzarsi o camminare può provocare un collasso cardiovascolare.');
    },
    tick: (s) => {
      const p = s.p;
      const a1 = flagT(s, 'adrenalina1At');
      const a2 = flagT(s, 'adrenalina2At');
      if (a1 === null) {
        // progressione senza adrenalina
        p.spo2Air = Math.max(70, p.spo2Air - 0.012);
        s.base.sbp = Math.max(58, s.base.sbp - 0.03);
        s.base.dbp = Math.max(32, s.base.dbp - 0.02);
        s.base.hr = Math.min(150, s.base.hr + 0.02);
        if (s.base.sbp < 70 && p.avpu === 'A') {
          p.avpu = 'V';
          p.speech = 'confuso';
          s.say('paziente', 'Luca è sempre più pallido e soporoso.');
        }
        if (s.base.sbp <= 58.2 && !s.inArrest()) s.enterArrest('aesp', 'Luca perde conoscenza e smette di respirare: arresto cardiaco.');
      } else if (a2 === null) {
        // miglioramento parziale dopo la prima dose
        if (s.t - a1 < 240) {
          s.base.sbp = Math.min(98, s.base.sbp + 0.08);
          p.spo2Air = Math.min(91, p.spo2Air + 0.02);
        }
        if (s.t - a1 === 300) s.say('paziente', 'Dopo 5 minuti: sibili ancora presenti, labbra gonfie, la pressione è risalita poco.');
      } else {
        s.base.sbp = Math.min(118, s.base.sbp + 0.1);
        s.base.hr = Math.max(104, s.base.hr - 0.08);
        p.spo2Air = Math.min(95, p.spo2Air + 0.03);
        if (s.t - a2 === 120) {
          p.breathing = 'tachipnoico';
          p.airway = 'pervie';
          p.speech = 'normale';
          p.avpu = 'A';
          s.say('paziente', 'Il respiro migliora, i sibili si riducono: «Va meglio… respiro».');
        }
      }
    },
    onAction: (s, id) => {
      if (id === 'autoiniettore' && Number(s.flags.adrenalinaDosi ?? 0) === 1) {
        const a1 = flagT(s, 'adrenalina1At')!;
        if (s.t - a1 < 280) {
          s.penalize('adrenalina_presto', 'lieve', 'Seconda dose troppo ravvicinata', 'La seconda dose si valuta dopo 5 minuti se i sintomi persistono.', ['ERC_FA_2025']);
        }
      }
      return false;
    },
  },
};
