import { describe, expect, it } from 'vitest';
import { enemyMaxHp } from '../src/core/formulas';
import { catchUp } from '../src/core/loop';
import { createInitialState, type GameState } from '../src/core/state';
import { BALANCING } from '../src/data/balancing';
import { getSpecies } from '../src/data/monsters';
import { RESEARCH_IDS, RESEARCH_TREE, researchPrerequisite } from '../src/data/research';
import { t } from '../src/i18n';
import { addCatch, currentSphereCost, tryCatch } from '../src/systems/catching';
import { clickEnemy, enterZone } from '../src/systems/combat';
import { canEvolve, evolutionCost, evolutionLevel, evolutionMult, evolve } from '../src/systems/evolution';
import { monsterDps, teamDps, teamSlots } from '../src/systems/monsters';
import { canSupernova, stardustBonus, stardustFor, stardustGain, supernova } from '../src/systems/prestige';
import {
  bossTimeLimit,
  buyResearch,
  canBuyResearch,
  clickBonus,
  isResearchAvailable,
  offlineLimitSeconds,
  researchCost,
} from '../src/systems/research';
import { buyModule, moduleBuyCost, totalProduction } from '../src/systems/station';
import { D } from '../src/util/decimal';

const SN = BALANCING.supernova;

function readyForSupernova(): GameState {
  const state = createInitialState(0, 11);
  addCatch(state, 'art_001');
  addCatch(state, 'art_002');
  state.collection.art_001!.level = 150;
  state.modules = { solarpanel: 30 };
  state.energy = D(5e12);
  state.cycleEnergy = D(4e12);
  state.totalEnergy = D(4e12);
  enterZone(state, SN.minZone);
  return state;
}

describe('Sternenstaub', () => {
  it('floor( (zyklusEnergie / 1e9)^0,5 )', () => {
    expect(stardustFor(D(0)).toNumber()).toBe(0);
    expect(stardustFor(D(9e8)).toNumber()).toBe(0);
    expect(stardustFor(D(1e9)).toNumber()).toBe(1);
    expect(stardustFor(D(4e12)).toNumber()).toBe(63);
    expect(stardustFor(D(1e13)).toNumber()).toBe(100);
  });

  it('passiver Bonus ×(1 + 0,02 * unausgegebenerSternenstaub)', () => {
    const state = createInitialState(0);
    state.stardust = D(50);
    expect(stardustBonus(state).toNumber()).toBeCloseTo(1 + SN.bonusPerStardust * 50, 10);
  });

  it('der Bonus wirkt auf Team DPS und Produktion', () => {
    const state = createInitialState(0);
    addCatch(state, 'art_001');
    state.modules = { asteroidenbohrer: 10 };
    enterZone(state, 4);
    const dps = monsterDps(state, 'art_001');
    const production = totalProduction(state);
    state.stardust = D(100);
    expect(monsterDps(state, 'art_001').toNumber()).toBeCloseTo(dps.toNumber() * 3, 8);
    expect(totalProduction(state).toNumber()).toBeCloseTo(production.toNumber() * 3, 8);
  });
});

describe('Supernova', () => {
  it('erst ab Zone 60', () => {
    const state = readyForSupernova();
    expect(canSupernova(state)).toBe(true);
    state.highestZone = SN.minZone - 1;
    expect(canSupernova(state)).toBe(false);
    expect(supernova(state)).toBe(false);
  });

  it('gibt Sternenstaub und setzt Energie, Zone, Level und Module zurück', () => {
    const state = readyForSupernova();
    const gain = stardustGain(state);
    expect(supernova(state)).toBe(true);
    expect(state.stardust.eq(gain)).toBe(true);
    expect(state.supernovas).toBe(1);
    expect(state.energy.eq(0)).toBe(true);
    expect(state.cycleEnergy.eq(0)).toBe(true);
    expect(state.zone).toBe(1);
    expect(state.highestZone).toBe(1);
    expect(state.modules).toEqual({});
    expect(state.collection.art_001!.level).toBe(1);
    expect(state.enemy.maxHp.eq(enemyMaxHp(1))).toBe(true);
  });

  it('behält Sammlung, Team, Sphären, Forschung und Gesamtenergie', () => {
    const state = readyForSupernova();
    state.research = { klickkraft: 2 };
    state.spheres = 7;
    supernova(state);
    expect(Object.keys(state.collection)).toEqual(['art_001', 'art_002']);
    expect(state.team).toEqual(['art_001', 'art_002']);
    expect(state.spheres).toBe(7);
    expect(state.research).toEqual({ klickkraft: 2 });
    expect(state.totalEnergy.toNumber()).toBe(4e12);
  });

  it('Forschung Startzone und Startsphären wirken nach der Supernova', () => {
    const state = readyForSupernova();
    state.research = { offlinebonus: 1, offlinelimit: 1, startzone: 2, fangglueck: 1, sphaerenrabatt: 1, teamplatz: 1, startsphaeren: 1 };
    const spheres = state.spheres;
    supernova(state);
    expect(state.zone).toBe(1 + 2 * BALANCING.research.nodes.startzone.perLevel);
    expect(state.spheres).toBe(spheres + BALANCING.research.nodes.startsphaeren.perLevel);
  });
});

