import type { GameState } from '../core/state';
import { formatNumber } from '../util/format';

/** Aufbereitete Werte für die Oberfläche, damit Komponenten keine Spiellogik brauchen */
export interface GameView {
  energy: string;
  zone: number;
  enemyHp: string;
  enemyMaxHp: string;
  /** Anteil der verbleibenden Leben zwischen 0 und 1 */
  enemyHpFraction: number;
  enemiesDefeated: number;
}

export function createView(state: GameState): GameView {
  const { enemy } = state;
  const fraction = enemy.maxHp.gt(0) ? enemy.hp.div(enemy.maxHp).toNumber() : 0;
  return {
    energy: formatNumber(state.energy),
    zone: state.zone,
    enemyHp: formatNumber(enemy.hp),
    enemyMaxHp: formatNumber(enemy.maxHp),
    enemyHpFraction: Math.min(1, Math.max(0, fraction)),
    enemiesDefeated: state.enemiesDefeated,
  };
}
