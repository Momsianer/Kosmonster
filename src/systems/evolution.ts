import { BALANCING } from '../data/balancing';
import { getSpecies, type SpeciesId } from '../data/monsters';
import type { GameState } from '../core/state';
import { powInt, type Decimal } from '../util/decimal';

/** Sternenstaubkosten für die nächste Stufe: costs[stufe] * costGrowthPerSpecies^(nummer − 1) */
export function evolutionCost(speciesNumber: number, stage: number): Decimal | null {
  const base = BALANCING.evolution.costs[stage];
  if (base === undefined) return null;
  return powInt(BALANCING.evolution.costGrowthPerSpecies, speciesNumber - 1).mul(base);
}

/** Mindestlevel für die nächste Stufe */
export function evolutionLevel(stage: number): number | null {
  return BALANCING.evolution.levelRequirements[stage] ?? null;
}

/** Multiplikator auf basisDPS: dpsMult^stufe */
export function evolutionMult(stage: number): Decimal {
  return powInt(BALANCING.evolution.dpsMult, stage);
}

/** Die Art könnte sich weiterentwickeln (Stufe noch nicht ausgeschöpft) */
export function hasNextEvolution(state: GameState, id: SpeciesId): boolean {
  const species = getSpecies(id);
  const entry = state.collection[id];
  return !!species && !!entry && entry.evolution < species.evolutions;
}

export function canEvolve(state: GameState, id: SpeciesId): boolean {
  const species = getSpecies(id);
  const entry = state.collection[id];
  if (!species || !entry || !hasNextEvolution(state, id)) return false;
  const level = evolutionLevel(entry.evolution);
  const cost = evolutionCost(species.number, entry.evolution);
  return level !== null && cost !== null && entry.level >= level && state.stardust.gte(cost);
}

export function evolve(state: GameState, id: SpeciesId): boolean {
  if (!canEvolve(state, id)) return false;
  const species = getSpecies(id)!;
  const entry = state.collection[id]!;
  state.stardust = state.stardust.sub(evolutionCost(species.number, entry.evolution)!);
  entry.evolution += 1;
  return true;
}
