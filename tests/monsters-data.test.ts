import { describe, expect, it } from 'vitest';
import { enemyHp, enemyKind } from '../src/core/formulas';
import { BALANCING } from '../src/data/balancing';
import { planetForZone } from '../src/data/planets';
import {
  areaForZone,
  areaPool,
  BOSS_SPECIES,
  bossForZone,
  rareSpawnChance,
  MAIN_SPECIES,
  MONSTER_TYPES,
  MYTHIC_IDS,
  SPECIES,
  SPECIES_IDS,
  speciesInZone,
  TYPE_COLORS,
} from '../src/data/monsters';
import { t } from '../src/i18n';

describe('Monsterdaten', () => {
  it('120 Arten im Hauptspiel und 8 Mythische mit eindeutigen Ids in Reihenfolge', () => {
    expect(MAIN_SPECIES).toHaveLength(120);
    expect(SPECIES).toHaveLength(128 + BOSS_SPECIES.length);
    expect(SPECIES.map((s) => s.id)).toEqual([...SPECIES_IDS]);
    expect(MYTHIC_IDS).toHaveLength(8);
  });

  it('8 Typen mit je 15 Arten und einer mythischen Art, jeder Typ hat eine Farbe', () => {
    expect(MONSTER_TYPES).toHaveLength(8);
    for (const type of MONSTER_TYPES) {
      expect(MAIN_SPECIES.filter((s) => s.type === type)).toHaveLength(15);
      expect(SPECIES.filter((s) => s.type === type && s.rarity === 'mythic')).toHaveLength(1);
      expect(TYPE_COLORS[type]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('Spritepfad nach Schema assets/monster/art_001.png', () => {
    expect(SPECIES[0]!.sprite).toBe('assets/monster/art_001.png');
    for (const s of SPECIES) expect(s.sprite).toBe(`assets/monster/${s.id}.png`);
  });

  it('jedes Gebiet hat zwei gewöhnliche, eine ungewöhnliche und eine seltene Art', () => {
    for (let area = 1; area <= BALANCING.pools.areas; area++) {
      const zone = (area - 1) * BALANCING.world.zonesPerSystem + 1;
      const { normals, rare } = areaPool(zone);
      expect(normals.map((s) => s.rarity)).toEqual(['common', 'common', 'uncommon']);
      const expected =
        area % BALANCING.pools.legendaryEvery === 0 ? 'legendary' : area >= BALANCING.pools.epicFromArea ? 'epic' : 'rare';
      expect(rare!.rarity).toBe(expected);
      for (const s of [...normals, rare!]) {
        expect(s.area).toBe(area);
        expect(s.minZone).toBe(zone);
        expect(s.maxZone).toBe(zone + BALANCING.world.zonesPerSystem - 1);
      }
    }
    expect(SPECIES.filter((s) => s.rarity === 'legendary')).toHaveLength(
      BALANCING.pools.areas / BALANCING.pools.legendaryEvery,
    );
  });

  it('Arten kommen nur in ihrem Gebiet vor, danach wiederholen sich die Pools', () => {
    expect(speciesInZone(1).map((s) => s.id)).toEqual(['art_001', 'art_002', 'art_003', 'art_004']);
    expect(speciesInZone(10).map((s) => s.id)).toEqual(['art_001', 'art_002', 'art_003', 'art_004']);
    expect(speciesInZone(11).map((s) => s.id)).toEqual(['art_005', 'art_006', 'art_007', 'art_008']);
    const last = BALANCING.pools.areas * BALANCING.world.zonesPerSystem;
    expect(areaForZone(last)).toBe(BALANCING.pools.areas);
    expect(areaForZone(last + 1)).toBe(1);
    expect(speciesInZone(last + 1).map((s) => s.id)).toEqual(speciesInZone(1).map((s) => s.id));
    for (let z = 1; z <= 600; z++) {
      expect(speciesInZone(z).some((s) => s.rarity === 'mythic' || s.boss !== null)).toBe(false);
    }
  });

  it('seltene Art: 1 % in der ersten Zone des Gebiets, je Zone +0,25 %', () => {
    expect(rareSpawnChance(11)).toBeCloseTo(0.01, 10);
    expect(rareSpawnChance(12)).toBeCloseTo(0.0125, 10);
    expect(rareSpawnChance(13)).toBeCloseTo(0.015, 10);
    expect(rareSpawnChance(19)).toBeCloseTo(0.03, 10);
    expect(rareSpawnChance(21)).toBeCloseTo(0.01, 10);
  });

  it('Arten eines Gebiets sind gestaffelt stark wie Arten späterer Zonen', () => {
    const { normals, rare } = areaPool(21);
    BALANCING.pools.zoneOffset.forEach((offset, slot) => {
      const species = slot < normals.length ? normals[slot]! : rare!;
      expect(species.baseDps).toBeCloseTo(enemyHp(21 + offset).toNumber() * BALANCING.pools.dpsPerHp, 4);
      expect(species.baseCost).toBeCloseTo(species.baseDps * BALANCING.pools.costPerDps, 4);
    });
  });

  it('jede Zone hat mindestens eine Art', () => {
    for (let z = 1; z <= 600; z++) expect(speciesInZone(z).length).toBeGreaterThan(0);
  });

  it('Zonenbereiche und Werte sind sinnvoll', () => {
    for (const s of SPECIES) {
      expect(s.minZone).toBeGreaterThanOrEqual(1);
      if (s.maxZone !== null) expect(s.maxZone).toBeGreaterThanOrEqual(s.minZone);
      expect(s.baseDps).toBeGreaterThan(0);
      expect(s.baseCost).toBeGreaterThan(0);
    }
  });

  it('jede Art und jeder Typ hat einen Namen', () => {
    for (const s of SPECIES) expect(t(`species.${s.id}`)).not.toBe(`species.${s.id}`);
    for (const type of MONSTER_TYPES) expect(t(`types.${type}.name`)).not.toBe(`types.${type}.name`);
  });
});

describe('Bossmonster', () => {
  it('je Sternsystem ein Miniboss in Zone 5 und ein Hauptboss in Zone 10', () => {
    expect(BOSS_SPECIES).toHaveLength(BALANCING.bosses.systems * 2);
    expect(bossForZone(5)!.id).toBe('boss_001');
    expect(bossForZone(10)!.id).toBe('boss_002');
    expect(bossForZone(15)!.id).toBe('boss_003');
    expect(bossForZone(5)!.boss).toBe('mini');
    expect(bossForZone(10)!.boss).toBe('main');
    expect(bossForZone(7)).toBeNull();
    for (let z = 1; z <= 600; z++) expect(bossForZone(z) !== null).toBe(enemyKind(z) !== 'normal');
  });

  it('wiederholen sich nach den letzten Systemen', () => {
    const zones = BALANCING.bosses.systems * BALANCING.world.zonesPerSystem;
    expect(bossForZone(zones + 5)!.id).toBe('boss_001');
    expect(bossForZone(zones + 10)!.id).toBe('boss_002');
  });

  it('Typ passt zum Planeten, keine Evolution, Sprite nach Schema', () => {
    for (let z = 5; z <= 500; z += 5) {
      const boss = bossForZone(z)!;
      expect(boss.type).toBe(planetForZone(z).boosted);
      expect(boss.evolutions).toBe(0);
      expect(boss.sprite).toBe(`assets/monster/${boss.id}.png`);
      expect(boss.rarity).toBe('boss');
    }
  });

  it('etwas stärker als gewöhnliche Arten der Zone, sehr schwer zu fangen', () => {
    const boss = bossForZone(10)!;
    expect(boss.baseDps).toBeCloseTo(enemyHp(10).toNumber() * BALANCING.bosses.mainDpsFactor, 6);
    expect(boss.baseCost).toBeCloseTo(boss.baseDps * BALANCING.bosses.costPerDps, 6);
    expect(bossForZone(5)!.baseDps).toBeLessThan(boss.baseDps);
    expect(BALANCING.rarity.boss.catchChance).toBe(0.0025);
  });
});
