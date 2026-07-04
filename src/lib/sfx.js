// sfx.js — tiny synthesized sound design (no audio files).
// Lazily creates one AudioContext on first user gesture. Respects a mute flag.

let ctx = null;
let muted = JSON.parse(localStorage.getItem('nb.muted') || 'false');

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function isMuted() { return muted; }
export function setMuted(v) {
  muted = v;
  localStorage.setItem('nb.muted', JSON.stringify(v));
}

function tone(freq, dur, type = 'sine', gain = 0.15, slide = 0) {
  const c = ac();
  if (!c || muted) return;
  const t0 = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freq + slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noise(dur, gain = 0.08, hp = 1200) {
  const c = ac();
  if (!c || muted) return;
  const t0 = c.currentTime;
  const n = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, n, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filt = c.createBiquadFilter();
  filt.type = 'highpass';
  filt.frequency.value = hp;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filt).connect(g).connect(c.destination);
  src.start(t0);
}

export const sfx = {
  shutter() { noise(0.06, 0.12, 2000); tone(180, 0.05, 'square', 0.06, -60); },
  peel() { tone(520, 0.09, 'triangle', 0.06, 400); noise(0.05, 0.03, 3000); },
  pop() { tone(660, 0.07, 'sine', 0.08, 300); },
  chime() {
    [880, 1108, 1318].forEach((f, i) => setTimeout(() => tone(f, 0.4, 'sine', 0.1), i * 90));
  },
  boot() {
    [330, 440, 550, 740].forEach((f, i) => setTimeout(() => tone(f, 0.12, 'square', 0.05), i * 70));
  },
};
