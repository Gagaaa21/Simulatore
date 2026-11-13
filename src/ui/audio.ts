/**
 * Suoni sintetizzati con Web Audio (nessun file esterno) e voce del DAE con la sintesi vocale.
 * L'audio parte solo dopo un'interazione dell'utente.
 */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;
let voiceEnabled = true;
let volume = 0.6;

export function setAudioPrefs(p: { sound: boolean; voice: boolean; volume?: number }) {
  enabled = p.sound;
  voiceEnabled = p.voice;
  if (p.volume !== undefined) volume = p.volume;
  if (master) master.gain.value = enabled ? volume : 0;
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
