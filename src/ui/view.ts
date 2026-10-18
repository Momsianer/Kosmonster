import type { OfflineReport } from '../core/game';
import { enemyKind, isBossZone, starSystem, type EnemyKind } from '../core/formulas';
import { rareChanceInZone, type GameState } from '../core/state';
import { BALANCING } from '../data/balancing';
import {
  getSpecies,
  areaPool,
  normalsInZone,
  BOSS_SPECIES,
  bossForZone,
  DARK_TYPES,
  MAIN_SPECIES,
  MONSTER_TYPES,
  MYTHIC_IDS,
  RARITY_COLORS,
  SPECIES,
  TYPE_COLORS,
  type MonsterType,
  type SpeciesData,
  type SpeciesId,
} from '../data/monsters';
import { planetForZone } from '../data/planets';
import { SPHERE_TYPES, type SphereType } from '../data/spheres';
import { starProgress, starsFor } from '../core/formulas';
import { t, type TranslationKey } from '../i18n';
import { RESEARCH_BRANCHES, RESEARCH_TREE, researchPrerequisite, type ResearchBranch, type ResearchId } from '../data/research';
import { catchBonus, currentSphereCost, isSphereUnlocked, sphereBuyCost, totalSpheres } from '../systems/catching';
import { AUTOMATION_ORDER, DM_UPGRADE_IDS, dmPrerequisite, type AutomationId, type DmUpgradeId } from '../data/darkmatter';
import { canBlackHole, darkMatterGain } from '../systems/blackhole';
import { CHALLENGE_IDS, type ChallengeId } from '../data/challenges';
import { CONSTELLATIONS, type ConstellationId } from '../data/constellations';
import { CONSTELLATION_TREE, UNIVERSE_RULES, type OriginId } from '../data/origin';
import { canBigBang, originGain } from '../systems/bigbang';
import { activeConstellations, constellationBonus } from '../systems/constellations';
import { canBuyOrigin, isOriginMaxed, originCost } from '../systems/origin';
import { originLevel, ruleActive } from '../systems/rules';
import { theoremAvailable } from '../systems/theorem';
import { ENDGAME_MODES, isZeroStage, riemannZero, zerosUpTo, type EndgameMode } from '../data/endgame';
import {
  canStartEndgame,
  completeShinySets,
  endgameReward,
  endgameUnlocked,
  goldbachDps,
  isMythicId,
  mythicProgress,
  shinyProgress,
  zerosFound,
} from '../systems/endgame';
import { activeChallengeGoal, nextChallengeTier } from '../systems/challenges';
import { challengeGoal } from '../systems/endgame';
import { breedingSeconds, breedingSlots, canBreed, isBreeding, potentialMult } from '../systems/breeding';
import {
  autoclickRate,
  canBuyDm,
  dmCost,
  dmLevel,
  gravitationMult,
  isDmAvailable,
  isDmMaxed,
  ownsAutomation,
} from '../systems/darkmatter';
import { canEvolve, evolutionCost, evolutionLevel, hasNextEvolution } from '../systems/evolution';
import { canSupernova, stardustBonus, stardustGain } from '../systems/prestige';
import {
  bossTimeLimit,
  canBuyResearch,
  clickBonus,
  isResearchAvailable,
  isResearchMaxed,
  researchCost,
  researchLevel,
  rareSpawnBoost,
} from '../systems/research';
import { catchChance, clickDamage } from '../core/formulas';
import { levelUpCost, monsterDps, speciesStars, starsUnlimited, teamDps, teamSlots } from '../systems/monsters';
import { activeHint, isUnlocked, type UnlockId } from '../systems/unlocks';
import { MODULES, type ModuleId } from '../data/modules';
import { moduleMult, nextModuleUpgrade } from '../core/formulas';
import { moduleBuyCost, moduleCount, productionOf, totalProduction } from '../systems/station';
import { formatDuration, formatNumber, formatPercent, formatSeconds } from '../util/format';

/** Wie lange die Fangmeldung sichtbar bleibt (Spielzeit in Sekunden) */
const CATCH_NOTICE_SECONDS = 3;


/** Seltenheiten mit normaler Fangchance (Mythische haben Sonderbedingungen) */
/** Textfarbe für Typen, deren Farbe auf dem dunklen Hintergrund nicht lesbar ist */
const DARK_TYPE_TEXT = '#9a9ab4';

const CATCH_TABLE_RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'boss'] as const;
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

