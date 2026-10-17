import { describe, expect, it } from 'vitest';
import { advance } from '../src/core/loop';
import { createInitialState } from '../src/core/state';
import { BALANCING } from '../src/data/balancing';
import { enterZone } from '../src/systems/combat';

describe('Tickschleife', () => {
  it('verrechnet die Zeitdifferenz zwischen zwei Zeitstempeln', () => {
    const state = createInitialState(1000);
    expect(advance(state, 1050)).toBeCloseTo(0.05, 10);
    expect(state.playTime).toBeCloseTo(0.05, 10);
    expect(state.lastTick).toBe(1050);
  });

  it('hängt nicht von der Anzahl der Ticks ab', () => {
    const a = createInitialState(0);
    const b = createInitialState(0);
    for (let t = 50; t <= 1000; t += 50) advance(a, t);
    for (let t = 200; t <= 1000; t += 200) advance(b, t);
    expect(a.playTime).toBeCloseTo(1, 10);
    expect(b.playTime).toBeCloseTo(1, 10);
  });

  it('holt lange Pausen vollständig nach', () => {
    const state = createInitialState(0);
    const dt = advance(state, 60_000);
    expect(dt).toBeCloseTo(60, 10);
    expect(state.playTime).toBeCloseTo(60, 10);
    expect(state.lastTick).toBe(60_000);
  });

  it('begrenzt die nachgeholte Zeit auf das Offlinelimit', () => {
    const state = createInitialState(0);
    const max = BALANCING.offline.maxSeconds;
    const dt = advance(state, (max + 3600) * 1000);
    expect(dt).toBe(max);
    expect(state.playTime).toBeCloseTo(max, 6);
  });

  it('nimmt ein eigenes Limit an', () => {
    const state = createInitialState(0);
    expect(advance(state, 10_000, 3)).toBe(3);
  });

  it('ein Boss scheitert auch während nachgeholter Zeit', () => {
    const state = createInitialState(0);
    enterZone(state, 5);
    advance(state, (BALANCING.boss.timeLimitSeconds + 5) * 1000);
    expect(state.zone).toBe(4);
    expect(state.farming).toBe(true);
  });

  it('ignoriert eine zurückgestellte Uhr', () => {
    const state = createInitialState(5000);
    expect(advance(state, 4000)).toBe(0);
    expect(state.playTime).toBe(0);
    expect(state.lastTick).toBe(4000);
  });
});
