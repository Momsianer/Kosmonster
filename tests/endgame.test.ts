import { describe, expect, it } from 'vitest';
import { enemyHp, starProgress, starsFor, starsMult } from '../src/core/formulas';
import { advance } from '../src/core/loop';
import { createInitialState, type GameState } from '../src/core/state';
import { BALANCING } from '../src/data/balancing';
import { CHALLENGE_IDS } from '../src/data/challenges';
import {
  collatzNext,
  collatzStart,
  collatzSteps,
  ENDGAME_MODES,
  isZeroStage,
  riemannZero,
  zerosUpTo,
} from '../src/data/endgame';
import { MAIN_SPECIES, MYTHIC_IDS, SPECIES } from '../src/data/monsters';
import { t } from '../src/i18n';
import { runAutomation } from '../src/systems/automation';
import { addCatch, catchBonus } from '../src/systems/catching';
import { nextChallengeTier, startChallenge, updateChallenge } from '../src/systems/challenges';
import { clickEnemy, dealDamage } from '../src/systems/combat';
import {
  canStartEndgame,
  challengeGoal,
  challengeTierMult,
  checkMythics,
  collatzMult,
  completeShinySets,
  endEndgame,
  endgameHp,
  goldbachDps,
  multiverseMult,
  mythicProgress,
  primeSlotMembers,
  riemannMult,
  shinySetMult,
  startEndgame,
  updateEndgame,
  zerosFound,
} from '../src/systems/endgame';
import { globalDpsMult, monsterDps, speciesStars, teamDps } from '../src/systems/monsters';
import { resetRun, stardustGain } from '../src/systems/prestige';
import { productionMult } from '../src/systems/station';
import { startTheorem } from '../src/systems/theorem';
import { isUnlocked } from '../src/systems/unlocks';
import { D } from '../src/util/decimal';

function endgameState(): GameState {
  const state = createInitialState(0, 7);
  state.bigBangs = 1;
  state.theoremDefeated = true;
  return state;
}

/** Besiegt den aktuellen Endgamegegner mit genau seinem Leben */
function defeatRun(state: GameState): void {
  const run = state.endgame.run!;
  dealDamage(state, run.hp);
}

describe('Riemann Nullstellen', () => {
  it('die ersten zehn sind bekannt, danach steigend angenähert', () => {
    expect(riemannZero(1)).toBeCloseTo(14.1347, 3);
    expect(riemannZero(10)).toBeCloseTo(49.7738, 3);
    // Elfte Nullstelle liegt bei 52,97
    expect(riemannZero(11)).toBeGreaterThan(51);
    expect(riemannZero(11)).toBeLessThan(55);
    for (let n = 1; n < 200; n++) expect(riemannZero(n + 1)).toBeGreaterThan(riemannZero(n));
  });

  it('Stufen der Nullstellen und Anzahl bis zu einer Stufe', () => {
    expect(zerosUpTo(13)).toBe(0);
    expect(zerosUpTo(14)).toBe(1);
    expect(zerosUpTo(21)).toBe(2);
    expect(isZeroStage(14)).toBe(true);
    expect(isZeroStage(15)).toBe(false);
    expect(isZeroStage(25)).toBe(true);
  });
});

describe('Collatz', () => {
  it('Regel und Schritte', () => {
    expect(collatzNext(10)).toBe(5);
    expect(collatzNext(5)).toBe(16);
    expect(collatzSteps(1)).toBe(0);
    expect(collatzSteps(3)).toBe(7);
    expect(collatzSteps(27)).toBe(111);
    expect(collatzStart(1)).toBe(2);
  });
});

