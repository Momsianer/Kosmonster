import { BALANCING } from '../data/balancing';
import { dmPrerequisite, isAutomationId, type AutomationId, type DmUpgradeId } from '../data/darkmatter';
import type { GameState } from '../core/state';
import { powInt, type Decimal } from '../util/decimal';

type DmMap = Partial<Record<DmUpgradeId, number>>;

export function dmLevel(upgrades: DmMap, id: DmUpgradeId): number {
  return upgrades[id] ?? 0;
}

/** Wirkung eines Upgrades: perLevel * stufe */
function dmEffect(upgrades: DmMap, id: DmUpgradeId): number {
  return BALANCING.darkMatter.upgrades[id].perLevel * dmLevel(upgrades, id);
}

/** Kosten der nächsten Stufe: basis * costGrowth^stufe */
export function dmCost(id: DmUpgradeId, level: number): Decimal {
  return powInt(BALANCING.darkMatter.costGrowth, level).mul(BALANCING.darkMatter.upgrades[id].baseCost);
}

export function isDmMaxed(state: GameState, id: DmUpgradeId): boolean {
  return dmLevel(state.dmUpgrades, id) >= BALANCING.darkMatter.upgrades[id].maxLevel;
}

export function isDmAvailable(state: GameState, id: DmUpgradeId): boolean {
  const prerequisite = dmPrerequisite(id);
  return prerequisite === null || dmLevel(state.dmUpgrades, prerequisite) > 0;
}

export function canBuyDm(state: GameState, id: DmUpgradeId): boolean {
  if (!isDmAvailable(state, id) || isDmMaxed(state, id)) return false;
  return state.darkMatter.gte(dmCost(id, dmLevel(state.dmUpgrades, id)));
}

/** Kauft eine Stufe. Neu gekaufte Automatiken sind sofort eingeschaltet. */
export function buyDm(state: GameState, id: DmUpgradeId): boolean {
  if (!canBuyDm(state, id)) return false;
  const level = dmLevel(state.dmUpgrades, id);
  state.darkMatter = state.darkMatter.sub(dmCost(id, level));
  state.dmUpgrades[id] = level + 1;
  if (level === 0 && isAutomationId(id)) state.automation.enabled[id] ??= true;
  return true;
}

export function ownsAutomation(state: GameState, id: AutomationId): boolean {
  return dmLevel(state.dmUpgrades, id) > 0;
}

/** Gekauft und eingeschaltet */
export function automationActive(state: GameState, id: AutomationId): boolean {
  return ownsAutomation(state, id) && state.automation.enabled[id] !== false;
}

/** Klicks pro Sekunde des Autoklickers */
export function autoclickRate(state: GameState): number {
  const level = dmLevel(state.dmUpgrades, 'autoklicker');
  if (level <= 0) return 0;
  return BALANCING.automation.autoclickBase + BALANCING.darkMatter.upgrades.autoklicker.perLevel * (level - 1);
}

/** gravitationsMult auf Sternenstaubertrag = (1 + verdienteDunkleMaterie)^gravityExponent */
export function gravitationMult(state: GameState): Decimal {
  return state.darkMatterTotal.add(1).pow(BALANCING.blackHole.gravityExponent);
}

export function dmTeamSlots(upgrades: DmMap): number {
  return dmEffect(upgrades, 'teamplaetze');
}

/** Anteil der Forschungsstufen, der beim Schwarzen Loch erhalten bleibt */
export function researchKeepShare(state: GameState): number {
  return Math.min(1, dmEffect(state.dmUpgrades, 'erinnerung'));
}

export function breedingSlotCount(state: GameState): number {
  return BALANCING.breeding.baseSlots + dmEffect(state.dmUpgrades, 'brutplatz');
}
