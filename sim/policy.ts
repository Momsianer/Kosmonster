/**
 * Entscheidungen des Simulationsbots. Nutzt nur Aktionen, die auch Spielende haben.
 */
import { clickDamage, enemyMaxHp, isBossZone, levelCost, moduleCost, moduleProduction } from '../src/core/formulas';
import type { GameState } from '../src/core/state';
import { BALANCING } from '../src/data/balancing';
import { MODULES, type ModuleId } from '../src/data/modules';
import { getSpecies, speciesInZone, type SpeciesId } from '../src/data/monsters';
import { buySpheres, currentSphereCost, totalSpheres } from '../src/systems/catching';
import { challengeBoss, setAutoProgress } from '../src/systems/combat';
import { addToTeam, levelUp, monsterDps, removeFromTeam, teamDps, teamSlots } from '../src/systems/monsters';
import { bossDamageMult, bossTimeLimit, clickBonus, moduleCostMult } from '../src/systems/research';
import { buyModule, moduleCount, productionMult } from '../src/systems/station';
import { isUnlocked } from '../src/systems/unlocks';
import type { ResearchId } from '../src/data/research';
import type { DmUpgradeId } from '../src/data/darkmatter';
import { blackHole, canBlackHole, darkMatterGain } from '../src/systems/blackhole';
import { canBreed, startBreeding } from '../src/systems/breeding';
import { buyDm, canBuyDm } from '../src/systems/darkmatter';
import { canEvolve, evolutionCost, evolve } from '../src/systems/evolution';
import { canSupernova, stardustGain, supernova } from '../src/systems/prestige';
import { buyResearch, isResearchAvailable, isResearchMaxed, researchCost, researchLevel } from '../src/systems/research';

export interface PolicyOptions {
  /** Klicks pro Sekunde, während die Person online ist */
  clicksPerSecond: number;
}

/** Gedächtnis des Bots zwischen zwei Entscheidungen */
export interface PolicyMemory {
  /** Höchste Zone bei der letzten Entscheidung */
  lastHighest: number;
  /** Zeitpunkt des letzten Zonenfortschritts in Sekunden */
  lastProgress: number;
  /** Insgesamt verdienter Sternenstaub */
  stardustEarned: number;
}

export function createMemory(): PolicyMemory {
  return { lastHighest: 0, lastProgress: 0, stardustEarned: 0 };
}

/** Reihenfolge, in der der Bot forscht (Voraussetzungen werden mitgenommen) */
const RESEARCH_PRIORITY: ResearchId[] = [
  'klickkraft',
  'teamstaerke',
  'produktion',
  'fangglueck',
  'modulrabatt',
  'offlinebonus',
  'sphaerenrabatt',
  'teamplatz',
  'kritchance',
  'umwandlung',
  'offlinelimit',
  'startzone',
  'kritschaden',
  'bosszeit',
  'startsphaeren',
  'bossschaden',
];

/** Anteil des Sternenstaubs, den ein einzelner Kauf höchstens kosten darf */
const STARDUST_SHARE = 0.25;
/** So lange ohne Zonenfortschritt ab Zone 60, dann Supernova */
const STALL_SECONDS = 15 * 60;
/** Supernova, sobald der Gewinn diesen Anteil des bisher verdienten Sternenstaubs erreicht */
const GAIN_SHARE = 0.5;

/** Forschung und Evolution, solange ein Kauf höchstens STARDUST_SHARE des Sternenstaubs kostet */
function spendStardust(state: GameState): void {
  for (let i = 0; i < 100; i++) {
    const limit = state.stardust.mul(STARDUST_SHARE);
    const node = RESEARCH_PRIORITY.find(
      (id) => isResearchAvailable(state, id) && !isResearchMaxed(state, id) && researchCost(id, researchLevel(state.research, id)).lte(limit),
    );
    if (node) {
      buyResearch(state, node);
      continue;
    }
    const evolvable = state.team.find((id) => {
      const species = getSpecies(id);
      const entry = state.collection[id];
      const cost = species && entry ? evolutionCost(species.number, entry.evolution) : null;
      return canEvolve(state, id) && cost !== null && cost.lte(limit);
    });
    if (!evolvable) return;
    evolve(state, evolvable);
  }
}

/**
 * Supernova beim ersten Erreichen von Zone 60, später wenn der Gewinn einen Anteil
 * des bisher verdienten Sternenstaubs erreicht oder länger kein Fortschritt kommt.
 */
function handleSupernova(state: GameState, memory: PolicyMemory, now: number): void {
  if (!canSupernova(state)) return;
  const gain = stardustGain(state);
  const stalled = now - memory.lastProgress >= STALL_SECONDS;
  if (state.supernovas === 0 || gain.gte(memory.stardustEarned * GAIN_SHARE) || stalled) {
    memory.stardustEarned += gain.toNumber();
    supernova(state);
    memory.lastHighest = state.highestZone;
    memory.lastProgress = now;
  }
}

type Purchase =
  | { kind: 'level'; id: SpeciesId; cost: number; value: number }
  | { kind: 'module'; id: ModuleId; cost: number; value: number };

/** Zusätzliche DPS durch ein Level, umgerechnet in Energie pro Sekunde */
function levelValue(state: GameState, id: SpeciesId): number {
  const entry = state.collection[id];
  if (!entry) return 0;
  const before = monsterDps(state, id);
  entry.level += 1;
  const after = monsterDps(state, id);
  entry.level -= 1;
  return after.sub(before).div(BALANCING.reward.energyDivisor).toNumber();
}

