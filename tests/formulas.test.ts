import { describe, expect, it } from 'vitest';
import { clickDamage, enemyEnergy, enemyHp } from '../src/core/formulas';
import { BALANCING } from '../src/data/balancing';

const { baseHp, hpGrowth, hpBreakZone, hpGrowthLate } = BALANCING.enemy;

describe('enemyHp', () => {
  it('beginnt in Zone 1 mit den Grundleben', () => {
    expect(enemyHp(1).toNumber()).toBe(baseHp);
  });

  it('wächst bis zur Knickzone mit hpGrowth pro Zone', () => {
    expect(enemyHp(2).toNumber()).toBeCloseTo(baseHp * hpGrowth, 10);
    expect(enemyHp(10).toNumber()).toBeCloseTo(baseHp * hpGrowth ** 9, 6);
    const ratio = enemyHp(51).div(enemyHp(50)).toNumber();
    expect(ratio).toBeCloseTo(hpGrowth, 10);
  });

  it('nutzt bis einschließlich der Knickzone die frühe Formel', () => {
    const expected = baseHp * hpGrowth ** (hpBreakZone - 1);
    expect(enemyHp(hpBreakZone).toNumber() / expected).toBeCloseTo(1, 10);
  });

  it('wächst nach der Knickzone mit hpGrowthLate', () => {
    const ratio = enemyHp(hpBreakZone + 1).div(enemyHp(hpBreakZone)).toNumber();
    expect(ratio).toBeCloseTo(hpGrowthLate, 10);
    const later = enemyHp(hpBreakZone + 10).div(enemyHp(hpBreakZone)).toNumber();
    expect(later).toBeCloseTo(hpGrowthLate ** 10, 8);
  });

  it('ist streng monoton steigend', () => {
    for (let z = 1; z < 300; z++) {
      expect(enemyHp(z + 1).gt(enemyHp(z))).toBe(true);
    }
  });
});

describe('enemyEnergy', () => {
  it('ist hp(z) / energyDivisor', () => {
    for (const z of [1, 2, 25, 140, 200]) {
      const expected = enemyHp(z).div(BALANCING.reward.energyDivisor);
      expect(enemyEnergy(z).eq(expected)).toBe(true);
    }
    expect(enemyEnergy(1).toNumber()).toBeCloseTo(10 / 15, 10);
  });
});

describe('clickDamage', () => {
  it('entspricht in M1 dem Grundschaden', () => {
    expect(clickDamage().toNumber()).toBe(BALANCING.click.baseDamage);
  });
});
