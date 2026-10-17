import Decimal, { type DecimalSource } from 'break_eternity.js';

export { Decimal };
export type { DecimalSource };

/** Wandelt einen beliebigen Zahlenwert in ein Decimal um. */
export function D(value: DecimalSource): Decimal {
  return new Decimal(value);
}
