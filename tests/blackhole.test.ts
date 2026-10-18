import { describe, expect, it } from 'vitest';
import { enemyMaxHp } from '../src/core/formulas';
import { advance, catchUp } from '../src/core/loop';
import { createInitialState, type GameState } from '../src/core/state';
import { BALANCING } from '../src/data/balancing';
import { DM_UPGRADE_IDS } from '../src/data/darkmatter';
import { t } from '../src/i18n';
import { runAutomation } from '../src/systems/automation';
import { blackHole, canBlackHole, darkMatterFor, darkMatterGain } from '../src/systems/blackhole';
import {
  breedingSeconds,
  breedingSlots,
  canBreed,
  potentialMult,
  startBreeding,
  updateBreeding,
} from '../src/systems/breeding';
import { addCatch } from '../src/systems/catching';
import { enterZone, failBoss } from '../src/systems/combat';
import {
  autoclickRate,
  buyDm,
  canBuyDm,
  dmCost,
  gravitationMult,
  isDmAvailable,
} from '../src/systems/darkmatter';
import { monsterDps, teamSlots } from '../src/systems/monsters';
import { stardustGain, supernova } from '../src/systems/prestige';
import { isUnlocked } from '../src/systems/unlocks';
import { D } from '../src/util/decimal';

const BH = BALANCING.blackHole;

function stateWithDm(amount = 1000): GameState {
  const state = createInitialState(0, 31);
  state.darkMatter = D(amount);
  return state;
}

describe('Dunkle Materie Formeln', () => {
  it('floor( (sternenstaubDiesesZyklus / stardustDivisor)^0,4 )', () => {
    const d = BH.stardustDivisor;
    expect(darkMatterFor(D(0)).toNumber()).toBe(0);
    expect(darkMatterFor(D(d)).toNumber()).toBe(1);
    expect(darkMatterFor(D(d * 10)).toNumber()).toBe(2);
    expect(darkMatterFor(D(d * 1000)).toNumber()).toBe(15);
  });

  it('Gravitation (1 + verdienteDunkleMaterie)^0,5 verstärkt den Sternenstaub', () => {
    const state = createInitialState(0);
    state.highestZone = 60;
    state.cycleEnergy = D(1e13);
    const plain = stardustGain(state).toNumber();
    state.darkMatterTotal = D(3);
    expect(gravitationMult(state).toNumber()).toBe(2);
    expect(stardustGain(state).toNumber()).toBe(plain * 2);
  });

  it('Kosten = basis * 2^stufe', () => {
    expect(dmCost('autoklicker', 0).toNumber()).toBe(1);
    expect(dmCost('autoklicker', 3).toNumber()).toBe(8);
    expect(dmCost('autosupernova', 0).toNumber()).toBe(13);
  });

  it('jedes Upgrade hat Namen und Beschreibung', () => {
    for (const id of DM_UPGRADE_IDS) {
      expect(t(`darkMatter.${id}.name`)).not.toBe(`darkMatter.${id}.name`);
      expect(t(`darkMatter.${id}.description`)).not.toBe(`darkMatter.${id}.description`);
    }
  });
});

