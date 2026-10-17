import { getLocale, getTranslations } from '../i18n';
import { D, type DecimalSource } from './decimal';

const MAX_FRACTION_DIGITS = 2;

function formatPlain(value: number, maxFractionDigits: number): string {
  return new Intl.NumberFormat(getLocale(), {
    maximumFractionDigits: maxFractionDigits,
    minimumFractionDigits: 0,
  }).format(value);
}

function roundTo(value: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

/**
 * Formatiert eine Spielzahl abhängig von der Sprache.
 * Deutsch: 999,5 · 12.345 · 1,5 Mio. · 2,3 Mrd. · jenseits der Suffixe 1,5e70
 */
export function formatNumber(source: DecimalSource): string {
  const value = D(source);
  if (value.isNan()) return '?';
  if (value.lt(0)) return '−' + formatNumber(value.neg());
  if (!value.isFinite()) return '∞';

  // Unter einer Million: normale Schreibweise mit Tausenderpunkten
  if (value.lt(1e6)) {
    const n = value.toNumber();
    const digits = n < 1000 ? MAX_FRACTION_DIGITS : 0;
    const rounded = roundTo(n, digits);
    if (rounded < 1e6) return formatPlain(rounded, digits);
  }

  const suffixes = getTranslations().number.suffixes;
  let exponent = value.log10().floor().toNumber();
  // Rundungsfehler bei log10 ausgleichen
  if (D(10).pow(exponent + 1).lte(value)) exponent += 1;

  let group = Math.floor(exponent / 3);
  const suffixIndex = group - 2;
  if (suffixIndex < suffixes.length) {
    let mantissa = roundTo(value.div(D(10).pow(group * 3)).toNumber(), MAX_FRACTION_DIGITS);
    if (mantissa >= 1000) {
      group += 1;
      mantissa = roundTo(mantissa / 1000, MAX_FRACTION_DIGITS);
    }
    const suffix = suffixes[group - 2];
    if (suffix !== undefined) return `${formatPlain(mantissa, MAX_FRACTION_DIGITS)} ${suffix}`;
  }

  return formatScientific(value, exponent);
}

function formatScientific(value: ReturnType<typeof D>, exponent: number): string {
  if (!Number.isFinite(exponent) || exponent > 1e15) {
    // Extrem große Zahlen: Darstellung von break_eternity übernehmen
    return value.toString();
  }
  let exp = exponent;
  let mantissa = roundTo(value.div(D(10).pow(exp)).toNumber(), MAX_FRACTION_DIGITS);
  if (mantissa >= 10) {
    exp += 1;
    mantissa = roundTo(mantissa / 10, MAX_FRACTION_DIGITS);
  }
  return `${formatPlain(mantissa, MAX_FRACTION_DIGITS)}e${exp}`;
}

/** Formatiert eine Dauer in Sekunden mit einer Nachkommastelle, z. B. 12,3 */
export function formatSeconds(seconds: number): string {
  return new Intl.NumberFormat(getLocale(), {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Math.max(0, seconds));
}
