import { BALANCING } from '../data/balancing';
import { getSpecies, type SpeciesId } from '../data/monsters';
import {
  bulkCost,
  fibonacciMult,
  maxAffordable,
  monsterDpsBase,
  primeZoneMult,
} from '../core/formulas';
import type { GameState } from '../core/state';
import { D, type Decimal } from '../util/decimal';

/** Typmultiplikator einer Art in der aktuellen Lage */
export function typeMult(speciesId: SpeciesId, level: number, zone: number): Decimal {
  const species = getSpecies(speciesId);
  if (!species) return D(1);
  switch (species.type) {
    case 'prim':
      return primeZoneMult(zone);
    case 'fibonacci':
      return fibonacciMult(level);
  }
}

/** DPS einer gefangenen Art im aktuellen Zustand */
export function monsterDps(state: GameState, speciesId: SpeciesId): Decimal {
  const species = getSpecies(speciesId);
  const entry = state.collection[speciesId];
  if (!species || !entry) return D(0);
  return monsterDpsBase(
    species.baseDps,
    entry.level,
    BALANCING.rarity[species.rarity].dpsMult,
    typeMult(speciesId, entry.level, state.zone),
  );
}

/** teamDPS = Summe aller Monster im Team */
export function teamDps(state: GameState): Decimal {
  return state.team.reduce((sum, id) => sum.add(monsterDps(state, id)), D(0));
}

export function teamSlots(): number {
  return BALANCING.monster.teamSlots;
}

/** Kauft bis zu `amount` Level, 'max' = so viele wie bezahlbar. Gibt die Zahl gekaufter Level zurück. */
export function levelUp(state: GameState, speciesId: SpeciesId, amount: number | 'max'): number {
  const species = getSpecies(speciesId);
  const entry = state.collection[speciesId];
  if (!species || !entry) return 0;
  const r = BALANCING.monster.levelCostGrowth;
  const affordable = maxAffordable(state.energy, species.baseCost, r, entry.level);
  const n = amount === 'max' ? affordable : Math.min(amount, affordable);
  if (n <= 0) return 0;
  state.energy = state.energy.sub(bulkCost(species.baseCost, r, entry.level, n)).max(0);
  entry.level += n;
  return n;
}

/** Kosten für `amount` Level, bei 'max' für so viele wie bezahlbar (mindestens 1) */
export function levelUpCost(
  state: GameState,
  speciesId: SpeciesId,
  amount: number | 'max',
): { levels: number; cost: Decimal } {
  const species = getSpecies(speciesId);
  const entry = state.collection[speciesId];
  if (!species || !entry) return { levels: 0, cost: D(0) };
  const r = BALANCING.monster.levelCostGrowth;
  const levels =
    amount === 'max' ? Math.max(1, maxAffordable(state.energy, species.baseCost, r, entry.level)) : amount;
  return { levels, cost: bulkCost(species.baseCost, r, entry.level, levels) };
}

export function addToTeam(state: GameState, speciesId: SpeciesId): boolean {
  if (!state.collection[speciesId]) return false;
  if (state.team.includes(speciesId)) return false;
  if (state.team.length >= teamSlots()) return false;
  state.team.push(speciesId);
  return true;
}

export function removeFromTeam(state: GameState, speciesId: SpeciesId): boolean {
  const index = state.team.indexOf(speciesId);
  if (index < 0) return false;
  state.team.splice(index, 1);
  return true;
}
