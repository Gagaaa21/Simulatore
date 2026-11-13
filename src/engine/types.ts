import type { EquipmentId } from '../data/equipment';
import type { CriticitaCode, LuogoCode, PatologiaCode, ValutazioneCode } from '../data/codes';
import type { Sim } from './engine';

export type AVPU = 'A' | 'V' | 'P' | 'U';
export type Rhythm = 'sinusale' | 'tachicardia' | 'bradicardia' | 'fv' | 'tv_senza_polso' | 'asistolia' | 'aesp';
export type Airway = 'pervie' | 'russante' | 'gorgogliante' | 'ostruzione_parziale' | 'ostruzione_completa';
export type Breathing =
  | 'normale'
  | 'tachipnoico'
  | 'bradipnoico'
  | 'superficiale'
  | 'dispnoico'
  | 'sibili'
  | 'agonico'
  | 'assente';
export type SkinColor = 'rosea' | 'pallida' | 'cianotica' | 'arrossata' | 'marezzata' | 'grigiastra';
export type SkinTemp = 'normale' | 'fredda' | 'calda' | 'molto_calda';
export type Position = 'supino' | 'laterale' | 'semiseduto' | 'seduto' | 'prono' | 'in_piedi';
export type Pupils = 'normali' | 'miotiche' | 'midriatiche' | 'anisocoriche';
export type Speech = 'normale' | 'confuso' | 'disartrico' | 'afasico' | 'frasi_brevi' | 'assente' | 'pianto' | 'lamento';
export type BodyRegion =
  | 'testa'
  | 'collo'
  | 'torace'
  | 'addome'
  | 'bacino'
  | 'braccio_sx'
  | 'braccio_dx'
  | 'gamba_sx'
  | 'gamba_dx';

export interface Vitals {
  hr: number; // battiti/min
  rr: number; // atti/min
  spo2: number; // %
  sbp: number; // mmHg
  dbp: number;
  glu: number; // mg/dL
  temp: number; // °C (centrale)
  crt: number; // tempo di riempimento capillare, s
}

export interface Look {
  skinTone: string;
  hair: string;
  hairStyle: 'corti' | 'lunghi' | 'calvo' | 'raccolti' | 'bimbo';
  shirt: string;
  pants: string;
  build: 'neonato' | 'bambino' | 'adolescente' | 'adulto' | 'robusto';
  helmet?: boolean;
  wristband?: string;
  /** capo superiore: t-shirt (default), camicia, felpa, torso nudo, body da neonato */
  top?: 'tshirt' | 'camicia' | 'felpa' | 'nudo' | 'body' | 'giacca';
  /** maniche (default: lunghe per camicia/felpa/giacca, corte per t-shirt) */
  sleeves?: 'corte' | 'lunghe';
  bottom?: 'pantaloni' | 'shorts' | 'gonna';
  shoes?: string;
}

export interface Bleeding {
  region: BodyRegion;
  label: string;
  rate: number; // mL/min quando non controllata
  arterial: boolean;
  /** distanza dalla radice dell'arto (0 = radice, 1 = estremità) – serve a validare il tourniquet */
  pos: number;
}

export interface Patient {
  name: string;
  age: number; // anni (frazioni per i lattanti)
  sex: 'M' | 'F';
  weightKg: number;
  avpu: AVPU;
  gcs: number;
  airway: Airway;
  breathing: Breathing;
  rhythm: Rhythm;
  pulseRadial: boolean;
  v: Vitals;
  /** SpO₂ che il paziente avrebbe respirando aria ambiente (la base su cui agisce l'ossigeno) */
  spo2Air: number;
  skin: { color: SkinColor; temp: SkinTemp; sweaty: boolean };
  pupils: Pupils;
  speech: Speech;
  position: Position;
  canSwallow: boolean;
  seizing: boolean;
  vomitInMouth: boolean;
  stroke?: { face: boolean; arm: boolean; speech: boolean };
  bleeding?: Bleeding;
  bloodLossMl: number;
  look: Look;
  /** Segni di vita dopo ROSC, movimenti, ecc. – testo libero per la scena */
  notes: string[];
}

