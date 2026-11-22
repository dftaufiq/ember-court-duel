// Ember Court — sounds, synthesized live with WebAudio.
// No audio files are shipped: every effect is a few oscillators shaped in
// code, so the game stays a handful of static files with no network request.

let context = null;
let muted = false;

export function setMuted(value) {
  muted = value;
}

export function isMuted() {
  return muted;
}

function audioContext() {
  if (!context) {
    const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContextClass) return null;
    context = new AudioContextClass();
  }
  if (context.state === 'suspended') void context.resume();
  return context;
}

function tone({ frequency, endFrequency, duration, type, gain, when }) {
  if (muted) return;
  const audio = audioContext();
  if (!audio) return;
  const start = audio.currentTime + (when ?? 0);
  const oscillator = audio.createOscillator();
  const envelope = audio.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
  envelope.gain.setValueAtTime(0, start);
  envelope.gain.linearRampToValueAtTime(gain, start + 0.01);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(envelope).connect(audio.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.05);
}

export function playClick() {
  tone({ frequency: 660, duration: 0.06, type: 'sine', gain: 0.12 });
}

export function playCardSound() {
  tone({ frequency: 320, endFrequency: 720, duration: 0.16, type: 'triangle', gain: 0.18 });
  tone({ frequency: 180, endFrequency: 90, duration: 0.12, type: 'sine', gain: 0.15, when: 0.02 });
}

export function playHit() {
  tone({ frequency: 140, endFrequency: 55, duration: 0.22, type: 'sawtooth', gain: 0.2 });
}

export function playShield() {
  tone({ frequency: 520, endFrequency: 780, duration: 0.18, type: 'sine', gain: 0.14 });
}

export function playDraw() {
  tone({ frequency: 880, endFrequency: 1170, duration: 0.08, type: 'sine', gain: 0.1 });
}

export function playTurn() {
  tone({ frequency: 440, duration: 0.1, type: 'triangle', gain: 0.12 });
  tone({ frequency: 660, duration: 0.12, type: 'triangle', gain: 0.12, when: 0.09 });
}

export function playWin() {
  [523, 659, 784, 1047, 1319].forEach((frequency, index) => {
    tone({ frequency, duration: 0.35, type: 'triangle', gain: 0.16, when: index * 0.11 });
  });
}

export function playLose() {
  [392, 330, 262, 196].forEach((frequency, index) => {
    tone({ frequency, duration: 0.4, type: 'sine', gain: 0.14, when: index * 0.14 });
  });
}
