import { BALANCING } from '../data/balancing';
import { CHALLENGE_IDS } from '../data/challenges';
import { enemyHp } from '../core/formulas';
import type { GameState } from '../core/state';
import type { Decimal } from '../util/decimal';

/** Das Theorem erscheint nach allen 12 Challenges */
export function theoremAvailable(state: GameState): boolean {
  return CHALLENGE_IDS.every((id) => state.challenge.completed.includes(id));
}

export function theoremHp(): Decimal {
  const { hpZone, hpMult } = BALANCING.theorem;
  return enemyHp(hpZone).mul(hpMult);
}

export function startTheorem(state: GameState): boolean {
  if (!theoremAvailable(state) || state.theorem) return false;
  const maxHp = theoremHp();
  state.theorem = { hp: maxHp, maxHp, timeLeft: BALANCING.theorem.timeLimitSeconds };
  return true;
}

/** Schaden gegen das Theorem. Gibt true zurück, wenn es besiegt ist. */
export function damageTheorem(state: GameState, damage: Decimal): boolean {
  const fight = state.theorem;
  if (!fight) return false;
  fight.hp = fight.hp.sub(damage).max(0);
  if (fight.hp.gt(0)) return false;
  state.theorem = null;
  state.theoremDefeated = true;
  return true;
}

/** Zeitlimit des Theoremkampfs, scheitert man, endet der Kampf */
export function updateTheorem(state: GameState, dtSeconds: number): void {
  if (!state.theorem) return;
  state.theorem.timeLeft -= dtSeconds;
  if (state.theorem.timeLeft <= 0) state.theorem = null;
}