describe('Forschungsbaum', () => {
  it('jeder Knoten hat Balancingwerte, Namen und Beschreibung', () => {
    expect(RESEARCH_IDS).toHaveLength(16);
    for (const id of RESEARCH_IDS) {
      expect(BALANCING.research.nodes[id].maxLevel).toBeGreaterThan(0);
      expect(t(`research.${id}.name`)).not.toBe(`research.${id}.name`);
      expect(t(`research.${id}.description`)).not.toBe(`research.${id}.description`);
    }
    expect(Object.values(RESEARCH_TREE).flat().sort()).toEqual([...RESEARCH_IDS].sort());
  });

  it('kosten = basis * 3^stufe', () => {
    expect(researchCost('klickkraft', 0).toNumber()).toBe(1);
    expect(researchCost('klickkraft', 3).toNumber()).toBe(27);
    expect(researchCost('teamplatz', 2).toNumber()).toBe(25 * 9);
  });

  it('der vorige Knoten im Ast ist Voraussetzung', () => {
    const state = createInitialState(0);
    state.stardust = D(1000);
    expect(researchPrerequisite('klickkraft')).toBeNull();
    expect(researchPrerequisite('teamstaerke')).toBe('klickkraft');
    expect(isResearchAvailable(state, 'teamstaerke')).toBe(false);
    expect(buyResearch(state, 'teamstaerke')).toBe(false);
    expect(buyResearch(state, 'klickkraft')).toBe(true);
    expect(isResearchAvailable(state, 'teamstaerke')).toBe(true);
  });

  it('kostet Sternenstaub und endet bei der Höchststufe', () => {
    const state = createInitialState(0);
    state.stardust = D(1e9);
    const max = BALANCING.research.nodes.teamplatz.maxLevel;
    state.research = { fangglueck: 1, sphaerenrabatt: 1 };
    for (let i = 0; i < max; i++) expect(buyResearch(state, 'teamplatz')).toBe(true);
    expect(canBuyResearch(state, 'teamplatz')).toBe(false);
    expect(state.research.teamplatz).toBe(max);
    const fresh = createInitialState(0);
    expect(buyResearch(fresh, 'klickkraft')).toBe(false);
  });

  it('Wirkungen: Klickbonus, Teamplätze, Bosszeit, Offlinelimit', () => {
    const state = createInitialState(0);
    state.research = { klickkraft: 3, teamplatz: 2, bosszeit: 2, offlinelimit: 1 };
    expect(clickBonus(state)).toBe(BALANCING.click.baseClickBonus + 3);
    expect(teamSlots(state)).toBe(BALANCING.monster.teamSlots + 2);
    expect(bossTimeLimit(state)).toBe(BALANCING.boss.timeLimitSeconds + 6);
    expect(offlineLimitSeconds(state)).toBe(BALANCING.offline.maxSeconds + 3600);
    enterZone(state, 5);
    expect(state.bossTimeLeft).toBe(BALANCING.boss.timeLimitSeconds + 6);
  });

  it('Wirkungen: Teamstärke, Produktion, Umwandlung', () => {
    const state = createInitialState(0);
    addCatch(state, 'art_001');
    state.modules = { asteroidenbohrer: 10 };
    enterZone(state, 4);
    const dps = monsterDps(state, 'art_001').toNumber();
    const production = totalProduction(state).toNumber();
    state.research = { teamstaerke: 4, produktion: 2, umwandlung: 1 };
    expect(monsterDps(state, 'art_001').toNumber()).toBeCloseTo(dps * 2, 8);
    expect(totalProduction(state).toNumber()).toBeCloseTo(production * 1.5, 8);
    expect(teamDps(state).toNumber()).toBeCloseTo(dps * 2 + production * 1.5 * 0.01, 8);
  });

  it('Wirkungen: Rabatte auf Sphären und Module', () => {
    const state = createInitialState(0);
    const sphere = currentSphereCost(state).toNumber();
    const module = moduleBuyCost(state, 'solarpanel', 1).cost.toNumber();
    state.research = { sphaerenrabatt: 2, modulrabatt: 5 };
    expect(currentSphereCost(state).toNumber()).toBeCloseTo(sphere * 0.9, 8);
    expect(moduleBuyCost(state, 'solarpanel', 1).cost.toNumber()).toBeCloseTo(module * 0.85, 8);
    state.energy = D(module * 0.85);
    expect(buyModule(state, 'solarpanel', 1)).toBe(1);
  });

  it('Wirkung: Fangglück erhöht die Fangquote', () => {
    const state = createInitialState(0, 5);
    state.settings.catchOnlyNew = false;
    state.research = { fangglueck: 10 };
    let caught = 0;
    state.spheres = 4000;
    for (let i = 0; i < 4000; i++) if (tryCatch(state, 'art_001')) caught += 1;
    expect(caught / 4000).toBeCloseTo(BALANCING.rarity.common.catchChance * 2, 1);
  });

  it('Wirkung: kritische Klicks', () => {
    const state = createInitialState(0, 3);
    enterZone(state, 30);
    state.research = { kritchance: 10, kritschaden: 2 };
    let crits = 0;
    for (let i = 0; i < 2000; i++) {
      const before = state.enemy.hp;
      clickEnemy(state);
      if (before.sub(state.enemy.hp).gt(1)) crits += 1;
    }
    expect(crits / 2000).toBeCloseTo(0.2, 1);
  });

  it('Wirkung: Offlinebonus nach längerer Pause', () => {
    const a = createInitialState(0);
    const b = createInitialState(0);
    a.modules = { asteroidenbohrer: 10 };
    b.modules = { asteroidenbohrer: 10 };
    b.research = { offlinebonus: 5 };
    const plain = catchUp(a, 3600 * 1000);
    const boosted = catchUp(b, 3600 * 1000);
    expect(boosted.energy.toNumber()).toBeCloseTo(plain.energy.toNumber() * 1.5, 4);
    expect(b.energy.toNumber()).toBeCloseTo(boosted.energy.toNumber(), 4);
  });
});

