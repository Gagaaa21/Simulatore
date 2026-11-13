import type { Scenario } from '../../engine/types';
import { drift } from './helpers';

/** Anziana trovata a terra in una casa fredda: ipotermia grave, saturimetro che non legge, movimenti delicati. */
export const ipotermia: Scenario = {
  id: 'ipotermia',
  title: 'La notte più fredda',
  subtitle: 'Anziana trovata a terra al mattino in una casa di montagna senza riscaldamento',
  category: '118',
  difficulty: 3,
  minutes: 14,
  setting: 'casa',
  timeOfDay: 'giorno',
  role: 'msb',
  crew: 2,
  dispatch: {
    luogo: 'K',
    patologia: 'C9',
    criticita: 'G',
    address: 'Paluzza, frazione Timau, via del Bosco 4',
    caller: 'Il figlio',
    time: '07:18',
    travel: 600,
    text: 'Anziana di 86 anni trovata a terra in camera dal figlio, non si sa da quante ore. Risponde poco ed è gelata. Fuori ci sono –6 °C.',
    extra: 'SORES: «Inviamo la vostra BLS; l’ALS da Tolmezzo è in uscita, arrivo stimato 14 minuti».',
  },
  loadout: {
    essential: ['zaino', 'ossigeno'],
    recommended: ['cucchiaio', 'materasso'],
    fetchTime: 100,
    note: 'Ipotermia: il telo isotermico è nello zaino. Per caricarla senza metterla seduta serve un presidio che la tenga orizzontale. Casa su due piani con le scale strette.',
  },
  scene: {
    room: 'camera',
    intro:
      'In casa fa freddo quasi come fuori: la stufa a legna in cucina è spenta da ieri sera e la finestra della camera è socchiusa. La signora è a terra tra il letto e l’armadio, supina, in camicia da notte bagnata di urina, le mani bianche e rigide. Non trema. Il figlio le ha messo un cuscino sotto la testa e vuole rimetterla subito a letto.',
    hazards: [],
    bystanders: 'Il figlio, che l’ha trovata alle sette passando a portarle il pane.',
  },
  patient: {
    name: 'Ines',
    age: 86,
    sex: 'F',
    weightKg: 54,
    avpu: 'V',
    gcs: 12,
    airway: 'pervie',
    breathing: 'bradipnoico',
    rhythm: 'bradicardia',
    pulseRadial: true,
    v: { hr: 44, rr: 9, spo2: 93, sbp: 96, dbp: 58, glu: 96, temp: 31.4, crt: 4 },
    skin: { color: 'pallida', temp: 'fredda', sweaty: false },
    pupils: 'normali',
    speech: 'confuso',
    position: 'supino',
    canSwallow: true,
    seizing: false,
    vomitInMouth: false,
    look: { skinTone: '#e8c8b2', hair: '#e6e6ea', hairStyle: 'raccolti', shirt: '#c9d3e6', pants: '#c9d3e6', build: 'adulto', top: 'camicia', sleeves: 'lunghe', bottom: 'gonna', shoes: '#e8c8b2' },
  },
  trauma: false,
  arrest: { shockable: true, roscAfterShocks: 2 },
  answers: {
    eventi: '(a fatica, impastata) Mi sono alzata… per il bagno… e le gambe… Che ore sono?',
    sintomi: '(mormora) Freddo… non sento le mani.',
    dolore: '(scuote appena la testa) Il fianco… un po’.',
    allergie: '[Figlio] Nessuna allergia che io sappia.',
    farmaci: '[Figlio] La pastiglia per la pressione e quella per dormire, la sera.',
    patologie: '[Figlio] Pressione alta, un po’ di artrosi. Vive da sola, è autonoma.',
    pasto: '[Figlio] Ieri sera ha cenato con una minestra, l’ho sentita al telefono alle otto.',
    esordio: '[Figlio] L’ho sentita ieri sera alle otto, stava bene. Sarà caduta di notte.',
    testimoni: '[Figlio] Ieri sera mi ha detto che andava a letto presto. La stufa si spegne verso mezzanotte… Stamattina l’ho trovata così. Aiutatemi a rimetterla a letto, sta gelando!',
  },
  exam: {
    testaPiedi:
      'Cute fredda e pallida su tutto il corpo, mani e piedi bianchi e rigidi. Camicia da notte bagnata. Ecchimosi sul fianco sinistro, arti senza deformità, si muovono. Nessuna ferita al capo.',
    torace: 'Respiro lento e superficiale, espansione simmetrica.',
    extra: {
      bagnato: 'sì',
      indumenti: 'Tagli e sfili con delicatezza la camicia da notte bagnata, senza sollevarla né girarla di colpo.',
    },
  },
  protocol: { correct: ['ipotermia'], acceptable: ['abcde'] },
  valutazione: { correct: ['I2'], acceptable: ['I3'] },
  reportKeys: ['temperatura', 'avpu', 'fc'],
  msa: { available: true, eta: 840, autoDispatched: true, label: 'L’ALS' },
  oxygen: { critical: true },
  timeLimit: 1500,
  objectives: [
    {
      id: 'temperatura',
      label: 'Temperatura misurata: ipotermia grave riconosciuta',
      category: 'valutazione',
      points: 8,
      check: (s) => s.did('temperatura'),
      why: 'Sotto i 32 °C, senza brivido e con la coscienza alterata, l’ipotermia è grave: cambia il modo di muovere il paziente.',
      sources: ['CORSO_TEMP', 'ERC_FA_2025'],
    },
    {
      id: 'bagnato',
      label: 'Indumenti bagnati tolti con delicatezza',
      category: 'trattamento',
      points: 8,
      check: (s) => s.flags.indumentiTolti !== undefined,
      why: 'Gli indumenti bagnati continuano a sottrarre calore: si tolgono e si sostituiscono con coperte.',
      sources: ['CORSO_TEMP'],
    },
    {
      id: 'coperta',
      label: 'Coperta e telo isotermico',
      category: 'trattamento',
      points: 8,
      critical: true,
      check: (s) => s.covered,
      why: 'Proteggere dalla dispersione di calore è il primo trattamento dell’ipotermia.',
      sources: ['CORSO_TEMP', 'ERC_FA_2025'],
    },
    {
      id: 'ambiente',
      label: 'Riscaldamento passivo: ambiente chiuso e caldo',
      category: 'trattamento',
      points: 6,
      check: (s) => s.flags.ambienteCaldoAt !== undefined,
      why: 'Il riscaldamento è passivo e graduale: riparo, ambiente caldo, coperte.',
      sources: ['CORSO_TEMP'],
    },
    {
      id: 'orizzontale',
      label: 'Sempre sdraiata, nessuna frizione, caricata in orizzontale',
      category: 'trattamento',
      points: 14,
      critical: true,
      check: (s) => !s.flags.mossaBruscamente && !s.did('frizionare') && (s.transport === null || (s.transport.mode === 'barella' && (s.transport.position === 'supino' || s.transport.position === 'laterale'))),
      why: 'Nell’ipotermia grave il cuore è irritabile: metterla seduta, farla camminare o frizionarla può scatenare una fibrillazione ventricolare.',
      sources: ['CORSO_TEMP', 'ERC_FA_2025'],
    },
    {
      id: 'ossigeno',
      label: 'Ossigeno al 100% e saturazione (non leggibile) riferita',
      category: 'trattamento',
      points: 6,
      check: (s) => s.o2?.device === 'reservoir' && (s.flags.o2RiferitoAt !== undefined || !!s.report),
      why: 'Sotto i 35 °C il saturimetro non legge: nel paziente critico l’ossigeno si dà comunque ad alti flussi.',
      sources: ['CORSO_RESP', 'BTS_O2_2017'],
    },
  ],
  teaching: [
    'Mani bianche, nessun brivido, confusione, polso lento: è un’ipotermia grave, sotto i 32 °C.',
    'Il saturimetro sotto i 35 °C non legge: non è un guasto, sono le estremità fredde.',
    'Via il bagnato, coperte e telo, ambiente caldo: riscaldamento passivo e graduale.',
    'Sempre sdraiata e movimenti delicati: niente sedia, niente passi, niente frizioni.',
    'Si carica in orizzontale (barella a cucchiaio, materassino) e si trasporta in ambulanza riscaldata.',
  ],
  sources: ['CORSO_TEMP', 'ERC_FA_2025', 'CORSO_RESP'],
  hooks: {
    tick: (s) => {
      if (s.phase !== 'paziente' || s.ended || s.inArrest()) return;
      // dispersione o recupero di calore
      const protetta = s.flags.indumentiTolti !== undefined && s.covered;
      const caldo = s.flags.ambienteCaldoAt !== undefined;
      const rate = protetta && caldo ? 0.0004 : protetta || caldo ? -0.0003 : -0.0015;
      s.base.temp = Math.max(30.2, Math.min(33.5, s.base.temp + rate));
      // il polso segue la temperatura
      s.base.hr = drift(s.base.hr, s.base.temp < 31 ? 38 : 46, 0.05);
      if (s.base.temp < 30.8 && !s.flags.peggiorata) {
        s.set('peggiorata', s.t);
        s.p.avpu = 'P';
        s.p.speech = 'assente';
        s.say('paziente', 'Ines non risponde più alla voce: reagisce appena a uno stimolo doloroso. La pelle è sempre più fredda.');
      }
      if (protetta && caldo && s.base.temp > 31.8 && s.p.avpu === 'V' && !s.flags.migliora) {
        s.set('migliora', s.t);
        s.p.speech = 'confuso';
        s.say('paziente', 'Al caldo e sotto le coperte Ines apre gli occhi e sussurra il nome del figlio.');
      }
    },
    onAction: (s, id, params) => {
      const pos = String(params?.pos ?? '');
      const sedutaGrave = s.base.temp < 32 && (pos === 'seduto' || pos === 'semiseduto' || pos === 'in_piedi');
      if (id === 'posizione' && sedutaGrave && !s.flags.mossaBruscamente) {
        s.set('mossaBruscamente', s.t);
        s.penalize('ipotermia_seduta', 'critico', 'Paziente con ipotermia grave messa seduta', 'Nell’ipotermia grave il cuore è irritabile: cambiare bruscamente posizione o mettere seduta la paziente può scatenare una fibrillazione ventricolare.', ['ERC_FA_2025', 'CORSO_TEMP']);
        s.enterArrest('fv', 'Appena la sollevate Ines si irrigidisce, perde i sensi e smette di respirare normalmente.');
      }
      if (id === 'q_testimoni' || id === 'q_esordio') s.measure('esordio', 'Ultima volta vista bene', 'ieri sera alle 20, probabilmente caduta di notte');
      if (id === 'trasporta' && (String(params?.mode ?? 'barella') !== 'barella' || (params?.pos !== undefined && params.pos !== 'supino' && params.pos !== 'laterale'))) {
        s.set('mossaBruscamente', s.t);
        s.penalize('ipotermia_sedia', 'critico', 'Trasportata seduta o a piedi', 'Con un’ipotermia grave si trasporta sdraiata, movimenti minimi e delicati.', ['ERC_FA_2025', 'CORSO_TEMP']);
      }
    },
    outcome: (s) => {
      if (s.inArrest()) return { status: 'decesso', title: 'Arresto nell’ipotermia', text: 'La fibrillazione ventricolare non si è risolta: nell’ipotermia grave il cuore risponde male allo shock. La rianimazione prosegue in ospedale, ma la prognosi è severa.' };
      if (s.flags.mossaBruscamente || s.arrest.roscAt !== null)
        return { status: 'critico', title: 'Fibrillazione da mobilizzazione', text: 'Mettere seduta o caricare bruscamente una paziente così fredda ha scatenato un’aritmia. Ines arriva in rianimazione dopo una RCP.' };
      const t = s.p.v.temp.toFixed(1).replace('.', ',');
      if (s.covered && s.flags.indumentiTolti !== undefined && s.flags.ambienteCaldoAt !== undefined)
        return { status: 'ottimo', title: 'Riscaldamento in ospedale', text: `Asciutta, coperta e mossa sempre in orizzontale, Ines arriva in pronto soccorso a ${t} °C, senza aritmie: verrà riscaldata in modo controllato.` };
      return { status: 'buono', title: 'Ancora fredda', text: `Ines arriva in ospedale a ${t} °C: senza togliere il bagnato e senza riscaldare l’ambiente la dispersione di calore è continuata.` };
    },
  },
};
