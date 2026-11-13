import type { Scenario } from '../../engine/types';
import { afterContact, flagT } from './helpers';

/** Crisi tonico-clonica in un giovane epilettico durante un concerto. */
export const convulsioni: Scenario = {
  id: 'convulsioni',
  title: 'Crisi in transenna',
  subtitle: 'Concerto al palazzetto: ragazzo con crisi convulsiva in corso',
  category: 'eventi',
  difficulty: 1,
  minutes: 10,
  setting: 'concerto',
  timeOfDay: 'notte',
  role: 'squadra',
  crew: 2,
  dispatch: {
    luogo: 'Y',
    patologia: 'C4',
    criticita: 'G',
    address: 'Parterre, lato destro, vicino alla transenna',
    caller: 'Security via radio',
    time: '22:47',
    travel: 60,
    text: 'Ragazzo a terra «che trema tutto», gli amici dicono che soffre di epilessia.',
  },
  loadout: {
    essential: ['zaino', 'dae'],
    recommended: ['ossigeno', 'aspiratore'],
    fetchTime: 90,
    note: 'Una squadra a piedi porta sempre zaino e DAE: anche una «crisi» può essere l’esordio di un arresto cardiaco.',
  },
  scene: {
    intro: 'Luci stroboscopiche, musica assordante. A ridosso della transenna un ragazzo è a terra, supino, con scosse a braccia e gambe; gli amici gli tengono le braccia e la folla si accalca per guardare.',
    hazards: [
      {
        id: 'folla',
        label: 'Folla che si accalca attorno al ragazzo, transenna metallica a pochi centimetri',
        fixAction: 'apri_spazio',
        consequence: 'Senza spazio il ragazzo può urtare la transenna e la squadra non riesce a lavorare.',
      },
    ],
    bystanders: 'Tre amici; uno gli tiene ferme le braccia.',
  },
  patient: {
    name: 'Samuele',
    age: 19,
    sex: 'M',
    weightKg: 70,
    avpu: 'U',
    gcs: 3,
    airway: 'gorgogliante',
    breathing: 'superficiale',
    rhythm: 'tachicardia',
    pulseRadial: true,
    v: { hr: 136, rr: 8, spo2: 90, sbp: 150, dbp: 90, glu: 104, temp: 37.3, crt: 2 },
    skin: { color: 'cianotica', temp: 'calda', sweaty: true },
    pupils: 'midriatiche',
    speech: 'assente',
    position: 'supino',
    canSwallow: false,
    seizing: true,
    vomitInMouth: false,
    look: { skinTone: '#e6bc98', hair: '#151515', hairStyle: 'corti', shirt: '#121214', pants: '#2f3f5e', build: 'adulto', wristband: '#3fe0ff', top: 'tshirt', shoes: '#f2f2f2' },
  },
  trauma: false,
  answers: {
    testimoni: '[Amico] Ha l’epilessia, prende le pastiglie ma stanotte non ha dormito e oggi credo le abbia saltate. È iniziata due minuti fa, con le luci.',
    eventi: '[Amico] Si è irrigidito, ha urlato ed è caduto all’indietro, ma l’abbiamo preso al volo. Poi ha iniziato a tremare.',
    farmaci: '[Amico] Levetiracetam, mi pare.',
    patologie: '[Amico] Epilessia da quando era piccolo.',
    allergie: '[Amico] Nessuna.',
    pasto: '[Amico] Panino alle otto, due birre.',
    sintomi: 'Mi fa male la testa… cos’è successo?',
  },
  exam: {
    testaPiedi: 'Nessun trauma cranico (lo hanno sostenuto durante la caduta). Morso laterale della lingua, perdita di urine.',
    cavoOrale: 'Saliva schiumosa e un po’ di sangue dal morso della lingua.',
  },
  protocol: { correct: ['convulsioni'] },
  valutazione: { correct: ['I2'], acceptable: ['I1'] },
  reportKeys: ['avpu', 'glicemia'],
  msa: { available: true, eta: 300, label: 'Il medico del PMA' },
  timeLimit: 1500,
  objectives: [
    {
      id: 'proteggi',
      label: 'Paziente protetto da traumi entro 20 s dal contatto',
      category: 'sicurezza',
      points: 10,
      critical: true,
      check: (s) => afterContact(s, 'proteggi_crisi') <= 20,
      why: 'Durante la crisi l’obiettivo è evitare che si ferisca: spazio attorno e qualcosa di morbido sotto la testa.',
      sources: ['LICE'],
    },
    {
      id: 'tempo',
      label: 'Durata della crisi cronometrata',
      category: 'valutazione',
      points: 8,
      check: (s) => s.did('cronometra'),
      why: 'Oltre i 5 minuti si parla di stato di male: serve un intervento sanitario avanzato.',
      sources: ['LICE'],
    },
    {
      id: 'respiro_dopo',
      label: 'Respiro valutato entro 30 s dalla fine della crisi',
      category: 'valutazione',
      points: 10,
      critical: true,
      check: (s) => {
        const f = flagT(s, 'fineCrisi');
        return f !== null && (s.doneAt.get('gas') ?? []).some((t) => t >= f && t - f <= 30);
      },
      why: 'Brevi movimenti convulsivi possono essere l’esordio di un arresto cardiaco: a crisi finita si verifica sempre il respiro.',
      sources: ['ERC_BLS_2025'],
    },
    {
      id: 'pls',
      label: 'Posizione laterale di sicurezza nella fase post-critica',
      category: 'trattamento',
      points: 10,
      check: (s) => {
        const f = flagT(s, 'fineCrisi');
        return f !== null && (s.flags.pos_laterale !== undefined && Number(s.flags.pos_laterale) >= f);
      },
      why: 'Coscienza ridotta con respiro presente e nessun trauma: posizione laterale per proteggere le vie aeree.',
      sources: ['ERC_FA_2025', 'LICE'],
    },
    {
      id: 'glicemia',
      label: 'Glicemia controllata',
      category: 'valutazione',
      points: 6,
      check: (s) => s.did('glicemia'),
      why: 'Un’ipoglicemia può causare crisi convulsive.',
      sources: ['ERC_FA_2025'],
    },
    {
      id: 'ossigeno',
      label: 'Saturimetro applicato e ossigeno se SpO₂ sotto 94%',
      category: 'trattamento',
      points: 6,
      check: (s) => s.pulseOx && (s.p.v.spo2 >= 94 || !!s.o2),
      why: 'Dopo una crisi l’ossigenazione può essere ridotta: target 94–98%.',
      sources: ['ERC_FA_2025', 'BTS_O2_2017'],
    },
  ],
  teaching: [
    'Durante la crisi: spazio attorno, qualcosa di morbido sotto la testa, niente in bocca, non bloccare le scosse.',
    'Cronometra: se supera i 5 minuti o si ripete senza ripresa della coscienza serve il supporto avanzato.',
    'A crisi finita verifica subito il respiro: movimenti simil-convulsivi possono essere l’esordio di un arresto.',
    'Nella fase post-critica: posizione laterale se respira e non ci sono traumi, aspirazione se serve, glicemia.',
    'Luci stroboscopiche, privazione di sonno e farmaci saltati sono fattori scatenanti tipici.',
  ],
  sources: ['LICE', 'ERC_BLS_2025', 'ERC_FA_2025'],
  hooks: {
    onStart: (s) => {
      s.set('crisiInizio', -110);
    },
    tick: (s) => {
      const p = s.p;
      // la crisi dura 3 minuti e mezzo dall'esordio
      if (p.seizing && s.t >= 100) {
        p.seizing = false;
        p.breathing = 'normale';
        p.airway = p.position === 'laterale' ? 'pervie' : 'russante';
        p.avpu = 'U';
        s.base.rr = 18;
        s.base.hr = 112;
        p.spo2Air = 91;
        p.skin.color = 'pallida';
        s.set('fineCrisi', s.t);
        s.say('paziente', 'Le scosse si fermano. Il ragazzo è immobile, gli occhi chiusi, respira rumorosamente.');
        s.hint('Crisi finita: verifica subito il respiro.');
        if (s.did('cronometra')) s.measure('crisi', 'Durata della crisi', 'circa 3 minuti e mezzo');
      }
      const f = flagT(s, 'fineCrisi');
      if (f !== null) {
        if (s.t - f === 150 && p.avpu === 'U') {
          p.avpu = 'P';
          s.say('paziente', 'Samuele geme e ritrae il braccio allo stimolo.');
        }
        if (s.t - f === 330 && p.avpu === 'P') {
          p.avpu = 'V';
          p.speech = 'confuso';
          s.say('paziente', 'Apre gli occhi se lo chiami, è confuso e assonnato.');
        }
        if (s.t - f === 540 && p.avpu === 'V') {
          p.avpu = 'A';
          p.canSwallow = true;
          p.spo2Air = 96;
          s.say('paziente', 'Samuele è sveglio e orientato, stanchissimo; ha mal di testa.');
        }
        if (p.position === 'laterale' && p.airway === 'russante') p.airway = 'pervie';
      }
      // amico che lo trattiene
      if (p.seizing && s.flags.contattoAt && !s.flags.amicoAvvisato) {
        s.set('amicoAvvisato', true);
        s.say('evento', 'L’amico continua a tenergli ferme le braccia con forza.');
      }
    },
    onAction: (s, id) => {
      if (id === 'proteggi_crisi') {
        s.set('protettoAt', s.t);
        s.say('azione', 'Fai lasciare le braccia all’amico, metti uno zaino morbido sotto la testa e allontani i bicchieri di vetro. Lasci libere le scosse.');
        return true;
      }
      if (id === 'gas' && s.p.seizing) {
        s.find('Durante la crisi il respiro è irregolare e rumoroso: non è valutabile in modo affidabile.');
        return true;
      }
      return false;
    },
  },
};
