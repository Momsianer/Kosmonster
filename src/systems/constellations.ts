import { BALANCING } from '../data/balancing';
import { CONSTELLATIONS, type ConstellationId, type TeamShape } from '../data/constellations';
import { getSpecies, MONSTER_TYPES, type MonsterType } from '../data/monsters';
import type { GameState } from '../core/state';
import { D, type Decimal } from '../util/decimal';
import { originEffect } from './rules';

/** Konstellationen wirken ab dem ersten Urknall */
export function constellationsUnlocked(state: GameState): boolean {
  return state.bigBangs > 0;
}

export function teamShape(state: GameState): TeamShape {
  const counts = Object.fromEntries(MONSTER_TYPES.map((t) => [t, 0])) as Record<MonsterType, number>;
  for (const id of state.team) {
    const type = getSpecies(id)?.type;
    if (type) counts[type] += 1;
  }
  return { counts, size: state.team.length };
}

export function activeConstellations(state: GameState): ConstellationId[] {
  if (!constellationsUnlocked(state)) return [];
  const shape = teamShape(state);
  return CONSTELLATIONS.filter((c) => c.test(shape)).map((c) => c.id);
}

/** Bonus einer Konstellation, verstärkt durch „Sternbilder“ (auf den Anteil über 1) */
export function constellationBonus(state: GameState, hidden: boolean): number {
  const { simpleMult, hiddenMult } = BALANCING.constellations;
  const base = hidden ? hiddenMult : simpleMult;
  return 1 + (base - 1) * (1 + originEffect(state, 'sternbilder'));
}

/** Gesamtmultiplikator aller aktiven Konstellationen auf Team DPS */
export function constellationMult(state: GameState): Decimal {
  const active = new Set(activeConstellations(state));
  return CONSTELLATIONS.reduce(
    (mult, c) => (active.has(c.id) ? mult.mul(constellationBonus(state, c.hidden)) : mult),
    D(1),
  );
}

/** Trägt aktive Konstellationen als entdeckt ein. Gibt neu entdeckte zurück. */
export function discoverConstellations(state: GameState): ConstellationId[] {
  const found: ConstellationId[] = [];
  for (const id of activeConstellations(state)) {
    if (!state.constellationsFound.includes(id)) {
      state.constellationsFound.push(id);
      found.push(id);
    }
  }
  return found;
}
