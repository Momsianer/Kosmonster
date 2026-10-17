import { describe, expect, it } from 'vitest';
import { formatTime, PROFILES, simulate } from '../sim/simulate';

describe('Simulator', () => {
  it('spielt die ersten Minuten mit der echten Spiellogik', () => {
    const result = simulate(PROFILES.active, 15 * 60, 1);
    expect(result.times.firstCatch).not.toBeNull();
    expect(result.times.station).not.toBeNull();
    expect(result.finalZone).toBeGreaterThan(5);
  });

  it('ist mit gleichem Startwert reproduzierbar', () => {
    const a = simulate(PROFILES.active, 5 * 60, 7);
    const b = simulate(PROFILES.active, 5 * 60, 7);
    expect(a).toEqual(b);
  });

  it('formatiert Zeiten', () => {
    expect(formatTime(null)).toBe('nicht erreicht');
    expect(formatTime(42)).toBe('42 Sek.');
    expect(formatTime(125)).toBe('2 Min. 5 Sek.');
    expect(formatTime(3 * 3600 + 20 * 60)).toBe('3 Std. 20 Min.');
  });
});
