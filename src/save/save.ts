import { compressToBase64, decompressFromBase64 } from 'lz-string';
import { isBossZone } from '../core/formulas';
import { BALANCING } from '../data/balancing';
import { createEnemy, createInitialState, STATE_VERSION, type GameState } from '../core/state';
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
  const base = createInitialState(toNumber(raw.lastTick, Date.now()));
  const zone = toZone(raw.zone, base.zone);

  let enemy = createEnemy(zone);
  if (isRecord(raw.enemy) && raw.enemy.zone === zone) {
    const hp = toDecimal(raw.enemy.hp, enemy.maxHp);
    if (hp.gt(0) && hp.lte(enemy.maxHp)) enemy = { ...enemy, hp };
  }

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
    playTime: toNumber(raw.playTime, 0),
    lastTick: base.lastTick,
    settings: {
      numberFormat: isNumberFormat(settings.numberFormat)
        ? settings.numberFormat
        : base.settings.numberFormat,
    },
  };
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
