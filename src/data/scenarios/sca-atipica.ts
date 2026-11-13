import type { Sim } from '../../engine/engine';
import type { Scenario } from '../../engine/types';
import { contact, flagT } from './helpers';

function stopWait(s: Sim) {
  if (s.busy && ['attendi', 'attendi_lungo', 'rivaluta'].includes(s.busy.actionId)) s.busy = null;
}

const peggiorato = (s: Sim) => s.flags.peggioratoAt !== undefined;

/** Codice verde che diventa rosso: sindrome coronarica che si presenta come «mal di stomaco» in una donna diabetica. */
export const scaAtipica: Scenario = {
  id: 'sca-atipica',
  title: 'Mal di stomaco da ieri',
  subtitle: 'Nausea e stanchezza in una signora diabetica: la figlia vuole solo un controllo',
  category: '118',
  difficulty: 2,
  minutes: 14,
  setting: 'casa',
  timeOfDay: 'sera',
  role: 'msb',
  crew: 2,
  dispatch: {
    luogo: 'K',
    patologia: 'C8',
    criticita: 'V',
    address: 'Monfalcone, via Duca d’Aosta 9, secondo piano',
    caller: 'La figlia',
    time: '18:50',
    travel: 480,
    text: 'Donna di 74 anni con mal di stomaco e nausea da ieri sera, molto stanca. È diabetica. La figlia chiede di portarla in pronto soccorso per un controllo.',
  },
  loadout: {
    essential: ['zaino'],
    recommended: ['dae', 'ossigeno', 'sedia'],
    fetchTime: 100,
    note: 'Secondo piano senza ascensore. Un malessere vago in una diabetica anziana può essere molte cose: porta quello che ti serve per non doverla far camminare.',
  },
  scene: {
    room: 'cucina',
    intro:
      'Cucina in ordine, la cena preparata e non toccata. La signora è seduta al tavolo, pallida, con una mano appoggiata sotto lo sterno; accanto, un bicchiere d’acqua e una bustina di antiacido aperta. La figlia: «Dice che è lo stomaco, ma non l’ho mai vista così».',
    hazards: [],
    bystanders: 'La figlia.',
  },
  patient: {
    name: 'Rosa',
    age: 74,
    sex: 'F',
    weightKg: 70,
    avpu: 'A',
    gcs: 15,
    airway: 'pervie',
    breathing: 'normale',
    rhythm: 'bradicardia',
    pulseRadial: true,
    v: { hr: 56, rr: 20, spo2: 95, sbp: 104, dbp: 64, glu: 214, temp: 36.2, crt: 3 },
    skin: { color: 'pallida', temp: 'fredda', sweaty: true },
    pupils: 'normali',
    speech: 'normale',
    position: 'seduto',
    canSwallow: true,
    seizing: false,
    vomitInMouth: false,
    look: { skinTone: '#e8c1a4', hair: '#bdbdc4', hairStyle: 'raccolti', shirt: '#7a5a8c', pants: '#3f4656', build: 'adulto', top: 'felpa', bottom: 'gonna', shoes: '#5a3b4a' },
  },
  trauma: false,
  arrest: { shockable: true, roscAfterShocks: 1 },
  answers: {
    sintomi: 'Sono stanca morta e ho la nausea. Un peso qui, alla bocca dello stomaco.',
    dolore: 'Qui sotto lo sterno, come un peso, non un crampo. Va e viene da ieri sera, da un’ora non passa più. Ogni tanto mi prende anche la mascella.',
    esordio: 'Ieri sera dopo cena; da un’ora è continuo.',
    farmaci: 'La metformina per il diabete e una pastiglia per la pressione.',
    patologie: 'Diabete da vent’anni, pressione alta, colesterolo.',
    allergie: 'Nessuna.',
    pasto: 'Oggi niente, mi veniva da vomitare.',
    eventi: '[Figlia] Da ieri dice che ha mal di stomaco. Oggi è pallida e sudata, non l’ho mai vista così.',
    testimoni: '[Figlia] Ha preso un antiacido ma non è cambiato niente.',
  },
  exam: {
    testaPiedi: 'Cute pallida e sudata, fredda alle mani. Nessun edema alle gambe. Nessun trauma.',
    addome: 'Addome morbido e non dolente alla palpazione profonda: premere sulla pancia non cambia il «peso allo stomaco».',
  },
  protocol: { correct: ['dolore_toracico'], acceptable: ['abcde'] },
  valutazione: { correct: ['I2'], acceptable: ['I3'] },
  reportKeys: ['dolore', 'pa', 'fc'],
  msa: { available: true, eta: 480, label: 'L’ALS' },
  sores: {
    codice: (s) => (peggiorato(s) ? 'I3' : s.report?.items.includes('dolore') ? 'I2' : 'I1'),
    mandaMezzo: (s) => peggiorato(s) || !!s.report?.items.includes('dolore'),
  },
  timeLimit: 1500,
  objectives: [
    {
      id: 'opqrst',
      label: 'Dolore indagato (OPQRST): peso irradiato alla mandibola, non dolore di pancia',
      category: 'valutazione',
      points: 10,
      critical: true,
      check: (s) => s.did('q_dolore'),
      why: 'Nelle donne, negli anziani e nei diabetici l’infarto può presentarsi come mal di stomaco, nausea e stanchezza: le caratteristiche del dolore fanno la differenza.',
      sources: ['ESC_ACS_2023'],
    },
    {
      id: 'riposo',
      label: 'A riposo, semiseduta, mai a piedi',
      category: 'trattamento',
      points: 10,
      critical: true,
      check: (s) => !s.flags.camminato && (s.transport === null || s.transport.mode !== 'piedi'),
      why: 'Lo sforzo aumenta il consumo di ossigeno del cuore e il rischio di aritmie: con un sospetto infarto il paziente non cammina.',
      sources: ['ESC_ACS_2023', 'ERC_FA_2025'],
    },
    {
      id: 'sores',
      label: 'Sospetto cardiaco riferito alla SORES entro 6 minuti',
      category: 'comunicazione',
      points: 10,
      check: (s) => {
        const t = flagT(s, 'primoReportAt');
        return t !== null && t - contact(s) <= 360 && !!s.report?.items.includes('dolore');
      },
      why: 'Riferendo il tipo di dolore e i parametri la SORES cambia codice e manda l’ALS: l’ECG lo fa l’infermiere.',
      sources: ['ESC_ACS_2023', 'SORES_FVG'],
    },
    {
      id: 'aggiorna',
      label: 'Peggioramento riferito subito alla SORES',
      category: 'comunicazione',
      points: 8,
      check: (s) => {
        const p = flagT(s, 'peggioratoAt');
        if (p === null) return true;
        return !!s.report && s.report.t >= p && s.report.t - p <= 150;
      },
      why: 'Dolore che cambia, pressione che cala, pelle grigia: la SORES deve saperlo per il codice rosso.',
      sources: ['SORES_FVG'],
    },
    {
      id: 'dae',
      label: 'DAE portato accanto alla paziente',
      category: 'presidi',
      points: 6,
      check: (s) => s.has('dae'),
      why: 'Nell’infarto il rischio di fibrillazione ventricolare è massimo nelle prime ore.',
      sources: ['ERC_BLS_2025'],
    },
  ],
  teaching: [
    'Un codice verde può nascondere un infarto: donne, anziani e diabetici hanno spesso sintomi atipici.',
    'Pallore, sudore freddo e un «peso» che si irradia alla mandibola non sono un mal di stomaco.',
    'Riposo assoluto, semiseduta: non deve camminare, nemmeno fino all’ambulanza.',
    'Riferisci alla SORES il tipo di dolore e i parametri: il codice cambia e arriva l’ALS con l’ECG.',
    'Rivaluta e aggiorna la SORES a ogni peggioramento; DAE sempre a portata di mano.',
  ],
  sources: ['ESC_ACS_2023', 'ERC_FA_2025'],
  hooks: {
    onStart: (s) => {
      s.set('nonCamminare', 'Con un sospetto infarto lo sforzo di camminare aumenta il lavoro del cuore e il rischio di aritmie.');
    },
    tick: (s) => {
      if (s.phase !== 'paziente' || s.ended || s.inArrest()) return;
      const p = s.p;
      if (!peggiorato(s) && s.t - contact(s) >= 300 && s.busy?.actionId !== 'trasporta' && !s.transport) {
        s.set('peggioratoAt', s.t);
        p.skin = { color: 'grigiastra', temp: 'fredda', sweaty: true };
        p.breathing = 'dispnoico';
        p.speech = 'frasi_brevi';
        s.base.hr = 46;
        s.base.sbp = 86;
        s.base.dbp = 54;
        s.base.rr = 26;
        p.spo2Air = 91;
        s.say('paziente', 'Rosa si porta una mano al petto: «Adesso mi stringe forte… mi manca l’aria». È grigia, sudata, il polso è lento.');
        s.soundQueue.push('peggiora');
        stopWait(s);
      }
    },
    onAction: (s, id, params) => {
      if (id === 'q_dolore') s.measure('dolore', 'Dolore', 'peso retrosternale ed epigastrico irradiato alla mandibola, continuo da un’ora');
      const pos = String(params?.pos ?? '');
      if ((id === 'posizione' && pos === 'in_piedi') || (id === 'trasporta' && String(params?.mode ?? '') === 'piedi')) {
        s.set('camminato', s.t);
        s.enterArrest('fv', 'Dopo pochi passi Rosa si accascia: non risponde e respira in modo rumoroso, a scatti.');
      }
    },
    outcome: (s) => {
      if (s.inArrest()) return { status: 'decesso', title: 'Arresto durante lo sforzo', text: 'Fatta camminare con un infarto in corso, Rosa è andata in fibrillazione ventricolare.' };
      if (s.flags.camminato !== undefined)
        return { status: 'critico', title: 'Fibrillazione dopo lo sforzo', text: 'Rosa ha camminato con un infarto in corso ed è andata in arresto; rianimata, arriva in emodinamica in condizioni critiche.' };
      const r = s.report?.items.includes('dolore');
      if (r && (!peggiorato(s) || (s.report!.t >= Number(s.flags.peggioratoAt) && s.report!.t - Number(s.flags.peggioratoAt) <= 150)))
        return { status: 'ottimo', title: 'Infarto riconosciuto dietro un codice verde', text: 'L’ECG dell’infermiere mostra un infarto inferiore: Rosa va direttamente in emodinamica, dove l’arteria viene riaperta in tempo.' };
      return { status: 'buono', title: 'In pronto soccorso', text: 'Rosa arriva in ospedale, ma il sospetto cardiaco non è stato riferito in tempo: l’ECG viene fatto solo in pronto soccorso e la rete dell’infarto si attiva tardi.' };
    },
  },
};
