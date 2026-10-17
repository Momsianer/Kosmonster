import { BALANCING } from '../data/balancing';
import type { ModuleId } from '../data/modules';
import type { ResearchId } from '../data/research';
import { speciesInZone, type SpeciesId } from '../data/monsters';
import { D, type Decimal } from '../util/decimal';
import type { NumberFormat } from '../util/format';
import { weightedPick } from '../util/random';
import { enemyMaxHp } from './formulas';

/** Version des Speicherstands, wird bei jeder Strukturänderung erhöht */
export const STATE_VERSION = 6;

export interface EnemyState {
  zone: number;
  speciesId: SpeciesId;
  hp: Decimal;
  maxHp: Decimal;
}

export interface CollectionEntry {
  /** Wie oft die Art gefangen wurde (Grundlage für Sterne in M8) */
  caught: number;
  level: number;
  /** Erreichte Evolutionsstufe (0 = keine), bleibt über Resets erhalten */
  evolution: number;
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
  /** Fangsphären (Standard) */
  spheres: number;
  /** Gefangene Arten, bleiben über alle Resets erhalten */
  collection: Partial<Record<SpeciesId, CollectionEntry>>;
  /** Arten im Team, Reihenfolge wie angezeigt */
  team: SpeciesId[];
  /** Zustand des Zufallsgenerators */
  rngState: number;
  /** Letzter erfolgreicher Fang, time = playTime beim Fang */
  lastCatch: { speciesId: SpeciesId; time: number } | null;
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

export function createEnemy(zone: number, speciesId: SpeciesId): EnemyState {
  const maxHp = enemyMaxHp(zone);
  return { zone, speciesId, hp: maxHp, maxHp };
}

/** Wählt eine Art aus dem Pool der Zone, gewichtet nach Seltenheit */
export function pickSpecies(holder: { rngState: number }, zone: number): SpeciesId {
  const pool = speciesInZone(zone);
  const picked = weightedPick(holder, pool, (s) => BALANCING.rarity[s.rarity].spawnWeight);
  const fallback = pool[0] ?? speciesInZone(BALANCING.world.startZone)[0];
  const species = picked ?? fallback;
  if (!species) throw new Error(`Keine Art für Zone ${zone}`);
  return species.id;
}

/** Lässt in Zone z einen neuen Gegner mit zufälliger Art erscheinen */
export function spawnEnemy(state: { rngState: number }, zone: number): EnemyState {
  return createEnemy(zone, pickSpecies(state, zone));
}

export function createInitialState(now: number = Date.now(), seed: number = now): GameState {
  const zone = BALANCING.world.startZone;
  const rng = { rngState: seed | 0 };
  const enemy = spawnEnemy(rng, zone);
  return {
    version: STATE_VERSION,
    energy: D(0),
    totalEnergy: D(0),
    cycleEnergy: D(0),
    stardust: D(0),
    supernovas: 0,
    research: {},
    zone,
    highestZone: zone,
    killsInZone: 0,
    farming: false,
    bossTimeLeft: 0,
    enemy,
    enemiesDefeated: 0,
    clicks: 0,
    spheres: BALANCING.catching.startSpheres,
    collection: {},
    team: [],
    rngState: rng.rngState,
    lastCatch: null,
    modules: {},
    hintsSeen: [],
    playTime: 0,
    lastTick: now,
    settings: { numberFormat: 'standard', catchOnlyNew: true },
  };
}
