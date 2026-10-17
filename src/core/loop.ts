import { BALANCING } from '../data/balancing';
import { applyTeamDamage, updateBossTimer } from '../systems/combat';
import type { GameState } from './state';

/**
 * Ein Logikschritt mit Zeitdifferenz in Sekunden.
 * Später kommt die Produktion der Raumstation dazu.
 */
export function tick(state: GameState, dtSeconds: number): void {
  if (dtSeconds <= 0) return;
  state.playTime += dtSeconds;
  applyTeamDamage(state, dtSeconds);
  updateBossTimer(state, dtSeconds);
}

/**
 * Rückt den Zustand auf den Zeitpunkt `now` vor.
 * Die Zeitdifferenz wird aus Date.now() Werten berechnet, nie aus gezählten Ticks.
 * Längere Pausen (Hintergrundtab, Offlinezeit) werden in Schritten von höchstens
 * maxTickSeconds nachgeholt, insgesamt aber höchstens maxSeconds.
 * Gibt die tatsächlich verrechnete Zeit in Sekunden zurück.
 */
export function advance(
  state: GameState,
  now: number,
  maxSeconds: number = BALANCING.offline.maxSeconds,
): number {
  const elapsed = (now - state.lastTick) / 1000;
  state.lastTick = now;
  // Zurückgestellte Uhr: nichts verrechnen
  if (elapsed <= 0) return 0;

  const total = Math.min(elapsed, maxSeconds);
  const step = BALANCING.loop.maxTickSeconds;
  let remaining = total;
  while (remaining > 0) {
    const dt = Math.min(remaining, step);
    tick(state, dt);
    remaining -= dt;
  }
  return total;
}

export interface LoopHandle {
  stop(): void;
}

/** Ruft update ca. ticksPerSecond Mal pro Sekunde mit dem aktuellen Zeitstempel auf. */
export function startLoop(update: (now: number) => void, now: () => number = Date.now): LoopHandle {
  const id = setInterval(() => update(now()), 1000 / BALANCING.loop.ticksPerSecond);
  return { stop: () => clearInterval(id) };
}
