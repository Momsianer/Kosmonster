import { describe, expect, it } from 'vitest';
import { createInitialState, STATE_VERSION } from '../src/core/state';
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
    expect(migrated.settings).toEqual({ numberFormat: 'standard' });
  });

  it('hebt Version 2 auf Version 3', () => {
    const fresh = JSON.parse(JSON.stringify(createInitialState(0)));
    delete fresh.settings;
    const migrated = MIGRATIONS[2]!({ ...fresh, version: 2 });
    expect(migrated.version).toBe(3);
    expect(migrated.settings).toEqual({ numberFormat: 'standard' });
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
