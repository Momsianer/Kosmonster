import { BALANCING } from '../data/balancing';
import { clickDamage, enemyKind, enemyReward, isBossZone, isPrime, starSystem } from '../core/formulas';
import { addEnergy, type GameState } from '../core/state';
import { getSpecies } from '../data/monsters';
import { spawnEnemy } from './spawning';
import { ruleActive } from './rules';
import { damageTheorem } from './theorem';
import { relaxSpherePrices, tryCatch } from './catching';
import { teamDps, typeCountInTeam } from './monsters';
import { D, type Decimal, type DecimalSource } from '../util/decimal';
import { nextRandom } from '../util/random';
import { bossDamageMult, bossTimeLimit, clickBonus, critChance, critMult } from './research';

/**
 * Wechselt in eine Zone und lässt dort den ersten Gegner erscheinen.
 * In Bosszonen startet der Bosstimer.
 */
export function enterZone(state: GameState, zone: number, killsInZone = 0): void {
  state.zone = zone;
  state.killsInZone = killsInZone;
  state.highestZone = Math.max(state.highestZone, zone);
  state.enemy = spawnEnemy(state, zone);
  state.bossTimeLeft = isBossZone(zone) ? bossTimeLimit(state) : 0;
}

/**
 * Fügt dem aktuellen Gegner Schaden zu.
 * Überschüssiger Schaden verfällt. Gibt true zurück, wenn der Gegner besiegt wurde.
 */
export function dealDamage(state: GameState, amount: DecimalSource): boolean {
  const damage = D(amount);
  if (damage.lte(0)) return false;
  if (state.theorem) {
    damageTheorem(state, damage);
    return false;
  }

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
  addEnergy(state, enemyReward(zone));
  relaxSpherePrices(state, zone);
  state.enemiesDefeated += 1;

  if (isBossZone(zone)) {
    state.challenge.tideStart = state.playTime;
    if (enemyKind(zone) === 'systemBoss') recordStory(state, zone);
    // Fangbar sind nur legendäre Systembosse
    if (getSpecies(state.enemy.speciesId)?.rarity === 'legendary') {
      tryCatch(state, state.enemy.speciesId, state.enemy.shiny);
    }
    state.highestZone = Math.max(state.highestZone, zone + 1);
    enterZone(state, state.farming ? zone : zone + 1);
    return;
  }

  tryCatch(state, state.enemy.speciesId, state.enemy.shiny);

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

/** Schadensmultiplikator gegen den aktuellen Gegner (Bossschaden, Primzahlwelt) */
function targetMult(state: GameState): Decimal {
  const boss = state.theorem !== null || isBossZone(state.enemy.zone);
  let mult = boss ? bossDamageMult(state) : D(1);
  if (ruleActive(state, 'primeWorld') && !state.theorem && !isPrime(state.enemy.zone)) {
    mult = mult.mul(BALANCING.challengeRules.nonPrimeDamage);
  }
  return mult;
}

/** Erster Sieg über einen Systemboss schaltet ein Stück Story frei */
function recordStory(state: GameState, zone: number): void {
  const system = starSystem(zone);
  if (!state.storySeen.includes(system)) state.storySeen.push(system);
}

/**
 * Klick auf den Gegner. Mit Forschung können Klicks kritisch treffen.
 * Autoklicks (manual = false) zählen nicht als Aktivität für den Leerlaufbonus von Null.
 */
export function clickEnemy(state: GameState, manual = true): boolean {
  if (ruleActive(state, 'noClick')) return false;
  state.clicks += 1;
  if (manual) state.lastClick = state.playTime;
  const dps = teamDps(state);
  // Pi: +π % der Team DPS je Pi Monster
  const piBonus = dps.mul(BALANCING.types.piClickShare * typeCountInTeam(state, 'pi'));
  let damage = clickDamage(dps, clickBonus(state)).add(piBonus).mul(targetMult(state));
  const chance = critChance(state);
  if (chance > 0 && nextRandom(state) < chance) damage = damage.mul(critMult(state));
  return dealDamage(state, damage);
}

/** Schaden des Teams über dtSeconds. Wird von der Tickschleife aufgerufen. */
export function applyTeamDamage(state: GameState, dtSeconds: number): void {
  if (dtSeconds <= 0) return;
  const dps = teamDps(state);
  if (dps.lte(0)) return;
  dealDamage(state, dps.mul(dtSeconds).mul(targetMult(state)));
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