describe('Endgamekämpfe', () => {
  it('erst nach dem Theorem, nicht während einer Challenge', () => {
    const state = createInitialState(0);
    expect(canStartEndgame(state)).toBe(false);
    expect(startEndgame(state, 'multiversum')).toBe(false);
    state.theoremDefeated = true;
    expect(isUnlocked(state, 'endgame')).toBe(true);
    state.challenge.active = 'entropie';
    expect(startEndgame(state, 'multiversum')).toBe(false);
    state.challenge.active = null;
    expect(startEndgame(state, 'multiversum')).toBe(true);
    expect(startEndgame(state, 'riemann')).toBe(false);
  });

  it('Leben je Modus: hp(hpZone) * hpMult * growth^(stufe − 1), im Labyrinth ×(1 + log2 n)', () => {
    const { hpZone, modes } = BALANCING.endgame;
    const base = enemyHp(hpZone);
    expect(endgameHp('multiversum', 1).div(base.mul(modes.multiversum.hpMult)).toNumber()).toBeCloseTo(1, 8);
    expect(endgameHp('multiversum', 3).div(endgameHp('multiversum', 1)).toNumber()).toBeCloseTo(
      modes.multiversum.growth ** 2,
      8,
    );
    expect(endgameHp('collatz', 1, 8).div(base.mul(modes.collatz.hpMult)).toNumber()).toBeCloseTo(4, 8);
  });

  it('Multiversum: jeder Sieg führt eine Tiefe weiter und hebt den Rekord', () => {
    const state = endgameState();
    startEndgame(state, 'multiversum');
    defeatRun(state);
    defeatRun(state);
    expect(state.endgame.run!.level).toBe(3);
    expect(state.endgame.records.multiversum).toBe(2);
    expect(multiverseMult(state)).toBeCloseTo(1 + 2 * BALANCING.endgame.modes.multiversum.reward, 10);
  });

  it('abgelaufene Zeit beendet den Kampf, der Rekord bleibt', () => {
    const state = endgameState();
    startEndgame(state, 'multiversum');
    defeatRun(state);
    updateEndgame(state, BALANCING.endgame.modes.multiversum.timeLimitSeconds + 1);
    expect(state.endgame.run).toBeNull();
    expect(state.endgame.records.multiversum).toBe(1);
  });

  it('Rückzug und Resets beenden den Kampf', () => {
    const state = endgameState();
    startEndgame(state, 'riemann');
    expect(endEndgame(state)).toBe(true);
    expect(endEndgame(state)).toBe(false);
    startEndgame(state, 'riemann');
    resetRun(state);
    expect(state.endgame.run).toBeNull();
  });

  it('Autosupernova wartet, solange ein Endgamekampf läuft', () => {
    const state = endgameState();
    state.dmUpgrades.autosupernova = 1;
    state.automation.enabled.autosupernova = true;
    state.automation.supernovaTarget = 1;
    state.highestZone = BALANCING.supernova.minZone;
    state.cycleEnergy = D(1e15);
    startEndgame(state, 'multiversum');
    runAutomation(state, BALANCING.automation.intervalSeconds);
    expect(state.supernovas).toBe(0);
    endEndgame(state);
    runAutomation(state, BALANCING.automation.intervalSeconds);
    expect(state.supernovas).toBe(1);
  });

  it('während des Kampfs ruhen die normalen Gegner und das Theorem ist gesperrt', () => {
    const state = endgameState();
    const enemyHpBefore = state.enemy.hp;
    state.challenge.completed = [...CHALLENGE_IDS];
    startEndgame(state, 'multiversum');
    dealDamage(state, state.endgame.run!.maxHp.div(2));
    expect(state.enemy.hp.eq(enemyHpBefore)).toBe(true);
    expect(state.endgame.run!.hp.lt(state.endgame.run!.maxHp)).toBe(true);
    expect(startTheorem(state)).toBe(false);
    endEndgame(state);
    expect(startTheorem(state)).toBe(true);
  });

  it('Collatz Labyrinth folgt der Regel bis 1 und beginnt dann die nächste Stufe', () => {
    const state = endgameState();
    state.endgame.records.collatz = 2;
    startEndgame(state, 'collatz');
    // Stufe 3 startet bei 4: 4 → 2 → 1
    expect(state.endgame.run!.level).toBe(3);
    expect(state.endgame.run!.value).toBe(4);
    defeatRun(state);
    expect(state.endgame.run!.value).toBe(2);
    expect(state.endgame.run!.step).toBe(1);
    defeatRun(state);
    expect(state.endgame.records.collatz).toBe(3);
    expect(state.endgame.run!.level).toBe(4);
    expect(state.endgame.run!.value).toBe(5);
    expect(collatzMult(state)).toBeCloseTo(1 + 3 * BALANCING.endgame.modes.collatz.reward, 10);
    expect(productionMult(state).toNumber()).toBeCloseTo(collatzMult(state), 8);
  });

  it('Goldbach Arena: nur die zwei stärksten Monster auf Primplätzen, Klicks zählen nicht', () => {
    const state = endgameState();
    const ids = MAIN_SPECIES.slice(0, 5).map((s) => s.id);
    for (const id of ids) {
      state.collection[id] = { caught: 1, level: 10, evolution: 0, shiny: false, bred: 0 };
    }
    state.team = [...ids];
    expect(primeSlotMembers(state)).toEqual([ids[1], ids[2], ids[4]]);
    const values = [ids[1]!, ids[2]!, ids[4]!].map((id) => monsterDps(state, id)).sort((a, b) => b.cmp(a));
    expect(goldbachDps(state).eq(values[0]!.add(values[1]!))).toBe(true);
    expect(goldbachDps(state).lt(teamDps(state))).toBe(true);

    startEndgame(state, 'goldbach');
    const hp = D(1e12);
    state.endgame.run!.hp = hp;
    state.endgame.run!.maxHp = hp;
    clickEnemy(state);
    expect(state.endgame.run!.hp.eq(hp)).toBe(true);
    const pair = goldbachDps(state);
    advance(state, 1000);
    expect(state.endgame.run!.hp.toNumber()).toBeCloseTo(hp.sub(pair).toNumber(), -2);
  });

  it('Goldbach Stufen erhöhen die Fangchance', () => {
    const state = endgameState();
    const before = catchBonus(state);
    state.endgame.records.goldbach = 5;
    expect(catchBonus(state)).toBeCloseTo(before + 5 * BALANCING.endgame.modes.goldbach.reward, 10);
  });

  it('Riemann Spirale: Nullstellen sind verwundbar und erhöhen den Sternenstaub', () => {
    const state = endgameState();
    startEndgame(state, 'riemann');
    state.endgame.run = { ...state.endgame.run!, level: 14 };
    const hp = D(1000);
    state.endgame.run.hp = hp;
    state.endgame.run.maxHp = hp;
    dealDamage(state, D(100));
    expect(state.endgame.run.hp.toNumber()).toBe(1000 - 100 * BALANCING.endgame.zeroDamageMult);

    state.endgame.run = null;
    state.cycleEnergy = D(1e15);
    const before = stardustGain(state);
    state.endgame.records.riemann = 25;
    expect(zerosFound(state)).toBe(3);
    expect(riemannMult(state)).toBeCloseTo(1 + 3 * BALANCING.endgame.modes.riemann.reward, 10);
    expect(stardustGain(state).toNumber()).toBeCloseTo(Math.floor(before.toNumber() * riemannMult(state)), -1);
  });

  it('jeder Modus hat Name, Beschreibung, Rekord und Stufentext', () => {
    for (const mode of ENDGAME_MODES) {
      for (const key of ['name', 'description', 'record', 'stage'] as const) {
        expect(t(`endgame.${mode}.${key}`)).not.toBe(`endgame.${mode}.${key}`);
      }
      expect(t(`endgame.reward.${mode}`)).not.toBe(`endgame.reward.${mode}`);
    }
  });
});

