import { BALANCING } from '../data/balancing';
import { D, type Decimal } from '../util/decimal';
import { enemyHp } from './formulas';

/** Version des Speicherstands, wird bei jeder Strukturänderung erhöht */
export const STATE_VERSION = 1;

export interface EnemyState {
  zone: number;
  hp: Decimal;
  maxHp: Decimal;
}

/** Zentraler Spielzustand, komplett serialisierbar */
export interface GameState {
  version: number;
  energy: Decimal;
  /** Gesamte jemals verdiente Energie (für spätere Prestigeformeln) */
  totalEnergy: Decimal;
  zone: number;
  enemy: EnemyState;
  enemiesDefeated: number;
  clicks: number;
  /** Gespielte Zeit in Sekunden */
  playTime: number;
  /** Zeitstempel des letzten Ticks in Millisekunden (Date.now()) */
  lastTick: number;
}

export function createEnemy(zone: number): EnemyState {
  const maxHp = enemyHp(zone);
  return { zone, hp: maxHp, maxHp };
}

export function createInitialState(now: number = Date.now()): GameState {
  const zone = BALANCING.world.startZone;
  return {
    version: STATE_VERSION,
    energy: D(0),
    totalEnergy: D(0),
    zone,
    enemy: createEnemy(zone),
    enemiesDefeated: 0,
    clicks: 0,
    playTime: 0,
    lastTick: now,
  };
}
