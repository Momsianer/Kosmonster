import { describe, expect, it } from 'vitest';
import { MONSTER_TYPES, SPECIES, SPECIES_IDS, speciesInZone, TYPE_COLORS } from '../src/data/monsters';
import { t } from '../src/i18n';

describe('Monsterdaten', () => {
  it('10 Arten mit eindeutigen Ids in Reihenfolge', () => {
    expect(SPECIES).toHaveLength(10);
    expect(SPECIES.map((s) => s.id)).toEqual([...SPECIES_IDS]);
  });

  it('5 Arten pro Typ, jeder Typ hat eine Farbe', () => {
    for (const type of MONSTER_TYPES) {
      expect(SPECIES.filter((s) => s.type === type)).toHaveLength(5);
      expect(TYPE_COLORS[type]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('Spritepfad nach Schema assets/monster/art_001.png', () => {
    expect(SPECIES[0]!.sprite).toBe('assets/monster/art_001.png');
    for (const s of SPECIES) expect(s.sprite).toBe(`assets/monster/${s.id}.png`);
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
