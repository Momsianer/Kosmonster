/**
 * Soundeffekte im Chiptunestil, erzeugt mit WebAudio. Es gibt keine Audiodateien.
 * Der AudioContext entsteht erst bei der ersten Wiedergabe (nach einer Eingabe der Person).
 */

export const SOUND_IDS = ['hit', 'defeat', 'catch', 'shiny', 'bossWin', 'bossFail', 'unlock', 'stage', 'prestige'] as const;
export type SoundId = (typeof SOUND_IDS)[number];

interface Note {
  /** Frequenz in Hz */
  freq: number;
  /** Start in Sekunden nach Beginn des Effekts */
  at: number;
  /** Dauer in Sekunden */
  dur: number;
  type?: OscillatorType;
  /** Zielfrequenz für ein Gleiten während der Note */
  slide?: number;
  /** Relative Lautstärke */
  gain?: number;
}

/** Tonfolgen je Effekt */
export const SOUNDS: Record<SoundId, Note[]> = {
  hit: [{ freq: 220, at: 0, dur: 0.05, type: 'square', slide: 110, gain: 0.35 }],
  defeat: [{ freq: 660, at: 0, dur: 0.06, type: 'square', slide: 990, gain: 0.25 }],
  catch: [
    { freq: 523, at: 0, dur: 0.08, type: 'square' },
    { freq: 659, at: 0.08, dur: 0.08, type: 'square' },
    { freq: 784, at: 0.16, dur: 0.14, type: 'square' },
  ],
  shiny: [
    { freq: 784, at: 0, dur: 0.07, type: 'triangle' },
    { freq: 988, at: 0.07, dur: 0.07, type: 'triangle' },
    { freq: 1175, at: 0.14, dur: 0.07, type: 'triangle' },
    { freq: 1568, at: 0.21, dur: 0.25, type: 'triangle' },
  ],
  bossWin: [
    { freq: 392, at: 0, dur: 0.1, type: 'square' },
    { freq: 523, at: 0.1, dur: 0.1, type: 'square' },
    { freq: 659, at: 0.2, dur: 0.1, type: 'square' },
    { freq: 784, at: 0.3, dur: 0.25, type: 'square' },
  ],
  bossFail: [
    { freq: 330, at: 0, dur: 0.15, type: 'sawtooth', gain: 0.6 },
    { freq: 247, at: 0.15, dur: 0.3, type: 'sawtooth', slide: 165, gain: 0.6 },
  ],
  unlock: [
    { freq: 659, at: 0, dur: 0.08, type: 'triangle' },
    { freq: 880, at: 0.08, dur: 0.2, type: 'triangle' },
  ],
  stage: [
    { freq: 440, at: 0, dur: 0.06, type: 'square' },
    { freq: 880, at: 0.06, dur: 0.12, type: 'square' },
  ],
  prestige: [
    { freq: 262, at: 0, dur: 0.6, type: 'triangle', slide: 1047 },
    { freq: 523, at: 0.2, dur: 0.15, type: 'square', gain: 0.5 },
    { freq: 659, at: 0.35, dur: 0.15, type: 'square', gain: 0.5 },
    { freq: 784, at: 0.5, dur: 0.15, type: 'square', gain: 0.5 },
    { freq: 1047, at: 0.65, dur: 0.4, type: 'square', gain: 0.5 },
  ],
};

/** Mindestabstand zwischen zwei gleichen Effekten in Millisekunden */
const MIN_GAP_MS = 70;
/** Grundlautstärke, damit volle Lautstärke nicht übersteuert */
const MASTER = 0.15;

let context: AudioContext | null = null;
const lastPlayed = new Map<SoundId, number>();

function audio(): AudioContext | null {
  if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') return null;
  context ??= new window.AudioContext();
  if (context.state === 'suspended') void context.resume();
  return context;
}

/** Spielt einen Effekt mit Lautstärke 0 bis 1 */
export function playSound(id: SoundId, volume: number): void {
  if (volume <= 0) return;
  const now = Date.now();
  if (now - (lastPlayed.get(id) ?? 0) < MIN_GAP_MS) return;
  lastPlayed.set(id, now);
  const ctx = audio();
  if (!ctx) return;
  const start = ctx.currentTime;
  for (const note of SOUNDS[id]) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t0 = start + note.at;
    const t1 = t0 + note.dur;
    osc.type = note.type ?? 'square';
    osc.frequency.setValueAtTime(note.freq, t0);
    if (note.slide) osc.frequency.exponentialRampToValueAtTime(note.slide, t1);
    const peak = MASTER * volume * (note.gain ?? 1);
    gain.gain.setValueAtTime(peak, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t1);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t1 + 0.02);
  }
}
