import { describe, expect, it } from 'vitest';
import { D } from '../src/util/decimal';
import { formatNumber, formatSeconds } from '../src/util/format';

describe('formatNumber (deutsch)', () => {
  it('kleine Zahlen mit Dezimalkomma', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(10 / 15)).toBe('0,67');
    expect(formatNumber(15.5)).toBe('15,5');
    expect(formatNumber(999.5)).toBe('999,5');
  });

  it('Tausenderpunkte ab 1000, ohne Nachkommastellen', () => {
    expect(formatNumber(1000)).toBe('1.000');
    expect(formatNumber(12345.6)).toBe('12.346');
    expect(formatNumber(999_999)).toBe('999.999');
  });

  it('Suffixe ab einer Million', () => {
    expect(formatNumber(1e6)).toBe('1 Mio.');
    expect(formatNumber(1.5e6)).toBe('1,5 Mio.');
    expect(formatNumber(2.3e9)).toBe('2,3 Mrd.');
    expect(formatNumber(4.56e12)).toBe('4,56 Bio.');
    expect(formatNumber(7e15)).toBe('7 Brd.');
    expect(formatNumber(123.456e6)).toBe('123,46 Mio.');
  });

  it('rundet sauber in die nächste Stufe', () => {
    expect(formatNumber(999_999.9)).toBe('1 Mio.');
    expect(formatNumber(999.999e6)).toBe('1 Mrd.');
  });

  it('wissenschaftlich jenseits der Suffixe', () => {
    expect(formatNumber(D('1.5e70'))).toBe('1,5e70');
    expect(formatNumber(D('1e308'))).toBe('1e308');
    expect(formatNumber(D('9.999e100'))).toBe('1e101');
  });

  it('negative Zahlen', () => {
    expect(formatNumber(-1.5e6)).toBe('−1,5 Mio.');
  });
});

describe('formatSeconds (deutsch)', () => {
  it('eine Nachkommastelle mit Komma', () => {
    expect(formatSeconds(30)).toBe('30,0');
    expect(formatSeconds(12.34)).toBe('12,3');
    expect(formatSeconds(0.05)).toBe('0,1');
  });

  it('nie negativ', () => {
    expect(formatSeconds(-1)).toBe('0,0');
  });
});
