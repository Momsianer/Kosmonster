import type { MonsterType } from './monsters';

/**
 * Konstellationen (CLAUDE.md Abschnitt 11): Kombinationen von Typen im Team.
 * Namen und Hinweise in de.ts unter constellation.<id>, Boni in balancing.ts unter constellations.
 */

export interface TeamShape {
  /** Anzahl je Typ im Team */
  counts: Record<MonsterType, number>;
  size: number;
}

export interface ConstellationData {
  id: string;
  /** Versteckte Konstellationen erscheinen bis zur Entdeckung als Silhouette */
  hidden: boolean;
  test: (team: TeamShape) => boolean;
}

const has = (t: TeamShape, ...types: MonsterType[]) => types.every((type) => t.counts[type] > 0);

function trio<T extends MonsterType>(type: T) {
  return { id: `trio_${type}` as `trio_${T}`, hidden: false, test: (t: TeamShape) => t.counts[type] >= 3 };
}

export const CONSTELLATIONS = [
  trio('prim'),
  trio('fibonacci'),
  trio('pi'),
  trio('euler'),
  trio('null'),
  trio('unendlich'),
  trio('fraktal'),
  trio('vektor'),
  { id: 'primzwillinge' as const, hidden: true, test: (t) => t.counts.prim === 2 },
  { id: 'goldenerSchnitt' as const, hidden: true, test: (t) => has(t, 'fibonacci', 'euler') },
  { id: 'eulerscheIdentitaet' as const, hidden: true, test: (t) => has(t, 'euler', 'pi', 'null', 'unendlich') },
  { id: 'kreisUndSpirale' as const, hidden: true, test: (t) => has(t, 'pi', 'fibonacci') },
  { id: 'leereUnendlichkeit' as const, hidden: true, test: (t) => has(t, 'null', 'unendlich') },
  { id: 'selbstaehnlichkeit' as const, hidden: true, test: (t) => t.counts.fraktal >= 5 },
  { id: 'richtungssinn' as const, hidden: true, test: (t) => has(t, 'vektor', 'fraktal') },
  { id: 'primfaktoren' as const, hidden: true, test: (t) => has(t, 'prim', 'vektor') },
  { id: 'vollstaendigeBasis' as const, hidden: true, test: (t) => Object.values(t.counts).every((n) => n > 0) },
  { id: 'harmonischeReihe' as const, hidden: true, test: (t) => has(t, 'pi', 'euler', 'fibonacci') },
  { id: 'nullteiler' as const, hidden: true, test: (t) => t.counts.null >= 2 },
  { id: 'grenzwert' as const, hidden: true, test: (t) => has(t, 'euler', 'unendlich') },
  { id: 'quadraturDesKreises' as const, hidden: true, test: (t) => t.counts.pi >= 4 },
  { id: 'mersenne' as const, hidden: true, test: (t) => t.counts.prim >= 3 && t.counts.null >= 1 },
  { id: 'mandelbrot' as const, hidden: true, test: (t) => has(t, 'fraktal', 'unendlich', 'null') },
  { id: 'einheitsvektor' as const, hidden: true, test: (t) => t.size === 1 && t.counts.vektor === 1 },
] as const satisfies readonly ConstellationData[];

export type ConstellationId = (typeof CONSTELLATIONS)[number]['id'];

const IDS: readonly string[] = CONSTELLATIONS.map((c) => c.id);

export function isConstellationId(id: unknown): id is ConstellationId {
  return typeof id === 'string' && IDS.includes(id);
}
