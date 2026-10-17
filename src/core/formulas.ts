import { BALANCING } from '../data/balancing';
import { D, type Decimal } from '../util/decimal';

/**
 * Gegnerleben in Zone z.
 * hp(z) = baseHp * hpGrowth^(z − 1)                  für z ≤ hpBreakZone
 * hp(z) = hp(hpBreakZone) * hpGrowthLate^(z − hpBreakZone)  für z > hpBreakZone
 */
export function enemyHp(zone: number): Decimal {
  const { baseHp, hpGrowth, hpBreakZone, hpGrowthLate } = BALANCING.enemy;
  if (zone <= hpBreakZone) {
    return D(hpGrowth).pow(zone - 1).mul(baseHp);
  }
  return enemyHp(hpBreakZone).mul(D(hpGrowthLate).pow(zone - hpBreakZone));
}

/** Energie für einen besiegten Gegner in Zone z: hp(z) / energyDivisor */
export function enemyEnergy(zone: number): Decimal {
  return enemyHp(zone).div(BALANCING.reward.energyDivisor);
}

/** Schaden eines Klicks. In M1 nur der Grundschaden, später relativ zur Team DPS. */
export function clickDamage(): Decimal {
  return D(BALANCING.click.baseDamage);
}
