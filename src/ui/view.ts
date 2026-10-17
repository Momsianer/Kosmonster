import { enemyKind, starSystem, type EnemyKind } from '../core/formulas';
import type { GameState } from '../core/state';
import { BALANCING } from '../data/balancing';
import { formatNumber, formatSeconds } from '../util/format';

/** Aufbereitete Werte für die Oberfläche, damit Komponenten keine Spiellogik brauchen */
export interface GameView {
  energy: string;
  zone: number;
  starSystem: number;
  highestZone: number;
  killsInZone: number;
  enemiesPerZone: number;
  enemyKind: EnemyKind;
  enemyHp: string;
  enemyMaxHp: string;
  /** Anteil der verbleibenden Leben zwischen 0 und 1 */
  enemyHpFraction: number;
  /** Verbleibende Bosszeit als Text, leer außerhalb von Bosszonen */
  bossTime: string;
  /** Anteil der verbleibenden Bosszeit zwischen 0 und 1 */
  bossTimeFraction: number;
  bossTimeLimit: number;
  farming: boolean;
  enemiesDefeated: number;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function createView(state: GameState): GameView {
  const { enemy } = state;
  const kind = enemyKind(enemy.zone);
  const limit = BALANCING.boss.timeLimitSeconds;
  const fraction = enemy.maxHp.gt(0) ? enemy.hp.div(enemy.maxHp).toNumber() : 0;
  return {
    energy: formatNumber(state.energy),
    zone: state.zone,
    starSystem: starSystem(state.zone),
    highestZone: state.highestZone,
    killsInZone: state.killsInZone,
    enemiesPerZone: BALANCING.world.enemiesPerZone,
    enemyKind: kind,
    enemyHp: formatNumber(enemy.hp),
    enemyMaxHp: formatNumber(enemy.maxHp),
    enemyHpFraction: clamp01(fraction),
    bossTime: kind === 'normal' ? '' : formatSeconds(state.bossTimeLeft),
    bossTimeFraction: kind === 'normal' ? 0 : clamp01(state.bossTimeLeft / limit),
    bossTimeLimit: limit,
    farming: state.farming,
    enemiesDefeated: state.enemiesDefeated,
  };
}
