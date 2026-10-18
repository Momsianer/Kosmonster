import { BALANCING } from '../data/balancing';
import type { OriginId } from '../data/origin';
import type { GameState } from '../core/state';
import { powInt, type Decimal } from '../util/decimal';
import { originLevel } from './rules';

/** Kosten der nächsten Stufe: basis * costGrowth^stufe */
export function originCost(id: OriginId, level: number): Decimal {
  return powInt(BALANCING.origin.costGrowth, level).mul(BALANCING.origin.upgrades[id].baseCost);
}

export function isOriginMaxed(state: GameState, id: OriginId): boolean {
  return originLevel(state, id) >= BALANCING.origin.upgrades[id].maxLevel;
}

export function canBuyOrigin(state: GameState, id: OriginId): boolean {
  return !isOriginMaxed(state, id) && state.originPoints.gte(originCost(id, originLevel(state, id)));
}

export function buyOrigin(state: GameState, id: OriginId): boolean {
  if (!canBuyOrigin(state, id)) return false;
  const level = originLevel(state, id);
  state.originPoints = state.originPoints.sub(originCost(id, level));
  state.originUpgrades[id] = level + 1;
  if (id === 'autoschwarzloch') state.automation.enabled.autoschwarzloch ??= true;
  return true;
}
