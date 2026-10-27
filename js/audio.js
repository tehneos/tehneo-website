// Procedural UI audio, synthesised with the Web Audio API.
// No sample files: every sound is shaped from oscillators and filtered noise,
// mixed through a soft compressor and a generated room reverb.

let ac = null, master, dry, verb, noise, on = false, lastTick = 0, lastBlip = 0, tone = null;
const listeners = new Set();
const SCALE = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22, 24];

function ensure() {
  if (ac) return true;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  ac = new AC();
  master = ac.createGain(); master.gain.value = 0;
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -22; comp.knee.value = 14; comp.ratio.value = 3; comp.release.value = 0.3;
  master.connect(comp); comp.connect(ac.destination);
  dry = ac.createGain(); dry.connect(master);
  verb = ac.createConvolver(); verb.buffer = impulse(2.8, 3.2);
  const wet = ac.createGain(); wet.gain.value = 0.3; verb.connect(wet); wet.connect(master);
  noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  ambience();
  return true;
}

function impulse(seconds, decay) {
  const len = Math.floor(ac.sampleRate * seconds);
  const buf = ac.createBuffer(2, len, ac.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}

function out(node, send = 0.4) {
  node.connect(dry);
  if (send) { const g = ac.createGain(); g.gain.value = send; node.connect(g); g.connect(verb); }
}

function env(param, t, attack, peak, decay) {
  param.cancelScheduledValues(t);
  param.setValueAtTime(0.0001, t);
  param.exponentialRampToValueAtTime(peak, t + attack);
  param.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

/** Low mains-like hum with a slowly breathing filter, plus a whisper of air. */
function ambience() {
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220; lp.Q.value = 0.8;
  const g = ac.createGain(); g.gain.value = 0.03;
  [[50, 'triangle', 1], [100.3, 'sine', 0.45], [150.6, 'sine', 0.12]].forEach(([f, type, amp]) => {
    const o = ac.createOscillator(); o.type = type; o.frequency.value = f;
    const og = ac.createGain(); og.gain.value = amp;
    o.connect(og); og.connect(lp); o.start();
  });
  const lfo = ac.createOscillator(); lfo.frequency.value = 0.06;
  const lg = ac.createGain(); lg.gain.value = 80;
  lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
  lp.connect(g); g.connect(master);

  const n = ac.createBufferSource(); n.buffer = noise; n.loop = true;
  const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1100; bp.Q.value = 0.4;
  const ng = ac.createGain(); ng.gain.value = 0.0035;
  n.connect(bp); bp.connect(ng); ng.connect(master); n.start();
}

function note(t, freq, peak = 0.05, decay = 0.6, send = 0.6) {
  const g = ac.createGain();
  const o1 = ac.createOscillator(); o1.type = 'sine'; o1.frequency.value = freq;
  const o2 = ac.createOscillator(); o2.type = 'triangle'; o2.frequency.value = freq * 2.001;
  const g2 = ac.createGain(); g2.gain.value = 0.18;
  o1.connect(g); o2.connect(g2); g2.connect(g);
  env(g.gain, t, 0.004, peak, decay);
  out(g, send);
  o1.start(t); o2.start(t); o1.stop(t + decay + 0.1); o2.stop(t + decay + 0.1);
}

function burst(t, freq, q, peak, dur, send = 0.15) {
  const s = ac.createBufferSource(); s.buffer = noise;
  const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = q;
  const g = ac.createGain();
  env(g.gain, t, 0.001, peak, dur);
  s.connect(bp); bp.connect(g); out(g, send);
  s.start(t, Math.random() * 0.8, dur + 0.05);
}

const live = () => on && ac;

export const sound = {
  /** Relay-click for hovers. */
  tick(vel = 1) {
    if (!live()) return;
    const t = ac.currentTime;
    if (t - lastTick < 0.035) return;
    lastTick = t;
    burst(t, 2800 + Math.random() * 2600, 7, 0.07 * vel, 0.025);
  },
  /** Pentatonic glass blip. */
  blip(step = (Math.random() * SCALE.length) | 0, vel = 1) {
    if (!live()) return;
    const t = ac.currentTime;
    if (t - lastBlip < 0.07) return;
    lastBlip = t;
    note(t, 220 * 2 ** (SCALE[step % SCALE.length] / 12) * 2, 0.035 * vel, 0.7);
  },
  /** Signal injection: falling sine + spark. */
  zap() {
    if (!live()) return;
    const t = ac.currentTime;
    const o = ac.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(1500, t); o.frequency.exponentialRampToValueAtTime(140, t + 0.22);
    const g = ac.createGain(); env(g.gain, t, 0.003, 0.06, 0.25);
    o.connect(g); out(g, 0.5); o.start(t); o.stop(t + 0.35);
    burst(t, 5200, 3, 0.05, 0.05);
  },
  chord() {
    if (!live()) return;
    const t = ac.currentTime;
    [0, 7, 12, 16, 19, 24].forEach((s, i) => note(t + i * 0.07, 220 * 2 ** (s / 12), 0.04, 1.6, 0.8));
  },
  buzz() {
    if (!live()) return;
    const t = ac.currentTime;
    const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 73;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520;
    const g = ac.createGain(); env(g.gain, t, 0.01, 0.05, 0.4);
    o.connect(lp); lp.connect(g); out(g, 0.2); o.start(t); o.stop(t + 0.5);
  },
  whoosh() {
    if (!live()) return;
    const t = ac.currentTime;
    const s = ac.createBufferSource(); s.buffer = noise;
    const lp = ac.createBiquadFilter(); lp.type = 'bandpass'; lp.Q.value = 1.2;
    lp.frequency.setValueAtTime(260, t); lp.frequency.exponentialRampToValueAtTime(3200, t + 0.35); lp.frequency.exponentialRampToValueAtTime(400, t + 0.9);
    const g = ac.createGain(); env(g.gain, t, 0.12, 0.09, 0.8);
    s.connect(lp); lp.connect(g); out(g, 0.6); s.start(t, 0, 1);
  },
  power() {
    if (!live()) return;
    const t = ac.currentTime;
    const o = ac.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(60, t); o.frequency.exponentialRampToValueAtTime(440, t + 0.7);
    const g = ac.createGain(); env(g.gain, t, 0.3, 0.05, 0.6);
    o.connect(g); out(g, 0.5); o.start(t); o.stop(t + 1.1);
    setTimeout(() => sound.chord(), 650);
  },
  /** Continuous theremin voice for dragging. */
  toneStart() {
    if (!live() || tone) return;
    const t = ac.currentTime;
    const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = 330;
    const vib = ac.createOscillator(); vib.frequency.value = 5.5;
    const vg = ac.createGain(); vg.gain.value = 4; vib.connect(vg); vg.connect(o.frequency);
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400;
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.035, t + 0.08);
    o.connect(lp); lp.connect(g); out(g, 0.5); o.start(t); vib.start(t);
    tone = { o, vib, g };
  },
  toneSet(freq) {
    if (tone) tone.o.frequency.setTargetAtTime(freq, ac.currentTime, 0.03);
  },
  toneStop() {
    if (!tone) return;
    const t = ac.currentTime, { o, vib, g } = tone;
    g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(0.0001, t, 0.06);
    o.stop(t + 0.4); vib.stop(t + 0.4);
    tone = null;
  },
};

export function setSound(value) {
  if (!ensure()) return;
  on = value;
  ac.resume();
  master.gain.setTargetAtTime(on ? 1 : 0, ac.currentTime, 0.25);
  if (!on) sound.toneStop();
  listeners.forEach((fn) => fn(on));
}
export const soundOn = () => on;
export const onSound = (fn) => listeners.add(fn);
