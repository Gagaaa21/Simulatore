import type { Scenario } from '../../engine/types';
import { contact, drift, flagT } from './helpers';

/** Codice verde che resta verde: distorsione di caviglia. Trattarla bene, senza sovratrattare. */
export const distorsione: Scenario = {
  id: 'distorsione',
  title: 'Il gradino',
  subtitle: 'Caduta dal marciapiede con le borse della spesa: la caviglia si gonfia',
  category: '118',
  difficulty: 1,
  minutes: 10,
  setting: 'parcheggio',
  timeOfDay: 'giorno',
  role: 'msb',
  crew: 2,
  dispatch: {
    luogo: 'S',
    patologia: 'C1',
    criticita: 'V',
    address: 'Udine, parcheggio del centro commerciale di via Tavagnacco',
    caller: 'Un passante',
    time: '11:05',
    travel: 480,
    text: 'Donna di 52 anni caduta scendendo dal marciapiede: dolore alla caviglia destra, non riesce ad appoggiare il piede. Cosciente, non ha battuto la testa.',
  },
  loadout: {
    essential: ['zaino', 'steccobende'],
    recommended: ['sedia'],
    fetchTime: 60,
    note: 'Trauma di un arto a bassa energia: per immobilizzare la caviglia servono le steccobende; il ghiaccio istantaneo è nello zaino.',
  },
  scene: {
    intro:
      'Mattina di sole, parcheggio quasi pieno. La donna è seduta sul bordo del marciapiede, le borse della spesa rovesciate accanto; si tiene la caviglia destra con entrambe le mani. Un passante le ha portato una bottiglia d’acqua.',
    hazards: [],
    bystanders: 'Il passante che ha chiamato.',
  },
  patient: {
    name: 'Lucia',
    age: 52,
    sex: 'F',
    weightKg: 68,
    avpu: 'A',
    gcs: 15,
    airway: 'pervie',
    breathing: 'normale',
    rhythm: 'sinusale',
    pulseRadial: true,
    v: { hr: 94, rr: 16, spo2: 98, sbp: 138, dbp: 84, glu: 104, temp: 36.5, crt: 2 },
    skin: { color: 'rosea', temp: 'normale', sweaty: false },
    pupils: 'normali',
    speech: 'normale',
    position: 'seduto',
    canSwallow: true,
    seizing: false,
    vomitInMouth: false,
    look: { skinTone: '#e9c2a2', hair: '#8a6a4a', hairStyle: 'corti', shirt: '#5f8fb8', pants: '#3b3f4c', build: 'adulto', top: 'giacca', shoes: '#6b4a3a' },
  },
  trauma: false,
  lesioni: { distorsione: { region: 'gamba_dx', label: 'distorsione della caviglia destra' } },
  answers: {
    eventi: 'Scendevo dal marciapiede con le borse e il piede si è girato verso l’interno. Ho sentito come uno strappo. Non ho battuto la testa, sono caduta seduta.',
    sintomi: 'Mi fa male la caviglia, per il resto sto bene.',
    dolore: 'Qui, sul lato esterno della caviglia: sette su dieci. Non riesco ad appoggiare il piede.',
    allergie: 'No, nessuna.',
    farmaci: 'Una pastiglia per la pressione al mattino.',
    patologie: 'Solo un po’ di pressione alta.',
    pasto: 'Colazione alle otto.',
    esordio: 'Un quarto d’ora fa.',
    testimoni: '[Passante] L’ho vista girarsi la caviglia sul bordo: è caduta seduta, la testa non l’ha battuta.',
  },
  exam: {
    testaPiedi: 'Caviglia destra gonfia sul lato esterno, con un’ecchimosi che inizia a comparire; dolore alla palpazione davanti al malleolo esterno. Nessuna deformità, nessuna ferita, nessun crepitio. Il resto dell’esame è negativo.',
    arti: 'Caviglia destra tumefatta e dolente, senza deformità: segni di probabilità, nessun segno di certezza di frattura.',
    extra: {
      pms: 'A valle: polso pedidio presente, piede caldo e roseo, muove le dita, sensibilità conservata.',
      pmsDopo: 'Dopo l’immobilizzazione polso, motilità e sensibilità restano conservati.',
    },
  },
  protocol: { correct: ['fratture'], acceptable: ['abcde'] },
  valutazione: { correct: ['I1'] },
  reportKeys: ['pms', 'dinamica'],
  msa: { available: false, eta: 0 },
  timeLimit: 1200,
  objectives: [
    {
      id: 'pms',
      label: 'Polso, motilità e sensibilità controllati prima di immobilizzare',
      category: 'valutazione',
      points: 6,
      check: (s) => {
        const p = flagT(s, 'pmsPrimaAt');
        const st = flagT(s, 'steccaAt');
        return p !== null && (st === null || p <= st);
      },
      why: 'Anche in una distorsione si controlla la circolazione a valle prima e dopo l’immobilizzazione.',
      sources: ['CORSO_MSK'],
    },
    {
      id: 'scarpa',
      label: 'Scarpa e calza tolte prima che il gonfiore aumenti',
      category: 'trattamento',
      points: 6,
      check: (s) => s.flags.scarpaTolta !== undefined,
      why: 'Con il gonfiore la scarpa diventa un laccio: va tolta subito, sostenendo il tallone.',
      sources: ['CORSO_MSK'],
    },
    {
      id: 'immobilizza',
      label: 'Caviglia immobilizzata',
      category: 'trattamento',
      points: 10,
      critical: true,
      check: (s) => s.immob.has('stecca'),
      why: 'Immobilizzare l’articolazione riduce il dolore e previene ulteriori danni ai legamenti.',
      sources: ['CORSO_MSK', 'ERC_FA_2025'],
    },
    {
      id: 'ghiaccio',
      label: 'Ghiaccio avvolto in un telo e arto in scarico',
      category: 'trattamento',
      points: 8,
      check: (s) => s.flags.ghiaccioAt !== undefined && s.flags.artoScaricoAt !== undefined,
      why: 'Il freddo, mai a contatto diretto con la pelle, e l’arto sollevato limitano gonfiore e dolore.',
      sources: ['CORSO_MSK', 'ERC_FA_2025'],
    },
    {
      id: 'misura',
      label: 'Nessun trattamento inutile: niente collare, niente ossigeno',
      category: 'trattamento',
      points: 4,
      check: (s) => !s.immob.has('collare') && !s.o2,
      why: 'Un codice verde si tratta bene, non di più: collare e ossigeno non hanno indicazione in una distorsione con saturazione normale.',
      sources: ['ERC_FA_2025', 'BTS_O2_2017'],
    },
  ],
  teaching: [
    'Dinamica a bassa energia, nessun trauma cranico: è una lesione isolata di un arto.',
    'Segni di probabilità senza segni di certezza: si tratta come una possibile frattura, senza muovere.',
    'Distorsione: togli scarpa e calza, immobilizza, ghiaccio avvolto, arto in scarico (corso).',
    'Polso, motilità e sensibilità prima e dopo l’immobilizzazione.',
    'Nessun presidio inutile: un codice verde ben trattato resta verde.',
  ],
  sources: ['CORSO_MSK', 'ERC_FA_2025'],
  hooks: {
    tick: (s) => {
      if (s.phase !== 'paziente' || s.ended) return;
      const curata = s.immob.has('stecca') && s.flags.ghiaccioAt !== undefined;
      s.base.hr = drift(s.base.hr, curata ? 80 : 94, 0.08);
      if (s.flags.scarpaTolta === undefined && s.t - contact(s) === 300 && !s.flags.gonfia) {
        s.set('gonfia', s.t);
        s.say('paziente', 'La caviglia si è gonfiata dentro la scarpa: «Mi stringe, adesso fa malissimo».');
      }
      if (curata && !s.flags.sollievo) {
        s.set('sollievo', s.t);
        s.say('paziente', 'Con la caviglia ferma e il ghiaccio Lucia si rilassa: «Così va molto meglio».');
      }
    },
    onAction: (s, id, params) => {
      if (id === 'q_eventi' || id === 'q_testimoni') s.measure('dinamica', 'Dinamica', 'distorsione scendendo dal marciapiede, nessun trauma cranico');
      if (id === 'trasporta' && String(params?.mode ?? 'barella') === 'piedi') {
        s.penalize('carico_caviglia', 'lieve', 'Le hai fatto caricare il peso sulla caviglia', 'Con una possibile frattura l’arto non deve caricare il peso: sedia portantina o barella.', ['CORSO_MSK']);
      }
    },
    outcome: (s) => {
      if (s.immob.has('stecca') && s.flags.ghiaccioAt !== undefined && s.flags.scarpaTolta !== undefined)
        return { status: 'ottimo', title: 'Codice verde, gestito bene', text: 'Caviglia immobilizzata, ghiaccio e arto sollevato: Lucia arriva in pronto soccorso con il dolore sotto controllo. La radiografia mostra una distorsione di secondo grado, senza fratture.' };
      return { status: 'buono', title: 'In pronto soccorso', text: 'Lucia arriva in ospedale, ma senza immobilizzazione o senza ghiaccio la caviglia si è gonfiata e il dolore è aumentato durante il trasporto.' };
    },
  },
};
