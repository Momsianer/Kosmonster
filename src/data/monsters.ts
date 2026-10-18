/**
 * Monsterarten. Namen und Designs erstellt Moritz, hier stehen nur Platzhalter.
 * Namen liegen in src/i18n/de.ts unter species.<id>.
 * Fertige Sprites einfach unter assets/monster/<id>.png ablegen.
 */

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export const MONSTER_TYPES = ['prim', 'fibonacci', 'pi', 'euler', 'null', 'unendlich', 'fraktal', 'vektor'] as const;
export type MonsterType = (typeof MONSTER_TYPES)[number];

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
  /** Mögliche Evolutionsstufen (0 bei Mythischen, sonst 1 oder 2) */
  evolutions: number;
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
  evolutions = 1,
): SpeciesData {
  const id = `art_${String(number).padStart(3, '0')}` as SpeciesId;
  return { id, number, type, rarity, baseDps, baseCost, minZone, maxZone, evolutions, sprite: `assets/monster/${id}.png` };
}

/** Spritepfad je Evolutionsstufe: art_001.png, art_001_e1.png, art_001_e2.png */
export function spritePath(species: SpeciesData, stage: number): string {
  return stage > 0 ? `assets/monster/${species.id}_e${stage}.png` : species.sprite;
}

export const SPECIES: readonly SpeciesData[] = [
  species(1, 'prim', 'common', 1, 40, 1, 15),
  species(2, 'fibonacci', 'common', 1, 40, 1, 15),
  species(3, 'prim', 'uncommon', 3, 80, 3, 25, 2),
  species(4, 'fibonacci', 'uncommon', 7, 200, 5, 25),
  species(5, 'prim', 'common', 27, 700, 8, 35),
  species(6, 'fibonacci', 'common', 155, 4100, 12, 40, 2),
  species(7, 'prim', 'uncommon', 2150, 57_000, 18, 50),
  species(8, 'fibonacci', 'uncommon', 46_000, 1.2e6, 25, 60),
  species(9, 'prim', 'common', 1.5e6, 4e7, 33, null, 2),
  species(10, 'fibonacci', 'common', 8e7, 2.1e9, 42, null),
  species(11, 'pi', 'common', 1.9, 49, 2, 14),
  species(12, 'euler', 'common', 4.7, 122, 4, 18, 2),
  species(13, 'null', 'common', 11, 286, 6, 22),
  species(14, 'unendlich', 'common', 42, 1090, 9, 26),
  species(15, 'fraktal', 'common', 155, 4030, 12, 30, 2),
  species(16, 'vektor', 'common', 578, 15_000, 15, 34),
  species(17, 'pi', 'uncommon', 5170, 134_000, 20, 40),
  species(18, 'euler', 'uncommon', 29_800, 775_000, 24, 44, 2),
  species(19, 'null', 'uncommon', 172_000, 4.47e6, 28, 48),
  species(20, 'unendlich', 'uncommon', 994_000, 2.58e7, 32, 52),
  species(21, 'fraktal', 'uncommon', 5.73e6, 1.49e8, 36, 56, 2),
  species(22, 'vektor', 'uncommon', 3.31e7, 8.61e8, 40, 60),
  species(23, 'prim', 'rare', 46_200, 1.2e6, 25, 45),
  species(24, 'fibonacci', 'rare', 414_000, 1.08e7, 30, 50, 2),
  species(25, 'pi', 'rare', 3.7e6, 9.62e7, 35, 55),
  species(26, 'euler', 'rare', 3.31e7, 8.61e8, 40, 60),
  species(27, 'null', 'rare', 2.96e8, 7.7e9, 45, 65, 2),
  species(28, 'unendlich', 'rare', 2.65e9, 6.89e10, 50, 70),
  species(29, 'fraktal', 'rare', 2.37e10, 6.16e11, 55, 75),
  species(30, 'vektor', 'rare', 2.12e11, 5.51e12, 60, 80, 2),
  species(31, 'prim', 'common', 3.29e11, 8.55e12, 61, 91),
  species(32, 'fibonacci', 'common', 2.94e12, 7.64e13, 66, 98),
  species(33, 'pi', 'uncommon', 2.63e13, 6.84e14, 71, 104, 2),
  species(34, 'euler', 'common', 2.35e14, 6.11e15, 76, 110),
  species(35, 'null', 'uncommon', 2.11e15, 5.49e16, 81, 116),
  species(36, 'unendlich', 'rare', 1.88e16, 4.89e17, 86, 122, 2),
  species(37, 'fraktal', 'common', 1.09e17, 2.83e18, 90, 128),
  species(38, 'vektor', 'uncommon', 9.73e17, 2.53e19, 95, 134),
  species(39, 'prim', 'common', 8.7e18, 2.26e20, 100, 140, 2),
  species(40, 'fibonacci', 'rare', 7.79e19, 2.03e21, 105, 146),
  species(41, 'pi', 'epic', 6.97e20, 1.81e22, 110, 152),
  species(42, 'euler', 'common', 6.23e21, 1.62e23, 115, 159, 2),
  species(43, 'null', 'uncommon', 5.58e22, 1.45e24, 120, 165),
  species(44, 'unendlich', 'common', 4.99e23, 1.3e25, 125, 171),
  species(45, 'fraktal', 'uncommon', 4.46e24, 1.16e26, 130, 178, 2),
  species(46, 'vektor', 'rare', 3.99e25, 1.04e27, 135, 184),
  species(47, 'prim', 'common', 3.57e26, 9.28e27, 140, 190),
  species(48, 'fibonacci', 'epic', 7.03e26, 1.83e28, 145, 196, 2),
  species(49, 'pi', 'common', 1.21e27, 3.15e28, 149, 201),
  species(50, 'euler', 'rare', 2.38e27, 6.19e28, 154, 208),
  species(51, 'null', 'common', 4.68e27, 1.22e29, 159, 214, 2),
  species(52, 'unendlich', 'common', 9.21e27, 2.39e29, 164, 220),
  species(53, 'fraktal', 'uncommon', 1.81e28, 4.71e29, 169, 226),
  species(54, 'vektor', 'common', 3.57e28, 9.28e29, 174, 232, 2),
  species(55, 'prim', 'epic', 7.02e28, 1.83e30, 179, 239),
  species(56, 'fibonacci', 'rare', 1.38e29, 3.59e30, 184, 245),
  species(57, 'pi', 'common', 2.72e29, 7.07e30, 189, 251, 2),
  species(58, 'euler', 'uncommon', 5.35e29, 1.39e31, 194, 258),
  species(59, 'null', 'common', 1.05e30, 2.73e31, 199, 264),
  species(60, 'unendlich', 'rare', 1.81e30, 4.71e31, 203, 269, 2),
  species(61, 'fraktal', 'common', 3.56e30, 9.26e31, 208, 275),
  species(62, 'vektor', 'epic', 7.01e30, 1.82e32, 213, 281),
  species(63, 'prim', 'uncommon', 1.38e31, 3.59e32, 218, 288, 2),
  species(64, 'fibonacci', 'common', 2.72e31, 7.07e32, 223, 294),
  species(65, 'pi', 'uncommon', 5.34e31, 1.39e33, 228, 300),
  species(66, 'euler', 'rare', 1.05e32, 2.73e33, 233, 306, 2),
  species(67, 'null', 'common', 2.07e32, 5.38e33, 238, 312),
  species(68, 'unendlich', 'uncommon', 4.07e32, 1.06e34, 243, 319),
  species(69, 'fraktal', 'epic', 8.02e32, 2.09e34, 248, 325, 2),
  species(70, 'vektor', 'rare', 1.58e33, 4.11e34, 253, 331),
  species(71, 'prim', 'common', 3.11e33, 8.09e34, 258, 338),
  species(72, 'fibonacci', 'common', 5.34e33, 1.39e35, 262, 342, 2),
  species(73, 'pi', 'uncommon', 1.05e34, 2.73e35, 267, 349),
  species(74, 'euler', 'common', 2.07e34, 5.38e35, 272, 355),
  species(75, 'null', 'uncommon', 4.07e34, 1.06e36, 277, 361, 2),
  species(76, 'unendlich', 'epic', 8.01e34, 2.08e36, 282, 368),
  species(77, 'fraktal', 'common', 1.58e35, 4.11e36, 287, 374),
  species(78, 'vektor', 'uncommon', 3.1e35, 8.06e36, 292, 380, 2),
  species(79, 'prim', 'common', 6.1e35, 1.59e37, 297, 386),
  species(80, 'fibonacci', 'rare', 1.2e36, 3.12e37, 302, 392),
  species(81, 'pi', 'common', 2.36e36, 6.14e37, 307, 399, 2),
  species(82, 'euler', 'common', 4.65e36, 1.21e38, 312, 405),
  species(83, 'null', 'epic', 7.99e36, 2.08e38, 316, 410),
  species(84, 'unendlich', 'common', 1.57e37, 4.08e38, 321, 416, 2),
  species(85, 'fraktal', 'uncommon', 3.1e37, 8.06e38, 326, 422),
  species(86, 'vektor', 'rare', 6.09e37, 1.58e39, 331, 429),
  species(87, 'prim', 'common', 1.2e38, 3.12e39, 336, 435, 2),
  species(88, 'fibonacci', 'uncommon', 2.36e38, 6.14e39, 341, 441),
  species(89, 'pi', 'common', 4.64e38, 1.21e40, 346, 448),
  species(90, 'euler', 'epic', 9.14e38, 2.38e40, 351, 454, 2),
  species(91, 'null', 'common', 1.8e39, 4.68e40, 356, 460),
  species(92, 'unendlich', 'common', 3.54e39, 9.2e40, 361, 466),
  species(93, 'fraktal', 'uncommon', 6.97e39, 1.81e41, 366, 472, 2),
  species(94, 'vektor', 'common', 1.37e40, 3.56e41, 371, 479),
  species(95, 'pi', 'uncommon', 2.36e40, 6.14e41, 375, 484),
  species(96, 'euler', 'rare', 4.64e40, 1.21e42, 380, 490, 2),
  species(97, 'null', 'epic', 9.13e40, 2.37e42, 385, 496),
  species(98, 'unendlich', 'uncommon', 1.8e41, 4.68e42, 390, 502),
  species(99, 'fraktal', 'common', 3.54e41, 9.2e42, 395, 509, 2),
  species(100, 'vektor', 'rare', 6.96e41, 1.81e43, 400, 515),
  species(101, 'pi', 'epic', 8.7e18, 2.26e20, 100, 180),
  species(102, 'euler', 'epic', 6.19e25, 1.61e27, 136, 216, 2),
  species(103, 'null', 'epic', 2.72e28, 7.07e29, 172, 252),
  species(104, 'unendlich', 'epic', 3.56e30, 9.26e31, 208, 288),
  species(105, 'fraktal', 'epic', 4.66e32, 1.21e34, 244, 324, 2),
  species(106, 'vektor', 'epic', 6.11e34, 1.59e36, 280, 360),
  species(107, 'pi', 'epic', 7.99e36, 2.08e38, 316, 396),
  species(108, 'euler', 'epic', 1.05e39, 2.73e40, 352, 432, 2),
  species(109, 'null', 'epic', 1.37e41, 3.56e42, 388, 468),
  species(110, 'unendlich', 'epic', 1.79e43, 4.65e44, 424, 504),
  species(111, 'fraktal', 'epic', 2.35e45, 6.11e46, 460, null, 2),
  species(112, 'vektor', 'epic', 3.07e47, 7.98e48, 496, null),
  species(113, 'prim', 'legendary', 8.7e18, 2.26e20, 100, 200),
  species(114, 'fibonacci', 'legendary', 1.38e27, 3.59e28, 150, 250, 2),
  species(115, 'pi', 'legendary', 1.21e30, 3.15e31, 200, 300),
  species(116, 'euler', 'legendary', 1.05e33, 2.73e34, 250, 350),
  species(117, 'null', 'legendary', 9.16e35, 2.38e37, 300, 400, 2),
  species(118, 'unendlich', 'legendary', 7.98e38, 2.07e40, 350, 450),
  species(119, 'fraktal', 'legendary', 6.96e41, 1.81e43, 400, 500),
  species(120, 'vektor', 'legendary', 6.06e44, 1.58e46, 450, 550, 2),
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

/** Die 120 Arten des Hauptspiels ohne Mythische */
export const MAIN_SPECIES: readonly SpeciesData[] = SPECIES.filter((s) => s.rarity !== 'mythic');

export const MYTHIC_IDS: readonly SpeciesId[] = SPECIES.filter((s) => s.rarity === 'mythic').map((s) => s.id);

const BY_ID = new Map<string, SpeciesData>(SPECIES.map((s) => [s.id, s]));

export function getSpecies(id: string): SpeciesData | undefined {
  return BY_ID.get(id);
}

export function isSpeciesId(id: unknown): id is SpeciesId {
  return typeof id === 'string' && BY_ID.has(id);
}

/** Alle Arten, die in Zone z erscheinen können (legendäre nur als Systemboss, mythische nie) */
export function speciesInZone(zone: number, includeLegendary = false): SpeciesData[] {
  return SPECIES.filter(
    (s) =>
      s.rarity !== 'mythic' &&
      zone >= s.minZone &&
      (s.maxZone === null || zone <= s.maxZone) &&
      (includeLegendary ? true : s.rarity !== 'legendary'),
  );
}

/** Legendäre Arten, die als Systemboss in Zone z erscheinen können */
export function legendariesInZone(zone: number): SpeciesData[] {
  return speciesInZone(zone, true).filter((s) => s.rarity === 'legendary');
}