function purchases(state: GameState, bossBlocked: boolean): Purchase[] {
  const list: Purchase[] = [];
  for (const id of state.team) {
    const species = getSpecies(id);
    const entry = state.collection[id];
    if (!species || !entry) continue;
    // Vor einem Boss zählt Schaden mehr als Produktion
    const weight = bossBlocked ? 3 : 1;
    list.push({
      kind: 'level',
      id,
      cost: levelCost(species.baseCost, entry.level).toNumber(),
      value: levelValue(state, id) * weight,
    });
  }
  if (isUnlocked(state, 'station')) {
    for (const m of MODULES) {
      const owned = moduleCount(state, m.id);
      const gain = moduleProduction(m.production, owned + 1).sub(moduleProduction(m.production, owned));
      list.push({
        kind: 'module',
        id: m.id,
        cost: moduleCost(m.baseCost, owned).mul(moduleCostMult(state)).toNumber(),
        value: gain.mul(productionMult(state)).toNumber(),
      });
    }
  }
  return list;
}

/** Kauft das beste Verhältnis aus Gegenwert und Kosten, solange es bezahlbar ist */
function spend(state: GameState, bossBlocked: boolean): void {
  for (let i = 0; i < 500; i++) {
    const options = purchases(state, bossBlocked).filter((p) => p.value > 0 && Number.isFinite(p.cost));
    if (options.length === 0) return;
    options.sort((a, b) => b.value / b.cost - a.value / a.cost);
    const best = options[0]!;
    if (state.energy.lt(best.cost)) return;
    const bought = best.kind === 'level' ? levelUp(state, best.id, 1) : buyModule(state, best.id, 1);
    if (bought === 0) return;
  }
}

/**
 * Schaden einer Art, mindestens auf Level 1 gerechnet (Level 0 nach einer Supernova).
 * Arten auf Level 0 zählen nur, wenn das erste Level bezahlbar ist.
 */
function potentialDps(state: GameState, id: SpeciesId): number {
  const entry = state.collection[id];
  const species = getSpecies(id);
  if (!entry || !species) return 0;
  if (entry.level > 0) return monsterDps(state, id).toNumber();
  if (state.energy.lt(species.baseCost)) return 0;
  entry.level = 1;
  const dps = monsterDps(state, id).toNumber();
  entry.level = 0;
  return dps;
}

/** Stellt die stärksten gefangenen Arten ins Team */
function arrangeTeam(state: GameState): void {
  const ranked = (Object.keys(state.collection) as SpeciesId[])
    .map((id) => ({ id, dps: potentialDps(state, id) }))
    .sort((a, b) => b.dps - a.dps)
    .slice(0, teamSlots(state))
    .map((x) => x.id);
  for (const id of [...state.team]) if (!ranked.includes(id)) removeFromTeam(state, id);
  for (const id of ranked) addToTeam(state, id);
}

/** Kauft eine Sphäre, wenn in der Zone noch ungefangene Arten vorkommen */
function buySpheresIfUseful(state: GameState): void {
  if (!isUnlocked(state, 'shop') || totalSpheres(state) > 0) return;
  const missing = speciesInZone(state.zone).some((s) => !state.collection[s.id]);
  if (missing && state.energy.gte(currentSphereCost(state).mul(2))) buySpheres(state, 1);
}

function bossBlocked(state: GameState): boolean {
  return state.farming && isBossZone(state.zone + 1) && state.zone + 1 === state.highestZone;
}

/** Fordert den Boss heraus, sobald der geschätzte Schaden in der Zeit reicht */
function handleBoss(state: GameState, options: PolicyOptions): void {
  if (!state.farming) return;
  if (!bossBlocked(state)) {
    setAutoProgress(state, true);
    return;
  }
  const dps = teamDps(state).add(clickDamage(teamDps(state), clickBonus(state)).mul(options.clicksPerSecond));
  const damage = dps.mul(bossTimeLimit(state)).mul(bossDamageMult(state));
  if (damage.gte(enemyMaxHp(state.zone + 1).mul(1.1))) challengeBoss(state);
}

/** Reihenfolge, in der der Bot Dunkle Materie ausgibt */
const DM_PRIORITY: DmUpgradeId[] = [
  'autoklicker',
  'teamplaetze',
  'autolevel',
  'erinnerung',
  'automodul',
  'brutplatz',
  'autosphaeren',
  'autoboss',
  'autosupernova',
];

/** Schwarzes Loch beim ersten Mal sofort, später wenn die Dunkle Materie sich mindestens verdoppelt */
function handleBlackHole(state: GameState, memory: PolicyMemory, now: number): void {
  if (!canBlackHole(state)) return;
  if (state.blackHoles === 0 || darkMatterGain(state).gte(state.darkMatterTotal)) {
    blackHole(state);
    memory.lastHighest = state.highestZone;
    memory.lastProgress = now;
    memory.stardustEarned = 0;
  }
}

function spendDarkMatter(state: GameState): void {
  for (let i = 0; i < 50; i++) {
    const next = DM_PRIORITY.find((id) => canBuyDm(state, id));
    if (!next) return;
    buyDm(state, next);
  }
}

/** Startet Zuchten für die Arten im Team, sobald ein Platz frei ist */
function breed(state: GameState): void {
  for (const id of state.team) if (canBreed(state, id)) startBreeding(state, id);
}

/** Eine Entscheidungsrunde, während die Person online ist */
export function decide(state: GameState, options: PolicyOptions, memory: PolicyMemory, now: number): void {
  if (state.highestZone > memory.lastHighest) {
    memory.lastHighest = state.highestZone;
    memory.lastProgress = now;
  }
  handleBlackHole(state, memory, now);
  handleSupernova(state, memory, now);
  spendDarkMatter(state);
  spendStardust(state);
  breed(state);
  arrangeTeam(state);
  buySpheresIfUseful(state);
  spend(state, bossBlocked(state));
  arrangeTeam(state);
  handleBoss(state, options);
}

