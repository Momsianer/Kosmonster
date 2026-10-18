import { compressToBase64, decompressFromBase64 } from 'lz-string';
import { isBossZone } from '../core/formulas';
import { BALANCING } from '../data/balancing';
import {
  createEnemy,
  createInitialState,
  createAutomationState,
  createChallengeState,
  createEndgameState,
  type ChallengeState,
  type EndgameState,
  type TheoremFight,
  emptySpheres,
  type AutomationState,
  type BreedingSlot,
  pickSpecies,
  STATE_VERSION,
  type CollectionEntry,
  type GameState,
} from '../core/state';
import { isModuleId, type ModuleId } from '../data/modules';
import { isResearchId, type ResearchId } from '../data/research';
import { isAutomationId, isDmUpgradeId, type DmUpgradeId } from '../data/darkmatter';
import { isChallengeId, type ChallengeId } from '../data/challenges';
import { ENDGAME_MODES, type EndgameMode } from '../data/endgame';
import { isConstellationId } from '../data/constellations';
import { isOriginId, type OriginId } from '../data/origin';
import { SPHERE_TYPES, type SphereType } from '../data/spheres';
import { bossTimeLimitFor, teamSlotsFor } from '../systems/research';
import { getSpecies, isSpeciesId, speciesInZone, type SpeciesId } from '../data/monsters';
import { D, type Decimal } from '../util/decimal';
import { isNumberFormat } from '../util/format';
import { migrate, type RawSave } from './migrations';

export const SAVE_KEY = 'kosmonster.save';

/** Die Teile von localStorage, die das Speichern braucht (in Tests ersetzbar) */
export type SaveStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** Speicherstand als Textcode: JSON → lz-string → Base64 */
export function encodeSave(state: GameState): string {
  return compressToBase64(JSON.stringify(state));
}

/**
 * Liest einen Textcode. Gibt null zurück, wenn der Code ungültig ist
 * oder von einer neueren Spielversion stammt.
 */
