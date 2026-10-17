import { BALANCING } from '../data/balancing';
import { researchPrerequisite, type ResearchId } from '../data/research';
import type { GameState } from '../core/state';
import { D, powInt, type Decimal } from '../util/decimal';

type ResearchMap = Partial<Record<ResearchId, number>>;

export function researchLevel(research: ResearchMap, id: ResearchId): number {
  return research[id] ?? 0;
}

/** Wirkung eines Knotens: perLevel * stufe */
function effect(research: ResearchMap, id: ResearchId): number {
  return BALANCING.research.nodes[id].perLevel * researchLevel(research, id);
}

/** Kosten der nächsten Stufe: basis * costGrowth^stufe */
export function researchCost(id: ResearchId, level: number): Decimal {
  return powInt(BALANCING.research.costGrowth, level).mul(BALANCING.research.nodes[id].baseCost);
}

export function isResearchMaxed(state: GameState, id: ResearchId): boolean {
  return researchLevel(state.research, id) >= BALANCING.research.nodes[id].maxLevel;
}

/** Voraussetzung erfüllt: voriger Knoten im Ast hat mindestens Stufe 1 */
export function isResearchAvailable(state: GameState, id: ResearchId): boolean {
  const prerequisite = researchPrerequisite(id);
  return prerequisite === null || researchLevel(state.research, prerequisite) > 0;
}

export function canBuyResearch(state: GameState, id: ResearchId): boolean {
  if (!isResearchAvailable(state, id) || isResearchMaxed(state, id)) return false;
  return state.stardust.gte(researchCost(id, researchLevel(state.research, id)));
}

export function buyResearch(state: GameState, id: ResearchId): boolean {
  if (!canBuyResearch(state, id)) return false;
  const level = researchLevel(state.research, id);
  state.stardust = state.stardust.sub(researchCost(id, level));
  state.research[id] = level + 1;
  return true;
}

// ─── Wirkungen ──────────────────────────────────────────────

export function clickBonus(state: GameState): number {
  return BALANCING.click.baseClickBonus + effect(state.research, 'klickkraft');
}

export function teamDpsResearchMult(state: GameState): Decimal {
  return D(1 + effect(state.research, 'teamstaerke'));
}

export function critChance(state: GameState): number {
  return Math.min(1, effect(state.research, 'kritchance'));
}

export function critMult(state: GameState): number {
  return BALANCING.click.critMult + effect(state.research, 'kritschaden');
}

export function bossTimeLimitFor(research: ResearchMap): number {
  return BALANCING.boss.timeLimitSeconds + effect(research, 'bosszeit');
}

export function bossTimeLimit(state: GameState): number {
  return bossTimeLimitFor(state.research);
}

export function bossDamageMult(state: GameState): Decimal {
  return D(1 + effect(state.research, 'bossschaden'));
}

export function catchResearchBonus(state: GameState): number {
  return BALANCING.catching.baseResearchBonus + effect(state.research, 'fangglueck');
}

export function sphereCostMult(state: GameState): number {
  return Math.max(0, 1 - effect(state.research, 'sphaerenrabatt'));
}

export function teamSlotsFor(research: ResearchMap): number {
  return BALANCING.monster.teamSlots + effect(research, 'teamplatz');
}

export function startSpheresBonus(state: GameState): number {
  return effect(state.research, 'startsphaeren');
}

export function rareSpawnBoost(state: GameState): number {
  return 1 + effect(state.research, 'seltenheit');
}

export function shinyChanceMult(state: GameState): number {
  return 1 + effect(state.research, 'polarstern');
}

export function productionResearchMult(state: GameState): Decimal {
  return D(1 + effect(state.research, 'produktion'));
}

export function moduleCostMult(state: GameState): number {
  return Math.max(0, 1 - effect(state.research, 'modulrabatt'));
}

export function productionToDpsShare(state: GameState): number {
  return effect(state.research, 'umwandlung');
}

export function offlineBonus(state: GameState): number {
  return effect(state.research, 'offlinebonus');
}

export function offlineLimitSeconds(state: GameState): number {
  return BALANCING.offline.maxSeconds + effect(state.research, 'offlinelimit');
}

export function supernovaStartZone(state: GameState): number {
  return BALANCING.world.startZone + effect(state.research, 'startzone');
}
