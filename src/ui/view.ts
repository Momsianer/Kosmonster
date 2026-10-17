import type { OfflineReport } from '../core/game';
import { enemyKind, isBossZone, starSystem, type EnemyKind } from '../core/formulas';
import type { GameState } from '../core/state';
import { BALANCING } from '../data/balancing';
import { getSpecies, RARITY_COLORS, SPECIES, TYPE_COLORS, type MonsterType, type SpeciesId } from '../data/monsters';
import { planetForZone } from '../data/planets';
import { SPHERE_TYPES, type SphereType } from '../data/spheres';
import { starProgress, starsFor } from '../core/formulas';
import { t, type TranslationKey } from '../i18n';
import { RESEARCH_BRANCHES, RESEARCH_TREE, researchPrerequisite, type ResearchBranch, type ResearchId } from '../data/research';
import { currentSphereCost, totalSpheres } from '../systems/catching';
import { canEvolve, evolutionCost, evolutionLevel, hasNextEvolution } from '../systems/evolution';
import { canSupernova, stardustBonus, stardustGain } from '../systems/prestige';
import {
  bossTimeLimit,
  canBuyResearch,
  clickBonus,
  catchResearchBonus,
  isResearchAvailable,
  isResearchMaxed,
  researchCost,
  researchLevel,
} from '../systems/research';
import { catchChance, clickDamage } from '../core/formulas';
import { levelUpCost, monsterDps, speciesStars, teamDps, teamSlots } from '../systems/monsters';
import { activeHint, isUnlocked, type UnlockId } from '../systems/unlocks';
import { MODULES, type ModuleId } from '../data/modules';
import { moduleMult, nextModuleUpgrade } from '../core/formulas';
import { moduleBuyCost, moduleCount, productionOf, totalProduction } from '../systems/station';
import { formatDuration, formatNumber, formatPercent, formatSeconds } from '../util/format';

/** Wie lange die Fangmeldung sichtbar bleibt (Spielzeit in Sekunden) */
const CATCH_NOTICE_SECONDS = 3;

export type BuyAmount = 1 | 10 | 100 | 'max';
export const BUY_AMOUNTS: readonly BuyAmount[] = [1, 10, 100, 'max'];

/** Name je Evolutionsstufe: species.art_001, species.art_001_e1, … */
export function speciesName(id: SpeciesId, stage = 0): string {
  if (stage <= 0) return t(`species.${id}`);
  const key = `species.${id}_e${stage}` as TranslationKey;
  const name = t(key);
  return name === key ? t(`species.${id}`) : name;
}

/** Zahl für den Platzhalter {mult} in Typbeschreibungen */
function abilityMult(type: MonsterType): string {
  if (type === 'prim') return formatNumber(BALANCING.types.primeZoneMult);
  if (type === 'fibonacci') return formatNumber(BALANCING.types.fibonacciMult);
  return '';
}

function progressText(copies: number): string {
  const progress = starProgress(copies);
  return progress ? t('collection.nextStar', progress) : '';
}

function stageOf(state: GameState, id: SpeciesId): number {
  return state.collection[id]?.evolution ?? 0;
}

/** Wert einer Forschungsstufe für die Beschreibung */
function researchPer(id: ResearchId): string {
  const per = BALANCING.research.nodes[id].perLevel;
  switch (id) {
    case 'offlinelimit':
      return formatDuration(per);
    case 'teamstaerke':
    case 'kritchance':
    case 'bossschaden':
    case 'fangglueck':
    case 'sphaerenrabatt':
    case 'produktion':
    case 'modulrabatt':
    case 'umwandlung':
    case 'offlinebonus':
      return formatPercent(per);
    default:
      return formatNumber(per);
  }
}

export interface ResearchNodeView {
  id: ResearchId;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  maxed: boolean;
  available: boolean;
  requires: string;
  cost: string;
  affordable: boolean;
}