describe('Challengestufen', () => {
  it('Zielzone wächst je Stufe', () => {
    const base = BALANCING.challenges.entropie.goalZone;
    expect(challengeGoal('entropie', 1)).toBe(base);
    expect(challengeGoal('entropie', 3)).toBe(base + 2 * BALANCING.endgame.tierZoneStep);
  });

  it('höhere Stufen erst im Endgame, jede neue Stufe bringt Ursprungspunkte und Team DPS', () => {
    const state = createInitialState(0, 3);
    state.bigBangs = 1;
    state.challenge.completed = ['entropie'];
    state.challenge.tiers = { entropie: 1 };
    expect(nextChallengeTier(state, 'entropie')).toBe(1);
    state.theoremDefeated = true;
    expect(nextChallengeTier(state, 'entropie')).toBe(2);

    expect(startChallenge(state, 'entropie')).toBe(true);
    expect(state.challenge.tier).toBe(2);
    const points = state.originPoints;
    state.highestZone = challengeGoal('entropie', 2) - 1;
    updateChallenge(state, 0.1);
    expect(state.challenge.active).toBe('entropie');
    state.highestZone = challengeGoal('entropie', 2);
    updateChallenge(state, 0.1);
    expect(state.challenge.active).toBeNull();
    expect(state.challenge.tiers.entropie).toBe(2);
    expect(state.originPoints.sub(points).toNumber()).toBe(BALANCING.challenges.entropie.reward);
    expect(challengeTierMult(state).toNumber()).toBeCloseTo(BALANCING.endgame.tierDpsMult, 10);
    expect(nextChallengeTier(state, 'entropie')).toBe(3);
  });

  it('eine bereits geschaffte Stufe gibt nichts erneut', () => {
    const state = createInitialState(0, 3);
    state.bigBangs = 1;
    state.challenge.completed = ['entropie'];
    state.challenge.tiers = { entropie: 1 };
    startChallenge(state, 'entropie');
    expect(state.challenge.tier).toBe(1);
    const points = state.originPoints;
    state.highestZone = challengeGoal('entropie', 1);
    updateChallenge(state, 0.1);
    expect(state.originPoints.eq(points)).toBe(true);
  });
});

