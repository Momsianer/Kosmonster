import { BALANCING } from './balancing';
import { MONSTER_TYPES, type MonsterType } from './types';

/**
 * Planetentypen: Jedes Sternsystem (zonesPerSystem Zonen) stärkt einen Monstertyp
 * und schwächt einen anderen. Die Folge ist fest, damit sich Systeme wiedererkennen lassen.
 */
export interface PlanetData {
  system: number;
  boosted: MonsterType;
  weakened: MonsterType;
}

export function planetForSystem(system: number): PlanetData {
  const n = MONSTER_TYPES.length;
  const index = (((system - 1) * 3) % n + n) % n;
  const boosted = MONSTER_TYPES[index]!;
  const weakened = MONSTER_TYPES[(index + n / 2) % n]!;
  return { system, boosted, weakened };
}

export function planetForZone(zone: number): PlanetData {
  return planetForSystem(Math.ceil(zone / BALANCING.world.zonesPerSystem));
}
