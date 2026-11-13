import type { Sim } from './engine';
import type { ActionDef, BodyRegion, O2Device, Patient, Position } from './types';
import { VALUTAZIONE } from '../data/codes';
import { altiFlussi, describeO2, emergenzaO2, soresO2Order } from './oxygen';
import { reportLabel } from './scoring';

// ───────────────────────── testi dei reperti
const AVPU_TXT: Record<string, string> = {
  A: 'Sveglio: apre gli occhi spontaneamente e ti guarda (A – Alert).',
  V: 'Risponde solo se chiamato a voce alta (V – Verbal).',
  P: 'Risponde solo allo stimolo doloroso (P – Pain).',
  U: 'Non risponde né alla voce né allo stimolo (U – Unresponsive).',
};

function breathingText(p: Patient, sim: Sim): string {
  if (p.airway === 'ostruzione_completa') return 'Nessun passaggio d’aria: tentativi di respirare senza flusso, rientramenti, nessun suono.';
  switch (p.breathing) {
    case 'assente':
      return 'Non respira: il torace non si muove, nessun flusso d’aria.';
    case 'agonico':
      return 'Respiro agonico (gasping): atti rari, rumorosi, inefficaci. Non è un respiro normale!';
    case 'bradipnoico':
      return `Respiro molto lento e superficiale (circa ${Math.round(p.v.rr)} atti/min).`;
    case 'superficiale':
      return 'Respiro superficiale e poco efficace.';
    case 'tachipnoico':
      return 'Respiro rapido ma regolare.';
    case 'dispnoico':
      return 'Respira con fatica: usa i muscoli accessori, parla a frasi brevi.';
    case 'sibili':
      return 'Respiro difficoltoso con sibili udibili anche a distanza.';
    default:
      return p.airway === 'russante'
        ? 'Respira, ma il respiro è russante: la lingua ostruisce parzialmente le vie aeree.'
        : p.airway === 'gorgogliante'
          ? 'Respira con un gorgoglio: ci sono liquidi nelle vie aeree.'
          : sim.inArrest()
            ? 'Non respira normalmente.'
            : 'Respira normalmente.';
  }
}

function skinText(p: Patient): string {
  const col: Record<string, string> = {
    rosea: 'rosea',
    pallida: 'pallida',
    cianotica: 'cianotica (labbra e unghie bluastre)',
    arrossata: 'arrossata',
    marezzata: 'marezzata',
    grigiastra: 'grigiastra',
  };
  const tmp: Record<string, string> = { normale: 'temperatura normale', fredda: 'fredda', calda: 'calda', molto_calda: 'molto calda e secca al tatto' };
  return `Cute ${col[p.skin.color]}, ${tmp[p.skin.temp]}${p.skin.sweaty ? ', sudata' : ''}.`;
}

const POS_TXT: Record<Position, string> = {
  supino: 'supino',
  laterale: 'in posizione laterale di sicurezza',
  semiseduto: 'semiseduto',
  seduto: 'seduto',
  prono: 'prono',
  in_piedi: 'in piedi',
};

/** Come si presenta l'equipaggio alla radio. */
function crewName(sim: Sim): string {
  return sim.scenario.role === 'squadra' ? 'squadra a piedi' : 'BLS';
}
const lowerFirst = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);

/** Manovre e somministrazioni riservate a infermieri e medici: in FVG il soccorritore non le esegue. */
function fuoriCompetenza(sim: Sim, id: string, cosa: string, why: string) {
  sim.penalize(`competenza_${id}`, 'grave', `${cosa}: non è competenza del soccorritore`, why, ['SORES_FVG', 'DGR_FVG_2039_2015']);
}

/** Paziente che soffoca (o scenario di disostruzione): mostra le manovre per il corpo estraneo. */
function soffoca(s: Sim): boolean {
  return s.p.airway.startsWith('ostruzione') || s.scenario.protocol.correct.some((p) => p.startsWith('fbao')) || s.didAny('incoraggia_tosse', 'colpi_dorsali', 'compressioni_addominali', 'compressioni_toraciche_lattante', 'rimuovi_corpo_estraneo');
}
/** Il DAE è con te, in arrivo o è già stato usato. */
function conDae(s: Sim): boolean {
  return s.has('dae') || s.aedFetchAt !== null || s.aed.phase !== 'spento';
}
/** Ipertermia o scenario da caldo. */
function caldo(s: Sim): boolean {
  return s.p.v.temp >= 38.5 || s.scenario.protocol.correct.includes('colpo_calore');
}

/** Gravidanza in corso o parto appena avvenuto. */
const gravida = (s: Sim) => !!s.p.look.pregnant || s.flags.natoAt !== undefined;
const nato = (s: Sim) => s.flags.natoAt !== undefined;
const frattura = (s: Sim) => s.scenario.lesioni?.frattura;
const distorsione = (s: Sim) => s.scenario.lesioni?.distorsione;
/** Lesione di un arto: frattura o distorsione. */
const lesioneArto = (s: Sim) => !!frattura(s) || !!distorsione(s);
/** Paziente freddo: ipotermia o esposizione al freddo. */
const freddo = (s: Sim) => s.p.skin.temp === 'fredda' || s.p.v.temp < 35.5;

function needPatient(sim: Sim): true | string {
  if (sim.phase !== 'paziente') return 'Non sei ancora accanto al paziente.';
  return true;
}
function trauma(sim: Sim) {
  return sim.scenario.trauma;
}

function answer(sim: Sim, key: keyof Sim['scenario']['answers'], label: string) {
  const a = sim.scenario.answers[key];
  if (!a) {
    sim.find(`${label}: nessuna informazione utile.`);
    return;
  }
  const m = a.match(/^\[([^\]]*)\]\s*(.*)$/s);
  if (!m && !sim.canTalk()) {
    const t = sim.scenario.answers.testimoni;
    if (t) {
      const tm = t.match(/^\[([^\]]*)\]\s*(.*)$/s);
      sim.find(`${label}: il paziente non può rispondere. ${tm ? `${tm[1]}: «${tm[2]}»` : t}`);
    } else sim.find(`${label}: il paziente non è in grado di rispondere e non ci sono testimoni.`);
    return;
  }
  if (m) sim.say('reperto', `${label} — ${m[1]}: «${m[2]}»`);
  else sim.say('paziente', `${label} — «${a}»`);
}

