import { getLocale, getTranslations } from '../i18n';
import { D, type Decimal, type DecimalSource } from './decimal';

/**
 * Anzeigearten für Spielzahlen.
 * standard: Suffixe der Sprache (deutsch 1,5 Mio.), scientific: 1,5e6,
 * engineering: Exponent in Dreierschritten (15e6), letters: 1,5K … 1,5aa
 */
export const NUMBER_FORMATS = ['standard', 'scientific', 'engineering', 'letters'] as const;
export type NumberFormat = (typeof NUMBER_FORMATS)[number];

export function isNumberFormat(value: unknown): value is NumberFormat {
  return typeof value === 'string' && (NUMBER_FORMATS as readonly string[]).includes(value);
}

const MAX_FRACTION_DIGITS = 2;
/** Ab hier verwenden standard, scientific und engineering die Kurzschreibweise */
const SHORT_FROM = 1e6;
/** Ab hier verwendet letters die Kurzschreibweise */
const LETTERS_FROM = 1e3;
/** Größer als das kann der Exponent nicht sinnvoll als Zahl dargestellt werden */
const MAX_PLAIN_EXPONENT = 1e15;

let currentFormat: NumberFormat = 'standard';

export function setNumberFormat(format: NumberFormat): void {
  currentFormat = format;
}

export function getNumberFormat(): NumberFormat {
  return currentFormat;
}

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

/** Ganzzahliger Zehnerexponent, robust gegen Rundungsfehler von log10 */
function exponentOf(value: Decimal): number {
  let exponent = value.log10().floor().toNumber();
  if (exponent < MAX_PLAIN_EXPONENT && D(10).pow(exponent + 1).lte(value)) exponent += 1;
  return exponent;
}

/**
 * Teilt value in Mantisse und Exponenten auf, wobei der Exponent ein Vielfaches
 * von step ist. Rundet die Mantisse und rutscht bei Überlauf eine Stufe weiter.
 */
function split(value: Decimal, exponent: number, step: number): { mantissa: number; exp: number } {
  let exp = Math.floor(exponent / step) * step;
  let mantissa = roundTo(value.div(D(10).pow(exp)).toNumber(), MAX_FRACTION_DIGITS);
  if (mantissa >= 10 ** step) {
    exp += step;
    mantissa = roundTo(mantissa / 10 ** step, MAX_FRACTION_DIGITS);
  }
  return { mantissa, exp };
}

/** Buchstabenkürzel für Tausendergruppe g (1 = 1e3): K, M, B, T, dann aa, ab, …, zz, aaa, … */
export function letterSuffix(group: number): string {
  const base = getTranslations().number.letterBase;
  if (group <= base.length) return base[group - 1] ?? '';
  let n = group - base.length - 1;
  let length = 2;
  while (n >= 26 ** length) {
    n -= 26 ** length;
    length += 1;
  }
  let out = '';
  for (let i = 0; i < length; i++) {
    out = String.fromCharCode(97 + (n % 26)) + out;
    n = Math.floor(n / 26);
  }
  return out;
}

function formatScientific(value: Decimal, exponent: number): string {
  const { mantissa, exp } = split(value, exponent, 1);
  return `${formatPlain(mantissa, MAX_FRACTION_DIGITS)}e${exp}`;
}

function formatEngineering(value: Decimal, exponent: number): string {
  const { mantissa, exp } = split(value, exponent, 3);
  return `${formatPlain(mantissa, MAX_FRACTION_DIGITS)}e${exp}`;
}

function formatStandard(value: Decimal, exponent: number): string {
  const suffixes = getTranslations().number.suffixes;
  const { mantissa, exp } = split(value, exponent, 3);
  const suffix = suffixes[exp / 3 - 2];
  if (suffix === undefined) return formatScientific(value, exponent);
  return `${formatPlain(mantissa, MAX_FRACTION_DIGITS)} ${suffix}`;
}

function formatLetters(value: Decimal, exponent: number): string {
  const { mantissa, exp } = split(value, exponent, 3);
  return `${formatPlain(mantissa, MAX_FRACTION_DIGITS)}${letterSuffix(exp / 3)}`;
}

/** Normale Schreibweise: unter 1000 mit bis zu zwei Nachkommastellen, darüber ganzzahlig */
function formatSmall(n: number): string {
  const digits = n < 1000 ? MAX_FRACTION_DIGITS : 0;
  return formatPlain(roundTo(n, digits), digits);
}

/**
 * Formatiert eine Spielzahl in der gewählten Anzeigeart und abhängig von der Sprache.
 * Deutsch standard: 999,5 · 12.345 · 1,5 Mio. · 2,3 Mrd. · jenseits der Suffixe 1,5e70
 */
export function formatNumber(source: DecimalSource, format: NumberFormat = currentFormat): string {
  const value = D(source);
  if (value.isNan()) return '?';
  if (value.lt(0)) return '−' + formatNumber(value.neg(), format);
  if (!value.isFinite()) return '∞';

  const shortFrom = format === 'letters' ? LETTERS_FROM : SHORT_FROM;
  if (value.lt(shortFrom)) {
    const n = value.toNumber();
    // Rundung darf nicht über die Grenze rutschen (999.999,9 → 1 Mio.)
    if (roundTo(n, n < 1000 ? MAX_FRACTION_DIGITS : 0) < shortFrom) return formatSmall(n);
  }

  const exponent = exponentOf(value);
  // Extrem große Zahlen: Darstellung von break_eternity übernehmen
  if (!Number.isFinite(exponent) || exponent >= MAX_PLAIN_EXPONENT) return value.toString();

  switch (format) {
    case 'scientific':
      return formatScientific(value, exponent);
    case 'engineering':
      return formatEngineering(value, exponent);
    case 'letters':
      return formatLetters(value, exponent);
    default:
      return formatStandard(value, exponent);
  }
}

/** Formatiert eine Dauer in Sekunden mit einer Nachkommastelle, z. B. 12,3 */
export function formatSeconds(seconds: number): string {
  return new Intl.NumberFormat(getLocale(), {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Math.max(0, seconds));
}
