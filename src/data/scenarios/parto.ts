import type { Sim } from '../../engine/engine';
import type { Scenario } from '../../engine/types';
import { contact, flagT } from './helpers';

/** Un'attesa (attendi, rivaluta) si interrompe quando il parto chiede le mani dell'equipaggio. */
function stopWait(s: Sim) {
  if (s.busy && ['attendi', 'attendi_lungo', 'rivaluta'].includes(s.busy.actionId)) s.busy = null;
}

/** La nascita: accompagnata dall'equipaggio o precipitosa. */
function nasce(s: Sim, accompagnata: boolean) {
  const p = s.p;
  s.set('natoAt', s.t);
  if (!accompagnata) {
    s.set('precipitoso', s.t);
    s.penalize('parto_non_assistito', 'grave', 'Parto non assistito', 'Con i capelli visibili alla spinta il bambino nasce in pochi minuti: bisogna essere pronti a sostenere la testa e accompagnare l’uscita.', ['CORSO_PARTO']);
    s.say('paziente', 'Durante una spinta il bambino esce di colpo e scivola sul tappeto: nessuno ha sostenuto la testa.');
  } else {
    s.say('paziente', 'Con due spinte esce la testa, che sostieni; poi le spalle, una alla volta, e il corpo scivola tra le tue mani. È un maschio: bagnato, bluastro, non piange ancora.');
  }
  p.look = { ...p.look, pregnant: false };
  p.speech = 'normale';
  p.breathing = 'normale';
  p.position = 'supino';
  s.base.hr = 96;
  s.base.rr = 18;
  stopWait(s);
  s.soundQueue.push('migliora');
}

/** Il neonato piange (è stato asciugato e stimolato). */
const piange = (s: Sim) => s.flags.piangeAt !== undefined;

