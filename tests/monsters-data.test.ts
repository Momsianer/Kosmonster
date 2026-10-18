import { describe, expect, it } from 'vitest';
import {
  legendariesInZone,
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
    expect(SPECIES).toHaveLength(128);
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

  it('Seltenheit nach Vorkommen: selten ab 25, episch ab 100, legendär nur als Systemboss', () => {
    for (const s of SPECIES) {
      if (s.rarity === 'rare') expect(s.minZone).toBeGreaterThanOrEqual(25);
      if (s.rarity === 'epic') expect(s.minZone).toBeGreaterThanOrEqual(100);
    }
    const legendary = SPECIES.filter((s) => s.rarity === 'legendary');
    expect(legendary).toHaveLength(8);
    for (let z = 1; z <= 600; z++) expect(speciesInZone(z).some((s) => s.rarity === 'legendary')).toBe(false);
    for (let z = 1; z <= 600; z++) expect(speciesInZone(z, true).some((s) => s.rarity === 'mythic')).toBe(false);
    expect(legendariesInZone(100).length).toBeGreaterThan(0);
  });

  it('neue Arten erscheinen bis Zone 500', () => {
    expect(Math.max(...SPECIES.map((s) => s.minZone))).toBeLessThanOrEqual(500);
    expect(Math.max(...SPECIES.map((s) => s.minZone))).toBeGreaterThan(400);
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
