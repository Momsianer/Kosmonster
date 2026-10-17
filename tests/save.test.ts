import { decompressFromBase64, compressToBase64 } from 'lz-string';
import { describe, expect, it } from 'vitest';
import { enemyMaxHp } from '../src/core/formulas';
import { createInitialState, STATE_VERSION } from '../src/core/state';
import { BALANCING } from '../src/data/balancing';
import {
  clearStorage,
  decodeSave,
  encodeSave,
  loadFromStorage,
  SAVE_KEY,
  saveToStorage,
  type SaveStorage,
} from '../src/save/save';
import { addCatch } from '../src/systems/catching';
import { clickEnemy, enterZone } from '../src/systems/combat';
import { D } from '../src/util/decimal';

function memoryStorage(): SaveStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

function encodeRaw(raw: unknown): string {
  return compressToBase64(JSON.stringify(raw));
}

describe('Textcode', () => {
  it('ist JSON, mit lz-string komprimiert und Base64 kodiert', () => {
    const state = createInitialState(123);
    const code = encodeSave(state);
    expect(code).toMatch(/^[A-Za-z0-9+/=]+$/);
    const json = JSON.parse(decompressFromBase64(code));
    expect(json.version).toBe(STATE_VERSION);
    expect(json.lastTick).toBe(123);
  });

  it('übersteht Speichern und Laden ohne Verlust', () => {
    const state = createInitialState(1000);
    for (let i = 0; i < 25; i++) clickEnemy(state);
    state.energy = D('1.5e400');
    state.settings.numberFormat = 'letters';
    enterZone(state, 7, 3);
    const loaded = decodeSave(encodeSave(state));
    expect(loaded).not.toBeNull();
    expect(loaded!.energy.eq(state.energy)).toBe(true);
    expect(loaded!.totalEnergy.eq(state.totalEnergy)).toBe(true);
    expect(loaded!.zone).toBe(7);
    expect(loaded!.killsInZone).toBe(3);
    expect(loaded!.clicks).toBe(25);
    expect(loaded!.enemy.hp.eq(state.enemy.hp)).toBe(true);
    expect(loaded!.settings.numberFormat).toBe('letters');
    expect(loaded!.lastTick).toBe(1000);
  });

  it('ungültige Codes ergeben null', () => {
    expect(decodeSave('')).toBeNull();
    expect(decodeSave('kein gültiger code')).toBeNull();
    expect(decodeSave(compressToBase64('kein json'))).toBeNull();
    expect(decodeSave(encodeRaw([1, 2, 3]))).toBeNull();
    expect(decodeSave(encodeRaw({ energy: '5' }))).toBeNull();
  });

  it('Stände einer neueren Version werden abgelehnt', () => {
    const raw = { ...JSON.parse(JSON.stringify(createInitialState(0))), version: STATE_VERSION + 1 };
    expect(decodeSave(encodeRaw(raw))).toBeNull();
  });

  it('alte Stände werden migriert', () => {
    const v1 = {
      version: 1,
      energy: '42',
      totalEnergy: '50',
      zone: 1,
      enemy: { zone: 1, hp: '7', maxHp: '10' },
      enemiesDefeated: 4,
      clicks: 47,
      playTime: 30,
      lastTick: 5000,
    };
    const loaded = decodeSave(encodeRaw(v1));
    expect(loaded).not.toBeNull();
    expect(loaded!.version).toBe(STATE_VERSION);
    expect(loaded!.energy.toNumber()).toBe(42);
    expect(loaded!.enemy.hp.toNumber()).toBe(7);
    expect(loaded!.settings.numberFormat).toBe('standard');
  });

  it('kaputte Felder fallen auf Startwerte zurück', () => {
    const raw = {
      ...JSON.parse(JSON.stringify(createInitialState(0))),
      energy: 'quatsch',
      zone: -3,
      clicks: 'viele',
      enemy: { zone: 1, hp: '999999', maxHp: '1' },
      settings: { numberFormat: 'römisch' },
    };
    const loaded = decodeSave(encodeRaw(raw))!;
    expect(loaded.energy.eq(0)).toBe(true);
    expect(loaded.zone).toBe(1);
    expect(loaded.clicks).toBe(0);
    expect(loaded.enemy.hp.eq(enemyMaxHp(1))).toBe(true);
    expect(loaded.settings.numberFormat).toBe('standard');
  });

  it('eine Bosszone ohne Timer bekommt das volle Zeitlimit', () => {
    const state = createInitialState(0);
    enterZone(state, 5);
    const raw = { ...JSON.parse(JSON.stringify(state)), bossTimeLeft: 0 };
    expect(decodeSave(encodeRaw(raw))!.bossTimeLeft).toBe(BALANCING.boss.timeLimitSeconds);
  });
});

