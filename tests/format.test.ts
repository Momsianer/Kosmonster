import { describe, expect, it } from 'vitest';
import { D } from '../src/util/decimal';
import {
  formatDuration,
  formatNumber,
  formatPercent,
  formatSeconds,
  getNumberFormat,
  isNumberFormat,
  letterSuffix,
  setNumberFormat,
} from '../src/util/format';

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

describe('formatNumber wissenschaftlich', () => {
  it('Exponent in Einerschritten', () => {
    expect(formatNumber(999_999, 'scientific')).toBe('999.999');
    expect(formatNumber(1.5e6, 'scientific')).toBe('1,5e6');
    expect(formatNumber(1.234e7, 'scientific')).toBe('1,23e7');
    expect(formatNumber(9.999e8, 'scientific')).toBe('1e9');
  });
});

describe('formatNumber technisch', () => {
  it('Exponent in Dreierschritten', () => {
    expect(formatNumber(1.5e6, 'engineering')).toBe('1,5e6');
    expect(formatNumber(1.5e7, 'engineering')).toBe('15e6');
    expect(formatNumber(1.5e8, 'engineering')).toBe('150e6');
    expect(formatNumber(1.5e9, 'engineering')).toBe('1,5e9');
    expect(formatNumber(999.999e6, 'engineering')).toBe('1e9');
  });
});

describe('formatNumber Buchstaben', () => {
  it('Kurzschreibweise ab 1000', () => {
    expect(formatNumber(999, 'letters')).toBe('999');
    expect(formatNumber(1500, 'letters')).toBe('1,5K');
    expect(formatNumber(2.5e6, 'letters')).toBe('2,5M');
    expect(formatNumber(3e9, 'letters')).toBe('3B');
    expect(formatNumber(4e12, 'letters')).toBe('4T');
    expect(formatNumber(1.5e15, 'letters')).toBe('1,5aa');
    expect(formatNumber(1.5e18, 'letters')).toBe('1,5ab');
  });

  it('Kürzelfolge aa … zz, dann aaa', () => {
    expect(letterSuffix(1)).toBe('K');
    expect(letterSuffix(4)).toBe('T');
    expect(letterSuffix(5)).toBe('aa');
    expect(letterSuffix(5 + 25)).toBe('az');
    expect(letterSuffix(5 + 26)).toBe('ba');
    expect(letterSuffix(5 + 675)).toBe('zz');
    expect(letterSuffix(5 + 676)).toBe('aaa');
  });
});

describe('Anzeigeart einstellen', () => {
  it('setNumberFormat ändert die Standardanzeige', () => {
    expect(getNumberFormat()).toBe('standard');
    setNumberFormat('scientific');
    expect(formatNumber(1.5e6)).toBe('1,5e6');
    setNumberFormat('standard');
    expect(formatNumber(1.5e6)).toBe('1,5 Mio.');
  });

  it('isNumberFormat erkennt gültige Werte', () => {
    expect(isNumberFormat('letters')).toBe(true);
    expect(isNumberFormat('roman')).toBe(false);
    expect(isNumberFormat(3)).toBe(false);
  });
});

describe('formatDuration (deutsch)', () => {
  it('Sekunden, Minuten und Stunden', () => {
    expect(formatDuration(0)).toBe('0 Sek.');
    expect(formatDuration(45.9)).toBe('45 Sek.');
    expect(formatDuration(60)).toBe('1 Min.');
    expect(formatDuration(125)).toBe('2 Min. 5 Sek.');
    expect(formatDuration(3600)).toBe('1 Std.');
    expect(formatDuration(2 * 3600 + 5 * 60 + 30)).toBe('2 Std. 5 Min.');
  });
});

describe('formatPercent (deutsch)', () => {
  it('Prozent mit Komma', () => {
    expect(formatPercent(0.25).replace(/\s/g, ' ')).toBe('25 %');
    expect(formatPercent(0.0125).replace(/\s/g, ' ')).toBe('1,3 %');
    expect(formatPercent(0.0125, 2).replace(/\s/g, ' ')).toBe('1,25 %');
    expect(formatPercent(0.015).replace(/\s/g, ' ')).toBe('1,5 %');
  });
});