function researchNodes(state: GameState): { branch: ResearchBranch; name: string; nodes: ResearchNodeView[] }[] {
  return RESEARCH_BRANCHES.map((branch) => ({
    branch,
    name: t(`research.branch.${branch}`),
    nodes: RESEARCH_TREE[branch].map((id) => {
      const level = researchLevel(state.research, id);
      const prerequisite = researchPrerequisite(id);
      return {
        id,
        name: t(`research.${id}.name`),
        description: t(`research.${id}.description`, { per: researchPer(id) }),
        level,
        maxLevel: BALANCING.research.nodes[id].maxLevel,
        maxed: isResearchMaxed(state, id),
        available: isResearchAvailable(state, id),
        requires: prerequisite ? t('research.requires', { name: t(`research.${prerequisite}.name`) }) : '',
        cost: formatNumber(researchCost(id, level)),
        affordable: canBuyResearch(state, id),
      };
    }),
  }));
}

export interface TeamMemberView {
  id: SpeciesId;
  stage: number;
  stars: number;
  shiny: boolean;
  ability: string;
  name: string;
  typeName: string;
  typeColor: string;
  level: number;
  dps: string;
  levels: number;
  cost: string;
  affordable: boolean;
  /** Evolution: '' = keine weitere Stufe, sonst Kosten oder benötigtes Level */
  evolutionCost: string;
  evolutionLevel: number | null;
  canEvolve: boolean;
}

export interface SphereView {
  type: SphereType;
  name: string;
  owned: number;
  catchMult: string;
  cost1: string;
  cost10: string;
  canBuy1: boolean;
  canBuy10: boolean;
}

export interface ModuleView {
  id: ModuleId;
  name: string;
  owned: number;
  production: string;
  mult: string;
  nextUpgrade: number | null;
  count: number;
  cost: string;
  affordable: boolean;
}

export interface CollectionEntryView {
  id: SpeciesId;
  stage: number;
  stars: number;
  maxStars: number;
  shiny: boolean;
  rarityColor: string;
  starProgress: string;
  big: boolean;
  number: number;
  caught: boolean;
  name: string;
  typeName: string;
  rarityName: string;
  caughtCount: number;
  inTeam: boolean;
}

/** Aufbereitete Werte für die Oberfläche, damit Komponenten keine Spiellogik brauchen */
export interface GameView {
  energy: string;
  zone: number;
  starSystem: number;
  highestZone: number;
  killsInZone: number;
  enemiesPerZone: number;
  enemyKind: EnemyKind;
  enemySpecies: SpeciesId;
  enemyName: string;
  enemyShiny: boolean;
  enemyRarity: string;
  enemyRarityColor: string;
  planetName: string;
  planetEffect: string;
  planetRecommended: string;
  planetColor: string;
  enemyHp: string;
  enemyMaxHp: string;
  /** Anteil der verbleibenden Leben zwischen 0 und 1 */
  enemyHpFraction: number;
  /** Verbleibende Bosszeit als Text, leer außerhalb von Bosszonen */
  bossTime: string;
  /** Anteil der verbleibenden Bosszeit zwischen 0 und 1 */
  bossTimeFraction: number;
  bossTimeLimit: number;
  farming: boolean;
  canZoneDown: boolean;
  canZoneUp: boolean;
  /** Im Farmmodus vor einem Boss, der noch nicht besiegt wurde */
  bossBlocked: boolean;
  enemiesDefeated: number;
  offline: { duration: string; energy: string; hasEnergy: boolean } | null;

