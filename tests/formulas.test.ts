import { describe, expect, it } from 'vitest';
import {
  clickDamage,
  enemyEnergy,
  enemyHp,
  enemyKind,
  enemyMaxHp,
  enemyReward,
  isBossZone,
  starSystem,
} from '../src/core/formulas';
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

describe('enemyKind', () => {
  it('Boss jede 5. Zone, Systemboss jede 10. Zone', () => {
    expect(enemyKind(1)).toBe('normal');
    expect(enemyKind(4)).toBe('normal');
    expect(enemyKind(5)).toBe('boss');
    expect(enemyKind(10)).toBe('systemBoss');
    expect(enemyKind(15)).toBe('boss');
    expect(enemyKind(20)).toBe('systemBoss');
    expect(isBossZone(9)).toBe(false);
    expect(isBossZone(25)).toBe(true);
  });
});

describe('enemyMaxHp', () => {
  it('normale Gegner haben die Grundleben', () => {
    expect(enemyMaxHp(3).eq(enemyHp(3))).toBe(true);
  });

  it('Boss × bossHpMult, Systemboss × systemBossHpMult', () => {
    expect(enemyMaxHp(5).eq(enemyHp(5).mul(BALANCING.boss.bossHpMult))).toBe(true);
    expect(enemyMaxHp(10).eq(enemyHp(10).mul(BALANCING.boss.systemBossHpMult))).toBe(true);
  });
});

describe('enemyReward', () => {
  it('normale Gegner geben die Grundenergie', () => {
    expect(enemyReward(7).eq(enemyEnergy(7))).toBe(true);
  });

  it('Bosse und Systembosse geben × bossEnergyMult', () => {
    const mult = BALANCING.reward.bossEnergyMult;
    expect(enemyReward(5).eq(enemyEnergy(5).mul(mult))).toBe(true);
    expect(enemyReward(10).eq(enemyEnergy(10).mul(mult))).toBe(true);
  });
});

describe('starSystem', () => {
  it('fasst je 10 Zonen zu einem Sternsystem zusammen', () => {
    expect(starSystem(1)).toBe(1);
    expect(starSystem(10)).toBe(1);
    expect(starSystem(11)).toBe(2);
    expect(starSystem(140)).toBe(14);
  });
});
