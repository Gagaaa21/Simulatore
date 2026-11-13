import type { Scenario } from '../../engine/types';
import { afterContact, contact, flagT } from './helpers';

/** Trauma maggiore: motociclista sbalzato, sospetta frattura di bacino e di femore. */
export const traumaMoto: Scenario = {
  id: 'trauma-moto',
  title: 'Incrocio, ore 23',
  subtitle: 'Motociclista sbalzato dopo un urto con un’auto: trauma ad alta energia',
  category: '118',
  difficulty: 3,
  minutes: 16,
  setting: 'strada',
  timeOfDay: 'notte',
  role: 'msb',
  crew: 3,
  dispatch: {
    luogo: 'S',
    patologia: 'C1',
    criticita: 'R',
    address: 'Incrocio tra viale Kennedy e via Battisti',
    caller: 'Automobilista coinvolto',
    time: '23:04',
    travel: 420,
    text: 'Scontro auto-moto. Il motociclista è stato sbalzato di diversi metri, è a terra con il casco, si lamenta e non si alza. Traffico ancora aperto.',
    extra: 'Centrale: «Allertate le Forze dell’ordine per la viabilità».',
  },
  loadout: {
    essential: ['zaino', 'collari', 'cucchiaio', 'ossigeno'],
    recommended: ['materasso', 'cintura_pelvica', 'kit_emorragie'],
    fetchTime: 60,
    note: 'Trauma maggiore: presidi per la restrizione dei movimenti spinali, ossigeno e controllo delle emorragie.',
  },
  scene: {
    intro: 'Notte, asfalto bagnato. La moto è rovesciata a una decina di metri dall’auto. Il motociclista è supino in mezzo alla corsia, con il casco integrale. Le auto continuano a passare a fianco.',
    hazards: [
      {
        id: 'traffico',
        label: 'Traffico ancora aperto accanto al ferito, scena buia',
        fixAction: 'posiziona_mezzo',
        consequence: 'Senza mezzo a protezione e luci l’equipaggio rischia di essere investito.',
      },
    ],
    mechanism: 'Urto laterale con un’auto a circa 50 km/h; sbalzato per circa 8 metri. Trauma ad alta energia.',
    bystanders: 'L’automobilista, sotto shock, e due passanti.',
  },
  patient: {
    name: 'Davide',
    age: 27,
    sex: 'M',
    weightKg: 78,
    avpu: 'V',
    gcs: 14,
    airway: 'pervie',
    breathing: 'tachipnoico',
    rhythm: 'tachicardia',
    pulseRadial: true,
    v: { hr: 116, rr: 26, spo2: 92, sbp: 108, dbp: 70, glu: 118, temp: 35.9, crt: 3 },
    skin: { color: 'pallida', temp: 'fredda', sweaty: true },
    pupils: 'normali',
    speech: 'confuso',
    position: 'supino',
    canSwallow: false,
    seizing: false,
    vomitInMouth: false,
    look: { skinTone: '#d9a882', hair: '#2b211b', hairStyle: 'corti', shirt: '#1d2027', pants: '#24364f', build: 'adulto', helmet: true, top: 'giacca', shoes: '#141414' },
  },
  trauma: true,
  answers: {
    sintomi: 'Il bacino… mi fa malissimo il bacino. E la gamba destra.',
    eventi: 'Non… non mi ricordo. Ero in moto…',
    allergie: 'No…',
    farmaci: 'Niente.',
    patologie: 'Niente.',
    pasto: 'Ho mangiato una pizza… alle nove.',
    testimoni: '[Automobilista] Non l’ho visto, è uscito da destra e l’ho preso in pieno. È volato fin lì. Non si è mai alzato.',
  },
  exam: {
    testaPiedi: 'Escoriazioni al volto. Dolore intenso alla compressione delicata del bacino (non ripetere la manovra). Coscia destra deformata e accorciata, senza ferite aperte. Nessuna emorragia esterna importante.',
    torace: 'Espansione simmetrica, escoriazioni sul fianco sinistro, tachipnea.',
    addome: 'Addome dolente in basso, teso.',
    extra: { motilita: 'Muove tutti e quattro gli arti, sensibilità conservata; il movimento della gamba destra è limitato dal dolore.' },
  },
  protocol: { correct: ['trauma'] },
  valutazione: { correct: ['I3'], acceptable: ['I2'] },
  reportKeys: ['avpu', 'spo2', 'pa', 'fc'],
  msa: { available: true, eta: 600, label: 'L’automedica' },
  heli: { eta: 720 },
  timeLimit: 1800,
  objectives: [
    {
      id: 'mils',
      label: 'Stabilizzazione manuale del capo entro 30 s dal contatto',
      category: 'trattamento',
      points: 10,
      critical: true,
      check: (s) => afterContact(s, 'mils') <= 30,
      why: 'Con questa dinamica la lesione spinale va sospettata finché non è esclusa.',
      sources: ['ERC_FA_2025', 'ISS_TRAUMA'],
    },
    {
      id: 'casco',
      label: 'Casco rimosso in due, con il capo stabilizzato',
      category: 'trattamento',
      points: 8,
      check: (s) => !!s.flags.cascoRimosso && !s.penalties.some((p) => p.id === 'casco_no_mils'),
      why: 'Il casco integrale impedisce di valutare e gestire le vie aeree.',
      sources: ['ERC_FA_2025'],
    },
    {
      id: 'ossigeno',
      label: 'Ossigeno per riportare la SpO₂ tra 94 e 98%',
      category: 'trattamento',
      points: 8,
      check: (s) => !!s.o2 && s.p.v.spo2 >= 94,
      why: 'Nel trauma maggiore si corregge l’ipossiemia: target 94–98%.',
      sources: ['ERC_FA_2025', 'BTS_O2_2017', 'ISS_TRAUMA'],
    },
    {
      id: 'bacino',
      label: 'Cintura pelvica per sospetta frattura di bacino',
      category: 'trattamento',
      points: 10,
      check: (s) => s.immob.has('pelvica'),
      why: 'La compressione circonferenziale del bacino riduce il sanguinamento retroperitoneale.',
      sources: ['ISS_TRAUMA'],
    },
    {
      id: 'immobilizzazione',
      label: 'Barella a cucchiaio e materassino a depressione (non la tavola per il trasporto)',
      category: 'trattamento',
      points: 8,
      check: (s) => s.immob.has('cucchiaio') && s.immob.has('materasso'),
      why: 'Il materassino a depressione limita i movimenti spinali ed è più confortevole e sicuro per il trasporto.',
      sources: ['ISS_TRAUMA', 'ERC_FA_2025'],
    },
    {
      id: 'telo',
      label: 'Prevenzione dell’ipotermia',
      category: 'trattamento',
      points: 6,
      check: (s) => s.covered,
      why: 'Notte, asfalto bagnato e shock: l’ipotermia peggiora la coagulazione.',
      sources: ['ISS_TRAUMA'],
    },
    {
      id: 'avanzato',
      label: 'Supporto avanzato (automedica o elisoccorso) richiesto entro 5 minuti',
      category: 'comunicazione',
      points: 8,
      check: (s) => {
        const t = Math.min(s.requests.msa ?? 1e9, s.requests.elisoccorso ?? 1e9);
        return t - contact(s) <= 300;
      },
      why: 'Il triage preospedaliero (TRENAU) indirizza il trauma maggiore al Trauma Center con supporto avanzato.',
      sources: ['ISS_TRAUMA'],
    },
  ],
  teaching: [
    'Sicurezza prima di tutto: mezzo a protezione con i lampeggianti, alta visibilità, Forze dell’ordine.',
    'Dinamica ad alta energia: stabilizzazione manuale del capo appena raggiungi il paziente.',
    'Casco integrale rimosso in due per gestire le vie aeree; vie aeree aperte con la sublussazione della mandibola.',
    'Dolore al bacino dopo trauma ad alta energia: cintura pelvica, senza ripetere la compressione del bacino.',
    'Barella a cucchiaio e materassino a depressione; niente posizione laterale e niente iperestensione.',
    'Telo isotermico e centralizzazione verso il Trauma Center.',
  ],
  sources: ['ISS_TRAUMA', 'ERC_FA_2025', 'BTS_O2_2017'],
  hooks: {
    onStart: (s) => {
      s.set('traumaBacino', true);
      s.p.bloodLossMl = 700;
    },
    tick: (s) => {
      // emorragia interna dal bacino: rallenta con la cintura pelvica e l'immobilizzazione
      if (!s.inArrest()) {
        let rate = 70; // mL/min
        if (s.immob.has('pelvica')) rate = 18;
        if (s.immob.has('materasso')) rate *= 0.8;
        if (!s.covered && s.phase === 'paziente') {
          s.base.temp = Math.max(34.8, s.base.temp - 0.0012);
          if (s.base.temp < 35.5) rate *= 1.15;
        }
        s.p.bloodLossMl += rate / 60;
      }
      // ventilazione più efficace con l'ossigeno
      if (s.flags.cascoRimosso && s.p.spo2Air < 92) s.p.spo2Air = 92;
      const c = contact(s);
      if (c < 1e8 && s.t - c === 30 && !s.immob.has('mils')) {
        s.say('paziente', 'Il paziente cerca di alzare la testa per guardarsi la gamba.');
      }
      void flagT;
    },
    onAction: (s, id) => {
      if (id === 'ispeziona_bocca' && s.p.look.helmet) {
        s.find('Con il casco integrale non riesci a vedere bene la bocca né a gestire le vie aeree.');
        return true;
      }
      if (id === 'ossigeno' && s.p.look.helmet) {
        s.find('Con il casco indossato non puoi applicare la maschera.');
        return true;
      }
      return false;
    },
    outcome: (s) => {
      const lost = s.p.bloodLossMl;
      if (s.inArrest()) return { status: 'decesso', title: 'Arresto traumatico', text: 'L’emorragia interna non è stata contenuta in tempo.' };
      if (s.immob.has('pelvica') && s.covered && lost < 1700)
        return { status: 'ottimo', title: 'Centralizzato al Trauma Center', text: 'Con il bacino stabilizzato e la temperatura protetta, Davide arriva al Trauma Center in shock compensato: la radiologia interventistica lo aspetta.' };
      return { status: 'critico', title: 'Shock emorragico in peggioramento', text: `Perdita ematica stimata ${Math.round(lost / 100) / 10} L: il bacino non stabilizzato e l’ipotermia hanno aggravato lo shock.` };
    },
  },
};