export type O2Device = 'occhialini' | 'maschera' | 'reservoir';
export interface O2State {
  device: O2Device;
  flow: number; // L/min
  since: number;
}

export type AedPhase =
  | 'spento'
  | 'acceso'
  | 'analisi'
  | 'carica'
  | 'pronto'
  | 'erogato'
  | 'non_consigliato'
  | 'rcp';

export interface AedState {
  phase: AedPhase;
  phaseAt: number;
  pads: null | 'anterolaterale' | 'anteroposteriore' | 'errata';
  pediatric: boolean;
  shocks: number;
  lastShockAt: number | null;
  firstShockAt: number | null;
  prompt: string;
  promptAt: number;
  firstAnalysisAt: number | null;
  clearCalledAt: number | null;
}

export interface CprState {
  active: boolean;
  by: 'equipaggio' | 'giocatore' | 'astante';
  startedAt: number | null; // prima compressione della missione
  segmentStart: number | null;
  pausedAt: number | null;
  compressorSince: number;
  quality: number; // 0..1
  ventilation: 'nessuna' | 'pocket' | 'pallone';
  goodSeconds: number;
  totalSeconds: number;
  ratio: '30:2' | '15:2' | 'solo_compressioni';
}

export interface Measurement {
  key: string;
  label: string;
  value: string;
  t: number;
}

export type LogKind = 'azione' | 'reperto' | 'evento' | 'errore' | 'radio' | 'paziente' | 'sistema' | 'ok' | 'consiglio';
export interface LogEntry {
  id: number;
  t: number;
  kind: LogKind;
  text: string;
  sources?: string[];
}

export type Severity = 'critico' | 'grave' | 'lieve';
export interface Penalty {
  id: string;
  t: number;
  severity: Severity;
  text: string;
  why: string;
  sources: string[];
}

export interface Objective {
  id: string;
  label: string;
  category: 'sicurezza' | 'valutazione' | 'trattamento' | 'comunicazione' | 'tempi' | 'presidi';
  points: number;
  critical?: boolean;
  check: (sim: Sim) => boolean;
  why: string;
  sources: string[];
}

export interface Hazard {
  id: string;
  label: string;
  fixAction: string; // id azione che mette in sicurezza
  consequence: string; // cosa succede se ti avvicini senza mitigare
}

export type QuestionId =
  | 'sintomi'
  | 'allergie'
  | 'farmaci'
  | 'patologie'
  | 'pasto'
  | 'eventi'
  | 'dolore'
  | 'esordio'
  | 'testimoni';

export type ProtocolId =
  | 'bls_adulto'
  | 'pbls'
  | 'fbao_adulto'
  | 'fbao_pediatrico'
  | 'abcde'
  | 'dolore_toracico'
  | 'ictus'
  | 'ipoglicemia'
  | 'dispnea'
  | 'anafilassi'
  | 'convulsioni'
  | 'trauma'
  | 'emorragia'
  | 'colpo_calore'
  | 'intossicazione'
  | 'annegamento'
  | 'oppioidi'
  | 'ustioni';

export type SettingId =
  | 'casa'
  | 'ristorante'
  | 'strada'
  | 'cantiere'
  | 'concerto'
  | 'festival'
  | 'lago'
  | 'parcheggio'
  | 'supermercato'
  | 'stadio';

export interface ArrestConfig {
  shockable: boolean;
  /** numero di shock dopo cui avviene il ROSC (se la RCP è stata di qualità) */
  roscAfterShocks?: number;
  /** ROSC dopo questi secondi di RCP di qualità (ritmi non defibrillabili / cause reversibili) */
  roscAfterCprSeconds?: number;
  /** il ROSC richiede anche ventilazioni efficaci (annegamento, asfissia) */
  needsVentilation?: boolean;
}

