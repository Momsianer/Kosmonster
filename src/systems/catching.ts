import { BALANCING } from '../data/balancing';
import { getSpecies, type Rarity, type SpeciesId } from '../data/monsters';
import { SPHERE_TYPES, type SphereType } from '../data/spheres';
import { catchChance, sphereCost } from '../core/formulas';
import type { GameState } from '../core/state';
import type { Decimal } from '../util/decimal';
import { nextRandom } from '../util/random';
import { addToTeam } from './monsters';
import { catchResearchBonus, sphereCostMult } from './research';

export function totalSpheres(state: GameState): number {
  return SPHERE_TYPES.reduce((sum, t) => sum + state.spheres[t], 0);
}

/**
 * Welche Sphäre für einen Fang benutzt wird: Seltene und bessere Arten bekommen die
 * stärkste vorhandene, gewöhnliche und ungewöhnliche nur Standardsphären,
 * damit teure Sphären nicht für häufige Arten verbraucht werden. null = keine passende da.
 */
export function chooseSphere(state: GameState, rarity: Rarity): SphereType | null {
  if (rarity === 'common' || rarity === 'uncommon') return state.spheres.standard > 0 ? 'standard' : null;
  const available = SPHERE_TYPES.filter((t) => state.spheres[t] > 0);
  return available[available.length - 1] ?? null;
}

/**
 * Versucht automatisch, einen besiegten Gegner mit einer Fangsphäre zu fangen.
 * Mit „Nur neue Arten“ werden bekannte Arten übersprungen, außer es ist eine neue
 * Polarstern Variante. Gibt true bei Erfolg zurück.
 */
export function tryCatch(state: GameState, speciesId: SpeciesId, shiny = false): boolean {
  const species = getSpecies(speciesId);
  if (!species) return false;
  const entry = state.collection[speciesId];
  if (state.settings.catchOnlyNew && entry && (!shiny || entry.shiny)) return false;
  const sphere = chooseSphere(state, species.rarity);
  if (!sphere) return false;
  state.spheres[sphere] -= 1;
  const chance = catchChance(
    BALANCING.rarity[species.rarity].catchChance,
    BALANCING.spheres[sphere].catchMult,
    catchResearchBonus(state),
  );
  if (nextRandom(state) >= chance) return false;
  addCatch(state, speciesId, shiny);
  return true;
}

/** Trägt einen Fang in die Sammlung ein. Neue Arten kommen ins Team, wenn ein Platz frei ist. */
export function addCatch(state: GameState, speciesId: SpeciesId, shiny = false): void {
  const entry = state.collection[speciesId];
  if (entry) {
    entry.caught += 1;
    if (shiny) entry.shiny = true;
  } else {
    state.collection[speciesId] = { caught: 1, level: 1, evolution: 0, shiny, bred: 0 };
    addToTeam(state, speciesId);
  }
  state.lastCatch = { speciesId, time: state.playTime, shiny };
}

/** Preis einer Sphäre in der aktuellen Zone nach Forschungsrabatt */
export function currentSphereCost(state: GameState, type: SphereType = 'standard'): Decimal {
  return sphereCost(state.zone).mul(sphereCostMult(state)).mul(BALANCING.spheres[type].costMult);
}

/** Kauft `amount` Sphären eines Typs zum Preis der aktuellen Zone. */
export function buySpheres(state: GameState, amount: number, type: SphereType = 'standard'): boolean {
  if (amount <= 0) return false;
  const cost = currentSphereCost(state, type).mul(amount);
  if (state.energy.lt(cost)) return false;
  state.energy = state.energy.sub(cost);
  state.spheres[type] += amount;
  return true;
}
