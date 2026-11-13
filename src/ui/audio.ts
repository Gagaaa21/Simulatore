/**
 * Suoni sintetizzati con Web Audio (nessun file esterno) e voce del DAE con la sintesi vocale.
 * L'audio parte solo dopo un'interazione dell'utente.
 */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;
let voiceEnabled = true;
let volume = 0.6;

let ambienceOn = true;
export function setAudioPrefs(p: { sound: boolean; voice: boolean; volume?: number; ambience?: boolean }) {
  enabled = p.sound;
  voiceEnabled = p.voice;
  if (p.volume !== undefined) volume = p.volume;
  if (p.ambience !== undefined) ambienceOn = p.ambience;
  if (master) master.gain.value = enabled ? volume : 0;
  if (ambGain && ctx) ambGain.gain.setTargetAtTime(ambienceOn && enabled ? 0.5 : 0, ctx.currentTime, 0.3);
  if (!voiceEnabled) stopVoice();
}

export function unlockAudio() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = enabled ? volume : 0;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') void ctx.resume();
    resumeAmbience();
  } catch {
    ctx = null;
  }
}

function tone(freq: number, dur: number, opts: { type?: OscillatorType; gain?: number; delay?: number; slide?: number } = {}) {
  if (!ctx || !master || !enabled) return;
  const t0 = ctx.currentTime + (opts.delay ?? 0);
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = opts.type ?? 'sine';
  o.frequency.setValueAtTime(freq, t0);
  if (opts.slide) o.frequency.linearRampToValueAtTime(opts.slide, t0 + dur);
  const peak = opts.gain ?? 0.18;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g);
  g.connect(master);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

function noise(dur: number, gain = 0.08, delay = 0) {
  if (!ctx || !master || !enabled) return;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = 1800;
  f.Q.value = 0.8;
  const g = ctx.createGain();
  g.gain.value = gain;
  src.connect(f);
  f.connect(g);
  g.connect(master);
  src.start(ctx.currentTime + delay);
}

/** Bip del saturimetro: il tono scende con la saturazione, come nei monitor reali. */
export function pulseBeep(spo2: number) {
  const f = 440 + Math.max(0, Math.min(100, spo2) - 60) * 11;
  tone(f, 0.09, { type: 'sine', gain: 0.07 });
}

export function sfx(name: string) {
  switch (name) {
    case 'bip':
      tone(1046, 0.12, { gain: 0.12 });
      tone(1318, 0.14, { gain: 0.1, delay: 0.13 });
      break;
    case 'click':
      tone(1800, 0.03, { type: 'square', gain: 0.04 });
      break;
    case 'metronomo':
      tone(1500, 0.04, { type: 'square', gain: 0.06 });
      break;
    case 'radio':
      noise(0.18, 0.06);
      tone(2200, 0.06, { type: 'square', gain: 0.03, delay: 0.16 });
      break;
    case 'errore':
      tone(330, 0.16, { type: 'sawtooth', gain: 0.06 });
      tone(247, 0.22, { type: 'sawtooth', gain: 0.06, delay: 0.15 });
      break;
    case 'ok':
      tone(784, 0.1, { gain: 0.08 });
      tone(1046, 0.16, { gain: 0.08, delay: 0.1 });
      break;
    case 'allarme':
      for (let i = 0; i < 3; i++) tone(960, 0.14, { type: 'square', gain: 0.05, delay: i * 0.22 });
      break;
    case 'peggiora':
      // due toni discendenti: il paziente sta peggiorando
      tone(740, 0.16, { type: 'triangle', gain: 0.09 });
      tone(523, 0.24, { type: 'triangle', gain: 0.09, delay: 0.18 });
      break;
    case 'migliora':
      tone(587, 0.12, { type: 'triangle', gain: 0.07 });
      tone(880, 0.18, { type: 'triangle', gain: 0.07, delay: 0.13 });
      break;
    case 'carica':
      tone(300, 4.5, { type: 'sine', gain: 0.05, slide: 2600 });
      break;
    case 'pronto':
      for (let i = 0; i < 4; i++) tone(1400, 0.12, { type: 'square', gain: 0.05, delay: i * 0.3 });
      break;
    case 'shock':
      noise(0.25, 0.25);
      tone(90, 0.3, { type: 'sawtooth', gain: 0.2 });
      break;
    case 'chiamata':
      // doppio tono del cercapersone di bordo
      for (let i = 0; i < 3; i++) {
        tone(1175, 0.16, { type: 'square', gain: 0.045, delay: i * 0.42 });
        tone(880, 0.16, { type: 'square', gain: 0.045, delay: i * 0.42 + 0.18 });
      }
      break;
    case 'sirena':
      for (let i = 0; i < 2; i++) {
        tone(660, 0.45, { type: 'triangle', gain: 0.05, delay: i * 0.9 });
        tone(880, 0.45, { type: 'triangle', gain: 0.05, delay: i * 0.9 + 0.45 });
      }
      break;
    default:
      break;
  }
}

let itVoice: SpeechSynthesisVoice | null = null;
function pickVoice() {
  try {
    const vs = window.speechSynthesis?.getVoices() ?? [];
    itVoice = vs.find((v) => v.lang?.toLowerCase().startsWith('it')) ?? null;
  } catch {
    itVoice = null;
  }
}
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  pickVoice();
  try {
    window.speechSynthesis.onvoiceschanged = pickVoice;
  } catch {
    /* ignora */
  }
}

