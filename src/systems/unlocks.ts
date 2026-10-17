import type { GameState } from '../core/state';

/** Freischaltungen der Oberfläche in Reihenfolge, jede mit einmaligem Hinweis */
export const UNLOCKS = {
  team: (state: GameState) => Object.keys(state.collection).length > 0,
  shop: (state: GameState) => Object.keys(state.collection).length > 0 || state.spheres <= 0,
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
