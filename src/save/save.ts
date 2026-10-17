import { compressToBase64, decompressFromBase64 } from 'lz-string';
import { isBossZone } from '../core/formulas';
import { BALANCING } from '../data/balancing';
import {
  createEnemy,
  createInitialState,
  pickSpecies,
  STATE_VERSION,
  type CollectionEntry,
  type GameState,
} from '../core/state';
import { isModuleId, type ModuleId } from '../data/modules';
import { isSpeciesId, speciesInZone, type SpeciesId } from '../data/monsters';
import { D, type Decimal } from '../util/decimal';
import { isNumberFormat } from '../util/format';
import { migrate, type RawSave } from './migrations';

export const SAVE_KEY = 'kosmonster.save';

/** Die Teile von localStorage, die das Speichern braucht (in Tests ersetzbar) */
export type SaveStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** Speicherstand als Textcode: JSON → lz-string → Base64 */
export function encodeSave(state: GameState): string {
  return compressToBase64(JSON.stringify(state));
}

/**
 * Liest einen Textcode. Gibt null zurück, wenn der Code ungültig ist
 * oder von einer neueren Spielversion stammt.
 */
export function decodeSave(code: string): GameState | null {
  try {
    const json = decompressFromBase64(code.trim());
    if (!json) return null;
    const raw: unknown = JSON.parse(json);
    if (!isRecord(raw) || typeof raw.version !== 'number') return null;
    if (raw.version > STATE_VERSION || raw.version < 1) return null;
    return hydrate(migrate(raw as RawSave));
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toDecimal(value: unknown, fallback: Decimal): Decimal {
  if (typeof value !== 'string' && typeof value !== 'number') return fallback;
  const d = D(value);
  return d.isNan() || d.lt(0) ? fallback : d;
}

function toNumber(value: unknown, fallback: number, min = 0): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min ? value : fallback;
}

function toZone(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 ? value : fallback;
}

/**
 * Wandelt einen migrierten Rohstand in einen Spielzustand um.
 * Fehlende oder kaputte Felder fallen auf Startwerte zurück.
 */
export function hydrate(raw: RawSave): GameState {
  const lastTick = toNumber(raw.lastTick, Date.now());
  const rng = {
    rngState: typeof raw.rngState === 'number' && Number.isInteger(raw.rngState) ? raw.rngState : lastTick | 0,
  };
  const base = createInitialState(lastTick, rng.rngState);
  const zone = toZone(raw.zone, base.zone);

  // Gegner übernehmen, wenn die Zone passt. Fehlt die Art oder passt sie nicht
  // zur Zone (alte Stände), bekommt er eine neue Art und behält seine Leben.
  // Gewürfelt wird nur, wenn nötig, damit Neuladen den Zufall nicht verschiebt.
  const rawEnemy = isRecord(raw.enemy) && raw.enemy.zone === zone ? raw.enemy : null;
  const rawSpecies = rawEnemy?.speciesId;
  const speciesId =
    isSpeciesId(rawSpecies) && speciesInZone(zone).some((s) => s.id === rawSpecies)
      ? rawSpecies
      : pickSpecies(rng, zone);
  let enemy = createEnemy(zone, speciesId);
  if (rawEnemy) {
    const hp = toDecimal(rawEnemy.hp, enemy.maxHp);
    if (hp.gt(0) && hp.lte(enemy.maxHp)) enemy = { ...enemy, hp };
  }

  const collection = hydrateCollection(raw.collection);
  const team = hydrateTeam(raw.team, collection);

  const settings = isRecord(raw.settings) ? raw.settings : {};
  const { timeLimitSeconds } = BALANCING.boss;
  const bossTime = toNumber(raw.bossTimeLeft, 0);

  return {
    version: STATE_VERSION,
    energy: toDecimal(raw.energy, base.energy),
    totalEnergy: toDecimal(raw.totalEnergy, base.totalEnergy),
    zone,
    highestZone: Math.max(zone, toZone(raw.highestZone, zone)),
    killsInZone: Math.min(toNumber(raw.killsInZone, 0), BALANCING.world.enemiesPerZone),
    farming: raw.farming === true,
    // In Bosszonen muss ein Timer laufen, sonst bliebe der Boss ohne Zeitlimit
    bossTimeLeft: isBossZone(zone)
      ? bossTime > 0
        ? Math.min(bossTime, timeLimitSeconds)
        : timeLimitSeconds
      : 0,
    enemy,
    enemiesDefeated: toNumber(raw.enemiesDefeated, 0),
    clicks: toNumber(raw.clicks, 0),
    spheres: Math.floor(toNumber(raw.spheres, base.spheres)),
    collection,
    team,
    rngState: rng.rngState,
    lastCatch: hydrateLastCatch(raw.lastCatch),
    modules: hydrateModules(raw.modules),
    hintsSeen: Array.isArray(raw.hintsSeen)
      ? raw.hintsSeen.filter((h): h is string => typeof h === 'string')
      : [],
    playTime: toNumber(raw.playTime, 0),
    lastTick: base.lastTick,
    settings: {
      numberFormat: isNumberFormat(settings.numberFormat)
        ? settings.numberFormat
        : base.settings.numberFormat,
      catchOnlyNew:
        typeof settings.catchOnlyNew === 'boolean' ? settings.catchOnlyNew : base.settings.catchOnlyNew,
    },
  };
}

function hydrateCollection(value: unknown): Partial<Record<SpeciesId, CollectionEntry>> {
  const collection: Partial<Record<SpeciesId, CollectionEntry>> = {};
  if (!isRecord(value)) return collection;
  for (const [id, entry] of Object.entries(value)) {
    if (!isSpeciesId(id) || !isRecord(entry)) continue;
    collection[id] = {
      caught: Math.max(1, Math.floor(toNumber(entry.caught, 1))),
      level: Math.floor(toNumber(entry.level, 1)),
    };
  }
  return collection;
}

/** Nur gefangene Arten, keine doppelten, höchstens so viele wie Teamplätze */
function hydrateTeam(value: unknown, collection: Partial<Record<SpeciesId, CollectionEntry>>): SpeciesId[] {
  if (!Array.isArray(value)) return [];
  const team: SpeciesId[] = [];
  for (const id of value) {
    if (isSpeciesId(id) && collection[id] && !team.includes(id)) team.push(id);
  }
  return team.slice(0, BALANCING.monster.teamSlots);
}

function hydrateModules(value: unknown): Partial<Record<ModuleId, number>> {
  const modules: Partial<Record<ModuleId, number>> = {};
  if (!isRecord(value)) return modules;
  for (const [id, count] of Object.entries(value)) {
    if (isModuleId(id)) {
      const n = Math.floor(toNumber(count, 0));
      if (n > 0) modules[id] = n;
    }
  }
  return modules;
}

function hydrateLastCatch(value: unknown): GameState['lastCatch'] {
  if (!isRecord(value) || !isSpeciesId(value.speciesId)) return null;
  return { speciesId: value.speciesId, time: toNumber(value.time, 0) };
}

export function saveToStorage(storage: SaveStorage, state: GameState): boolean {
  try {
    storage.setItem(SAVE_KEY, encodeSave(state));
    return true;
  } catch {
    return false;
  }
}

export function loadFromStorage(storage: SaveStorage): GameState | null {
  try {
    const code = storage.getItem(SAVE_KEY);
    return code ? decodeSave(code) : null;
  } catch {
    return null;
  }
}

export function clearStorage(storage: SaveStorage): void {
  try {
    storage.removeItem(SAVE_KEY);
  } catch {
    // Speicher nicht verfügbar: nichts zu löschen
  }
}
