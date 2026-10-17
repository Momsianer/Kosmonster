/**
 * Kleiner, schneller Zufallsgenerator (mulberry32).
 * Der Zustand ist eine einzige Ganzzahl und steckt im Spielzustand,
 * damit Neuladen nicht neu würfelt und Tests reproduzierbar sind.
 */
export function nextRandom(holder: { rngState: number }): number {
  let t = (holder.rngState = (holder.rngState + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Wählt einen Eintrag nach Gewicht. Gibt undefined zurück, wenn alle Gewichte 0 sind. */
export function weightedPick<T>(
  holder: { rngState: number },
  items: readonly T[],
  weight: (item: T) => number,
): T | undefined {
  const total = items.reduce((sum, item) => sum + Math.max(0, weight(item)), 0);
  if (total <= 0) return undefined;
  let roll = nextRandom(holder) * total;
  for (const item of items) {
    roll -= Math.max(0, weight(item));
    if (roll < 0) return item;
  }
  return items[items.length - 1];
}
