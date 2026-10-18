/**
 * Monsterarten. Namen und Designs erstellt Moritz, hier stehen nur Platzhalter.
 * Namen liegen in src/i18n/de.ts unter species.<id>.
 * Fertige Sprites einfach unter assets/monster/<id>.png ablegen.
 */

import { BALANCING } from './balancing';
import { enemyHp } from '../core/formulas';
import { planetForSystem } from './planets';
import { MONSTER_TYPES, type MonsterType } from './types';

export { MONSTER_TYPES, type MonsterType };

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'boss';

export const TYPE_COLORS: Record<MonsterType, string> = {
  prim: '#d6453d',
  fibonacci: '#e3b341',
  pi: '#3d7ed6',
  euler: '#3dbd5c',
  null: '#33333d',
  unendlich: '#9b5de5',
  fraktal: '#2ec4b6',
  vektor: '#b8c2cc',
};

/** Typen mit dunkler Farbe brauchen hellen Text im Platzhalter */
export const DARK_TYPES: readonly MonsterType[] = ['null'];

export const RARITY_COLORS: Record<Rarity, string> = {
  common: '#9097b5',
  uncommon: '#5cc26b',
  rare: '#4a90e2',
  epic: '#b06ae0',
  legendary: '#f2a53c',
  mythic: '#ff5c8a',
  boss: '#e8604c',
};

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
  'art_011',
  'art_012',
  'art_013',
  'art_014',
  'art_015',
  'art_016',
  'art_017',
  'art_018',
  'art_019',
  'art_020',
  'art_021',
  'art_022',
  'art_023',
  'art_024',
  'art_025',
  'art_026',
  'art_027',
  'art_028',
  'art_029',
  'art_030',
  'art_031',
  'art_032',
  'art_033',
  'art_034',
  'art_035',
  'art_036',
  'art_037',
  'art_038',
  'art_039',
  'art_040',
  'art_041',
  'art_042',
  'art_043',
  'art_044',
  'art_045',
  'art_046',
  'art_047',
  'art_048',
  'art_049',
  'art_050',
  'art_051',
  'art_052',
  'art_053',
  'art_054',
  'art_055',
  'art_056',
  'art_057',
  'art_058',
  'art_059',
  'art_060',
  'art_061',
  'art_062',
  'art_063',
  'art_064',
  'art_065',
  'art_066',
  'art_067',
  'art_068',
  'art_069',
  'art_070',
  'art_071',
  'art_072',
  'art_073',
  'art_074',
  'art_075',
  'art_076',
  'art_077',
  'art_078',
  'art_079',
  'art_080',
  'art_081',
  'art_082',
  'art_083',
  'art_084',
  'art_085',
  'art_086',
  'art_087',
  'art_088',
  'art_089',
  'art_090',
  'art_091',
  'art_092',
  'art_093',
  'art_094',
  'art_095',
  'art_096',
  'art_097',
  'art_098',
  'art_099',
  'art_100',
  'art_101',
  'art_102',
  'art_103',
  'art_104',
  'art_105',
  'art_106',
  'art_107',
  'art_108',
  'art_109',
  'art_110',
  'art_111',
  'art_112',
  'art_113',
  'art_114',
  'art_115',
  'art_116',
  'art_117',
  'art_118',
  'art_119',
  'art_120',
  'art_121',
  'art_122',
  'art_123',
  'art_124',
  'art_125',
  'art_126',
  'art_127',
  'art_128',
  'boss_001',
  'boss_002',
  'boss_003',
  'boss_004',
  'boss_005',
  'boss_006',
  'boss_007',
  'boss_008',
  'boss_009',
  'boss_010',
  'boss_011',
  'boss_012',
  'boss_013',
  'boss_014',
  'boss_015',
  'boss_016',
  'boss_017',
  'boss_018',
  'boss_019',
  'boss_020',
  'boss_021',
  'boss_022',
  'boss_023',
  'boss_024',
  'boss_025',
  'boss_026',
  'boss_027',
  'boss_028',
  'boss_029',
  'boss_030',
  'boss_031',
  'boss_032',
  'boss_033',
  'boss_034',
  'boss_035',
  'boss_036',
  'boss_037',
  'boss_038',
  'boss_039',
  'boss_040',
  'boss_041',
  'boss_042',
  'boss_043',
  'boss_044',
  'boss_045',
  'boss_046',
  'boss_047',
  'boss_048',
  'boss_049',
  'boss_050',
  'boss_051',
  'boss_052',
  'boss_053',
  'boss_054',
  'boss_055',
  'boss_056',
  'boss_057',
  'boss_058',
  'boss_059',
  'boss_060',
  'boss_061',
  'boss_062',
  'boss_063',
  'boss_064',
  'boss_065',
  'boss_066',
  'boss_067',
  'boss_068',
  'boss_069',
  'boss_070',
  'boss_071',
  'boss_072',
  'boss_073',
  'boss_074',
  'boss_075',
  'boss_076',
  'boss_077',
  'boss_078',
  'boss_079',
  'boss_080',
  'boss_081',
  'boss_082',
  'boss_083',
  'boss_084',
  'boss_085',
  'boss_086',
  'boss_087',
  'boss_088',
  'boss_089',
  'boss_090',
  'boss_091',
  'boss_092',
  'boss_093',
  'boss_094',
  'boss_095',
  'boss_096',
  'boss_097',
  'boss_098',
  'boss_099',
  'boss_100',
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
  /** Mögliche Evolutionsstufen (0 bei Mythischen und Bossen, sonst 1 oder 2) */
  evolutions: number;
  sprite: string;
  /** Bossmonster: Miniboss (Zone 5 des Systems) oder Hauptboss (Zone 10), sonst null */
  boss: 'mini' | 'main' | null;
  /** Gebiet, in dem die Art vorkommt, null bei Mythischen und Bossen */
  area: number | null;
}

