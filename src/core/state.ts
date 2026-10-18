import { BALANCING } from '../data/balancing';
import type { ModuleId } from '../data/modules';
import type { ResearchId } from '../data/research';
import type { AutomationId, DmUpgradeId } from '../data/darkmatter';
import type { ChallengeId } from '../data/challenges';
import type { ConstellationId } from '../data/constellations';
import type { OriginId } from '../data/origin';
import { ENDGAME_MODES, type EndgameMode } from '../data/endgame';
import { areaPool, bossForZone, rareSpawnChance, type SpeciesId } from '../data/monsters';
import { SPHERE_TYPES, type SphereType } from '../data/spheres';
import { D, type Decimal } from '../util/decimal';
import type { NumberFormat } from '../util/format';
import { nextRandom, weightedPick } from '../util/random';
import { enemyMaxHp } from './formulas';

/** Version des Speicherstands, wird bei jeder Strukturänderung erhöht */
export const STATE_VERSION = 12;

/** Lautstärke der Soundeffekte zu Beginn (0 bis 1) */
export const DEFAULT_VOLUME = 0.5;

export interface EnemyState {
  zone: number;
  speciesId: SpeciesId;
  /** Polarstern Variante */
  shiny: boolean;
  hp: Decimal;
  maxHp: Decimal;
}

export interface CollectionEntry {
  /** Wie oft die Art gefangen wurde (Grundlage für Sterne in M8) */
  caught: number;
  level: number;
  /** Erreichte Evolutionsstufe (0 = keine), bleibt über Resets erhalten */
  evolution: number;
  /** Polarstern Variante gefangen */
  shiny: boolean;
  /** Abgeschlossene Zuchten (Potenzial), bleibt über alle Resets erhalten */
  bred: number;
}

export interface AutomationState {
  /** Ein und Aus je gekaufter Automatik (dazu Autoschwarzloch aus den Ursprungsupgrades) */
  enabled: Partial<Record<AutomationId | 'autoschwarzloch', boolean>>;
  /** Autosphären: Ziel für den Vorrat an Standardsphären */
  sphereTarget: number;
  /** Autosupernova: Sternenstaubgewinn, ab dem ausgelöst wird */
  supernovaTarget: number;
  /** Autoschwarzloch: Gewinn an Dunkler Materie, ab dem ausgelöst wird */
  blackHoleTarget: number;
  /** Angesammelte Bruchteile von Autoklicks */
  clickBudget: number;
  /** Zeit bis zur nächsten Runde der übrigen Automatiken */
  timer: number;
  /** Sekunden im Farmmodus vor einem Boss (für Autoboss) */
  bossWait: number;
}

export interface ChallengeState {
  /** Laufende Challenge oder null */
  active: ChallengeId | null;
  /** Abgeschlossene Challenges (dauerhaft) */
  completed: ChallengeId[];
  /** Höchste geschaffte Stufe je Challenge (Challengestufen im Endgame) */
  tiers: Partial<Record<ChallengeId, number>>;
  /** Stufe der laufenden Challenge */
  tier: number;
  /** playTime beim Start der laufenden Challenge */
  startTime: number;
  /** playTime beim letzten Bosssieg (Gezeitensperre) */
  tideStart: number;
  /** Sekunden bis zum nächsten Levelverlust (Entropie) */
  entropyTimer: number;
}

export interface TheoremFight {
  hp: Decimal;
  maxHp: Decimal;
  timeLeft: number;
}

/** Laufender Kampf im Multiversum oder gegen eine Vermutung */
export interface EndgameRun {
  mode: EndgameMode;
  /** Tiefe im Multiversum, Stufe von Labyrinth, Arena oder Spirale */
  level: number;
  /** Besiegte Gegner im Collatz Labyrinth in dieser Stufe */
  step: number;
  /** Aktuelle Zahl im Collatz Labyrinth, sonst 0 */
  value: number;
  hp: Decimal;
  maxHp: Decimal;
  timeLeft: number;
}

export interface EndgameState {
  /** Bestwerte je Modus: tiefste geschaffte Stufe */
  records: Record<EndgameMode, number>;
  run: EndgameRun | null;
}

export interface BreedingSlot {
  speciesId: SpeciesId;
  /** Verbleibende Brutzeit in Sekunden */
  remaining: number;
  total: number;
}

