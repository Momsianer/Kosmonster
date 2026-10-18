import type { GameState } from '../core/state';
import { BALANCING } from '../data/balancing';
import { totalSpheres } from './catching';
import { theoremAvailable } from './theorem';

const stationUnlocked = (state: GameState) =>
  state.playTime >= BALANCING.station.unlockSeconds || Object.keys(state.modules).length > 0;

/**
 * Freischaltungen der Oberfläche in Reihenfolge (CLAUDE.md Abschnitt 17),
 * jede mit einmaligem Hinweis. Der Laden erscheint auch früher, wenn die Sphären ausgehen.
 */
export const UNLOCKS = {
  team: (state: GameState) => Object.keys(state.collection).length > 0,
  station: stationUnlocked,
  shop: (state: GameState) => stationUnlocked(state) || totalSpheres(state) <= 0,
  planet: (state: GameState) => state.highestZone > BALANCING.world.zonesPerSystem,
  supernova: (state: GameState) => state.highestZone >= BALANCING.supernova.minZone || state.supernovas > 0,
  research: (state: GameState) => state.supernovas > 0,
  evolution: (state: GameState) => state.supernovas > 0,
  stars: (state: GameState) =>
    state.supernovas > 0 || Object.values(state.collection).some((e) => e && e.caught >= 2),
  shiny: (state: GameState) => Object.values(state.collection).some((e) => e?.shiny),
  blackHole: (state: GameState) =>
    state.blackHoles > 0 || state.stardustCycle.gte(BALANCING.blackHole.minStardust),
  automation: (state: GameState) => state.blackHoles > 0,
  breeding: (state: GameState) => state.blackHoles > 0,
  story: (state: GameState) => state.storySeen.length > 0,
  bigBang: (state: GameState) =>
    state.bigBangs > 0 || state.cycleEnergy.gte(BALANCING.bigBang.infinityEnergy),
  challenges: (state: GameState) => state.bigBangs > 0,
  constellations: (state: GameState) => state.bigBangs > 0,
  theorem: (state: GameState) => theoremAvailable(state) && !state.theoremDefeated,
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
