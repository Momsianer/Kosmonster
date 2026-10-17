import { BALANCING } from '../data/balancing';
import { getSpecies, type SpeciesId } from '../data/monsters';
import { catchChance, sphereCost } from '../core/formulas';
import type { GameState } from '../core/state';
import { nextRandom } from '../util/random';
import { addToTeam } from './monsters';

/**
 * Versucht automatisch, einen besiegten Gegner mit einer Fangsphäre zu fangen.
 * Verbraucht eine Sphäre, wenn vorhanden. Mit „Nur neue Arten“ werden bereits
 * gefangene Arten übersprungen. Gibt true bei Erfolg zurück.
 */
export function tryCatch(state: GameState, speciesId: SpeciesId): boolean {
  const species = getSpecies(speciesId);
  if (!species || state.spheres <= 0) return false;
  if (state.settings.catchOnlyNew && state.collection[speciesId]) return false;
  state.spheres -= 1;
  const chance = catchChance(BALANCING.rarity[species.rarity].catchChance);
  if (nextRandom(state) >= chance) return false;
  addCatch(state, speciesId);
  return true;
}

/** Trägt einen Fang in die Sammlung ein. Neue Arten kommen ins Team, wenn ein Platz frei ist. */
export function addCatch(state: GameState, speciesId: SpeciesId): void {
  const entry = state.collection[speciesId];
  if (entry) {
    entry.caught += 1;
  } else {
    state.collection[speciesId] = { caught: 1, level: 1 };
    addToTeam(state, speciesId);
  }
  state.lastCatch = { speciesId, time: state.playTime };
}

/** Kauft `amount` Standardsphären zum Preis der aktuellen Zone. */
export function buySpheres(state: GameState, amount: number): boolean {
  if (amount <= 0) return false;
  const cost = sphereCost(state.zone).mul(amount);
  if (state.energy.lt(cost)) return false;
  state.energy = state.energy.sub(cost);
  state.spheres += amount;
  return true;
}
