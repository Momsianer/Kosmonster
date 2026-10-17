import { describe, expect, it } from 'vitest';
import { nextRandom, weightedPick } from '../src/util/random';

describe('Zufallsgenerator', () => {
  it('ist mit gleichem Startwert reproduzierbar', () => {
    const a = { rngState: 42 };
    const b = { rngState: 42 };
    for (let i = 0; i < 100; i++) expect(nextRandom(a)).toBe(nextRandom(b));
  });

  it('liefert Werte in [0, 1) und verändert den Zustand', () => {
    const r = { rngState: 7 };
    for (let i = 0; i < 1000; i++) {
      const before = r.rngState;
      const x = nextRandom(r);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
      expect(r.rngState).not.toBe(before);
    }
  });

  it('weightedPick folgt den Gewichten', () => {
    const r = { rngState: 1 };
    const counts = { a: 0, b: 0, c: 0 };
    const items = ['a', 'b', 'c'] as const;
    const weights = { a: 3, b: 1, c: 0 };
    for (let i = 0; i < 8000; i++) counts[weightedPick(r, items, (x) => weights[x])!] += 1;
    expect(counts.c).toBe(0);
    expect(counts.a / 8000).toBeCloseTo(0.75, 1);
  });

  it('weightedPick ohne Gewichte ergibt undefined', () => {
    expect(weightedPick({ rngState: 1 }, ['a'], () => 0)).toBeUndefined();
  });
});
