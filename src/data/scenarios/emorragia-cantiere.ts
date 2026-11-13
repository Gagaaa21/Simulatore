import type { Scenario } from '../../engine/types';
import { afterContact } from './helpers';

/** Emorragia arteriosa della coscia da smerigliatrice in un cantiere. */
export const emorragiaCantiere: Scenario = {
  id: 'emorragia-cantiere',
  title: 'Il disco della smerigliatrice',
  subtitle: 'Ferita alla coscia che sanguina a getto: i minuti sono pochi',
  category: '118',
  difficulty: 2,
  minutes: 10,
  setting: 'cantiere',
  timeOfDay: 'giorno',
  role: 'msb',
  crew: 3,
  dispatch: {
    luogo: 'L',
    patologia: 'C1',
    criticita: 'R',
    address: 'Cantiere edile, via dell’Industria 7 (ingresso carraio)',
    caller: 'Capocantiere',
    time: '10:52',
    travel: 420,
    text: 'Operaio di 41 anni ferito alla gamba da una smerigliatrice. «Esce tantissimo sangue». Un collega sta premendo con uno straccio.',
  },
  loadout: {
    essential: ['zaino', 'kit_emorragie'],
    recommended: ['ossigeno', 'dae'],
    fetchTime: 90,
    note: 'Trauma con emorragia massiva: il kit emorragie con il tourniquet deve essere nelle tue mani quando arrivi al paziente.',
  },
  scene: {
    intro: 'Piazzale del cantiere. L’operaio è a terra accanto al banco di lavoro; un collega preme uno straccio intriso di sangue sulla coscia destra. La smerigliatrice è ancora collegata e accesa sul pavimento.',
    hazards: [
      {
        id: 'smerigliatrice',
        label: 'Smerigliatrice ancora collegata alla corrente, disco in rotazione accanto al paziente',
        fixAction: 'togli_tensione',
        consequence: 'Lavorare accanto a un utensile acceso espone l’equipaggio a ferite e folgorazione.',
      },
    ],
    bystanders: 'Il capocantiere e un collega che preme sulla ferita.',
    mechanism: 'Il disco della smerigliatrice si è spezzato e ha colpito la coscia destra.',
  },
  patient: {
    name: 'Ionut',
    age: 41,
    sex: 'M',
    weightKg: 80,
    avpu: 'A',
    gcs: 15,
    airway: 'pervie',
    breathing: 'tachipnoico',
    rhythm: 'tachicardia',
    pulseRadial: true,
    v: { hr: 112, rr: 22, spo2: 96, sbp: 118, dbp: 74, glu: 110, temp: 36.4, crt: 2 },
    skin: { color: 'pallida', temp: 'fredda', sweaty: true },
    pupils: 'normali',
    speech: 'normale',
    position: 'supino',
    canSwallow: true,
    seizing: false,
    vomitInMouth: false,
    bleeding: { region: 'gamba_dx', label: 'ferita profonda della coscia destra, al terzo medio', rate: 420, arterial: true, pos: 0.3 },
    look: { skinTone: '#e3b995', hair: '#4a3626', hairStyle: 'corti', shirt: '#f1a21c', pants: '#3b4a63', build: 'adulto', top: 'tshirt', shoes: '#5a4632' },
  },
  trauma: true,
  arrest: { shockable: false },
  answers: {
    sintomi: 'La gamba… brucia, ho freddo. Mi gira la testa.',
    eventi: 'Si è rotto il disco ed è partito un pezzo. Mi ha preso qui.',
    allergie: 'No, niente.',
    farmaci: 'Niente.',
    patologie: 'Sto bene, mai avuto niente.',
    pasto: 'Ho fatto colazione alle sei.',
    testimoni: '[Capocantiere] È successo cinque minuti fa, il sangue usciva a fiotti. Gli abbiamo messo uno straccio.',
  },
  exam: {
    testaPiedi: 'Nessun’altra lesione oltre alla ferita della coscia. Nessun trauma cranico, addome trattabile.',
    torace: 'Espansione simmetrica, tachipnea.',
  },
  protocol: { correct: ['emorragia'], acceptable: ['trauma'] },
  valutazione: { correct: ['I3'], acceptable: ['I2'] },
  reportKeys: ['tq', 'pa', 'fc'],
  msa: { available: true, eta: 540 },
  heli: { eta: 780 },
  timeLimit: 1200,
  objectives: [
    {
      id: 'pressione',
      label: 'Emorragia aggredita entro 20 s dal contatto (compressione o tourniquet)',
      category: 'tempi',
      points: 12,
      critical: true,
      check: (s) => afterContact(s, 'compressione_diretta', 'tourniquet', 'medicazione') <= 20,
      why: 'Nel trauma l’emorragia massiva si tratta prima ancora delle vie aeree (X-ABCDE).',
      sources: ['ERC_FA_2025', 'ISS_TRAUMA'],
    },
    {
      id: 'tq',
      label: 'Tourniquet efficace entro 2 minuti dal contatto',
      category: 'trattamento',
      points: 14,
      critical: true,
      check: (s) => !!s.tourniquet?.ok && afterContact(s, 'tourniquet') <= 120,
      why: 'Se la compressione non ferma un’emorragia arteriosa dell’arto, il tourniquet va applicato il prima possibile.',
      sources: ['ERC_FA_2025', 'ISS_TRAUMA'],
    },
    {
      id: 'tq_pos',
      label: 'Tourniquet 5–7 cm a monte della ferita, non su un’articolazione',
      category: 'trattamento',
      points: 8,
      check: (s) => !!s.tourniquet?.ok && Number(s.flags.tqCm ?? 99) <= 12,
      why: 'Posizionato vicino alla ferita risparmia tessuto; su un’articolazione non comprime l’arteria.',
      sources: ['ERC_FA_2025'],
    },
    {
      id: 'ora',
      label: 'Ora di applicazione comunicata',
      category: 'comunicazione',
      points: 6,
      check: (s) => !!s.report?.items.includes('tq'),
      why: 'L’ora del tourniquet guida chi lo rimuoverà in ospedale. Non va allentato sul territorio.',
      sources: ['ERC_FA_2025'],
    },
    {
      id: 'ipotermia',
      label: 'Telo isotermico per prevenire l’ipotermia',
      category: 'trattamento',
      points: 6,
      check: (s) => s.covered,
      why: 'L’ipotermia peggiora la coagulazione e quindi l’emorragia.',
      sources: ['ISS_TRAUMA', 'ERC_FA_2025'],
    },
    {
      id: 'supino',
      label: 'Paziente mantenuto supino',
      category: 'trattamento',
      points: 4,
      check: (s) => s.p.position === 'supino',
      why: 'Nel paziente in shock emorragico la posizione supina preserva la perfusione cerebrale.',
      sources: ['ERC_FA_2025'],
    },
    {
      id: 'avanzato',
      label: 'Mezzo avanzato o elisoccorso richiesto',
      category: 'comunicazione',
      points: 6,
      check: (s) => s.requests.msa !== undefined || s.requests.elisoccorso !== undefined,
      why: 'Lo shock emorragico richiede cure avanzate (accessi venosi, acido tranexamico) e un Trauma Center.',
      sources: ['ISS_TRAUMA'],
    },
  ],
  teaching: [
    'X-ABCDE: l’emorragia massiva esterna si ferma per prima.',
    'Compressione diretta subito; se non basta, tourniquet il prima possibile.',
    'Tourniquet 5–7 cm a monte della ferita, mai su un’articolazione; stringi finché il sangue si ferma e annota l’ora.',
    'Una volta applicato non si allenta: lo rimuove solo il personale sanitario in ospedale.',
    'Copri il paziente: ipotermia, acidosi e coagulopatia si alimentano a vicenda.',
  ],
  sources: ['ERC_FA_2025', 'ISS_TRAUMA'],
  hooks: {
    onStart: (s) => {
      s.p.bloodLossMl = 950;
      s.pressure = true; // il collega comprime con uno straccio (poco efficace)
      s.set('pressioneCollega', true);
    },
    tick: (s) => {
      // la compressione del collega con lo straccio è poco efficace
      if (s.flags.pressioneCollega) s.p.bloodLossMl += 1.2;
      if (!s.covered && s.phase === 'paziente') s.base.temp = Math.max(35.2, s.base.temp - 0.0008);
    },
    onAction: (s, id) => {
      if (id === 'avvicinati' && s.flags.pressioneCollega) {
        s.pressure = false;
        s.set('pressioneCollega', false);
        s.say('evento', 'Appena arrivate il collega, spaventato, toglie le mani dalla ferita: il sangue esce a fiotti.');
      }
      return false;
    },
    outcome: (s) => {
      const lost = s.p.bloodLossMl;
      if (s.inArrest()) return { status: 'decesso', title: 'Arresto da shock emorragico', text: `Persi circa ${Math.round(lost / 100) / 10} litri di sangue: l’emorragia non è stata fermata in tempo.` };
      if (s.tourniquet?.ok && lost < 2000) return { status: 'ottimo', title: 'Emorragia controllata', text: `Il tourniquet ha fermato il sanguinamento (perdita stimata ${Math.round(lost / 100) / 10} L). Ionut arriva al Trauma Center in condizioni stabilizzabili.` };
      return { status: 'critico', title: 'Shock emorragico', text: `Perdita stimata ${Math.round(lost / 100) / 10} L: il paziente arriva in ospedale in shock grave.` };
    },
  },
};
