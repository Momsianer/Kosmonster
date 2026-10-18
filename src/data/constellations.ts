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
  hidden: boolean;
  /** Bonus auf Team DPS, Faktor als Schlüssel in balancing.constellations */
  test: (team: TeamShape) => boolean;
}

const has = (t: TeamShape, ...types: MonsterType[]) => types.every((type) => t.counts[type] > 0);

function trio(type: MonsterType): ConstellationData {
  return { id: `trio_${type}`, hidden: false, test: (t) => t.counts[type] >= 3 };
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
  { id: 'primzwillinge', hidden: true, test: (t) => t.counts.prim === 2 },
  { id: 'goldenerSchnitt', hidden: true, test: (t) => has(t, 'fibonacci', 'euler') },
  { id: 'eulerscheIdentitaet', hidden: true, test: (t) => has(t, 'euler', 'pi', 'null', 'unendlich') },
  { id: 'kreisUndSpirale', hidden: true, test: (t) => has(t, 'pi', 'fibonacci') },
  { id: 'leereUnendlichkeit', hidden: true, test: (t) => has(t, 'null', 'unendlich') },
  { id: 'selbstaehnlichkeit', hidden: true, test: (t) => t.counts.fraktal >= 5 },
  { id: 'richtungssinn', hidden: true, test: (t) => has(t, 'vektor', 'fraktal') },
  { id: 'primfaktoren', hidden: true, test: (t) => has(t, 'prim', 'vektor') },
  { id: 'vollstaendigeBasis', hidden: true, test: (t) => Object.values(t.counts).every((n) => n > 0) },
  { id: 'harmonischeReihe', hidden: true, test: (t) => has(t, 'pi', 'euler', 'fibonacci') },
  { id: 'nullteiler', hidden: true, test: (t) => t.counts.null >= 2 },
  { id: 'grenzwert', hidden: true, test: (t) => has(t, 'euler', 'unendlich') },
  { id: 'quadraturDesKreises', hidden: true, test: (t) => t.counts.pi >= 4 },
  { id: 'mersenne', hidden: true, test: (t) => t.counts.prim >= 3 && t.counts.null >= 1 },
  { id: 'mandelbrot', hidden: true, test: (t) => has(t, 'fraktal', 'unendlich', 'null') },
  { id: 'einheitsvektor', hidden: true, test: (t) => t.size === 1 && t.counts.vektor === 1 },
] as const satisfies readonly ConstellationData[];

export type ConstellationId = (typeof CONSTELLATIONS)[number]['id'];

export function isConstellationId(id: unknown): id is ConstellationId {
  return typeof id === 'string' && CONSTELLATIONS.some((c) => c.id === id);
}