function species(
  number: number,
  type: MonsterType,
  rarity: Rarity,
  baseDps: number,
  baseCost: number,
  minZone: number,
  maxZone: number | null,
  evolutions = 1,
): SpeciesData {
  const id = `art_${String(number).padStart(3, '0')}` as SpeciesId;
  return {
    id,
    number,
    type,
    rarity,
    baseDps,
    baseCost,
    minZone,
    maxZone,
    evolutions,
    sprite: `assets/monster/${id}.png`,
    boss: null,
    area: null,
  };
}


/** Gebiet (Sternsystem), in dem eine Zone liegt, nach `areas` Gebieten wiederholen sich die Pools */
export function areaForZone(zone: number): number {
  const system = Math.ceil(zone / BALANCING.world.zonesPerSystem);
  return ((system - 1) % BALANCING.pools.areas) + 1;
}

/** Seltenheit der Plätze im Pool: zwei gewöhnliche, eine ungewöhnliche, dann der seltene Platz */
const NORMAL_SLOTS: readonly Rarity[] = ['common', 'common', 'uncommon'];

/** Seltenheit des seltenen Platzes: legendär in jedem legendaryEvery. Gebiet, sonst selten bzw. episch */
function rareSlotRarity(area: number): Rarity {
  const { legendaryEvery, epicFromArea } = BALANCING.pools;
  if (area % legendaryEvery === 0) return 'legendary';
  return area >= epicFromArea ? 'epic' : 'rare';
}

/**
 * Arten des Hauptspiels: Jedes Gebiet hat drei normale Arten und eine seltene.
 * art_001 bis art_004 gehören zu Gebiet 1, art_005 bis art_008 zu Gebiet 2 und so weiter.
 * Die Typen wechseln so, dass jeder Typ genau 15 Arten hat.
 * basisDPS = hp(erste Zone des Gebiets + zoneOffset[Platz]) * dpsPerHp, basisKosten = basisDPS * costPerDps.
 */
function areaSpecies(area: number, slot: number): SpeciesData {
  const { dpsPerHp, costPerDps, zoneOffset } = BALANCING.pools;
  const { zonesPerSystem } = BALANCING.world;
  const number = (area - 1) * (NORMAL_SLOTS.length + 1) + slot + 1;
  const rarity = slot < NORMAL_SLOTS.length ? NORMAL_SLOTS[slot]! : rareSlotRarity(area);
  const type = MONSTER_TYPES[((area - 1) * (NORMAL_SLOTS.length + 1) + slot) % MONSTER_TYPES.length]!;
  const minZone = (area - 1) * zonesPerSystem + 1;
  const baseDps = enemyHp(minZone + (zoneOffset[slot] ?? 0))
    .mul(dpsPerHp)
    .toNumber();
  const evolutions = rarity === 'legendary' ? 1 : (area + slot) % 2 === 0 ? 2 : 1;
  return {
    ...species(number, type, rarity, baseDps, baseDps * costPerDps, minZone, minZone + zonesPerSystem - 1, evolutions),
    area,
  };
}

const AREA_SPECIES: readonly SpeciesData[] = Array.from({ length: BALANCING.pools.areas }, (_, a) =>
  Array.from({ length: NORMAL_SLOTS.length + 1 }, (_, slot) => areaSpecies(a + 1, slot)),
).flat();

