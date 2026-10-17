import { BALANCING } from '../data/balancing';
import { getSpecies, type SpeciesId } from '../data/monsters';
import {
  bulkCost,
  enemyKind,
  eulerMult,
  fibonacciMult,
  fractalMult,
  infinityMult,
  maxAffordable,
  monsterDpsBase,
  planetMult,
  primeZoneMult,
  starsFor,
  starsMult,
} from '../core/formulas';
import { planetForZone } from '../data/planets';
import type { GameState } from '../core/state';
import { D, type Decimal } from '../util/decimal';
import { evolutionMult } from './evolution';
import { stardustBonus } from './prestige';
import { productionToDpsShare, teamDpsResearchMult, teamSlotsFor } from './research';
import { totalProduction } from './station';

/** Sekunden seit dem letzten Klick sind mindestens nullIdleSeconds */
export function isIdle(state: GameState): boolean {
  return state.playTime - state.lastClick >= BALANCING.types.nullIdleSeconds;
}

/** Anzahl der Monster eines Typs im Team */
export function typeCountInTeam(state: GameState, type: string): number {
  return state.team.filter((id) => getSpecies(id)?.type === type).length;
}

/** Typmultiplikator (Fähigkeit) einer Art in der aktuellen Lage */
export function typeMult(state: GameState, speciesId: SpeciesId, level: number): Decimal {
  const species = getSpecies(speciesId);
  if (!species) return D(1);
  const { types } = BALANCING;
  switch (species.type) {
    case 'prim':
      return primeZoneMult(state.zone);
    case 'fibonacci':
      return fibonacciMult(level);
    case 'euler':
      return eulerMult(state.playTime - state.cycleStart);
    case 'null':
      return D(isIdle(state) ? types.nullIdleMult : 1);
    case 'unendlich':
      return infinityMult(Object.keys(state.collection).length);
    case 'fraktal':
      return fractalMult(Math.max(1, typeCountInTeam(state, 'fraktal')));
    case 'vektor':
      return D(enemyKind(state.zone) === 'normal' ? 1 : types.vectorBossMult);
    case 'pi':
      // Pi wirkt über den Klickschaden
      return D(1);
  }
}

/** Sterne einer Art aus ihren Duplikaten */
export function speciesStars(state: GameState, speciesId: SpeciesId): number {
  const entry = state.collection[speciesId];
  return entry ? starsFor(entry.caught - 1) : 0;
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
  const planet = planetForZone(state.zone);
  return monsterDpsBase(
    evolutionMult(entry.evolution).mul(species.baseDps),
    entry.level,
    BALANCING.rarity[species.rarity].dpsMult,
    typeMult(state, speciesId, entry.level),
  )
    .mul(starsMult(starsFor(entry.caught - 1)))
    .mul(entry.shiny ? BALANCING.shiny.mult : 1)
    .mul(planetMult(species.type, planet.boosted, planet.weakened))
    .mul(globalDpsMult(state));
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
