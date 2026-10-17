import { BALANCING } from '../data/balancing';
import { D, type Decimal } from '../util/decimal';

export type EnemyKind = 'normal' | 'boss' | 'systemBoss';

/**
 * Grundleben eines normalen Gegners in Zone z.
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

/** Art des Gegners in Zone z: Systemboss jede systemBossEvery. Zone, Boss jede bossEvery. Zone */
export function enemyKind(zone: number): EnemyKind {
  const { bossEvery, systemBossEvery } = BALANCING.boss;
  if (zone % systemBossEvery === 0) return 'systemBoss';
  if (zone % bossEvery === 0) return 'boss';
  return 'normal';
}

export function isBossZone(zone: number): boolean {
  return enemyKind(zone) !== 'normal';
}

/** Leben des Gegners in Zone z inklusive Bossmultiplikator */
export function enemyMaxHp(zone: number): Decimal {
  const { bossHpMult, systemBossHpMult } = BALANCING.boss;
  switch (enemyKind(zone)) {
    case 'systemBoss':
      return enemyHp(zone).mul(systemBossHpMult);
    case 'boss':
      return enemyHp(zone).mul(bossHpMult);
    default:
      return enemyHp(zone);
  }
}

/** Grundenergie für einen normalen Gegner in Zone z: hp(z) / energyDivisor */
export function enemyEnergy(zone: number): Decimal {
  return enemyHp(zone).div(BALANCING.reward.energyDivisor);
}

/** Energie für den Gegner in Zone z inklusive Bossmultiplikator */
export function enemyReward(zone: number): Decimal {
  const base = enemyEnergy(zone);
  return isBossZone(zone) ? base.mul(BALANCING.reward.bossEnergyMult) : base;
}

/** Nummer des Sternsystems, zu dem Zone z gehört (Zone 1 bis 10 → System 1) */
export function starSystem(zone: number): number {
  return Math.ceil(zone / BALANCING.world.zonesPerSystem);
}

/** Schaden eines Klicks. Noch nur der Grundschaden, später relativ zur Team DPS. */
export function clickDamage(): Decimal {
  return D(BALANCING.click.baseDamage);
}
