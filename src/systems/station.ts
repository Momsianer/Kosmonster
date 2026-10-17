import { BALANCING } from '../data/balancing';
import { getModule, MODULES, type ModuleId } from '../data/modules';
import { bulkCost, maxAffordable, moduleProduction } from '../core/formulas';
import type { GameState } from '../core/state';
import { D, type Decimal } from '../util/decimal';

export function moduleCount(state: GameState, id: ModuleId): number {
  return state.modules[id] ?? 0;
}

/** Energie pro Sekunde eines Modultyps */
export function productionOf(state: GameState, id: ModuleId): Decimal {
  const module = getModule(id);
  if (!module) return D(0);
  return moduleProduction(module.production, moduleCount(state, id));
}

/** Gesamte Energie pro Sekunde der Raumstation */
export function totalProduction(state: GameState): Decimal {
  return MODULES.reduce((sum, m) => sum.add(productionOf(state, m.id)), D(0));
}

/** Kosten für `amount` Module, bei 'max' für so viele wie bezahlbar (mindestens 1) */
export function moduleBuyCost(
  state: GameState,
  id: ModuleId,
  amount: number | 'max',
): { count: number; cost: Decimal } {
  const module = getModule(id);
  if (!module) return { count: 0, cost: D(0) };
  const r = BALANCING.station.costGrowth;
  const owned = moduleCount(state, id);
  const count = amount === 'max' ? Math.max(1, maxAffordable(state.energy, module.baseCost, r, owned)) : amount;
  return { count, cost: bulkCost(module.baseCost, r, owned, count) };
}

/** Baut bis zu `amount` Module, 'max' = so viele wie bezahlbar. Gibt die Zahl gebauter Module zurück. */
export function buyModule(state: GameState, id: ModuleId, amount: number | 'max'): number {
  const module = getModule(id);
  if (!module) return 0;
  const r = BALANCING.station.costGrowth;
  const owned = moduleCount(state, id);
  const affordable = maxAffordable(state.energy, module.baseCost, r, owned);
  const n = amount === 'max' ? affordable : Math.min(amount, affordable);
  if (n <= 0) return 0;
  state.energy = state.energy.sub(bulkCost(module.baseCost, r, owned, n)).max(0);
  state.modules[id] = owned + n;
  return n;
}

/** Produktion der Raumstation über dtSeconds. Wird von der Tickschleife aufgerufen. */
export function applyProduction(state: GameState, dtSeconds: number): void {
  if (dtSeconds <= 0) return;
  const gain = totalProduction(state).mul(dtSeconds);
  if (gain.lte(0)) return;
  state.energy = state.energy.add(gain);
  state.totalEnergy = state.totalEnergy.add(gain);
}
