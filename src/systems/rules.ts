import { BALANCING } from '../data/balancing';
import { CHALLENGE_RULES, type ChallengeRule } from '../data/challenges';
import type { OriginId } from '../data/origin';
import type { GameState } from '../core/state';
import { bulkCost, maxAffordable } from '../core/formulas';
import { D, type Decimal, type DecimalSource } from '../util/decimal';

/**
 * Regeln, die mehrere Systeme betreffen: Einschränkungen der laufenden Challenge,
 * dauerhafte Challengeboni und Wirkungen der Ursprungsupgrades.
 */

export function ruleActive(state: GameState, rule: ChallengeRule): boolean {
  const active = state.challenge.active;
  return active !== null && CHALLENGE_RULES[active].includes(rule);
}

type BonusKind = (typeof BALANCING.challenges)[keyof typeof BALANCING.challenges]['bonus']['kind'];

/** Produkt der Challengeboni einer Art (dps, production, stardust, moduleCost, levelCost) */
export function challengeMult(state: GameState, kind: BonusKind): number {
  return state.challenge.completed.reduce((mult, id) => {
    const bonus = BALANCING.challenges[id].bonus;
    return bonus.kind === kind ? mult * bonus.value : mult;
  }, 1);
}

/** Summe der Challengeboni einer Art (bossTime, offlineLimit) */
export function challengeAdd(state: GameState, kind: BonusKind): number {
  return state.challenge.completed.reduce((sum, id) => {
    const bonus = BALANCING.challenges[id].bonus;
    return bonus.kind === kind ? sum + bonus.value : sum;
  }, 0);
}

export function originLevel(state: GameState, id: OriginId): number {
  return state.originUpgrades[id] ?? 0;
}

/** Wirkung eines Ursprungsupgrades: perLevel * stufe */
export function originEffect(state: GameState, id: OriginId): number {
  return BALANCING.origin.upgrades[id].perLevel * originLevel(state, id);
}

// ─── Kosten (Quadratisches Wachstum) ────────────────────────

/** Höchstzahl an Schritten, die bei quadratischen Kosten summiert werden */
const QUADRATIC_LIMIT = 1000;

function quadraticStep(base: DecimalSource, r: number, k: number): Decimal {
  return D(r).pow(k * k).mul(base);
}

/** Kosten für n weitere Käufe ab owned, bei „Quadratisches Wachstum“ mit r^(k²) statt r^k */
export function purchaseCost(state: GameState, base: DecimalSource, r: number, owned: number, n: number): Decimal {
  if (!ruleActive(state, 'quadraticCost')) return bulkCost(base, r, owned, n);
  let sum = D(0);
  for (let i = 0; i < Math.min(n, QUADRATIC_LIMIT); i++) sum = sum.add(quadraticStep(base, r, owned + i));
  return sum;
}

/** Wie viele Käufe ab owned bezahlbar sind */
export function purchaseAffordable(state: GameState, money: Decimal, base: DecimalSource, r: number, owned: number): number {
  if (!ruleActive(state, 'quadraticCost')) return maxAffordable(money, base, r, owned);
  let sum = D(0);
  let n = 0;
  while (n < QUADRATIC_LIMIT) {
    sum = sum.add(quadraticStep(base, r, owned + n));
    if (sum.gt(money)) break;
    n += 1;
  }
  return n;
}