const WILD_SPECIES: readonly SpeciesData[] = [
  ...AREA_SPECIES,
  // Mythische: erscheinen nie als Gegner, sondern über Sonderbedingungen im Endgame
  species(121, 'prim', 'mythic', 1e19, 2.6e20, 1, null, 0),
  species(122, 'fibonacci', 'mythic', 4e19, 1.04e21, 1, null, 0),
  species(123, 'pi', 'mythic', 1.6e20, 4.16e21, 1, null, 0),
  species(124, 'euler', 'mythic', 6.4e20, 1.66e22, 1, null, 0),
  species(125, 'null', 'mythic', 2.56e21, 6.66e22, 1, null, 0),
  species(126, 'unendlich', 'mythic', 1.02e22, 2.66e23, 1, null, 0),
  species(127, 'fraktal', 'mythic', 4.1e22, 1.07e24, 1, null, 0),
  species(128, 'vektor', 'mythic', 1.64e23, 4.26e24, 1, null, 0),
];

/**
 * Bossmonster: boss_001 ist der Miniboss von System 1 (Zone 5), boss_002 dessen Hauptboss
 * (Zone 10), boss_003 der Miniboss von System 2 und so weiter.
 */
function bossSpecies(index: number): SpeciesData {
  const system = Math.floor(index / 2) + 1;
  const kind = index % 2 === 0 ? 'mini' : 'main';
  const { zonesPerSystem } = BALANCING.world;
  const { miniDpsFactor, mainDpsFactor, costPerDps } = BALANCING.bosses;
  const zone = kind === 'mini' ? system * zonesPerSystem - BALANCING.boss.bossEvery : system * zonesPerSystem;
  const baseDps = enemyHp(zone).mul(kind === 'mini' ? miniDpsFactor : mainDpsFactor).toNumber();
  const id = `boss_${String(index + 1).padStart(3, '0')}` as SpeciesId;
  return {
    id,
    number: index + 1,
    type: planetForSystem(system).boosted,
    rarity: 'boss',
    baseDps,
    baseCost: baseDps * costPerDps,
    minZone: zone,
    maxZone: zone,
    evolutions: 0,
    sprite: `assets/monster/${id}.png`,
    boss: kind,
    area: null,
  };
}

export const BOSS_SPECIES: readonly SpeciesData[] = Array.from({ length: BALANCING.bosses.systems * 2 }, (_, i) =>
  bossSpecies(i),
);

export const SPECIES: readonly SpeciesData[] = [...WILD_SPECIES, ...BOSS_SPECIES];

/** Die 120 Arten des Hauptspiels ohne Mythische und Bosse */
export const MAIN_SPECIES: readonly SpeciesData[] = SPECIES.filter((s) => s.rarity !== 'mythic' && !s.boss);

export const MYTHIC_IDS: readonly SpeciesId[] = SPECIES.filter((s) => s.rarity === 'mythic').map((s) => s.id);

const BY_ID = new Map<string, SpeciesData>(SPECIES.map((s) => [s.id, s]));

export function getSpecies(id: string): SpeciesData | undefined {
  return BY_ID.get(id);
}

export function isSpeciesId(id: unknown): id is SpeciesId {
  return typeof id === 'string' && BY_ID.has(id);
}

/** Die Arten im Pool des Gebiets einer Zone: drei normale und die seltene */
export function areaPool(zone: number): { normals: SpeciesData[]; rare: SpeciesData | null } {
  const area = areaForZone(zone);
  const pool = AREA_SPECIES.filter((s) => s.area === area);
  return { normals: pool.slice(0, NORMAL_SLOTS.length), rare: pool[NORMAL_SLOTS.length] ?? null };
}

/**
 * Chance, dass in einer Zone die seltene Art des Gebiets erscheint:
 * rareBaseChance in der ersten Zone des Gebiets, je weitere Zone +rareChancePerZone.
 */
export function rareSpawnChance(zone: number): number {
  const { rareBaseChance, rareChancePerZone } = BALANCING.pools;
  const step = (zone - 1) % BALANCING.world.zonesPerSystem;
  return rareBaseChance + rareChancePerZone * step;
}

/** Alle Arten, die in Zone z als normale Gegner erscheinen können (Pool des Gebiets) */
export function speciesInZone(zone: number): SpeciesData[] {
  const { normals, rare } = areaPool(zone);
  return rare ? [...normals, rare] : normals;
}

/** Das feste Bossmonster einer Bosszone, nach `systems` Sternsystemen wiederholen sie sich */
export function bossForZone(zone: number): SpeciesData | null {
  const { zonesPerSystem } = BALANCING.world;
  const inSystem = ((zone - 1) % zonesPerSystem) + 1;
  const kind = inSystem === zonesPerSystem ? 1 : inSystem === BALANCING.boss.bossEvery ? 0 : null;
  if (kind === null) return null;
  const system = Math.ceil(zone / zonesPerSystem);
  const index = ((system - 1) % BALANCING.bosses.systems) * 2 + kind;
  return BOSS_SPECIES[index] ?? null;
}