function progressText(copies: number, unlimited = false): string {
  const progress = starProgress(copies, unlimited);
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

export interface DmUpgradeView {
  id: DmUpgradeId;
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

export interface AutomationView {
  id: AutomationId | 'autoschwarzloch';
  name: string;
  enabled: boolean;
}

export interface BreedingSlotView {
  index: number;
  speciesId: SpeciesId | null;
  name: string;
  remaining: string;
  progress: number;
}

export interface BreedingCandidateView {
  id: SpeciesId;
  stage: number;
  name: string;
  potential: string;
  bred: number;
  canBreed: boolean;
  busy: boolean;
  enoughCaught: boolean;
  time: string;
}

function dmPer(id: DmUpgradeId): string {
  const per = BALANCING.darkMatter.upgrades[id].perLevel;
  return id === 'erinnerung' ? formatPercent(per) : formatNumber(per);
}

function dmUpgradeViews(state: GameState): DmUpgradeView[] {
  return DM_UPGRADE_IDS.map((id) => {
    const level = dmLevel(state.dmUpgrades, id);
    const prerequisite = dmPrerequisite(id);
    return {
      id,
      name: t(`darkMatter.${id}.name`),
      description: t(`darkMatter.${id}.description`, { per: dmPer(id) }),
      level,
      maxLevel: BALANCING.darkMatter.upgrades[id].maxLevel,
      maxed: isDmMaxed(state, id),
      available: isDmAvailable(state, id),
      requires: prerequisite ? t('darkMatter.requires', { name: t(`darkMatter.${prerequisite}.name`) }) : '',
      cost: formatNumber(dmCost(id, level)),
      affordable: canBuyDm(state, id),
    };
  });
}

function breedingViews(state: GameState): { slots: BreedingSlotView[]; candidates: BreedingCandidateView[] } {
  const slots = breedingSlots(state).map((slot, index) => ({
    index,
    speciesId: slot?.speciesId ?? null,
    name: slot ? speciesName(slot.speciesId, stageOf(state, slot.speciesId)) : '',
    remaining: slot ? formatDuration(Math.max(0, slot.remaining)) : '',
    progress: slot ? clamp01(1 - slot.remaining / slot.total) : 0,
  }));
  const candidates = (Object.entries(state.collection) as [SpeciesId, NonNullable<GameState['collection'][SpeciesId]>][])
    .sort((a, b) => b[1].caught - a[1].caught)
    .map(([id, entry]) => ({
      id,
      stage: entry.evolution,
      name: speciesName(id, entry.evolution),
      potential: formatNumber(potentialMult(entry.bred)),
      bred: entry.bred,
      canBreed: canBreed(state, id),
      busy: isBreeding(state, id),
      enoughCaught: entry.caught >= BALANCING.breeding.requiredCaught,
      time: formatDuration(breedingSeconds(entry.bred)),
    }));
  return { slots, candidates };
}

export interface OriginUpgradeView {
  id: OriginId;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  maxed: boolean;
  cost: string;
  affordable: boolean;
}

export interface ChallengeView {
  id: ChallengeId;
  name: string;
  description: string;
  goal: number;
  reward: number;
  bonus: string;
  completed: boolean;
  active: boolean;
  /** Höchste geschaffte Stufe, 0 = noch nie */
  tier: number;
  /** Stufe, die beim nächsten Start läuft */
  nextTier: number;
}

export interface EndgameModeView {
  mode: EndgameMode;
  name: string;
  description: string;
  record: string;
  reward: string;
}

export interface EndgameRunView {
  mode: EndgameMode;
  title: string;
  info: string;
  zero: boolean;
  hp: string;
  maxHp: string;
  fraction: number;
  time: string;
  timeFraction: number;
}

export interface MythicView {
  id: SpeciesId;
  number: number;
  caught: boolean;
  name: string;
  typeName: string;
  condition: string;
  progress: string;
}

export interface ShinySetView {
  type: MonsterType;
  name: string;
  color: string;
  have: number;
  total: number;
  complete: boolean;
}

export interface ConstellationView {
  id: ConstellationId;
  found: boolean;
  active: boolean;
  name: string;
  hint: string;
  bonus: string;
}

export interface StoryView {
  system: number;
  text: string;
}

function originViews(state: GameState, ids: readonly OriginId[]): OriginUpgradeView[] {
  return ids.map((id) => {
    const level = originLevel(state, id);
    const per = BALANCING.origin.upgrades[id].perLevel;
    const percent = id === 'sternenquelle' || id === 'urkraft' || id === 'urproduktion' || id === 'sternbilder';
    return {
      id,
      name: t(`origin.${id}.name`),
      description: t(`origin.${id}.description`, { per: percent ? formatPercent(per) : formatNumber(per) }),
      level,
      maxLevel: BALANCING.origin.upgrades[id].maxLevel,
      maxed: isOriginMaxed(state, id),
      cost: formatNumber(originCost(id, level)),
      affordable: canBuyOrigin(state, id),
    };
  });
}

function challengeBonusText(id: ChallengeId): string {
  const { kind, value } = BALANCING.challenges[id].bonus;
  const shown = kind === 'offlineLimit' ? formatDuration(value) : formatNumber(value);
  return t(`challenge.bonus.${kind}`, { value: shown });
}

/** Zahlen aus dem Balancing für die Challengetexte */
function challengeParams(id: ChallengeId): Record<string, string> {
  const r = BALANCING.challengeRules;
  switch (id) {
    case 'primzahlwelt':
      return { factor: formatPercent(r.nonPrimeDamage) };
    case 'gezeitensperre':
      return { seconds: formatNumber(r.tideSeconds) };
    case 'teilbarkeit':
      return { hpMult: formatNumber(r.divisibilityHpMult), divisor: formatNumber(r.divisor) };
    case 'entropie':
      return { seconds: formatNumber(r.entropySeconds) };
    case 'lichtgeschwindigkeit':
      return { time: formatDuration(r.lightSpeedSeconds) };
    default:
      return {};
  }
}

function challengeViews(state: GameState): ChallengeView[] {
  return CHALLENGE_IDS.map((id) => ({
    id,
    name: t(`challenge.${id}.name`),
    description: t(`challenge.${id}.description`, challengeParams(id)),
    goal: BALANCING.challenges[id].goalZone,
    reward: BALANCING.challenges[id].reward,
    bonus: challengeBonusText(id),
    completed: state.challenge.completed.includes(id),
    active: state.challenge.active === id,
    tier: state.challenge.tiers[id] ?? 0,
    nextTier: nextChallengeTier(state, id),
  })).map((c) => ({ ...c, goal: challengeGoal(c.id, c.nextTier) }));
}

/** Text der Belohnung eines Endgamemodus */
function endgameRewardText(state: GameState, mode: EndgameMode): string {
  const value = endgameReward(state, mode);
  if (mode === 'goldbach') return t('endgame.reward.goldbach', { value: formatPercent(value) });
  if (mode === 'riemann') return t('endgame.reward.riemann', { value: formatNumber(value), zeros: zerosFound(state) });
  return t(`endgame.reward.${mode}`, { value: formatNumber(value) });
}

function endgameModeViews(state: GameState): EndgameModeView[] {
  const modes = BALANCING.endgame.modes;
  return ENDGAME_MODES.map((mode) => ({
    mode,
    name: t(`endgame.${mode}.name`),
    description: t(`endgame.${mode}.description`, {
      time: formatNumber(modes[mode].timeLimitSeconds),
      pair: formatNumber(BALANCING.endgame.goldbachPair),
      mult: formatNumber(BALANCING.endgame.zeroDamageMult),
    }),
    record: t(`endgame.${mode}.record`, { value: state.endgame.records[mode] }),
    reward: endgameRewardText(state, mode),
  }));
}

/** Nächste Windung der Spirale mit Nullstelle ab stage */
function nextZeroStage(stage: number): number {
  return Math.floor(riemannZero(zerosUpTo(stage - 1) + 1));
}

function endgameRunView(state: GameState): EndgameRunView | null {
  const run = state.endgame.run;
  if (!run) return null;
  const zero = run.mode === 'riemann' && isZeroStage(run.level);
  let info = '';
  if (run.mode === 'collatz') info = t('endgame.collatz.info', { value: formatNumber(run.value), step: run.step + 1 });
  else if (run.mode === 'goldbach') info = t('endgame.goldbach.info', { dps: formatNumber(goldbachDps(state)) });
  else if (run.mode === 'riemann')
    info = zero
      ? t('endgame.riemann.zero', { mult: formatNumber(BALANCING.endgame.zeroDamageMult) })
      : t('endgame.riemann.next', { level: nextZeroStage(run.level) });
  else info = t('endgame.multiversum.info', { value: state.endgame.records.multiversum });
  const limit = BALANCING.endgame.modes[run.mode].timeLimitSeconds;
  return {
    mode: run.mode,
    title: t(`endgame.${run.mode}.stage`, { level: run.level }),
    info,
    zero,
    hp: formatNumber(run.hp),
    maxHp: formatNumber(run.maxHp),
    fraction: clamp01(run.hp.div(run.maxHp).toNumber()),
    time: formatSeconds(run.timeLeft),
    timeFraction: clamp01(run.timeLeft / limit),
  };
}

function mythicViews(state: GameState): MythicView[] {
  return MYTHIC_IDS.filter(isMythicId).map((id) => {
    const species = getSpecies(id);
    const condition = BALANCING.mythic[id];
    const { have, need } = mythicProgress(state, id);
    const caught = !!state.collection[id];
    const key = condition.kind === 'record' ? `mythic.record.${condition.mode}` : `mythic.${condition.kind}`;
    return {
      id,
      number: species?.number ?? 0,
      caught,
      name: caught ? speciesName(id) : t('collection.unknown'),
      typeName: species ? t(`types.${species.type}.name`) : '',
      condition: t(key as TranslationKey, { value: need }),
      progress: t('mythic.progress', { have: Math.min(have, need), need }),
    };
  });
}

function shinySetViews(state: GameState): ShinySetView[] {
  const complete = new Set(completeShinySets(state));
  return MONSTER_TYPES.map((type) => ({
    type,
    name: t(`types.${type}.name`),
    color: TYPE_COLORS[type],
    ...shinyProgress(state, type),
    complete: complete.has(type),
  }));
}

function constellationViews(state: GameState): ConstellationView[] {
  const active = new Set(activeConstellations(state));
  const mapRevealed = originLevel(state, 'sternkarte') > 0;
  return CONSTELLATIONS.map((c) => {
    const found = state.constellationsFound.includes(c.id);
    return {
      id: c.id,
      found,
      active: active.has(c.id),
      name: found ? t(`constellation.${c.id}.name`) : t('constellation.unknown'),
      hint: found || !c.hidden || mapRevealed ? t(`constellation.${c.id}.hint`) : '???',
      bonus: formatNumber(constellationBonus(state, c.hidden)),
    };
  });
}

function storyViews(state: GameState): StoryView[] {
  return [...state.storySeen]
    .sort((a, b) => a - b)
    .map((system) => {
      const key = `story.s${system}` as TranslationKey;
      const text = t(key);
      return { system, text: text === key ? t('story.beyond') : text };
    });
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
  type: MonsterType;
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

/** Fangchance einer Seltenheit, je freigeschalteter Sphäre */
export interface CatchChanceRow {
  rarity: string;
  color: string;
  chances: string[];
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
  type: MonsterType;
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
  /** Bossmonster: wo es vorkommt, sonst leer */
  origin: string;
}

export interface AreaEntryView {
  id: SpeciesId;
  caught: boolean;
  shiny: boolean;
  big: boolean;
  name: string;
  rarityName: string;
  rarityColor: string;
  /** Erscheinungschance in der aktuellen Zone, leer in Bosszonen */
  chance: string;
  /** Bossmonster: in welcher Zone es kommt */
  zone: number | null;
  /** Normale Art, die erst ab einer späteren Zone des Gebiets erscheint */
  from: number | null;
  current: boolean;
}

export interface AreaView {
  system: number;
  fromZone: number;
  toZone: number;
  species: AreaEntryView[];
  bosses: AreaEntryView[];
}

/** Arten und Bossmonster des aktuellen Gebiets, nicht gefangene ohne Namen */
function areaView(state: GameState): AreaView {
  const zone = state.zone;
  const { zonesPerSystem } = BALANCING.world;
  const system = starSystem(zone);
  const fromZone = (system - 1) * zonesPerSystem + 1;
  const { normals, rare } = areaPool(zone);
  const bossZone = isBossZone(zone);
  const rareChance = rareChanceInZone(zone, rareSpawnBoost(state));
  const available = normalsInZone(zone);
  const total = available.reduce((sum, s) => sum + BALANCING.rarity[s.rarity].spawnWeight, 0);
  const normalChance = (s: SpeciesData): number | null =>
    bossZone || !available.includes(s) ? null : ((1 - rareChance) * BALANCING.rarity[s.rarity].spawnWeight) / total;
  const entry = (s: SpeciesData, chance: number | null, bossZoneOf: number | null): AreaEntryView => {
    const caught = !!state.collection[s.id];
    return {
      id: s.id,
      caught,
      shiny: state.collection[s.id]?.shiny ?? false,
      big: s.boss !== null || s.rarity === 'legendary',
      name: caught ? speciesName(s.id, state.collection[s.id]?.evolution ?? 0) : t('collection.unknown'),
      rarityName: t(`rarity.${s.rarity}`),
      rarityColor: RARITY_COLORS[s.rarity],
      chance: chance === null ? '' : formatPercent(chance, 2),
      zone: bossZoneOf,
      from: !bossZone && s.boss === null && s.minZone > zone ? s.minZone : null,
      current: bossZoneOf === zone,
    };
  };
  const species = normals.map((s) => entry(s, normalChance(s), null));
  if (rare) species.push(entry(rare, bossZone ? null : rareChance, null));
  const bosses = [fromZone + BALANCING.boss.bossEvery - 1, fromZone + zonesPerSystem - 1]
    .map((z) => ({ z, boss: bossForZone(z) }))
    .filter((b): b is { z: number; boss: SpeciesData } => b.boss !== null)
    .map(({ z, boss }) => entry(boss, null, z));
  return { system, fromZone, toZone: fromZone + zonesPerSystem - 1, species, bosses };
}

/** Eintrag der Sammlung für eine Art oder ein Bossmonster */
function collectionEntry(state: GameState, s: SpeciesData): CollectionEntryView {
  const entry = state.collection[s.id];
  return {
    id: s.id,
    stage: entry?.evolution ?? 0,
    stars: entry ? starsFor(entry.caught - 1, starsUnlimited(state)) : 0,
    maxStars: BALANCING.stars.maxStars,
    shiny: entry?.shiny ?? false,
    rarityColor: RARITY_COLORS[s.rarity],
    starProgress: entry ? progressText(entry.caught - 1, starsUnlimited(state)) : '',
    big: s.rarity === 'legendary' || s.rarity === 'mythic' || s.boss !== null,
    number: s.number,
    caught: !!entry,
    name: speciesName(s.id, entry?.evolution ?? 0),
    type: s.type,
    typeName: t(`types.${s.type}.name`),
    rarityName: t(`rarity.${s.rarity}`),
    caughtCount: entry?.caught ?? 0,
    inTeam: state.team.includes(s.id),
    origin: s.boss
      ? t(s.boss === 'mini' ? 'collection.originMini' : 'collection.originMain', {
          system: starSystem(s.minZone),
          zone: s.minZone,
        })
      : '',
  };
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
  /** Lesbare Textfarbe des Planeten (dunkle Typen werden aufgehellt) */
  planetTextColor: string;
  planetType: MonsterType;
  area: AreaView;
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
  blackHoleUnlocked: boolean;
  automationUnlocked: boolean;
  breedingUnlocked: boolean;
  darkMatter: string;
  showDarkMatter: boolean;
  gravity: string;
  darkMatterGain: string;
  canBlackHole: boolean;
  blackHoleMin: string;
  stardustCycle: string;
  blackHoles: number;
  dmUpgrades: DmUpgradeView[];
  automations: AutomationView[];
  autoclickRate: string;
  ownsAutospheres: boolean;
  ownsAutosupernova: boolean;
  sphereTarget: number;
  supernovaTarget: number;
  breedingSlots: BreedingSlotView[];
  breedingCandidates: BreedingCandidateView[];
  infinityCapped: boolean;
  bigBangUnlocked: boolean;
  challengesUnlocked: boolean;
  constellationsUnlocked: boolean;
  storyUnlocked: boolean;
  originPoints: string;
  showOrigin: boolean;
  originGain: string;
  canBigBang: boolean;
  infinityEnergy: string;
  bigBangs: number;
  universeRules: OriginUpgradeView[];
  constellationTree: OriginUpgradeView[];
  ownsAutoBlackHole: boolean;
  blackHoleTarget: number;
  challenges: ChallengeView[];
  activeChallenge: { name: string; goal: number; tier: number; timeLeft: string } | null;
  endgameUnlocked: boolean;
  challengeTierInfo: string;
  canStartEndgame: boolean;
  endgameModes: EndgameModeView[];
  endgameRun: EndgameRunView | null;
  mythics: MythicView[];
  shinySets: ShinySetView[];
  shinySetMult: string;
  extraStars: string;
  constellations: ConstellationView[];
  constellationsFound: number;
  story: StoryView[];
  theoremAvailable: boolean;
  theoremDefeated: boolean;
  theorem: { hp: string; maxHp: string; fraction: number; time: string; timeFraction: number } | null;
  showCredits: boolean;
  shopUnlocked: boolean;
  production: string;
  modules: ModuleView[];
  teamDps: string;
  clickDamage: string;
  /** Klicks machen gerade keinen Schaden (Stille Hände, Goldbach Arena) */
  clickBlocked: boolean;
  team: TeamMemberView[];
  teamSlots: number;
  teamFull: boolean;
  collection: CollectionEntryView[];
  bossCollection: CollectionEntryView[];
  bossCount: number;
  collectionCount: number;
  shinyCount: number;
  shinyTotal: number;
  spheres: SphereView[];
  totalSpheres: number;
  catchOnlyNew: boolean;
  catchTable: CatchChanceRow[];
  sphereLocked: boolean;
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
    type: species.type,
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
    planetTextColor: DARK_TYPES.includes(planet.boosted) ? DARK_TYPE_TEXT : TYPE_COLORS[planet.boosted],
    planetType: planet.boosted,
    area: areaView(state),
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
    blackHoleUnlocked: isUnlocked(state, 'blackHole'),
    automationUnlocked: isUnlocked(state, 'automation'),
    breedingUnlocked: isUnlocked(state, 'breeding'),
    darkMatter: formatNumber(state.darkMatter),
    showDarkMatter: state.darkMatterTotal.gt(0),
    gravity: formatNumber(gravitationMult(state)),
    darkMatterGain: formatNumber(darkMatterGain(state)),
    canBlackHole: canBlackHole(state),
    blackHoleMin: formatNumber(BALANCING.blackHole.minStardust),
    stardustCycle: formatNumber(state.stardustCycle),
    blackHoles: state.blackHoles,
    dmUpgrades: dmUpgradeViews(state),
    automations: [
      ...AUTOMATION_ORDER.filter((id) => ownsAutomation(state, id)).map((id) => ({
        id,
        name: t(`darkMatter.${id}.name`),
        enabled: state.automation.enabled[id] !== false,
      })),
      ...(originLevel(state, 'autoschwarzloch') > 0
        ? [
            {
              id: 'autoschwarzloch' as const,
              name: t('origin.autoschwarzloch.name'),
              enabled: state.automation.enabled.autoschwarzloch !== false,
            },
          ]
        : []),
    ],
    autoclickRate: formatNumber(autoclickRate(state)),
    ownsAutospheres: ownsAutomation(state, 'autosphaeren'),
    ownsAutosupernova: ownsAutomation(state, 'autosupernova'),
    sphereTarget: state.automation.sphereTarget,
    supernovaTarget: state.automation.supernovaTarget,
    ...(() => {
      const b = breedingViews(state);
      return { breedingSlots: b.slots, breedingCandidates: b.candidates };
    })(),
    infinityCapped: state.bigBangs === 0 && state.energy.gte(BALANCING.bigBang.infinityEnergy),
    bigBangUnlocked: isUnlocked(state, 'bigBang'),
    challengesUnlocked: isUnlocked(state, 'challenges'),
    constellationsUnlocked: isUnlocked(state, 'constellations'),
    storyUnlocked: isUnlocked(state, 'story'),
    originPoints: formatNumber(state.originPoints),
    showOrigin: state.originTotal.gt(0),
    originGain: formatNumber(originGain(state)),
    canBigBang: canBigBang(state),
    infinityEnergy: formatNumber(BALANCING.bigBang.infinityEnergy),
    bigBangs: state.bigBangs,
    universeRules: originViews(state, UNIVERSE_RULES),
    constellationTree: originViews(state, CONSTELLATION_TREE),
    ownsAutoBlackHole: originLevel(state, 'autoschwarzloch') > 0,
    blackHoleTarget: state.automation.blackHoleTarget,
    challenges: challengeViews(state),
    activeChallenge: state.challenge.active
      ? {
          name: t(`challenge.${state.challenge.active}.name`),
          goal: activeChallengeGoal(state) ?? 0,
          tier: state.challenge.tier,
          timeLeft:
            state.challenge.active === 'lichtgeschwindigkeit'
              ? formatDuration(
                  Math.max(0, BALANCING.challengeRules.lightSpeedSeconds - (state.playTime - state.challenge.startTime)),
                )
              : '',
        }
      : null,
    constellations: constellationViews(state),
    constellationsFound: state.constellationsFound.length,
    story: storyViews(state),
    theoremAvailable: theoremAvailable(state),
    theoremDefeated: state.theoremDefeated,
    endgameUnlocked: endgameUnlocked(state),
    challengeTierInfo: t('challenge.tierInfo', {
      zones: formatNumber(BALANCING.endgame.tierZoneStep),
      mult: formatNumber(BALANCING.endgame.tierDpsMult),
    }),
    canStartEndgame: canStartEndgame(state),
    endgameModes: endgameModeViews(state),
    endgameRun: endgameRunView(state),
    mythics: mythicViews(state),
    shinySets: shinySetViews(state),
    shinySetMult: formatNumber(BALANCING.endgame.polarsternSetMult),
    extraStars: t('endgame.stars', {
      copies: formatNumber(BALANCING.endgame.extraStarCopies),
      bonus: formatPercent(BALANCING.endgame.extraStarBonus),
    }),
    theorem: state.theorem
      ? {
          hp: formatNumber(state.theorem.hp),
          maxHp: formatNumber(state.theorem.maxHp),
          fraction: clamp01(state.theorem.hp.div(state.theorem.maxHp).toNumber()),
          time: formatSeconds(state.theorem.timeLeft),
          timeFraction: clamp01(state.theorem.timeLeft / BALANCING.theorem.timeLimitSeconds),
        }
      : null,
    showCredits: state.theoremDefeated && !state.hintsSeen.includes('credits'),
    shopUnlocked: isUnlocked(state, 'shop'),
    production: formatNumber(totalProduction(state)),
    modules: stationModules(state, buyAmount),
    teamDps: formatNumber(dps),
    clickDamage: formatNumber(clickDamage(dps, clickBonus(state))),
    clickBlocked: ruleActive(state, 'noClick') || state.endgame.run?.mode === 'goldbach',
    team: state.team
      .map((id) => teamMember(state, id, buyAmount))
      .filter((m): m is TeamMemberView => m !== null),
    teamSlots: teamSlots(state),
    teamFull: state.team.length >= teamSlots(state),
    collection: SPECIES.filter((s) => !s.boss).map((s) => collectionEntry(state, s)),
    bossCollection: BOSS_SPECIES.map((s) => collectionEntry(state, s)),
    bossCount: BOSS_SPECIES.filter((s) => state.collection[s.id]).length,
    collectionCount: SPECIES.filter((s) => !s.boss && state.collection[s.id]).length,
    shinyCount: Object.values(state.collection).filter((e) => e?.shiny).length,
    shinyTotal: MAIN_SPECIES.length,
    spheres: SPHERE_TYPES.filter((type) => isSphereUnlocked(state, type)).map((type) => {
      const cost1 = currentSphereCost(state, type);
      const cost10 = sphereBuyCost(state, 10, type);
      return {
        type,
        name: t(`shop.sphere.${type}`),
        owned: state.spheres[type],
        catchMult: formatNumber(BALANCING.spheres[type].catchMult),
        cost1: formatNumber(cost1),
        cost10: formatNumber(cost10),
        canBuy1: state.energy.gte(cost1),
        canBuy10: state.energy.gte(cost10),
      };
    }),
    totalSpheres: totalSpheres(state),
    catchOnlyNew: state.settings.catchOnlyNew,
    catchTable: CATCH_TABLE_RARITIES.map((rarity) => ({
      rarity: t(`rarity.${rarity}`),
      color: RARITY_COLORS[rarity],
      chances: SPHERE_TYPES.filter((type) => isSphereUnlocked(state, type)).map((type) =>
        formatPercent(
          catchChance(BALANCING.rarity[rarity].catchChance, BALANCING.spheres[type].catchMult, catchBonus(state)),
        ),
      ),
    })),
    sphereLocked: SPHERE_TYPES.some((type) => !isSphereUnlocked(state, type)),
    catchNotice: showCatch
      ? t(lastCatch.shiny ? 'catching.caughtShiny' : 'catching.caught', {
          name: speciesName(lastCatch.speciesId, stageOf(state, lastCatch.speciesId)),
        })
      : '',
    hint: activeHint(state),
  };
}
