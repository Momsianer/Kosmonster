import { BALANCING } from '../data/balancing';
import type { GameState } from '../core/state';
import { spawnEnemy } from './spawning';
import { D, type Decimal } from '../util/decimal';
import { startSpheresBonus, supernovaStartZone } from './research';

/** sternenstaub = floor( (zyklusEnergie / energyDivisor)^exponent ) */
export function stardustFor(cycleEnergy: Decimal): Decimal {
  const { energyDivisor, exponent } = BALANCING.supernova;
  if (cycleEnergy.lte(0)) return D(0);
  return cycleEnergy.div(energyDivisor).pow(exponent).floor();
}

export function stardustGain(state: GameState): Decimal {
  return stardustFor(state.cycleEnergy);
}

/** passiver Bonus: ×(1 + bonusPerStardust * unausgegebenerSternenstaub) */
export function stardustBonus(state: GameState): Decimal {
  return state.stardust.mul(BALANCING.supernova.bonusPerStardust).add(1);
}

export function canSupernova(state: GameState): boolean {
  return state.highestZone >= BALANCING.supernova.minZone && stardustGain(state).gt(0);
}

/**
 * Supernova: gibt Sternenstaub und setzt Energie, Zone, Monsterlevel und Module zurück.
 * Sammlung, Team, Sphären, Forschung, Entwicklungen und Einstellungen bleiben.
 * Monster fallen auf Level 0: Das erste Level kostet wieder die Basiskosten,
 * sonst würden starke späte Arten die frühen Zonen kostenlos überrollen.
 */
export function supernova(state: GameState): boolean {
  if (!canSupernova(state)) return false;
  state.stardust = state.stardust.add(stardustGain(state));
  state.supernovas += 1;
  state.energy = D(0);
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
  return true;
}
