import type { Scenario } from '../../engine/types';
import { afterContact, contact, flagT } from './helpers';

/** Ipoglicemia in diabetico insulino-trattato: finestra limitata per lo zucchero per bocca. */
export const ipoglicemia: Scenario = {
  id: 'ipoglicemia',
  title: 'Non è da lui',
  subtitle: 'Diabetico confuso e sudato: il tempo per lo zucchero per bocca è poco',
  category: '118',
  difficulty: 1,
  minutes: 10,
  setting: 'casa',
  timeOfDay: 'sera',
  role: 'msb',
  crew: 3,
  dispatch: {
    luogo: 'K',
    patologia: 'C4',
    criticita: 'G',
    address: 'Via Verdi 9, terzo piano con ascensore',
    caller: 'Moglie del paziente',
    time: '19:05',
    travel: 480,
    text: 'Uomo di 45 anni diabetico, da mezz’ora «strano», confuso, sudatissimo. Risponde ma dice cose senza senso.',
  },
  loadout: {
    essential: ['zaino'],
    recommended: ['ossigeno', 'dae', 'aspiratore'],
    fetchTime: 120,
    note: 'Alterazione della coscienza in un diabetico: lo zaino contiene il glucometro, l’esame più importante.',
  },
  scene: {
    intro: 'Cucina. Il paziente è seduto a tavola, pallido, madido di sudore, fissa un punto nel vuoto e borbotta. La moglie gli tiene la spalla.',
    hazards: [],
    bystanders: 'La moglie.',
  },
  patient: {
    name: 'Marco',
    age: 45,
    sex: 'M',
    weightKg: 76,
    avpu: 'A',
    gcs: 14,
    airway: 'pervie',
    breathing: 'normale',
    rhythm: 'tachicardia',
    pulseRadial: true,
    v: { hr: 110, rr: 18, spo2: 98, sbp: 138, dbp: 84, glu: 42, temp: 36.3, crt: 2 },
    skin: { color: 'pallida', temp: 'fredda', sweaty: true },
    pupils: 'normali',
    speech: 'confuso',
    position: 'seduto',
    canSwallow: true,
    seizing: false,
    vomitInMouth: false,
    look: { skinTone: '#d2a07a', hair: '#1f1a17', hairStyle: 'corti', shirt: '#4e7a52', pants: '#2b2f38', build: 'adulto', top: 'camicia', sleeves: 'corte' },
  },
  trauma: false,
  answers: {
    testimoni: '[Moglie] È diabetico da quando aveva vent’anni, fa l’insulina. Oggi ha fatto la dose del pranzo ma poi è uscito di corsa e non ha mangiato.',
    farmaci: '[Moglie] Insulina rapida ai pasti e una lenta la sera.',
    patologie: '[Moglie] Diabete di tipo 1, nient’altro.',
    allergie: '[Moglie] Nessuna.',
    pasto: '[Moglie] Non ha pranzato: ha fatto l’insulina e poi niente.',
    eventi: '[Moglie] Da mezz’ora è strano, suda e non capisce quello che gli dico.',
    sintomi: 'Sto… sto bene, lasciatemi… che ore sono?',
  },
  exam: { testaPiedi: 'Nessun trauma. Segni di iniezioni sull’addome.' },
  protocol: { correct: ['ipoglicemia'], acceptable: ['abcde'] },
  valutazione: { correct: ['I2'], acceptable: ['I1'] },
  reportKeys: ['glicemia'],
  msa: { available: true, eta: 540 },
  timeLimit: 1500,
  objectives: [
    {
      id: 'glicemia_presto',
      label: 'Glicemia misurata entro 3 minuti dal contatto',
      category: 'valutazione',
      points: 12,
      critical: true,
      check: (s) => afterContact(s, 'glicemia') <= 180,
      why: 'In ogni alterazione della coscienza la glicemia è il primo controllo: l’ipoglicemia è rapidamente reversibile.',
      sources: ['ERC_FA_2025'],
    },
    {
      id: 'zucchero',
      label: 'Zucchero per bocca dato mentre il paziente è sveglio e deglutisce',
      category: 'trattamento',
      points: 14,
      critical: true,
      check: (s) => flagT(s, 'zuccheroAt') !== null,
      why: '15–20 g di glucosio per bocca se sveglio e capace di deglutire.',
      sources: ['ERC_FA_2025'],
    },
    {
      id: 'ricontrollo',
      label: 'Glicemia ricontrollata dopo lo zucchero',
      category: 'valutazione',
      points: 8,
      check: (s) => {
        const z = flagT(s, 'zuccheroAt');
        return z !== null && (s.doneAt.get('glicemia') ?? []).some((t) => t - z >= 300);
      },
      why: 'Si ricontrolla dopo il trattamento; se i sintomi persistono dopo 15 minuti si ripete lo zucchero.',
      sources: ['ERC_FA_2025'],
    },
    {
      id: 'causa',
      label: 'Causa identificata: insulina senza pasto',
      category: 'valutazione',
      points: 4,
      check: (s) => s.didAny('q_pasto', 'q_farmaci', 'q_testimoni'),
      why: 'Capire la causa aiuta a prevenire una ricaduta (insulina a lunga durata).',
      sources: ['ERC_FA_2025'],
    },
  ],
  teaching: [
    'Sospetta l’ipoglicemia in un diabetico con improvvisa alterazione della coscienza o del comportamento.',
    'Misura la glicemia: sotto 70 mg/dL con sintomi è ipoglicemia.',
    'Se è sveglio e deglutisce: 15–20 g di zuccheri semplici per bocca. Se non lo è: nulla per bocca e mezzo avanzato.',
    'Ricontrolla dopo il trattamento e, appena riprende, uno spuntino con carboidrati.',
    'L’insulina ad azione prolungata può far ricadere il paziente: la valutazione medica resta importante.',
  ],
  sources: ['ERC_FA_2025'],
  hooks: {
    tick: (s) => {
      const p = s.p;
      const c = contact(s);
      const z = flagT(s, 'zuccheroAt');
      if (z === null) {
        // senza trattamento la glicemia continua a scendere
        s.base.glu = Math.max(24, s.base.glu - 0.02);
        if (c < 1e8 && s.t - c === 200 && p.avpu === 'A') {
          p.avpu = 'V';
          p.speech = 'confuso';
          s.say('paziente', 'Il paziente si fa più soporoso: risponde solo se lo chiami a voce alta.');
        }
        if (c < 1e8 && s.t - c === 330 && p.avpu === 'V') {
          p.avpu = 'P';
          p.speech = 'lamento';
          p.canSwallow = false;
          p.position = 'supino';
          p.airway = 'russante';
          s.say('paziente', 'Il paziente scivola dalla sedia: ora risponde solo al dolore e russa. Non è più in grado di deglutire.');
          s.hint('Paziente che non deglutisce: nulla per bocca, vie aeree, posizione laterale e mezzo avanzato per il glucosio in vena.');
        }
      } else {
        s.base.glu = Math.min(112, s.base.glu + 0.1);
        if (s.base.glu > 75 && p.speech === 'confuso') {
          p.speech = 'normale';
          p.skin = { color: 'rosea', temp: 'normale', sweaty: false };
          s.base.hr = 86;
          s.say('paziente', 'Il paziente si guarda intorno: «Che è successo? Ho fatto l’insulina e non ho mangiato… che stupido».');
        }
      }
      // il mezzo avanzato somministra glucosio in vena
      if (s.msaOnScene && p.avpu === 'P' && !s.flags.glucosioEv) {
        s.set('glucosioEv', s.t);
        s.say('evento', 'L’infermiere dell’MSA posiziona un accesso venoso e somministra glucosio.');
        s.set('zuccheroAt', s.t);
      }
      if (s.flags.glucosioEv && s.base.glu > 70 && p.avpu === 'P') {
        p.avpu = 'A';
        p.canSwallow = true;
        p.airway = 'pervie';
        p.speech = 'confuso';
      }
    },
  },
};
