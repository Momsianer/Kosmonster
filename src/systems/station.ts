import { BALANCING } from '../data/balancing';
import { getModule, MODULES, type ModuleId } from '../data/modules';
import { moduleProduction } from '../core/formulas';
import type { GameState } from '../core/state';
import { addEnergy } from '../core/state';
import { D, type Decimal } from '../util/decimal';
import { stardustBonus } from './prestige';
import { tideMult } from './challenges';
import { moduleCostMult, productionResearchMult } from './research';
import { challengeMult, originEffect, purchaseAffordable, purchaseCost, ruleActive } from './rules';

export function moduleCount(state: GameState, id: ModuleId): number {
  return state.modules[id] ?? 0;
}

/** Bonus auf alle Produktion: Sternenstaub, Forschung, Ursprung, Challenges und Gezeiten */
export function productionMult(state: GameState): Decimal {
  if (ruleActive(state, 'noStation')) return D(0);
  return stardustBonus(state)
    .mul(productionResearchMult(state))
    .mul(1 + originEffect(state, 'urproduktion'))
    .mul(challengeMult(state, 'production'))
    .mul(tideMult(state));
}

/** Basiskosten eines Moduls nach Forschungsrabatt */
function discountedBase(state: GameState, baseCost: number): Decimal {
  return D(baseCost).mul(moduleCostMult(state));
}

/** Energie pro Sekunde eines Modultyps */
export function productionOf(state: GameState, id: ModuleId): Decimal {
  const module = getModule(id);
  if (!module) return D(0);
  return moduleProduction(module.production, moduleCount(state, id)).mul(productionMult(state));
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
  const base = discountedBase(state, module.baseCost);
  const count = amount === 'max' ? Math.max(1, purchaseAffordable(state, state.energy, base, r, owned)) : amount;
  return { count, cost: purchaseCost(state, base, r, owned, count) };
}

/** Baut bis zu `amount` Module, 'max' = so viele wie bezahlbar. Gibt die Zahl gebauter Module zurück. */
export function buyModule(state: GameState, id: ModuleId, amount: number | 'max'): number {
  const module = getModule(id);
  if (!module || ruleActive(state, 'noStation')) return 0;
  const r = BALANCING.station.costGrowth;
  const owned = moduleCount(state, id);
  const base = discountedBase(state, module.baseCost);
  const affordable = purchaseAffordable(state, state.energy, base, r, owned);
  const n = amount === 'max' ? affordable : Math.min(amount, affordable);
  if (n <= 0) return 0;
  state.energy = state.energy.sub(purchaseCost(state, base, r, owned, n)).max(0);
  state.modules[id] = owned + n;
  return n;
}

/** Produktion der Raumstation über dtSeconds. Wird von der Tickschleife aufgerufen. */
export function applyProduction(state: GameState, dtSeconds: number): void {
  if (dtSeconds <= 0) return;
  addEnergy(state, totalProduction(state).mul(dtSeconds));
}