/** Voce sintetica del DAE (se disponibile una voce italiana). */
export function speak(text: string) {
  if (!voiceEnabled || !enabled) return;
  try {
    const s = window.speechSynthesis;
    if (!s) return;
    s.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'it-IT';
    if (itVoice) u.voice = itVoice;
    u.rate = 1.02;
    u.pitch = 0.9;
    u.volume = volume;
    s.speak(u);
  } catch {
    /* sintesi vocale non disponibile */
  }
}

export function stopVoice() {
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* ignora */
  }
}

// ───────────────────────── ambienti sonori sintetizzati
let ambGain: GainNode | null = null;
let ambNodes: AudioScheduledSourceNode[] = [];
let ambTimer: number | null = null;
let ambWanted: string | null = null;

function noiseBuffer(seconds: number, brown: boolean): AudioBuffer | null {
  if (!ctx) return null;
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (brown) {
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    } else d[i] = w;
  }
  return buf;
}

function loopNoise(brown: boolean, type: BiquadFilterType, freq: number, q: number, gain: number, lfoRate = 0, lfoDepth = 0) {
  if (!ctx || !ambGain) return;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(4, brown);
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.value = gain;
  src.connect(f);
  f.connect(g);
  g.connect(ambGain);
  if (lfoRate > 0) {
    const lfo = ctx.createOscillator();
    const lg = ctx.createGain();
    lfo.frequency.value = lfoRate;
    lg.gain.value = lfoDepth;
    lfo.connect(lg);
    lg.connect(g.gain);
    lfo.start();
    ambNodes.push(lfo);
  }
  src.start();
  ambNodes.push(src);
}

/** Sottofondo del luogo: folla e bassi ai concerti, traffico in strada, televisione in casa… */
export function startAmbience(setting: string) {
  ambWanted = setting;
  if (!ctx || !master) return;
  stopAmbience(false);
  ambGain = ctx.createGain();
  ambGain.gain.value = 0;
  ambGain.connect(master);
  ambGain.gain.setTargetAtTime(ambienceOn && enabled ? 0.5 : 0, ctx.currentTime, 1.2);
  switch (setting) {
    case 'concerto':
    case 'stadio':
      loopNoise(false, 'bandpass', 900, 0.6, 0.05, 0.13, 0.02);
      loopNoise(true, 'lowpass', 220, 0.7, 0.18);
      ambTimer = window.setInterval(() => {
        if (!ctx || !ambGain) return;
        const t = ctx.currentTime;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.frequency.setValueAtTime(95, t);
        o.frequency.exponentialRampToValueAtTime(45, t + 0.18);
        g.gain.setValueAtTime(0.16, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
        o.connect(g);
        g.connect(ambGain);
        o.start(t);
        o.stop(t + 0.25);
      }, 500);
      break;
    case 'festival':
      loopNoise(false, 'bandpass', 1100, 0.5, 0.04, 0.09, 0.015);
      loopNoise(true, 'lowpass', 300, 0.7, 0.1);
      break;
    case 'strada':
    case 'parcheggio':
      loopNoise(true, 'lowpass', 160, 0.5, 0.35, 0.05, 0.15);
      loopNoise(false, 'highpass', 4000, 0.3, 0.006);
      break;
    case 'cantiere':
      loopNoise(true, 'lowpass', 120, 0.9, 0.25);
      loopNoise(false, 'bandpass', 2400, 4, 0.008, 0.3, 0.004);
      break;
    case 'lago':
      loopNoise(false, 'lowpass', 600, 0.4, 0.06, 0.12, 0.05);
      break;
    case 'campo':
      // vento sull'erba e voci lontane dalla tribuna
      loopNoise(false, 'lowpass', 500, 0.4, 0.05, 0.1, 0.03);
      loopNoise(false, 'bandpass', 900, 0.9, 0.012, 0.25, 0.006);
      break;
    case 'ristorante':
    case 'supermercato':
      loopNoise(false, 'bandpass', 700, 0.8, 0.03, 0.2, 0.01);
      loopNoise(true, 'lowpass', 200, 0.5, 0.08);
      break;
    default:
      // casa: ronzio della televisione e del frigorifero
      loopNoise(false, 'bandpass', 1800, 1.2, 0.012, 0.4, 0.006);
      loopNoise(true, 'lowpass', 90, 0.8, 0.12);
  }
}

export function stopAmbience(forget = true) {
  if (forget) ambWanted = null;
  if (ambTimer !== null) window.clearInterval(ambTimer);
  ambTimer = null;
  const g = ambGain;
  const nodes = ambNodes;
  ambNodes = [];
  ambGain = null;
  if (g && ctx) {
    g.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
    window.setTimeout(() => {
      nodes.forEach((n) => {
        try {
          n.stop();
        } catch {
          /* già fermo */
        }
      });
      g.disconnect();
    }, 900);
  }
}

/** Se l'audio viene sbloccato dopo l'avvio della missione, fa partire il sottofondo richiesto. */
export function resumeAmbience() {
  if (ambWanted && !ambGain) startAmbience(ambWanted);
}
