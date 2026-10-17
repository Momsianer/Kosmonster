import type { OfflineReport } from '../core/game';
import { enemyKind, isBossZone, sphereCost, starSystem, type EnemyKind } from '../core/formulas';
import type { GameState } from '../core/state';
import { BALANCING } from '../data/balancing';
import { getSpecies, SPECIES, TYPE_COLORS, type SpeciesId } from '../data/monsters';
import { t } from '../i18n';
import { catchChance, clickDamage } from '../core/formulas';
import { levelUpCost, monsterDps, teamDps, teamSlots } from '../systems/monsters';
import { activeHint, isUnlocked, type UnlockId } from '../systems/unlocks';
import { MODULES, type ModuleId } from '../data/modules';
import { moduleMult, nextModuleUpgrade } from '../core/formulas';
import { moduleBuyCost, moduleCount, productionOf, totalProduction } from '../systems/station';
import { formatDuration, formatNumber, formatPercent, formatSeconds } from '../util/format';

/** Wie lange die Fangmeldung sichtbar bleibt (Spielzeit in Sekunden) */
const CATCH_NOTICE_SECONDS = 3;

export type BuyAmount = 1 | 10 | 100 | 'max';
export const BUY_AMOUNTS: readonly BuyAmount[] = [1, 10, 100, 'max'];

export function speciesName(id: SpeciesId): string {
  return t(`species.${id}`);
}

export interface TeamMemberView {
  id: SpeciesId;
  name: string;
  typeName: string;
  typeColor: string;
  level: number;
  dps: string;
  levels: number;
  cost: string;
  affordable: boolean;
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
  spheres: number;
  sphereCost1: string;
  sphereCost10: string;
  canBuy1: boolean;
  canBuy10: boolean;
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
    name: speciesName(id),
    typeName: t(`types.${species.type}.name`),
    typeColor: TYPE_COLORS[species.type],
    level: entry.level,
    dps: formatNumber(monsterDps(state, id)),
    levels,
    cost: formatNumber(cost),
    affordable: state.energy.gte(cost),
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
  const limit = BALANCING.boss.timeLimitSeconds;
  const fraction = enemy.maxHp.gt(0) ? enemy.hp.div(enemy.maxHp).toNumber() : 0;
  const dps = teamDps(state);
  const cost1 = sphereCost(state.zone);
  const cost10 = cost1.mul(10);
  const lastCatch = state.lastCatch;
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
    enemyName: speciesName(enemy.speciesId),
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
    shopUnlocked: isUnlocked(state, 'shop'),
    production: formatNumber(totalProduction(state)),
    modules: stationModules(state, buyAmount),
    teamDps: formatNumber(dps),
    clickDamage: formatNumber(clickDamage(dps)),
    team: state.team
      .map((id) => teamMember(state, id, buyAmount))
      .filter((m): m is TeamMemberView => m !== null),
    teamSlots: teamSlots(),
    teamFull: state.team.length >= teamSlots(),
    collection: SPECIES.map((s) => {
      const entry = state.collection[s.id];
      return {
        id: s.id,
        number: s.number,
        caught: !!entry,
        name: speciesName(s.id),
        typeName: t(`types.${s.type}.name`),
        rarityName: t(`rarity.${s.rarity}`),
        caughtCount: entry?.caught ?? 0,
        inTeam: state.team.includes(s.id),
      };
    }),
    collectionCount: Object.keys(state.collection).length,
    spheres: state.spheres,
    sphereCost1: formatNumber(cost1),
    sphereCost10: formatNumber(cost10),
    canBuy1: state.energy.gte(cost1),
    canBuy10: state.energy.gte(cost10),
    catchOnlyNew: state.settings.catchOnlyNew,
    catchChanceCommon: formatPercent(catchChance(BALANCING.rarity.common.catchChance)),
    catchChanceUncommon: formatPercent(catchChance(BALANCING.rarity.uncommon.catchChance)),
    catchNotice: showCatch ? t('catching.caught', { name: speciesName(lastCatch.speciesId) }) : '',
    hint: activeHint(state),
  };
}
