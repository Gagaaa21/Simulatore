import type { Scenario } from '../../engine/types';
import { contact, drift, flagT } from './helpers';

/** Frattura esposta di gamba durante una partita: non ridurre, coprire, immobilizzare con controllo prima e dopo. */
export const fratturaCampo: Scenario = {
  id: 'frattura-campo',
  title: 'Il contrasto',
  subtitle: 'Partita di Promozione: un difensore a terra con la gamba piegata in modo innaturale',
  category: '118',
  difficulty: 2,
  minutes: 12,
  setting: 'campo',
  timeOfDay: 'giorno',
  role: 'msb',
  crew: 2,
  dispatch: {
    luogo: 'Y',
    patologia: 'C1',
    criticita: 'G',
    address: 'Campo sportivo comunale di San Daniele del Friuli, via dello Stadio',
    caller: 'L’allenatore',
    time: '16:12',
    travel: 540,
    text: 'Calciatore di 24 anni a terra dopo un contrasto: «si vede l’osso della gamba», urla dal dolore. Cosciente, respira.',
    extra: 'SORES: «ALS impegnato su un altro intervento: inviamo la vostra BLS. Riferite la valutazione, valutiamo l’invio».',
  },
  loadout: {
    essential: ['zaino', 'steccobende'],
    recommended: ['ossigeno', 'materasso'],
    fetchTime: 90,
    note: 'Trauma isolato di un arto: steccobende per l’immobilizzazione, garze e telino sterile sono nello zaino. L’ambulanza è a bordo campo, ma tornare indietro costa un minuto e mezzo.',
  },
  scene: {
    intro:
      'Pomeriggio limpido, tribuna mezza piena. Il difensore è a terra al limite dell’area, supino, e si tiene la coscia destra con entrambe le mani: la gamba destra, a metà, è piegata in un angolo che non dovrebbe esistere e dal calzettone strappato spunta l’osso. Due compagni gli stanno sopra; l’allenatore dice «tiragliela dritta, così non gli fa male».',
    hazards: [],
    bystanders: 'L’allenatore, due compagni di squadra e l’arbitro.',
  },
  patient: {
    name: 'Davide',
    age: 24,
    sex: 'M',
    weightKg: 76,
    avpu: 'A',
    gcs: 15,
    airway: 'pervie',
    breathing: 'tachipnoico',
    rhythm: 'tachicardia',
    pulseRadial: true,
    v: { hr: 122, rr: 24, spo2: 98, sbp: 132, dbp: 82, glu: 104, temp: 36.6, crt: 2 },
    skin: { color: 'pallida', temp: 'normale', sweaty: true },
    pupils: 'normali',
    speech: 'lamento',
    position: 'supino',
    canSwallow: true,
    seizing: false,
    vomitInMouth: false,
    look: { skinTone: '#e6bc98', hair: '#2b1d14', hairStyle: 'corti', shirt: '#c8242f', pants: '#16171b', build: 'adulto', top: 'tshirt', bottom: 'shorts', shoes: '#101114' },
  },
  trauma: false,
  lesioni: { frattura: { region: 'gamba_dx', esposta: true, label: 'frattura esposta di tibia e perone, a metà della gamba destra', pos: 0.62 } },
  answers: {
    eventi: '(a denti stretti) Ho messo giù il piede e quello mi è entrato sullo stinco in scivolata… ho sentito un crack. Non ho battuto la testa.',
    sintomi: 'La gamba! Mi fa malissimo… non toccatela, vi prego.',
    dolore: 'Dieci su dieci, qui a metà della gamba. Il resto no: schiena e collo a posto.',
    allergie: 'No, nessuna.',
    farmaci: 'Niente.',
    patologie: 'Niente, mai rotto niente.',
    pasto: 'Ho pranzato verso mezzogiorno e mezza, pasta.',
    esordio: 'Due minuti prima della fine del primo tempo, un quarto d’ora fa.',
    testimoni: '[Arbitro] Scivolata in ritardo sullo stinco: ha urlato prima ancora di cadere. Non ha battuto la testa, l’ho visto bene.',
  },
  exam: {
    testaPiedi:
      'Nessuna lesione a capo, collo, torace, addome e bacino; non riferisce dolore alla colonna. Gamba destra: deformità ad angolo a metà della tibia, con una ferita di circa 3 cm da cui sporge un frammento osseo; sanguinamento modesto, che cola. Arto sinistro e arti superiori integri.',
    arti: 'Gamba destra accorciata e angolata a metà: segni di certezza di frattura (moncone esposto, motilità innaturale).',
    extra: {
      pms: 'A valle della frattura: polso pedidio presente ma debole, piede caldo e roseo, muove le dita e sente quando gli tocchi la pianta.',
      pmsDopo: 'Dopo l’immobilizzazione il polso pedidio è più valido, il piede è caldo e roseo, sensibilità e movimento delle dita conservati.',
    },
  },
  protocol: { correct: ['fratture'], acceptable: ['trauma'] },
  valutazione: { correct: ['I2'] },
  reportKeys: ['pms', 'fc', 'pa'],
  msa: { available: true, eta: 600, label: 'L’ALS', onReport: true },
  timeLimit: 1500,
  objectives: [
    {
      id: 'pms_prima',
      label: 'Polso, motilità e sensibilità controllati a valle prima di immobilizzare',
      category: 'valutazione',
      points: 8,
      check: (s) => {
        const p = flagT(s, 'pmsPrimaAt');
        const st = flagT(s, 'steccaAt');
        return p !== null && (st === null || p <= st);
      },
      why: 'Il controllo prima e dopo l’immobilizzazione dice se la frattura o la stecca stanno comprimendo vasi e nervi.',
      sources: ['CORSO_MSK', 'ERC_FA_2025'],
    },
    {
      id: 'copri',
      label: 'Frattura esposta coperta con garze e telo sterile prima di immobilizzare',
      category: 'trattamento',
      points: 10,
      critical: true,
      check: (s) => {
        const c = flagT(s, 'fratturaCopertaAt');
        const st = flagT(s, 'steccaAt');
        return c !== null && (st === null || c <= st);
      },
      why: 'La frattura esposta è ad alto rischio di infezione: si copre con materiale sterile, senza disinfettare né toccare i monconi.',
      sources: ['CORSO_MSK', 'ERC_FA_2025'],
    },
    {
      id: 'immobilizza',
      label: 'Arto immobilizzato nella posizione in cui si trova, articolazioni sopra e sotto comprese',
      category: 'trattamento',
      points: 12,
      critical: true,
      check: (s) => s.immob.has('stecca') && !s.did('riallinea'),
      why: 'L’immobilizzazione riduce dolore e sanguinamento e previene danni a vasi, nervi e cute. La frattura non si riduce mai.',
      sources: ['CORSO_MSK', 'ERC_FA_2025'],
    },
    {
      id: 'pms_dopo',
      label: 'Polso, motilità e sensibilità ricontrollati dopo l’immobilizzazione',
      category: 'valutazione',
      points: 6,
      check: (s) => s.flags.pmsDopoAt !== undefined,
      why: 'Una stecca troppo stretta o un arto mosso male possono comprimere i vasi: si ricontrolla sempre.',
      sources: ['CORSO_MSK'],
    },
    {
      id: 'caldo',
      label: 'Paziente coperto per proteggerlo dal freddo',
      category: 'trattamento',
      points: 4,
      check: (s) => s.covered,
      why: 'Il traumatizzato disperde calore anche in una giornata tiepida, soprattutto a terra sull’erba e sudato.',
      sources: ['CORSO_MSK', 'CORSO_TEMP'],
    },
    {
      id: 'rassicura',
      label: 'Paziente rassicurato',
      category: 'comunicazione',
      points: 4,
      check: (s) => s.did('rassicura'),
      why: 'Il soccorso psicologico fa parte del primo soccorso: il dolore e la paura aumentano la frequenza e lo stress.',
      sources: ['CORSO_MSK'],
    },
  ],
  teaching: [
    'Prima la sicurezza e la dinamica: un contrasto in partita è un trauma isolato, una caduta dall’alto no.',
    'Segni di certezza: moncone esposto, motilità innaturale, crepitio. Di probabilità: dolore, gonfiore, ecchimosi, impotenza funzionale.',
    'Non si muove il paziente e non si riduce mai la frattura: si lascia nella posizione antalgica.',
    'Frattura esposta: garze e telo sterile, senza disinfettare né toccare i monconi.',
    'Polso, motilità e sensibilità a valle prima e dopo l’immobilizzazione.',
    'Steccobenda comprendendo l’articolazione a monte e quella a valle; poi telo e rassicurazione. L’analgesia la fa l’équipe sanitaria.',
  ],
  sources: ['CORSO_MSK', 'ERC_FA_2025'],
  hooks: {
    tick: (s) => {
      if (s.phase !== 'paziente' || s.ended) return;
      // il dolore cala con l'immobilizzazione e la rassicurazione
      const stecca = s.immob.has('stecca');
      const target = stecca ? (s.did('rassicura') ? 98 : 106) : s.did('rassicura') ? 116 : 124;
      s.base.hr = drift(s.base.hr, target, 0.12);
      s.base.rr = drift(s.base.rr, stecca ? 18 : 24, 0.03);
      if (stecca && s.p.speech === 'lamento' && s.t - Number(s.flags.steccaAt) > 20) {
        s.p.speech = 'normale';
        s.p.breathing = 'normale';
        s.say('paziente', 'Con la gamba ferma Davide respira meglio: «Così va un po’ meglio… ma non muovetemi».');
      }
      // senza immobilizzazione i compagni lo muovono e la gamba si sposta
      const c = contact(s);
      if (!stecca && s.t - c === 420 && !s.flags.mossa) {
        s.set('mossa', s.t);
        s.base.sbp -= 8;
        s.say('paziente', 'Un compagno gli solleva la testa per dargli da bere e la gamba si sposta: Davide urla, impallidisce e suda freddo.');
      }
    },
    onAction: (s, id) => {
      if (id === 'q_testimoni' || id === 'q_eventi') s.measure('dinamica', 'Dinamica', 'contrasto in partita, trauma isolato della gamba destra');
      if (id === 'trasporta' && !s.immob.has('stecca')) {
        s.penalize('trasporto_senza_stecca', 'grave', 'Trasportato senza immobilizzare l’arto', 'Ogni movimento dei monconi provoca dolore e può lesionare vasi e nervi: si immobilizza prima di caricare.', ['CORSO_MSK']);
      }
    },
    outcome: (s) => {
      if (!s.immob.has('stecca'))
        return { status: 'critico', title: 'Arto non immobilizzato', text: 'Durante il carico e il trasporto i monconi si spostano: Davide arriva in pronto soccorso con il piede freddo e il polso pedidio che non si sente più. Serve un intervento d’urgenza sui vasi.' };
      if (s.did('riallinea') || s.did('disinfetta') || s.flags.fratturaCopertaAt === undefined)
        return { status: 'buono', title: 'Immobilizzato, ma con complicazioni', text: 'La gamba arriva immobilizzata, ma i monconi manipolati o la ferita lasciata scoperta aumentano il rischio di infezione e di danni ai tessuti.' };
      return { status: 'ottimo', title: 'In ortopedia, pronto per la sala', text: 'Frattura coperta e immobilizzata senza muoverla, polso e sensibilità conservati: Davide arriva in ospedale con il dolore controllato dall’équipe e la ferita pulita per l’intervento.' };
    },
  },
};
