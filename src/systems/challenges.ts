import { BALANCING } from '../data/balancing';
import type { ChallengeId } from '../data/challenges';
import type { GameState } from '../core/state';
import { resetUniverse } from './bigbang';
import { ruleActive } from './rules';
import { challengeGoal, endgameUnlocked } from './endgame';

export function isChallengeCompleted(state: GameState, id: ChallengeId): boolean {
  return state.challenge.completed.includes(id);
}

/** Challenges gibt es ab dem ersten Urknall */
export function canStartChallenge(state: GameState): boolean {
  return state.bigBangs > 0 && state.challenge.active === null;
}

/** Nächste Stufe einer Challenge, Stufen über 1 gibt es erst im Endgame */
export function nextChallengeTier(state: GameState, id: ChallengeId): number {
  const done = state.challenge.tiers[id] ?? 0;
  return done > 0 && !endgameUnlocked(state) ? done : done + 1;
}

/** Startet eine Challenge: setzt das Universum zurück wie ein Urknall, aber ohne Ursprungspunkte */
export function startChallenge(state: GameState, id: ChallengeId): boolean {
  if (!canStartChallenge(state)) return false;
  const tier = nextChallengeTier(state, id);
  resetUniverse(state);
  state.challenge.active = id;
  state.challenge.tier = tier;
  state.challenge.startTime = state.playTime;
  state.challenge.tideStart = state.playTime;
  state.challenge.entropyTimer = BALANCING.challengeRules.entropySeconds;
  return true;
}

/** Bricht die laufende Challenge ab, der Durchlauf geht ohne Einschränkungen weiter */
export function abandonChallenge(state: GameState): boolean {
  if (state.challenge.active === null) return false;
  state.challenge.active = null;
  state.challenge.tier = 0;
  return true;
}

/** Zielzone erreicht: Challenge abgeschlossen, jede neue Stufe bringt Ursprungspunkte */
function completeChallenge(state: GameState, id: ChallengeId): void {
  const tier = Math.max(1, state.challenge.tier);
  if (!state.challenge.completed.includes(id)) state.challenge.completed.push(id);
  if (tier > (state.challenge.tiers[id] ?? 0)) {
    state.challenge.tiers[id] = tier;
    state.originPoints = state.originPoints.add(BALANCING.challenges[id].reward);
    state.originTotal = state.originTotal.add(BALANCING.challenges[id].reward);
  }
  state.challenge.active = null;
  state.challenge.tier = 0;
}

/** Zielzone der laufenden Challenge */
export function activeChallengeGoal(state: GameState): number | null {
  const id = state.challenge.active;
  return id === null ? null : challengeGoal(id, Math.max(1, state.challenge.tier));
}

/** Läuft in jedem Tick: Abschluss, Zeitlimit und Entropie */
export function updateChallenge(state: GameState, dtSeconds: number): void {
  const id = state.challenge.active;
  if (id === null) return;
  if (state.highestZone >= challengeGoal(id, Math.max(1, state.challenge.tier))) {
    completeChallenge(state, id);
    return;
  }
  const rules = BALANCING.challengeRules;
  if (ruleActive(state, 'lightSpeed') && state.playTime - state.challenge.startTime > rules.lightSpeedSeconds) {
    state.challenge.active = null;
    state.challenge.tier = 0;
    return;
  }
  if (ruleActive(state, 'entropy')) {
    state.challenge.entropyTimer -= dtSeconds;
    while (state.challenge.entropyTimer <= 0) {
      state.challenge.entropyTimer += rules.entropySeconds;
      for (const memberId of state.team) {
        const entry = state.collection[memberId];
        if (entry && entry.level > 1) entry.level -= 1;
      }
    }
  }
}

/** Gezeitensperre: Produktion halbiert sich alle tideSeconds seit dem letzten Bosssieg */
export function tideMult(state: GameState): number {
  if (!ruleActive(state, 'tide')) return 1;
  const halvings = Math.floor((state.playTime - state.challenge.tideStart) / BALANCING.challengeRules.tideSeconds);
  return 0.5 ** Math.max(0, halvings);
}