describe('Monster im Speicherstand', () => {
  it('Sammlung, Team, Sphären und Zufall überstehen Speichern und Laden', () => {
    const state = createInitialState(0, 31337);
    addCatch(state, 'art_001');
    addCatch(state, 'art_002');
    state.collection.art_001!.level = 42;
    state.spheres = 17;
    state.hintsSeen = ['team'];
    const loaded = decodeSave(encodeSave(state))!;
    expect(loaded.collection).toEqual(state.collection);
    expect(loaded.team).toEqual(state.team);
    expect(loaded.spheres).toBe(17);
    expect(loaded.rngState).toBe(state.rngState);
    expect(loaded.enemy.speciesId).toBe(state.enemy.speciesId);
    expect(loaded.lastCatch).toEqual(state.lastCatch);
    expect(loaded.hintsSeen).toEqual(['team']);
  });

  it('Laden würfelt nicht neu', () => {
    const state = createInitialState(0, 4242);
    const code = encodeSave(state);
    expect(decodeSave(code)!.rngState).toBe(decodeSave(code)!.rngState);
    expect(decodeSave(code)!.rngState).toBe(state.rngState);
  });

  it('ungültige Team und Sammlungseinträge werden entfernt', () => {
    const raw = {
      ...JSON.parse(JSON.stringify(createInitialState(0))),
      collection: { art_001: { caught: 2, level: 5 }, art_999: { caught: 1, level: 1 }, art_002: 'x' },
      team: ['art_001', 'art_001', 'art_002', 'art_999'],
    };
    const loaded = decodeSave(encodeRaw(raw))!;
    expect(Object.keys(loaded.collection)).toEqual(['art_001']);
    expect(loaded.team).toEqual(['art_001']);
  });

  it('ein Gegner mit unpassender Art bekommt eine passende', () => {
    const raw = {
      ...JSON.parse(JSON.stringify(createInitialState(0))),
      enemy: { zone: 1, speciesId: 'art_010', hp: '4', maxHp: '10' },
    };
    const loaded = decodeSave(encodeRaw(raw))!;
    expect(['art_001', 'art_002']).toContain(loaded.enemy.speciesId);
    expect(loaded.enemy.hp.toNumber()).toBe(4);
  });
});

describe('Speicherplatz', () => {
  it('speichert und lädt über den Speicher', () => {
    const storage = memoryStorage();
    const state = createInitialState(0);
    clickEnemy(state);
    expect(saveToStorage(storage, state)).toBe(true);
    expect(storage.data.has(SAVE_KEY)).toBe(true);
    expect(loadFromStorage(storage)!.clicks).toBe(1);
  });

  it('ohne Speicherstand ergibt Laden null', () => {
    expect(loadFromStorage(memoryStorage())).toBeNull();
  });

  it('löschen entfernt den Speicherstand', () => {
    const storage = memoryStorage();
    saveToStorage(storage, createInitialState(0));
    clearStorage(storage);
    expect(loadFromStorage(storage)).toBeNull();
  });

  it('Fehler des Speichers werden abgefangen', () => {
    const broken: SaveStorage = {
      getItem: () => {
        throw new Error('gesperrt');
      },
      setItem: () => {
        throw new Error('voll');
      },
      removeItem: () => {
        throw new Error('gesperrt');
      },
    };
    expect(saveToStorage(broken, createInitialState(0))).toBe(false);
    expect(loadFromStorage(broken)).toBeNull();
    expect(() => clearStorage(broken)).not.toThrow();
  });
});
