import type { Sim } from '../../engine/engine';
import type { Scenario } from '../../engine/types';
import { contact, drift } from './helpers';

/** Carbossiemoglobina simulata (%), dal flag dello scenario. */
const coHb = (s: Sim) => Number(s.flags.coHb ?? 30);

/** Intossicazione da monossido in casa: sicurezza della scena, saturimetro ingannevole, ossigeno al 100%, altri coinvolti. */
export const monossido: Scenario = {
  id: 'monossido',
  title: 'Mal di testa in famiglia',
  subtitle: 'Caldaia a gas in cucina, finestre chiuse: la saturazione dice 99%',
  category: '118',
  difficulty: 2,
  minutes: 12,
  setting: 'casa',
  timeOfDay: 'sera',
  role: 'msb',
  crew: 2,
  dispatch: {
    luogo: 'K',
    patologia: 'C7',
    criticita: 'G',
    address: 'Gemona del Friuli, via Bariglaria 18, primo piano',
    caller: 'Il marito',
    time: '20:05',
    travel: 480,
    text: 'Donna di 38 anni a terra in cucina, confusa, ha vomitato. Il marito dice che anche lui ha mal di testa da stamattina.',
    extra: 'SORES: «Inviamo la vostra BLS; l’ALS è in uscita, arrivo stimato 9 minuti».',
  },
  loadout: {
    essential: ['zaino', 'ossigeno'],
    recommended: ['aspiratore', 'pallone'],
    fetchTime: 90,
    note: 'Paziente confusa che ha vomitato: oltre allo zaino servono l’ossigeno e qualcosa per proteggere le vie aeree.',
  },
  scene: {
    room: 'cucina',
    decor: ['caldaia'],
    intro:
      'Appena il marito apre la porta senti un caldo stagnante: le finestre sono chiuse e la caldaia murale in cucina è accesa, con una macchia scura di fuliggine sopra. La donna è a terra accanto al tavolo, supina e confusa; sul pavimento c’è del vomito. Il marito è pallido e si tiene la testa.',
    hazards: [
      {
        id: 'monossido',
        label: 'Possibile monossido di carbonio: caldaia accesa, finestre chiuse, più persone con mal di testa',
        fixAction: 'arieggia',
        consequence: 'Dopo pochi minuti in cucina anche tu e il collega avete mal di testa e nausea: il monossido non ha odore né colore.',
      },
    ],
    bystanders: 'Il marito, con mal di testa e nausea.',
  },
  patient: {
    name: 'Sara',
    age: 38,
    sex: 'F',
    weightKg: 62,
    avpu: 'V',
    gcs: 13,
    airway: 'pervie',
    breathing: 'tachipnoico',
    rhythm: 'tachicardia',
    pulseRadial: true,
    v: { hr: 118, rr: 24, spo2: 99, sbp: 128, dbp: 80, glu: 112, temp: 36.8, crt: 2 },
    skin: { color: 'arrossata', temp: 'normale', sweaty: false },
    pupils: 'normali',
    speech: 'confuso',
    position: 'supino',
    canSwallow: true,
    seizing: false,
    vomitInMouth: false,
    look: { skinTone: '#eac3a2', hair: '#4a2e1c', hairStyle: 'lunghi', shirt: '#7a9cc6', pants: '#3a3f4f', build: 'adulto', top: 'felpa', shoes: '#5a4a3e' },
    spo2Air: 99,
  },
  trauma: false,
  answers: {
    eventi: '(confusa) Stavo cucinando… mi girava la testa… poi non so.',
    sintomi: 'Mal di testa… fortissimo. Ho vomitato. Mi sento… strana.',
    dolore: 'La testa, tutta. Pulsa.',
    allergie: '[Marito] No, niente.',
    farmaci: '[Marito] Niente, al massimo un antidolorifico per il mal di testa: da stamattina ce l’abbiamo tutti e due.',
    patologie: '[Marito] Sana, mai avuto niente.',
    pasto: '[Marito] Stava preparando la cena.',
    esordio: '[Marito] Il mal di testa da stamattina; è caduta un quarto d’ora fa.',
    testimoni: '[Marito] Abbiamo tenuto tutto chiuso per il freddo, la caldaia va da giorni… Anch’io ho mal di testa e nausea. Nostra figlia Emma, nove anni, è a letto in camera: è andata a dormire presto, diceva che le girava la testa.',
  },
  exam: {
    testaPiedi: 'Nessun trauma evidente: è scivolata a terra dalla sedia. Cute rosea, quasi arrossata. Vomito sul pavimento, bocca libera.',
    torace: 'Respiro frequente, regolare, espansione simmetrica.',
    cavoOrale: 'Bocca libera, nessun residuo di vomito.',
  },
  protocol: { correct: ['monossido'], acceptable: ['intossicazione'] },
  valutazione: { correct: ['I2'] },
  reportKeys: ['coinvolti', 'avpu'],
  msa: { available: true, eta: 540, autoDispatched: true, label: 'L’ALS' },
  oxygen: { co: true },
  timeLimit: 1500,
  objectives: [
    {
      id: 'arieggia',
      label: 'Ambiente arieggiato e occupanti fatti uscire prima di entrare a soccorrere',
      category: 'sicurezza',
      points: 10,
      critical: true,
      check: (s) => s.flags.fix_arieggia !== undefined && (s.firstAt('arieggia') ?? 1e9) <= contact(s),
      why: 'Il monossido non si vede e non si sente: chi entra senza arieggiare diventa la prossima vittima.',
      sources: ['CORSO_RESP', 'ERC_FA_2025'],
    },
    {
      id: 'vvf',
      label: 'Vigili del fuoco richiesti per la misurazione e la messa in sicurezza',
      category: 'sicurezza',
      points: 6,
      check: (s) => s.requests.vvf !== undefined,
      why: 'Solo i Vigili del fuoco possono misurare il CO e mettere in sicurezza l’impianto.',
      sources: ['SORES_FVG'],
    },
    {
      id: 'ossigeno',
      label: 'Ossigeno al 100% entro 3 minuti, nonostante una SpO₂ del 99%',
      category: 'trattamento',
      points: 14,
      critical: true,
      check: (s) => {
        const t = s.flags.o2At === undefined ? null : Number(s.flags.o2At);
        return t !== null && t - contact(s) <= 180 && s.o2?.device === 'reservoir' && s.o2.flow >= 12;
      },
      why: 'Il saturimetro non distingue il monossido dall’ossigeno: legge valori normali anche in un’intossicazione grave. L’ossigeno al 100% accelera l’eliminazione del CO.',
      sources: ['CORSO_RESP', 'BTS_O2_2017'],
    },
    {
      id: 'altri',
      label: 'Chieste e riferite le altre persone coinvolte',
      category: 'comunicazione',
      points: 8,
      check: (s) => s.did('q_testimoni') && !!s.report?.items.includes('coinvolti'),
      why: 'Il monossido colpisce tutta la casa: chi dorme in un’altra stanza è il più a rischio. La SORES deve sapere quante persone sono coinvolte.',
      sources: ['SORES_FVG'],
    },
  ],
  teaching: [
    'Inverno, caldaia o stufa, finestre chiuse, più persone con mal di testa: pensa al monossido.',
    'Prima la tua sicurezza: arieggia e fai uscire tutti, niente interruttori né fiamme; chiedi i Vigili del fuoco.',
    'Il saturimetro legge 98–99% anche nell’intossicazione grave: non rassicura.',
    'Ossigeno al 100% con reservoir a 15 L/min, in autonomia: è un’emergenza.',
    'Chiedi chi altro era in casa, anche chi dorme: riferiscilo alla SORES.',
  ],
  sources: ['CORSO_RESP', 'BTS_O2_2017', 'SORES_FVG'],
  hooks: {
    onStart: (s) => {
      s.set('coHb', 30);
    },
    tick: (s) => {
      if (s.ended) return;
      // carbossiemoglobina: sale nell'ambiente saturo, scende all'aria e molto più in fretta con l'ossigeno al 100%
      const aria = s.flags.fix_arieggia !== undefined;
      const o2 = s.o2?.device === 'reservoir' && s.o2.flow >= 12;
      const d = !aria ? 0.012 : o2 ? -0.03 : -0.004;
      s.set('coHb', Math.max(8, Math.min(48, coHb(s) + d)));
      const c = coHb(s);
      const p = s.p;
      if (s.phase !== 'paziente' || s.inArrest()) return;
      // la saturazione resta alta: il saturimetro non vede il CO
      p.spo2Air = 99;
      s.base.hr = drift(s.base.hr, 90 + c, 0.1);
      if (c >= 36 && p.avpu === 'V') {
        p.avpu = 'P';
        p.speech = 'lamento';
        s.say('paziente', 'Sara non risponde più alla voce: geme solo allo stimolo doloroso.');
      }
      if (c < 33 && p.avpu === 'P') {
        p.avpu = 'V';
        p.speech = 'confuso';
        s.say('paziente', 'Sara riapre gli occhi e risponde a fatica.');
      }
      if (c < 22 && p.avpu === 'V') {
        p.avpu = 'A';
        p.speech = 'normale';
        p.breathing = 'normale';
        s.base.rr = 18;
        s.say('paziente', 'Con l’ossigeno Sara si orienta: «Dove sono? Che mal di testa…».');
      }
    },
    onAction: (s, id) => {
      if (id === 'q_testimoni') {
        s.measure('coinvolti', 'Altre persone coinvolte', 'marito con cefalea e nausea; figlia di 9 anni a letto con vertigini');
        if (!s.flags.figliaFuori) {
          s.set('figliaFuori', s.t);
          s.say('evento', 'Il collega va in camera: Emma è assonnata e lamenta mal di testa. La porta fuori, all’aria aperta, con il papà.');
        }
      }
      if (id === 'saturimetro' && s.flags.saturimetroVisto === undefined) s.set('saturimetroVisto', s.t);
    },
    outcome: (s) => {
      if (!s.flags.figliaFuori)
        return { status: 'critico', title: 'Una persona dimenticata', text: 'Sara arriva in ospedale, ma nessuno ha chiesto chi altro c’era in casa: i Vigili del fuoco trovano la figlia di nove anni, intossicata, solo un’ora dopo.' };
      if (s.p.avpu === 'P' || s.p.avpu === 'U' || s.flags.o2At === undefined)
        return { status: 'critico', title: 'Intossicazione non trattata', text: 'Rassicurati da una saturazione del 99%, l’ossigeno ad alti flussi è arrivato tardi: Sara arriva in ospedale ancora confusa, candidata alla camera iperbarica.' };
      if (s.flags.hazard_monossido !== undefined || s.penalties.some((p) => p.id === 'hazard_monossido'))
        return { status: 'buono', title: 'Paziente salvata, equipaggio intossicato', text: 'Sara migliora con l’ossigeno, ma tu e il collega siete entrati nell’ambiente saturo: anche voi finite al controllo in pronto soccorso.' };
      return { status: 'ottimo', title: 'Tutta la famiglia al sicuro', text: 'Ambiente arieggiato, ossigeno al 100% nonostante il 99% del saturimetro, figlia e marito fuori casa: la famiglia va in ospedale per il dosaggio della carbossiemoglobina. I Vigili del fuoco misurano 400 ppm in cucina: la canna fumaria era ostruita.' };
    },
  },
};
