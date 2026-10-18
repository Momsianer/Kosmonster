import { BALANCING } from '../data/balancing';
import {
  clearStorage,
  decodeSave,
  encodeSave,
  loadFromStorage,
  saveToStorage,
  type SaveStorage,
} from '../save/save';
import type { ModuleId } from '../data/modules';
import type { SpeciesId } from '../data/monsters';
import type { ResearchId } from '../data/research';
import type { SphereType } from '../data/spheres';
import { evolve } from '../systems/evolution';
import type { AutomationId, DmUpgradeId } from '../data/darkmatter';
import { blackHole } from '../systems/blackhole';
import { startBreeding } from '../systems/breeding';
import { buyDm } from '../systems/darkmatter';
import type { ChallengeId } from '../data/challenges';
import type { OriginId } from '../data/origin';
import { bigBang } from '../systems/bigbang';
import { abandonChallenge, startChallenge } from '../systems/challenges';
import { buyOrigin } from '../systems/origin';
import { startTheorem } from '../systems/theorem';
import { supernova } from '../systems/prestige';
import { buyResearch } from '../systems/research';
import { buySpheres } from '../systems/catching';
import { challengeBoss, changeZone, clickEnemy, setAutoProgress } from '../systems/combat';
import { addToTeam, levelUp, removeFromTeam } from '../systems/monsters';
import { buyModule } from '../systems/station';
import { dismissHint, type UnlockId } from '../systems/unlocks';
import type { Decimal } from '../util/decimal';
import { setNumberFormat, type NumberFormat } from '../util/format';
import { catchUp, startLoop, type LoopHandle } from './loop';
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
  const { seconds, energy } = catchUp(game.state, now);
  if (seconds >= BALANCING.offline.reportThresholdSeconds) {
    game.offlineReport = { seconds, energy };
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
  changeZone: (zone: number) => changeZone(game.state, zone),
  setAutoProgress: (on: boolean) => setAutoProgress(game.state, on),
  levelUp: (id: SpeciesId, amount: number | 'max') => levelUp(game.state, id, amount),
  addToTeam: (id: SpeciesId) => addToTeam(game.state, id),
  removeFromTeam: (id: SpeciesId) => removeFromTeam(game.state, id),
  buySpheres: (amount: number, type: SphereType = 'standard') => buySpheres(game.state, amount, type),
  buyModule: (id: ModuleId, amount: number | 'max') => buyModule(game.state, id, amount),
  supernova: () => {
    const ok = supernova(game.state);
    if (ok) saveGame();
    return ok;
  },
  buyResearch: (id: ResearchId) => buyResearch(game.state, id),
  evolve: (id: SpeciesId) => evolve(game.state, id),
  blackHole: () => {
    const ok = blackHole(game.state);
    if (ok) saveGame();
    return ok;
  },
  buyDm: (id: DmUpgradeId) => buyDm(game.state, id),
  setAutomation: (id: AutomationId | 'autoschwarzloch', on: boolean) => {
    game.state.automation.enabled[id] = on;
  },
  setSphereTarget: (value: number) => {
    game.state.automation.sphereTarget = Math.max(0, Math.floor(value));
  },
  setSupernovaTarget: (value: number) => {
    game.state.automation.supernovaTarget = Math.max(1, value);
  },
  startBreeding: (id: SpeciesId) => startBreeding(game.state, id),
  bigBang: () => {
    const ok = bigBang(game.state);
    if (ok) saveGame();
    return ok;
  },
  buyOrigin: (id: OriginId) => buyOrigin(game.state, id),
  setBlackHoleTarget: (value: number) => {
    game.state.automation.blackHoleTarget = Math.max(1, value);
  },
  startChallenge: (id: ChallengeId) => {
    const ok = startChallenge(game.state, id);
    if (ok) saveGame();
    return ok;
  },
  abandonChallenge: () => abandonChallenge(game.state),
  startTheorem: () => startTheorem(game.state),
  closeCredits: () => {
    if (!game.state.hintsSeen.includes('credits')) game.state.hintsSeen.push('credits');
  },
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
