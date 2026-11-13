import type { Scenario } from '../../engine/types';
import { afterContact, contact, flagT } from './helpers';

/** Sospetto ictus con afasia ed emiparesi destra in paziente anticoagulata. */
export const ictus: Scenario = {
  id: 'ictus',
  title: 'Le parole sbagliate',
  subtitle: 'Improvvisa difficoltà a parlare e debolezza al braccio destro',
  category: '118',
  difficulty: 2,
  minutes: 10,
  setting: 'casa',
  timeOfDay: 'giorno',
  role: 'msb',
  crew: 2,
  dispatch: {
    luogo: 'K',
    patologia: 'C4',
    criticita: 'G',
    address: 'Gorizia, viale Europa 112, primo piano con ascensore',
    caller: 'Figlia della paziente',
    time: '10:24',
    travel: 480,
    text: 'Donna di 74 anni che «non riesce a parlare bene» e non muove bene il braccio destro. La figlia l’ha trovata così rientrando a casa.',
    extra: 'SORES: «ALS non disponibile: inviamo la vostra BLS. Riferite subito Cincinnati e ora di esordio».',
  },
  loadout: {
    essential: ['zaino'],
    recommended: ['ossigeno', 'dae', 'sedia'],
    fetchTime: 120,
    note: 'Per un sospetto ictus servono soprattutto lo zaino (parametri) e la rapidità: il tempo è cervello.',
  },
  scene: {
    intro: 'Soggiorno luminoso. La paziente è seduta in poltrona, la figlia le tiene la mano. Sul tavolo una tazza rovesciata.',
    hazards: [],
    bystanders: 'La figlia, che vive con lei.',
  },
  patient: {
    name: 'Anna',
    age: 74,
    sex: 'F',
    weightKg: 66,
    avpu: 'A',
    gcs: 13,
    airway: 'pervie',
    breathing: 'normale',
    rhythm: 'tachicardia',
    pulseRadial: true,
    v: { hr: 92, rr: 16, spo2: 95, sbp: 178, dbp: 96, glu: 128, temp: 36.6, crt: 2 },
    skin: { color: 'rosea', temp: 'normale', sweaty: false },
    pupils: 'normali',
    speech: 'afasico',
    position: 'seduto',
    canSwallow: false,
    seizing: false,
    vomitInMouth: false,
    stroke: { face: true, arm: true, speech: true },
    look: { skinTone: '#ebc3a6', hair: '#cfcfd4', hairStyle: 'raccolti', shirt: '#b5657a', pants: '#3f4656', build: 'adulto', top: 'felpa', bottom: 'gonna', shoes: '#7a3b4a' },
  },
  trauma: false,
  answers: {
    testimoni: '[Figlia] L’ho lasciata alle 9:40 che stava benissimo, faceva colazione. Sono tornata alle 10:15 e l’ho trovata così.',
    esordio: '[Figlia] Stava bene alle 9:40, quando sono uscita. L’ho trovata così alle 10:15.',
    eventi: '[Figlia] Parla ma dice parole senza senso, e la tazza le è caduta di mano.',
    patologie: '[Figlia] Ha la fibrillazione atriale e la pressione alta.',
    farmaci: '[Figlia] Prende l’apixaban per la fibrillazione, due volte al giorno, e il ramipril. Ecco la scatola.',
    allergie: '[Figlia] Nessuna.',
    pasto: '[Figlia] Ha fatto colazione alle 9 e mezza.',
    sintomi: '[Figlia] Non riesce a spiegarlo: fa cenno al braccio destro.',
  },
  exam: {
    testaPiedi: 'Nessun trauma cranico, nessuna ferita. Il braccio e la gamba destri sono più deboli.',
    extra: { motilita: 'Forza ridotta a braccio e gamba destri; sensibilità conservata.' },
  },
  protocol: { correct: ['ictus'] },
  valutazione: { correct: ['I2'], acceptable: ['I3'] },
  reportKeys: ['cincinnati', 'esordio'],
  destination: 'la Stroke Unit dell’ospedale hub',
  msa: { available: true, eta: 600, label: 'L’ALS' },
  timeLimit: 1200,
  objectives: [
    {
      id: 'scala',
      label: 'Scala di Cincinnati eseguita',
      category: 'valutazione',
      points: 12,
      critical: true,
      check: (s) => s.did('cincinnati'),
      why: 'Una scala validata riconosce l’ictus in pochi secondi; anche un solo elemento anomalo è sospetto.',
      sources: ['ERC_FA_2025', 'CPSS'],
    },
    {
      id: 'esordio',
      label: 'Ora di esordio (ultima volta vista in benessere) raccolta',
      category: 'valutazione',
      points: 12,
      critical: true,
      check: (s) => s.did('q_esordio'),
      why: 'L’ora di esordio decide l’accesso a trombolisi e trombectomia.',
      sources: ['AHA_STROKE_2019'],
    },
    {
      id: 'patologie',
      label: 'Patologie note raccolte (diabete, aritmie)',
      category: 'valutazione',
      points: 6,
      check: (s) => s.did('q_patologie'),
      why: 'Un’ipoglicemia può simulare un ictus: se la paziente è diabetica va riferito, la glicemia la misura l’infermiere o il pronto soccorso.',
      sources: ['AHA_STROKE_2019', 'SORES_FVG'],
    },
    {
      id: 'farmaci',
      label: 'Terapia anticoagulante identificata',
      category: 'valutazione',
      points: 6,
      check: (s) => s.did('q_farmaci'),
      why: 'L’anticoagulante cambia le decisioni sulla trombolisi: va comunicato.',
      sources: ['AHA_STROKE_2019'],
    },
    {
      id: 'no_o2',
      label: 'Nessun ossigeno a una paziente che satura bene',
      category: 'trattamento',
      points: 4,
      check: (s) => flagT(s, 'o2At') === null || s.p.v.spo2 < 94,
      why: 'Nell’ictus l’ossigeno serve solo se la SpO₂ è bassa.',
      sources: ['AHA_STROKE_2019', 'ERC_FA_2025'],
    },
    {
      id: 'veloce',
      label: 'SORES pre-allertata entro 10 minuti dal contatto',
      category: 'tempi',
      points: 8,
      check: (s) => s.report !== null && s.report.t - contact(s) <= 600,
      why: 'La pre-allerta attiva il percorso ictus in ospedale prima dell’arrivo.',
      sources: ['AHA_STROKE_2019'],
    },
    {
      id: 'tempo_scena',
      label: 'Partenza entro 15 minuti dal contatto',
      category: 'tempi',
      points: 6,
      check: (s) => s.transport !== null && s.transport.t - contact(s) <= 900,
      why: 'Ogni minuto di ictus non trattato costa milioni di neuroni.',
      sources: ['AHA_STROKE_2019'],
    },
  ],
  teaching: [
    'Cincinnati: mimica facciale, slivellamento delle braccia, linguaggio.',
    'L’ora che conta è l’ultima volta in cui la paziente è stata vista in benessere, non quella del ritrovamento.',
    'Chiedi se è diabetica (l’ipoglicemia può simulare un ictus): la glicemia la misura l’infermiere. Nulla per bocca, rischio di disfagia.',
    'Raccogli la terapia: gli anticoagulanti vanno comunicati.',
    'Riferisci presto alla SORES Cincinnati e ora di esordio e riduci il tempo sulla scena; porta con te la figlia o il suo numero.',
  ],
  sources: ['ERC_FA_2025', 'CPSS', 'AHA_STROKE_2019'],
  hooks: {
    onStart: (s) => {
      s.set('nonCamminare', 'Con un deficit motorio la paziente rischia di cadere: va trasportata seduta o sdraiata.');
    },
    onAction: (s, id) => {
      if (id === 'orientamento') {
        s.find('Capisce le domande e annuisce, ma risponde con parole sbagliate e frasi senza senso (afasia).');
        return true;
      }
      if (id === 'dai_acqua') {
        s.penalize('acqua_ictus', 'grave', 'Liquidi a una paziente con sospetto ictus', 'Nell’ictus la deglutizione può essere compromessa: nulla per bocca.', ['AHA_STROKE_2019']);
        return true;
      }
      if (id === 'q_esordio') {
        s.say('reperto', 'Esordio — Figlia: «Stava bene alle 9:40, quando sono uscita. L’ho trovata così alle 10:15».');
        s.measure('esordio', 'Ultima volta in benessere', 'ore 9:40');
        s.set('esordioAt', s.t);
        return true;
      }
      return false;
    },
    outcome: (s) => {
      const ok = s.did('q_esordio') && s.did('cincinnati') && s.report !== null && afterContact(s, 'trasporta') <= 900;
      return ok
        ? { status: 'ottimo', title: 'Centralizzata alla Stroke Unit', text: 'Pre-allertata dalla SORES, la Stroke Unit accoglie Anna con la TC già pronta: rientra nella finestra per la trombectomia.' }
        : { status: 'buono', title: 'Trasportata in ospedale', text: 'Informazioni incomplete o ritardi riducono le possibilità di trattamento.' };
    },
  },
};