/** Parto precipitoso in casa, terzo figlio: preparare, accompagnare senza trazione, asciugare e scaldare il neonato, secondamento. */
export const parto: Scenario = {
  id: 'parto',
  title: 'Non c’è più tempo',
  subtitle: 'Terzo figlio, contrazioni ogni due minuti: «sento che devo spingere»',
  category: '118',
  difficulty: 3,
  minutes: 16,
  setting: 'casa',
  timeOfDay: 'notte',
  role: 'msb',
  crew: 2,
  dispatch: {
    luogo: 'K',
    patologia: 'C8',
    criticita: 'G',
    address: 'Codroipo, via Piave 21, piano terra',
    caller: 'Il marito',
    time: '03:40',
    travel: 420,
    text: 'Donna di 31 anni alla 39ª settimana, terzo figlio: contrazioni fortissime ogni due minuti, si sono rotte le acque. Il marito dice che «sente di dover spingere».',
    extra: 'SORES: «Inviamo la vostra BLS; l’ALS è in uscita, arrivo stimato 15 minuti».',
  },
  loadout: {
    essential: ['zaino', 'kit_parto'],
    recommended: ['ossigeno', 'pallone'],
    fetchTime: 90,
    note: 'Possibile parto: il kit parto contiene telini, clamp, forbici sterili e il sacchetto per la placenta. Per il neonato il pallone pediatrico.',
  },
  scene: {
    room: 'camera',
    intro:
      'Camera da letto, luce dell’abat-jour. La donna è sul tappeto ai piedi del letto, appoggiata sui gomiti, e geme a ogni contrazione; i pantaloni del pigiama sono bagnati di liquido chiaro. Il marito, in pigiama, ha in braccio la figlia di due anni che piange; il primogenito dorme. In camera fa freddo: il termosifone è al minimo.',
    hazards: [],
    bystanders: 'Il marito e la figlia di due anni.',
  },
  patient: {
    name: 'Marta',
    age: 31,
    sex: 'F',
    weightKg: 74,
    avpu: 'A',
    gcs: 15,
    airway: 'pervie',
    breathing: 'tachipnoico',
    rhythm: 'tachicardia',
    pulseRadial: true,
    v: { hr: 104, rr: 22, spo2: 98, sbp: 122, dbp: 76, glu: 98, temp: 36.9, crt: 2 },
    skin: { color: 'rosea', temp: 'normale', sweaty: true },
    pupils: 'normali',
    speech: 'frasi_brevi',
    position: 'semiseduto',
    canSwallow: true,
    seizing: false,
    vomitInMouth: false,
    look: { skinTone: '#f0c9a8', hair: '#5a3a22', hairStyle: 'raccolti', shirt: '#e6d3bd', pants: '#4a5a78', build: 'adulto', top: 'felpa', sleeves: 'lunghe', shoes: '#f0c9a8', pregnant: true },
  },
  trauma: false,
  answers: {
    gravidanza: 'Trentanovesima settimana. È a testa in giù, me l’ha detto l’ostetrica al controllo di lunedì. È il terzo: gli altri due sono nati velocissimi. La gravidanza è andata bene, nessun problema.',
    contrazioni: '(tra una contrazione e l’altra) Ogni due minuti… fortissime. Mi si sono rotte le acque mezz’ora fa, liquido chiaro. Sento che devo spingere!',
    eventi: '[Marito] Le contrazioni sono iniziate alle due, poi alle tre si sono rotte le acque e adesso non riesce più a stare in piedi.',
    sintomi: 'Devo spingere… non riesco a non spingere!',
    dolore: 'La pancia e la schiena, a ondate.',
    allergie: 'Nessuna.',
    farmaci: 'Solo l’acido folico e il ferro.',
    patologie: 'Niente, anche le altre gravidanze sono andate bene.',
    pasto: 'Ho cenato alle otto.',
    esordio: '[Marito] Contrazioni dalle due, acque rotte alle tre.',
    testimoni: '[Marito] Il secondo è nato in venti minuti dall’inizio delle contrazioni…',
  },
  exam: {
    testaPiedi: 'Addome di gravidanza a termine, che si indurisce a ogni contrazione. Liquido amniotico chiaro, nessuna perdita di sangue. Nessun altro reperto.',
    addome: 'Utero a termine, contrazioni ogni due minuti della durata di un minuto.',
    extra: {
      gravidanzaBreve: '39ª settimana, presentazione cefalica, terzo figlio, gravidanza fisiologica',
      contrazioniBreve: 'ogni 2 minuti, acque rotte da mezz’ora (liquido chiaro), premiti',
      perineo: 'Durante la spinta il perineo si distende e l’ano si apre: nessuna parte del bambino è ancora visibile.',
      coronamento: 'Durante la spinta compaiono i capelli del bambino e non rientrano più: la testa sta per uscire.',
    },
  },
  protocol: { correct: ['parto'] },
  valutazione: { correct: ['I2'] },
  reportKeys: ['ora_nascita', 'neonato', 'contrazioni'],
  msa: { available: true, eta: 900, autoDispatched: true, label: 'L’ALS' },
  timeLimit: 1800,
  statusExtra: (s) => {
    const nato = s.flags.natoAt !== undefined;
    const rows: { label: string; value: string; tone?: 'ok' | 'warn' | 'bad' }[] = [];
    if (!nato) {
      rows.push({ label: 'Contrazioni', value: s.flags.coronamentoAt !== undefined ? 'spinte continue' : 'ogni 2 minuti', tone: s.flags.coronamentoAt !== undefined ? 'warn' : undefined });
      return rows;
    }
    rows.push({
      label: 'Neonato',
      value: piange(s) ? `piange, roseo${s.flags.avvoltoAt !== undefined ? ', al caldo' : ''}` : 'non piange, cianotico',
      tone: piange(s) ? 'ok' : 'bad',
    });
    rows.push({ label: 'Cordone', value: s.flags.clampatoAt !== undefined ? (s.flags.cordoneTagliato !== undefined ? 'clampato e tagliato' : 'clampato') : 'integro' });
    rows.push({
      label: 'Placenta',
      value: s.flags.placentaAt === undefined ? 'non ancora espulsa' : s.flags.placentaRaccoltaAt !== undefined ? 'nel sacchetto' : 'espulsa',
      tone: s.flags.emorragiaPP !== undefined && s.flags.massaggioAt === undefined ? 'bad' : undefined,
    });
    return rows;
  },
  objectives: [
    {
      id: 'domande',
      label: 'Chieste settimane, presentazione, gravidanze precedenti e contrazioni',
      category: 'valutazione',
      points: 4,
      check: (s) => s.did('q_gravidanza') && s.did('q_contrazioni'),
      why: 'Epoca, presentazione, numero di figli e caratteristiche delle contrazioni dicono se il parto è imminente e se si può partire.',
      sources: ['CORSO_PARTO'],
    },
    {
      id: 'perineo',
      label: 'Perineo controllato durante la spinta: parto imminente riconosciuto',
      category: 'valutazione',
      points: 6,
      check: (s) => s.did('controlla_perineo'),
      why: 'Premiti e capelli visibili durante la spinta: il parto è imminente, non si parte e ci si prepara ad assisterlo.',
      sources: ['CORSO_PARTO'],
    },
    {
      id: 'prepara',
      label: 'Ambiente caldo e kit parto pronti prima della nascita',
      category: 'trattamento',
      points: 10,
      critical: true,
      check: (s) => {
        const p = flagT(s, 'partoPreparatoAt');
        const n = flagT(s, 'natoAt');
        return p !== null && (n === null || p <= n);
      },
      why: 'Il neonato perde calore in pochi minuti: telini caldi, ambiente riscaldato e materiale pronto vanno preparati prima.',
      sources: ['CORSO_PARTO'],
    },
    {
      id: 'posizione',
      label: 'Posizione per il parto: bacino sollevato, cosce divaricate, ginocchia flesse',
      category: 'trattamento',
      points: 6,
      check: (s) => {
        const p = flagT(s, 'posizionePartoAt');
        const n = flagT(s, 'natoAt');
        return p !== null && (n === null || p <= n);
      },
      why: 'Il bacino sollevato di 4–5 cm lascia spazio alla testa e alle spalle durante l’uscita.',
      sources: ['CORSO_PARTO'],
    },
    {
      id: 'accompagna',
      label: 'Nascita accompagnata sostenendo la testa, senza trazioni',
      category: 'trattamento',
      points: 14,
      critical: true,
      check: (s) => s.flags.accompagnaAt !== undefined && s.flags.precipitoso === undefined && !s.did('trazione_testa'),
      why: 'Si sostiene la testa e si accompagna l’uscita: mai tirare testa, spalle o cordone.',
      sources: ['CORSO_PARTO'],
    },
    {
      id: 'ora',
      label: 'Ora di nascita annotata',
      category: 'comunicazione',
      points: 4,
      check: (s) => s.flags.oraAnnotata !== undefined,
      why: 'L’ora di nascita va comunicata in ospedale e scritta nel certificato di assistenza al parto.',
      sources: ['CORSO_PARTO'],
    },
    {
      id: 'asciuga',
      label: 'Neonato asciugato e stimolato entro un minuto',
      category: 'trattamento',
      points: 12,
      critical: true,
      check: (s) => {
        const a = flagT(s, 'asciugatoAt');
        const n = flagT(s, 'natoAt');
        return a !== null && n !== null && a - n <= 60;
      },
      why: 'Di solito il neonato piange entro 30–60 secondi; asciugarlo con energia lo stimola a respirare e riduce la perdita di calore.',
      sources: ['CORSO_PARTO', 'ERC_PLS_2025'],
    },
    {
      id: 'caldo',
      label: 'Neonato avvolto in un telo asciutto con la testa coperta entro 3 minuti',
      category: 'trattamento',
      points: 8,
      check: (s) => {
        const a = flagT(s, 'avvoltoAt');
        const n = flagT(s, 'natoAt');
        return a !== null && n !== null && a - n <= 180;
      },
      why: 'Il neonato bagnato perde calore soprattutto dalla testa: telo asciutto, cuffietta, poi a contatto con la madre.',
      sources: ['CORSO_PARTO', 'ERC_PLS_2025'],
    },
    {
      id: 'cordone',
      label: 'Cordone clampato, non tagliato senza motivo; neonato sul ventre solo dopo il clampaggio',
      category: 'trattamento',
      points: 6,
      check: (s) => s.flags.clampatoAt !== undefined && s.flags.cordoneTagliato === undefined && s.flags.sulVentreAt !== undefined && Number(s.flags.sulVentreAt) >= Number(s.flags.clampatoAt),
      why: 'Si clampa con due clamp; si taglia solo se il cordone è corto. Prima del clampaggio il neonato non va più in alto della madre.',
      sources: ['CORSO_PARTO'],
    },
    {
      id: 'placenta',
      label: 'Placenta raccolta senza trazione, massaggio del fondo uterino',
      category: 'trattamento',
      points: 8,
      check: (s) => s.flags.placentaRaccoltaAt !== undefined && s.flags.massaggioAt !== undefined && !s.did('tira_cordone'),
      why: 'La placenta si stacca da sola. Il massaggio del fondo uterino fa contrarre l’utero e riduce la perdita di sangue.',
      sources: ['CORSO_PARTO'],
    },
  ],
  teaching: [
    'Domande: settimane, presentazione, figli precedenti, contrazioni, acque e colore del liquido.',
    'Premiti e capelli visibili alla spinta: il parto è imminente, non si parte (in ambulanza ci si ferma).',
    'Prima della nascita: ambiente caldo, kit parto, telini, bacino sollevato e ginocchia flesse.',
    'Si sostiene la testa e si accompagna l’uscita: mai trazioni su testa, spalle o cordone.',
    'È nato: ora, garza su naso e bocca, asciugalo e stimolalo, telo asciutto e testa coperta.',
    'Clampa il cordone con due clamp e taglia solo se è corto; poi sul ventre della madre, su un fianco.',
    'Secondamento: la placenta esce da sola; raccoglila nel sacchetto e massaggia il fondo dell’utero.',
  ],
  sources: ['CORSO_PARTO', 'ERC_PLS_2025'],
  hooks: {
    tick: (s) => {
      if (s.phase !== 'paziente' || s.ended) return;
      const c = contact(s);
      const p = s.p;
      // coronamento: i capelli compaiono durante la spinta
      if (s.flags.coronamentoAt === undefined && s.t - c >= 150) {
        s.set('coronamentoAt', s.t);
        p.speech = 'lamento';
        s.say('paziente', '«Sta uscendo! Lo sento, devo spingere!» Marta spinge con tutte le forze a ogni contrazione.');
        stopWait(s);
      }
      // senza nessuno che la assista, la nascita arriva comunque
      if (s.flags.natoAt === undefined && s.flags.coronamentoAt !== undefined && s.flags.accompagnaAt === undefined && s.t - Number(s.flags.coronamentoAt) >= 110) nasce(s, false);
      const nato = flagT(s, 'natoAt');
      if (nato === null) return;
      // il neonato piange se asciugato e stimolato
      const asc = flagT(s, 'asciugatoAt');
      if (!piange(s) && asc !== null && s.t >= asc + 4) {
        s.set('piangeAt', s.t);
        const tardi = asc - nato > 60;
        s.measure('neonato', 'Neonato', tardi ? 'piange dopo stimolazione prolungata, roseo' : 'piange subito, roseo, buon tono');
        s.say('paziente', tardi ? 'Dopo una stimolazione energica il neonato fa un gemito, poi finalmente piange e diventa roseo.' : 'Il neonato apre la bocca e piange forte: diventa roseo e muove braccia e gambe.');
        s.soundQueue.push('migliora');
      }
      if (!piange(s) && s.t - nato === 75 && !s.flags.neonatoIpotonico) {
        s.set('neonatoIpotonico', s.t);
        s.say('paziente', 'Il neonato è ancora bluastro e floscio: non piange.');
        s.soundQueue.push('peggiora');
      }
      if (s.flags.avvoltoAt === undefined && s.t - nato === 180 && !s.flags.neonatoFreddo) {
        s.set('neonatoFreddo', s.t);
        s.say('paziente', 'Il neonato, ancora bagnato e scoperto, ha mani e piedi violacei e freddi.');
      }
      // secondamento
      if (s.flags.placentaAt === undefined && s.t - nato >= 360) {
        s.set('placentaAt', s.t);
        s.say('paziente', 'Marta sente di nuovo il bisogno di spingere: la placenta si stacca da sola ed esce, con circa mezzo litro di sangue.');
        stopWait(s);
      }
      const pl = flagT(s, 'placentaAt');
      if (pl !== null && s.flags.massaggioAt === undefined && s.t - pl === 180 && !s.flags.emorragiaPP) {
        s.set('emorragiaPP', s.t);
        s.base.hr += 22;
        s.base.sbp -= 24;
        p.skin = { ...p.skin, color: 'pallida', sweaty: true };
        s.say('paziente', 'Il sangue continua a uscire: Marta è pallida e sudata, l’utero è molle sotto la mano.');
        s.soundQueue.push('peggiora');
      }
      if (s.flags.emorragiaPP !== undefined && s.flags.massaggioAt !== undefined && !s.flags.emorragiaFerma) {
        s.set('emorragiaFerma', s.t);
        s.base.hr -= 18;
        s.base.sbp += 18;
        s.say('paziente', 'Sotto il massaggio l’utero si indurisce e il sanguinamento rallenta.');
      }
    },
    onAction: (s, id) => {
      if (id === 'accompagna_testa' && s.flags.natoAt === undefined) {
        s.set('accompagnaAt', s.t);
        nasce(s, true);
        return true;
      }
      if (id === 'q_eventi' || id === 'q_esordio') s.measure('contrazioni', 'Contrazioni e perdite', 'ogni 2 minuti, acque rotte da mezz’ora (liquido chiaro), premiti');
      if (id === 'trasporta' && s.flags.natoAt === undefined) {
        s.penalize('partenza_in_espulsiva', 'grave', 'Partenza con il parto in fase espulsiva', 'Con premiti e capelli visibili il parto avviene in pochi minuti: non si parte, lo si assiste sul posto (in ambulanza ci si ferma).', ['CORSO_PARTO']);
      }
    },
    outcome: (s) => {
      if (s.flags.natoAt === undefined)
        return { status: 'critico', title: 'Nato in ambulanza, in corsa', text: 'Partiti con il parto in fase espulsiva, il bambino è nato durante il tragitto senza nessuno pronto ad accoglierlo.' };
      if (s.flags.precipitoso !== undefined || s.did('trazione_testa'))
        return { status: 'critico', title: 'Nascita senza assistenza', text: 'Il bambino è nato senza che nessuno sostenesse la testa: arriva in terapia intensiva neonatale per accertamenti.' };
      if (s.flags.neonatoIpotonico !== undefined || s.flags.neonatoFreddo !== undefined || s.flags.emorragiaPP !== undefined)
        return { status: 'buono', title: 'Madre e neonato in ospedale', text: 'Il parto è andato bene, ma il neonato è rimasto bagnato o non stimolato troppo a lungo, o la madre ha perso più sangue del necessario: entrambi restano in osservazione.' };
      return { status: 'ottimo', title: 'Benvenuto al mondo', text: 'Parto accompagnato, neonato asciutto, al caldo sul ventre della madre e che piange, placenta raccolta: madre e figlio arrivano in ostetricia in ottime condizioni. Il marito chiede come vi chiamate.' };
    },
  },
};
