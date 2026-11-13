import type { Scenario } from '../../engine/types';
import type { Sim } from '../../engine/engine';
import { ipoglicemia } from './ipoglicemia';

/** Missione guidata: lo stesso caso dell'ipoglicemia, senza peggioramento, per imparare i comandi. */
export const tutorial: Scenario = {
  ...ipoglicemia,
  id: 'tutorial',
  tutorial: true,
  title: 'Prima missione guidata',
  subtitle: 'Impara i comandi su un caso semplice, con una guida passo per passo',
  difficulty: 1,
  minutes: 8,
  timeLimit: 2400,
  msa: { available: true, eta: 240, label: 'L’ALS', onReport: true },
  // nella guida i tempi non contano: conta fare i passi giusti
  objectives: ipoglicemia.objectives.map((o) =>
    o.id === 'anamnesi'
      ? { ...o, label: 'Diabete in terapia con insulina raccolto in anamnesi', check: (s: Sim) => s.didAny('q_farmaci', 'q_pasto', 'q_testimoni') }
      : o.id === 'sores_presto'
        ? { ...o, label: 'SORES informata con la valutazione', check: (s: Sim) => s.report !== null }
        : o,
  ),
  hooks: {
    ...ipoglicemia.hooks,
    // nella missione guidata il paziente non peggiora: si imparano i comandi con calma
    tick: (s: Sim) => {
      const p = s.p;
      if (s.flags.glucosioEv !== undefined) {
        s.base.glu = Math.min(112, s.base.glu + 0.15);
        if (s.base.glu > 80 && p.speech === 'confuso') {
          p.speech = 'normale';
          p.skin = { color: 'rosea', temp: 'normale', sweaty: false };
          s.base.hr = 86;
          s.say('paziente', 'Il paziente si guarda intorno: «Che è successo? Ho fatto l’insulina e non ho mangiato…».');
        }
      }
    },
  },
};

export interface GuideStep {
  text: string;
  target: string;
  done: (s: Sim) => boolean;
}

export const TUTORIAL_STEPS: GuideStep[] = [
  { text: 'Prima di tutto la scena: premi «Valuta la sicurezza della scena» tra le azioni del gruppo Scena.', target: '[data-action="valuta_scena"]', done: (s) => s.did('valuta_scena') },
  { text: 'Proteggiti: indossa i guanti prima di toccare il paziente.', target: '[data-action="guanti"]', done: (s) => s.did('guanti') },
  { text: 'La scena è sicura: avvicinati al paziente.', target: '[data-action="avvicinati"]', done: (s) => s.did('avvicinati') },
  { text: 'Apri la scheda Valutazione e valuta la coscienza: chiamalo e toccagli le spalle.', target: '.tab-valutazione, [data-action="coscienza"]', done: (s) => s.did('coscienza') },
  { text: 'Nella scheda Parametri applica il saturimetro (puoi anche cliccare sul braccio destro del paziente nella scena). Il valore compare sul monitor.', target: '.tab-parametri, [data-action="saturimetro"]', done: (s) => s.pulseOx },
  { text: 'Fuori dall’emergenza l’ossigeno lo decide la SORES: in Trattamenti, sezione «Ossigeno e ventilazione», premi «Riferisci la SpO₂ alla SORES» e ascolta la risposta.', target: '.tab-trattamenti, .sec-ossigeno-e-ventilazione, [data-action="chiedi_ossigeno"]', done: (s) => s.o2Order !== null },
  { text: 'Nella scheda Parametri misura la pressione arteriosa.', target: '.tab-parametri, [data-action="pressione"]', done: (s) => s.did('pressione') },
  { text: 'Chiedi alla moglie che farmaci prende: scheda Anamnesi, «Farmaci assunti?».', target: '.tab-anamnesi, [data-action="q_farmaci"]', done: (s) => s.didAny('q_farmaci', 'q_pasto', 'q_testimoni') },
  { text: 'Diabetico con insulina, confuso e sudato: in alto premi «Scegli protocollo» e seleziona «Ipoglicemia».', target: '.hud-tools .btn-pulse', done: (s) => s.protocol !== null },
  {
    text: 'Nella scheda SORES premi «Riferisci alla SORES» e trasmetti coscienza, frequenza e pressione. La glicemia e lo zucchero non sono competenza del soccorritore: li fa l’infermiere.',
    target: '.tab-centrale, [data-action="comunica"]',
    done: (s) => s.report !== null,
  },
  { text: 'La SORES manda l’ALS. Resta con il paziente e rivalutalo: scheda SORES, «Rivaluta ABCDE e attendi 1 minuto», finché l’ALS è sul posto.', target: '.tab-centrale, [data-action="rivaluta"]', done: (s) => s.msaOnScene },
  { text: 'L’infermiere misura la glicemia e dà il glucosio. Passa le consegne: scheda SORES, «Passa le consegne all’équipe avanzata». Poi vedrai il debriefing.', target: '.tab-centrale, [data-action="consegna"]', done: (s) => s.ended?.reason === 'Consegna al mezzo avanzato' },
];