  teamUnlocked: boolean;
  stationUnlocked: boolean;
  supernovaUnlocked: boolean;
  researchUnlocked: boolean;
  evolutionUnlocked: boolean;
  stardust: string;
  stardustBonus: string;
  showStardust: boolean;
  stardustGain: string;
  canSupernova: boolean;
  supernovaZone: number;
  supernovas: number;
  research: { branch: ResearchBranch; name: string; nodes: ResearchNodeView[] }[];
  shopUnlocked: boolean;
  production: string;
  modules: ModuleView[];
  teamDps: string;
  clickDamage: string;
  team: TeamMemberView[];
  teamSlots: number;
  teamFull: boolean;
  collection: CollectionEntryView[];
  collectionCount: number;
  shinyCount: number;
  spheres: SphereView[];
  totalSpheres: number;
  catchOnlyNew: boolean;
  catchChanceCommon: string;
  catchChanceUncommon: string;
  catchNotice: string;
  hint: UnlockId | null;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function teamMember(state: GameState, id: SpeciesId, amount: BuyAmount): TeamMemberView | null {
  const species = getSpecies(id);
  const entry = state.collection[id];
  if (!species || !entry) return null;
  const { levels, cost } = levelUpCost(state, id, amount);
  return {
    id,
    stage: entry.evolution,
    stars: speciesStars(state, id),
    shiny: entry.shiny,
    ability: t(`types.${species.type}.ability`, { mult: abilityMult(species.type) }),
    name: speciesName(id, entry.evolution),
    typeName: t(`types.${species.type}.name`),
    typeColor: TYPE_COLORS[species.type],
    level: entry.level,
    dps: formatNumber(monsterDps(state, id)),
    levels,
    cost: formatNumber(cost),
    affordable: state.energy.gte(cost),
    evolutionCost: hasNextEvolution(state, id) ? formatNumber(evolutionCost(species.number, entry.evolution) ?? 0) : '',
    evolutionLevel: hasNextEvolution(state, id) ? evolutionLevel(entry.evolution) : null,
    canEvolve: canEvolve(state, id),
  };
}

/** Sichtbar sind gebaute Module und jeweils das nächste noch unbekannte */
function stationModules(state: GameState, amount: BuyAmount): ModuleView[] {
  const views: ModuleView[] = [];
  MODULES.forEach((m, i) => {
    const owned = moduleCount(state, m.id);
    const previous = MODULES[i - 1];
    const visible = i === 0 || owned > 0 || (previous !== undefined && moduleCount(state, previous.id) > 0);
    if (!visible) return;
    const { count, cost } = moduleBuyCost(state, m.id, amount);
    views.push({
      id: m.id,
      name: t(`station.${m.id}.name`),
      owned,
      production: formatNumber(productionOf(state, m.id)),
      mult: formatNumber(moduleMult(owned)),
      nextUpgrade: nextModuleUpgrade(owned),
      count,
      cost: formatNumber(cost),
      affordable: state.energy.gte(cost),
    });
  });
  return views;
}

export function createView(
  state: GameState,
  offline: OfflineReport | null = null,
  buyAmount: BuyAmount = 1,
): GameView {
  const { enemy } = state;
  const kind = enemyKind(enemy.zone);
  const limit = bossTimeLimit(state);
  const fraction = enemy.maxHp.gt(0) ? enemy.hp.div(enemy.maxHp).toNumber() : 0;
  const dps = teamDps(state);
  const lastCatch = state.lastCatch;
  const planet = planetForZone(state.zone);
  const enemySpecies = getSpecies(enemy.speciesId);
  const showCatch = lastCatch && state.playTime - lastCatch.time < CATCH_NOTICE_SECONDS;

  return {
    energy: formatNumber(state.energy),
    zone: state.zone,
    starSystem: starSystem(state.zone),
    highestZone: state.highestZone,
    killsInZone: state.killsInZone,
    enemiesPerZone: BALANCING.world.enemiesPerZone,
    enemyKind: kind,
    enemySpecies: enemy.speciesId,
    // Wilde Gegner erscheinen immer in der Grundform
    enemyName: speciesName(enemy.speciesId),
    enemyShiny: enemy.shiny,
    enemyRarity: t(`rarity.${enemySpecies?.rarity ?? 'common'}`),
    enemyRarityColor: RARITY_COLORS[enemySpecies?.rarity ?? 'common'],
    planetName: t(`planet.name.${planet.boosted}`),
    planetEffect: t('planet.effect', {
      boosted: t(`types.${planet.boosted}.name`),
      weakened: t(`types.${planet.weakened}.name`),
    }),
    planetRecommended: t('planet.recommended', { type: t(`types.${planet.boosted}.name`) }),
    planetColor: TYPE_COLORS[planet.boosted],
    enemyHp: formatNumber(enemy.hp),
    enemyMaxHp: formatNumber(enemy.maxHp),
    enemyHpFraction: clamp01(fraction),
    bossTime: kind === 'normal' ? '' : formatSeconds(state.bossTimeLeft),
    bossTimeFraction: kind === 'normal' ? 0 : clamp01(state.bossTimeLeft / limit),
    bossTimeLimit: limit,
    farming: state.farming,
    canZoneDown: state.zone > 1,
    canZoneUp: state.zone < state.highestZone,
    bossBlocked: state.farming && isBossZone(state.zone + 1) && state.zone + 1 === state.highestZone,
    enemiesDefeated: state.enemiesDefeated,
    offline: offline
      ? {
          duration: formatDuration(offline.seconds),
          energy: formatNumber(offline.energy),
          hasEnergy: offline.energy.gt(0),
        }
      : null,

    teamUnlocked: isUnlocked(state, 'team'),
    stationUnlocked: isUnlocked(state, 'station'),
    supernovaUnlocked: isUnlocked(state, 'supernova'),
    researchUnlocked: isUnlocked(state, 'research'),
    evolutionUnlocked: isUnlocked(state, 'evolution'),
    stardust: formatNumber(state.stardust),
    stardustBonus: formatNumber(stardustBonus(state)),
    showStardust: state.supernovas > 0 || state.stardust.gt(0),
    stardustGain: formatNumber(stardustGain(state)),
    canSupernova: canSupernova(state),
    supernovaZone: BALANCING.supernova.minZone,
    supernovas: state.supernovas,
    research: researchNodes(state),
    shopUnlocked: isUnlocked(state, 'shop'),
    production: formatNumber(totalProduction(state)),
    modules: stationModules(state, buyAmount),
    teamDps: formatNumber(dps),
    clickDamage: formatNumber(clickDamage(dps, clickBonus(state))),
    team: state.team
      .map((id) => teamMember(state, id, buyAmount))
      .filter((m): m is TeamMemberView => m !== null),
    teamSlots: teamSlots(state),
    teamFull: state.team.length >= teamSlots(state),
    collection: SPECIES.map((s) => {
      const entry = state.collection[s.id];
      return {
        id: s.id,
        stage: entry?.evolution ?? 0,
        stars: entry ? starsFor(entry.caught - 1) : 0,
        maxStars: BALANCING.stars.maxStars,
        shiny: entry?.shiny ?? false,
        rarityColor: RARITY_COLORS[s.rarity],
        starProgress: entry ? progressText(entry.caught - 1) : '',
        big: s.rarity === 'legendary',
        number: s.number,
        caught: !!entry,
        name: speciesName(s.id, entry?.evolution ?? 0),
        typeName: t(`types.${s.type}.name`),
        rarityName: t(`rarity.${s.rarity}`),
        caughtCount: entry?.caught ?? 0,
        inTeam: state.team.includes(s.id),
      };
    }),
    collectionCount: Object.keys(state.collection).length,
    shinyCount: Object.values(state.collection).filter((e) => e?.shiny).length,
    spheres: SPHERE_TYPES.map((type) => {
      const cost = currentSphereCost(state, type);
      return {
        type,
        name: t(`shop.sphere.${type}`),
        owned: state.spheres[type],
        catchMult: formatNumber(BALANCING.spheres[type].catchMult),
        cost1: formatNumber(cost),
        cost10: formatNumber(cost.mul(10)),
        canBuy1: state.energy.gte(cost),
        canBuy10: state.energy.gte(cost.mul(10)),
      };
    }),
    totalSpheres: totalSpheres(state),
    catchOnlyNew: state.settings.catchOnlyNew,
    catchChanceCommon: formatPercent(
      catchChance(BALANCING.rarity.common.catchChance, BALANCING.catching.standardSphereMult, catchResearchBonus(state)),
    ),
    catchChanceUncommon: formatPercent(
      catchChance(BALANCING.rarity.uncommon.catchChance, BALANCING.catching.standardSphereMult, catchResearchBonus(state)),
    ),
    catchNotice: showCatch
      ? t(lastCatch.shiny ? 'catching.caughtShiny' : 'catching.caught', {
          name: speciesName(lastCatch.speciesId, stageOf(state, lastCatch.speciesId)),
        })
      : '',
    hint: activeHint(state),
  };
}
