import { BALANCING } from '../data/balancing';
import {
  clearStorage,
  decodeSave,
  encodeSave,
  loadFromStorage,
  saveToStorage,
  type SaveStorage,
} from '../save/save';
import type { SpeciesId } from '../data/monsters';
import { buySpheres } from '../systems/catching';
import { challengeBoss, clickEnemy } from '../systems/combat';
import { addToTeam, levelUp, removeFromTeam } from '../systems/monsters';
import { dismissHint, type UnlockId } from '../systems/unlocks';
import type { Decimal } from '../util/decimal';
import { setNumberFormat, type NumberFormat } from '../util/format';
import { advance, startLoop, type LoopHandle } from './loop';
import { createInitialState, type GameState } from './state';

/** Zusammenfassung nach längerer Abwesenheit */
export interface OfflineReport {
  seconds: number;
  energy: Decimal;
}

interface Game {
  state: GameState;
  storage: SaveStorage | null;
  loop: LoopHandle | null;
  autosave: ReturnType<typeof setInterval> | null;
  offlineReport: OfflineReport | null;
  /** Zeitpunkt der letzten erfolgreichen Speicherung (Date.now()) */
  lastSaved: number | null;
}

/** Die eine laufende Spielinstanz. Die Oberfläche liest nur und ruft Aktionen auf. */
export const game: Game = {
  state: createInitialState(),
  storage: null,
  loop: null,
  autosave: null,
  offlineReport: null,
  lastSaved: null,
};

function applySettings(state: GameState): void {
  setNumberFormat(state.settings.numberFormat);
}

/**
 * Rückt das Spiel bis `now` vor. Wurde dabei viel Zeit nachgeholt
 * (Offline, Hintergrundtab), entsteht ein Offlinebericht.
 */
export function update(now: number = Date.now()): void {
  const before = game.state.totalEnergy;
  const seconds = advance(game.state, now);
  if (seconds >= BALANCING.offline.reportThresholdSeconds) {
    game.offlineReport = { seconds, energy: game.state.totalEnergy.sub(before).max(0) };
  }
}

/** Lädt den Speicherstand, holt die Offlinezeit nach und startet Tickschleife und Autosave. */
export function startGame(storage: SaveStorage | null, now: number = Date.now()): void {
  if (game.loop) return;
  game.storage = storage;
  const loaded = storage ? loadFromStorage(storage) : null;
  game.state = loaded ?? createInitialState(now);
  applySettings(game.state);
  game.offlineReport = null;
  update(now);
  game.loop = startLoop(update);
  game.autosave = setInterval(saveGame, BALANCING.save.autosaveSeconds * 1000);
}

export function stopGame(): void {
  game.loop?.stop();
  game.loop = null;
  if (game.autosave) clearInterval(game.autosave);
  game.autosave = null;
}

export function saveGame(): boolean {
  if (!game.storage) return false;
  const ok = saveToStorage(game.storage, game.state);
  if (ok) game.lastSaved = Date.now();
  return ok;
}

export const actions = {
  clickEnemy: () => clickEnemy(game.state),
  challengeBoss: () => challengeBoss(game.state),
  levelUp: (id: SpeciesId, amount: number | 'max') => levelUp(game.state, id, amount),
  addToTeam: (id: SpeciesId) => addToTeam(game.state, id),
  removeFromTeam: (id: SpeciesId) => removeFromTeam(game.state, id),
  buySpheres: (amount: number) => buySpheres(game.state, amount),
  dismissHint: (id: UnlockId) => dismissHint(game.state, id),

  setCatchOnlyNew(value: boolean): void {
    game.state.settings.catchOnlyNew = value;
  },

  setNumberFormat(format: NumberFormat): void {
    game.state.settings.numberFormat = format;
    applySettings(game.state);
  },

  save: saveGame,

  exportSave: (): string => encodeSave(game.state),

  /** Übernimmt einen Textcode. Importierte Stände bekommen keine Offlinezeit gutgeschrieben. */
  importSave(code: string): boolean {
    const state = decodeSave(code);
    if (!state) return false;
    state.lastTick = Date.now();
    game.state = state;
    game.offlineReport = null;
    applySettings(state);
    saveGame();
    return true;
  },

  /** Setzt alles zurück, nur die Einstellungen bleiben erhalten. */
  hardReset(): void {
    const settings = game.state.settings;
    if (game.storage) clearStorage(game.storage);
    game.state = createInitialState();
    game.state.settings = settings;
    game.offlineReport = null;
    applySettings(game.state);
    saveGame();
  },

  dismissOfflineReport(): void {
    game.offlineReport = null;
  },
};
