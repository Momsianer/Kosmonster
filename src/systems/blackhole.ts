import { BALANCING } from '../data/balancing';
import type { GameState } from '../core/state';
import { D, type Decimal } from '../util/decimal';
import { researchKeepShare } from './darkmatter';
import { resetRun } from './prestige';

/** dunkleMaterie = floor( (sternenstaubDiesesZyklus / stardustDivisor)^exponent ) */
export function darkMatterFor(stardustCycle: Decimal): Decimal {
  const { stardustDivisor, exponent } = BALANCING.blackHole;
  if (stardustCycle.lte(0)) return D(0);
  return stardustCycle.div(stardustDivisor).pow(exponent).floor();
}

export function darkMatterGain(state: GameState): Decimal {
  return darkMatterFor(state.stardustCycle);
}

export function canBlackHole(state: GameState): boolean {
  return state.stardustCycle.gte(BALANCING.blackHole.minStardust) && darkMatterGain(state).gt(0);
}

/**
 * Schwarzes Loch: gibt Dunkle Materie und setzt alles zurück, was eine Supernova
 * zurücksetzt, dazu Sternenstaub und Forschung (ein Teil bleibt mit „Erinnerung“).
 * Sammlung, Sterne, Entwicklungen, Zuchten und Upgrades für Dunkle Materie bleiben.
 */
export function blackHole(state: GameState): boolean {
  if (!canBlackHole(state)) return false;
  const gain = darkMatterGain(state);
  state.darkMatter = state.darkMatter.add(gain);
  state.darkMatterTotal = state.darkMatterTotal.add(gain);
  state.blackHoles += 1;
  state.stardust = D(0);
  state.stardustCycle = D(0);
  const keep = researchKeepShare(state);
  for (const [id, level] of Object.entries(state.research) as [keyof typeof state.research, number][]) {
    const kept = Math.floor(level * keep);
    if (kept > 0) state.research[id] = kept;
    else delete state.research[id];
  }
  resetRun(state);
  return true;
}
