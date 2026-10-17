import { BALANCING } from '../data/balancing';
import { applyTeamDamage, updateBossTimer } from '../systems/combat';
import { offlineBonus, offlineLimitSeconds } from '../systems/research';
import { applyProduction } from '../systems/station';
import type { Decimal } from '../util/decimal';
import { addEnergy, type GameState } from './state';

/**
 * Ein Logikschritt mit Zeitdifferenz in Sekunden:
 * Produktion der Raumstation, Schaden des Teams, Bosszeit.
 */
export function tick(state: GameState, dtSeconds: number): void {
  if (dtSeconds <= 0) return;
  state.playTime += dtSeconds;
  applyProduction(state, dtSeconds);
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

/**
 * Rückt den Zustand nach einer Pause (Laden, Hintergrundtab) vor. Längere Pausen
 * bekommen den Offlinebonus der Forschung, das Limit kommt ebenfalls aus der Forschung.
 * Gibt die verrechnete Zeit und die dabei verdiente Energie zurück.
 */
export function catchUp(state: GameState, now: number): { seconds: number; energy: Decimal } {
  const before = state.totalEnergy;
  const seconds = advance(state, now, offlineLimitSeconds(state));
  let energy = state.totalEnergy.sub(before).max(0);
  if (seconds >= BALANCING.offline.reportThresholdSeconds) {
    const bonus = energy.mul(offlineBonus(state));
    addEnergy(state, bonus);
    energy = energy.add(bonus);
  }
  return { seconds, energy };
}

export interface LoopHandle {
  stop(): void;
}

/** Ruft update ca. ticksPerSecond Mal pro Sekunde mit dem aktuellen Zeitstempel auf. */
export function startLoop(update: (now: number) => void, now: () => number = Date.now): LoopHandle {
  const id = setInterval(() => update(now()), 1000 / BALANCING.loop.ticksPerSecond);
  return { stop: () => clearInterval(id) };
}
