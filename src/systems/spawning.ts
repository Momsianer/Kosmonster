import { enemyKind } from '../core/formulas';
import { createEnemy, pickSpecies, type EnemyState, type GameState } from '../core/state';
import { BALANCING } from '../data/balancing';
import { nextRandom } from '../util/random';
import { rareSpawnBoost, shinyChanceMult } from './research';

/** Chance auf eine Polarstern Variante pro Begegnung */
export function shinyChance(state: GameState): number {
  return Math.min(1, BALANCING.shiny.chance * shinyChanceMult(state));
}

/** Lässt in Zone z einen neuen Gegner erscheinen (Art nach Seltenheit, Polarstern nach Zufall) */
export function spawnEnemy(state: GameState, zone: number): EnemyState {
  const speciesId = pickSpecies(state, zone, enemyKind(zone) === 'systemBoss', rareSpawnBoost(state));
  const shiny = nextRandom(state) < shinyChance(state);
  return createEnemy(zone, speciesId, shiny);
}
