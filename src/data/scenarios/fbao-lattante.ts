import type { Scenario } from '../../engine/types';
import { afterContact, before, flagT } from './helpers';

/** Ostruzione da corpo estraneo in un lattante di 9 mesi. */
export const fbaoLattante: Scenario = {
  id: 'fbao-lattante',
  title: 'Silenzio nel seggiolone',
  subtitle: 'Lattante di 9 mesi che non riesce più a piangere',
  category: '118',
  difficulty: 2,
  minutes: 8,
  setting: 'casa',
  timeOfDay: 'giorno',
  role: 'msb',
  crew: 3,
  dispatch: {
    luogo: 'K',
    patologia: 'C3',
    criticita: 'R',
    address: 'Via Leopardi 3, piano terra',
    caller: 'Madre',
    time: '12:18',
    travel: 300,
    text: 'Bimbo di 9 mesi che stava mangiando un biscotto, è diventato viola e «non piange più». La madre è nel panico; l’operatore la sta guidando.',
  },
  loadout: {
    essential: ['zaino', 'pallone', 'aspiratore'],
    recommended: ['ossigeno', 'dae'],
    fetchTime: 60,
    note: 'Ostruzione respiratoria pediatrica: pallone e maschere pediatriche, aspiratore e ossigeno vanno portati subito.',
  },
  scene: {
    intro: 'Cucina di un appartamento. La madre ha appoggiato il bambino sul tappeto del soggiorno: è sveglio, agitato, fa smorfie ma non emette suoni.',
    hazards: [],
    bystanders: 'La madre, in lacrime.',
  },
  patient: {
    name: 'Leo',
    age: 0.75,
    sex: 'M',
    weightKg: 9,
    avpu: 'A',
    gcs: 15,
    airway: 'ostruzione_completa',
    breathing: 'assente',
    rhythm: 'tachicardia',
    pulseRadial: true,
    v: { hr: 176, rr: 0, spo2: 84, sbp: 90, dbp: 55, glu: 95, temp: 36.8, crt: 2 },
    spo2Air: 84,
    skin: { color: 'cianotica', temp: 'normale', sweaty: false },
    pupils: 'normali',
    speech: 'assente',
    position: 'supino',
    canSwallow: false,
    seizing: false,
    vomitInMouth: false,
    look: { skinTone: '#f0c8a8', hair: '#c79a5e', hairStyle: 'bimbo', shirt: '#9fd3c7', pants: '#9fd3c7', build: 'neonato' },
  },
  trauma: false,
  arrest: { shockable: false, roscAfterCprSeconds: 45, needsVentilation: true },
  answers: {
    testimoni: '[Madre] Stava mangiando un biscotto nel seggiolone, ha fatto un colpo di tosse e poi più niente, è diventato viola!',
    eventi: '[Madre] Gli è andato di traverso un pezzo di biscotto, un minuto fa… forse due.',
    patologie: '[Madre] È sempre stato bene, vaccinato, nato a termine.',
    farmaci: '[Madre] Nessun farmaco.',
    allergie: '[Madre] Nessuna allergia.',
    pasto: '[Madre] Stava facendo merenda adesso.',
  },
  exam: {
    testaPiedi: 'Nessun trauma. Dopo la disostruzione: colorito che torna roseo, pianto vigoroso, nessun rumore respiratorio anomalo.',
    cavoOrale: 'Nessun corpo estraneo visibile.',
  },
  protocol: { correct: ['fbao_pediatrico'] },
  valutazione: { correct: ['I1', 'I2'] },
  reportKeys: ['spo2'],
  msa: { available: true, eta: 720 },
  timeLimit: 1080,
  objectives: [
    {
      id: 'rapida',
      label: 'Prima manovra di disostruzione entro 30 s dal contatto',
      category: 'tempi',
      points: 12,
      critical: true,
      check: (s) => afterContact(s, 'colpi_dorsali', 'compressioni_toraciche_lattante') <= 30,
      why: 'Il lattante consuma ossigeno molto in fretta: non c’è tempo da perdere.',
      sources: ['ERC_PLS_2025'],
    },
    {
      id: 'sequenza',
      label: 'Colpi dorsali (capo in basso) alternati a compressioni toraciche',
      category: 'trattamento',
      points: 12,
      critical: true,
      check: (s) => before(s, 'colpi_dorsali', 'compressioni_toraciche_lattante') && !s.did('compressioni_addominali'),
      why: 'Nel lattante: fino a 5 colpi dorsali, poi fino a 5 compressioni toraciche con la tecnica a due pollici. Mai compressioni addominali.',
      sources: ['ERC_PLS_2025'],
    },
    {
      id: 'risolta',
      label: 'Ostruzione risolta',
      category: 'trattamento',
      points: 10,
      critical: true,
      check: (s) => flagT(s, 'liberatoAt') !== null || flagT(s, 'corpoRimossoAt') !== null,
      why: 'Il segno di risoluzione è il ritorno della tosse, del pianto o di un respiro rumoroso.',
      sources: ['ERC_PLS_2025'],
    },
    {
      id: 'controllo',
      label: 'Saturimetro e rivalutazione dopo la disostruzione',
      category: 'valutazione',
      points: 6,
      check: (s) => flagT(s, 'liberatoAt') !== null && s.pulseOx,
      why: 'Frammenti residui possono scendere nelle vie aeree: si sorveglia il respiro e l’ossigenazione.',
      sources: ['ERC_PLS_2025'],
    },
    {
      id: 'ospedale',
      label: 'Lattante accompagnato in ospedale con la madre',
      category: 'comunicazione',
      points: 6,
      check: (s) => s.ended?.reason === 'Trasporto in ospedale' || s.ended?.reason === 'Consegna al mezzo avanzato',
      why: 'Dopo un episodio di soffocamento serve una valutazione medica.',
      sources: ['ERC_PLS_2025'],
    },
  ],
  teaching: [
    'Sospetta il soffocamento quando un lattante non riesce più a piangere durante il pasto o il gioco.',
    'Lattante prono sull’avambraccio, capo più in basso del torace: fino a 5 colpi tra le scapole.',
    'Poi supino sulle ginocchia: fino a 5 compressioni toraciche con due pollici, più secche delle compressioni di RCP.',
    'Mai compressioni addominali nel lattante; mai dita in bocca alla cieca.',
    'Se perde coscienza: RCP iniziando con 5 ventilazioni.',
  ],
  sources: ['ERC_PLS_2025'],
  hooks: {
    tick: (s) => {
      const p = s.p;
      if (p.airway === 'ostruzione_completa' && p.avpu === 'A') p.spo2Air = Math.min(100, p.spo2Air + 0.32);
      if (p.airway === 'ostruzione_completa' && p.avpu === 'A' && s.count('colpi_dorsali') >= 2 && s.count('compressioni_toraciche_lattante') >= 1 && !s.busy) {
        p.airway = 'pervie';
        p.breathing = 'tachipnoico';
        p.speech = 'pianto';
        p.spo2Air = 95;
        p.skin.color = 'arrossata';
        s.base.rr = 40;
        s.base.hr = 160;
        s.set('liberatoAt', s.t);
        s.say('paziente', 'Il pezzetto di biscotto esce! Leo tossisce e scoppia in un pianto fortissimo: il colorito torna roseo.');
        s.soundQueue.push('ok');
      }
      if (p.airway === 'ostruzione_completa' && p.avpu === 'U' && !s.flags.svenuto) {
        s.set('svenuto', s.t);
        s.set('cprIndicata', true);
        p.breathing = 'assente';
        s.say('paziente', 'Leo diventa flaccido e non risponde più.');
        s.hint('Lattante incosciente con ostruzione: 5 ventilazioni iniziali e RCP 15:2.');
      }
      if (s.flags.svenuto && s.cpr.active) {
        const n = Number(s.flags.cprSec ?? 0) + 1;
        s.set('cprSec', n);
        if (n === 15 && !s.flags.corpoVisibile) {
          s.set('corpoVisibile', true);
          s.say('evento', 'Dopo le compressioni guarda in bocca prima delle ventilazioni.');
        }
      }
      if (s.flags.corpoRimosso && !s.flags.corpoRimossoAt) {
        s.set('corpoRimossoAt', s.t);
        p.airway = 'pervie';
      }
      const rem = flagT(s, 'corpoRimossoAt');
      if (rem !== null && !s.inArrest() && p.breathing === 'assente' && (s.did('ventilazioni_iniziali') || s.bvm) && s.t - rem > 15) {
        p.breathing = 'tachipnoico';
        p.avpu = 'V';
        p.speech = 'pianto';
        p.spo2Air = 92;
        s.base.rr = 36;
        s.set('cprIndicata', false);
        s.say('paziente', 'Leo riprende a respirare e geme: segni di vita.');
      }
      if (s.inArrest() && !s.flags.corpoRimosso) s.cpr.goodSeconds = 0;
      if (flagT(s, 'liberatoAt') !== null) s.base.hr = Math.max(130, s.base.hr - 0.15);
    },
    onAction: (s, id) => {
      const p = s.p;
      if (id === 'coscienza' && p.airway === 'ostruzione_completa' && p.avpu === 'A') {
        s.find('È sveglio, agita le braccia, apre la bocca ma non emette alcun suono: non riesce a piangere.');
        s.measure('avpu', 'Coscienza (AVPU)', 'A');
        return true;
      }
      if (id === 'ispeziona_bocca' && s.flags.corpoVisibile && !s.flags.corpoRimosso) {
        s.find('Vedi chiaramente un pezzo di biscotto sulla lingua.');
        return true;
      }
      if (id === 'pallone' && p.airway === 'ostruzione_completa') {
        s.find('Il torace non si solleva: l’ostruzione persiste.');
        return true;
      }
      return false;
    },
  },
};
