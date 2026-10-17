import { clickDamage, enemyEnergy } from '../core/formulas';
import { createEnemy, type GameState } from '../core/state';
import { D, type DecimalSource } from '../util/decimal';

/**
 * Fügt dem aktuellen Gegner Schaden zu.
 * Überschüssiger Schaden verfällt. Gibt true zurück, wenn der Gegner besiegt wurde.
 */
export function dealDamage(state: GameState, amount: DecimalSource): boolean {
  const damage = D(amount);
  if (damage.lte(0)) return false;

  const enemy = state.enemy;
  enemy.hp = enemy.hp.sub(damage).max(0);
  if (enemy.hp.gt(0)) return false;

  defeatEnemy(state);
  return true;
}

/** Schreibt die Energie gut und lässt einen neuen Gegner erscheinen. */
export function defeatEnemy(state: GameState): void {
  const reward = enemyEnergy(state.enemy.zone);
  state.energy = state.energy.add(reward);
  state.totalEnergy = state.totalEnergy.add(reward);
  state.enemiesDefeated += 1;
  state.enemy = createEnemy(state.zone);
}

/** Aktion: Spieler klickt auf den Gegner. */
export function clickEnemy(state: GameState): boolean {
  state.clicks += 1;
  return dealDamage(state, clickDamage());
}