describe('Schwarzes Loch', () => {
  function ready(): GameState {
    const state = createInitialState(0, 9);
    addCatch(state, 'art_001');
    state.collection.art_001!.evolution = 1;
    state.collection.art_001!.bred = 2;
    state.stardust = D(5000);
    state.stardustCycle = D(BH.minStardust * 10);
    state.research = { klickkraft: 4, teamstaerke: 3 };
    state.modules = { solarpanel: 10 };
    state.energy = D(1e9);
    enterZone(state, 40);
    return state;
  }

  it('erst ab minStardust Sternenstaub im Zyklus', () => {
    const state = ready();
    expect(canBlackHole(state)).toBe(true);
    state.stardustCycle = D(BH.minStardust - 1);
    expect(canBlackHole(state)).toBe(false);
    expect(blackHole(state)).toBe(false);
  });

  it('Supernovas zählen Sternenstaub in den Zyklus', () => {
    const state = createInitialState(0);
    state.highestZone = 60;
    state.cycleEnergy = D(4e12);
    const gain = stardustGain(state);
    supernova(state);
    expect(state.stardustCycle.eq(gain)).toBe(true);
  });

  it('gibt Dunkle Materie und setzt Sternenstaub, Forschung und den Durchlauf zurück', () => {
    const state = ready();
    const gain = darkMatterGain(state);
    expect(blackHole(state)).toBe(true);
    expect(state.darkMatter.eq(gain)).toBe(true);
    expect(state.darkMatterTotal.eq(gain)).toBe(true);
    expect(state.blackHoles).toBe(1);
    expect(state.stardust.eq(0)).toBe(true);
    expect(state.stardustCycle.eq(0)).toBe(true);
    expect(state.research).toEqual({});
    expect(state.energy.eq(0)).toBe(true);
    expect(state.zone).toBe(1);
    expect(state.modules).toEqual({});
    expect(state.enemy.maxHp.eq(enemyMaxHp(1))).toBe(true);
  });

  it('behält Sammlung, Entwicklung, Zucht und Upgrades', () => {
    const state = ready();
    state.dmUpgrades = { autoklicker: 2 };
    blackHole(state);
    expect(state.collection.art_001).toMatchObject({ evolution: 1, bred: 2, level: 0 });
    expect(state.dmUpgrades).toEqual({ autoklicker: 2 });
  });

  it('Erinnerung behält einen Teil der Forschung', () => {
    const state = ready();
    state.dmUpgrades = { erinnerung: 2 };
    blackHole(state);
    expect(state.research).toEqual({ klickkraft: 2, teamstaerke: 1 });
  });

  it('schaltet Automatisierung und Brutstation frei', () => {
    const state = ready();
    expect(isUnlocked(state, 'blackHole')).toBe(true);
    expect(isUnlocked(state, 'breeding')).toBe(false);
    blackHole(state);
    expect(isUnlocked(state, 'automation')).toBe(true);
    expect(isUnlocked(state, 'breeding')).toBe(true);
  });
});

describe('Upgrades für Dunkle Materie', () => {
  it('Automatiken nur in Reihenfolge', () => {
    const state = stateWithDm();
    expect(isDmAvailable(state, 'autolevel')).toBe(false);
    expect(buyDm(state, 'autolevel')).toBe(false);
    expect(buyDm(state, 'autoklicker')).toBe(true);
    expect(buyDm(state, 'autolevel')).toBe(true);
    expect(buyDm(state, 'autoboss')).toBe(false);
    expect(isDmAvailable(state, 'teamplaetze')).toBe(true);
  });

  it('kosten Dunkle Materie und schalten Automatiken sofort ein', () => {
    const state = stateWithDm(3);
    expect(buyDm(state, 'autoklicker')).toBe(true);
    expect(state.darkMatter.toNumber()).toBe(2);
    expect(state.automation.enabled.autoklicker).toBe(true);
    expect(canBuyDm(state, 'autoklicker')).toBe(true);
    buyDm(state, 'autoklicker');
    expect(canBuyDm(state, 'autoklicker')).toBe(false);
  });

  it('Teamplätze bis 10', () => {
    const state = stateWithDm(1e6);
    state.research = { fangglueck: 1, sphaerenrabatt: 1, teamplatz: 3 };
    for (let i = 0; i < 4; i++) buyDm(state, 'teamplaetze');
    expect(teamSlots(state)).toBe(10);
  });

  it('Autoklicker: 10 Klicks pro Sekunde, jede weitere Stufe +5', () => {
    const state = stateWithDm(1e6);
    expect(autoclickRate(state)).toBe(0);
    buyDm(state, 'autoklicker');
    expect(autoclickRate(state)).toBe(10);
    buyDm(state, 'autoklicker');
    expect(autoclickRate(state)).toBe(15);
  });
});

