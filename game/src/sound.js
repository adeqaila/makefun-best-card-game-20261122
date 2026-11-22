// Sound, synthesised live with WebAudio — no audio files, no network.
// A soft pluck for playing a card, a thud for an attack, a chime for a win.
let context = null;

function audio() {
  if (context === null) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    context = new AudioContext();
  }
  if (context.state === 'suspended') void context.resume();
  return context;
}

function tone(frequency, duration, type, gain, when) {
  const ctx = audio();
  if (!ctx) return;
  const start = ctx.currentTime + (when || 0);
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(frequency, start);
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain || 0.12, start + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

export const sound = {
  /** Unlock the audio context on the first user gesture. */
  unlock() {
    audio();
  },
  playCard() {
    tone(520, 0.12, 'triangle', 0.1);
    tone(780, 0.14, 'triangle', 0.08, 0.05);
  },
  attack() {
    tone(160, 0.16, 'square', 0.08);
    tone(90, 0.2, 'sawtooth', 0.06, 0.02);
  },
  damage() {
    tone(220, 0.18, 'sawtooth', 0.07);
  },
  heal() {
    tone(660, 0.2, 'sine', 0.08);
    tone(880, 0.24, 'sine', 0.06, 0.08);
  },
  turn() {
    tone(440, 0.1, 'triangle', 0.07);
  },
  win() {
    [523, 659, 784, 1047].forEach((freq, i) => tone(freq, 0.3, 'triangle', 0.1, i * 0.12));
  },
  lose() {
    [392, 330, 262, 196].forEach((freq, i) => tone(freq, 0.3, 'triangle', 0.08, i * 0.14));
  },
};
