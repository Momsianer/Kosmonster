/**
 * Monsterarten. Namen und Designs erstellt Moritz, hier stehen nur Platzhalter.
 * Namen liegen in src/i18n/de.ts unter species.<id>.
 * Fertige Sprites einfach unter assets/monster/<id>.png ablegen.
 */

export const MONSTER_TYPES = ['prim', 'fibonacci'] as const;
export type MonsterType = (typeof MONSTER_TYPES)[number];

export const TYPE_COLORS: Record<MonsterType, string> = {
  prim: '#d6453d',
  fibonacci: '#e3b341',
};

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export const SPECIES_IDS = [
  'art_001',
  'art_002',
  'art_003',
  'art_004',
  'art_005',
  'art_006',
  'art_007',
  'art_008',
  'art_009',
  'art_010',
] as const;
export type SpeciesId = (typeof SPECIES_IDS)[number];

export interface SpeciesData {
  id: SpeciesId;
  /** Laufende Nummer für Platzhalter und Sammlung */
  number: number;
  type: MonsterType;
  rarity: Rarity;
  /** DPS auf Level 1 ohne Multiplikatoren */
  baseDps: number;
  /** Kosten für den Aufstieg von Level 0 auf 1, Grundlage aller Levelkosten */
  baseCost: number;
  /** Erste Zone, in der die Art erscheint */
  minZone: number;
  /** Letzte Zone, in der die Art erscheint, null = ohne Ende */
  maxZone: number | null;
  sprite: string;
}

function species(
  number: number,
  type: MonsterType,
  rarity: Rarity,
  baseDps: number,
  baseCost: number,
  minZone: number,
  maxZone: number | null,
): SpeciesData {
  const id = `art_${String(number).padStart(3, '0')}` as SpeciesId;
  return { id, number, type, rarity, baseDps, baseCost, minZone, maxZone, sprite: `assets/monster/${id}.png` };
}

export const SPECIES: readonly SpeciesData[] = [
  species(1, 'prim', 'common', 1, 40, 1, 15),
  species(2, 'fibonacci', 'common', 1, 40, 1, 15),
  species(3, 'prim', 'uncommon', 3, 80, 3, 25),
  species(4, 'fibonacci', 'uncommon', 7, 200, 5, 25),
  species(5, 'prim', 'common', 27, 700, 8, 35),
  species(6, 'fibonacci', 'common', 155, 4100, 12, 40),
  species(7, 'prim', 'uncommon', 2150, 57_000, 18, 50),
  species(8, 'fibonacci', 'uncommon', 46_000, 1.2e6, 25, 60),
  species(9, 'prim', 'common', 1.5e6, 4e7, 33, null),
  species(10, 'fibonacci', 'common', 8e7, 2.1e9, 42, null),
];

const BY_ID = new Map<string, SpeciesData>(SPECIES.map((s) => [s.id, s]));

export function getSpecies(id: string): SpeciesData | undefined {
  return BY_ID.get(id);
}

export function isSpeciesId(id: unknown): id is SpeciesId {
  return typeof id === 'string' && BY_ID.has(id);
}

/** Alle Arten, die in Zone z erscheinen können */
export function speciesInZone(zone: number): SpeciesData[] {
  return SPECIES.filter((s) => zone >= s.minZone && (s.maxZone === null || zone <= s.maxZone));
}
