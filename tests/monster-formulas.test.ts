import { describe, expect, it } from 'vitest';
import {
  bulkCost,
  catchChance,
  clickDamage,
  enemyEnergy,
  fibonacciCount,
  fibonacciMult,
  isPrime,
  levelCost,
  maxAffordable,
  milestoneMult,
  monsterDpsBase,
  primeZoneMult,
  sphereCost,
} from '../src/core/formulas';
import { BALANCING } from '../src/data/balancing';

describe('clickDamage', () => {
  it('ohne Team der Grundschaden', () => {
    expect(clickDamage().toNumber()).toBe(BALANCING.click.baseDamage);
  });

  it('1 + 0,01 * teamDPS * klickbonus', () => {
    expect(clickDamage(500).toNumber()).toBeCloseTo(1 + 0.01 * 500, 10);
    expect(clickDamage(500, 3).toNumber()).toBeCloseTo(1 + 0.01 * 500 * 3, 10);
  });
});

describe('levelCost', () => {
  it('basisKosten * 1,07^l', () => {
    expect(levelCost(10, 0).toNumber()).toBe(10);
    expect(levelCost(10, 1).toNumber()).toBeCloseTo(10.7, 10);
    expect(levelCost(10, 50).toNumber()).toBeCloseTo(10 * 1.07 ** 50, 6);
  });
});

describe('milestoneMult', () => {
  // Decimal.pow rechnet nicht ganz exakt, daher relativer Vergleich
  const expectMult = (level: number, expected: number) =>
    expect(milestoneMult(level).toNumber() / expected).toBeCloseTo(1, 10);
  it('×2 bei 10, 25, 50 und 100', () => {
    expectMult(1, 1);
    expectMult(9, 1);
    expectMult(10, 2);
    expectMult(24, 2);
    expectMult(25, 4);
    expectMult(50, 8);
    expectMult(99, 8);
    expectMult(100, 16);
  });

  it('danach alle 100 Level ×2', () => {
    expectMult(199, 16);
    expectMult(200, 32);
    expectMult(300, 64);
    expectMult(999, 16 * 2 ** 8);
  });

  it('alle 1000 Level ×10 statt ×2', () => {
    expectMult(1000, 16 * 2 ** 8 * 10);
    expectMult(1100, 16 * 2 ** 9 * 10);
    expectMult(2000, 16 * 2 ** 17 * 100);
  });
});

describe('Fibonacci', () => {
  it('zählt verschiedene Fibonacci Zahlen bis zum Level', () => {
    expect(fibonacciCount(0)).toBe(0);
    expect(fibonacciCount(1)).toBe(1);
    expect(fibonacciCount(2)).toBe(2);
    expect(fibonacciCount(3)).toBe(3);
    expect(fibonacciCount(4)).toBe(3);
    expect(fibonacciCount(5)).toBe(4);
    expect(fibonacciCount(8)).toBe(5);
    expect(fibonacciCount(13)).toBe(6);
    expect(fibonacciCount(20)).toBe(6);
    expect(fibonacciCount(21)).toBe(7);
  });

  it('×1,5 je Fibonacci Level', () => {
    expect(fibonacciMult(5).toNumber()).toBeCloseTo(1.5 ** 4, 10);
  });
});

describe('Prim', () => {
  it('erkennt Primzahlen', () => {
    const primes = [2, 3, 5, 7, 11, 13, 97, 7919];
    const others = [0, 1, 4, 9, 15, 25, 100, 7917];
    for (const p of primes) expect(isPrime(p)).toBe(true);
    for (const n of others) expect(isPrime(n)).toBe(false);
  });

  it('×2 in Primzahlzonen', () => {
    expect(primeZoneMult(7).toNumber()).toBe(BALANCING.types.primeZoneMult);
    expect(primeZoneMult(8).toNumber()).toBe(1);
  });
});

describe('monsterDpsBase', () => {
  it('basisDPS * level * meilensteinMult * seltenheitMult * typMult', () => {
    expect(monsterDpsBase(3, 1, 1, 1).toNumber()).toBe(3);
    expect(monsterDpsBase(3, 10, 2, 1.5).toNumber()).toBeCloseTo(3 * 10 * 2 * 2 * 1.5, 10);
  });

  it('Level 0 macht keinen Schaden', () => {
    expect(monsterDpsBase(3, 0, 1, 1).toNumber()).toBe(0);
  });
});

describe('catchChance', () => {
  it('basisChance * sphärenMult * (1 + forschungsBonus)', () => {
    expect(catchChance(0.25)).toBeCloseTo(0.25, 10);
    expect(catchChance(0.12, 2.5, 0.5)).toBeCloseTo(0.12 * 2.5 * 1.5, 10);
  });

  it('höchstens 100 %', () => {
    expect(catchChance(0.25, 5, 1)).toBe(1);
  });
});

describe('sphereCost', () => {
  it('sphereCostKills * Energie eines normalen Gegners', () => {
    const expected = enemyEnergy(12).mul(BALANCING.catching.sphereCostKills);
    expect(sphereCost(12).eq(expected)).toBe(true);
  });
});

describe('Mehrfachkauf', () => {
  it('bulkCost entspricht der Summe der Einzelpreise', () => {
    const base = 4;
    const r = 1.07;
    let sum = 0;
    for (let i = 0; i < 25; i++) sum += base * r ** (12 + i);
    expect(bulkCost(base, r, 12, 25).toNumber()).toBeCloseTo(sum, 6);
    expect(bulkCost(base, r, 12, 1).toNumber()).toBeCloseTo(base * r ** 12, 10);
    expect(bulkCost(base, r, 12, 0).toNumber()).toBe(0);
  });

  it('maxAffordable trifft die Grenze genau', () => {
    const base = 15;
    const r = 1.15;
    for (const owned of [0, 5, 40]) {
      for (const n of [1, 7, 30]) {
        const exact = bulkCost(base, r, owned, n);
        expect(maxAffordable(exact, base, r, owned)).toBe(n);
        expect(maxAffordable(exact.mul(0.9999), base, r, owned)).toBe(n - 1);
      }
    }
  });

  it('ohne Geld nichts kaufbar', () => {
    expect(maxAffordable(0, 10, 1.07, 0)).toBe(0);
    expect(maxAffordable(5, 10, 1.07, 0)).toBe(0);
  });
});