describe('Automatisierung', () => {
  function owned(...ids: (keyof GameState['dmUpgrades'])[]): GameState {
    const state = createInitialState(0, 2);
    for (const id of ids) {
      state.dmUpgrades[id] = 1;
      (state.automation.enabled as Record<string, boolean>)[id] = true;
    }
    return state;
  }

  it('Autoklicker klickt ohne den Leerlauf zu stören', () => {
    const state = owned('autoklicker');
    state.playTime = 100;
    runAutomation(state, 1);
    expect(state.clicks).toBe(10);
    expect(state.lastClick).toBe(0);
  });

  it('ausgeschaltete Automatiken ruhen', () => {
    const state = owned('autoklicker');
    state.automation.enabled.autoklicker = false;
    runAutomation(state, 1);
    expect(state.clicks).toBe(0);
  });

  it('Autolevel kauft Level im Team', () => {
    const state = owned('autoklicker', 'autolevel');
    state.automation.enabled.autoklicker = false;
    addCatch(state, 'art_001');
    state.energy = D(1e4);
    runAutomation(state, 1);
    expect(state.collection.art_001!.level).toBeGreaterThan(1);
  });

  it('Autobau kauft Module', () => {
    const state = owned('automodul');
    state.energy = D(1e4);
    runAutomation(state, 1);
    expect(Object.values(state.modules).reduce((a, b) => a + (b ?? 0), 0)).toBeGreaterThan(5);
  });

  it('Autosphären füllen bis zum Zielwert auf', () => {
    const state = owned('autosphaeren');
    state.spheres.standard = 2;
    state.automation.sphereTarget = 8;
    state.energy = D(1e6);
    runAutomation(state, 1);
    expect(state.spheres.standard).toBe(8);
  });

  it('Autoboss versucht den Boss erneut', () => {
    const state = owned('autoboss');
    enterZone(state, 5);
    failBoss(state);
    expect(state.zone).toBe(4);
    for (let i = 0; i < BALANCING.automation.bossRetrySeconds; i++) runAutomation(state, 1);
    expect(state.zone).toBe(5);
    expect(state.farming).toBe(false);
  });

  it('Autosupernova löst beim Zielwert aus', () => {
    const state = owned('autosupernova');
    state.highestZone = 60;
    state.cycleEnergy = D(1e12);
    state.automation.supernovaTarget = 1e9;
    runAutomation(state, 1);
    expect(state.supernovas).toBe(0);
    state.automation.supernovaTarget = 10;
    state.automation.timer = 0;
    runAutomation(state, 1);
    expect(state.supernovas).toBe(1);
  });

  it('läuft auch offline', () => {
    const state = owned('autoklicker');
    catchUp(state, 120 * 1000);
    expect(state.clicks).toBe(1200);
  });
});

describe('Brutstation', () => {
  it('potenzialMult = 1 + 0,05 * zuchten^0,75', () => {
    expect(potentialMult(0).toNumber()).toBe(1);
    expect(potentialMult(1).toNumber()).toBeCloseTo(1.05, 10);
    expect(potentialMult(16).toNumber()).toBeCloseTo(1 + 0.05 * 8, 10);
  });

  it('Brutzeit wächst mit jeder Zucht', () => {
    expect(breedingSeconds(0)).toBe(BALANCING.breeding.baseSeconds);
    expect(breedingSeconds(2)).toBeCloseTo(BALANCING.breeding.baseSeconds * 1.5625, 8);
  });

  it('braucht zwei Fänge und einen freien Platz', () => {
    const state = createInitialState(0);
    addCatch(state, 'art_001');
    expect(canBreed(state, 'art_001')).toBe(false);
    addCatch(state, 'art_001');
    addCatch(state, 'art_002');
    addCatch(state, 'art_002');
    expect(breedingSlots(state)).toHaveLength(1);
    expect(startBreeding(state, 'art_001')).toBe(true);
    expect(canBreed(state, 'art_001')).toBe(false);
    expect(canBreed(state, 'art_002')).toBe(false);
    state.dmUpgrades = { brutplatz: 1 };
    expect(canBreed(state, 'art_002')).toBe(true);
  });

  it('das Ei schlüpft nach der Zeit, auch offline, und stärkt die Art', () => {
    const state = createInitialState(0);
    addCatch(state, 'art_002');
    addCatch(state, 'art_002');
    const before = monsterDps(state, 'art_002').toNumber();
    startBreeding(state, 'art_002');
    updateBreeding(state, 60);
    expect(state.collection.art_002!.bred).toBe(0);
    advance(state, (BALANCING.breeding.baseSeconds + 5) * 1000);
    expect(state.collection.art_002!.bred).toBe(1);
    expect(state.breeding[0]).toBeNull();
    expect(monsterDps(state, 'art_002').toNumber()).toBeCloseTo(before * 1.05, 6);
  });
});
