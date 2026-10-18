import { BALANCING } from '../data/balancing';
import { AUTOMATION_ORDER } from '../data/darkmatter';
import type { GameState } from '../core/state';
import { D, type Decimal } from '../util/decimal';
import { resetRun } from './prestige';
import { originEffect, originLevel } from './rules';

/** Unendlichkeit erreicht: Zyklusenergie mindestens infinityEnergy */
export function canBigBang(state: GameState): boolean {
  return state.cycleEnergy.gte(BALANCING.bigBang.infinityEnergy) && state.challenge.active === null;
}

/** ursprungspunkte = basePoints + challengeBonus (abgeschlossene Challenges) */
export function originGain(state: GameState): Decimal {
  const { basePoints, pointsPerChallenge } = BALANCING.bigBang;
  return D(basePoints + pointsPerChallenge * state.challenge.completed.length);
}

/**
 * Setzt das Universum zurück: Durchlauf, Sternenstaub, Forschung, Dunkle Materie und deren
 * Upgrades. Mit „Automatik behalten“ bleiben gekaufte Automatiken. Sammlung, Sterne,
 * Entwicklungen, Zuchten, Ursprungsupgrades und Challenges bleiben immer.
 */
export function resetUniverse(state: GameState): void {
  state.stardust = D(0);
  state.stardustCycle = D(0);
  state.research = {};
  const kept: GameState['dmUpgrades'] = {};
  if (originLevel(state, 'automatikBehalten') > 0) {
    for (const id of AUTOMATION_ORDER) if (state.dmUpgrades[id]) kept[id] = state.dmUpgrades[id];
  }
  state.dmUpgrades = kept;
  state.darkMatter = D(originEffect(state, 'urmaterie'));
  state.darkMatterTotal = D(0);
  state.theorem = null;
  resetRun(state);
}

/** Urknall: Ursprungspunkte gegen fast alles. Danach gibt es keine Grenze bei Unendlichkeit mehr. */
export function bigBang(state: GameState): boolean {
  if (!canBigBang(state)) return false;
  const gain = originGain(state);
  state.originPoints = state.originPoints.add(gain);
  state.originTotal = state.originTotal.add(gain);
  state.bigBangs += 1;
  resetUniverse(state);
  return true;
}
