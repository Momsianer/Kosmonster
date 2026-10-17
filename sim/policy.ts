/**
 * Entscheidungen des Simulationsbots. Nutzt nur Aktionen, die auch Spielende haben.
 */
import { clickDamage, enemyMaxHp, isBossZone, levelCost, moduleCost, moduleProduction, sphereCost } from '../src/core/formulas';
import type { GameState } from '../src/core/state';
import { BALANCING } from '../src/data/balancing';
import { MODULES, type ModuleId } from '../src/data/modules';
import { getSpecies, speciesInZone, type SpeciesId } from '../src/data/monsters';
import { buySpheres } from '../src/systems/catching';
import { challengeBoss, setAutoProgress } from '../src/systems/combat';
import { addToTeam, levelUp, monsterDps, removeFromTeam, teamDps, teamSlots } from '../src/systems/monsters';
import { buyModule, moduleCount } from '../src/systems/station';
import { isUnlocked } from '../src/systems/unlocks';

export interface PolicyOptions {
  /** Klicks pro Sekunde, während die Person online ist */
  clicksPerSecond: number;
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
      list.push({ kind: 'module', id: m.id, cost: moduleCost(m.baseCost, owned).toNumber(), value: gain.toNumber() });
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

/** Stellt die stärksten gefangenen Arten ins Team */
function arrangeTeam(state: GameState): void {
  const ranked = (Object.keys(state.collection) as SpeciesId[])
    .map((id) => ({ id, dps: monsterDps(state, id).toNumber() }))
    .sort((a, b) => b.dps - a.dps)
    .slice(0, teamSlots())
    .map((x) => x.id);
  for (const id of [...state.team]) if (!ranked.includes(id)) removeFromTeam(state, id);
  for (const id of ranked) addToTeam(state, id);
}

/** Kauft eine Sphäre, wenn in der Zone noch ungefangene Arten vorkommen */
function buySpheresIfUseful(state: GameState): void {
  if (!isUnlocked(state, 'shop') || state.spheres > 0) return;
  const missing = speciesInZone(state.zone).some((s) => !state.collection[s.id]);
  if (missing && state.energy.gte(sphereCost(state.zone).mul(2))) buySpheres(state, 1);
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
  const dps = teamDps(state).add(clickDamage(teamDps(state)).mul(options.clicksPerSecond));
  const damage = dps.mul(BALANCING.boss.timeLimitSeconds);
  if (damage.gte(enemyMaxHp(state.zone + 1).mul(1.1))) challengeBoss(state);
}

/** Eine Entscheidungsrunde, während die Person online ist */
export function decide(state: GameState, options: PolicyOptions): void {
  arrangeTeam(state);
  buySpheresIfUseful(state);
  spend(state, bossBlocked(state));
  arrangeTeam(state);
  handleBoss(state, options);
}

