import { BALANCING } from '../data/balancing';
import type { GameState } from '../core/state';
import { spawnEnemy } from './spawning';
import { D, type Decimal } from '../util/decimal';
import { gravitationMult } from './darkmatter';
import { challengeMult, originEffect } from './rules';
import { startSpheresBonus, supernovaStartZone } from './research';
import { riemannMult } from './endgame';

/** sternenstaub = floor( (zyklusEnergie / energyDivisor)^exponent ) */
export function stardustFor(cycleEnergy: Decimal): Decimal {
  const { energyDivisor, exponent } = BALANCING.supernova;
  if (cycleEnergy.lte(0)) return D(0);
  return cycleEnergy.div(energyDivisor).pow(exponent).floor();
}

/** Sternenstaubgewinn einer Supernova, verstärkt durch die Gravitation der Dunklen Materie und die Riemann Spirale */
export function stardustGain(state: GameState): Decimal {
  const base = stardustFor(state.cycleEnergy)
    .mul(1 + originEffect(state, 'sternenquelle'))
    .mul(challengeMult(state, 'stardust'))
    .mul(riemannMult(state));
  return (state.darkMatterTotal.lte(0) ? base : base.mul(gravitationMult(state))).floor();
}

/** passiver Bonus: ×(1 + bonusPerStardust * unausgegebenerSternenstaub) */
export function stardustBonus(state: GameState): Decimal {
  return state.stardust.mul(BALANCING.supernova.bonusPerStardust).add(1);
}

/** Zone, ab der eine Supernova möglich ist (Ursprung „Frühe Supernova“ senkt sie) */
export function supernovaZone(state: GameState): number {
  return Math.max(1, BALANCING.supernova.minZone - originEffect(state, 'fruehesupernova'));
}

export function canSupernova(state: GameState): boolean {
  return state.highestZone >= supernovaZone(state) && stardustGain(state).gt(0);
}

/**
 * Supernova: gibt Sternenstaub und setzt Energie, Zone, Monsterlevel und Module zurück.
 * Sammlung, Team, Sphären, Forschung, Entwicklungen und Einstellungen bleiben.
 * Monster fallen auf Level 0: Das erste Level kostet wieder die Basiskosten,
 * sonst würden starke späte Arten die frühen Zonen kostenlos überrollen.
 */
export function supernova(state: GameState): boolean {
  if (!canSupernova(state)) return false;
  const gain = stardustGain(state);
  state.stardust = state.stardust.add(gain);
  state.stardustCycle = state.stardustCycle.add(gain);
  state.supernovas += 1;
  resetRun(state);
  return true;
}

/**
 * Setzt einen Durchlauf zurück: Energie, Zone, Monsterlevel (auf 0) und Module.
 * Gemeinsam genutzt von Supernova und Schwarzem Loch.
 */
export function resetRun(state: GameState): void {
  state.energy = D(BALANCING.world.resetEnergy);
  state.cycleEnergy = D(0);
  state.modules = {};
  for (const entry of Object.values(state.collection)) {
    if (entry) entry.level = 0;
  }
  const zone = supernovaStartZone(state);
  state.zone = zone;
  state.highestZone = zone;
  state.killsInZone = 0;
  state.farming = false;
  state.bossTimeLeft = 0;
  state.enemy = spawnEnemy(state, zone);
  state.spheres.standard += startSpheresBonus(state);
  state.cycleStart = state.playTime;
  state.automation.bossWait = 0;
  state.endgame.run = null;
}
