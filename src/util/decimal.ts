import Decimal, { type DecimalSource } from 'break_eternity.js';

export { Decimal };
export type { DecimalSource };

/** Wandelt einen beliebigen Zahlenwert in ein Decimal um. */
export function D(value: DecimalSource): Decimal {
  return new Decimal(value);
}

/**
 * base^exp für ganzzahlige Exponenten. Exakt, solange das Ergebnis als normale Zahl
 * darstellbar ist (Decimal.pow hat dort kleine Rundungsfehler), sonst über Decimal.
 */
export function powInt(base: number, exp: number): Decimal {
  const plain = base ** exp;
  return Number.isFinite(plain) && Math.abs(plain) < Number.MAX_SAFE_INTEGER
    ? new Decimal(plain)
    : new Decimal(base).pow(exp);
}
