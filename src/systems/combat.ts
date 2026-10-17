import { BALANCING } from '../data/balancing';
import { clickDamage, enemyReward, isBossZone } from '../core/formulas';
import { spawnEnemy, type GameState } from '../core/state';
import { tryCatch } from './catching';
import { teamDps } from './monsters';
import { D, type DecimalSource } from '../util/decimal';

/**
 * Wechselt in eine Zone und lässt dort den ersten Gegner erscheinen.
 * In Bosszonen startet der Bosstimer.
 */
export function enterZone(state: GameState, zone: number, killsInZone = 0): void {
  state.zone = zone;
  state.killsInZone = killsInZone;
  state.highestZone = Math.max(state.highestZone, zone);
  state.enemy = spawnEnemy(state, zone);
  state.bossTimeLeft = isBossZone(zone) ? BALANCING.boss.timeLimitSeconds : 0;
}

/**
 * Fügt dem aktuellen Gegner Schaden zu.
 * Überschüssiger Schaden verfällt. Gibt true zurück, wenn der Gegner besiegt wurde.
 */
export function dealDamage(state: GameState, amount: DecimalSource): boolean {
  const damage = D(amount);
  if (damage.lte(0)) return false;

  const enemy = state.enemy;
  enemy.hp = enemy.hp.sub(damage).max(0);
  if (enemy.hp.gt(0)) return false;

  defeatEnemy(state);
  return true;
}

/**
 * Schreibt die Energie gut, versucht normale Gegner zu fangen und bestimmt den nächsten Gegner.
 * Eine geschaffte Zone (Boss besiegt oder genug Kills) schaltet die nächste frei.
 * Ohne Farmmodus geht es dann weiter, im Farmmodus erscheint ein neuer Gegner in derselben Zone.
 */
export function defeatEnemy(state: GameState): void {
  const zone = state.enemy.zone;
  const reward = enemyReward(zone);
  state.energy = state.energy.add(reward);
  state.totalEnergy = state.totalEnergy.add(reward);
  state.enemiesDefeated += 1;

  if (isBossZone(zone)) {
    // Bosse sind (noch) nicht fangbar
    state.highestZone = Math.max(state.highestZone, zone + 1);
    enterZone(state, state.farming ? zone : zone + 1);
    return;
  }

  tryCatch(state, state.enemy.speciesId);

  const needed = BALANCING.world.enemiesPerZone;
  state.killsInZone = Math.min(state.killsInZone + 1, needed);
  if (state.killsInZone >= needed) {
    state.highestZone = Math.max(state.highestZone, zone + 1);
    if (!state.farming) {
      enterZone(state, zone + 1);
      return;
    }
  }
  state.enemy = spawnEnemy(state, zone);
}

/** Boss nicht rechtzeitig besiegt: zurück in die Zone davor und dort farmen. */
export function failBoss(state: GameState): void {
  state.farming = true;
  enterZone(state, state.zone - 1, BALANCING.world.enemiesPerZone);
}

/** Lässt die Bosszeit ablaufen. Wird von der Tickschleife aufgerufen. */
export function updateBossTimer(state: GameState, dtSeconds: number): void {
  if (!isBossZone(state.zone) || state.bossTimeLeft <= 0) return;
  state.bossTimeLeft = Math.max(0, state.bossTimeLeft - dtSeconds);
  if (state.bossTimeLeft === 0) failBoss(state);
}

/** Aktion: Spieler klickt auf den Gegner. */
export function clickEnemy(state: GameState): boolean {
  state.clicks += 1;
  return dealDamage(state, clickDamage(teamDps(state)));
}

/** Schaden des Teams über dtSeconds. Wird von der Tickschleife aufgerufen. */
export function applyTeamDamage(state: GameState, dtSeconds: number): void {
  if (state.team.length === 0 || dtSeconds <= 0) return;
  dealDamage(state, teamDps(state).mul(dtSeconds));
}

/**
 * Aktion: in eine bereits erreichte Zone wechseln.
 * Eine niedrigere Zone startet den Farmmodus, die höchste Zone beendet ihn.
 */
export function changeZone(state: GameState, zone: number): boolean {
  if (!Number.isInteger(zone) || zone < 1 || zone > state.highestZone || zone === state.zone) return false;
  const lower = zone < state.highestZone;
  state.farming = lower;
  enterZone(state, zone, lower ? BALANCING.world.enemiesPerZone : 0);
  return true;
}

/** Aktion: automatisches Weiterziehen nach geschaffter Zone ein oder aus (aus = Farmmodus). */
export function setAutoProgress(state: GameState, on: boolean): void {
  state.farming = !on;
}

/** Aktion: Farmmodus verlassen und den Boss erneut herausfordern. */
export function challengeBoss(state: GameState): boolean {
  if (!state.farming) return false;
  state.farming = false;
  enterZone(state, state.zone + 1);
  return true;
}