export interface Dispatch {
  luogo: LuogoCode;
  patologia: PatologiaCode;
  criticita: CriticitaCode;
  address: string;
  caller: string;
  text: string;
  extra?: string; // es. "Inviato anche MSA, ETA 8 minuti"
  time: string; // ora della chiamata hh:mm
  /** secondi tra la chiamata e l'arrivo sul posto (default 480) */
  travel?: number;
}

export interface LoadoutConfig {
  essential: EquipmentId[];
  recommended: EquipmentId[];
  /** tempo (s) per tornare al mezzo/PMA a prendere un presidio dimenticato */
  fetchTime: number;
  note?: string;
  /** presidi non disponibili in questo contesto */
  unavailable?: EquipmentId[];
}

export interface ScenarioHooks {
  onStart?: (sim: Sim) => void;
  /** chiamato ogni secondo simulato dopo la fisiologia generica */
  tick?: (sim: Sim) => void;
  /** chiamato al completamento di un'azione; restituisci true per sostituire il comportamento standard */
  onAction?: (sim: Sim, actionId: string, params?: Record<string, unknown>) => boolean | void;
  outcome?: (sim: Sim) => Outcome;
}

export interface Outcome {
  status: 'ottimo' | 'buono' | 'critico' | 'decesso';
  title: string;
  text: string;
}

export interface Scenario {
  id: string;
  title: string;
  subtitle: string;
  category: '118' | 'eventi' | 'fuori_servizio';
  difficulty: 1 | 2 | 3;
  minutes: number; // durata indicativa
  setting: SettingId;
  timeOfDay: 'giorno' | 'sera' | 'notte';
  role: 'msb' | 'squadra' | 'laico';
  crew: number;
  dispatch: Dispatch;
  loadout: LoadoutConfig | null;
  scene: {
    intro: string;
    hazards: Hazard[];
    mechanism?: string;
    bystanders?: string;
    /** presidi già sul posto (es. DAE pubblico da far prendere) */
    publicAed?: { fetchTime: number; where: string };
  };
  patient: Omit<Patient, 'bloodLossMl' | 'notes' | 'spo2Air'> & { spo2Air?: number };
  trauma: boolean;
  arrest?: ArrestConfig;
  answers: Partial<Record<QuestionId, string>>;
  exam: {
    testaPiedi: string;
    cavoOrale?: string;
    torace?: string;
    addome?: string;
    arti?: string;
    extra?: Record<string, string>;
  };
  protocol: { correct: ProtocolId[]; acceptable?: ProtocolId[] };
  valutazione: { correct: ValutazioneCode[]; acceptable?: ValutazioneCode[] };
  /** informazioni che la Centrale si aspetta nel report */
  reportKeys: string[];
  msa: { available: boolean; eta: number; autoDispatched?: boolean; label?: string };
  heli?: { eta: number };
  timeLimit: number; // s
  objectives: Objective[];
  teaching: string[];
  sources: string[];
  hooks?: ScenarioHooks;
}

export type Mode = 'addestramento' | 'esame';

export interface ActionContext {
  sim: Sim;
  params?: Record<string, unknown>;
}

export type ActionGroup =
  | 'scena'
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'anamnesi'
  | 'trattamenti'
  | 'immobilizzazione'
  | 'centrale';

export interface ActionDef {
  id: string;
  label: string;
  short?: string;
  group: ActionGroup;
  duration: number | ((sim: Sim) => number);
  needs?: EquipmentId[];
  /** visibile in questo scenario? */
  visible?: (sim: Sim) => boolean;
  /** disponibile ora? stringa = motivo per cui non lo è */
  available?: (sim: Sim) => true | string;
  /** richiede un contatto con il paziente (guanti!) */
  contact?: boolean;
  /** si apre un pannello di scelta prima di eseguire */
  picker?: 'ossigeno' | 'tourniquet' | 'raffreddamento' | 'posizione' | 'centrale' | 'trasporto' | 'dae_piastre' | 'domanda';
  regions?: BodyRegion[];
  hint?: string;
  run: (ctx: ActionContext) => void;
}
