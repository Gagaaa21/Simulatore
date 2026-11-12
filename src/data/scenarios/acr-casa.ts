import type { Scenario } from '../../engine/types';

/** Arresto cardiaco testimoniato a domicilio, FV, RCP già avviata dalla moglie guidata dal 112. */
export const acrCasa: Scenario = {
  id: 'acr-casa',
  title: 'Crollo sul divano',
  subtitle: 'Arresto cardiaco a domicilio, RCP guidata dal telefono già in corso',
  category: '118',
  difficulty: 1,
  minutes: 12,
  setting: 'casa',
  timeOfDay: 'sera',
  role: 'msb',
  crew: 3,
  dispatch: {
    luogo: 'K',
    patologia: 'C2',
    criticita: 'R',
    address: 'Via dei Mille 14, terzo piano con ascensore',
    caller: 'Moglie del paziente',
    time: '21:47',
    text: 'Uomo di 64 anni crollato sul divano mentre guardava la TV. Non risponde, «respira in modo strano». L’operatore sta guidando la moglie nelle compressioni al telefono.',
    extra: 'Centrale: «Inviata anche l’automedica, arrivo stimato tra 9 minuti».',
  },
  loadout: {
    essential: ['zaino', 'dae', 'pallone', 'ossigeno'],
    recommended: ['aspiratore'],
    fetchTime: 150,
    note: 'Codice rosso C2 con persona che non risponde: DAE, pallone, ossigeno e aspiratore vanno portati subito al paziente.',
  },
  scene: {
    intro: 'Soggiorno illuminato dalla TV. Il paziente è a terra tra il divano e il tavolino; la moglie, in ginocchio, sta comprimendo il torace seguendo le istruzioni dell’operatore al telefono.',
    hazards: [],
    bystanders: 'La moglie, molto agitata, fa le compressioni con il telefono in vivavoce.',
  },
  patient: {
    name: 'Mario',
    age: 64,
    sex: 'M',
    weightKg: 86,
    avpu: 'U',
    gcs: 3,
    airway: 'pervie',
    breathing: 'agonico',
    rhythm: 'fv',
    pulseRadial: false,
    v: { hr: 0, rr: 0, spo2: 62, sbp: 0, dbp: 0, glu: 128, temp: 36.4, crt: 6 },
    spo2Air: 60,
    skin: { color: 'grigiastra', temp: 'normale', sweaty: true },
    pupils: 'midriatiche',
    speech: 'assente',
    position: 'supino',
    canSwallow: false,
    seizing: false,
    vomitInMouth: false,
    look: { skinTone: '#d8a47f', hair: '#a7adb3', hairStyle: 'corti', shirt: '#3c6e9f', pants: '#3a3a48', build: 'robusto' },
  },
  trauma: false,
  arrest: { shockable: true, roscAfterShocks: 2 },
  answers: {
    testimoni: '[Moglie] Guardava la partita, ha detto che si sentiva oppresso al petto, poi si è accasciato. Saranno cinque minuti, ho chiamato subito.',
    eventi: '[Moglie] Si è portato la mano al petto ed è crollato. Ha fatto due o tre scatti con le braccia, poi più niente.',
    patologie: '[Moglie] È iperteso, fuma, l’anno scorso gli hanno messo uno stent al cuore.',
    farmaci: '[Moglie] Cardioaspirina, ramipril e una statina.',
    allergie: '[Moglie] Nessuna allergia che io sappia.',
    pasto: '[Moglie] Ha cenato verso le otto.',
    esordio: '[Moglie] Alle 21:42 circa.',
  },
  exam: {
    testaPiedi: 'Nessun segno di trauma. Cute grigiastra, marezzata agli arti inferiori. Nessun cerotto transdermico.',
    cavoOrale: 'Cavo orale libero. Protesi dentaria fissa, ben ancorata.',
    torace: 'Nessun movimento respiratorio efficace; cicatrice da pregresso intervento assente.',
  },
  protocol: { correct: ['bls_adulto'] },
  valutazione: { correct: ['I3'] },
  reportKeys: [],
  msa: { available: true, eta: 540, autoDispatched: true, label: 'L’automedica' },
  timeLimit: 1200,
  objectives: [
    {
      id: 'riconosci',
      label: 'Arresto confermato (coscienza e respiro) entro 30 s dal contatto',
      category: 'valutazione',
      points: 10,
      critical: true,
      check: (s) => {
        const c = Number(s.flags.contattoAt ?? 1e9);
        const r = Number(s.flags.arrestoRiconosciutoAt ?? 1e9);
        return r - c <= 30;
      },
      why: 'Non risponde e non respira normalmente = arresto cardiaco. La verifica non deve durare più di 10 secondi.',
      sources: ['ERC_BLS_2025'],
    },
    {
      id: 'subentro',
      label: 'Compressioni prese in carico dall’equipaggio senza interruzioni lunghe (entro 20 s dalla conferma)',
      category: 'trattamento',
      points: 10,
      critical: true,
      check: (s) => Number(s.flags.crewCprAt ?? 1e9) - Number(s.flags.arrestoRiconosciutoAt ?? 0) <= 20,
      why: 'Ogni pausa delle compressioni riduce la perfusione di cuore e cervello.',
      sources: ['ERC_BLS_2025'],
    },
    {
      id: 'dae',
      label: 'DAE acceso e piastre applicate entro 90 s dal contatto',
      category: 'tempi',
      points: 12,
      critical: true,
      check: (s) => Number(s.flags.padsAt ?? 1e9) - Number(s.flags.contattoAt ?? 0) <= 90 && s.aed.pads !== null && s.aed.pads !== 'errata',
      why: 'La defibrillazione precoce è l’intervento che più aumenta la sopravvivenza in fibrillazione ventricolare.',
      sources: ['ERC_BLS_2025', 'ERC_LAY_2025'],
    },
    {
      id: 'shock',
      label: 'Shock erogato appena consigliato',
      category: 'trattamento',
      points: 8,
      check: (s) => s.aed.shocks >= 1 && !s.penalties.some((p) => p.id === 'slow_shock'),
      why: 'Ogni minuto di ritardo nella defibrillazione riduce la sopravvivenza di circa il 10%.',
      sources: ['ERC_LAY_2025'],
    },
    {
      id: 'ripresa',
      label: 'Compressioni riprese entro 10 s da ogni shock',
      category: 'trattamento',
      points: 8,
      check: (s) => s.arrest.shockToCpr.length > 0 && s.arrest.shockToCpr.every((d) => d <= 10),
      why: 'Dopo lo shock il cuore non pompa subito in modo efficace: si riprende la RCP senza cercare il polso.',
      sources: ['ERC_BLS_2025'],
    },
    {
      id: 'ventilazione',
      label: 'Ventilazione con pallone collegato all’ossigeno ad alti flussi',
      category: 'trattamento',
      points: 6,
      check: (s) => s.did('pallone') && !!s.o2 && s.o2.flow >= 10,
      why: 'L’equipaggio addestrato ventila con pallone e maschera arricchiti di ossigeno (30:2).',
      sources: ['ERC_BLS_2025'],
    },
    {
      id: 'cambio',
      label: 'Cambio del compressore circa ogni 2 minuti',
      category: 'trattamento',
      points: 5,
      check: (s) => !s.flags.fatica && s.did('cambio_compressore'),
      why: 'La qualità delle compressioni cala già dopo 2 minuti per l’affaticamento.',
      sources: ['ERC_BLS_2025'],
    },
    {
      id: 'pause',
      label: 'Pause delle compressioni ridotte al minimo (< 45 s totali dopo il contatto)',
      category: 'tempi',
      points: 6,
      check: (s) => Number(s.flags.pauseDopoContatto ?? 0) < 45,
      why: 'Le uniche pause accettabili sono quelle per analisi e shock del DAE e per le ventilazioni.',
      sources: ['ERC_BLS_2025'],
    },
    {
      id: 'post_rosc',
      label: 'Dopo il ritorno del circolo: compressioni sospese, respiro rivalutato e ossigeno titolato',
      category: 'valutazione',
      points: 8,
      check: (s) => {
        const r = s.arrest.roscAt;
        if (r === null) return false;
        const gas = (s.doneAt.get('gas') ?? []).some((t) => t > r) || (s.doneAt.get('rivaluta') ?? []).some((t) => t > r);
        return gas && !s.cpr.active && !!s.o2;
      },
      why: 'Con segni di vita si interrompe la RCP, si rivaluta l’ABCDE e si tengono le piastre attaccate, pronti a ricominciare.',
      sources: ['ERC_BLS_2025'],
    },
    {
      id: 'consegne',
      label: 'Consegne passate all’automedica',
      category: 'comunicazione',
      points: 4,
      check: (s) => s.ended?.reason === 'Consegna al mezzo avanzato',
      why: 'Un passaggio di consegne strutturato evita perdite di informazioni (orari, shock, farmaci assunti).',
      sources: [],
    },
  ],
  teaching: [
    'Quando un astante sta già comprimendo, prendi il suo posto senza fermare la RCP e conferma l’arresto in pochi secondi.',
    'Il respiro agonico (gasping) è un segno di arresto, non di vita. Anche brevi scatti simil-convulsivi all’esordio sono frequenti.',
    'Il DAE va acceso e collegato appena arriva al paziente: in fibrillazione ventricolare ogni minuto conta.',
    'Dopo lo shock riprendi subito le compressioni, senza cercare il polso.',
    'Cambia compressore ogni 2 minuti, approfittando dell’analisi del DAE.',
    'Dopo il ritorno del circolo lascia le piastre attaccate, dai ossigeno con target di SpO₂ 94–98% e rivaluta continuamente.',
  ],
  sources: ['ERC_BLS_2025', 'ERC_LAY_2025', 'DM_1992'],
  hooks: {
    onStart: (s) => {
      s.arrest.startedAt = -300;
      s.arrest.noFlow = 60;
      s.arrest.lowFlow = 240;
      s.cpr.active = true;
      s.cpr.by = 'astante';
      s.cpr.quality = 0.5;
      s.cpr.startedAt = -240;
      s.cpr.segmentStart = -240;
      s.cpr.compressorSince = -240;
      s.cpr.ratio = 'solo_compressioni';
    },
    tick: (s) => {
      const r = s.arrest.roscAt;
      if (r !== null) {
        if (s.t - r === 30 && s.cpr.active) s.hint('Il paziente si muove e respira: sospendi le compressioni e rivaluta il respiro.');
        if (s.t - r === 180 && s.p.avpu === 'U') {
          s.p.avpu = 'P';
          s.say('paziente', 'Il paziente emette un lamento e ritrae il braccio allo stimolo.');
        }
        if (s.t - r > 20 && s.cpr.active) s.set('cprDopoRosc', Number(s.flags.cprDopoRosc ?? 0) + 1);
      }
    },
    outcome: (s) => {
      if (s.arrest.roscAt !== null && !s.inArrest()) {
        const firstShock = s.aed.lastShockAt !== null && s.aed.firstAnalysisAt !== null ? s.aed.firstAnalysisAt - Number(s.flags.contattoAt ?? 0) : 999;
        return firstShock <= 90
          ? { status: 'ottimo', title: 'ROSC: il cuore riparte', text: 'Grazie alla RCP della moglie e alla defibrillazione precoce, Mario arriva in emodinamica con circolo spontaneo. È la catena della sopravvivenza che funziona.' }
          : { status: 'buono', title: 'ROSC dopo una rianimazione prolungata', text: 'Il circolo è ripartito, ma il ritardo nella defibrillazione aumenta il rischio di danno neurologico.' };
      }
      if (s.inArrest()) {
        return s.aed.shocks === 0
          ? { status: 'decesso', title: 'Nessuno shock erogato', text: 'In fibrillazione ventricolare senza defibrillazione le probabilità di sopravvivenza crollano minuto dopo minuto.' }
          : { status: 'critico', title: 'Arresto refrattario', text: 'La rianimazione prosegue con l’équipe dell’automedica.' };
      }
      return { status: 'buono', title: 'Paziente affidato', text: 'Il paziente è stato affidato all’équipe avanzata.' };
    },
  },
};
