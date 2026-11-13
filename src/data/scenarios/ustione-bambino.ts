import type { Scenario } from '../../engine/types';
import { afterContact, contact, drift, flagT } from './helpers';

/** Ustione da liquido bollente in una bambina di 3 anni: raffreddamento, ipotermia, medicazione. */
export const ustioneBambino: Scenario = {
  id: 'ustione-bambino',
  title: 'Il manico della pentola',
  subtitle: 'Bambina di 3 anni ustionata dall’acqua bollente in cucina',
  category: '118',
  difficulty: 2,
  minutes: 12,
  setting: 'casa',
  timeOfDay: 'sera',
  role: 'msb',
  crew: 3,
  dispatch: {
    luogo: 'K',
    patologia: 'C1',
    criticita: 'G',
    address: 'Via dei Mille 14, terzo piano',
    caller: 'La madre',
    time: '19:42',
    travel: 420,
    text: 'Bambina di tre anni si è rovesciata addosso una pentola d’acqua bollente dal fornello. Piange forte, ha il petto e un braccio rossi. La madre è molto agitata.',
  },
  loadout: {
    essential: ['zaino', 'kit_ustioni'],
    recommended: ['ossigeno'],
    fetchTime: 120,
    note: 'Ustione in un bambino: kit ustioni per la medicazione e telo isotermico (nello zaino) contro l’ipotermia. Terzo piano: un presidio dimenticato costa due minuti.',
  },
  scene: {
    room: 'cucina',
    decor: ['pentola'],
    intro: 'Cucina, odore di brodo. Una pentola è rovesciata accanto ai fornelli e sul pavimento fuma ancora una pozza d’acqua; un fornello è acceso. La madre ha steso la bambina a terra vicino al tavolo: piange disperata. La nonna arriva con un panetto di burro.',
    hazards: [
      {
        id: 'fornello',
        label: 'Fornello ancora acceso e acqua bollente sul pavimento',
        fixAction: 'spegni_fonte',
        consequence: 'Inginocchiandoti nella pozza ti scotti e rischi di scivolare con la bambina in braccio.',
      },
    ],
    bystanders: 'La madre e la nonna.',
  },
  patient: {
    name: 'Giulia',
    age: 3,
    sex: 'F',
    weightKg: 14,
    avpu: 'A',
    gcs: 15,
    airway: 'pervie',
    breathing: 'tachipnoico',
    rhythm: 'tachicardia',
    pulseRadial: true,
    v: { hr: 156, rr: 34, spo2: 98, sbp: 96, dbp: 58, glu: 112, temp: 36.9, crt: 2 },
    skin: { color: 'rosea', temp: 'normale', sweaty: false },
    pupils: 'normali',
    speech: 'pianto',
    position: 'supino',
    canSwallow: true,
    seizing: false,
    vomitInMouth: false,
    look: { skinTone: '#f1cfb4', hair: '#6b4528', hairStyle: 'bimbo', shirt: '#f2a7c3', pants: '#5a78ad', build: 'bambino', top: 'tshirt', sleeves: 'corte', shoes: '#e9e4f0' },
  },
  trauma: false,
  answers: {
    eventi: '[Madre] Ha tirato il manico della pentola che sporgeva dal fornello… l’acqua bolliva per il brodo. Le è finita sul petto e sul braccio.',
    esordio: '[Madre] Cinque minuti fa, al massimo. Ho chiamato subito.',
    sintomi: '(piange) Bruciaaa! Mamma, brucia!',
    dolore: '[Madre] Il petto e il braccio destro, non si fa toccare.',
    allergie: '[Madre] Nessuna allergia.',
    farmaci: '[Madre] Niente.',
    patologie: '[Madre] Mai avuto niente, ha fatto tutti i vaccini.',
    pasto: '[Madre] Ha fatto merenda alle cinque.',
    testimoni: '[Nonna] Ho portato il burro: una volta si faceva così, toglie il bruciore…',
  },
  exam: {
    testaPiedi: 'Ustione da liquido bollente sul torace anteriore e sull’avambraccio destro: cute rossa, umida, con alcune vesciche. Viso, collo, mani e genitali risparmiati. Nessun altro trauma.',
    torace: 'Espansione simmetrica, respiro frequente per il pianto. Nessun segno di inalazione: voce e tosse normali, niente fuliggine.',
    extra: {
      ustione: 'Con la regola del palmo (il palmo della bambina, dita comprese, vale circa l’1% della superficie corporea) l’ustione copre circa il 9%: torace anteriore e avambraccio destro. Cute rossa, umida e dolente, con vesciche: ustione a spessore parziale.',
      superficie: 'circa 9% (torace e avambraccio dx)',
    },
  },
  protocol: { correct: ['ustioni'] },
  valutazione: { correct: ['I2'] },
  reportKeys: ['ustione', 'fc'],
  msa: { available: true, eta: 720, label: 'L’automedica' },
  timeLimit: 1500,
  objectives: [
    {
      id: 'raffredda',
      label: 'Raffreddamento con acqua corrente fresca entro 2 minuti dal contatto',
      category: 'trattamento',
      points: 14,
      critical: true,
      check: (s) => afterContact(s, 'raffredda_ustione') <= 120,
      why: 'Raffreddare subito, per almeno 20 minuti, con acqua corrente fresca (non ghiacciata) riduce la profondità dell’ustione e il dolore.',
      sources: ['ERC_FA_2025'],
    },
    {
      id: 'indumenti',
      label: 'Indumenti bagnati tolti, senza strappare ciò che è adeso',
      category: 'trattamento',
      points: 6,
      check: (s) => s.did('rimuovi_indumenti'),
      why: 'La maglietta intrisa d’acqua bollente continua a cedere calore alla pelle. Quello che è attaccato alla cute si lascia.',
      sources: ['ERC_FA_2025'],
    },
    {
      id: 'ipotermia',
      label: 'Resto del corpo coperto durante il raffreddamento',
      category: 'trattamento',
      points: 10,
      check: (s) => s.covered && s.p.v.temp >= 36,
      why: 'Nei bambini il raffreddamento di un’area estesa può causare ipotermia: si raffredda l’ustione e si tiene al caldo il resto del corpo.',
      sources: ['ERC_FA_2025'],
    },
    {
      id: 'medicazione',
      label: 'Ustione coperta dopo il raffreddamento con pellicola o medicazione non aderente',
      category: 'trattamento',
      points: 8,
      check: (s) => {
        const r = flagT(s, 'ustioneRaffreddataAt');
        const c = flagT(s, 'ustioneCopertaAt');
        return r !== null && c !== null && c >= r;
      },
      why: 'La medicazione pulita e non aderente, o la pellicola appoggiata senza stringere, protegge la ferita e riduce il dolore all’aria.',
      sources: ['ERC_FA_2025'],
    },
    {
      id: 'rassicura',
      label: 'Bambina e madre rassicurate, la madre resta accanto',
      category: 'comunicazione',
      points: 4,
      check: (s) => s.did('rassicura'),
      why: 'Il primo soccorso comprende il sostegno psicologico: un bambino spaventato si calma meglio con il genitore vicino.',
      sources: ['ERC_FA_2025'],
    },
  ],
  teaching: [
    'Scena: spegni la fonte di calore e allontana l’acqua bollente prima di inginocchiarti.',
    'Raffredda subito con acqua corrente fresca, per almeno 20 minuti: niente ghiaccio, niente burro, olio o dentifricio.',
    'Togli indumenti bagnati, anelli e braccialetti; lascia ciò che è attaccato alla pelle.',
    'Nei bambini l’ipotermia arriva presto: raffredda solo l’ustione e copri il resto del corpo.',
    'Dopo il raffreddamento copri con pellicola appoggiata a strisce o con una medicazione non aderente.',
    'Stima l’estensione con la regola del palmo e comunicala alla Centrale: orienta verso il centro adatto.',
  ],
  sources: ['ERC_FA_2025'],
  hooks: {
    onStart: (s) => {
      s.set('ustione', true);
    },
    tick: (s) => {
      if (s.phase !== 'paziente' || s.ended) return;
      const r = flagT(s, 'ustioneRaffreddataAt');
      const cooling = r !== null && s.t - r < 1200;
      // dolore: si attenua con il raffreddamento e la medicazione
      const target = cooling || s.flags.ustioneCopertaAt !== undefined ? (s.did('rassicura') ? 124 : 134) : 162;
      s.base.hr = drift(s.base.hr, target, 0.15);
      s.base.rr = drift(s.base.rr, target < 140 ? 26 : 36, 0.03);
      if (cooling && s.t - r! > 90 && s.p.speech === 'pianto') {
        s.p.speech = 'lamento';
        s.say('paziente', 'Sotto l’acqua fresca Giulia smette di urlare: ora piagnucola, stretta alla mano della madre.');
      }
      // ipotermia: il raffreddamento di un bambino scoperto lo raffredda tutto
      if (cooling) {
        let loss = s.covered ? 0.00025 : 0.0014;
        if (s.flags.ghiaccioAt !== undefined) loss += 0.0006;
        s.base.temp = Math.max(34.6, s.base.temp - loss);
      }
      if (s.base.temp < 35.6 && !s.flags.brividi) {
        s.set('brividi', s.t);
        s.p.skin = { ...s.p.skin, color: 'pallida', temp: 'fredda' };
        s.say('paziente', 'Giulia trema, ha le labbra violacee e la pelle delle gambe fredda.');
        s.hint('Sta diventando ipotermica: raffredda solo l’ustione e copri il resto del corpo.');
      }
      // ustione che si approfondisce senza raffreddamento
      const c = contact(s);
      if (r === null && c < 1e8 && s.t - c === 300 && !s.flags.approfondita) {
        s.set('approfondita', s.t);
        s.say('paziente', 'Le vesciche sul petto si allargano: senza raffreddamento il calore continua a lavorare nei tessuti.');
      }
    },
    outcome: (s) => {
      if (s.p.v.temp < 35.6)
        return { status: 'critico', title: 'Ipotermia', text: `Giulia arriva in ospedale a ${s.p.v.temp.toFixed(1).replace('.', ',')} °C: il raffreddamento è servito per l’ustione, ma senza coprirla il freddo ha colpito tutto il corpo.` };
      if (s.flags.approfondita !== undefined || s.flags.ghiaccioAt !== undefined)
        return { status: 'buono', title: 'Ustione più profonda del necessario', text: 'Giulia arriva in ospedale stabile, ma il raffreddamento tardivo o il ghiaccio hanno peggiorato l’ustione: serviranno più medicazioni.' };
      if (s.covered && s.flags.ustioneCopertaAt !== undefined)
        return { status: 'ottimo', title: 'Centro ustioni pediatrico', text: 'Raffreddata subito, tenuta al caldo e medicata, Giulia arriva tranquilla e normotermica. L’ustione è a spessore parziale e ha buone probabilità di guarire senza innesti.' };
      return { status: 'buono', title: 'In pronto soccorso pediatrico', text: 'Giulia arriva in ospedale stabile.' };
    },
  },
};
