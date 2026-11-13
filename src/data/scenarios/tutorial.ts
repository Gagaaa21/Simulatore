import type { Scenario } from '../../engine/types';
import type { Sim } from '../../engine/engine';
import { ipoglicemia } from './ipoglicemia';
import { flagT } from './helpers';

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
  hooks: {
    tick: (s: Sim) => {
      const p = s.p;
      if (s.flags.zuccheroAt !== undefined) {
        s.base.glu = Math.min(112, s.base.glu + 0.1);
        if (s.base.glu > 75 && p.speech === 'confuso') {
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
  { text: 'Apri il gruppo A e valuta la coscienza: chiamalo e toccagli le spalle.', target: '.tab-A, [data-action="coscienza"]', done: (s) => s.did('coscienza') },
  { text: 'Applica il saturimetro: puoi anche cliccare direttamente sul braccio destro del paziente nella scena. Il valore comparirà sul monitor dei parametri.', target: '.tab-B, [data-action="saturimetro"]', done: (s) => s.pulseOx },
  { text: 'È diabetico, confuso e sudato: nel gruppo D misura la glicemia.', target: '.tab-D, [data-action="glicemia"]', done: (s) => s.did('glicemia') },
  { text: 'Capisci la causa: nel gruppo Anamnesi chiedi alla moglie dell’ultimo pasto.', target: '.tab-anamnesi, [data-action="q_pasto"]', done: (s) => s.didAny('q_pasto', 'q_farmaci', 'q_testimoni') },
  { text: 'Hai abbastanza elementi: in alto premi «Scegli protocollo» e seleziona «Ipoglicemia».', target: '.hud-tools .btn-pulse', done: (s) => s.protocol !== null },
  { text: 'È sveglio e deglutisce: nel gruppo Trattamenti dagli zucchero per bocca (15–20 g).', target: '.tab-trattamenti, [data-action="glucosio_os"]', done: (s) => s.did('glucosio_os') },
  {
    text: 'Lo zucchero agisce in alcuni minuti: nel gruppo Centrale premi due volte «Prosegui il trattamento e rivaluta tra 3 minuti», poi nel gruppo D ricontrolla la glicemia.',
    target: '.tab-centrale, .tab-D, [data-action="attendi_lungo"], [data-action="glicemia"]',
    done: (s) => {
      const z = flagT(s, 'zuccheroAt');
      return z !== null && (s.doneAt.get('glicemia') ?? []).some((t) => t - z >= 300);
    },
  },
  { text: 'Comunica alla Centrale: scegli la valutazione I2 e trasmetti anche la glicemia.', target: '.tab-centrale, [data-action="comunica"]', done: (s) => s.report !== null },
  { text: 'Ultimo passo: carica il paziente e trasportalo in ospedale. Poi vedrai il debriefing con punteggio e fonti.', target: '.tab-centrale, [data-action="trasporta"]', done: (s) => s.transport !== null },
];
