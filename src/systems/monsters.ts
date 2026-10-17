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
import { evolutionMult } from './evolution';
import { stardustBonus } from './prestige';
import { productionToDpsShare, teamDpsResearchMult, teamSlotsFor } from './research';
import { totalProduction } from './station';

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

/** globalMult: passiver Sternenstaubbonus und Forschung „Teamstärke“ */
export function globalDpsMult(state: GameState): Decimal {
  return stardustBonus(state).mul(teamDpsResearchMult(state));
}

/** DPS einer gefangenen Art im aktuellen Zustand */
export function monsterDps(state: GameState, speciesId: SpeciesId): Decimal {
  const species = getSpecies(speciesId);
  const entry = state.collection[speciesId];
  if (!species || !entry) return D(0);
  return monsterDpsBase(
    evolutionMult(entry.evolution).mul(species.baseDps),
    entry.level,
    BALANCING.rarity[species.rarity].dpsMult,
    typeMult(speciesId, entry.level, state.zone),
  ).mul(globalDpsMult(state));
}

/** teamDPS = Summe aller Monster im Team, dazu der umgewandelte Teil der Produktion */
export function teamDps(state: GameState): Decimal {
  const monsters = state.team.reduce((sum, id) => sum.add(monsterDps(state, id)), D(0));
  const share = productionToDpsShare(state);
  return share > 0 ? monsters.add(totalProduction(state).mul(share)) : monsters;
}

export function teamSlots(state: GameState): number {
  return teamSlotsFor(state.research);
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
  if (state.team.length >= teamSlots(state)) return false;
  state.team.push(speciesId);
  return true;
}

export function removeFromTeam(state: GameState, speciesId: SpeciesId): boolean {
  const index = state.team.indexOf(speciesId);
  if (index < 0) return false;
  state.team.splice(index, 1);
  return true;
}