describe('Evolution', () => {
  it('Kosten wachsen mit der Artnummer', () => {
    const [first, second] = BALANCING.evolution.costs;
    const g = BALANCING.evolution.costGrowthPerSpecies;
    expect(evolutionCost(1, 0)!.toNumber()).toBe(first);
    expect(evolutionCost(3, 1)!.toNumber()).toBeCloseTo(second! * g ** 2, 8);
    expect(evolutionCost(1, 2)).toBeNull();
    expect(evolutionLevel(0)).toBe(100);
    expect(evolutionLevel(1)).toBe(500);
    expect(evolutionMult(2).toNumber()).toBe(25);
  });

  it('ab Level 100 gegen Sternenstaub, basisDPS ×5', () => {
    const state = createInitialState(0);
    addCatch(state, 'art_001');
    enterZone(state, 4);
    state.stardust = D(1000);
    state.collection.art_001!.level = 99;
    expect(canEvolve(state, 'art_001')).toBe(false);
    state.collection.art_001!.level = 100;
    const before = monsterDps(state, 'art_001');
    const stardust = state.stardust;
    expect(evolve(state, 'art_001')).toBe(true);
    expect(state.collection.art_001!.evolution).toBe(1);
    expect(state.stardust.toNumber()).toBeCloseTo(stardust.toNumber() - evolutionCost(1, 0)!.toNumber(), 8);
    // weniger Sternenstaub senkt auch den passiven Bonus, daher Basiswert vergleichen
    const ratio = monsterDps(state, 'art_001').div(stardustBonus(state)).div(before.div(D(1).add(stardust.mul(0.02))));
    expect(ratio.toNumber()).toBeCloseTo(BALANCING.evolution.dpsMult, 8);
  });

  it('zweite Stufe nur für manche Arten ab Level 500', () => {
    const state = createInitialState(0);
    addCatch(state, 'art_001');
    addCatch(state, 'art_003');
    state.stardust = D(1e6);
    state.collection.art_001!.level = 600;
    state.collection.art_003!.level = 600;
    evolve(state, 'art_001');
    evolve(state, 'art_003');
    expect(getSpecies('art_001')!.evolutions).toBe(1);
    expect(evolve(state, 'art_001')).toBe(false);
    expect(evolve(state, 'art_003')).toBe(true);
    expect(state.collection.art_003!.evolution).toBe(2);
  });

  it('bleibt über die Supernova erhalten', () => {
    const state = readyForSupernova();
    state.stardust = D(100);
    evolve(state, 'art_001');
    supernova(state);
    expect(state.collection.art_001!.evolution).toBe(1);
    expect(state.collection.art_001!.level).toBe(1);
  });
});
