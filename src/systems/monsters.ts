import { BALANCING } from '../data/balancing';
import { getSpecies, type SpeciesId } from '../data/monsters';
import {
  enemyKind,
  eulerMult,
  fibonacciMult,
  fractalMult,
  infinityMult,
  monsterDpsBase,
  planetMult,
  primeZoneMult,
  starsFor,
  starsMult,
} from '../core/formulas';
import { planetForZone } from '../data/planets';
import type { GameState } from '../core/state';
import { D, type Decimal } from '../util/decimal';
import { potentialMult } from './breeding';
import { evolutionMult } from './evolution';
import { constellationMult } from './constellations';
import { challengeMult, originEffect, purchaseAffordable, purchaseCost, ruleActive } from './rules';
import { stardustBonus } from './prestige';
import { productionToDpsShare, teamDpsResearchMult, teamSlotsFor } from './research';
import { totalProduction } from './station';
import { challengeTierMult, multiverseMult, shinySetMult } from './endgame';

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

/** Im Endgame gibt es Sterne über maxStars */
export function starsUnlimited(state: GameState): boolean {
  return state.theoremDefeated;
}

/** Sterne einer Art aus ihren Duplikaten */
export function speciesStars(state: GameState, speciesId: SpeciesId): number {
  const entry = state.collection[speciesId];
  return entry ? starsFor(entry.caught - 1, starsUnlimited(state)) : 0;
}

/** globalMult: Sternenstaub, Forschung, Ursprung, Challenges, Konstellationen und Endgame */
export function globalDpsMult(state: GameState): Decimal {
  return stardustBonus(state)
    .mul(teamDpsResearchMult(state))
    .mul(1 + originEffect(state, 'urkraft'))
    .mul(challengeMult(state, 'dps'))
    .mul(constellationMult(state))
    .mul(multiverseMult(state))
    .mul(challengeTierMult(state));
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
    .mul(starsMult(speciesStars(state, speciesId)))
    .mul(entry.shiny ? BALANCING.shiny.mult : 1)
    .mul(shinySetMult(state, speciesId))
    .mul(potentialMult(entry.bred))
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
  if (ruleActive(state, 'solo')) return BALANCING.challengeRules.soloSlots;
  return teamSlotsFor(ruleActive(state, 'noResearch') ? {} : state.research, state.dmUpgrades);
}

/** Basiskosten fürs Leveln mit Challengebonus */
function levelBase(state: GameState, baseCost: number): Decimal {
  return D(baseCost).mul(challengeMult(state, 'levelCost'));
}

/** Kauft bis zu `amount` Level, 'max' = so viele wie bezahlbar. Gibt die Zahl gekaufter Level zurück. */
export function levelUp(state: GameState, speciesId: SpeciesId, amount: number | 'max'): number {
  const species = getSpecies(speciesId);
  const entry = state.collection[speciesId];
  if (!species || !entry) return 0;
  const r = BALANCING.monster.levelCostGrowth;
  const base = levelBase(state, species.baseCost);
  const affordable = purchaseAffordable(state, state.energy, base, r, entry.level);
  const n = amount === 'max' ? affordable : Math.min(amount, affordable);
  if (n <= 0) return 0;
  state.energy = state.energy.sub(purchaseCost(state, base, r, entry.level, n)).max(0);
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
  const base = levelBase(state, species.baseCost);
  const levels = amount === 'max' ? Math.max(1, purchaseAffordable(state, state.energy, base, r, entry.level)) : amount;
  return { levels, cost: purchaseCost(state, base, r, entry.level, levels) };
}

export function addToTeam(state: GameState, speciesId: SpeciesId): boolean {
  if (!state.collection[speciesId]) return false;
  if (state.team.includes(speciesId)) return false;
  if (state.team.length >= teamSlots(state)) return false;
  if (ruleActive(state, 'monoculture')) {
    const type = getSpecies(speciesId)?.type;
    if (state.team.some((id) => getSpecies(id)?.type !== type)) return false;
  }
  state.team.push(speciesId);
  return true;
}

export function removeFromTeam(state: GameState, speciesId: SpeciesId): boolean {
  const index = state.team.indexOf(speciesId);
  if (index < 0) return false;
  state.team.splice(index, 1);
  return true;
}
