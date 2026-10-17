import type { GameState } from '../core/state';
import { BALANCING } from '../data/balancing';

const stationUnlocked = (state: GameState) =>
  state.playTime >= BALANCING.station.unlockSeconds || Object.keys(state.modules).length > 0;

/**
 * Freischaltungen der Oberfläche in Reihenfolge (CLAUDE.md Abschnitt 17),
 * jede mit einmaligem Hinweis. Der Laden erscheint auch früher, wenn die Sphären ausgehen.
 */
export const UNLOCKS = {
  team: (state: GameState) => Object.keys(state.collection).length > 0,
  station: stationUnlocked,
  shop: (state: GameState) => stationUnlocked(state) || state.spheres <= 0,
} as const;

export type UnlockId = keyof typeof UNLOCKS;

export function isUnlocked(state: GameState, id: UnlockId): boolean {
  return UNLOCKS[id](state);
}

/** Erster freigeschalteter Hinweis, der noch nicht bestätigt wurde */
export function activeHint(state: GameState): UnlockId | null {
  for (const id of Object.keys(UNLOCKS) as UnlockId[]) {
    if (isUnlocked(state, id) && !state.hintsSeen.includes(id)) return id;
  }
  return null;
}

export function dismissHint(state: GameState, id: UnlockId): void {
  if (!state.hintsSeen.includes(id)) state.hintsSeen.push(id);
}
