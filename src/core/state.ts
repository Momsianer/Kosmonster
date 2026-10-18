import { BALANCING } from '../data/balancing';
import type { ModuleId } from '../data/modules';
import type { ResearchId } from '../data/research';
import type { AutomationId, DmUpgradeId } from '../data/darkmatter';
import { legendariesInZone, speciesInZone, type SpeciesId } from '../data/monsters';
import { SPHERE_TYPES, type SphereType } from '../data/spheres';
import { D, type Decimal } from '../util/decimal';
import type { NumberFormat } from '../util/format';
import { weightedPick } from '../util/random';
import { enemyMaxHp } from './formulas';

/** Version des Speicherstands, wird bei jeder Strukturänderung erhöht */
export const STATE_VERSION = 8;

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
  /** Ein und Aus je gekaufter Automatik */
  enabled: Partial<Record<AutomationId, boolean>>;
  /** Autosphären: Ziel für den Vorrat an Standardsphären */
  sphereTarget: number;
  /** Autosupernova: Sternenstaubgewinn, ab dem ausgelöst wird */
  supernovaTarget: number;
  /** Angesammelte Bruchteile von Autoklicks */
  clickBudget: number;
  /** Zeit bis zur nächsten Runde der übrigen Automatiken */
  timer: number;
  /** Sekunden im Farmmodus vor einem Boss (für Autoboss) */
  bossWait: number;
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

/** Schreibt verdiente Energie gut (Vorrat, Gesamtsumme und Zyklus) */
export function addEnergy(state: GameState, amount: Decimal): void {
  if (amount.lte(0)) return;
  state.energy = state.energy.add(amount);
  state.totalEnergy = state.totalEnergy.add(amount);
  state.cycleEnergy = state.cycleEnergy.add(amount);
}

export function createEnemy(zone: number, speciesId: SpeciesId, shiny = false): EnemyState {
  const maxHp = enemyMaxHp(zone);
  return { zone, speciesId, shiny, hp: maxHp, maxHp };
}

export function createAutomationState(): AutomationState {
  return {
    enabled: {},
    sphereTarget: BALANCING.automation.defaultSphereTarget,
    supernovaTarget: BALANCING.automation.defaultSupernovaTarget,
    clickBudget: 0,
    timer: 0,
    bossWait: 0,
  };
}

export function emptySpheres(): Record<SphereType, number> {
  return Object.fromEntries(SPHERE_TYPES.map((t) => [t, 0])) as Record<SphereType, number>;
}

/**
 * Wählt eine Art aus dem Pool der Zone, gewichtet nach Seltenheit.
 * Systembosse sind legendär, wenn es in der Zone eine legendäre Art gibt.
 * rareBoost verstärkt das Gewicht seltener und epischer Arten.
 */
export function pickSpecies(
  holder: { rngState: number },
  zone: number,
  systemBoss = false,
  rareBoost = 1,
): SpeciesId {
  if (systemBoss) {
    const legendary = weightedPick(holder, legendariesInZone(zone), () => 1);
    if (legendary) return legendary.id;
  }
  const pool = speciesInZone(zone);
  const picked = weightedPick(holder, pool, (s) => {
    const weight = BALANCING.rarity[s.rarity].spawnWeight;
    return s.rarity === 'rare' || s.rarity === 'epic' ? weight * rareBoost : weight;
  });
  const fallback = pool[0] ?? speciesInZone(BALANCING.world.startZone)[0];
  const species = picked ?? fallback;
  if (!species) throw new Error(`Keine Art für Zone ${zone}`);
  return species.id;
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
    zone,
    highestZone: zone,
    killsInZone: 0,
    farming: false,
    bossTimeLeft: 0,
    enemy,
    enemiesDefeated: 0,
    clicks: 0,
    spheres: { ...emptySpheres(), standard: BALANCING.catching.startSpheres },
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
    settings: { numberFormat: 'standard', catchOnlyNew: true },
  };
}
