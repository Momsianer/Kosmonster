import { BALANCING } from '../data/balancing';
import { getSpecies, type Rarity, type SpeciesId } from '../data/monsters';
import { SPHERE_TYPES, type SphereType } from '../data/spheres';
import { bulkCost, catchChance, maxAffordable, spherePrice, spherePriceDecay } from '../core/formulas';
import type { GameState } from '../core/state';
import { D, type Decimal } from '../util/decimal';
import { nextRandom } from '../util/random';
import { addToTeam } from './monsters';
import { catchResearchBonus, researchLevel, sphereCostMult } from './research';
import { goldbachCatchBonus } from './endgame';

/** Fangbonus aus Forschung und Goldbach Arena */
export function catchBonus(state: GameState): number {
  return catchResearchBonus(state) + goldbachCatchBonus(state);
}

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
    catchBonus(state),
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

/** Standard, Orbit und Nebel gibt es von Anfang an, Singularität erst mit der Forschung */
export function isSphereUnlocked(state: GameState, type: SphereType): boolean {
  return type !== 'singularitaet' || researchLevel(state.research, 'singularitaet') > 0;
}

/** Grundpreis eines Typs nach Forschungsrabatt */
function discountedBase(state: GameState, type: SphereType): Decimal {
  return D(BALANCING.spheres[type].basePrice).mul(sphereCostMult(state));
}

/** Preis der nächsten Sphäre eines Typs (Grundpreis mit Aufschlag aus den letzten Käufen) */
export function currentSphereCost(state: GameState, type: SphereType = 'standard'): Decimal {
  return spherePrice(discountedBase(state, type), state.spherePressure[type]);
}

/** Kosten für `amount` Sphären eines Typs, jede weitere teurer als die vorige */
export function sphereBuyCost(state: GameState, amount: number, type: SphereType = 'standard'): Decimal {
  return bulkCost(discountedBase(state, type), BALANCING.catching.priceGrowth, state.spherePressure[type], amount);
}

/** Wie viele Sphären eines Typs gerade bezahlbar sind */
export function affordableSpheres(state: GameState, type: SphereType = 'standard'): number {
  return maxAffordable(state.energy, discountedBase(state, type), BALANCING.catching.priceGrowth, state.spherePressure[type]);
}

/** Kauft `amount` Sphären eines Typs. Jeder Kauf erhöht den Aufschlag um 1. */
export function buySpheres(state: GameState, amount: number, type: SphereType = 'standard'): boolean {
  if (amount <= 0 || !isSphereUnlocked(state, type)) return false;
  const cost = sphereBuyCost(state, amount, type);
  if (state.energy.lt(cost)) return false;
  state.energy = state.energy.sub(cost);
  state.spheres[type] += amount;
  state.spherePressure[type] += amount;
  return true;
}

/** Ein besiegter Gegner baut den Aufschlag aller Sphärentypen ab, in hohen Zonen schneller */
export function relaxSpherePrices(state: GameState, zone: number): void {
  const decay = spherePriceDecay(zone);
  for (const type of SPHERE_TYPES) state.spherePressure[type] = Math.max(0, state.spherePressure[type] - decay);
}
