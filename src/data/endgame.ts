/**
 * Endgame: Multiversum und unbewiesene Vermutungen.
 * Neue Vermutungen bekommen hier eine Id, in balancing.ts unter endgame.modes ihre Werte
 * und in src/systems/endgame.ts ihre Regel für die nächste Stufe.
 */

export const ENDGAME_MODES = ['multiversum', 'collatz', 'goldbach', 'riemann'] as const;
export type EndgameMode = (typeof ENDGAME_MODES)[number];

/** Imaginärteile der ersten nichttrivialen Nullstellen der Zetafunktion */
const KNOWN_ZEROS = [
  14.134725, 21.02204, 25.010858, 30.424876, 32.935062, 37.586178, 40.918719, 43.327073, 48.005151, 49.773832,
];

/** Riemann von Mangoldt: Anzahl der Nullstellen mit Imaginärteil bis t, angenähert */
function zeroCount(t: number): number {
  const x = t / (2 * Math.PI);
  return x * Math.log(x) - x + 7 / 8;
}

const zeroCache: number[] = [...KNOWN_ZEROS];

/**
 * Imaginärteil der n. Nullstelle (n ab 1). Die ersten zehn sind bekannt,
 * danach Näherung über zeroCount(t) = n − 1/2 per Bisektion.
 */
export function riemannZero(n: number): number {
  while (zeroCache.length < n) {
    const target = zeroCache.length + 1 - 0.5;
    let lo = zeroCache[zeroCache.length - 1] ?? 14;
    let hi = lo + 10;
    while (zeroCount(hi) < target) hi += 10;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      if (zeroCount(mid) < target) lo = mid;
      else hi = mid;
    }
    zeroCache.push(hi);
  }
  return zeroCache[n - 1] ?? 0;
}

/** Anzahl der Nullstellen, deren Stufe floor(t) höchstens stage ist */
export function zerosUpTo(stage: number): number {
  let n = 0;
  while (Math.floor(riemannZero(n + 1)) <= stage) n += 1;
  return n;
}

/** Stufe der Riemann Spirale liegt auf einer Nullstelle */
export function isZeroStage(stage: number): boolean {
  return zerosUpTo(stage) > zerosUpTo(stage - 1);
}

/** Collatz Regel: gerade Zahlen halbieren, ungerade ×3 + 1 */
export function collatzNext(n: number): number {
  return n % 2 === 0 ? n / 2 : 3 * n + 1;
}

/** Schritte von n bis 1 nach der Collatz Regel */
export function collatzSteps(n: number): number {
  let steps = 0;
  let value = n;
  while (value > 1) {
    value = collatzNext(value);
    steps += 1;
  }
  return steps;
}

/** Startzahl der Collatz Stufe L */
export function collatzStart(level: number): number {
  return level + 1;
}
