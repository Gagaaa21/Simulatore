import type { Sim } from '../../engine/engine';
import type { Scenario } from '../../engine/types';
import { contact, drift, flagT } from './helpers';

/** Un'attesa si interrompe quando il paziente peggiora. */
function stopWait(s: Sim) {
  if (s.busy && ['attendi', 'attendi_lungo', 'rivaluta'].includes(s.busy.actionId)) s.busy = null;
}

const peggiorato = (s: Sim) => s.flags.peggioratoAt !== undefined;

/** Codice verde che diventa rosso: trauma cranico minore in un anziano in terapia anticoagulante. */
export const traumaCranico: Scenario = {
  id: 'trauma-cranico',
  title: 'Solo un bernoccolo',
  subtitle: 'Anziano scivolato in bagno: «sto benissimo, non serviva l’ambulanza»',
  category: '118',
  difficulty: 2,
  minutes: 14,
  setting: 'casa',
  timeOfDay: 'giorno',
  role: 'msb',
  crew: 2,
  dispatch: {
    luogo: 'K',
    patologia: 'C1',
    criticita: 'V',
    address: 'Pordenone, viale Grigoletti 72, primo piano',
    caller: 'La figlia',
    time: '10:40',
    travel: 540,
    text: 'Uomo di 81 anni scivolato in bagno, ha battuto la fronte sul lavandino. Ha un taglietto ed è cosciente, dice che sta bene: la figlia preferisce farlo vedere.',
  },
  loadout: {
    essential: ['zaino'],
    recommended: ['aspiratore', 'ossigeno', 'kit_emorragie'],
    fetchTime: 90,
    note: 'Trauma cranico in un anziano: zaino per parametri, pupille e medicazione. Se peggiorasse, servirebbe proteggere le vie aeree.',
  },
  scene: {
    intro:
      'Soggiorno ordinato, televisione accesa sul telegiornale. Il signore è seduto in poltrona con un asciugamano premuto sulla fronte, la figlia accanto. «Ve l’ho detto che non serviva, è un bernoccolo», sorride. Sul tavolino c’è un portapillole settimanale.',
    hazards: [],
    bystanders: 'La figlia.',
  },
  patient: {
    name: 'Bruno',
    age: 81,
    sex: 'M',
    weightKg: 74,
    avpu: 'A',
    gcs: 15,
    airway: 'pervie',
    breathing: 'normale',
    rhythm: 'sinusale',
    pulseRadial: true,
    v: { hr: 82, rr: 16, spo2: 96, sbp: 152, dbp: 88, glu: 118, temp: 36.4, crt: 2 },
    skin: { color: 'rosea', temp: 'normale', sweaty: false },
    pupils: 'normali',
    speech: 'normale',
    position: 'seduto',
    canSwallow: true,
    seizing: false,
    vomitInMouth: false,
    look: { skinTone: '#e3bfa4', hair: '#d8d8dc', hairStyle: 'calvo', shirt: '#a5b8c9', pants: '#4a4a52', build: 'adulto', top: 'camicia', shoes: '#3a2e25' },
  },
  trauma: false,
  answers: {
    eventi: 'Sono scivolato sul tappetino del bagno e ho preso il lavandino con la fronte. Non sono svenuto, mi ricordo tutto.',
    sintomi: 'Un po’ di mal di testa dove ho battuto. Per il resto sto bene, davvero.',
    dolore: 'Solo qui sulla fronte. Il collo no, la schiena no.',
    allergie: 'Nessuna.',
    farmaci: '[Figlia] Prende l’anticoagulante per il cuore, l’apixaban, due volte al giorno. E una pastiglia per la pressione.',
    patologie: '[Figlia] Fibrillazione atriale e pressione alta.',
    pasto: 'Colazione alle sette.',
    esordio: '[Figlia] Mezz’ora fa.',
    testimoni: '[Figlia] Non è svenuto: l’ho sentito cadere e quando sono arrivata era già seduto per terra che parlava.',
  },
  exam: {
    testaPiedi: 'Ferita lacero-contusa di 2 cm sulla fronte a destra, che sanguina poco, con un bernoccolo. Nessuna perdita di liquido da naso od orecchie, collo non dolente, muove e sente i quattro arti. Nessun’altra lesione.',
    extra: { ferita: 'fronte' },
  },
  protocol: { correct: ['trauma_cranico'], acceptable: ['abcde', 'trauma'] },
  valutazione: { correct: ['I1'], acceptable: ['I2', 'I3'] },
  reportKeys: ['farmaci', 'avpu', 'pupille'],
  msa: { available: true, eta: 420, label: 'L’automedica' },
  sores: {
    codice: (s) => (peggiorato(s) ? 'I3' : s.report?.items.includes('farmaci') ? 'I2' : 'I1'),
    mandaMezzo: (s) => peggiorato(s),
  },
  timeLimit: 1500,
  objectives: [
    {
      id: 'farmaci',
      label: 'Chiesti i farmaci: scoperta la terapia anticoagulante',
      category: 'valutazione',
      points: 10,
      critical: true,
      check: (s) => s.did('q_farmaci'),
      why: 'Con un anticoagulante anche un trauma cranico minore può causare un’emorragia cerebrale, magari ore dopo: va valutato in ospedale anche se sta bene.',
      sources: ['NICE_HEAD_2023'],
    },
    {
      id: 'sores_farmaci',
      label: 'Terapia anticoagulante riferita alla SORES',
      category: 'comunicazione',
      points: 8,
      check: (s) => !!s.report?.items.includes('farmaci'),
      why: 'È l’informazione che cambia la gestione: la SORES la usa per decidere codice e destinazione.',
      sources: ['NICE_HEAD_2023', 'SORES_FVG'],
    },
    {
      id: 'rivaluta',
      label: 'Coscienza e pupille rivalutate dopo il primo esame',
      category: 'valutazione',
      points: 8,
      check: (s) => s.did('rivaluta') || s.count('pupille') >= 2 || s.count('coscienza') >= 2,
      why: 'Nel trauma cranico il peggioramento può arrivare dopo un intervallo in cui il paziente sta bene.',
      sources: ['NICE_HEAD_2023'],
    },
    {
      id: 'aggiorna',
      label: 'Peggioramento riconosciuto e riferito alla SORES entro 2 minuti e mezzo',
      category: 'comunicazione',
      points: 12,
      critical: true,
      check: (s) => {
        const p = flagT(s, 'peggioratoAt');
        if (p === null) return true;
        return !!s.report && s.report.t >= p && s.report.t - p <= 150;
      },
      why: 'Sonnolenza, vomito e pupille diverse sono segni d’allarme: la SORES deve saperlo subito per cambiare codice e mandare il mezzo avanzato.',
      sources: ['NICE_HEAD_2023', 'SORES_FVG'],
    },
    {
      id: 'vie_aeree',
      label: 'Vie aeree protette quando vomita',
      category: 'trattamento',
      points: 6,
      check: (s) => !peggiorato(s) || s.did('aspira') || s.p.position === 'laterale',
      why: 'Con la coscienza ridotta il vomito può finire nelle vie aeree: aspira e proteggi le vie aeree.',
      sources: ['ERC_FA_2025'],
    },
  ],
  teaching: [
    '«Sto bene» non basta: chiedi sempre i farmaci. Anticoagulante più trauma cranico significa ospedale.',
    'Esame neurologico di base: coscienza, pupille, movimento e sensibilità dei quattro arti.',
    'Rivaluta: nel trauma cranico il peggioramento può arrivare dopo un intervallo di benessere.',
    'Sonnolenza, vomito, pupille diverse: aggiorna subito la SORES, il codice cambia.',
    'Con la coscienza ridotta e il vomito proteggi le vie aeree.',
  ],
  sources: ['NICE_HEAD_2023', 'ERC_FA_2025'],
  hooks: {
    tick: (s) => {
      if (s.phase !== 'paziente' || s.ended) return;
      const p = s.p;
      // emorragia cerebrale che si espande: dopo pochi minuti di apparente benessere
      if (!peggiorato(s) && s.t - contact(s) >= 150 && s.busy?.actionId !== 'trasporta' && !s.transport) {
        s.set('peggioratoAt', s.t);
        p.avpu = 'V';
        p.gcs = 12;
        p.speech = 'confuso';
        p.pupils = 'anisocoriche';
        p.vomitInMouth = true;
        p.airway = 'gorgogliante';
        s.base.sbp = 176;
        s.base.hr = 62;
        s.say('paziente', 'Bruno sbadiglia, si fa sempre più sonnolento e all’improvviso vomita: risponde solo se lo chiami ad alta voce e si lamenta di un mal di testa fortissimo.');
        s.soundQueue.push('peggiora');
        stopWait(s);
      }
      if (peggiorato(s)) s.base.hr = drift(s.base.hr, 56, 0.02);
      // aspirato e in posizione laterale il gorgoglio scompare
      if (!p.vomitInMouth && p.airway === 'gorgogliante') p.airway = 'pervie';
    },
    onAction: (s, id) => {
      if (id === 'q_farmaci') s.measure('farmaci', 'Terapia', 'anticoagulante (apixaban) e antipertensivo');
      if (id === 'pupille' && peggiorato(s)) {
        s.find('Pupille diverse: la destra è più grande e reagisce poco alla luce.');
        s.measure('pupille', 'Pupille', 'anisocoria, destra più grande');
        return true;
      }
    },
    outcome: (s) => {
      if (!peggiorato(s))
        return s.report?.items.includes('farmaci')
          ? { status: 'buono', title: 'Peggiorato in ospedale', text: 'Bruno è peggiorato durante il trasporto, ma il pronto soccorso sapeva della terapia anticoagulante: la TC è stata fatta subito e l’ematoma operato in tempo.' }
          : { status: 'critico', title: 'Nessuno sapeva dell’anticoagulante', text: 'Bruno è arrivato in pronto soccorso come un «taglietto in fronte»: quando è peggiorato in sala d’attesa nessuno sapeva della terapia, e la TC è arrivata tardi.' };
      const r = s.report && s.report.t >= Number(s.flags.peggioratoAt);
      if (r && s.report!.t - Number(s.flags.peggioratoAt) <= 150)
        return { status: 'ottimo', title: 'Ematoma riconosciuto in tempo', text: 'Peggioramento colto alla rivalutazione e riferito subito: con l’automedica Bruno va diretto in neurochirurgia, dove l’ematoma viene evacuato. Si riprende bene.' };
      return { status: 'critico', title: 'Peggioramento comunicato tardi', text: 'La sonnolenza e il vomito non sono stati riferiti in tempo: l’ematoma è cresciuto e Bruno arriva in coma in neurochirurgia.' };
    },
  },
};