export interface Settings {
  numberFormat: NumberFormat;
  /** Fangsphären nur für Arten verwenden, die noch nicht in der Sammlung sind */
  catchOnlyNew: boolean;
  /** Soundeffekte an oder aus */
  sound: boolean;
  /** Lautstärke von 0 bis 1 */
  volume: number;
}

/** Zentraler Spielzustand, komplett serialisierbar */
export interface GameState {
  version: number;
  energy: Decimal;
  /** Gesamte jemals verdiente Energie */
  totalEnergy: Decimal;
  /** Verdiente Energie seit der letzten Supernova (Grundlage für Sternenstaub) */
  cycleEnergy: Decimal;
  /** Unausgegebener Sternenstaub */
  stardust: Decimal;
  /** Anzahl ausgelöster Supernovas */
  supernovas: number;
  /** Gekaufte Forschungsstufen */
  research: Partial<Record<ResearchId, number>>;
  /** Sternenstaub seit dem letzten Schwarzen Loch */
  stardustCycle: Decimal;
  /** Unausgegebene Dunkle Materie */
  darkMatter: Decimal;
  /** Insgesamt verdiente Dunkle Materie (Grundlage der Gravitation) */
  darkMatterTotal: Decimal;
  /** Anzahl Schwarzer Löcher */
  blackHoles: number;
  /** Gekaufte Upgrades für Dunkle Materie */
  dmUpgrades: Partial<Record<DmUpgradeId, number>>;
  automation: AutomationState;
  /** Brutplätze, null = frei */
  breeding: (BreedingSlot | null)[];
  /** Unausgegebene Ursprungspunkte */
  originPoints: Decimal;
  /** Insgesamt verdiente Ursprungspunkte */
  originTotal: Decimal;
  /** Anzahl Urknalle */
  bigBangs: number;
  /** Gekaufte Ursprungsupgrades */
  originUpgrades: Partial<Record<OriginId, number>>;
  challenge: ChallengeState;
  /** Entdeckte Konstellationen */
  constellationsFound: ConstellationId[];
  /** Sternsysteme, deren Systemboss schon besiegt wurde (Story) */
  storySeen: number[];
  /** Laufender Kampf gegen das Theorem */
  theorem: TheoremFight | null;
  theoremDefeated: boolean;
  /** Multiversum und Vermutungen nach dem Theorem */
  endgame: EndgameState;
  zone: number;
  /** Höchste bisher erreichte Zone */
  highestZone: number;
  /** Besiegte Gegner in der aktuellen Zone */
  killsInZone: number;
  /** Nach einem gescheiterten Boss: in der Zone davor bleiben */
  farming: boolean;
  /** Verbleibende Zeit gegen den aktuellen Boss in Sekunden, 0 außerhalb von Bosszonen */
  bossTimeLeft: number;
  enemy: EnemyState;
  enemiesDefeated: number;
  clicks: number;
  /** Fangsphären je Typ */
  spheres: Record<SphereType, number>;
  /** Preisaufschlag je Sphärentyp: steigt mit jedem Kauf, sinkt mit jedem besiegten Gegner */
  spherePressure: Record<SphereType, number>;
  /** Gefangene Arten, bleiben über alle Resets erhalten */
  collection: Partial<Record<SpeciesId, CollectionEntry>>;
  /** Arten im Team, Reihenfolge wie angezeigt */
  team: SpeciesId[];
  /** Zustand des Zufallsgenerators */
  rngState: number;
  /** Letzter erfolgreicher Fang, time = playTime beim Fang */
  lastCatch: { speciesId: SpeciesId; time: number; shiny: boolean } | null;
  /** playTime beim letzten Reset (Supernova), Grundlage für Euler */
  cycleStart: number;
  /** playTime des letzten Klicks, Grundlage für den Leerlaufbonus von Null */
  lastClick: number;
  /** Gebaute Module der Raumstation */
  modules: Partial<Record<ModuleId, number>>;
  /** Bereits bestätigte einmalige Hinweise */
  hintsSeen: string[];
  /** Gespielte Zeit in Sekunden */
  playTime: number;
  /** Zeitstempel des letzten Ticks in Millisekunden (Date.now()) */
  lastTick: number;
  settings: Settings;
}

/**
 * Schreibt verdiente Energie gut (Vorrat, Gesamtsumme und Zyklus).
 * Vor dem ersten Urknall sind Vorrat und Zyklus bei „Unendlichkeit“ gedeckelt.
 */