describe('Sterne über fünf', () => {
  const { maxStars } = BALANCING.stars;
  const toFive = [1, 2, 3, 4, 5].reduce((sum, s) => sum + 5 * 2 ** (s - 1), 0);

  it('ohne Endgame höchstens maxStars', () => {
    expect(starsFor(toFive + 10_000)).toBe(maxStars);
    expect(starProgress(toFive + 10)).toBeNull();
  });

  it('im Endgame kostet jeder weitere Stern extraStarCopies Kopien', () => {
    const extra = BALANCING.endgame.extraStarCopies;
    expect(starsFor(toFive, true)).toBe(maxStars);
    expect(starsFor(toFive + extra - 1, true)).toBe(maxStars);
    expect(starsFor(toFive + 3 * extra, true)).toBe(maxStars + 3);
    expect(starProgress(toFive + extra + 7, true)).toEqual({ have: 7, need: extra });
  });

  it('der Bonus flacht über fünf Sternen ab', () => {
    const five = starsMult(maxStars).toNumber();
    expect(starsMult(maxStars + 2).toNumber()).toBeCloseTo(five * (1 + 2 * BALANCING.endgame.extraStarBonus), 8);
    expect(starsMult(maxStars + 1).toNumber() / five).toBeLessThan(BALANCING.stars.starMult);
  });

  it('gilt für Arten erst nach dem Theorem', () => {
    const state = createInitialState(0);
    const id = MAIN_SPECIES[0]!.id;
    state.collection[id] = { caught: 1 + toFive + 200, level: 1, evolution: 0, shiny: false, bred: 0 };
    expect(speciesStars(state, id)).toBe(maxStars);
    state.theoremDefeated = true;
    expect(speciesStars(state, id)).toBe(maxStars + 2);
  });
});

describe('Polarstern Jagd', () => {
  it('ein vollständiger Satz stärkt den Typ im Endgame', () => {
    const state = endgameState();
    const prim = MAIN_SPECIES.filter((s) => s.type === 'prim');
    for (const s of prim) addCatch(state, s.id, true);
    expect(completeShinySets(state)).toEqual(['prim']);
    expect(shinySetMult(state, prim[0]!.id)).toBe(BALANCING.endgame.polarsternSetMult);
    const other = MAIN_SPECIES.find((s) => s.type === 'pi')!.id;
    expect(shinySetMult(state, other)).toBe(1);
    state.theoremDefeated = false;
    expect(shinySetMult(state, prim[0]!.id)).toBe(1);
  });
});

describe('Mythische Monster', () => {
  it('jede mythische Art hat eine Sonderbedingung und einen Text', () => {
    expect(Object.keys(BALANCING.mythic).sort()).toEqual([...MYTHIC_IDS].sort());
    expect(t('mythic.zeros')).not.toBe('mythic.zeros');
  });

  it('erscheinen erst, wenn die Bedingung erfüllt ist', () => {
    const state = endgameState();
    expect(checkMythics(state)).toEqual([]);
    state.endgame.records.multiversum = 13;
    expect(checkMythics(state)).toEqual(['art_121']);
    expect(state.collection.art_121?.caught).toBe(1);
    expect(checkMythics(state)).toEqual([]);
    state.endgame.records.riemann = 14;
    expect(checkMythics(state)).toEqual(['art_125']);
  });

  it('Fortschritt für Sammlung und Challengestufen', () => {
    const state = endgameState();
    for (const s of MAIN_SPECIES.slice(0, 10)) addCatch(state, s.id);
    expect(mythicProgress(state, 'art_126')).toEqual({ have: 10, need: 120 });
    for (const id of CHALLENGE_IDS) state.challenge.tiers[id] = 2;
    expect(mythicProgress(state, 'art_128')).toEqual({ have: 2, need: 2 });
    checkMythics(state);
    expect(state.collection.art_128).toBeDefined();
  });

  it('vor dem Theorem nie', () => {
    const state = createInitialState(0);
    state.endgame.records.multiversum = 100;
    expect(checkMythics(state)).toEqual([]);
  });

  it('mythische Arten sind stark', () => {
    const mythic = SPECIES.find((s) => s.rarity === 'mythic')!;
    expect(BALANCING.rarity.mythic.dpsMult).toBeGreaterThan(BALANCING.rarity.legendary.dpsMult);
    expect(mythic.evolutions).toBe(0);
  });
});

describe('Endgameboni im Team DPS', () => {
  it('Multiversum und Challengestufen wirken global', () => {
    const state = endgameState();
    const before = globalDpsMult(state);
    state.endgame.records.multiversum = 10;
    state.challenge.tiers = { entropie: 3 };
    const expected = before
      .mul(1 + 10 * BALANCING.endgame.modes.multiversum.reward)
      .mul(BALANCING.endgame.tierDpsMult ** 2);
    expect(globalDpsMult(state).div(expected).toNumber()).toBeCloseTo(1, 8);
  });
});
