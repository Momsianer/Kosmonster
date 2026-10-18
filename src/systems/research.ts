import { BALANCING } from '../data/balancing';
import { researchPrerequisite, type ResearchId } from '../data/research';
import type { GameState } from '../core/state';
import type { DmUpgradeId } from '../data/darkmatter';
import { dmTeamSlots } from './darkmatter';
import { challengeAdd, challengeMult, ruleActive } from './rules';
import { D, powInt, type Decimal } from '../util/decimal';

type ResearchMap = Partial<Record<ResearchId, number>>;

export function researchLevel(research: ResearchMap, id: ResearchId): number {
  return research[id] ?? 0;
}

/** Wirkung eines Knotens: perLevel * stufe */
function effect(research: ResearchMap, id: ResearchId): number {
  return BALANCING.research.nodes[id].perLevel * researchLevel(research, id);
}

/** Wirksame Forschung: in „Ohne Gedächtnis“ keine */
function researchOf(state: GameState): ResearchMap {
  return ruleActive(state, 'noResearch') ? {} : state.research;
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
  return BALANCING.click.baseClickBonus + effect(researchOf(state), 'klickkraft');
}

export function teamDpsResearchMult(state: GameState): Decimal {
  return D(1 + effect(researchOf(state), 'teamstaerke'));
}

export function critChance(state: GameState): number {
  return Math.min(1, effect(researchOf(state), 'kritchance'));
}

export function critMult(state: GameState): number {
  return BALANCING.click.critMult + effect(researchOf(state), 'kritschaden');
}

export function bossTimeLimitFor(research: ResearchMap): number {
  return BALANCING.boss.timeLimitSeconds + effect(research, 'bosszeit');
}

export function bossTimeLimit(state: GameState): number {
  return bossTimeLimitFor(researchOf(state)) + challengeAdd(state, 'bossTime');
}

export function bossDamageMult(state: GameState): Decimal {
  return D(1 + effect(researchOf(state), 'bossschaden'));
}

export function catchResearchBonus(state: GameState): number {
  return BALANCING.catching.baseResearchBonus + effect(researchOf(state), 'fangglueck');
}

export function sphereCostMult(state: GameState): number {
  return Math.max(0, 1 - effect(researchOf(state), 'sphaerenrabatt'));
}

/** Teamplätze: Start, Forschung „Teamplatz“ und Dunkle Materie „Teamplätze“ */
export function teamSlotsFor(research: ResearchMap, dmUpgrades: Partial<Record<DmUpgradeId, number>> = {}): number {
  return BALANCING.monster.teamSlots + effect(research, 'teamplatz') + dmTeamSlots(dmUpgrades);
}

export function startSpheresBonus(state: GameState): number {
  return effect(researchOf(state), 'startsphaeren');
}

export function rareSpawnBoost(state: GameState): number {
  return 1 + effect(researchOf(state), 'seltenheit');
}

export function shinyChanceMult(state: GameState): number {
  return 1 + effect(researchOf(state), 'polarstern');
}

export function productionResearchMult(state: GameState): Decimal {
  return D(1 + effect(researchOf(state), 'produktion'));
}

export function moduleCostMult(state: GameState): number {
  return Math.max(0, 1 - effect(researchOf(state), 'modulrabatt')) * challengeMult(state, 'moduleCost');
}

export function productionToDpsShare(state: GameState): number {
  return effect(researchOf(state), 'umwandlung');
}

export function offlineBonus(state: GameState): number {
  return effect(researchOf(state), 'offlinebonus');
}

export function offlineLimitSeconds(state: GameState): number {
  return BALANCING.offline.maxSeconds + effect(researchOf(state), 'offlinelimit') + challengeAdd(state, 'offlineLimit');
}

export function supernovaStartZone(state: GameState): number {
  return BALANCING.world.startZone + effect(researchOf(state), 'startzone');
}
