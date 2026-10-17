import { describe, expect, it } from 'vitest';
import { createInitialState, STATE_VERSION } from '../src/core/state';
import { BALANCING } from '../src/data/balancing';
import { migrate, MIGRATIONS } from '../src/save/migrations';

describe('Migrationen', () => {
  it('hebt Version 1 auf die aktuelle Version', () => {
    const v1 = {
      version: 1,
      energy: '5',
      totalEnergy: '5',
      zone: 1,
      enemy: { zone: 1, hp: '9', maxHp: '10' },
      enemiesDefeated: 3,
      clicks: 31,
      playTime: 12,
      lastTick: 0,
    };
    const migrated = migrate(v1);
    expect(migrated.version).toBe(STATE_VERSION);
    expect(migrated.highestZone).toBe(1);
    expect(migrated.killsInZone).toBe(0);
    expect(migrated.farming).toBe(false);
    expect(migrated.bossTimeLeft).toBe(0);
    expect(migrated.clicks).toBe(31);
    expect(migrated.settings).toEqual({ numberFormat: 'standard', catchOnlyNew: true });
  });

  it('hebt Version 2 auf Version 3', () => {
    const fresh = JSON.parse(JSON.stringify(createInitialState(0)));
    delete fresh.settings;
    const migrated = MIGRATIONS[2]!({ ...fresh, version: 2 });
    expect(migrated.version).toBe(3);
    expect(migrated.settings).toEqual({ numberFormat: 'standard' });
  });

  it('hebt Version 3 auf Version 4', () => {
    const migrated = MIGRATIONS[3]!({ version: 3, lastTick: 777 });
    expect(migrated.version).toBe(4);
    expect(migrated.spheres).toBe(BALANCING.catching.startSpheres);
    expect(migrated.collection).toEqual({});
    expect(migrated.team).toEqual([]);
    expect(migrated.rngState).toBe(777);
    expect(migrated.hintsSeen).toEqual([]);
    expect(migrated.settings).toEqual({ catchOnlyNew: true });
    const withSettings = MIGRATIONS[3]!({ version: 3, settings: { numberFormat: 'letters' } });
    expect(withSettings.settings).toEqual({ numberFormat: 'letters', catchOnlyNew: true });
  });

  it('hebt Version 4 auf Version 5', () => {
    const migrated = MIGRATIONS[4]!({ version: 4 });
    expect(migrated.version).toBe(5);
    expect(migrated.modules).toEqual({});
  });

  it('hebt Version 5 auf Version 6', () => {
    const migrated = MIGRATIONS[5]!({
      version: 5,
      totalEnergy: '123',
      collection: { art_001: { caught: 2, level: 40 } },
    });
    expect(migrated.version).toBe(6);
    expect(migrated.cycleEnergy).toBe('123');
    expect(migrated.stardust).toBe('0');
    expect(migrated.supernovas).toBe(0);
    expect(migrated.research).toEqual({});
    expect(migrated.collection).toEqual({ art_001: { caught: 2, level: 40, evolution: 0 } });
  });

  it('hebt Version 6 auf Version 7', () => {
    const migrated = MIGRATIONS[6]!({
      version: 6,
      spheres: 12,
      playTime: 300,
      collection: { art_001: { caught: 2, level: 4, evolution: 0 } },
      enemy: { zone: 1, speciesId: 'art_001', hp: '5', maxHp: '10' },
    });
    expect(migrated.version).toBe(7);
    expect(migrated.spheres).toEqual({ standard: 12, orbit: 0, nebel: 0, singularitaet: 0 });
    expect(migrated.collection).toEqual({ art_001: { caught: 2, level: 4, evolution: 0, shiny: false } });
    expect(migrated.enemy).toEqual({ zone: 1, speciesId: 'art_001', hp: '5', maxHp: '10', shiny: false });
    expect(migrated.cycleStart).toBe(0);
    expect(migrated.lastClick).toBe(300);
  });

  it('migrierter Stand hat dieselben Felder wie ein neuer Zustand', () => {
    const fresh = JSON.parse(JSON.stringify(createInitialState(0)));
    const migrated = migrate({ ...fresh, version: 1 });
    expect(Object.keys(migrated).sort()).toEqual(Object.keys(fresh).sort());
  });

  it('aktuelle Version bleibt unverändert', () => {
    const fresh = JSON.parse(JSON.stringify(createInitialState(0)));
    expect(migrate(fresh)).toEqual(fresh);
  });

  it('wirft bei fehlender Migration', () => {
    expect(() => migrate({ version: 0 })).toThrow();
  });
});