export function decodeSave(code: string): GameState | null {
  try {
    const json = decompressFromBase64(code.trim());
    if (!json) return null;
    const raw: unknown = JSON.parse(json);
    if (!isRecord(raw) || typeof raw.version !== 'number') return null;
    if (raw.version > STATE_VERSION || raw.version < 1) return null;
    return hydrate(migrate(raw as RawSave));
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toDecimal(value: unknown, fallback: Decimal): Decimal {
  if (typeof value !== 'string' && typeof value !== 'number') return fallback;
  const d = D(value);
  return d.isNan() || d.lt(0) ? fallback : d;
}

function toNumber(value: unknown, fallback: number, min = 0): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min ? value : fallback;
}

function toZone(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 ? value : fallback;
}

/**
 * Wandelt einen migrierten Rohstand in einen Spielzustand um.
 * Fehlende oder kaputte Felder fallen auf Startwerte zurück.
 */
export function hydrate(raw: RawSave): GameState {
  const lastTick = toNumber(raw.lastTick, Date.now());
  const rng = {
    rngState: typeof raw.rngState === 'number' && Number.isInteger(raw.rngState) ? raw.rngState : lastTick | 0,
  };
  const base = createInitialState(lastTick, rng.rngState);
  const zone = toZone(raw.zone, base.zone);

  // Gegner übernehmen, wenn die Zone passt. Fehlt die Art oder passt sie nicht
  // zur Zone (alte Stände), bekommt er eine neue Art und behält seine Leben.
  // Gewürfelt wird nur, wenn nötig, damit Neuladen den Zufall nicht verschiebt.
  const rawEnemy = isRecord(raw.enemy) && raw.enemy.zone === zone ? raw.enemy : null;
  const rawSpecies = rawEnemy?.speciesId;
  const speciesId =
    isSpeciesId(rawSpecies) && speciesInZone(zone).some((s) => s.id === rawSpecies)
      ? rawSpecies
      : pickSpecies(rng, zone);
  let enemy = createEnemy(zone, speciesId, rawEnemy?.shiny === true && rawEnemy.speciesId === speciesId);
  if (rawEnemy) {
    const hp = toDecimal(rawEnemy.hp, enemy.maxHp);
    if (hp.gt(0) && hp.lte(enemy.maxHp)) enemy = { ...enemy, hp };
  }

  const research = hydrateResearch(raw.research);
  const dmUpgrades = hydrateDmUpgrades(raw.dmUpgrades);
  const collection = hydrateCollection(raw.collection);
  const team = hydrateTeam(raw.team, collection, teamSlotsFor(research, dmUpgrades));

  const settings = isRecord(raw.settings) ? raw.settings : {};
  const timeLimitSeconds = bossTimeLimitFor(research);
  const bossTime = toNumber(raw.bossTimeLeft, 0);

  return {
    version: STATE_VERSION,
    energy: toDecimal(raw.energy, base.energy),
    totalEnergy: toDecimal(raw.totalEnergy, base.totalEnergy),
    cycleEnergy: toDecimal(raw.cycleEnergy, base.cycleEnergy),
    stardust: toDecimal(raw.stardust, base.stardust),
    supernovas: Math.floor(toNumber(raw.supernovas, 0)),
    research,
    stardustCycle: toDecimal(raw.stardustCycle, base.stardustCycle),
    darkMatter: toDecimal(raw.darkMatter, base.darkMatter),
    darkMatterTotal: toDecimal(raw.darkMatterTotal, base.darkMatterTotal),
    blackHoles: Math.floor(toNumber(raw.blackHoles, 0)),
    dmUpgrades,
    automation: hydrateAutomation(raw.automation),
    breeding: hydrateBreeding(raw.breeding, collection),
    originPoints: toDecimal(raw.originPoints, base.originPoints),
    originTotal: toDecimal(raw.originTotal, base.originTotal),
    bigBangs: Math.floor(toNumber(raw.bigBangs, 0)),
    originUpgrades: hydrateOrigin(raw.originUpgrades),
    challenge: hydrateChallenge(raw.challenge),
    constellationsFound: Array.isArray(raw.constellationsFound)
      ? [...new Set(raw.constellationsFound.filter(isConstellationId))]
      : [],
    storySeen: Array.isArray(raw.storySeen)
      ? [...new Set(raw.storySeen.filter((n): n is number => Number.isInteger(n) && n > 0))]
      : [],
    theorem: hydrateTheorem(raw.theorem),
    theoremDefeated: raw.theoremDefeated === true,
    endgame: hydrateEndgame(raw.endgame),
    zone,
    highestZone: Math.max(zone, toZone(raw.highestZone, zone)),
    killsInZone: Math.min(toNumber(raw.killsInZone, 0), BALANCING.world.enemiesPerZone),
    farming: raw.farming === true,
    // In Bosszonen muss ein Timer laufen, sonst bliebe der Boss ohne Zeitlimit
    bossTimeLeft: isBossZone(zone)
      ? bossTime > 0
        ? Math.min(bossTime, timeLimitSeconds)
        : timeLimitSeconds
      : 0,
    enemy,
    enemiesDefeated: toNumber(raw.enemiesDefeated, 0),
    clicks: toNumber(raw.clicks, 0),
    spheres: hydrateSpheres(raw.spheres),
    spherePressure: hydratePressure(raw.spherePressure),
    cycleStart: toNumber(raw.cycleStart, 0),
    lastClick: toNumber(raw.lastClick, 0),
    collection,
    team,
    rngState: rng.rngState,
    lastCatch: hydrateLastCatch(raw.lastCatch),
    modules: hydrateModules(raw.modules),
    hintsSeen: Array.isArray(raw.hintsSeen)
      ? raw.hintsSeen.filter((h): h is string => typeof h === 'string')
      : [],
    playTime: toNumber(raw.playTime, 0),
    lastTick: base.lastTick,
    settings: {
      numberFormat: isNumberFormat(settings.numberFormat)
        ? settings.numberFormat
        : base.settings.numberFormat,
      catchOnlyNew:
        typeof settings.catchOnlyNew === 'boolean' ? settings.catchOnlyNew : base.settings.catchOnlyNew,
      sound: typeof settings.sound === 'boolean' ? settings.sound : base.settings.sound,
      volume: Math.min(1, toNumber(settings.volume, base.settings.volume)),
    },
  };
}

function hydrateCollection(value: unknown): Partial<Record<SpeciesId, CollectionEntry>> {
  const collection: Partial<Record<SpeciesId, CollectionEntry>> = {};
  if (!isRecord(value)) return collection;
  for (const [id, entry] of Object.entries(value)) {
    if (!isSpeciesId(id) || !isRecord(entry)) continue;
    collection[id] = {
      caught: Math.max(1, Math.floor(toNumber(entry.caught, 1))),
      level: Math.floor(toNumber(entry.level, 1)),
      evolution: Math.min(getSpecies(id)?.evolutions ?? 0, Math.floor(toNumber(entry.evolution, 0))),
      shiny: entry.shiny === true,
      bred: Math.floor(toNumber(entry.bred, 0)),
    };
  }
  return collection;
}

function hydrateDmUpgrades(value: unknown): Partial<Record<DmUpgradeId, number>> {
  const upgrades: Partial<Record<DmUpgradeId, number>> = {};
  if (!isRecord(value)) return upgrades;
  for (const [id, level] of Object.entries(value)) {
    if (!isDmUpgradeId(id)) continue;
    const n = Math.min(Math.floor(toNumber(level, 0)), BALANCING.darkMatter.upgrades[id].maxLevel);
    if (n > 0) upgrades[id] = n;
  }
  return upgrades;
}

function hydrateAutomation(value: unknown): AutomationState {
  const auto = createAutomationState();
  if (!isRecord(value)) return auto;
  if (isRecord(value.enabled)) {
    for (const [id, on] of Object.entries(value.enabled)) {
      if ((isAutomationId(id) || id === 'autoschwarzloch') && typeof on === 'boolean') auto.enabled[id] = on;
    }
  }
  auto.sphereTarget = Math.floor(toNumber(value.sphereTarget, auto.sphereTarget));
  auto.supernovaTarget = toNumber(value.supernovaTarget, auto.supernovaTarget);
  auto.blackHoleTarget = toNumber(value.blackHoleTarget, auto.blackHoleTarget);
  auto.clickBudget = Math.min(1, toNumber(value.clickBudget, 0));
  auto.timer = toNumber(value.timer, 0);
  auto.bossWait = toNumber(value.bossWait, 0);
  return auto;
}

function hydrateOrigin(value: unknown): Partial<Record<OriginId, number>> {
  const upgrades: Partial<Record<OriginId, number>> = {};
  if (!isRecord(value)) return upgrades;
  for (const [id, level] of Object.entries(value)) {
    if (!isOriginId(id)) continue;
    const n = Math.min(Math.floor(toNumber(level, 0)), BALANCING.origin.upgrades[id].maxLevel);
    if (n > 0) upgrades[id] = n;
  }
  return upgrades;
}

function hydrateChallenge(value: unknown): ChallengeState {
  const challenge = createChallengeState();
  if (!isRecord(value)) return challenge;
  challenge.active = isChallengeId(value.active) ? value.active : null;
  challenge.completed = Array.isArray(value.completed) ? [...new Set(value.completed.filter(isChallengeId))] : [];
  const tiers: Partial<Record<ChallengeId, number>> = {};
  if (isRecord(value.tiers)) {
    for (const [id, tier] of Object.entries(value.tiers)) {
      if (isChallengeId(id) && typeof tier === 'number' && Number.isInteger(tier) && tier >= 1) tiers[id] = tier;
    }
  }
  // Jede abgeschlossene Challenge hat mindestens Stufe 1
  for (const id of challenge.completed) tiers[id] = Math.max(1, tiers[id] ?? 0);
  challenge.tiers = tiers;
  challenge.tier = challenge.active ? Math.max(1, Math.floor(toNumber(value.tier, 1))) : 0;
  challenge.startTime = toNumber(value.startTime, 0);
  challenge.tideStart = toNumber(value.tideStart, 0);
  challenge.entropyTimer = toNumber(value.entropyTimer, 0);
  return challenge;
}

function isEndgameMode(value: unknown): value is EndgameMode {
  return typeof value === 'string' && (ENDGAME_MODES as readonly string[]).includes(value);
}

function hydrateEndgame(value: unknown): EndgameState {
  const endgame = createEndgameState();
  if (!isRecord(value)) return endgame;
  if (isRecord(value.records)) {
    for (const mode of ENDGAME_MODES) endgame.records[mode] = Math.floor(toNumber(value.records[mode], 0));
  }
  const run = value.run;
  if (isRecord(run) && isEndgameMode(run.mode)) {
    const maxHp = toDecimal(run.maxHp, D(0));
    const hp = toDecimal(run.hp, maxHp);
    const level = Math.floor(toNumber(run.level, 0, 1));
    if (maxHp.gt(0) && hp.gt(0) && level >= 1) {
      endgame.run = {
        mode: run.mode,
        level,
        step: Math.floor(toNumber(run.step, 0)),
        value: Math.floor(toNumber(run.value, 0)),
        hp: hp.min(maxHp),
        maxHp,
        timeLeft: toNumber(run.timeLeft, 0),
      };
    }
  }
  return endgame;
}

function hydrateTheorem(value: unknown): TheoremFight | null {
  if (!isRecord(value)) return null;
  const maxHp = toDecimal(value.maxHp, D(0));
  const hp = toDecimal(value.hp, maxHp);
  if (maxHp.lte(0) || hp.lte(0)) return null;
  return { hp: hp.min(maxHp), maxHp, timeLeft: toNumber(value.timeLeft, 0) };
}

function hydrateBreeding(
  value: unknown,
  collection: Partial<Record<SpeciesId, CollectionEntry>>,
): (BreedingSlot | null)[] {
  if (!Array.isArray(value)) return [];
  return value.map((slot) => {
    if (!isRecord(slot) || !isSpeciesId(slot.speciesId) || !collection[slot.speciesId]) return null;
    const total = toNumber(slot.total, 1, 1);
    return { speciesId: slot.speciesId, total, remaining: Math.min(total, toNumber(slot.remaining, total)) };
  });
}

function hydratePressure(value: unknown): Record<SphereType, number> {
  const pressure = emptySpheres();
  if (!isRecord(value)) return pressure;
  for (const type of SPHERE_TYPES) pressure[type] = toNumber(value[type], 0);
  return pressure;
}

function hydrateSpheres(value: unknown): Record<SphereType, number> {
  const spheres = emptySpheres();
  if (!isRecord(value)) return spheres;
  for (const type of SPHERE_TYPES) spheres[type] = Math.floor(toNumber(value[type], 0));
  return spheres;
}

function hydrateResearch(value: unknown): Partial<Record<ResearchId, number>> {
  const research: Partial<Record<ResearchId, number>> = {};
  if (!isRecord(value)) return research;
  for (const [id, level] of Object.entries(value)) {
    if (!isResearchId(id)) continue;
    const n = Math.min(Math.floor(toNumber(level, 0)), BALANCING.research.nodes[id].maxLevel);
    if (n > 0) research[id] = n;
  }
  return research;
}

/** Nur gefangene Arten, keine doppelten, höchstens so viele wie Teamplätze */
function hydrateTeam(
  value: unknown,
  collection: Partial<Record<SpeciesId, CollectionEntry>>,
  slots: number,
): SpeciesId[] {
  if (!Array.isArray(value)) return [];
  const team: SpeciesId[] = [];
  for (const id of value) {
    if (isSpeciesId(id) && collection[id] && !team.includes(id)) team.push(id);
  }
  return team.slice(0, slots);
}

function hydrateModules(value: unknown): Partial<Record<ModuleId, number>> {
  const modules: Partial<Record<ModuleId, number>> = {};
  if (!isRecord(value)) return modules;
  for (const [id, count] of Object.entries(value)) {
    if (isModuleId(id)) {
      const n = Math.floor(toNumber(count, 0));
      if (n > 0) modules[id] = n;
    }
  }
  return modules;
}

function hydrateLastCatch(value: unknown): GameState['lastCatch'] {
  if (!isRecord(value) || !isSpeciesId(value.speciesId)) return null;
  return { speciesId: value.speciesId, time: toNumber(value.time, 0), shiny: value.shiny === true };
}

export function saveToStorage(storage: SaveStorage, state: GameState): boolean {
  try {
    storage.setItem(SAVE_KEY, encodeSave(state));
    return true;
  } catch {
    return false;
  }
}

export function loadFromStorage(storage: SaveStorage): GameState | null {
  try {
    const code = storage.getItem(SAVE_KEY);
    return code ? decodeSave(code) : null;
  } catch {
    return null;
  }
}

export function clearStorage(storage: SaveStorage): void {
  try {
    storage.removeItem(SAVE_KEY);
  } catch {
    // Speicher nicht verfügbar: nichts zu löschen
  }
}
