import { BALANCING } from '../data/balancing';
import { CHALLENGE_IDS } from '../data/challenges';
import { collatzNext, collatzStart, isZeroStage, zerosUpTo, type EndgameMode } from '../data/endgame';
import { getSpecies, MAIN_SPECIES, MONSTER_TYPES, MYTHIC_IDS, type MonsterType, type SpeciesId } from '../data/monsters';
import { enemyHp, isPrime } from '../core/formulas';
import type { EndgameRun, GameState } from '../core/state';
import { D, type Decimal } from '../util/decimal';
import { addCatch } from './catching';
import { monsterDps, teamDps } from './monsters';

/** Das Endgame beginnt mit dem Sieg über das Theorem */
export function endgameUnlocked(state: GameState): boolean {
  return state.theoremDefeated;
}

/** Neue Kämpfe nur ohne laufende Challenge, Theorem oder anderen Endgamekampf */
export function canStartEndgame(state: GameState): boolean {
  return endgameUnlocked(state) && state.challenge.active === null && !state.theorem && !state.endgame.run;
}

/** Leben eines Gegners: hp(hpZone) * hpMult * growth^(stufe − 1), im Labyrinth ×(1 + log2(n)) */
export function endgameHp(mode: EndgameMode, level: number, value = 0): Decimal {
  const { hpMult, growth } = BALANCING.endgame.modes[mode];
  const hp = enemyHp(BALANCING.endgame.hpZone).mul(hpMult).mul(D(growth).pow(level - 1));
  return mode === 'collatz' ? hp.mul(1 + Math.log2(Math.max(1, value))) : hp;
}

function createRun(mode: EndgameMode, level: number, step: number, value: number): EndgameRun {
  const maxHp = endgameHp(mode, level, value);
  return { mode, level, step, value, hp: maxHp, maxHp, timeLeft: BALANCING.endgame.modes[mode].timeLimitSeconds };
}

/** Startet einen Kampf. Das Labyrinth beginnt bei der nächsten ungeschafften Stufe, alles andere bei 1. */
export function startEndgame(state: GameState, mode: EndgameMode): boolean {
  if (!canStartEndgame(state)) return false;
  if (mode === 'collatz') {
    const level = state.endgame.records.collatz + 1;
    state.endgame.run = createRun(mode, level, 0, collatzStart(level));
  } else {
    state.endgame.run = createRun(mode, 1, 0, 0);
  }
  return true;
}

/** Rückzug oder Zeit abgelaufen: Der Kampf endet, die Bestwerte bleiben */
export function endEndgame(state: GameState): boolean {
  if (!state.endgame.run) return false;
  state.endgame.run = null;
  return true;
}

function recordLevel(state: GameState, mode: EndgameMode, level: number): void {
  state.endgame.records[mode] = Math.max(state.endgame.records[mode], level);
}

/** Gegner besiegt: nächste Stufe, im Labyrinth der nächste Schritt nach der Collatz Regel */
function advanceRun(state: GameState, run: EndgameRun): void {
  if (run.mode === 'collatz') {
    const next = collatzNext(run.value);
    if (next <= 1) {
      // Bei 1 angekommen: Stufe geschafft, weiter mit der nächsten Startzahl
      recordLevel(state, 'collatz', run.level);
      state.endgame.run = createRun('collatz', run.level + 1, 0, collatzStart(run.level + 1));
      return;
    }
    state.endgame.run = createRun('collatz', run.level, run.step + 1, next);
    return;
  }
  recordLevel(state, run.mode, run.level);
  state.endgame.run = createRun(run.mode, run.level + 1, 0, 0);
}

/** Schadensmultiplikator im laufenden Kampf (Riemann: Nullstellen) */
export function endgameDamageMult(state: GameState): number {
  const run = state.endgame.run;
  if (run?.mode === 'riemann' && isZeroStage(run.level)) return BALANCING.endgame.zeroDamageMult;
  return 1;
}

/** Schaden im Endgamekampf. In der Goldbach Arena zählen keine Klicks. */
export function damageEndgame(state: GameState, damage: Decimal, fromClick: boolean): boolean {
  const run = state.endgame.run;
  if (!run) return false;
  if (fromClick && run.mode === 'goldbach') return false;
  run.hp = run.hp.sub(damage.mul(endgameDamageMult(state))).max(0);
  if (run.hp.gt(0)) return false;
  advanceRun(state, run);
  return true;
}

/** Teamplätze mit Primzahlnummer (2, 3, 5, 7, …), gezählt ab 1 */
export function primeSlotMembers(state: GameState): SpeciesId[] {
  return state.team.filter((_, i) => isPrime(i + 1));
}

/** Goldbach Arena: Summe der DPS der zwei stärksten Monster auf Primplätzen */
export function goldbachDps(state: GameState): Decimal {
  const values = primeSlotMembers(state)
    .map((id) => monsterDps(state, id))
    .sort((a, b) => b.cmp(a))
    .slice(0, BALANCING.endgame.goldbachPair);
  return values.reduce((sum, v) => sum.add(v), D(0));
}

/** Team DPS im laufenden Kampf */
export function endgameTeamDps(state: GameState): Decimal {
  return state.endgame.run?.mode === 'goldbach' ? goldbachDps(state) : teamDps(state);
}

