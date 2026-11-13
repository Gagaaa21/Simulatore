import type { EquipmentId } from '../data/equipment';
import { EQUIPMENT } from '../data/equipment';
import type { ValutazioneCode } from '../data/codes';
import type {
  AedState,
  BodyRegion,
  CprState,
  LogEntry,
  LogKind,
  Measurement,
  Mode,
  O2Device,
  O2State,
  Patient,
  Penalty,
  Position,
  ProtocolId,
  Scenario,
  Severity,
  Vitals,
} from './types';
import { ACTIONS } from './actions';
import { PROTOCOLS } from '../data/protocols';

export const ARREST_RHYTHMS = ['fv', 'tv_senza_polso', 'asistolia', 'aesp'] as const;

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const approach = (cur: number, target: number, step: number) =>
  cur < target ? Math.min(target, cur + step) : Math.max(target, cur - step);

export function fmtClock(t: number): string {
  const s = Math.max(0, Math.floor(t));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/** Converte "hh:mm" + secondi trascorsi in un orario reale di missione. */
export function clockAt(start: string, t: number): string {
  const [h, m] = start.split(':').map(Number);
  const total = h * 60 + m + Math.floor(t / 60);
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export interface BusyAction {
  actionId: string;
  label: string;
  start: number;
  end: number;
  params?: Record<string, unknown>;
}

export interface StartResult {
  ok: boolean;
  reason?: string;
  missing?: EquipmentId[];
}

export class Sim {
  readonly scenario: Scenario;
  readonly mode: Mode;
  t = 0;
  phase: 'scena' | 'paziente' | 'fine' = 'scena';
  p: Patient;
  /** valori "intrinseci" del paziente: gli scenari li modificano, la fisiologia li trasforma nei valori reali */
  base: Vitals;
  brought: Set<EquipmentId>;
  flags: Record<string, number | boolean | string> = {};
  doneAt = new Map<string, number[]>();
  o2: O2State | null = null;
  pulseOx = false;
  bvm = false;
  pressure = false;
  dressing = false;
  tourniquet: { at: number; region: BodyRegion; pos: number; ok: boolean } | null = null;
  immob = new Set<string>();
  cooling: { method: string; since: number; rate: number } | null = null;
  covered = false;
  measurements = new Map<string, Measurement>();
  log: LogEntry[] = [];
  penalties: Penalty[] = [];
  history: { t: number; hr: number; spo2: number | null; sbp: number; rr: number }[] = [];
  requests: Record<string, number> = {};
  msaAt: number | null = null;
  msaOnScene = false;
  heliAt: number | null = null;
  protocol: { id: ProtocolId; t: number } | null = null;
  report: { code: ValutazioneCode; items: string[]; t: number } | null = null;
  transport: { mode: string; position: Position; t: number } | null = null;
  ended: { reason: string; t: number } | null = null;
  busy: BusyAction | null = null;
  aed: AedState = {
    phase: 'spento',
    phaseAt: 0,
    pads: null,
    pediatric: false,
    shocks: 0,
    lastShockAt: null,
    firstShockAt: null,
    prompt: '',
    promptAt: 0,
    firstAnalysisAt: null,
    clearCalledAt: null,
  };
  cpr: CprState = {
    active: false,
    by: 'equipaggio',
    startedAt: null,
    segmentStart: null,
    pausedAt: null,
    compressorSince: 0,
    quality: 0.85,
    ventilation: 'nessuna',
    goodSeconds: 0,
    totalSeconds: 0,
    ratio: '30:2',
  };
  arrest = {
    startedAt: null as number | null,
    noFlow: 0,
    lowFlow: 0,
    roscAt: null as number | null,
    signsOfLifeAt: null as number | null,
    recognizedAt: null as number | null,
    irreversible: false,
    shockToCpr: [] as number[],
  };
  hypoxiaSeconds = 0;
  fetching: EquipmentId[] = [];
  aedFetchAt: number | null = null;
  /** messaggi vocali del DAE in attesa di essere pronunciati dalla UI */
  voiceQueue: string[] = [];
  /** eventi sonori in attesa (bip, radio, allarmi) */
  soundQueue: string[] = [];
  private seq = 0;
  private acc = 0;
  private version = 0;
  private listeners = new Set<() => void>();

  constructor(scenario: Scenario, mode: Mode, brought: EquipmentId[]) {
    this.scenario = scenario;
    this.mode = mode;
    this.brought = new Set(brought);
    const sp = scenario.patient;
    this.p = {
      ...structuredClone(sp),
      spo2Air: sp.spo2Air ?? sp.v.spo2,
      bloodLossMl: 0,
      notes: [],
    } as Patient;
    this.base = { ...sp.v };
    if (scenario.msa.autoDispatched) {
      this.msaAt = scenario.msa.eta;
      this.requests.msa = 0;
    }
  }

  // ───────────────────────── sottoscrizione per la UI
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
  getVersion = () => this.version;
  emit() {
    this.version++;
    this.listeners.forEach((l) => l());
  }

  // ───────────────────────── helper per gli scenari
  say(kind: LogKind, text: string, sources?: string[]) {
    this.log.push({ id: ++this.seq, t: this.t, kind, text, sources });
    if (kind === 'radio') this.soundQueue.push('radio');
    if (kind === 'errore') this.soundQueue.push('errore');
  }
  find(text: string) {
    this.say('reperto', text);
  }
  penalize(id: string, severity: Severity, text: string, why: string, sources: string[] = []) {
    if (this.penalties.some((p) => p.id === id)) return;
    this.penalties.push({ id, t: this.t, severity, text, why, sources });
    if (this.mode === 'addestramento') this.say('errore', `${text} — ${why}`, sources);
  }
  did(id: string): boolean {
    return (this.doneAt.get(id)?.length ?? 0) > 0;
  }
  firstAt(id: string): number | null {
    return this.doneAt.get(id)?.[0] ?? null;
  }
  count(id: string): number {
    return this.doneAt.get(id)?.length ?? 0;
  }
  didAny(...ids: string[]): boolean {
    return ids.some((i) => this.did(i));
  }
  firstAny(...ids: string[]): number | null {
    const ts = ids.map((i) => this.firstAt(i)).filter((x): x is number => x !== null);
    return ts.length ? Math.min(...ts) : null;
  }
  flag(k: string) {
    return this.flags[k];
  }
  set(k: string, v: number | boolean | string) {
    this.flags[k] = v;
  }
  measure(key: string, label: string, value: string) {
    this.measurements.set(key, { key, label, value, t: this.t });
  }
  has(eq: EquipmentId) {
    return this.brought.has(eq);
  }
  /** Orario reale (hh:mm) al tempo di missione t. */
  clock(t: number = this.t): string {
    return clockAt(this.scenario.dispatch.time, (this.scenario.dispatch.travel ?? 480) + t);
  }
  hint(text: string) {
    if (this.mode === 'addestramento') this.say('consiglio', text);
  }

  // ───────────────────────── stato derivato
  inArrest(): boolean {
    return (ARREST_RHYTHMS as readonly string[]).includes(this.p.rhythm);
  }
  isInfant(): boolean {
    return this.p.age < 1;
  }
  isChild(): boolean {
    return this.p.age < 13;
  }
  bloodVolume(): number {
    return this.p.weightKg * (this.p.age < 1 ? 85 : this.p.age < 13 ? 80 : 70);
  }
  bloodLossFraction(): number {
    return this.p.bloodLossMl / this.bloodVolume();
  }
  bleedingRate(): number {
    const b = this.p.bleeding;
    if (!b) return 0;
    if (this.tourniquet?.ok) return 0;
    let r = b.rate;
    if (this.tourniquet && !this.tourniquet.ok) r *= 0.8; // laccio messo male: venoso chiuso, arterioso no
    if (this.dressing) r *= b.arterial ? 0.35 : 0.1;
    if (this.pressure) r *= b.arterial ? 0.3 : 0.08;
    if (this.inArrest() && !this.cpr.active) r *= 0.05;
    return r;
  }
  canTalk(): boolean {
    return this.p.avpu === 'A' && !['assente'].includes(this.p.speech) && this.p.airway !== 'ostruzione_completa';
  }
  o2Boost(): number {
    if (!this.o2 || !this.has('ossigeno')) return 0;
    const { device, flow } = this.o2;
    if (device === 'occhialini') return Math.min(flow, 4) * 1.6;
    if (device === 'maschera') return flow < 5 ? 2 : 6 + (Math.min(flow, 10) - 5) * 0.9;
    // reservoir: sotto i 10 L/min il pallone non si riempie
    return flow < 10 ? 4 : 15 + (Math.min(flow, 15) - 10) * 0.8;
  }

  // ───────────────────────── avvio
  start() {
    const s = this.scenario;
    this.say('sistema', s.scene.intro);
    if (s.dispatch.extra) this.say('radio', s.dispatch.extra);
    s.hooks?.onStart?.(this);
    this.sample();
    this.emit();
  }

  // ───────────────────────── tempo
  advance(dt: number) {
    if (this.ended) return;
    this.acc += dt;
    let changed = false;
    while (this.acc >= 1) {
      this.acc -= 1;
      this.step();
      changed = true;
      if (this.ended) break;
    }
    if (changed) this.emit();
  }

  private step() {
    this.t += 1;
    this.physiology();
    this.aedTick();
    this.scenario.hooks?.tick?.(this);
    // arrivi
    if (this.msaAt !== null && !this.msaOnScene && this.t >= this.msaAt) {
      this.msaOnScene = true;
      this.say('radio', `${this.scenario.msa.label ?? 'Il mezzo avanzato (MSA)'} è sul posto: prepara il passaggio di consegne.`);
      this.soundQueue.push('sirena');
    }
    if (this.heliAt !== null && this.t === this.heliAt) {
      this.say('radio', 'L’elisoccorso è atterrato nella zona indicata: l’équipe medica è con voi.');
      this.msaOnScene = true;
      this.soundQueue.push('sirena');
    }
    // presidi recuperati
    if (this.aedFetchAt !== null && this.t >= this.aedFetchAt) {
      this.aedFetchAt = null;
      this.brought.add('dae');
      this.set('daeArrivatoAt', this.t);
      this.say('evento', 'Il DAE è arrivato: accendilo subito e applica le piastre.');
      this.soundQueue.push('bip');
    }
    // azione in corso
    if (this.busy && this.t >= this.busy.end) this.completeBusy();
    if (this.t % 5 === 0) this.sample();
    if (this.t >= this.scenario.timeLimit && !this.ended) {
      this.say('sistema', 'Tempo massimo dello scenario raggiunto.');
      this.end('Tempo scaduto');
    }
  }

  private sample() {
    const v = this.p.v;
    this.history.push({ t: this.t, hr: Math.round(v.hr), spo2: this.inArrest() ? null : Math.round(v.spo2), sbp: Math.round(v.sbp), rr: Math.round(v.rr) });
  }

  // ───────────────────────── fisiologia generica
  private physiology() {
    const p = this.p;
    const v = p.v;
    if (this.inArrest()) {
      this.arrestTick();
      return;
    }

    // Vie aeree e respiro: aggiornano la SpO₂ "in aria"
    if (p.airway === 'ostruzione_completa') {
      p.spo2Air = Math.max(25, p.spo2Air - 0.55);
    } else if (p.breathing === 'assente' || p.breathing === 'agonico') {
      if (this.bvm) p.spo2Air = Math.min(this.flags.bvmTarget ? Number(this.flags.bvmTarget) : 88, p.spo2Air + 0.4);
      else p.spo2Air = Math.max(20, p.spo2Air - 0.5);
    } else if (this.bvm && (p.breathing === 'bradipnoico' || p.breathing === 'superficiale')) {
      p.spo2Air = Math.min(this.flags.bvmTarget ? Number(this.flags.bvmTarget) : 90, p.spo2Air + 0.3);
    }
    if (p.vomitInMouth && p.avpu !== 'A' && p.position !== 'laterale') {
      p.spo2Air = Math.max(60, p.spo2Air - 0.15);
    }

    // Emorragia
    const rate = this.bleedingRate();
    if (rate > 0) p.bloodLossMl += rate / 60;
    const f = this.bloodLossFraction();

    // bersagli
    let hr = this.base.hr;
    let sbp = this.base.sbp;
    let dbp = this.base.dbp;
    let rr = this.base.rr;
    let crt = this.base.crt;
    if (f > 0.12) {
      hr += (f - 0.12) * 260;
      rr += (f - 0.12) * 40;
      crt = Math.max(crt, 2 + (f - 0.12) * 12);
    }
    if (f > 0.25) {
      sbp -= (f - 0.25) * 260;
      dbp -= (f - 0.25) * 160;
    }
    // ipossia
    if (v.spo2 < 85) hr += (85 - v.spo2) * 0.8;
    if (v.spo2 < 55) this.hypoxiaSeconds++;
    else this.hypoxiaSeconds = Math.max(0, this.hypoxiaSeconds - 2);
    if (this.hypoxiaSeconds > 45) hr = Math.max(25, 140 - (this.hypoxiaSeconds - 45) * 3);

    // perfusione → coscienza
    if (f > 0.33 && p.avpu === 'A') {
      p.avpu = 'V';
      p.speech = 'confuso';
      this.say('paziente', 'Il paziente è sempre più confuso e risponde a fatica.');
    }
    if (f > 0.42 && (p.avpu === 'A' || p.avpu === 'V')) {
      p.avpu = 'P';
      p.speech = 'lamento';
      this.say('paziente', 'Il paziente non risponde più alla voce.');
    }
    if (f > 0.12) {
      p.skin.color = f > 0.3 ? 'grigiastra' : 'pallida';
      p.skin.sweaty = true;
      p.skin.temp = 'fredda';
      p.pulseRadial = sbp > 80;
    }

    // SpO₂
    let spTarget = p.spo2Air + this.o2Boost();
    if (this.bvm && this.has('ossigeno') && this.o2 && this.o2.flow >= 10) spTarget = p.spo2Air + 12;
    if (sbp < 70) spTarget -= 4;
    spTarget = clamp(spTarget, 0, 100);
    v.spo2 = approach(v.spo2, spTarget, spTarget < v.spo2 ? 0.5 : 0.35);

    // ipossia grave → perdita di coscienza
    if (v.spo2 < 65 && p.avpu === 'A') {
      p.avpu = 'U';
      p.speech = 'assente';
      p.canSwallow = false;
      this.say('paziente', 'Il paziente perde conoscenza e si accascia.');
      this.soundQueue.push('allarme');
    }

    v.hr = approach(v.hr, clamp(hr, 20, 190), 2);
    v.sbp = approach(v.sbp, clamp(sbp, 40, 240), 1.5);
    v.dbp = approach(v.dbp, clamp(dbp, 20, 140), 1);
    v.rr = approach(v.rr, clamp(rr, 0, 50), 0.5);
    if (p.breathing === 'assente') v.rr = 0;
    v.crt = crt;
    v.temp = this.base.temp;
    v.glu = this.base.glu;

    // Raffreddamento attivo
    if (this.cooling) {
      this.base.temp = Math.max(36.5, this.base.temp - this.cooling.rate / 60);
    }

    // Arresto da ipossia o da shock
    if ((this.hypoxiaSeconds > 45 && v.hr <= 30) || f > 0.5) {
      this.enterArrest(f > 0.5 ? 'aesp' : 'aesp', f > 0.5 ? 'Il paziente non respira più: arresto cardiaco da shock emorragico.' : 'Il paziente non respira più: arresto cardiaco ipossico.');
    }
  }

  enterArrest(rhythm: 'fv' | 'tv_senza_polso' | 'asistolia' | 'aesp', text: string) {
    const p = this.p;
    p.rhythm = rhythm;
    p.avpu = 'U';
    p.breathing = 'agonico';
    p.speech = 'assente';
    p.pulseRadial = false;
    p.canSwallow = false;
    p.seizing = false;
    p.skin.color = 'grigiastra';
    p.position = p.position === 'seduto' || p.position === 'semiseduto' ? 'supino' : p.position;
    this.arrest.startedAt = this.t;
    this.say('paziente', text);
    this.soundQueue.push('allarme');
  }

  private arrestTick() {
    const p = this.p;
    const v = p.v;
    const a = this.arrest;
    if (a.startedAt === null) a.startedAt = this.t;
    const since = this.t - a.startedAt;
    if (since > 60 && p.breathing === 'agonico') p.breathing = 'assente';
    v.hr = 0;
    v.sbp = 0;
    v.dbp = 0;
    v.rr = 0;
    v.crt = 6;
    p.spo2Air = Math.max(20, p.spo2Air - 0.3);
    v.spo2 = Math.max(0, v.spo2 - 0.5);

    const c = this.cpr;
    if (c.active) {
      c.totalSeconds++;
      a.lowFlow++;
      // affaticamento: dopo 2 minuti senza cambio la qualità cala
      if (c.by !== 'giocatore' && this.t - c.compressorSince > 120) c.quality = Math.max(0.45, c.quality - 0.003);
      if (c.quality >= 0.6) c.goodSeconds++;
      if (c.by === 'equipaggio' && this.t - c.compressorSince > 150) this.set('fatica', true);
      if (this.t - c.compressorSince === 120 && this.scenario.crew > 1) {
        this.hint('Sono passati 2 minuti di compressioni: cambia il compressore per evitare l’affaticamento.');
      }
    } else {
      a.noFlow++;
      if (this.phase === 'paziente') this.set('pauseDopoContatto', Number(this.flags.pauseDopoContatto ?? 0) + 1);
    }
    if (a.noFlow > 600) a.irreversible = true;

    // FV che degenera in asistolia senza RCP
    if ((p.rhythm === 'fv' || p.rhythm === 'tv_senza_polso') && a.noFlow + a.lowFlow * 0.2 > 720) {
      p.rhythm = 'asistolia';
    }

    // ROSC
    const cfg = this.scenario.arrest;
    if (cfg && !a.irreversible && a.roscAt === null) {
      const enoughCpr = c.goodSeconds >= 60;
      let rosc = false;
      if (cfg.shockable && cfg.roscAfterShocks !== undefined) {
        const lastShock = this.aed.lastShockAt;
        rosc = this.aed.shocks >= cfg.roscAfterShocks && enoughCpr && lastShock !== null && this.t - lastShock >= 25 && c.active;
        if (a.noFlow > 240 && this.aed.shocks < cfg.roscAfterShocks + 1) rosc = false;
      } else if (cfg.roscAfterCprSeconds !== undefined) {
        const vent = !cfg.needsVentilation || c.ventilation !== 'nessuna';
        rosc = c.goodSeconds >= cfg.roscAfterCprSeconds && vent && c.active;
      }
      if (rosc) this.rosc();
    }
  }

  rosc() {
    const p = this.p;
    this.arrest.roscAt = this.t;
    p.rhythm = 'sinusale';
    this.base = { ...this.base, hr: 108, sbp: 104, dbp: 64, rr: 12, crt: 3 };
    p.v.hr = 115;
    p.v.sbp = 90;
    p.v.dbp = 55;
    p.spo2Air = 88;
    p.v.spo2 = Math.max(p.v.spo2, 80);
    p.breathing = 'normale';
    p.airway = 'russante';
    p.avpu = 'U';
    p.pulseRadial = true;
    p.skin.color = 'pallida';
    this.arrest.signsOfLifeAt = this.t;
    this.say('paziente', 'Il paziente tossisce, muove un braccio e inizia a respirare: segni di vita!');
    this.soundQueue.push('bip');
  }

  // ───────────────────────── DAE
  aedSay(text: string) {
    this.aed.prompt = text;
    this.aed.promptAt = this.t;
    this.voiceQueue.push(text);
  }
  setAedPhase(phase: AedState['phase']) {
    this.aed.phase = phase;
    this.aed.phaseAt = this.t;
  }
  aedOn() {
    if (this.aed.phase !== 'spento') return;
    this.setAedPhase('acceso');
    this.aedSay(this.isChild() && this.p.weightKg < 25 ? 'Paziente pediatrico: usare la modalità pediatrica. Applicare le piastre sul torace nudo.' : 'Applicare le piastre sul torace nudo del paziente.');
    if (!this.flags.aedOnAt) this.set('aedOnAt', this.t);
  }
  aedPads(pos: 'anterolaterale' | 'anteroposteriore' | 'errata', pediatric: boolean) {
    this.aed.pads = pos;
    this.aed.pediatric = pediatric;
    if (!this.flags.padsAt) this.set('padsAt', this.t);
    if (pos === 'errata') {
      this.aedSay('Controllare le piastre.');
      return;
    }
    this.startAnalysis();
  }
  startAnalysis() {
    this.setAedPhase('analisi');
    if (this.aed.firstAnalysisAt === null) this.aed.firstAnalysisAt = this.t;
    if (this.cpr.active) {
      this.stopCpr('Il DAE analizza: il collega solleva le mani dal torace.');
    }
    this.aedSay('Analisi del ritmo in corso. Non toccare il paziente.');
  }
  private aedTick() {
    const a = this.aed;
    const dt = this.t - a.phaseAt;
    const shockable = this.p.rhythm === 'fv' || this.p.rhythm === 'tv_senza_polso';
    switch (a.phase) {
      case 'analisi':
        if (this.cpr.active) {
          this.penalize('touch_analysis', 'grave', 'Compressioni durante l’analisi del DAE', 'Durante l’analisi nessuno deve toccare il paziente: il movimento falsa la lettura del ritmo.', ['ERC_BLS_2025']);
        }
        if (dt >= 7) {
          if (shockable) {
            this.setAedPhase('carica');
            this.aedSay('Shock consigliato. Carica in corso. Allontanarsi dal paziente.');
            this.soundQueue.push('carica');
          } else {
            this.setAedPhase('non_consigliato');
            this.aedSay(this.inArrest() ? 'Shock non consigliato. Iniziare la RCP.' : 'Shock non consigliato. Controllare il paziente.');
          }
        }
        break;
      case 'carica':
        if (dt >= 5) {
          this.setAedPhase('pronto');
          this.aedSay('Premere il pulsante shock lampeggiante.');
          this.soundQueue.push('pronto');
        }
        break;
      case 'pronto':
        if (dt === 30) {
          this.penalize('slow_shock', 'grave', 'Shock ritardato', 'Ogni minuto di ritardo nella defibrillazione riduce la probabilità di sopravvivenza di circa il 10%.', ['ERC_LAY_2025']);
        }
        break;
      case 'erogato':
      case 'non_consigliato':
        if (dt >= 3) this.setAedPhase('rcp');
        break;
      case 'rcp':
        if (dt >= 120) {
          if (this.p.pulseRadial && !this.inArrest() && this.arrest.roscAt !== null && this.t - this.arrest.roscAt > 60) {
            // continua comunque l'analisi periodica
          }
          this.startAnalysis();
        }
        break;
      default:
        break;
    }
  }
  aedShock(): boolean {
    if (this.aed.phase !== 'pronto') return false;
    if (this.cpr.active) {
      this.penalize('shock_touch', 'critico', 'Shock con un collega a contatto', 'Prima dello shock bisogna verificare che nessuno tocchi il paziente.', ['ERC_BLS_2025']);
    }
    if (this.aed.clearCalledAt === null || this.aed.clearCalledAt < this.aed.phaseAt - 6) {
      this.penalize('no_clear', 'lieve', 'Non hai dato l’ordine di allontanarsi', 'Prima di premere il pulsante annuncia “Via tutti!” e controlla che nessuno tocchi il paziente.', ['ERC_BLS_2025']);
    }
    this.aed.shocks++;
    this.aed.lastShockAt = this.t;
    if (this.aed.firstShockAt === null) this.aed.firstShockAt = this.t;
    this.setAedPhase('erogato');
    this.aedSay('Shock erogato. Iniziare la RCP.');
    this.soundQueue.push('shock');
    this.say('evento', `Shock n. ${this.aed.shocks} erogato.`);
    this.emit();
    return true;
  }

  // ───────────────────────── RCP
  startCpr(by: CprState['by'] = 'equipaggio') {
    const c = this.cpr;
    if (c.active && c.by === 'astante' && by !== 'astante') {
      c.by = by;
      c.quality = by === 'giocatore' ? c.quality : 0.88;
      c.compressorSince = this.t;
      if (c.ratio === 'solo_compressioni') c.ratio = '30:2';
      if (!this.flags.crewCprAt) this.set('crewCprAt', this.t);
      this.say('azione', 'Prendi il posto dell’astante alle compressioni senza interromperle: ora la RCP è dell’equipaggio.');
      this.emit();
      return;
    }
    if (c.active) return;
    if (!this.inArrest() && !this.flags.cprIndicata) {
      if (this.arrest.roscAt !== null) {
        this.penalize('cpr_after_rosc', 'lieve', 'RCP ripresa su paziente con segni di vita', 'Dopo il ritorno del circolo si interrompe la RCP e si rivaluta il respiro, pronti a ricominciare se si ferma.', ['ERC_BLS_2025']);
      } else {
        this.penalize('cpr_with_pulse', 'critico', 'Compressioni su un paziente che respira e ha circolo', 'La RCP si inizia solo se il paziente non risponde e non respira normalmente.', ['ERC_BLS_2025']);
      }
      return;
    }
    if (this.aed.phase === 'analisi') {
      this.penalize('touch_analysis', 'grave', 'Compressioni durante l’analisi del DAE', 'Durante l’analisi nessuno deve toccare il paziente.', ['ERC_BLS_2025']);
    }
    c.active = true;
    c.by = by;
    if (by !== 'astante') c.quality = by === 'giocatore' ? Math.max(c.quality, 0.8) : 0.88;
    if (by !== 'astante' && !this.flags.crewCprAt) this.set('crewCprAt', this.t);
    if (c.startedAt === null) {
      c.startedAt = this.t;
      c.compressorSince = this.t;
    }
    c.segmentStart = this.t;
    if (c.pausedAt !== null && this.aed.lastShockAt !== null && this.aed.lastShockAt >= c.pausedAt) {
      this.arrest.shockToCpr.push(this.t - this.aed.lastShockAt);
      if (this.t - this.aed.lastShockAt > 10) {
        this.penalize('slow_resume_' + this.aed.shocks, 'lieve', 'Ripresa lenta delle compressioni dopo lo shock', 'Dopo lo shock le compressioni vanno riprese immediatamente, senza ricontrollare il polso.', ['ERC_BLS_2025']);
      }
    }
    c.pausedAt = null;
    if (this.p.position !== 'supino') this.p.position = 'supino';
    this.say(
      'azione',
      by === 'giocatore' || this.scenario.role === 'laico'
        ? 'Inizi le compressioni toraciche al centro del torace.'
        : `Il collega inizia le compressioni toraciche (${c.ratio === 'solo_compressioni' ? 'continue' : c.ratio}).`,
    );
    this.emit();
  }
  stopCpr(reason?: string) {
    const c = this.cpr;
    if (!c.active) return;
    c.active = false;
    c.pausedAt = this.t;
    if (reason) this.say('evento', reason);
    this.emit();
  }
  rotateCompressor() {
    this.cpr.compressorSince = this.t;
    this.cpr.quality = this.cpr.by === 'giocatore' ? this.cpr.quality : 0.88;
    this.say('azione', this.scenario.role === 'laico' ? 'Un presente, istruito da te, ti dà il cambio alle compressioni.' : 'Cambio compressore in meno di 5 secondi.');
  }

  // ───────────────────────── azioni
  actionAvailability(id: string): true | string {
    const def = ACTIONS[id];
    if (!def) return 'Azione sconosciuta';
    if (this.ended) return 'Scenario terminato';
    if (def.available) return def.available(this);
    return true;
  }

  /** Tempo per tornare al mezzo/PMA a prendere un presidio. */
  fetchTime(): number {
    return this.scenario.loadout?.fetchTime ?? 120;
  }

  startAction(id: string, params?: Record<string, unknown>): StartResult {
    const def = ACTIONS[id];
    if (!def) return { ok: false, reason: 'Azione sconosciuta' };
    if (this.busy) return { ok: false, reason: 'Stai già eseguendo un’azione' };
    if (this.ended) return { ok: false, reason: 'Scenario terminato' };
    const avail = this.actionAvailability(id);
    if (avail !== true) return { ok: false, reason: avail };
    const missing = (def.needs ?? []).filter((e) => !this.brought.has(e));
    if (missing.length) {
      if (!this.scenario.loadout) return { ok: false, reason: 'Non hai con te questo presidio.', missing: [] };
      if (this.scenario.loadout.unavailable?.some((u) => missing.includes(u))) return { ok: false, reason: 'Questo presidio non è disponibile in questo contesto.' };
      return { ok: false, reason: `Serve: ${missing.map((m) => EQUIPMENT[m].name).join(', ')}`, missing };
    }
    // autoprotezione
    if (def.contact && this.phase === 'paziente' && !this.flags.guanti && this.scenario.role !== 'laico') {
      this.penalize('no_gloves', 'lieve', 'Contatto con il paziente senza guanti', 'L’autoprotezione viene prima di tutto: indossa i guanti prima di toccare il paziente.', ['ERC_FA_2025']);
    }
    const dur = typeof def.duration === 'function' ? def.duration(this) : def.duration;
    this.busy = { actionId: id, label: def.label, start: this.t, end: this.t + dur, params };
    if (dur <= 0) this.completeBusy();
    this.emit();
    return { ok: true };
  }

  private completeBusy() {
    const b = this.busy;
    if (!b) return;
    this.busy = null;
    if (b.actionId === '__fetch') {
      this.completeFetch((b.params?.items as EquipmentId[]) ?? []);
      this.emit();
      return;
    }
    const def = ACTIONS[b.actionId];
    const arr = this.doneAt.get(b.actionId) ?? [];
    arr.push(this.t);
    this.doneAt.set(b.actionId, arr);
    const overridden = this.scenario.hooks?.onAction?.(this, b.actionId, b.params);
    if (!overridden) def.run({ sim: this, params: b.params });
    this.emit();
  }

  /** Torna al mezzo/PMA a prendere i presidi mancanti. */
  fetchEquipment(items: EquipmentId[]) {
    if (this.busy || !items.length || this.ended) return;
    const dur = this.fetchTime();
    this.fetching = items;
    this.busy = {
      actionId: '__fetch',
      label: `Recupero: ${items.map((i) => EQUIPMENT[i].name).join(', ')}`,
      start: this.t,
      end: this.t + dur,
      params: { items },
    };
    this.say('azione', `Torni a prendere: ${items.map((i) => EQUIPMENT[i].name).join(', ')} (circa ${Math.round(dur / 6) / 10} min).`);
    const missingEssential = items.filter((i) => this.scenario.loadout?.essential.includes(i));
    if (missingEssential.length) {
      this.penalize(
        'forgot_' + missingEssential.join('_'),
        'grave',
        `Presidio essenziale dimenticato: ${missingEssential.map((i) => EQUIPMENT[i].name).join(', ')}`,
        'Con questo codice di invio quel presidio va portato subito al paziente: tornare al mezzo costa minuti preziosi.',
      );
    }
    this.emit();
  }

  private completeFetch(items: EquipmentId[]) {
    items.forEach((i) => this.brought.add(i));
    this.fetching = [];
    this.say('evento', `Presidi disponibili: ${items.map((i) => EQUIPMENT[i].name).join(', ')}.`);
  }

  // ───────────────────────── ossigeno
  setO2(device: O2Device | null, flow: number) {
    if (!device || flow <= 0) {
      if (this.o2) this.say('azione', 'Sospendi l’ossigeno.');
      this.o2 = null;
      return;
    }
    this.o2 = { device, flow, since: this.t };
    const names: Record<O2Device, string> = { occhialini: 'occhialini nasali', maschera: 'maschera semplice', reservoir: 'maschera con reservoir' };
    this.say('azione', `Ossigeno con ${names[device]} a ${flow} L/min.`);
    if (device === 'reservoir' && flow < 10) {
      this.say('consiglio', 'Il reservoir resta sgonfio: con la maschera con reservoir servono 10–15 L/min.');
    }
    if (device === 'occhialini' && flow > 4) {
      this.say('consiglio', 'Con gli occhialini nasali oltre 4 L/min non aumenti l’ossigenazione e irriti le mucose.');
    }
    if (!this.flags.o2At) this.set('o2At', this.t);
  }

  // ───────────────────────── protocollo
  declareProtocol(id: ProtocolId) {
    const first = this.protocol === null;
    this.protocol = { id, t: this.t };
    this.say('azione', `Protocollo scelto: ${PROTOCOLS[id].name}.`);
    if (this.mode === 'addestramento' && first) {
      const pr = this.scenario.protocol;
      if (pr.correct.includes(id)) this.say('ok', 'Scelta coerente con il quadro clinico.');
      else if (pr.acceptable?.includes(id)) this.say('consiglio', 'Scelta accettabile, ma c’è un protocollo più specifico per questo quadro.');
      else this.say('errore', 'Questo protocollo non corrisponde al quadro: rivedi i reperti raccolti.');
    }
    this.emit();
  }

  // ───────────────────────── fine scenario
  end(reason: string) {
    if (this.ended) return;
    this.ended = { reason, t: this.t };
    this.phase = 'fine';
    this.busy = null;
    this.emit();
  }
}
