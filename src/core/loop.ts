import { BALANCING } from '../data/balancing';
import type { GameState } from './state';

/**
 * Ein Logikschritt mit Zeitdifferenz in Sekunden.
 * In M1 läuft nur die Spielzeit, später kommen Team DPS und Produktion dazu.
 */
export function tick(state: GameState, dtSeconds: number): void {
  if (dtSeconds <= 0) return;
  state.playTime += dtSeconds;
}

/**
 * Rückt den Zustand auf den Zeitpunkt `now` vor.
 * Die Zeitdifferenz wird aus Date.now() Werten berechnet, nie aus gezählten Ticks.
 * Gibt die tatsächlich verrechnete Zeit in Sekunden zurück.
 */
export function advance(state: GameState, now: number): number {
  const elapsed = (now - state.lastTick) / 1000;
  state.lastTick = now;
  // Zurückgestellte Uhr: nichts verrechnen
  if (elapsed <= 0) return 0;
  const dt = Math.min(elapsed, BALANCING.loop.maxTickSeconds);
  tick(state, dt);
  return dt;
}

export interface LoopHandle {
  stop(): void;
}

/** Startet die Tickschleife mit ca. ticksPerSecond Aufrufen pro Sekunde. */
export function startLoop(state: GameState, now: () => number = Date.now): LoopHandle {
  state.lastTick = now();
  const id = setInterval(() => advance(state, now()), 1000 / BALANCING.loop.ticksPerSecond);
  return { stop: () => clearInterval(id) };
}
