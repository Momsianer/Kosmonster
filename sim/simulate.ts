/**
 * Simulator für das Balancing. Spielt mit der echten Spiellogik und einem Bot
 * und misst, wann die Pacingziele aus CLAUDE.md Abschnitt 16 erreicht werden.
 */
import { advance } from '../src/core/loop';
import { createInitialState, type GameState } from '../src/core/state';
import { clickEnemy } from '../src/systems/combat';
import { isUnlocked } from '../src/systems/unlocks';
import { decide } from './policy';

export interface Profile {
  name: string;
  /** Länge einer Sitzung online in Sekunden */
  onlineSeconds: number;
  /** Pause zwischen zwei Sitzungen in Sekunden */
  offlineSeconds: number;
  clicksPerSecond: number;
  /** Abstand zwischen zwei Entscheidungen online in Sekunden */
  decisionSeconds: number;
}

export const PROFILES: Record<'active' | 'idle', Profile> = {
  // ca. 30 % der Zeit online
  active: { name: 'aktiv', onlineSeconds: 30 * 60, offlineSeconds: 70 * 60, clicksPerSecond: 5, decisionSeconds: 2 },
  // ca. 8 % der Zeit online, wenig Klicks
  idle: { name: 'überwiegend idle', onlineSeconds: 10 * 60, offlineSeconds: 110 * 60, clicksPerSecond: 1, decisionSeconds: 5 },
};

export const MILESTONES = [
  { id: 'firstCatch', label: 'Erstes Monster gefangen', target: 60, reached: (s: GameState) => Object.keys(s.collection).length > 0 },
  { id: 'station', label: 'Raumstation frei', target: 5 * 60, reached: (s: GameState) => isUnlocked(s, 'station') },
  { id: 'firstBoss', label: 'Erster Boss', target: 10 * 60, reached: (s: GameState) => s.highestZone > 5 },
  ...[10, 20, 30, 40, 50, 60].map((z) => ({
    id: `zone${z}`,
    label: `Zone ${z} erreicht`,
    target: z === 60 ? 3 * 3600 : null,
    reached: (s: GameState) => s.highestZone >= z,
  })),
] as const;

export interface SimResult {
  profile: string;
  /** Erreichte Zeit je Meilenstein in Sekunden, null = nicht erreicht */
  times: Record<string, number | null>;
  finalZone: number;
  simulatedSeconds: number;
}

const STEP_SECONDS = 0.2;

export function simulate(profile: Profile, maxSeconds: number, seed = 1): SimResult {
  const state = createInitialState(0, seed);
  const times: Record<string, number | null> = Object.fromEntries(MILESTONES.map((m) => [m.id, null]));
  const record = (t: number) => {
    for (const m of MILESTONES) if (times[m.id] === null && m.reached(state)) times[m.id] = t;
  };

  const options = { clicksPerSecond: profile.clicksPerSecond };
  let t = 0;
  let clickBudget = 0;
  let nextDecision = 0;
  const done = () => t >= maxSeconds || times.zone60 !== null;

  while (!done()) {
    // Sitzung online
    const sessionEnd = Math.min(t + profile.onlineSeconds, maxSeconds);
    while (t < sessionEnd && !done()) {
      clickBudget += profile.clicksPerSecond * STEP_SECONDS;
      while (clickBudget >= 1) {
        clickEnemy(state);
        clickBudget -= 1;
      }
      t += STEP_SECONDS;
      advance(state, t * 1000);
      if (t >= nextDecision) {
        decide(state, options);
        nextDecision = t + profile.decisionSeconds;
      }
      record(t);
    }
    if (done()) break;
    // Pause offline: die Spiellogik holt die Zeit beim nächsten Laden nach
    t = Math.min(t + profile.offlineSeconds, maxSeconds);
    advance(state, t * 1000);
    record(t);
    nextDecision = t;
  }

  return { profile: profile.name, times, finalZone: state.highestZone, simulatedSeconds: t };
}

export function formatTime(seconds: number | null): string {
  if (seconds === null) return 'nicht erreicht';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  if (h > 0) return `${h} Std. ${m} Min.`;
  if (m > 0) return `${m} Min. ${s} Sek.`;
  return `${s} Sek.`;
}
