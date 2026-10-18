import { createEnemy, pickSpecies, type EnemyState, type GameState } from '../core/state';
import { BALANCING } from '../data/balancing';
import { nextRandom } from '../util/random';
import { rareSpawnBoost, shinyChanceMult } from './research';
import { ruleActive } from './rules';

/** Chance auf eine Polarstern Variante pro Begegnung */
export function shinyChance(state: GameState): number {
  return Math.min(1, BALANCING.shiny.chance * shinyChanceMult(state));
}

/** Lässt in Zone z einen neuen Gegner erscheinen (Bossmonster oder Art nach Seltenheit, Polarstern nach Zufall) */
export function spawnEnemy(state: GameState, zone: number): EnemyState {
  const speciesId = pickSpecies(state, zone, rareSpawnBoost(state));
  const shiny = nextRandom(state) < shinyChance(state);
  // Teilbarkeit: Gegnerleben ×hpMult, wenn die Zone nicht durch divisor teilbar ist
  const { divisibilityHpMult, divisor } = BALANCING.challengeRules;
  const hpMult = ruleActive(state, 'divisibility') && zone % divisor !== 0 ? divisibilityHpMult : 1;
  return createEnemy(zone, speciesId, shiny, hpMult);
}
