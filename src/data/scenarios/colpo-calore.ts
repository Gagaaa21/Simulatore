import type { Scenario } from '../../engine/types';
import { afterContact, flagT } from './helpers';

/** Colpo di calore da sforzo a un festival estivo: prima raffreddare, poi trasportare. */
export const colpoCalore: Scenario = {
  id: 'colpo-calore',
  title: 'Mezzogiorno sotto il palco',
  subtitle: 'Festival estivo, 34 °C: ragazza confusa e bollente',
  category: 'eventi',
  difficulty: 2,
  minutes: 14,
  setting: 'festival',
  timeOfDay: 'giorno',
  role: 'squadra',
  crew: 2,
  dispatch: {
    luogo: 'Z',
    patologia: 'C9',
    criticita: 'G',
    address: 'Area festival, settore B, vicino al mixer',
    caller: 'Steward via radio',
    time: '13:20',
    travel: 120,
    text: 'Ragazza di circa 20 anni che ha ballato per ore sotto il sole; ora è confusa, agitata, non sta in piedi. Gli amici la tengono sdraiata.',
    extra: 'Coordinamento sanitario: «Il PMA ha la vasca per l’immersione pronta».',
  },
  loadout: {
    essential: ['zaino', 'dae'],
    recommended: ['kit_raffreddamento', 'ossigeno'],
    fetchTime: 90,
    note: 'Squadra a piedi a un festival: zaino e DAE sempre; il kit raffreddamento accelera il trattamento sul posto.',
  },
  scene: {
    intro: 'Prato assolato davanti al palco, musica altissima. La ragazza è a terra, agitata, la pelle rossa e asciutta; gli amici le fanno aria con un cappello. La folla preme da tutti i lati.',
    hazards: [
      {
        id: 'folla',
        label: 'Folla compatta che spinge verso il palco, nessuno spazio di lavoro né via di uscita',
        fixAction: 'apri_spazio',
        consequence: 'Senza un varco la squadra rischia di essere travolta e non può evacuare la paziente.',
      },
    ],
    bystanders: 'Due amici spaventati.',
  },
  patient: {
    name: 'Giulia',
    age: 21,
    sex: 'F',
    weightKg: 58,
    avpu: 'V',
    gcs: 13,
    airway: 'pervie',
    breathing: 'tachipnoico',
    rhythm: 'tachicardia',
    pulseRadial: true,
    v: { hr: 142, rr: 28, spo2: 96, sbp: 98, dbp: 56, glu: 92, temp: 41.3, crt: 3 },
    skin: { color: 'arrossata', temp: 'molto_calda', sweaty: false },
    pupils: 'midriatiche',
    speech: 'confuso',
    position: 'supino',
    canSwallow: false,
    seizing: false,
    vomitInMouth: false,
    look: { skinTone: '#efc19d', hair: '#7a4b2a', hairStyle: 'lunghi', shirt: '#f2d14b', pants: '#4c6aa8', build: 'adulto', wristband: '#ff3fa6', top: 'tshirt', bottom: 'shorts', shoes: '#f2f2f2' },
  },
  trauma: false,
  answers: {
    testimoni: '[Amica] Balla da tre ore sotto il sole, ha bevuto solo birra. Forse ha preso qualcosa, una pasticca… non lo so. Poi ha iniziato a dire cose strane e si è accasciata.',
    eventi: '[Amica] Si è accasciata dieci minuti fa, ma era strana già da prima.',
    farmaci: '[Amica] Che io sappia niente.',
    allergie: '[Amica] Non lo so.',
    patologie: '[Amica] Sta bene, fa sport.',
    pasto: '[Amica] Stamattina un cornetto, poi solo birra.',
    sintomi: 'Caldo… lasciatemi… dov’è Marta?',
  },
  exam: { testaPiedi: 'Nessun trauma. Cute molto calda, arrossata e asciutta. Braccialetto del festival.' },
  protocol: { correct: ['colpo_calore'], acceptable: ['intossicazione'] },
  valutazione: { correct: ['I3'], acceptable: ['I2'] },
  reportKeys: ['temperatura', 'avpu'],
  msa: { available: true, eta: 300, label: 'Il medico del PMA' },
  timeLimit: 1800,
  objectives: [
    {
      id: 'temp',
      label: 'Temperatura misurata entro 3 minuti dal contatto',
      category: 'valutazione',
      points: 8,
      check: (s) => afterContact(s, 'temperatura') <= 180,
      why: 'Alterazione neurologica + temperatura centrale elevata durante sforzo = colpo di calore.',
      sources: ['ERC_FA_2025'],
    },
    {
      id: 'attivo',
      label: 'Raffreddamento attivo iniziato entro 5 minuti dal contatto',
      category: 'tempi',
      points: 14,
      critical: true,
      check: (s) => afterContact(s, 'raffredda') <= 300,
      why: 'Il danno d’organo dipende da quanto a lungo la temperatura resta alta: si raffredda subito, sul posto.',
      sources: ['ERC_FA_2025'],
    },
    {
      id: 'metodo',
      label: 'Metodo più efficace disponibile: immersione in acqua fredda',
      category: 'trattamento',
      points: 8,
      check: (s) => s.flags.raffreddamentoMetodo === 'immersione' || s.flags.raffreddamentoMetodo === 'taco',
      why: 'Il gold standard è l’immersione in acqua a 1–26 °C dal collo in giù.',
      sources: ['ERC_FA_2025'],
    },
    {
      id: 'target',
      label: 'Raffreddamento proseguito fino a meno di 39 °C (senza scendere sotto 38 °C)',
      category: 'trattamento',
      points: 10,
      check: (s) => s.p.v.temp < 39 && s.p.v.temp >= 38,
      why: 'Si raffredda fino a temperatura centrale sotto 39 °C, evitando l’ipotermia iatrogena.',
      sources: ['ERC_FA_2025'],
    },
    {
      id: 'prima_raffredda',
      label: 'Prima raffreddare, poi trasportare',
      category: 'trattamento',
      points: 8,
      check: (s) => !s.penalties.some((p) => p.id === 'trasporto_caldo'),
      why: '«Cool first, transfer second»: il trasporto non deve ritardare il raffreddamento.',
      sources: ['ERC_FA_2025'],
    },
  ],
  teaching: [
    'Il colpo di calore da sforzo si riconosce da confusione, agitazione, convulsioni o coma durante uno sforzo, anche con temperature non estreme.',
    'Raffreddamento passivo subito (ombra, via gli indumenti) e attivo appena possibile.',
    'Il gold standard è l’immersione in acqua fredda dal collo in giù fino a meno di 39 °C.',
    'Prima si raffredda, poi si trasporta; si continua a raffreddare anche durante il trasporto.',
    'Niente telo isotermico e niente liquidi per bocca a chi è confuso.',
  ],
  sources: ['ERC_FA_2025', 'ACCORDO_EVENTI_2014'],
  hooks: {
    onStart: (s) => {
      s.set('vascaDisponibile', true);
      s.set('nonCamminare', 'Una paziente confusa e ipotesa non deve camminare.');
    },
    tick: (s) => {
      const p = s.p;
      if (!s.cooling) {
        if (flagT(s, 'raffreddamentoAt') === null) {
          const passive = flagT(s, 'scopertoAt') !== null;
          s.base.temp = Math.min(42.4, s.base.temp + (passive ? 0.0015 : 0.006));
        } else {
          // dopo il raffreddamento, a riposo e all'ombra, la temperatura continua a scendere lentamente
          s.base.temp = Math.max(37.6, s.base.temp - 0.0006);
        }
      }
      const T = s.base.temp;
      // la temperatura guida coscienza e circolo
      s.base.hr = 95 + Math.max(0, T - 37.5) * 13;
      s.base.sbp = T > 40 ? 98 : 112;
      if (T >= 41.9 && !s.flags.crisiCalore) {
        s.set('crisiCalore', s.t);
        p.seizing = true;
        p.avpu = 'U';
        s.say('paziente', 'La ragazza si irrigidisce e ha una crisi convulsiva generalizzata!');
      }
      if (s.flags.crisiCalore && p.seizing && s.t - Number(s.flags.crisiCalore) > 70) {
        p.seizing = false;
        p.avpu = 'P';
        p.airway = 'russante';
      }
      if (T < 40 && p.avpu !== 'A' && !p.seizing) {
        p.avpu = 'A';
        p.speech = 'confuso';
        p.airway = 'pervie';
        s.say('paziente', 'Giulia apre gli occhi e chiede dove si trova: sta tornando lucida.');
      }
      if (T < 39.2 && p.speech === 'confuso' && p.avpu === 'A') {
        p.speech = 'normale';
        p.skin = { color: 'rosea', temp: 'normale', sweaty: false };
      }
      if (s.cooling && T < 38) {
        s.penalize('ipotermia_iatrogena', 'lieve', 'Raffreddamento proseguito sotto i 38 °C', 'Si interrompe sotto i 39 °C per evitare l’ipotermia.', ['ERC_FA_2025']);
      }
    },
    onAction: (s, id) => {
      if (id === 'temperatura') {
        const t = s.p.v.temp.toFixed(1).replace('.', ',');
        s.find(`Temperatura centrale (sonda rettale al PMA): ${t} °C.`);
        s.measure('temperatura', 'Temperatura centrale', `${t} °C`);
        if (!s.flags.temperaturaAt) s.set('temperaturaAt', s.t);
        return true;
      }
      if (id === 'trasporta' && s.p.v.temp >= 39.5) {
        s.penalize('trasporto_caldo', 'grave', 'Trasporto prima del raffreddamento', 'Nel colpo di calore si raffredda sul posto fino a meno di 39 °C prima di trasferire.', ['ERC_FA_2025']);
      }
      if (id === 'raffredda' && !s.did('scopri')) {
        s.hint('Ricorda anche il raffreddamento passivo: ombra e indumenti in eccesso tolti.');
      }
      return false;
    },
    outcome: (s) => {
      const T = s.p.v.temp;
      if (T < 39 && T >= 38) return { status: 'ottimo', title: 'Raffreddata in tempo', text: 'Giulia è tornata lucida al PMA: la rapidità del raffreddamento è il fattore che più protegge cervello, rene e fegato.' };
      if (T < 40) return { status: 'buono', title: 'Temperatura in discesa', text: 'Il raffreddamento è avvenuto, ma non nel modo o nei tempi ideali.' };
      return { status: 'critico', title: 'Ipertermia persistente', text: 'La temperatura è rimasta oltre i 40 °C troppo a lungo: alto rischio di danno multiorgano.' };
    },
  },
};
