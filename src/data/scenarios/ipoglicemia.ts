import type { Scenario } from '../../engine/types';
import { afterContact, contact, flagT, soresInformedAt } from './helpers';

/** Sospetta ipoglicemia in un diabetico insulino-trattato: il soccorritore riconosce, protegge e riferisce; il glucosio lo dà l'infermiere dell'ALS. */
export const ipoglicemia: Scenario = {
  id: 'ipoglicemia',
  title: 'Non è da lui',
  subtitle: 'Diabetico confuso e sudato: riconoscere, proteggere e riferire alla SORES',
  category: '118',
  difficulty: 1,
  minutes: 12,
  setting: 'casa',
  timeOfDay: 'sera',
  role: 'msb',
  crew: 2,
  dispatch: {
    luogo: 'K',
    patologia: 'C4',
    criticita: 'G',
    address: 'Udine, via Verdi 9, terzo piano con ascensore',
    caller: 'Moglie del paziente',
    time: '19:05',
    travel: 480,
    text: 'Uomo di 45 anni diabetico, da mezz’ora «strano», confuso, sudatissimo. Risponde ma dice cose senza senso.',
    extra: 'SORES: «ALS non disponibile in zona: inviamo la vostra BLS. Valutate e riferite subito».',
  },
  loadout: {
    essential: ['zaino'],
    recommended: ['ossigeno', 'dae', 'aspiratore'],
    fetchTime: 120,
    note: 'Alterazione della coscienza: nello zaino saturimetro, sfigmomanometro e telo; l’aspiratore serve se perde coscienza. Il glucometro non è un tuo presidio.',
  },
  scene: {
    room: 'cucina',
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
  valutazione: { correct: ['I2'] },
  reportKeys: ['avpu', 'fc', 'pa'],
  msa: { available: true, eta: 420, label: 'L’ALS', onReport: true },
  timeLimit: 1500,
  objectives: [
    {
      id: 'anamnesi',
      label: 'Diabete in terapia con insulina e pasto saltato raccolti entro 3 minuti',
      category: 'valutazione',
      points: 10,
      critical: true,
      check: (s) => afterContact(s, 'q_farmaci', 'q_pasto', 'q_testimoni') <= 180,
      why: 'In un diabetico che fa l’insulina, confusione, sudorazione e pallore fanno sospettare un’ipoglicemia: è l’informazione chiave da riferire.',
      sources: ['ERC_FA_2025'],
    },
    {
      id: 'parametri',
      label: 'Coscienza, saturazione, frequenza e pressione rilevate',
      category: 'valutazione',
      points: 8,
      check: (s) => s.did('coscienza') && s.pulseOx && s.did('pressione'),
      why: 'Parametri non invasivi completi: servono alla SORES per decidere risorse e codice di rientro.',
      sources: ['ERC_FA_2025', 'SORES_FVG'],
    },
    {
      id: 'sores_presto',
      label: 'SORES informata entro 4 minuti dal contatto',
      category: 'comunicazione',
      points: 12,
      critical: true,
      check: (s) => soresInformedAt(s) - contact(s) <= 240,
      why: 'Il glucosio lo può dare solo l’infermiere o il medico: prima riferisci, prima la SORES manda l’ALS.',
      sources: ['SORES_FVG', 'DGR_FVG_2039_2015'],
    },
    {
      id: 'protezione',
      label: 'Quando la coscienza peggiora: posizione laterale entro 1 minuto',
      category: 'trattamento',
      points: 10,
      critical: true,
      check: (s) => {
        const v = flagT(s, 'soporeAt');
        if (v === null) return true;
        const l = s.flags.pos_laterale === undefined ? null : Number(s.flags.pos_laterale);
        return l !== null && l >= v && l - v <= 60;
      },
      why: 'Se non risponde più e respira, la posizione laterale protegge le vie aeree dall’inalazione.',
      sources: ['ERC_FA_2025'],
    },
    {
      id: 'consegna',
      label: 'Consegne all’infermiere dell’ALS',
      category: 'comunicazione',
      points: 6,
      check: (s) => s.ended?.reason === 'Consegna al mezzo avanzato',
      why: 'Orari, parametri e anamnesi passano all’infermiere, che misura la glicemia e somministra il glucosio.',
      sources: ['SORES_FVG'],
    },
  ],
  teaching: [
    'Sospetta l’ipoglicemia in un diabetico (soprattutto con insulina) con alterazione improvvisa della coscienza o del comportamento.',
    'Raccogli farmaci, ultimo pasto e da quanto è così: sono le informazioni chiave per la SORES.',
    'Rileva i parametri non invasivi (AVPU, SpO₂, FC, PA). La glicemia capillare è una manovra invasiva: la misura l’infermiere.',
    'Non dare nulla per bocca, nemmeno acqua e zucchero: il soccorritore non somministra.',
    'Se la coscienza peggiora: vie aeree, posizione laterale, aspiratore pronto, aggiorna la SORES.',
    'All’arrivo dell’ALS passa le consegne: l’infermiere misura la glicemia e somministra il glucosio.',
  ],
  sources: ['ERC_FA_2025', 'SORES_FVG', 'DGR_FVG_2039_2015'],
  hooks: {
    onStart: (s) => {
      s.set('diabetico', true);
    },
    tick: (s) => {
      const p = s.p;
      const c = contact(s);
      const g = flagT(s, 'glucosioEv');
      if (g === null) {
        // senza glucosio la glicemia continua a scendere
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
          s.set('soporeAt', s.t);
          s.say('paziente', 'Il paziente scivola dalla sedia: ora risponde solo al dolore e russa.');
          s.hint('Coscienza ridotta e respiro presente: vie aeree, posizione laterale, aggiorna la SORES.');
        }
      } else {
        s.base.glu = Math.min(112, s.base.glu + 0.12);
        if (s.base.glu > 70 && p.avpu !== 'A') {
          p.avpu = 'A';
          p.canSwallow = true;
          p.airway = 'pervie';
          p.speech = 'confuso';
          s.say('paziente', 'Il paziente apre gli occhi e si guarda intorno, ancora confuso.');
        }
        if (s.base.glu > 80 && p.speech === 'confuso') {
          p.speech = 'normale';
          p.skin = { color: 'rosea', temp: 'normale', sweaty: false };
          s.base.hr = 86;
          s.say('paziente', 'Il paziente: «Che è successo? Ho fatto l’insulina e non ho mangiato… che stupido».');
        }
      }
    },
    onAdvanced: (s) => {
      const g = Math.round(s.p.v.glu);
      s.measure('glicemia', 'Glicemia (infermiere ALS)', `${g} mg/dL`);
      s.set('glucosioEv', s.t);
      s.say('evento', `L’infermiere dell’ALS misura la glicemia: ${g} mg/dL. Posiziona un accesso venoso e somministra glucosio.`);
    },
    outcome: (s) => {
      if (s.inArrest()) return { status: 'decesso', title: 'Arresto', text: 'Le vie aeree non sono state protette.' };
      if (s.flags.glucosioEv !== undefined)
        return { status: 'ottimo', title: 'Ipoglicemia trattata dall’ALS', text: 'Grazie al riconoscimento e alla segnalazione precoce l’infermiere ha misurato la glicemia e somministrato il glucosio: Marco si risveglia e va in pronto soccorso per l’osservazione.' };
      return { status: 'critico', title: 'Ipoglicemia non trattata', text: 'Marco arriva in ospedale soporoso, senza glucosio: con una segnalazione più precoce la SORES avrebbe fatto arrivare l’ALS in tempo.' };
    },
  },
};
