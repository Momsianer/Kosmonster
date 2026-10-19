import { BALANCING } from '../data/balancing';
import { BOSS_SPECIES } from '../data/monsters';
import type { GameState } from '../core/state';

/**
 * Trophäen: Jedes gefangene Bossmonster gibt dauerhaft einen kleinen Bonus,
 * unabhängig davon, ob es im Team ist. Minibosse stärken die Energie aus Gegnern,
 * Hauptbosse den Schaden gegen Bosse.
 */
export function trophyCounts(state: GameState): { mini: number; main: number } {
  let mini = 0;
  let main = 0;
  for (const s of BOSS_SPECIES) {
    if (!state.collection[s.id]) continue;
    if (s.boss === 'mini') mini += 1;
    else main += 1;
  }
  return { mini, main };
}

/** Energie aus besiegten Gegnern ×(1 + miniEnergyBonus * gefangene Minibosse) */
export function trophyEnergyMult(state: GameState): number {
  return 1 + BALANCING.bosses.trophies.miniEnergyBonus * trophyCounts(state).mini;
}

/** Schaden gegen Bosse ×(1 + mainBossDamageBonus * gefangene Hauptbosse) */
export function trophyBossDamageMult(state: GameState): number {
  return 1 + BALANCING.bosses.trophies.mainBossDamageBonus * trophyCounts(state).main;
}
