import { afterEach, describe, expect, it } from 'vitest';
import { actions, game, saveGame, startGame, stopGame } from '../src/core/game';
import { createInitialState } from '../src/core/state';
import { BALANCING } from '../src/data/balancing';
import { SAVE_KEY, saveToStorage, type SaveStorage } from '../src/save/save';
import { getNumberFormat } from '../src/util/format';

function memoryStorage(): SaveStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

afterEach(() => {
  stopGame();
  actions.setNumberFormat('standard');
});

describe('Spielstart', () => {
  it('ohne Speicherstand beginnt ein neues Spiel', () => {
    startGame(memoryStorage(), 1000);
    expect(game.state.zone).toBe(1);
    expect(game.state.clicks).toBe(0);
    expect(game.offlineReport).toBeNull();
  });

  it('lädt den Speicherstand und holt die Offlinezeit nach', () => {
    const storage = memoryStorage();
    const saved = createInitialState(0);
    saved.clicks = 12;
    saved.settings.numberFormat = 'scientific';
    saveToStorage(storage, saved);

    startGame(storage, 2 * 3600 * 1000);
    expect(game.state.clicks).toBe(12);
    expect(game.state.playTime).toBeCloseTo(7200, 6);
    expect(game.offlineReport?.seconds).toBeCloseTo(7200, 6);
    expect(getNumberFormat()).toBe('scientific');
  });

  it('kurze Abwesenheit erzeugt keinen Offlinebericht', () => {
    const storage = memoryStorage();
    saveToStorage(storage, createInitialState(0));
    startGame(storage, (BALANCING.offline.reportThresholdSeconds - 1) * 1000);
    expect(game.offlineReport).toBeNull();
  });
});

describe('Aktionen', () => {
  it('speichern schreibt in den Speicher', () => {
    const storage = memoryStorage();
    startGame(storage, 0);
    actions.clickEnemy();
    expect(saveGame()).toBe(true);
    expect(storage.data.has(SAVE_KEY)).toBe(true);
    expect(game.lastSaved).not.toBeNull();
  });

  it('Export und Import ergeben denselben Stand', () => {
    startGame(memoryStorage(), 0);
    for (let i = 0; i < 15; i++) actions.clickEnemy();
    const code = actions.exportSave();
    actions.hardReset();
    expect(game.state.clicks).toBe(0);
    expect(actions.importSave(code)).toBe(true);
    expect(game.state.clicks).toBe(15);
  });

  it('ungültiger Import ändert nichts', () => {
    startGame(memoryStorage(), 0);
    actions.clickEnemy();
    expect(actions.importSave('unsinn')).toBe(false);
    expect(game.state.clicks).toBe(1);
  });

  it('Hardreset setzt zurück, behält aber die Einstellungen', () => {
    const storage = memoryStorage();
    startGame(storage, 0);
    actions.clickEnemy();
    actions.setNumberFormat('letters');
    actions.hardReset();
    expect(game.state.clicks).toBe(0);
    expect(game.state.settings.numberFormat).toBe('letters');
    expect(getNumberFormat()).toBe('letters');
  });

  it('Zahlenformat wird im Zustand gespeichert', () => {
    startGame(memoryStorage(), 0);
    actions.setNumberFormat('engineering');
    expect(game.state.settings.numberFormat).toBe('engineering');
    expect(getNumberFormat()).toBe('engineering');
  });
});