/** Läuft in jedem Tick: Zeitlimit des Gegners */
export function updateEndgame(state: GameState, dtSeconds: number): void {
  const run = state.endgame.run;
  if (!run) return;
  run.timeLeft -= dtSeconds;
  if (run.timeLeft <= 0) state.endgame.run = null;
}

// ─── Belohnungen ────────────────────────────────────────────

/** Erreichte Nullstellen der Riemann Spirale */
export function zerosFound(state: GameState): number {
  return zerosUpTo(state.endgame.records.riemann);
}

/** Multiversum: Team DPS ×(1 + reward * Rekord) */
export function multiverseMult(state: GameState): number {
  return 1 + BALANCING.endgame.modes.multiversum.reward * state.endgame.records.multiversum;
}

/** Collatz Labyrinth: Produktion ×(1 + reward * geschaffte Stufen) */
export function collatzMult(state: GameState): number {
  return 1 + BALANCING.endgame.modes.collatz.reward * state.endgame.records.collatz;
}

/** Goldbach Arena: Fangchance +reward je Stufe */
export function goldbachCatchBonus(state: GameState): number {
  return BALANCING.endgame.modes.goldbach.reward * state.endgame.records.goldbach;
}

/** Riemann Spirale: Sternenstaub ×(1 + reward * Nullstellen) */
export function riemannMult(state: GameState): number {
  return 1 + BALANCING.endgame.modes.riemann.reward * zerosFound(state);
}

/** Wirkung der Belohnung eines Modus als Zahl für die Anzeige */
export function endgameReward(state: GameState, mode: EndgameMode): number {
  switch (mode) {
    case 'multiversum':
      return multiverseMult(state);
    case 'collatz':
      return collatzMult(state);
    case 'goldbach':
      return goldbachCatchBonus(state);
    case 'riemann':
      return riemannMult(state);
  }
}

// ─── Challengestufen ────────────────────────────────────────

/** Zielzone einer Challenge auf Stufe tier */
export function challengeGoal(id: (typeof CHALLENGE_IDS)[number], tier: number): number {
  return BALANCING.challenges[id].goalZone + BALANCING.endgame.tierZoneStep * Math.max(0, tier - 1);
}

/** Team DPS ×tierDpsMult für jede geschaffte Challengestufe über 1 */
export function challengeTierMult(state: GameState): Decimal {
  const extra = CHALLENGE_IDS.reduce((sum, id) => sum + Math.max(0, (state.challenge.tiers[id] ?? 0) - 1), 0);
  return D(BALANCING.endgame.tierDpsMult).pow(extra);
}

// ─── Polarstern Jagd ────────────────────────────────────────

/** Gefangene Polarsterne je Typ unter den Hauptarten */
export function shinyProgress(state: GameState, type: MonsterType): { have: number; total: number } {
  const species = MAIN_SPECIES.filter((s) => s.type === type);
  return { have: species.filter((s) => state.collection[s.id]?.shiny).length, total: species.length };
}

/** Typen mit vollständigem Polarsternsatz */
export function completeShinySets(state: GameState): MonsterType[] {
  return MONSTER_TYPES.filter((type) => {
    const { have, total } = shinyProgress(state, type);
    return have >= total;
  });
}

/** Polarstern Jagd: ×polarsternSetMult für Monster eines Typs mit vollständigem Satz (nur im Endgame) */
export function shinySetMult(state: GameState, speciesId: SpeciesId): number {
  if (!endgameUnlocked(state)) return 1;
  const type = getSpecies(speciesId)?.type;
  if (!type) return 1;
  const { have, total } = shinyProgress(state, type);
  return have >= total ? BALANCING.endgame.polarsternSetMult : 1;
}

// ─── Mythische Monster ──────────────────────────────────────

type MythicId = keyof typeof BALANCING.mythic;

/** Fortschritt zur Sonderbedingung einer mythischen Art */
export function mythicProgress(state: GameState, id: MythicId): { have: number; need: number } {
  const condition = BALANCING.mythic[id];
  const need = condition.value;
  switch (condition.kind) {
    case 'record':
      return { have: state.endgame.records[condition.mode], need };
    case 'zeros':
      return { have: zerosFound(state), need };
    case 'collection':
      return { have: MAIN_SPECIES.filter((s) => state.collection[s.id]).length, need };
    case 'challengeTier':
      return { have: Math.min(...CHALLENGE_IDS.map((c) => state.challenge.tiers[c] ?? 0)), need };
  }
}

export function isMythicId(id: SpeciesId): id is MythicId {
  return id in BALANCING.mythic;
}

/** Erfüllte Sonderbedingungen bringen die mythische Art in die Sammlung */
export function checkMythics(state: GameState): SpeciesId[] {
  if (!endgameUnlocked(state)) return [];
  const found: SpeciesId[] = [];
  for (const id of MYTHIC_IDS) {
    if (state.collection[id] || !isMythicId(id)) continue;
    const { have, need } = mythicProgress(state, id);
    if (have >= need) {
      addCatch(state, id);
      found.push(id);
    }
  }
  return found;
}
