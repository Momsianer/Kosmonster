import { BALANCING } from '../data/balancing';
import { D, type Decimal } from '../util/decimal';
import type { NumberFormat } from '../util/format';
import { enemyMaxHp } from './formulas';

/** Version des Speicherstands, wird bei jeder Strukturänderung erhöht */
export const STATE_VERSION = 3;

export interface EnemyState {
  zone: number;
  hp: Decimal;
  maxHp: Decimal;
}

export interface Settings {
  numberFormat: NumberFormat;
}

/** Zentraler Spielzustand, komplett serialisierbar */
export interface GameState {
  version: number;
  energy: Decimal;
  /** Gesamte jemals verdiente Energie (für spätere Prestigeformeln) */
  totalEnergy: Decimal;
  zone: number;
  /** Höchste bisher erreichte Zone */
  highestZone: number;
  /** Besiegte Gegner in der aktuellen Zone */
  killsInZone: number;
  /** Nach einem gescheiterten Boss: in der Zone davor bleiben */
  farming: boolean;
  /** Verbleibende Zeit gegen den aktuellen Boss in Sekunden, 0 außerhalb von Bosszonen */
  bossTimeLeft: number;
  enemy: EnemyState;
  enemiesDefeated: number;
  clicks: number;
  /** Gespielte Zeit in Sekunden */
  playTime: number;
  /** Zeitstempel des letzten Ticks in Millisekunden (Date.now()) */
  lastTick: number;
  settings: Settings;
}

export function createEnemy(zone: number): EnemyState {
  const maxHp = enemyMaxHp(zone);
  return { zone, hp: maxHp, maxHp };
}

export function createInitialState(now: number = Date.now()): GameState {
  const zone = BALANCING.world.startZone;
  return {
    version: STATE_VERSION,
    energy: D(0),
    totalEnergy: D(0),
    zone,
    highestZone: zone,
    killsInZone: 0,
    farming: false,
    bossTimeLeft: 0,
    enemy: createEnemy(zone),
    enemiesDefeated: 0,
    clicks: 0,
    playTime: 0,
    lastTick: now,
    settings: { numberFormat: 'standard' },
  };
}