// ───────────────────────── catalogo
const list: ActionDef[] = [
  // ════════════ SCENA
  {
    id: 'guanti',
    label: 'Indossa i guanti',
    group: 'scena',
    duration: 5,
    visible: (s) => s.scenario.role !== 'laico',
    available: (s) => (s.flags.guanti ? 'Hai già i guanti.' : true),
    run: ({ sim }) => {
      sim.set('guanti', true);
      sim.say('azione', 'Indossi i guanti monouso.');
    },
  },
  {
    id: 'dpi',
    label: 'Indossa mascherina FFP2 e occhiali',
    group: 'scena',
    duration: 12,
    visible: (s) => s.scenario.role !== 'laico',
    available: (s) => (s.flags.dpi ? 'Hai già i DPI completi.' : true),
    run: ({ sim }) => {
      sim.set('dpi', true);
      sim.say('azione', 'Indossi facciale filtrante e occhiali protettivi.');
    },
  },
  {
    id: 'alta_visibilita',
    label: 'Indossa l’alta visibilità',
    group: 'scena',
    duration: 6,
    visible: (s) => s.scenario.setting === 'strada' || s.scenario.setting === 'parcheggio' || s.scenario.setting === 'cantiere',
    available: (s) => (s.flags.altaVisibilita ? 'Già indossata.' : true),
    run: ({ sim }) => {
      sim.set('altaVisibilita', true);
      sim.say('azione', 'Indossi giacca e giubbotto ad alta visibilità.');
    },
  },
  {
    id: 'valuta_scena',
    label: 'Valuta la sicurezza della scena',
    short: 'Sicurezza scena',
    group: 'scena',
    duration: 10,
    hint: 'Pericoli, numero di persone coinvolte, dinamica, risorse aggiuntive.',
    run: ({ sim }) => {
      sim.set('scenaValutata', true);
      const h = sim.scenario.scene.hazards;
      if (!h.length) sim.find('La scena appare sicura: nessun pericolo evidente per l’equipaggio.');
      else h.forEach((z) => sim.find(`Pericolo: ${z.label}`));
      if (sim.scenario.scene.mechanism) sim.find(`Dinamica: ${sim.scenario.scene.mechanism}`);
      if (sim.scenario.scene.bystanders) sim.find(`Presenti: ${sim.scenario.scene.bystanders}`);
    },
  },
  {
    id: 'posiziona_mezzo',
    label: 'Posiziona l’ambulanza a protezione con i lampeggianti accesi',
    short: 'Proteggi la scena',
    group: 'scena',
    duration: 20,
    visible: (s) => s.scenario.scene.hazards.some((h) => h.fixAction === 'posiziona_mezzo'),
    run: ({ sim }) => {
      sim.set('fix_posiziona_mezzo', true);
      sim.say('azione', 'Il collega posiziona il mezzo a monte dell’incidente, lampeggianti accesi: l’area di lavoro è protetta.');
    },
  },
  {
    id: 'togli_tensione',
    label: 'Fai togliere la corrente e fermare il macchinario',
    short: 'Togli tensione',
    group: 'scena',
    duration: 25,
    visible: (s) => s.scenario.scene.hazards.some((h) => h.fixAction === 'togli_tensione'),
    run: ({ sim }) => {
      sim.set('fix_togli_tensione', true);
      sim.say('azione', 'Il capocantiere stacca l’interruttore generale: la smerigliatrice è ferma e senza alimentazione.');
    },
  },
  {
    id: 'spegni_fonte',
    label: 'Spegni il fornello e allontana la pentola dalla pozza d’acqua',
    short: 'Spegni il fornello',
    group: 'scena',
    duration: 10,
    visible: (s) => s.scenario.scene.hazards.some((h) => h.fixAction === 'spegni_fonte'),
    run: ({ sim }) => {
      sim.set('fix_spegni_fonte', true);
      sim.say('azione', 'Spegni il fornello, sposti la pentola nel lavello e fai asciugare la pozza con un asciugamano.');
    },
  },
  {
    id: 'apri_spazio',
    label: 'Chiedi alla security di aprire un varco e allontanare la folla',
    short: 'Varco con la security',
    group: 'scena',
    duration: 20,
    visible: (s) => s.scenario.scene.hazards.some((h) => h.fixAction === 'apri_spazio'),
    run: ({ sim }) => {
      sim.set('fix_apri_spazio', true);
      sim.say('azione', 'La security crea un cordone: avete spazio per lavorare e una via di uscita.');
    },
  },
  {
    id: 'messa_sicurezza_acqua',
    label: 'Lascia il recupero in acqua al bagnino: aspetti a riva',
    short: 'Recupero dal bagnino',
    group: 'scena',
    duration: 30,
    visible: (s) => s.scenario.scene.hazards.some((h) => h.fixAction === 'messa_sicurezza_acqua'),
    run: ({ sim }) => {
      sim.set('fix_messa_sicurezza_acqua', true);
      sim.say('azione', 'Il bagnino porta il ragazzo a riva: non entri in acqua senza formazione e attrezzatura.');
    },
  },
  {
    id: 'siringa',
    label: 'Metti in sicurezza la siringa nel contenitore rigido, senza reincappucciarla',
    short: 'Siringa in sicurezza',
    group: 'scena',
    duration: 12,
    visible: (s) => s.scenario.scene.hazards.some((h) => h.fixAction === 'siringa'),
    run: ({ sim }) => {
      sim.set('fix_siringa', true);
      if (!sim.flags.guanti) {
        sim.penalize('siringa_mani_nude', 'grave', 'Siringa maneggiata senza guanti', 'Rischio di puntura accidentale e trasmissione di infezioni: guanti e contenitore rigido, mai reincappucciare.', []);
      }
      sim.say('azione', 'Raccogli la siringa con la pinza e la chiudi nel contenitore per taglienti.');
    },
  },
  {
    id: 'avvicinati',
    label: 'Avvicinati al paziente',
    group: 'scena',
    duration: 8,
    visible: (s) => s.phase === 'scena',
    run: ({ sim }) => {
      const open = sim.scenario.scene.hazards.filter((h) => !sim.flags['fix_' + h.fixAction]);
      if (!sim.flags.scenaValutata) {
        sim.penalize('no_scene_check', 'grave', 'Ti sei avvicinato senza valutare la scena', 'Il primo passo è sempre la sicurezza: tua, dei colleghi, degli astanti e del paziente.', ['ERC_FA_2025', 'ERC_BLS_2025']);
      }
      open.forEach((h) =>
        sim.penalize('hazard_' + h.id, 'critico', `Pericolo non gestito: ${h.label}`, h.consequence, ['ERC_FA_2025']),
      );
      sim.phase = 'paziente';
      sim.set('contattoAt', sim.t);
      sim.say('azione', 'Raggiungi il paziente.');
      const p = sim.p;
      sim.find(`Il paziente è ${POS_TXT[p.position]}.`);
    },
  },
  {
    id: 'chiama_112',
    label: 'Chiama il 112 in vivavoce',
    group: 'scena',
    duration: 15,
    visible: (s) => s.scenario.role === 'laico' && !s.flags.chiamato112,
    run: ({ sim }) => {
      sim.set('chiamato112', true);
      sim.say('radio', 'Operatore 112: «Mi dica dove si trova e cosa è successo». Passi l’indirizzo: l’ambulanza è in arrivo. «Resti in linea in vivavoce, le dico io cosa fare».');
      if (sim.msaAt === null) sim.msaAt = sim.t + sim.scenario.msa.eta;
    },
  },
  {
    id: 'manda_dae',
    label: 'Manda qualcuno a prendere il DAE più vicino',
    short: 'Fai portare il DAE',
    group: 'scena',
    duration: 4,
    visible: (s) => !!s.scenario.scene.publicAed && !s.has('dae') && s.aedFetchAt === null,
    run: ({ sim }) => {
      const pa = sim.scenario.scene.publicAed!;
      sim.aedFetchAt = sim.t + pa.fetchTime;
      sim.set('daeRichiestoAt', sim.t);
      sim.say('azione', `«Tu, con la maglia blu: corri a prendere il DAE ${pa.where} e portalo qui!»`);
    },
  },

  // ════════════ A – VIE AEREE / COSCIENZA
  {
    id: 'coscienza',
    label: 'Valuta la coscienza: chiama e tocca le spalle',
    short: 'Coscienza (AVPU)',
    group: 'valutazione',
    section: 'A – Coscienza e vie aeree',
    duration: 5,
    contact: true,
    available: needPatient,
    regions: ['testa'],
    run: ({ sim }) => {
      const p = sim.p;
      sim.find(AVPU_TXT[p.avpu]);
      sim.measure('avpu', 'Coscienza (AVPU)', p.avpu);
      if (p.seizing) sim.find('Il paziente è in preda a scosse tonico-cloniche generalizzate.');
      if (sim.inArrest() && sim.arrest.recognizedAt === null) sim.set('coscienzaArrestoAt', sim.t);
    },
  },
  {
    id: 'apri_vie_aeree',
    label: 'Apri le vie aeree: iperestensione del capo e sollevamento del mento',
    short: 'Iperestensione del capo',
    group: 'trattamenti',
    section: 'Vie aeree',
    duration: 3,
    contact: true,
    available: needPatient,
    regions: ['testa'],
    run: ({ sim }) => {
      const p = sim.p;
      if (trauma(sim)) {
        sim.penalize('iperestensione_trauma', 'grave', 'Iperestensione del capo in un traumatizzato', 'Nel sospetto di lesione spinale apri le vie aeree con la sublussazione della mandibola, mantenendo il capo in posizione neutra.', ['ERC_FA_2025']);
      }
      if (sim.isInfant()) sim.find('Nel lattante il capo va tenuto in posizione neutra: solo una lieve estensione e sollevamento del mento.');
      sim.set('vieAeree', true);
      if (p.airway === 'russante' && p.avpu !== 'A') {
        p.airway = 'pervie';
        sim.find('Il russamento scompare: le vie aeree ora sono pervie.');
      } else {
        sim.find('Vie aeree aperte.');
      }
    },
  },
  {
    id: 'sublussazione',
    label: 'Sublussazione della mandibola (capo in posizione neutra)',
    short: 'Sublussazione mandibola',
    group: 'trattamenti',
    section: 'Vie aeree',
    visible: (s) => s.scenario.trauma || s.did('sublussazione'),
    duration: 4,
    contact: true,
    available: needPatient,
    regions: ['testa'],
    run: ({ sim }) => {
      const p = sim.p;
      sim.set('vieAeree', true);
      if (p.airway === 'russante') {
        p.airway = 'pervie';
        sim.find('Con la sublussazione della mandibola il russamento scompare.');
      } else sim.find('Vie aeree aperte mantenendo il rachide cervicale allineato.');
    },
  },
  {
    id: 'ispeziona_bocca',
    label: 'Ispeziona il cavo orale',
    short: 'Ispeziona la bocca',
    group: 'valutazione',
    section: 'A – Coscienza e vie aeree',
    duration: 4,
    contact: true,
    available: needPatient,
    regions: ['testa'],
    run: ({ sim }) => {
      const p = sim.p;
      if (p.vomitInMouth) sim.find('Materiale alimentare e vomito nel cavo orale.');
      else sim.find(sim.scenario.exam.cavoOrale ?? 'Cavo orale libero, nessun corpo estraneo visibile.');
    },
  },
  {
    id: 'aspira',
    label: 'Aspira le secrezioni',
    short: 'Aspirazione',
    group: 'trattamenti',
    section: 'Vie aeree',
    duration: 15,
    needs: ['aspiratore'],
    contact: true,
    available: needPatient,
    regions: ['testa'],
    run: ({ sim }) => {
      const p = sim.p;
      if (p.vomitInMouth || p.airway === 'gorgogliante') {
        p.vomitInMouth = false;
        if (p.airway === 'gorgogliante') p.airway = 'pervie';
        sim.find('Aspiri il materiale dal cavo orale: il gorgoglio scompare.');
      } else sim.find('Non c’è materiale da aspirare.');
    },
  },
  {
    id: 'guedel',
    label: 'Inserisci la cannula orofaringea (Guedel), misurata angolo bocca–lobo',
    short: 'Cannula di Guedel',
    group: 'trattamenti',
    section: 'Vie aeree',
    duration: 10,
    needs: ['zaino'],
    contact: true,
    available: needPatient,
    regions: ['testa'],
    run: ({ sim }) => {
      const p = sim.p;
      if (p.avpu !== 'U' || (!sim.inArrest() && p.breathing === 'normale' && p.avpu !== 'U')) {
        sim.penalize('guedel_riflessi', 'grave', 'Cannula orofaringea in paziente con riflessi', 'La cannula si usa solo nel paziente incosciente senza riflesso faringeo: altrimenti provoca vomito e laringospasmo.', ['ERC_BLS_2025']);
        sim.find('Il paziente ha un conato e rifiuta la cannula: la rimuovi.');
        return;
      }
      sim.set('guedel', true);
      if (p.airway === 'russante') p.airway = 'pervie';
      sim.find('Cannula inserita: mantiene la lingua lontana dalla parete posteriore del faringe. Continua a mantenere il capo esteso.');
    },
  },
  {
    id: 'mils',
    label: 'Stabilizza manualmente il capo in posizione neutra',
    short: 'Stabilizzazione del capo',
    group: 'trattamenti',
    section: 'Immobilizzazione',
    visible: (s) => s.scenario.trauma || s.did('mils'),
    duration: 5,
    contact: true,
    available: (s) => (s.immob.has('mils') ? 'Un collega sta già stabilizzando il capo.' : needPatient(s)),
    regions: ['testa', 'collo'],
    run: ({ sim }) => {
      sim.immob.add('mils');
      sim.say('azione', 'Un collega si posiziona alla testa e mantiene il capo in asse.');
    },
  },
  {
    id: 'rimuovi_casco',
    label: 'Rimuovi il casco con la tecnica a due soccorritori',
    short: 'Rimozione casco',
    group: 'trattamenti',
    section: 'Immobilizzazione',
    duration: 40,
    contact: true,
    visible: (s) => !!s.p.look.helmet || s.did('rimuovi_casco'),
    available: (s) => {
      const n = needPatient(s);
      if (n !== true) return n;
      if (!s.p.look.helmet) return 'Il casco è già stato tolto.';
      return true;
    },
    regions: ['testa'],
    run: ({ sim }) => {
      if (!sim.immob.has('mils')) {
        sim.penalize('casco_no_mils', 'grave', 'Casco rimosso senza stabilizzazione', 'Il casco si rimuove in due: uno mantiene l’allineamento di capo e collo, l’altro sfila il casco.', ['ERC_FA_2025']);
      }
      sim.p.look.helmet = false;
      sim.set('cascoRimosso', true);
      sim.find('Casco rimosso mantenendo l’allineamento del capo.');
    },
  },
  {
    id: 'incoraggia_tosse',
    label: 'Incoraggia a tossire',
    group: 'trattamenti',
    section: 'Vie aeree',
    visible: (s) => soffoca(s),
    duration: 6,
    available: needPatient,
    run: ({ sim }) => {
      const p = sim.p;
      if (p.airway === 'ostruzione_parziale') sim.find('Tossisce con forza: continua a incoraggiarlo e sorveglialo.');
      else if (p.airway === 'ostruzione_completa') sim.find('Non riesce a tossire né a parlare: la tosse è inefficace.');
      else sim.find('Non c’è un’ostruzione da risolvere con la tosse.');
    },
  },
  {
    id: 'colpi_dorsali',
    label: '5 colpi interscapolari (paziente inclinato in avanti)',
    short: '5 colpi dorsali',
    group: 'trattamenti',
    section: 'Vie aeree',
    visible: (s) => soffoca(s),
    duration: 8,
    contact: true,
    available: (s) => (s.p.avpu === 'U' ? 'Il paziente è incosciente.' : needPatient(s)),
    run: ({ sim }) => {
      if (sim.isInfant()) {
        sim.find('Lattante prono sull’avambraccio, capo più in basso del torace: dai fino a 5 colpi tra le scapole.');
      } else sim.find('Sostieni il torace, inclini il paziente in avanti e dai fino a 5 colpi decisi tra le scapole.');
      if (sim.p.airway !== 'ostruzione_completa' && sim.p.airway !== 'ostruzione_parziale') sim.find('Non c’è ostruzione.');
    },
  },
  {
    id: 'compressioni_addominali',
    label: '5 compressioni addominali (manovra di Heimlich)',
    short: '5 compressioni addominali',
    group: 'trattamenti',
    section: 'Vie aeree',
    visible: (s) => soffoca(s) && s.p.age >= 1,
    duration: 8,
    contact: true,
    available: (s) => {
      if (s.p.avpu === 'U') return 'Il paziente è incosciente.';
      return needPatient(s);
    },
    run: ({ sim }) => {
      if (sim.isInfant()) {
        sim.penalize('heimlich_lattante', 'critico', 'Compressioni addominali in un lattante', 'Nel lattante si alternano 5 colpi dorsali e 5 compressioni toraciche: le compressioni addominali possono lesionare gli organi.', ['ERC_PLS_2025']);
        return;
      }
      sim.find('Da dietro, pugno tra ombelico e sterno: 5 compressioni rapide verso l’interno e verso l’alto.');
    },
  },
  {
    id: 'compressioni_toraciche_lattante',
    label: '5 compressioni toraciche (lattante supino, due pollici)',
    short: '5 compressioni toraciche',
    group: 'trattamenti',
    section: 'Vie aeree',
    duration: 8,
    contact: true,
    visible: (s) => soffoca(s) && s.p.age < 1,
    available: (s) => (s.p.avpu === 'U' ? 'Il lattante è incosciente.' : needPatient(s)),
    run: ({ sim }) => {
      sim.find('Lattante supino sulle tue ginocchia, capo in basso: 5 compressioni toraciche secche con la tecnica a due pollici.');
    },
  },
  {
    id: 'rimuovi_corpo_estraneo',
    label: 'Rimuovi il corpo estraneo visibile (un solo tentativo, niente dita alla cieca)',
    short: 'Rimuovi oggetto visibile',
    group: 'trattamenti',
    section: 'Vie aeree',
    visible: (s) => soffoca(s),
    duration: 4,
    contact: true,
    available: needPatient,
    regions: ['testa'],
    run: ({ sim }) => {
      if (sim.flags.corpoVisibile) {
        sim.set('corpoRimosso', true);
        sim.find('Vedi il boccone in fondo alla bocca e lo rimuovi con un solo movimento.');
      } else {
        sim.penalize('finger_sweep', 'grave', 'Ricerca alla cieca con le dita', 'Non si esplora la bocca alla cieca: si rimuove solo un oggetto chiaramente visibile.', ['ERC_PLS_2025', 'ERC_FA_2025']);
      }
    },
  },

  // ════════════ B – RESPIRO
  {
    id: 'gas',
    label: 'Guarda, ascolta e senti il respiro (max 10 s)',
    short: 'Respiro (GAS 10 s)',
    group: 'valutazione',
    section: 'B – Respiro',
    duration: 10,
    contact: true,
    available: needPatient,
    regions: ['testa', 'torace'],
    run: ({ sim }) => {
      const p = sim.p;
      sim.find(breathingText(p, sim));
      if (sim.inArrest() && sim.arrest.recognizedAt === null) {
        sim.arrest.recognizedAt = sim.t;
        sim.set('arrestoRiconosciutoAt', sim.t);
        sim.hint('Non risponde e non respira normalmente: è un arresto cardiaco. Compressioni subito e DAE appena disponibile.');
      }
      sim.measure('respiro', 'Respiro', p.breathing === 'normale' ? 'presente, normale' : p.breathing);
    },
  },
  {
    id: 'conta_fr',
    label: 'Conta la frequenza respiratoria (30 s)',
    short: 'Frequenza respiratoria',
    group: 'parametri',
    duration: 30,
    contact: false,
    available: needPatient,
    regions: ['torace'],
    run: ({ sim }) => {
      const rr = Math.round(sim.p.v.rr);
      sim.find(rr === 0 ? 'Nessun atto respiratorio.' : `Frequenza respiratoria: ${rr} atti/min.`);
      sim.measure('fr', 'FR', `${rr}/min`);
    },
  },
  {
    id: 'saturimetro',
    label: 'Applica il saturimetro al dito',
    short: 'Saturimetro',
    group: 'parametri',
    duration: 10,
    needs: ['zaino'],
    contact: true,
    available: (s) => (s.pulseOx ? 'Il saturimetro è già applicato.' : needPatient(s)),
    regions: ['braccio_dx', 'braccio_sx'],
    run: ({ sim }) => {
      sim.pulseOx = true;
      if (!sim.flags.saturimetroAt) sim.set('saturimetroAt', sim.t);
      const lettura = sim.spo2Lettura();
      if (lettura === 'assente') sim.find('Il saturimetro non rileva alcun segnale.');
      else if (lettura === 'instabile') {
        sim.find('Il saturimetro non riesce a leggere: onda piatta e valori che saltano. Il dito è freddo e pallido.');
        sim.measure('spo2', 'SpO₂', 'non rilevabile (segnale instabile)');
      } else {
        const s = Math.round(sim.p.v.spo2);
        sim.find(`SpO₂ ${s}% ${sim.o2 ? 'in ossigeno' : 'in aria ambiente'}, FC ${Math.round(sim.p.v.hr)}/min.`);
        sim.measure('spo2', 'SpO₂', `${s}% ${sim.o2 ? 'in O₂' : 'in aria'}`);
        sim.measure('fc', 'FC', `${Math.round(sim.p.v.hr)}/min`);
      }
    },
  },
  {
    id: 'osserva_torace',
    label: 'Osserva il torace: espansione, simmetria, lavoro respiratorio',
    short: 'Osserva il torace',
    group: 'valutazione',
    section: 'B – Respiro',
    duration: 15,
    contact: true,
    available: needPatient,
    regions: ['torace'],
    run: ({ sim }) => {
      sim.find(sim.scenario.exam.torace ?? 'Espansione toracica simmetrica, nessuna ferita, nessun segno di trauma.');
    },
  },
  {
    id: 'ossigeno',
    label: 'Ossigeno: scegli presidio e flusso',
    short: 'Ossigeno',
    group: 'trattamenti',
    section: 'Ossigeno e ventilazione',
    duration: 15,
    needs: ['ossigeno'],
    contact: true,
    picker: 'ossigeno',
    available: needPatient,
    regions: ['testa'],
    run: ({ sim, params }) => {
      const device = (params?.device as O2Device | null) ?? null;
      const flow = Number(params?.flow ?? 0);
      const fio2 = params?.fio2 === undefined ? undefined : Number(params.fio2);
      const o = sim.o2Order;
      if (device && !sim.bvm && !sim.inArrest() && sim.scenario.role !== 'laico') {
        const match = !!o?.device && o.device === device && (device === 'venturi' ? o.fio2 === fio2 : Math.abs(o.flow - flow) <= 1);
        // in emergenza l'equipaggio può dare da sé ossigeno al 100%, poi lo riferisce alla SORES
        const autonomo = emergenzaO2(sim) && altiFlussi(device, flow);
        if (autonomo && !match) {
          if (sim.flags.o2AutonomoAt === undefined) sim.set('o2AutonomoAt', sim.t);
        } else if (!match) {
          const why = o?.device
            ? `La SORES aveva indicato ${describeO2(o.device, o.flow, o.fio2)}: fuori dall’emergenza presidio e concentrazione li decide la Centrale in base alla saturazione che riferisci.`
            : o
              ? 'La SORES aveva indicato che l’ossigeno non serviva.'
              : emergenzaO2(sim)
                ? 'In emergenza l’equipaggio può dare in autonomia solo ossigeno al 100% (maschera con reservoir a 15 L/min o pallone); altri presidi e concentrazioni li indica la SORES.'
                : 'Fuori dall’emergenza presidio e concentrazione li decide la SORES dopo che le hai riferito la saturazione.';
          sim.penalize(o ? 'o2_non_indicato' : 'o2_senza_indicazione', 'grave', o ? 'Ossigeno diverso dall’indicazione della SORES' : 'Ossigeno senza indicazione della SORES', why, ['SORES_FVG', 'BTS_O2_2017']);
        }
      }
      sim.setO2(device, flow, fio2);
    },
  },
  {
    id: 'chiedi_ossigeno',
    label: 'Riferisci la SpO₂ alla SORES e chiedi l’indicazione per l’ossigeno',
    short: 'SpO₂ alla SORES',
    group: 'trattamenti',
    section: 'Ossigeno e ventilazione',
    duration: 20,
    visible: (s) => s.scenario.role !== 'laico',
    available: (s) => {
      const n = needPatient(s);
      if (n !== true) return n;
      if (!s.pulseOx) return 'Saturimetro non applicato.';
      if (s.inArrest()) return 'Paziente in arresto cardiaco.';
      return true;
    },
    run: ({ sim }) => {
      const o = soresO2Order(sim);
      sim.o2Order = o;
      if (!sim.flags.o2RiferitoAt) sim.set('o2RiferitoAt', sim.t);
      const leggibile = sim.spo2Lettura() === 'ok';
      sim.say('radio', `Tu: «SORES da ${crewName(sim)}: ${leggibile ? `saturazione ${o.spo2}% ${sim.o2 ? 'in ossigeno' : 'in aria ambiente'}` : 'il saturimetro non legge, segnale instabile'}».`);
      const [lo, hi] = o.target;
      if (sim.scenario.oxygen?.co && o.device) sim.say('radio', `SORES: «Ricevuto. Con il sospetto di monossido la saturazione non è affidabile: ${sim.o2 && sim.o2.device === o.device ? 'mantenete' : 'applicate'} ${describeO2(o.device, o.flow, o.fio2)}, qualunque sia il valore».`);
      else if (!leggibile && o.device) sim.say('radio', `SORES: «Ricevuto. Senza una lettura affidabile ${sim.o2 && sim.o2.device === o.device ? 'mantenete' : 'applicate'} ${describeO2(o.device, o.flow, o.fio2)}».`);
      else if (!o.device) sim.say('radio', `SORES: «Ricevuto, ${o.spo2}%. L’ossigeno per ora non serve: continuate a monitorare e riferite se scende sotto il ${lo}%».`);
      else if (sim.o2 && sim.o2.device === o.device && (o.device !== 'venturi' || sim.o2.fio2 === o.fio2)) sim.say('radio', `SORES: «Ricevuto. Mantenete ${describeO2(o.device, o.flow, o.fio2)}, obiettivo ${lo}–${hi}%».`);
      else sim.say('radio', `SORES: «Ricevuto. Applicate ${describeO2(o.device, o.flow, o.fio2)}, obiettivo ${lo}–${hi}%. Ricontrollate e riferite».`);
    },
  },
  {
    id: 'pallone',
    label: 'Ventila con pallone autoespansibile e maschera',
    short: 'Ventila col pallone',
    group: 'trattamenti',
    section: 'Ossigeno e ventilazione',
    duration: 10,
    needs: ['pallone'],
    contact: true,
    available: (s) => {
      const n = needPatient(s);
      if (n !== true) return n;
      if (s.bvm) return 'Stai già ventilando con il pallone.';
      return true;
    },
    regions: ['testa'],
    run: ({ sim }) => {
      const p = sim.p;
      if (sim.inArrest()) {
        sim.cpr.ventilation = 'pallone';
        sim.say('azione', `Il collega alla testa ventila con pallone e maschera${sim.isChild() ? ' pediatrici' : ''}: 2 insufflazioni ogni ${sim.cpr.ratio === '15:2' ? 15 : 30} compressioni.`);
        if (!sim.o2 && sim.has('ossigeno')) sim.hint('Collega il pallone all’ossigeno ad alti flussi (reservoir) appena possibile.');
        return;
      }
      if (p.avpu === 'A' && (p.breathing === 'normale' || p.breathing === 'tachipnoico' || p.breathing === 'dispnoico' || p.breathing === 'sibili')) {
        sim.penalize('bvm_inutile', 'grave', 'Ventilazione forzata in un paziente cosciente che respira', 'Il pallone serve quando il respiro è assente o inefficace; nel paziente cosciente si somministra ossigeno con maschera.', ['ERC_FA_2025']);
        return;
      }
      sim.bvm = true;
      sim.set('bvmAt', sim.t);
      sim.say('azione', 'Ventili con pallone e maschera: un’insufflazione ogni 6 secondi circa, quanto basta a sollevare il torace.');
    },
  },
  {
    id: 'stop_pallone',
    label: 'Interrompi la ventilazione con pallone',
    group: 'trattamenti',
    section: 'Ossigeno e ventilazione',
    duration: 2,
    visible: (s) => s.bvm,
    run: ({ sim }) => {
      sim.bvm = false;
      sim.say('azione', 'Interrompi la ventilazione assistita.');
    },
  },
  {
    id: 'ventilazioni_iniziali',
    label: '5 ventilazioni di soccorso iniziali',
    short: '5 ventilazioni iniziali',
    group: 'trattamenti',
    section: 'Ossigeno e ventilazione',
    visible: (s) => s.inArrest() || s.p.breathing === 'assente' || s.p.breathing === 'agonico' || s.did('ventilazioni_iniziali'),
    duration: 12,
    contact: true,
    available: needPatient,
    regions: ['testa'],
    run: ({ sim }) => {
      sim.set('ventilazioniIniziali', sim.t);
      if (!sim.inArrest() && sim.p.breathing !== 'assente' && sim.p.breathing !== 'agonico') {
        sim.penalize('vent_inutili', 'grave', 'Ventilazioni di soccorso in un paziente che respira', 'Le ventilazioni di soccorso si danno solo se il respiro è assente o non normale.', ['ERC_PLS_2025']);
        return;
      }
      sim.say('azione', sim.has('pallone') ? 'Dai 5 ventilazioni con pallone e maschera, ciascuna di circa 1 secondo, guardando il torace sollevarsi.' : 'Dai 5 ventilazioni di soccorso con la pocket mask, ciascuna di circa 1 secondo.');
      sim.p.spo2Air = Math.min(70, sim.p.spo2Air + 10);
    },
  },

  // ════════════ C – CIRCOLO
  {
    id: 'polso_carotideo',
    label: 'Cerca il polso carotideo insieme al respiro (max 10 s)',
    short: 'Polso carotideo',
    group: 'valutazione',
    section: 'C – Circolo',
    duration: 10,
    contact: true,
    available: needPatient,
    regions: ['collo'],
    run: ({ sim }) => {
      if (sim.inArrest()) sim.find('Nessun polso carotideo percepibile. (In caso di dubbio, agisci come se il polso fosse assente.)');
      else sim.find(`Polso carotideo presente, ${sim.p.v.hr > 100 ? 'rapido' : sim.p.v.hr < 50 ? 'lento' : 'regolare'}.`);
    },
  },
  {
    id: 'polso_radiale',
    label: 'Valuta il polso radiale (frequenza, ritmo, forza)',
    short: 'Polso radiale',
    group: 'parametri',
    duration: 15,
    contact: true,
    available: needPatient,
    regions: ['braccio_dx', 'braccio_sx'],
    run: ({ sim }) => {
      const p = sim.p;
      if (sim.inArrest() || !p.pulseRadial) sim.find('Polso radiale non palpabile.');
      else {
        const hr = Math.round(p.v.hr);
        const force = p.v.sbp < 95 ? 'debole e filiforme' : 'valido';
        sim.find(`Polso radiale ${force}, ${hr} battiti/min${p.rhythm === 'tachicardia' ? ', irregolare' : ', ritmico'}.`);
        sim.measure('fc', 'FC', `${hr}/min`);
      }
    },
  },
  {
    id: 'trc',
    label: 'Tempo di riempimento capillare',
    short: 'Riempimento capillare',
    group: 'parametri',
    duration: 5,
    contact: true,
    available: needPatient,
    regions: ['braccio_dx', 'braccio_sx'],
    run: ({ sim }) => {
      const c = sim.p.v.crt;
      sim.find(`Riempimento capillare ${c <= 2 ? 'normale (≤ 2 s)' : `rallentato (circa ${Math.round(c)} s)`}.`);
      sim.measure('trc', 'Riempimento capillare', `${Math.round(c)} s`);
    },
  },
  {
    id: 'cute',
    label: 'Valuta la cute: colore, temperatura, sudorazione',
    short: 'Cute',
    group: 'valutazione',
    section: 'C – Circolo',
    duration: 5,
    contact: true,
    available: needPatient,
    regions: ['testa', 'braccio_dx', 'braccio_sx'],
    run: ({ sim }) => {
      sim.find(skinText(sim.p));
      sim.measure('cute', 'Cute', `${sim.p.skin.color}, ${sim.p.skin.temp}${sim.p.skin.sweaty ? ', sudata' : ''}`);
    },
  },
  {
    id: 'pressione',
    label: 'Misura la pressione arteriosa',
    short: 'Pressione arteriosa',
    group: 'parametri',
    duration: 40,
    needs: ['zaino'],
    contact: true,
    available: needPatient,
    regions: ['braccio_dx', 'braccio_sx'],
    run: ({ sim }) => {
      const v = sim.p.v;
      if (sim.inArrest() || v.sbp < 50) {
        sim.find('Pressione non rilevabile.');
        sim.measure('pa', 'PA', 'non rilevabile');
        return;
      }
      const s = Math.round(v.sbp / 5) * 5;
      const d = Math.round(v.dbp / 5) * 5;
      sim.find(`Pressione arteriosa ${s}/${d} mmHg.`);
      sim.measure('pa', 'PA', `${s}/${d} mmHg`);
      sim.set('paMisurataAt', sim.t);
    },
  },
  {
    id: 'cerca_emorragie',
    label: 'Cerca emorragie importanti (testa-piedi rapido)',
    short: 'Cerca emorragie',
    group: 'valutazione',
    section: 'C – Circolo',
    duration: 8,
    contact: true,
    available: needPatient,
    run: ({ sim }) => {
      const b = sim.p.bleeding;
      if (b && sim.bleedingRate() > 0) sim.find(`Emorragia ${b.arterial ? 'arteriosa, a getto' : 'importante'}: ${b.label}.`);
      else if (b) sim.find(`Ferita: ${b.label} — sanguinamento controllato.`);
      else sim.find('Nessuna emorragia esterna importante.');
    },
  },
  {
    id: 'compressione_diretta',
    label: 'Compressione manuale diretta e decisa sulla ferita',
    short: 'Compressione diretta',
    group: 'trattamenti',
    section: 'Emorragie',
    visible: (s) => !!s.p.bleeding || s.scenario.trauma || s.did('compressione_diretta'),
    duration: 5,
    contact: true,
    available: (s) => {
      const n = needPatient(s);
      if (n !== true) return n;
      if (!s.p.bleeding) return 'Non c’è un’emorragia da comprimere.';
      if (s.pressure) return 'Un collega sta già comprimendo.';
      return true;
    },
    regions: ['braccio_dx', 'braccio_sx', 'gamba_dx', 'gamba_sx'],
    run: ({ sim }) => {
      sim.pressure = true;
      if (!sim.flags.emostasiAt) sim.set('emostasiAt', sim.t);
      sim.say('azione', sim.p.bleeding?.arterial ? 'Comprimi con forza: il sangue rallenta ma continua a filtrare tra le dita.' : 'Comprimi con forza sulla ferita: il sanguinamento si riduce.');
    },
  },
  {
    id: 'medicazione',
    label: 'Garza emostatica nella ferita e bendaggio compressivo',
    short: 'Medicazione emostatica',
    group: 'trattamenti',
    section: 'Emorragie',
    visible: (s) => !!s.p.bleeding || s.did('medicazione'),
    duration: 45,
    needs: ['kit_emorragie'],
    contact: true,
    available: (s) => (!s.p.bleeding ? 'Non c’è un’emorragia.' : s.dressing ? 'Già medicata.' : needPatient(s)),
    regions: ['braccio_dx', 'braccio_sx', 'gamba_dx', 'gamba_sx'],
    run: ({ sim }) => {
      sim.dressing = true;
      if (!sim.flags.emostasiAt) sim.set('emostasiAt', sim.t);
      sim.say('azione', 'Zaffi la garza emostatica nella ferita e la mantieni con un bendaggio compressivo.');
      if (sim.p.bleeding?.arterial) sim.find('Il bendaggio si impregna rapidamente: il sanguinamento non è controllato.');
    },
  },
  {
    id: 'tourniquet',
    label: 'Applica il tourniquet (scegli la posizione)',
    short: 'Tourniquet',
    group: 'trattamenti',
    section: 'Emorragie',
    visible: (s) => !!s.p.bleeding || s.scenario.trauma || s.did('tourniquet'),
    duration: 25,
    needs: ['kit_emorragie'],
    contact: true,
    picker: 'tourniquet',
    available: (s) => (s.tourniquet?.ok ? 'Il tourniquet è già applicato correttamente.' : needPatient(s)),
    regions: ['braccio_dx', 'braccio_sx', 'gamba_dx', 'gamba_sx'],
    run: ({ sim, params }) => {
      const pos = Number(params?.pos ?? 0.5);
      const region = (params?.region as BodyRegion) ?? 'gamba_dx';
      const b = sim.p.bleeding;
      if (!b) {
        sim.penalize('tq_inutile', 'grave', 'Tourniquet senza emorragia', 'Il tourniquet si usa solo per emorragie degli arti pericolose per la vita.', ['ERC_FA_2025']);
        return;
      }
      if (region !== b.region) {
        sim.penalize('tq_arto', 'grave', 'Tourniquet sull’arto sbagliato', 'Il laccio va sull’arto che sanguina, 5–7 cm a monte della ferita.', ['ERC_FA_2025']);
        sim.tourniquet = { at: sim.t, region, pos, ok: false };
        return;
      }
      const joint = params?.joint === true;
      const above = pos < b.pos;
      const lenCm = region.startsWith('gamba') ? 95 : 75;
      const cm = Math.round((b.pos - pos) * lenCm);
      const ok = above && !joint;
      sim.tourniquet = { at: sim.t, region, pos, ok };
      sim.set('tqCm', cm);
      if (!sim.flags.emostasiAt) sim.set('emostasiAt', sim.t);
      const ora = sim.clock();
      if (!above) {
        sim.penalize('tq_sotto', 'critico', 'Tourniquet a valle della ferita', 'Il tourniquet va posizionato a monte della ferita (tra ferita e cuore), 5–7 cm sopra.', ['ERC_FA_2025']);
      } else if (joint) {
        sim.penalize('tq_articolazione', 'grave', 'Tourniquet su un’articolazione', 'Sopra un’articolazione il laccio non comprime l’arteria: posizionalo 5–7 cm sopra la ferita, evitando le articolazioni.', ['ERC_FA_2025']);
      } else if (cm > 15) {
        sim.hint(`Il laccio è circa ${cm} cm sopra la ferita: funziona, ma la raccomandazione è 5–7 cm a monte per risparmiare tessuto.`);
      }
      if (sim.tourniquet.ok) {
        sim.say('azione', `Stringi il tourniquet finché il sanguinamento si arresta (fa male: è normale). Annoti l’ora: ${ora}.`);
        sim.find('Il sanguinamento si è fermato. Polso a valle assente.');
        sim.measure('tq', 'Tourniquet', `applicato alle ${ora}`);
      } else {
        sim.find('Il sangue continua a uscire.');
      }
    },
  },
  {
    id: 'cintura_pelvica',
    label: 'Applica la cintura pelvica all’altezza dei grandi trocanteri',
    short: 'Cintura pelvica',
    group: 'trattamenti',
    section: 'Immobilizzazione',
    visible: (s) => s.scenario.trauma || s.did('cintura_pelvica'),
    duration: 60,
    needs: ['cintura_pelvica'],
    contact: true,
    available: needPatient,
    regions: ['bacino'],
    run: ({ sim }) => {
      sim.immob.add('pelvica');
      if (!sim.flags.traumaBacino) {
        sim.hint('Non ci sono elementi di sospetta frattura di bacino: la cintura non era necessaria.');
      } else sim.say('azione', 'Cintura pelvica posizionata sui grandi trocanteri e serrata: riduce il volume pelvico e il sanguinamento.');
    },
  },
  {
    id: 'rcp',
    label: 'Inizia le compressioni toraciche (RCP)',
    short: 'RCP',
    group: 'trattamenti',
    section: 'RCP e DAE',
    duration: 2,
    contact: true,
    available: (s) => {
      const n = needPatient(s);
      if (n !== true) return n;
      if (s.cpr.active && s.cpr.by !== 'astante') return 'La RCP è già in corso.';
      return true;
    },
    regions: ['torace'],
    run: ({ sim }) => {
      sim.startCpr('equipaggio');
    },
  },
  {
    id: 'cambio_compressore',
    label: 'Cambio compressore (ogni 2 minuti)',
    group: 'trattamenti',
    section: 'RCP e DAE',
    duration: 3,
    visible: (s) => s.cpr.active && s.scenario.crew > 1,
    run: ({ sim }) => sim.rotateCompressor(),
  },
  {
    id: 'stop_rcp',
    label: 'Interrompi le compressioni e rivaluta',
    group: 'trattamenti',
    section: 'RCP e DAE',
    duration: 2,
    visible: (s) => s.cpr.active,
    run: ({ sim }) => {
      sim.stopCpr('Interrompi le compressioni.');
      if (sim.inArrest()) {
        sim.penalize('stop_cpr_' + sim.t, 'lieve', 'Pausa delle compressioni non necessaria', 'Le compressioni si interrompono solo per l’analisi del DAE o se compaiono chiari segni di vita.', ['ERC_BLS_2025']);
      }
    },
  },
  {
    id: 'dae_accendi',
    label: 'Accendi il DAE',
    short: 'Accendi DAE',
    group: 'trattamenti',
    section: 'RCP e DAE',
    visible: (s) => conDae(s),
    duration: 3,
    needs: ['dae'],
    available: (s) => (s.aed.phase !== 'spento' ? 'Il DAE è già acceso.' : needPatient(s)),
    regions: ['torace'],
    run: ({ sim }) => {
      sim.aedOn();
      sim.say('azione', 'Accendi il DAE e segui le istruzioni vocali.');
    },
  },
  {
    id: 'dae_piastre',
    label: 'Applica le piastre del DAE (scegli la posizione)',
    short: 'Piastre DAE',
    group: 'trattamenti',
    section: 'RCP e DAE',
    visible: (s) => conDae(s),
    duration: 15,
    needs: ['dae'],
    contact: true,
    picker: 'dae_piastre',
    available: (s) => (s.aed.phase === 'spento' ? 'Il DAE è spento.' : s.aed.pads && s.aed.pads !== 'errata' ? 'Le piastre sono già applicate.' : needPatient(s)),
    regions: ['torace'],
    run: ({ sim, params }) => {
      const pos = (params?.pos as 'anterolaterale' | 'anteroposteriore' | 'errata') ?? 'anterolaterale';
      const ped = params?.pediatric === true;
      sim.say('azione', `Scopri e asciughi il torace, applichi le piastre in posizione ${pos === 'errata' ? 'non corretta' : pos}${ped ? ' attivando la modalità pediatrica' : ''}.`);
      if (sim.p.weightKg < 25 && pos === 'anterolaterale' && !ped) {
        sim.hint('Sotto i 25 kg (circa 8 anni) la ERC raccomanda la posizione antero-posteriore e la modalità pediatrica se disponibile.');
      }
      sim.aedPads(pos, ped);
    },
  },
  {
    id: 'allontanatevi',
    label: '«Via tutti! Nessuno tocchi il paziente»',
    short: 'Via tutti!',
    group: 'trattamenti',
    section: 'RCP e DAE',
    visible: (s) => conDae(s) && s.aed.phase !== 'spento',
    duration: 1,
    available: (s) => (s.aed.phase === 'spento' ? 'Il DAE non è acceso.' : true),
    run: ({ sim }) => {
      sim.aed.clearCalledAt = sim.t;
      sim.say('azione', '«Via tutti! Io sono via, voi siete via, tutti sono via!» Controlli che nessuno tocchi il paziente.');
      if (sim.cpr.active) sim.stopCpr('Il collega solleva le mani dal torace.');
    },
  },

  // ════════════ D – NEUROLOGICO
  {
    id: 'pupille',
    label: 'Valuta le pupille con la lampadina',
    short: 'Pupille',
    group: 'parametri',
    duration: 8,
    needs: ['zaino'],
    contact: true,
    available: needPatient,
    regions: ['testa'],
    run: ({ sim }) => {
      const t: Record<string, string> = {
        normali: 'Pupille isocoriche, normoreagenti alla luce.',
        miotiche: 'Pupille miotiche (a capocchia di spillo), simmetriche.',
        midriatiche: 'Pupille midriatiche, poco reagenti.',
        anisocoriche: 'Pupille anisocoriche: la destra è più dilatata della sinistra.',
      };
      sim.find(t[sim.p.pupils]);
      sim.measure('pupille', 'Pupille', sim.p.pupils);
    },
  },
  {
    id: 'glicemia',
    label: 'Misura la glicemia capillare',
    short: 'Glicemia',
    group: 'parametri',
    visible: (s) => !!s.flags.diabetico || s.p.avpu !== 'A' || s.p.speech !== 'normale' || s.did('glicemia'),
    duration: 10,
    needs: ['zaino'],
    contact: true,
    available: needPatient,
    run: ({ sim }) => {
      fuoriCompetenza(sim, 'glicemia', 'Glicemia capillare', 'È una manovra invasiva (puntura del dito): la esegue l’infermiere dell’ALS o il medico. Tu riferisci alla SORES coscienza, parametri e che il paziente è diabetico.');
    },
  },
  {
    id: 'cincinnati',
    label: 'Scala di Cincinnati: viso, braccia, linguaggio',
    short: 'Cincinnati',
    group: 'valutazione',
    section: 'D – Neurologico',
    duration: 40,
    contact: true,
    available: (s) => {
      const n = needPatient(s);
      if (n !== true) return n;
      if (s.p.avpu !== 'A') return 'Il paziente non è abbastanza vigile da eseguire gli ordini.';
      return true;
    },
    regions: ['testa'],
    run: ({ sim }) => {
      const st = sim.p.stroke ?? { face: false, arm: false, speech: false };
      sim.find(`Mimica facciale: ${st.face ? 'ANOMALA – l’angolo destro della bocca non si solleva' : 'normale, sorriso simmetrico'}.`);
      sim.find(`Slivellamento delle braccia: ${st.arm ? 'ANOMALO – il braccio destro cade entro 10 secondi' : 'normale, braccia ferme'}.`);
      sim.find(`Linguaggio: ${st.speech ? 'ANOMALO – parole impastate, non riesce a ripetere la frase' : 'normale'}.`);
      const pos = [st.face, st.arm, st.speech].filter(Boolean).length;
      sim.measure('cincinnati', 'Cincinnati', pos ? `positiva (${pos}/3)` : 'negativa');
      sim.set('cincinnatiAt', sim.t);
    },
  },
  {
    id: 'temperatura',
    label: 'Misura la temperatura',
    short: 'Temperatura',
    group: 'parametri',
    duration: 20,
    needs: ['zaino'],
    contact: true,
    available: needPatient,
    regions: ['testa'],
    run: ({ sim }) => {
      const tmp = sim.p.v.temp.toFixed(1).replace('.', ',');
      sim.find(`Temperatura: ${tmp} °C${sim.p.v.temp >= 40 ? ' (iperpiressia grave)' : sim.p.v.temp < 35 ? ' (ipotermia)' : ''}.`);
      sim.measure('temperatura', 'Temperatura', `${tmp} °C`);
      if (!sim.flags.temperaturaAt) sim.set('temperaturaAt', sim.t);
    },
  },
  {
    id: 'orientamento',
    label: 'Chiedi nome, luogo e data (orientamento)',
    short: 'Orientamento',
    group: 'valutazione',
    section: 'D – Neurologico',
    duration: 10,
    available: needPatient,
    run: ({ sim }) => {
      const p = sim.p;
      if (p.avpu !== 'A') sim.find('Non risponde in modo comprensibile.');
      else if (p.speech === 'confuso') sim.find('Risponde in modo confuso, non sa dove si trova né che giorno è.');
      else if (p.speech === 'afasico' || p.speech === 'disartrico') sim.find('Capisce le domande ma fatica ad articolare le parole.');
      else sim.find('Orientato nel tempo, nello spazio e sulla persona.');
    },
  },
  {
    id: 'motilita',
    label: 'Valuta movimento e sensibilità dei quattro arti',
    short: 'Motilità e sensibilità',
    group: 'valutazione',
    section: 'D – Neurologico',
    duration: 20,
    contact: true,
    available: needPatient,
    run: ({ sim }) => {
      sim.find(sim.scenario.exam.extra?.motilita ?? (sim.p.avpu === 'A' ? 'Muove i quattro arti, sensibilità conservata.' : 'Non valutabile in modo affidabile.'));
    },
  },
  {
    id: 'proteggi_crisi',
    label: 'Proteggi il capo, allontana gli oggetti e non trattenere',
    short: 'Proteggi durante la crisi',
    group: 'trattamenti',
    section: 'Posizione e altre cure',
    visible: (s) => s.p.seizing || s.did('proteggi_crisi'),
    duration: 6,
    available: (s) => (!s.p.seizing ? 'Non è in corso una crisi.' : needPatient(s)),
    run: ({ sim }) => {
      sim.set('protettoAt', sim.t);
      sim.say('azione', 'Metti una giacca sotto la testa, allontani gli oggetti pericolosi e lasci libere le scosse.');
    },
  },
  {
    id: 'cronometra',
    label: 'Annota l’ora di inizio della crisi e cronometra',
    short: 'Cronometra la crisi',
    group: 'trattamenti',
    section: 'Posizione e altre cure',
    visible: (s) => s.p.seizing || s.did('cronometra'),
    duration: 2,
    available: (s) => (!s.p.seizing ? 'Non è in corso una crisi.' : true),
    run: ({ sim }) => {
      sim.set('cronometroAt', sim.t);
      const from = Number(sim.flags.crisiInizio ?? 0);
      sim.say('azione', `Fai partire il cronometro. Secondo i presenti la crisi è iniziata circa ${Math.max(1, Math.round((sim.t - from) / 60))} minuti fa.`);
    },
  },
  {
    id: 'blocca_paziente',
    label: 'Blocca braccia e gambe per fermare le convulsioni',
    short: 'Blocca le convulsioni',
    group: 'trattamenti',
    section: 'Posizione e altre cure',
    duration: 6,
    visible: (s) => s.p.seizing || s.did('blocca_paziente'),
    available: needPatient,
    run: ({ sim }) => {
      sim.penalize('blocca_crisi', 'grave', 'Hai trattenuto il paziente durante la crisi', 'Trattenere gli arti non ferma la crisi e causa lesioni a te e al paziente: proteggi e lascia libere le scosse.', ['LICE']);
    },
  },
  {
    id: 'oggetto_bocca',
    label: 'Metti qualcosa tra i denti per proteggere la lingua',
    short: 'Oggetto in bocca',
    group: 'trattamenti',
    section: 'Posizione e altre cure',
    duration: 5,
    visible: (s) => s.p.seizing || s.did('oggetto_bocca'),
    available: needPatient,
    run: ({ sim }) => {
      sim.penalize('oggetto_bocca', 'critico', 'Oggetto in bocca durante la crisi', 'Non si mette nulla in bocca: rischi di rompere i denti, ostruire le vie aeree o farti mordere.', ['LICE']);
    },
  },

  // ════════════ E – ESPOSIZIONE
  {
    id: 'testa_piedi',
    label: 'Esame testa-piedi',
    short: 'Testa-piedi',
    group: 'valutazione',
    section: 'E – Esposizione',
    duration: 60,
    contact: true,
    available: needPatient,
    run: ({ sim }) => {
      sim.find(sim.scenario.exam.testaPiedi);
      if (sim.scenario.exam.addome) sim.find(sim.scenario.exam.addome);
      if (sim.scenario.exam.arti) sim.find(sim.scenario.exam.arti);
      sim.set('testaPiediAt', sim.t);
    },
  },
  {
    id: 'telo',
    label: 'Copri con il telo isotermico',
    short: 'Telo isotermico',
    group: 'trattamenti',
    section: 'Posizione e altre cure',
    duration: 10,
    needs: ['zaino'],
    contact: true,
    available: (s) => (s.covered ? 'Il paziente è già coperto.' : needPatient(s)),
    run: ({ sim }) => {
      sim.covered = true;
      sim.set('teloAt', sim.t);
      sim.say('azione', 'Copri il paziente con il telo isotermico per prevenire l’ipotermia.');
      if (sim.p.v.temp >= 39) {
        sim.penalize('telo_ipertermia', 'grave', 'Telo isotermico su un paziente ipertermico', 'Coprire un paziente con il colpo di calore trattiene il calore: va raffreddato attivamente.', ['ERC_FA_2025']);
      }
    },
  },
  {
    id: 'scopri',
    label: 'Togli gli indumenti in eccesso e porta all’ombra',
    short: 'Togli indumenti, ombra',
    group: 'trattamenti',
    section: 'Posizione e altre cure',
    visible: (s) => caldo(s) || s.did('scopri'),
    duration: 20,
    contact: true,
    available: needPatient,
    run: ({ sim }) => {
      sim.covered = false;
      sim.set('scopertoAt', sim.t);
      sim.say('azione', 'Togli gli indumenti in eccesso e sposti il paziente in un punto ombreggiato e ventilato (raffreddamento passivo).');
      if (sim.p.v.temp >= 39 && !sim.cooling) sim.base.temp = Math.max(36.8, sim.base.temp - 0.05);
    },
  },
  {
    id: 'raffredda',
    label: 'Raffreddamento attivo (scegli il metodo)',
    short: 'Raffreddamento attivo',
    group: 'trattamenti',
    section: 'Posizione e altre cure',
    visible: (s) => caldo(s) || s.did('raffredda'),
    duration: 30,
    contact: true,
    picker: 'raffreddamento',
    available: (s) => (s.cooling ? 'Il raffreddamento è già in corso.' : needPatient(s)),
    run: ({ sim, params }) => {
      const method = String(params?.method ?? 'impacchi');
      const rates: Record<string, { rate: number; label: string; needs?: string }> = {
        immersione: { rate: 0.2, label: 'immersione in acqua fredda (collo in giù) nella vasca del PMA' },
        taco: { rate: 0.14, label: 'telo impermeabile con acqua e ghiaccio (TACO)' },
        impacchi: { rate: 0.07, label: 'teli bagnati, ghiaccio su collo, ascelle e inguine' },
        ventilazione: { rate: 0.04, label: 'nebulizzazione d’acqua e ventilazione' },
      };
      const m = rates[method] ?? rates.impacchi;
      sim.cooling = { method, since: sim.t, rate: m.rate };
      sim.set('raffreddamentoAt', sim.t);
      sim.set('raffreddamentoMetodo', method);
      sim.say('azione', `Inizi il raffreddamento attivo: ${m.label}.`);
    },
  },
  {
    id: 'stop_raffreddamento',
    label: 'Sospendi il raffreddamento',
    group: 'trattamenti',
    section: 'Posizione e altre cure',
    duration: 5,
    visible: (s) => !!s.cooling,
    run: ({ sim }) => {
      sim.cooling = null;
      sim.set('raffreddamentoStopAt', sim.t);
      sim.say('azione', `Sospendi il raffreddamento a ${sim.p.v.temp.toFixed(1).replace('.', ',')} °C.`);
    },
  },
  {
    id: 'raffredda_ustione',
    label: 'Raffredda l’ustione con acqua corrente fresca (20 minuti)',
    short: 'Raffredda l’ustione',
    group: 'trattamenti',
    section: 'Posizione e altre cure',
    duration: 60,
    contact: true,
    visible: (s) => !!s.scenario.exam.extra?.ustione,
    available: needPatient,
    run: ({ sim }) => {
      sim.set('ustioneRaffreddataAt', sim.t);
      sim.say('azione', 'Avvii il raffreddamento dell’ustione con acqua corrente fresca, da proseguire per 20 minuti, evitando il ghiaccio.');
    },
  },
  {
    id: 'rimuovi_indumenti',
    label: 'Togli gli indumenti bagnati e gli oggetti non adesi alla pelle',
    short: 'Togli indumenti bagnati',
    group: 'trattamenti',
    section: 'Posizione e altre cure',
    duration: 20,
    contact: true,
    visible: (s) => !!s.scenario.exam.extra?.ustione || !!s.scenario.exam.extra?.bagnato || s.did('rimuovi_indumenti'),
    available: (s) => (s.flags.indumentiTolti ? 'Li hai già tolti.' : needPatient(s)),
    run: ({ sim }) => {
      sim.set('indumentiTolti', sim.t);
      const ex = sim.scenario.exam.extra ?? {};
      if (ex.ustione) sim.p.look = { ...sim.p.look, top: 'nudo' };
      sim.say('azione', ex.indumenti ?? (ex.ustione ? 'Tagli e sfili la maglietta intrisa d’acqua calda; nulla è attaccato alla pelle.' : 'Togli con delicatezza gli indumenti bagnati, senza scuotere il paziente.'));
    },
  },
  {
    id: 'stima_superficie',
    label: 'Stima l’estensione dell’ustione (regola del palmo)',
    short: 'Estensione dell’ustione',
    group: 'valutazione',
    section: 'E – Esposizione',
    duration: 15,
    contact: true,
    visible: (s) => !!s.scenario.exam.extra?.ustione,
    available: needPatient,
    run: ({ sim }) => {
      const ex = sim.scenario.exam.extra ?? {};
      sim.find(ex.ustione ?? '');
      sim.measure('ustione', 'Estensione ustione', ex.superficie ?? 'stimata');
    },
  },
  {
    id: 'copri_ustione',
    label: 'Copri l’ustione con medicazione non aderente o pellicola, senza stringere',
    short: 'Medica l’ustione',
    group: 'trattamenti',
    section: 'Posizione e altre cure',
    duration: 30,
    needs: ['kit_ustioni'],
    contact: true,
    visible: (s) => !!s.scenario.exam.extra?.ustione,
    available: (s) => (s.flags.ustioneCopertaAt !== undefined ? 'L’ustione è già medicata.' : needPatient(s)),
    run: ({ sim }) => {
      if (sim.flags.ustioneRaffreddataAt === undefined) {
        sim.penalize('copri_prima', 'lieve', 'Ustione coperta prima di raffreddarla', 'Prima si raffredda con acqua corrente fresca, poi si copre: la medicazione da sola non toglie il calore dai tessuti.', ['ERC_FA_2025']);
      }
      sim.set('ustioneCopertaAt', sim.t);
      sim.say('azione', 'Appoggi la pellicola sterile sull’ustione, a strisce e senza avvolgere stretto, e fissi una medicazione non aderente.');
    },
  },
  {
    id: 'ghiaccio_ustione',
    label: 'Applica il ghiaccio sull’ustione',
    short: 'Ghiaccio',
    group: 'trattamenti',
    section: 'Posizione e altre cure',
    duration: 10,
    contact: true,
    visible: (s) => !!s.scenario.exam.extra?.ustione,
    available: needPatient,
    run: ({ sim }) => {
      sim.set('ghiaccioAt', sim.t);
      sim.penalize('ghiaccio', 'grave', 'Ghiaccio sull’ustione', 'Il ghiaccio non va usato: restringe i vasi, può approfondire il danno e favorisce l’ipotermia. Si usa acqua corrente fresca.', ['ERC_FA_2025']);
    },
  },
  {
    id: 'rimedio_casalingo',
    label: 'Spalma un rimedio casalingo (burro, olio, dentifricio)',
    short: 'Rimedio casalingo',
    group: 'trattamenti',
    section: 'Posizione e altre cure',
    duration: 10,
    contact: true,
    visible: (s) => !!s.scenario.exam.extra?.ustione,
    available: needPatient,
    run: ({ sim }) => {
      sim.penalize('rimedio', 'grave', 'Rimedio casalingo sull’ustione', 'Grassi e rimedi casalinghi non raffreddano e sporcano la ferita: la linea guida prevede acqua corrente fresca e poi una medicazione pulita non aderente.', ['ERC_FA_2025']);
    },
  },

  // ════════════ ANAMNESI
  {
    id: 'q_sintomi',
    label: 'Che cosa si sente? (S – sintomi)',
    short: 'Sintomi',
    group: 'anamnesi',
    duration: 15,
    available: needPatient,
    run: ({ sim }) => answer(sim, 'sintomi', 'Sintomi'),
  },
  {
    id: 'q_dolore',
    label: 'Caratterizza il dolore (OPQRST)',
    short: 'Dolore (OPQRST)',
    group: 'anamnesi',
    duration: 25,
    available: needPatient,
    run: ({ sim }) => answer(sim, 'dolore', 'Dolore'),
  },
  {
    id: 'q_allergie',
    label: 'Allergie? (A)',
    short: 'Allergie',
    group: 'anamnesi',
    duration: 6,
    available: needPatient,
    run: ({ sim }) => answer(sim, 'allergie', 'Allergie'),
  },
  {
    id: 'q_farmaci',
    label: 'Farmaci assunti? (M)',
    short: 'Farmaci',
    group: 'anamnesi',
    duration: 10,
    available: needPatient,
    run: ({ sim }) => answer(sim, 'farmaci', 'Farmaci'),
  },
  {
    id: 'q_patologie',
    label: 'Malattie note, interventi? (P)',
    short: 'Patologie',
    group: 'anamnesi',
    duration: 10,
    available: needPatient,
    run: ({ sim }) => answer(sim, 'patologie', 'Patologie'),
  },
  {
    id: 'q_pasto',
    label: 'Ultimo pasto o bevanda? (L)',
    short: 'Ultimo pasto',
    group: 'anamnesi',
    duration: 6,
    available: needPatient,
    run: ({ sim }) => answer(sim, 'pasto', 'Ultimo pasto'),
  },
  {
    id: 'q_eventi',
    label: 'Che cosa è successo? (E – eventi)',
    short: 'Cosa è successo',
    group: 'anamnesi',
    duration: 15,
    available: needPatient,
    run: ({ sim }) => answer(sim, 'eventi', 'Evento'),
  },
  {
    id: 'q_esordio',
    label: 'Quando è iniziato? Ultima volta visto in benessere',
    short: 'Ora di esordio',
    group: 'anamnesi',
    duration: 10,
    available: needPatient,
    run: ({ sim }) => {
      answer(sim, 'esordio', 'Esordio');
      if (sim.scenario.answers.esordio) sim.measure('esordio', 'Esordio', sim.scenario.answers.esordio.replace(/^\[[^\]]*\]\s*/, ''));
      sim.set('esordioAt', sim.t);
    },
  },
  {
    id: 'q_testimoni',
    label: 'Chiedi ai presenti',
    short: 'Chiedi ai presenti',
    group: 'anamnesi',
    duration: 15,
    available: needPatient,
    run: ({ sim }) => {
      const a = sim.scenario.answers.testimoni;
      const m = a?.match(/^\[([^\]]*)\]\s*(.*)$/s);
      sim.find(!a ? 'Nessun testimone utile.' : m ? `${m[1]}: «${m[2]}»` : a);
    },
  },
  {
    id: 'rassicura',
    label: 'Presentati, rassicura e spiega cosa stai facendo',
    short: 'Rassicura',
    group: 'anamnesi',
    duration: 8,
    available: needPatient,
    run: ({ sim }) => {
      sim.set('rassicuratoAt', sim.t);
      sim.say('azione', sim.p.avpu === 'A' ? '«Buonasera, sono un soccorritore dell’ambulanza. Ora la aiutiamo: mi dica se qualcosa le fa male.»' : 'Parli al paziente con calma anche se non risponde: spieghi cosa stai facendo.');
    },
  },

  // ════════════ TRATTAMENTI e POSIZIONI
  {
    id: 'posizione',
    label: 'Posiziona il paziente (supino, semiseduto, PLS…)',
    short: 'Posizione',
    group: 'trattamenti',
    section: 'Posizione e altre cure',
    duration: 15,
    contact: true,
    picker: 'posizione',
    available: needPatient,
    run: ({ sim, params }) => {
      const pos = (params?.pos as Position) ?? 'supino';
      const p = sim.p;
      const prev = p.position;
      p.position = pos;
      if (pos === 'laterale') {
        if (sim.inArrest() || p.breathing === 'assente' || p.breathing === 'agonico') {
          sim.penalize('pls_arresto', 'critico', 'Posizione laterale in un paziente che non respira normalmente', 'Se il respiro non è normale serve la RCP, non la posizione laterale di sicurezza.', ['ERC_FA_2025', 'ERC_BLS_2025']);
        } else if (trauma(sim)) {
          sim.penalize('pls_trauma', 'grave', 'Posizione laterale in un traumatizzato', 'La ERC 2025 sconsiglia la posizione laterale di sicurezza nel trauma: mantieni l’allineamento e gestisci le vie aeree con la sublussazione.', ['ERC_FA_2025']);
        } else if (p.avpu === 'A') {
          sim.hint('La posizione laterale di sicurezza serve al paziente con coscienza ridotta che respira: un paziente sveglio può scegliere la posizione più comoda.');
        }
        if (p.vomitInMouth) {
          p.vomitInMouth = false;
          sim.find('Il vomito defluisce dalla bocca: le vie aeree sono più libere.');
        }
        if (p.airway === 'russante' || p.airway === 'gorgogliante') p.airway = 'pervie';
      }
      if ((pos === 'seduto' || pos === 'semiseduto') && p.avpu !== 'A' && !sim.inArrest()) {
        sim.penalize('seduto_incosciente', 'grave', 'Paziente con coscienza ridotta tenuto seduto', 'Con la coscienza ridotta le vie aeree sono a rischio: supino con vie aeree aperte o in posizione laterale se respira.', ['ERC_FA_2025']);
      }
      if (sim.inArrest() && pos !== 'supino') {
        sim.penalize('arresto_non_supino', 'critico', 'Paziente in arresto non supino', 'La RCP si esegue con il paziente supino su un piano rigido.', ['ERC_BLS_2025']);
      }
      sim.say('azione', `Paziente posizionato ${POS_TXT[pos]}${prev === pos ? ' (posizione invariata)' : ''}.`);
      sim.set('pos_' + pos, sim.t);
    },
  },
  {
    id: 'glucosio_os',
    label: 'Dai zucchero per bocca (bustine, succo, caramelle)',
    short: 'Zucchero per bocca',
    group: 'trattamenti',
    section: 'Posizione e altre cure',
    duration: 10,
    contact: true,
    visible: (s) => !!s.flags.diabetico,
    available: needPatient,
    run: ({ sim }) => {
      if (sim.p.avpu !== 'A' || !sim.p.canSwallow) {
        sim.penalize('zucchero_incosciente', 'critico', 'Zucchero per bocca a un paziente che non può deglutire', 'Nulla per bocca a chi non è sveglio e in grado di deglutire: rischio di inalazione.', ['ERC_FA_2025']);
      }
      fuoriCompetenza(sim, 'zucchero', 'Zucchero per bocca', 'Il soccorritore non somministra nulla, nemmeno acqua e zucchero: il glucosio lo dà l’infermiere o il medico. Riferisci il sospetto di ipoglicemia alla SORES.');
    },
  },
  {
    id: 'autoiniettore',
    label: 'Aiuta il paziente a usare il suo autoiniettore di adrenalina',
    short: 'Autoiniettore del paziente',
    group: 'trattamenti',
    section: 'Posizione e altre cure',
    duration: 10,
    contact: true,
    visible: (s) => !!s.flags.haAutoiniettore,
    available: needPatient,
    run: ({ sim }) => {
      fuoriCompetenza(sim, 'adrenalina', 'Adrenalina con l’autoiniettore', 'Anche se il farmaco è del paziente, il soccorritore non lo somministra: riferisci subito alla SORES «anafilassi, ha con sé l’autoiniettore» e l’adrenalina la fa l’équipe sanitaria.');
    },
  },
  {
    id: 'inalatore',
    label: 'Aiuta il paziente a usare il suo spray broncodilatatore',
    short: 'Spray del paziente',
    group: 'trattamenti',
    section: 'Ossigeno e ventilazione',
    duration: 10,
    contact: true,
    visible: (s) => !!s.flags.haInalatore,
    available: needPatient,
    run: ({ sim }) => {
      fuoriCompetenza(sim, 'spray', 'Spray broncodilatatore', 'Anche se lo spray è del paziente, il soccorritore non somministra farmaci: riferiscilo alla SORES, che decide se inviare l’infermiere.');
    },
  },
  {
    id: 'dai_acqua',
    label: 'Dai da bere un po’ d’acqua',
    short: 'Acqua',
    group: 'trattamenti',
    section: 'Posizione e altre cure',
    visible: (s) => (['colpo_calore', 'ictus', 'ipoglicemia', 'intossicazione', 'convulsioni'] as const).some((p) => s.scenario.protocol.correct.includes(p)) || s.did('dai_acqua'),
    duration: 10,
    available: needPatient,
    run: ({ sim }) => {
      if (sim.p.avpu !== 'A' || !sim.p.canSwallow) {
        sim.penalize('acqua_incosciente', 'critico', 'Liquidi a un paziente con coscienza alterata', 'Nulla per bocca a chi non è pienamente sveglio e in grado di deglutire: rischio di inalazione.', ['ERC_FA_2025']);
      }
      fuoriCompetenza(sim, 'acqua', 'Acqua per bocca', 'Il soccorritore non somministra nulla, nemmeno l’acqua: in caso di dubbio chiedi alla SORES.');
    },
  },

  // ════════════ IMMOBILIZZAZIONE
  {
    id: 'collare',
    label: 'Applica il collare cervicale della misura corretta',
    short: 'Collare cervicale',
    group: 'trattamenti',
    section: 'Immobilizzazione',
    visible: (s) => s.scenario.trauma || s.did('collare'),
    duration: 30,
    needs: ['collari'],
    contact: true,
    available: (s) => (s.immob.has('collare') ? 'Collare già applicato.' : needPatient(s)),
    regions: ['collo'],
    run: ({ sim }) => {
      if (!sim.immob.has('mils')) {
        sim.penalize('collare_senza_mils', 'grave', 'Collare senza stabilizzazione manuale', 'Il collare si applica mentre un collega mantiene il capo in posizione neutra, e non sostituisce la stabilizzazione manuale.', ['ERC_FA_2025']);
      }
      if (sim.p.look.helmet) {
        sim.find('Non puoi applicare il collare con il casco indossato.');
        return;
      }
      sim.immob.add('collare');
      sim.say('azione', 'Misuri e applichi il collare cervicale; il collega continua a stabilizzare il capo.');
      if (!sim.scenario.trauma) sim.hint('Non c’è un trauma: il collare non era indicato.');
    },
  },
  {
    id: 'cucchiaio',
    label: 'Carica sulla barella a cucchiaio',
    short: 'Barella a cucchiaio',
    group: 'trattamenti',
    section: 'Immobilizzazione',
    visible: (s) => s.scenario.trauma || s.did('cucchiaio'),
    duration: 60,
    needs: ['cucchiaio'],
    contact: true,
    available: (s) => (s.immob.has('cucchiaio') ? 'Già sulla barella a cucchiaio.' : needPatient(s)),
    run: ({ sim }) => {
      sim.immob.add('cucchiaio');
      sim.say('azione', 'Inserite le due metà della barella a cucchiaio e le chiudete: il paziente è sollevabile senza ruotarlo.');
    },
  },
  {
    id: 'materasso',
    label: 'Immobilizza nel materassino a depressione',
    short: 'Materassino a depressione',
    group: 'trattamenti',
    section: 'Immobilizzazione',
    visible: (s) => s.scenario.trauma || s.did('materasso'),
    duration: 90,
    needs: ['materasso'],
    contact: true,
    available: (s) => (s.immob.has('materasso') ? 'Già nel materassino.' : needPatient(s)),
    run: ({ sim }) => {
      if (!sim.immob.has('cucchiaio') && sim.scenario.trauma) {
        sim.hint('Per trasferire il paziente nel materassino limitando i movimenti si usa la barella a cucchiaio.');
      }
      sim.immob.add('materasso');
      sim.say('azione', 'Trasferite il paziente sul materassino e aspirate l’aria: è immobilizzato in modo confortevole per il trasporto.');
    },
  },
  {
    id: 'tavola',
    label: 'Immobilizza sulla tavola spinale con fermacapo e cinghie',
    short: 'Tavola spinale',
    group: 'trattamenti',
    section: 'Immobilizzazione',
    visible: (s) => s.scenario.trauma || s.did('tavola'),
    duration: 90,
    needs: ['tavola'],
    contact: true,
    available: (s) => (s.immob.has('tavola') ? 'Già sulla tavola.' : needPatient(s)),
    run: ({ sim }) => {
      sim.immob.add('tavola');
      sim.say('azione', 'Rotolate il paziente sulla tavola spinale e fissate fermacapo e cinghie.');
      sim.hint('La tavola spinale è soprattutto un presidio di estricazione: per il trasporto è preferibile il materassino a depressione.');
    },
  },
  {
    id: 'steccobende',
    label: 'Immobilizza l’arto con la steccobenda',
    short: 'Steccobenda',
    group: 'trattamenti',
    section: 'Immobilizzazione',
    visible: (s) => s.scenario.trauma || lesioneArto(s) || s.did('steccobende'),
    duration: 45,
    needs: ['steccobende'],
    contact: true,
    available: (s) => (s.immob.has('stecca') ? 'L’arto è già immobilizzato.' : needPatient(s)),
    run: ({ sim }) => {
      sim.immob.add('stecca');
      if (sim.flags.steccaAt === undefined) sim.set('steccaAt', sim.t);
      const f = frattura(sim);
      if (f?.esposta && sim.flags.fratturaCopertaAt === undefined) {
        sim.penalize('stecca_su_ferita', 'lieve', 'Immobilizzazione sopra la frattura esposta scoperta', 'Prima di immobilizzare si copre la frattura esposta con garze e telo sterile.', ['CORSO_MSK']);
      }
      sim.say('azione', 'Posizioni la steccobenda a depressione senza muovere l’arto, comprendendo l’articolazione a monte e quella a valle, e fai il vuoto: l’arto resta fermo nella posizione in cui si trova.');
    },
  },

  // ════════════ FRATTURE (corso: apparato muscolo-scheletrico)
  {
    id: 'pms',
    label: 'Controlla polso, motilità e sensibilità a valle della lesione',
    short: 'Polso, motilità, sensibilità',
    group: 'valutazione',
    section: 'E – Esposizione',
    duration: 20,
    contact: true,
    visible: (s) => lesioneArto(s) || s.did('pms'),
    available: needPatient,
    run: ({ sim }) => {
      const dopo = sim.immob.has('stecca');
      const ex = sim.scenario.exam.extra ?? {};
      sim.find((dopo ? ex.pmsDopo : ex.pms) ?? 'Polso periferico presente, muove le dita, sensibilità conservata.');
      sim.measure('pms', 'Polso, motilità, sensibilità a valle', dopo ? 'conservati anche dopo l’immobilizzazione' : 'conservati');
      sim.set(dopo ? 'pmsDopoAt' : 'pmsPrimaAt', sim.t);
    },
  },
  {
    id: 'copri_frattura',
    label: 'Copri la frattura esposta con garze e telo sterile',
    short: 'Copri la frattura esposta',
    group: 'trattamenti',
    section: 'Emorragie',
    duration: 25,
    needs: ['zaino'],
    contact: true,
    visible: (s) => !!frattura(s)?.esposta || s.did('copri_frattura'),
    available: (s) => (s.flags.fratturaCopertaAt !== undefined ? 'La ferita è già coperta.' : needPatient(s)),
    run: ({ sim }) => {
      sim.set('fratturaCopertaAt', sim.t);
      sim.say('azione', 'Tagli il calzettone, appoggi garze sterili sulla ferita senza toccare il moncone e copri con un telino sterile fissato largo.');
    },
  },
  {
    id: 'disinfetta',
    label: 'Disinfetta la ferita',
    short: 'Disinfetta',
    group: 'trattamenti',
    section: 'Emorragie',
    duration: 20,
    needs: ['zaino'],
    contact: true,
    visible: (s) => !!frattura(s)?.esposta || s.did('disinfetta'),
    available: needPatient,
    run: ({ sim }) => {
      sim.say('azione', 'Versi il disinfettante sulla ferita: il ragazzo urla dal dolore.');
      sim.penalize('disinfetta_frattura', 'grave', 'Frattura esposta disinfettata', 'Sulla frattura esposta non si disinfetta e non si toccano i monconi: si copre con garze e telo sterile.', ['ERC_FA_2025', 'CORSO_MSK']);
    },
  },
  {
    id: 'riallinea',
    label: 'Riallinea l’arto e rimetti in sede l’osso',
    short: 'Riallinea l’arto',
    group: 'trattamenti',
    section: 'Immobilizzazione',
    duration: 15,
    contact: true,
    visible: (s) => !!frattura(s) || s.did('riallinea'),
    available: needPatient,
    run: ({ sim }) => {
      sim.say('azione', 'Tiri il piede per raddrizzare la gamba: il paziente urla, impallidisce e quasi perde i sensi.');
      sim.base.hr += 14;
      sim.base.sbp -= 14;
      sim.penalize('riduzione', 'grave', 'Hai provato a ridurre la frattura', 'Fratture e lussazioni non si riducono mai: si immobilizzano nella posizione in cui si trovano. Muovere i monconi danneggia vasi e nervi e aumenta dolore e sanguinamento.', ['ERC_FA_2025', 'CORSO_MSK']);
    },
  },

  {
    id: 'medica_ferita',
    label: 'Medica la ferita: garza sterile e benda, compressione delicata',
    short: 'Medica la ferita',
    group: 'trattamenti',
    section: 'Emorragie',
    duration: 30,
    needs: ['zaino'],
    contact: true,
    visible: (s) => !!s.scenario.exam.extra?.ferita || s.did('medica_ferita'),
    available: (s) => (s.flags.feritaMedicataAt !== undefined ? 'La ferita è già medicata.' : needPatient(s)),
    run: ({ sim }) => {
      sim.set('feritaMedicataAt', sim.t);
      sim.say('azione', 'Appoggi una garza sterile sulla ferita con una compressione delicata e la fissi con una benda.');
    },
  },

  // ════════════ DISTORSIONI (corso: apparato muscolo-scheletrico)
  {
    id: 'togli_scarpa',
    label: 'Togli scarpa e calza prima che il gonfiore aumenti',
    short: 'Togli la scarpa',
    group: 'trattamenti',
    section: 'Immobilizzazione',
    duration: 20,
    contact: true,
    visible: (s) => !!distorsione(s) || s.did('togli_scarpa'),
    available: (s) => (s.flags.scarpaTolta !== undefined ? 'La scarpa è già tolta.' : needPatient(s)),
    run: ({ sim }) => {
      sim.set('scarpaTolta', sim.t);
      sim.say('azione', 'Sleghi la scarpa e la sfili con delicatezza, sostenendo il tallone, poi la calza.');
    },
  },
  {
    id: 'ghiaccio',
    label: 'Ghiaccio istantaneo avvolto in un telo, mai a contatto diretto',
    short: 'Ghiaccio',
    group: 'trattamenti',
    section: 'Immobilizzazione',
    duration: 15,
    needs: ['zaino'],
    contact: true,
    visible: (s) => !!distorsione(s) || s.did('ghiaccio'),
    available: (s) => (s.flags.ghiaccioAt !== undefined ? 'Il ghiaccio è già applicato.' : needPatient(s)),
    run: ({ sim }) => {
      sim.set('ghiaccioAt', sim.t);
      sim.say('azione', 'Attivi il ghiaccio istantaneo, lo avvolgi in un telino e lo appoggi sulla caviglia.');
    },
  },
  {
    id: 'arto_scarico',
    label: 'Arto in scarico: sollevato su un appoggio morbido',
    short: 'Arto in scarico',
    group: 'trattamenti',
    section: 'Immobilizzazione',
    duration: 10,
    contact: true,
    visible: (s) => !!distorsione(s) || s.did('arto_scarico'),
    available: (s) => (s.flags.artoScaricoAt !== undefined ? 'L’arto è già sollevato.' : needPatient(s)),
    run: ({ sim }) => {
      sim.set('artoScaricoAt', sim.t);
      sim.say('azione', 'Appoggi il piede su una coperta piegata, un po’ più in alto del cuore.');
    },
  },

  // ════════════ IPERVENTILAZIONE
  {
    id: 'respirazione_guidata',
    label: 'Guida il respiro: lento, dal naso, contando insieme',
    short: 'Respiro guidato',
    group: 'trattamenti',
    section: 'Posizione e altre cure',
    duration: 60,
    contact: false,
    visible: (s) => s.scenario.protocol.correct.includes('ansia') || s.did('respirazione_guidata'),
    available: needPatient,
    run: ({ sim }) => {
      if (sim.flags.respiroGuidatoAt === undefined) sim.set('respiroGuidatoAt', sim.t);
      sim.say('azione', '«Guardami. Inspira dal naso, uno, due, tre, quattro… e fuori piano dalla bocca». Respiri insieme a lei per un minuto.');
    },
  },
  {
    id: 'sacchetto',
    label: 'Fai respirare in un sacchetto di carta',
    short: 'Sacchetto',
    group: 'trattamenti',
    section: 'Posizione e altre cure',
    duration: 20,
    contact: true,
    visible: (s) => s.scenario.protocol.correct.includes('ansia') || s.did('sacchetto'),
    available: needPatient,
    run: ({ sim }) => {
      sim.say('azione', 'Le metti davanti alla bocca un sacchetto di carta trovato in cucina.');
      sim.penalize('sacchetto', 'grave', 'Respirazione nel sacchetto', 'Respirare nel sacchetto non è raccomandato e può essere pericoloso: riduce l’ossigeno, e se la causa non è l’ansia (asma, embolia, infarto) peggiora il paziente. Si rassicura e si guida il respiro.', ['BTS_O2_2017']);
    },
  },

  // ════════════ FREDDO (corso: emergenze legate alla temperatura)
  {
    id: 'ambiente_caldo',
    label: 'Riscalda l’ambiente: chiudi le finestre, alza il riscaldamento, coperte',
    short: 'Ambiente caldo',
    group: 'trattamenti',
    section: 'Posizione e altre cure',
    duration: 30,
    visible: (s) => freddo(s) || s.did('ambiente_caldo'),
    available: (s) => (s.flags.ambienteCaldoAt !== undefined ? 'L’ambiente è già riscaldato.' : needPatient(s)),
    run: ({ sim }) => {
      sim.set('ambienteCaldoAt', sim.t);
      sim.say('azione', 'Chiudi porte e finestre, alzi il riscaldamento e recuperi delle coperte; il collega accende il riscaldamento dell’ambulanza.');
    },
  },
  {
    id: 'frizionare',
    label: 'Friziona e massaggia braccia e gambe per scaldarle',
    short: 'Friziona gli arti',
    group: 'trattamenti',
    section: 'Posizione e altre cure',
    duration: 30,
    contact: true,
    visible: (s) => freddo(s) || s.did('frizionare'),
    available: needPatient,
    run: ({ sim }) => {
      sim.say('azione', 'Strofini con energia braccia e gambe.');
      sim.penalize('frizione', 'grave', 'Arti frizionati e massaggiati', 'Nell’ipotermia frizionare e massaggiare può scatenare aritmie; nel congelamento lede i tessuti. Il riscaldamento è passivo e graduale.', ['ERC_FA_2025', 'CORSO_TEMP']);
    },
  },

  // ════════════ MONOSSIDO
  {
    id: 'arieggia',
    label: 'Apri porte e finestre e fai uscire tutti all’aria aperta (niente interruttori né fiamme)',
    short: 'Arieggia ed evacua',
    group: 'scena',
    duration: 25,
    visible: (s) => s.scenario.scene.hazards.some((h) => h.fixAction === 'arieggia') || s.did('arieggia'),
    available: (s) => (s.flags.fix_arieggia ? 'Già fatto.' : true),
    run: ({ sim }) => {
      sim.set('fix_arieggia', true);
      sim.say('azione', 'Trattenendo il fiato spalanchi porte e finestre senza toccare interruttori e fai uscire tutti all’aria aperta.');
    },
  },

  // ════════════ PARTO (corso: il parto in urgenza)
  {
    id: 'q_gravidanza',
    label: 'Gravidanza: settimane, presentazione, gravidanze precedenti, controlli',
    short: 'Gravidanza',
    group: 'anamnesi',
    duration: 15,
    visible: gravida,
    available: needPatient,
    run: ({ sim }) => {
      answer(sim, 'gravidanza', 'Gravidanza');
      const b = sim.scenario.exam.extra?.gravidanzaBreve;
      if (b) sim.measure('gravidanza', 'Gravidanza', b);
    },
  },
  {
    id: 'q_contrazioni',
    label: 'Contrazioni, rottura delle acque e colore del liquido, voglia di spingere',
    short: 'Contrazioni e perdite',
    group: 'anamnesi',
    duration: 15,
    visible: gravida,
    available: needPatient,
    run: ({ sim }) => {
      answer(sim, 'contrazioni', 'Contrazioni');
      const b = sim.scenario.exam.extra?.contrazioniBreve;
      if (b) sim.measure('contrazioni', 'Contrazioni e perdite', b);
    },
  },
  {
    id: 'controlla_perineo',
    label: 'Controlla il perineo durante la spinta (con privacy)',
    short: 'Controlla il perineo',
    group: 'trattamenti',
    section: 'Parto',
    duration: 15,
    contact: true,
    visible: (s) => !!s.p.look.pregnant && !nato(s),
    available: needPatient,
    run: ({ sim }) => {
      sim.set('perineoAt', sim.t);
      const ex = sim.scenario.exam.extra ?? {};
      sim.find(sim.flags.coronamentoAt !== undefined ? (ex.coronamento ?? 'Durante la spinta compaiono i capelli del bambino: il parto è imminente.') : (ex.perineo ?? 'Perineo disteso durante la spinta, nessuna parte del bambino ancora visibile.'));
    },
  },
  {
    id: 'prepara_parto',
    label: 'Prepara il parto: ambiente caldo, kit parto, telini, privacy',
    short: 'Prepara il parto',
    group: 'trattamenti',
    section: 'Parto',
    duration: 40,
    needs: ['kit_parto'],
    visible: (s) => !!s.p.look.pregnant || s.did('prepara_parto'),
    available: (s) => (s.flags.partoPreparatoAt !== undefined ? 'È già tutto pronto.' : needPatient(s)),
    run: ({ sim }) => {
      sim.set('partoPreparatoAt', sim.t);
      sim.say('azione', 'Alzi il riscaldamento, fai uscire chi non serve, apri il kit parto e scaldi i telini sul termosifone; indossi camice e occhiali.');
    },
  },
  {
    id: 'posizione_parto',
    label: 'Posizione per il parto: bacino sollevato di 4–5 cm, cosce divaricate, ginocchia flesse',
    short: 'Posizione per il parto',
    group: 'trattamenti',
    section: 'Parto',
    duration: 20,
    contact: true,
    visible: (s) => !!s.p.look.pregnant && !nato(s),
    available: (s) => (s.flags.posizionePartoAt !== undefined ? 'È già in posizione.' : needPatient(s)),
    run: ({ sim }) => {
      sim.set('posizionePartoAt', sim.t);
      sim.p.position = 'supino';
      sim.say('azione', 'La aiuti a sdraiarsi sulla schiena con un telo piegato sotto il bacino, cosce divaricate e ginocchia flesse; sotto di lei un telino pulito.');
    },
  },
  {
    id: 'accompagna_testa',
    label: 'Accompagna l’uscita del bambino sostenendo la testa, senza tirare',
    short: 'Accompagna la testa',
    group: 'trattamenti',
    section: 'Parto',
    duration: 30,
    contact: true,
    visible: (s) => !!s.p.look.pregnant && !nato(s),
    available: (s) => {
      const n = needPatient(s);
      if (n !== true) return n;
      return s.flags.coronamentoAt === undefined ? 'Nessuna parte del bambino è ancora visibile.' : true;
    },
    run: ({ sim }) => {
      sim.set('accompagnaAt', sim.t);
    },
  },
  {
    id: 'trazione_testa',
    label: 'Tira delicatamente la testa per aiutare l’uscita',
    short: 'Tira la testa',
    group: 'trattamenti',
    section: 'Parto',
    duration: 10,
    contact: true,
    visible: (s) => !!s.p.look.pregnant && !nato(s),
    available: needPatient,
    run: ({ sim }) => {
      sim.say('azione', 'Afferri la testa e tiri.');
      sim.penalize('trazione_testa', 'critico', 'Trazione sulla testa del bambino', 'Non si tira mai la testa, le spalle o il cordone: si sostiene e si accompagna. La trazione può lesionare il collo e i nervi del braccio del neonato.', ['CORSO_PARTO']);
    },
  },
  {
    id: 'ora_nascita',
    label: 'Annota l’ora di nascita',
    short: 'Ora di nascita',
    group: 'trattamenti',
    section: 'Parto',
    duration: 3,
    visible: nato,
    available: (s) => (s.flags.oraAnnotata !== undefined ? 'L’ora è già annotata.' : true),
    run: ({ sim }) => {
      sim.set('oraAnnotata', sim.t);
      const ora = sim.clock(Number(sim.flags.natoAt));
      sim.measure('ora_nascita', 'Ora di nascita', ora);
      sim.say('azione', `Annoti l’ora di nascita: ${ora}.`);
    },
  },
  {
    id: 'asciuga_neonato',
    label: 'Asciuga e stimola il neonato, pulisci naso e bocca con una garza',
    short: 'Asciuga e stimola',
    group: 'trattamenti',
    section: 'Parto',
    duration: 25,
    contact: true,
    visible: nato,
    available: needPatient,
    run: ({ sim }) => {
      if (sim.flags.asciugatoAt === undefined) sim.set('asciugatoAt', sim.t);
      sim.say('azione', 'Pulisci naso e bocca con una garza e asciughi il neonato tra le cosce della madre con un telino caldo, strofinandogli la schiena.');
    },
  },
  {
    id: 'avvolgi_neonato',
    label: 'Cambia il telo bagnato, avvolgi il neonato e coprigli la testa',
    short: 'Avvolgi il neonato',
    group: 'trattamenti',
    section: 'Parto',
    duration: 20,
    needs: ['kit_parto'],
    contact: true,
    visible: nato,
    available: (s) => (s.flags.avvoltoAt !== undefined ? 'È già avvolto.' : needPatient(s)),
    run: ({ sim }) => {
      sim.set('avvoltoAt', sim.t);
      sim.say('azione', 'Togli il telino bagnato, avvolgi il neonato in un telo asciutto e caldo e gli metti la cuffietta.');
    },
  },
  {
    id: 'clampa_cordone',
    label: 'Clampa il cordone ombelicale con le due clamp',
    short: 'Clampa il cordone',
    group: 'trattamenti',
    section: 'Parto',
    duration: 20,
    needs: ['kit_parto'],
    contact: true,
    visible: nato,
    available: (s) => (s.flags.clampatoAt !== undefined ? 'Il cordone è già clampato.' : needPatient(s)),
    run: ({ sim }) => {
      sim.set('clampatoAt', sim.t);
      sim.say('azione', 'Applichi le due clamp sul cordone, a qualche centimetro l’una dall’altra.');
    },
  },
  {
    id: 'taglia_cordone',
    label: 'Taglia il cordone tra le due clamp',
    short: 'Taglia il cordone',
    group: 'trattamenti',
    section: 'Parto',
    duration: 10,
    needs: ['kit_parto'],
    contact: true,
    visible: nato,
    available: (s) => {
      const n = needPatient(s);
      if (n !== true) return n;
      if (s.flags.clampatoAt === undefined) return 'Il cordone non è clampato.';
      return s.flags.cordoneTagliato !== undefined ? 'Il cordone è già tagliato.' : true;
    },
    run: ({ sim }) => {
      sim.set('cordoneTagliato', sim.t);
      sim.say('azione', 'Tagli il cordone tra le due clamp con le forbici sterili.');
      if (!sim.scenario.exam.extra?.cordoneCorto) {
        sim.penalize('taglio_cordone', 'lieve', 'Cordone tagliato senza necessità', 'Il cordone si taglia solo se è corto (meno di 30 cm): altrimenti resta clampato e lo taglia l’ostetrica in ospedale.', ['CORSO_PARTO']);
      }
    },
  },
  {
    id: 'neonato_sul_ventre',
    label: 'Metti il neonato sul ventre della madre, su un fianco, coperto',
    short: 'Sul ventre della madre',
    group: 'trattamenti',
    section: 'Parto',
    duration: 10,
    contact: true,
    visible: nato,
    available: (s) => (s.flags.sulVentreAt !== undefined ? 'È già sul ventre della madre.' : needPatient(s)),
    run: ({ sim }) => {
      sim.set('sulVentreAt', sim.t);
      sim.say('azione', 'Appoggi il neonato sul ventre della madre, su un fianco, coperto e con la testa protetta: lei lo tiene stretto a sé.');
      if (sim.flags.clampatoAt === undefined) {
        sim.penalize('neonato_alto', 'lieve', 'Neonato sopra la madre prima del clampaggio', 'Fino al clampaggio del cordone il neonato non va posto più in alto della madre.', ['CORSO_PARTO']);
      }
    },
  },
  {
    id: 'tira_cordone',
    label: 'Tira il cordone per far uscire la placenta',
    short: 'Tira il cordone',
    group: 'trattamenti',
    section: 'Parto',
    duration: 10,
    contact: true,
    visible: (s) => nato(s) && s.flags.placentaAt === undefined,
    available: needPatient,
    run: ({ sim }) => {
      sim.say('azione', 'Tiri il cordone: la madre geme per il dolore.');
      sim.penalize('trazione_cordone', 'grave', 'Trazione sul cordone', 'La placenta si stacca da sola: tirare il cordone può strapparlo o provocare un’emorragia grave.', ['CORSO_PARTO']);
    },
  },
  {
    id: 'raccogli_placenta',
    label: 'Raccogli la placenta in un sacchetto, senza tirare il cordone',
    short: 'Raccogli la placenta',
    group: 'trattamenti',
    section: 'Parto',
    duration: 20,
    needs: ['kit_parto'],
    contact: true,
    visible: nato,
    available: (s) => {
      const n = needPatient(s);
      if (n !== true) return n;
      if (s.flags.placentaAt === undefined) return 'La placenta non è ancora uscita.';
      return s.flags.placentaRaccoltaAt !== undefined ? 'È già nel sacchetto.' : true;
    },
    run: ({ sim }) => {
      sim.set('placentaRaccoltaAt', sim.t);
      sim.say('azione', 'Raccogli la placenta nel sacchetto del kit: andrà in ospedale con la madre.');
    },
  },
  {
    id: 'massaggio_uterino',
    label: 'Massaggio del fondo uterino',
    short: 'Massaggio uterino',
    group: 'trattamenti',
    section: 'Parto',
    duration: 30,
    contact: true,
    visible: nato,
    available: (s) => {
      const n = needPatient(s);
      if (n !== true) return n;
      return s.flags.placentaAt === undefined ? 'La placenta non è ancora uscita.' : true;
    },
    run: ({ sim }) => {
      if (sim.flags.massaggioAt === undefined) sim.set('massaggioAt', sim.t);
      sim.say('azione', 'Massaggi con movimenti circolari il fondo dell’utero, all’altezza dell’ombelico: lo senti indurirsi come una palla.');
    },
  },
  {
    id: 'cura_madre',
    label: 'Assorbente, asciuga e copri la madre',
    short: 'Cura della madre',
    group: 'trattamenti',
    section: 'Parto',
    duration: 20,
    needs: ['kit_parto'],
    contact: true,
    visible: nato,
    available: (s) => (s.flags.curaMadreAt !== undefined ? 'Già fatto.' : needPatient(s)),
    run: ({ sim }) => {
      sim.set('curaMadreAt', sim.t);
      sim.covered = true;
      sim.say('azione', 'Metti un assorbente, asciughi la madre e la copri con una coperta calda.');
    },
  },

  // ════════════ CENTRALE / TRASPORTO
  {
    id: 'richiedi_msa',
    label: 'Chiedi alla SORES il mezzo avanzato (ALS o automedica)',
    short: 'Mezzo avanzato',
    group: 'centrale',
    section: 'SORES',
    visible: (s) => s.scenario.role !== 'laico',
    duration: 15,
    available: (s) => (s.requests.msa !== undefined ? (s.msaOnScene ? 'Il mezzo avanzato è già sul posto.' : 'Il mezzo avanzato è già in arrivo.') : true),
    run: ({ sim }) => {
      sim.requests.msa = sim.t;
      if (sim.scenario.msa.available) {
        sim.msaAt = sim.t + sim.scenario.msa.eta;
        sim.say('radio', `SORES: «Ricevuto, attiviamo ${lowerFirst(sim.scenario.msa.label ?? 'l’ALS')}. Arrivo stimato in ${Math.round(sim.scenario.msa.eta / 60)} minuti».`);
      } else {
        sim.say('radio', 'SORES: «Al momento non ci sono mezzi avanzati disponibili: procedete con il trasporto, vi teniamo aggiornati».');
      }
    },
  },
  {
    id: 'richiedi_elisoccorso',
    label: 'Chiedi alla SORES l’elisoccorso',
    short: 'Richiedi elisoccorso',
    group: 'centrale',
    section: 'SORES',
    visible: (s) => s.scenario.role !== 'laico',
    duration: 15,
    available: (s) => (s.requests.elisoccorso !== undefined ? 'Già richiesto.' : true),
    run: ({ sim }) => {
      sim.requests.elisoccorso = sim.t;
      if (sim.scenario.heli) {
        sim.heliAt = sim.t + sim.scenario.heli.eta;
        sim.say('radio', `SORES: «Ricevuto, l’elisoccorso decolla ora, arrivo in circa ${Math.round(sim.scenario.heli.eta / 60)} minuti».`);
      } else {
        sim.say('radio', 'SORES: «Ricevuto. In base ai dati l’elisoccorso non è necessario».');
      }
    },
  },
  {
    id: 'richiedi_vvf',
    label: 'Chiedi alla SORES i Vigili del Fuoco',
    short: 'Richiedi VVF',
    group: 'centrale',
    section: 'SORES',
    visible: (s) => s.scenario.role !== 'laico',
    duration: 10,
    available: (s) => (s.requests.vvf !== undefined ? 'Già richiesti.' : true),
    run: ({ sim }) => {
      sim.requests.vvf = sim.t;
      sim.say('radio', 'SORES: «Ricevuto, allertiamo i Vigili del Fuoco».');
    },
  },
  {
    id: 'richiedi_ffoo',
    label: 'Chiedi alla SORES le Forze dell’ordine',
    short: 'Richiedi Forze dell’ordine',
    group: 'centrale',
    section: 'SORES',
    visible: (s) => s.scenario.role !== 'laico',
    duration: 10,
    available: (s) => (s.requests.ffoo !== undefined ? 'Già richieste.' : true),
    run: ({ sim }) => {
      sim.requests.ffoo = sim.t;
      sim.say('radio', 'SORES: «Ricevuto, allertiamo le Forze dell’ordine per il traffico e i rilievi».');
    },
  },
  {
    id: 'comunica',
    label: 'Riferisci alla SORES valutazione ABCDE e parametri',
    short: 'Riferisci alla SORES',
    group: 'centrale',
    section: 'SORES',
    visible: (s) => s.scenario.role !== 'laico',
    duration: 40,
    picker: 'centrale',
    available: needPatient,
    run: ({ sim, params }) => {
      const items = (params?.items as string[]) ?? [];
      // il codice di rientro lo assegna la SORES, non l'equipaggio; con un arresto o la RCP in corso è rosso
      const base = sim.scenario.sores?.codice?.(sim) ?? sim.scenario.valutazione.correct[0];
      const code = (sim.inArrest() || sim.cpr.active) && base !== 'I4' ? 'I3' : base;
      sim.report = { code, items, t: sim.t };
      if (sim.flags.primoReportAt === undefined) sim.set('primoReportAt', sim.t);
      const list = items.map((k) => sim.measurements.get(k)).filter(Boolean).map((m) => `${m!.label} ${m!.value}`);
      const eta = sim.p.age < 1 ? `${Math.max(1, Math.round(sim.p.age * 12))} mesi` : `${Math.round(sim.p.age)} anni`;
      sim.say('radio', `Tu: «SORES da ${crewName(sim)}: ${sim.p.sex === 'M' ? 'maschio' : 'femmina'}, ${eta}. ${list.length ? list.join(', ') : 'Nessun parametro rilevato'}».`);
      const missing = sim.scenario.reportKeys.filter((k) => !items.includes(k));
      if (missing.length) sim.say('radio', `SORES: «Ricevuto. Appena potete riferiteci anche: ${missing.map(reportLabel).join(', ')}».`);
      const dest = sim.scenario.destination;
      const msa = sim.scenario.msa;
      if ((msa.onReport || sim.scenario.sores?.mandaMezzo?.(sim)) && msa.available && sim.msaAt === null && !sim.msaOnScene) {
        sim.requests.msa = sim.t;
        sim.msaAt = sim.t + msa.eta;
        sim.say('radio', `SORES: «Ricevuto. Vi mandiamo ${lowerFirst(msa.label ?? 'l’ALS')}, arrivo stimato ${Math.round(msa.eta / 60)} minuti. Restate con il paziente e riferite se cambia qualcosa».`);
      } else {
        sim.say('radio', `SORES: «Ricevuto. Codice di rientro ${VALUTAZIONE[code].colore}${dest ? `, destinazione ${dest}` : ''}».`);
      }
    },
  },
  {
    id: 'attendi',
    label: 'Prosegui e attendi 30 secondi',
    short: 'Attendi 30 s',
    group: 'centrale',
    section: 'Attesa e rivalutazione',
    visible: (s) => s.inArrest() || s.cpr.active || !!s.cooling || s.did('attendi'),
    duration: 30,
    available: needPatient,
    run: ({ sim }) => {
      sim.say('azione', sim.cpr.active ? 'Proseguite la RCP.' : 'Attendi osservando il paziente.');
    },
  },
  {
    id: 'attendi_lungo',
    label: 'Prosegui il trattamento e rivaluta tra 3 minuti',
    short: 'Prosegui 3 min',
    group: 'centrale',
    section: 'Attesa e rivalutazione',
    duration: 180,
    available: needPatient,
    run: ({ sim }) => {
      const p = sim.p;
      sim.measure('avpu', 'Coscienza (AVPU)', p.avpu);
      if (!sim.inArrest()) sim.measure('fr', 'FR', `${Math.round(p.v.rr)}/min`);
      sim.find(`Dopo 3 minuti: coscienza ${p.avpu}, ${breathingText(p, sim)}${sim.pulseOx && !sim.inArrest() ? ` SpO₂ ${Math.round(p.v.spo2)}%, FC ${Math.round(p.v.hr)}/min.` : ''}${sim.cooling ? ` Temperatura ${p.v.temp.toFixed(1).replace('.', ',')} °C.` : ''}`);
    },
  },
  {
    id: 'rivaluta',
    label: 'Rivaluta ABCDE e parametri (1 minuto)',
    short: 'Rivaluta (1 min)',
    group: 'centrale',
    section: 'Attesa e rivalutazione',
    duration: 60,
    available: needPatient,
    run: ({ sim }) => {
      const p = sim.p;
      // la rivalutazione rimisura coscienza, frequenza respiratoria e (con lo zaino) pressione
      const parti = [`coscienza ${p.avpu}`];
      sim.measure('avpu', 'Coscienza (AVPU)', p.avpu);
      if (!sim.inArrest()) {
        const rr = Math.round(p.v.rr);
        sim.measure('fr', 'FR', `${rr}/min`);
        parti.push(`FR ${rr}/min`);
        if (sim.has('zaino')) {
          if (p.v.sbp < 50) {
            sim.measure('pa', 'PA', 'non rilevabile');
            parti.push('PA non rilevabile');
          } else {
            const pa = `${Math.round(p.v.sbp / 5) * 5}/${Math.round(p.v.dbp / 5) * 5} mmHg`;
            sim.measure('pa', 'PA', pa);
            parti.push(`PA ${pa}`);
          }
        }
      }
      const sat = sim.pulseOx && sim.spo2Lettura() === 'ok' ? ` SpO₂ ${Math.round(p.v.spo2)}%, FC ${Math.round(p.v.hr)}/min.` : '';
      sim.find(`Rivalutazione: ${parti.join(', ')}. ${breathingText(p, sim)}${sat}`);
    },
  },
  {
    id: 'trasporta',
    label: 'Carica e trasporta in ospedale',
    short: 'Trasporto',
    group: 'centrale',
    section: 'Trasporto',
    duration: 120,
    picker: 'trasporto',
    available: (s) => {
      const n = needPatient(s);
      if (n !== true) return n;
      if (s.scenario.role === 'laico') return 'Non hai un mezzo di trasporto.';
      return true;
    },
    run: ({ sim, params }) => {
      const mode = String(params?.mode ?? 'barella');
      const pos = (params?.pos as Position) ?? sim.p.position;
      sim.transport = { mode, position: pos, t: sim.t };
      sim.p.position = pos;
      if (mode === 'piedi' && sim.flags.nonCamminare) {
        sim.penalize('fatto_camminare', 'grave', 'Hai fatto camminare il paziente', String(sim.flags.nonCamminare), ['ERC_FA_2025']);
      }
      if (sim.inArrest() && !sim.msaOnScene) {
        sim.penalize('trasporto_in_arresto', 'grave', 'Trasporto durante l’arresto cardiaco', 'La RCP di qualità si fa sul posto: il trasporto in arresto riduce l’efficacia delle compressioni. Si attende il mezzo avanzato.', ['ERC_BLS_2025']);
      }
      const how = mode === 'sedia' ? 'sedia portantina' : mode === 'piedi' ? 'a piedi' : 'barella';
      sim.say(
        'azione',
        sim.scenario.role === 'squadra'
          ? `Trasferite il paziente (${how}) al PMA, dove viene affidato all’ambulanza per l’ospedale indicato dalla SORES.`
          : `Carichi il paziente (${how}) e partite verso l’ospedale indicato dalla SORES.`,
      );
      sim.end('Trasporto in ospedale');
    },
  },
  {
    id: 'consegna',
    label: 'Passa le consegne all’équipe avanzata (infermiere o medico)',
    short: 'Consegne all’équipe avanzata',
    group: 'centrale',
    section: 'Trasporto',
    duration: 45,
    visible: (s) => s.msaOnScene,
    run: ({ sim }) => {
      sim.say('azione', 'Passi le consegne all’équipe avanzata: dinamica, parametri, trattamenti e orari.');
      sim.end('Consegna al mezzo avanzato');
    },
  },
];

export const ACTIONS: Record<string, ActionDef> = Object.fromEntries(list.map((a) => [a.id, a]));
export const ACTION_LIST = list;

export const GROUP_LABEL: Record<ActionDef['group'], string> = {
  scena: 'Arrivo e sicurezza',
  valutazione: 'Valutazione ABCDE',
  parametri: 'Parametri vitali',
  anamnesi: 'Anamnesi',
  trattamenti: 'Trattamenti',
  centrale: 'SORES e trasporto',
};

/** Ordine delle sezioni dentro le schede (l'elenco segue quest'ordine). */
export const SECTION_ORDER: string[] = ['A – Coscienza e vie aeree', 'B – Respiro', 'C – Circolo', 'D – Neurologico', 'E – Esposizione', 'Vie aeree', 'Ossigeno e ventilazione', 'RCP e DAE', 'Emorragie', 'Immobilizzazione', 'Parto', 'Posizione e altre cure', 'SORES', 'Attesa e rivalutazione', 'Trasporto'];
