import type { Scenario } from '../../engine/types';
import { drift } from './helpers';

/** Codice verde che resta verde: crisi d'ansia con iperventilazione, dopo aver escluso le cause organiche. */
export const ansia: Scenario = {
  id: 'ansia',
  title: 'Il cuore in gola',
  subtitle: 'Notte prima dell’esame: respira velocissima e dice di stare morendo',
  category: '118',
  difficulty: 1,
  minutes: 10,
  setting: 'casa',
  timeOfDay: 'notte',
  role: 'msb',
  crew: 2,
  dispatch: {
    luogo: 'K',
    patologia: 'C5',
    criticita: 'V',
    address: 'Trieste, via Rossetti 40, quarto piano',
    caller: 'La coinquilina',
    time: '01:20',
    travel: 480,
    text: 'Studentessa di 22 anni: respira velocissima, dice di avere il cuore in gola e le mani che formicolano. La coinquilina dice che le è già successo prima di un esame.',
  },
  loadout: {
    essential: ['zaino'],
    recommended: ['ossigeno'],
    fetchTime: 120,
    note: 'Quarto piano senza ascensore. Prima di pensare all’ansia vanno esclusi asma, allergia e problemi di cuore: servono i parametri.',
  },
  scene: {
    intro:
      'Appartamento di studenti, libri aperti sul tavolo e tre tazzine di caffè. La ragazza è seduta sul divano, piegata in avanti, respira a scatti con la bocca aperta e tiene le mani strette, con le dita rigide. La coinquilina, in pigiama, le tiene una mano sulla spalla.',
    hazards: [],
    bystanders: 'La coinquilina.',
  },
  patient: {
    name: 'Chiara',
    age: 22,
    sex: 'F',
    weightKg: 58,
    avpu: 'A',
    gcs: 15,
    airway: 'pervie',
    breathing: 'tachipnoico',
    rhythm: 'tachicardia',
    pulseRadial: true,
    v: { hr: 124, rr: 34, spo2: 99, sbp: 134, dbp: 80, glu: 98, temp: 36.7, crt: 2 },
    skin: { color: 'rosea', temp: 'normale', sweaty: true },
    pupils: 'normali',
    speech: 'frasi_brevi',
    position: 'seduto',
    canSwallow: true,
    seizing: false,
    vomitInMouth: false,
    look: { skinTone: '#efc6a6', hair: '#2b1d14', hairStyle: 'lunghi', shirt: '#9b6fb5', pants: '#4a4f5c', build: 'adulto', top: 'felpa', shoes: '#efc6a6' },
  },
  trauma: false,
  answers: {
    sintomi: '(ansimando) Il cuore… mi scoppia… le mani, non le sento più… sto morendo?',
    dolore: 'No… nessun dolore al petto. Solo il cuore che batte fortissimo e le mani che formicolano.',
    allergie: 'No, nessuna allergia.',
    farmaci: 'Niente… solo tre caffè oggi, per studiare.',
    patologie: 'Niente, non ho l’asma. Mi era già successo prima della maturità.',
    pasto: 'Un panino a cena.',
    eventi: '[Coinquilina] Studiava per l’esame di domani alle nove, si è alzata di colpo dicendo che non respirava.',
    esordio: '[Coinquilina] Venti minuti fa, più o meno.',
    testimoni: '[Coinquilina] Non ha preso niente, nessuna droga, te lo giuro. Non ha l’asma e non ha mangiato niente di strano.',
  },
  exam: {
    testaPiedi: 'Nessun segno di trauma, nessuna orticaria né gonfiore di labbra e viso. Mani contratte con le dita a punta (spasmo carpale), formicolio attorno alla bocca.',
    torace: 'Respiro rapido e profondo, nessun sibilo, espansione simmetrica.',
  },
  protocol: { correct: ['ansia'], acceptable: ['abcde'] },
  valutazione: { correct: ['I1'] },
  reportKeys: ['spo2', 'fc', 'pa'],
  msa: { available: false, eta: 0 },
  timeLimit: 1200,
  objectives: [
    {
      id: 'escludi',
      label: 'Cause organiche escluse prima di parlare di ansia: parametri, dolore, allergie, malattie, sostanze',
      category: 'valutazione',
      points: 12,
      critical: true,
      check: (s) => s.pulseOx && s.did('pressione') && s.did('q_dolore') && s.didAny('q_allergie', 'q_patologie') && s.didAny('q_farmaci', 'q_testimoni'),
      why: 'L’iperventilazione può nascondere asma, reazione allergica, embolia polmonare, infarto o un’intossicazione: la diagnosi di ansia è l’ultima, dopo aver escluso il resto.',
      sources: ['BTS_O2_2017', 'ERC_FA_2025'],
    },
    {
      id: 'rassicura',
      label: 'Rassicurata con calma',
      category: 'comunicazione',
      points: 6,
      check: (s) => s.did('rassicura'),
      why: 'Un tono calmo e la sensazione di essere al sicuro sono già una terapia.',
      sources: ['ERC_FA_2025'],
    },
    {
      id: 'respiro',
      label: 'Respiro guidato: lento, dal naso, contando insieme',
      category: 'trattamento',
      points: 10,
      check: (s) => s.did('respirazione_guidata'),
      why: 'Guidare il respiro rallenta la frequenza e fa passare formicolio e crampi.',
      sources: ['ERC_FA_2025'],
    },
    {
      id: 'niente_sacchetto',
      label: 'Nessun sacchetto e nessun ossigeno inutile',
      category: 'trattamento',
      points: 6,
      check: (s) => !s.did('sacchetto') && !s.o2,
      why: 'Il sacchetto non è raccomandato; con una saturazione del 99% l’ossigeno non serve.',
      sources: ['BTS_O2_2017'],
    },
  ],
  teaching: [
    'Prima escludi il resto: saturazione, pressione, polso, dolore toracico, allergie, asma, farmaci e sostanze.',
    'Formicolio a mani e bocca, dita a punta, respiro rapido con saturazione normale: tipico dell’iperventilazione.',
    'Ambiente tranquillo, tono calmo, respiro guidato contando insieme.',
    'Niente sacchetto: non è raccomandato e può essere pericoloso.',
    'Con saturazione normale l’ossigeno non serve: lo riferisci alla SORES e decide lei.',
  ],
  sources: ['BTS_O2_2017', 'ERC_FA_2025'],
  hooks: {
    tick: (s) => {
      if (s.phase !== 'paziente' || s.ended) return;
      const calma = s.did('rassicura') && s.did('respirazione_guidata');
      s.base.rr = drift(s.base.rr, calma ? 16 : s.did('rassicura') ? 28 : 34, 0.15);
      s.base.hr = drift(s.base.hr, calma ? 88 : 120, 0.2);
      if (calma && s.p.breathing === 'tachipnoico' && s.base.rr < 20) {
        s.p.breathing = 'normale';
        s.p.speech = 'normale';
        s.p.skin = { ...s.p.skin, sweaty: false };
        s.say('paziente', 'Chiara respira più lentamente, il formicolio passa e le dita si sciolgono: «Scusate… mi sono spaventata da morire».');
      }
      if (s.did('sacchetto') && !s.flags.sacchettoEffetto) {
        s.set('sacchettoEffetto', s.t);
        s.p.spo2Air = 94;
        s.say('paziente', 'Dentro il sacchetto Chiara si agita ancora di più: «Non respiro!».');
      }
    },
    outcome: (s) => {
      if (s.p.breathing === 'normale' && !s.did('sacchetto'))
        return { status: 'ottimo', title: 'Passata la paura', text: 'Escluse le cause organiche e guidato il respiro, Chiara si è calmata. In pronto soccorso i medici confermano un attacco di panico: la indirizzano a un supporto per l’ansia da esame.' };
      return { status: 'buono', title: 'In pronto soccorso', text: 'Chiara arriva in ospedale ancora agitata: la crisi si risolve in pronto soccorso.' };
    },
  },
};