export function addEnergy(state: GameState, amount: Decimal): void {
  if (amount.lte(0)) return;
  state.energy = state.energy.add(amount);
  state.totalEnergy = state.totalEnergy.add(amount);
  state.cycleEnergy = state.cycleEnergy.add(amount);
  if (state.bigBangs === 0) {
    const cap = BALANCING.bigBang.infinityEnergy;
    state.energy = state.energy.min(cap);
    state.cycleEnergy = state.cycleEnergy.min(cap);
  }
}

export function createEnemy(zone: number, speciesId: SpeciesId, shiny = false, hpMult = 1): EnemyState {
  const maxHp = enemyMaxHp(zone).mul(hpMult);
  return { zone, speciesId, shiny, hp: maxHp, maxHp };
}

export function createAutomationState(): AutomationState {
  return {
    enabled: {},
    sphereTarget: BALANCING.automation.defaultSphereTarget,
    supernovaTarget: BALANCING.automation.defaultSupernovaTarget,
    blackHoleTarget: BALANCING.automation.defaultBlackHoleTarget,
    clickBudget: 0,
    timer: 0,
    bossWait: 0,
  };
}

export function createChallengeState(): ChallengeState {
  return { active: null, completed: [], tiers: {}, tier: 0, startTime: 0, tideStart: 0, entropyTimer: 0 };
}

export function createEndgameState(): EndgameState {
  return {
    records: Object.fromEntries(ENDGAME_MODES.map((m) => [m, 0])) as Record<EndgameMode, number>,
    run: null,
  };
}

export function emptySpheres(): Record<SphereType, number> {
  return Object.fromEntries(SPHERE_TYPES.map((t) => [t, 0])) as Record<SphereType, number>;
}

/** Chance auf die seltene Art des Gebiets in einer Zone, verstärkt durch die Forschung, höchstens 1 */
export function rareChanceInZone(zone: number, rareBoost = 1): number {
  return Math.min(1, rareSpawnChance(zone) * rareBoost);
}

/**
 * Wählt die Art eines Gegners: In Bosszonen immer das feste Bossmonster, sonst aus dem
 * Pool des Gebiets. Die seltene Art erscheint mit rareChanceInZone, sonst eine der normalen
 * Arten gewichtet nach Seltenheit. rareBoost kommt aus der Forschung „Seltenheit“.
 */
export function pickSpecies(holder: { rngState: number }, zone: number, rareBoost = 1): SpeciesId {
  const boss = bossForZone(zone);
  if (boss) return boss.id;
  const { normals, rare } = areaPool(zone);
  if (rare && nextRandom(holder) < rareChanceInZone(zone, rareBoost)) return rare.id;
  const picked = weightedPick(holder, normals, (s) => BALANCING.rarity[s.rarity].spawnWeight) ?? normals[0];
  if (!picked) throw new Error(`Keine Art für Zone ${zone}`);
  return picked.id;
}

export function createInitialState(now: number = Date.now(), seed: number = now): GameState {
  const zone = BALANCING.world.startZone;
  const rng = { rngState: seed | 0 };
  const enemy = createEnemy(zone, pickSpecies(rng, zone));
  return {
    version: STATE_VERSION,
    energy: D(0),
    totalEnergy: D(0),
    cycleEnergy: D(0),
    stardust: D(0),
    supernovas: 0,
    research: {},
    stardustCycle: D(0),
    darkMatter: D(0),
    darkMatterTotal: D(0),
    blackHoles: 0,
    dmUpgrades: {},
    automation: createAutomationState(),
    breeding: [],
    originPoints: D(0),
    originTotal: D(0),
    bigBangs: 0,
    originUpgrades: {},
    challenge: createChallengeState(),
    constellationsFound: [],
    storySeen: [],
    theorem: null,
    theoremDefeated: false,
    endgame: createEndgameState(),
    zone,
    highestZone: zone,
    killsInZone: 0,
    farming: false,
    bossTimeLeft: 0,
    enemy,
    enemiesDefeated: 0,
    clicks: 0,
    spheres: { ...emptySpheres(), standard: BALANCING.catching.startSpheres },
    spherePressure: emptySpheres(),
    collection: {},
    team: [],
    rngState: rng.rngState,
    lastCatch: null,
    cycleStart: 0,
    lastClick: 0,
    modules: {},
    hintsSeen: [],
    playTime: 0,
    lastTick: now,
    settings: { numberFormat: 'standard', catchOnlyNew: true, sound: true, volume: DEFAULT_VOLUME },
  };
}
