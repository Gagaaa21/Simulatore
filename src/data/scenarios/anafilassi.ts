import type { Scenario } from '../../engine/types';
import { contact, flagT, soresInformedAt } from './helpers';

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
    intro: 'Tavoli all’aperto davanti allo stand. Il ragazzo è seduto, le labbra gonfie, chiazze rosse sul collo, respira con un sibilo. L’amico agita un astuccio giallo: «Ha l’adrenalina, è nello zaino!».',
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
    look: { skinTone: '#e9b998', hair: '#2a1d14', hairStyle: 'corti', shirt: '#3b8f6a', pants: '#2c2f38', build: 'adulto', wristband: '#ffd84d', top: 'tshirt', bottom: 'shorts', shoes: '#e8e8e8' },
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
  msa: { available: true, eta: 180, label: 'L’MSA del PMA' },
  oxygen: { critical: true },
  timeLimit: 1500,
  objectives: [
    {
      id: 'avanzato',
      label: 'Mezzo avanzato chiesto entro 1 minuto dal contatto',
      category: 'tempi',
      points: 16,
      critical: true,
      check: (s) => soresInformedAt(s) - contact(s) <= 60,
      why: 'L’adrenalina intramuscolo è il farmaco salvavita dell’anafilassi e va data il prima possibile: la somministra l’infermiere o il medico, quindi va chiamato subito.',
      sources: ['ERC_FA_2025', 'SORES_FVG'],
    },
    {
      id: 'posizione',
      label: 'Posizione corretta: seduto con gambe distese (respira male), mai in piedi',
      category: 'trattamento',
      points: 8,
      check: (s) => !s.penalties.some((p) => p.id === 'fatto_camminare') && s.p.position !== 'in_piedi',
      why: 'Il paziente anafilattico non deve alzarsi: il passaggio in piedi può causare collasso.',
      sources: ['ERC_FA_2025'],
    },
    {
      id: 'ossigeno',
      label: 'Saturazione riferita e ossigeno ad alti flussi come indicato',
      category: 'trattamento',
      points: 8,
      check: (s) => !!s.o2Order?.device && !!s.o2 && s.o2.device === s.o2Order.device,
      why: 'Broncospasmo ed edema causano ipossiemia: nel paziente critico la SORES indica il reservoir a 15 L/min.',
      sources: ['BTS_O2_2017', 'SORES_FVG'],
    },
    {
      id: 'parametri',
      label: 'Pressione e saturazione rilevate',
      category: 'valutazione',
      points: 6,
      check: (s) => s.did('pressione') && s.pulseOx,
      why: 'L’ipotensione indica uno shock anafilattico: è il dato da passare per primo all’équipe.',
      sources: ['ERC_FA_2025'],
    },
    {
      id: 'consegna',
      label: 'Consegne all’équipe dell’MSA',
      category: 'comunicazione',
      points: 6,
      check: (s) => s.ended?.reason === 'Consegna al mezzo avanzato',
      why: 'Ora di esordio, allergene, parametri e autoiniettore del paziente passano all’infermiere.',
      sources: ['SORES_FVG'],
    },
  ],
  teaching: [
    'Anafilassi: esordio rapido dopo l’esposizione con problemi di vie aeree, respiro o circolo, spesso con orticaria.',
    'L’adrenalina intramuscolo va data il prima possibile: chiama subito il mezzo avanzato, che la somministra.',
    'Anche se il paziente ha il suo autoiniettore, il soccorritore non somministra: riferiscilo all’équipe.',
    'Sdraiato; seduto con le gambe distese se respira male. Mai in piedi.',
    'Riferisci la saturazione e applica l’ossigeno indicato; tieni il DAE vicino.',
  ],
  sources: ['ERC_FA_2025', 'SORES_FVG'],
  hooks: {
    onStart: (s) => {
      s.set('haAutoiniettore', true);
      s.set('nonCamminare', 'Nell’anafilassi alzarsi o camminare può provocare un collasso cardiovascolare.');
    },
    onAdvanced: (s) => {
      s.set('adrenalina1At', s.t);
      s.say('evento', 'L’infermiere dell’MSA somministra adrenalina intramuscolo nella coscia e posiziona un accesso venoso.');
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
        if (s.t - a1 < 240) {
          s.base.sbp = Math.min(98, s.base.sbp + 0.08);
          p.spo2Air = Math.min(91, p.spo2Air + 0.02);
        }
        if (s.t - a1 === 300) {
          s.set('adrenalina2At', s.t);
          s.say('evento', 'Dopo 5 minuti i sibili persistono: l’infermiere ripete l’adrenalina nell’altra coscia.');
        }
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
    outcome: (s) => {
      if (s.inArrest()) return { status: 'decesso', title: 'Arresto cardiaco', text: 'Lo shock anafilattico è progredito prima che arrivasse l’adrenalina.' };
      const a1 = flagT(s, 'adrenalina1At');
      if (a1 !== null && a1 - contact(s) <= 300) return { status: 'ottimo', title: 'Adrenalina precoce', text: 'Chiamato subito, l’MSA ha somministrato l’adrenalina in pochi minuti: Luca va in ospedale stabile, in osservazione per una possibile reazione bifasica.' };
      if (a1 !== null) return { status: 'buono', title: 'Adrenalina tardiva', text: 'L’adrenalina è arrivata, ma lo shock aveva già fatto scendere la pressione: con una chiamata più precoce sarebbe stato più semplice.' };
      return { status: 'critico', title: 'Anafilassi senza adrenalina', text: 'Senza mezzo avanzato l’adrenalina non è arrivata: Luca va in ospedale in shock.' };
    },
  },
};
