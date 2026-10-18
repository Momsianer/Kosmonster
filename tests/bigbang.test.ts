import { describe, expect, it } from 'vitest';
import { enemyMaxHp, isPrime } from '../src/core/formulas';
import { advance } from '../src/core/loop';
import { addEnergy, createInitialState, type GameState } from '../src/core/state';
import { BALANCING } from '../src/data/balancing';
import { CHALLENGE_IDS } from '../src/data/challenges';
import { CONSTELLATIONS } from '../src/data/constellations';
import { SPECIES, type MonsterType, type SpeciesId } from '../src/data/monsters';
import { ORIGIN_IDS } from '../src/data/origin';
import { t } from '../src/i18n';
import { runAutomation } from '../src/systems/automation';
import { bigBang, canBigBang, originGain } from '../src/systems/bigbang';
import { abandonChallenge, startChallenge, tideMult, updateChallenge } from '../src/systems/challenges';
import { addCatch } from '../src/systems/catching';
import { clickEnemy, dealDamage, enterZone } from '../src/systems/combat';
import {
  activeConstellations,
  constellationBonus,
  constellationMult,
  discoverConstellations,
} from '../src/systems/constellations';
import { addToTeam, globalDpsMult, levelUp, levelUpCost, teamSlots } from '../src/systems/monsters';
import { buyOrigin, canBuyOrigin, originCost } from '../src/systems/origin';
import { canSupernova, stardustGain, supernovaZone } from '../src/systems/prestige';
import { buyModule, totalProduction } from '../src/systems/station';
import { startTheorem, theoremAvailable, theoremHp, updateTheorem } from '../src/systems/theorem';
import { D } from '../src/util/decimal';

const INF = BALANCING.bigBang.infinityEnergy;

function firstOf(type: MonsterType): SpeciesId {
  return SPECIES.find((s) => s.type === type && s.rarity !== 'legendary')!.id;
}

function afterBigBang(): GameState {
  const state = createInitialState(0, 3);
  state.bigBangs = 1;
  return state;
}

describe('Unendlichkeit und Urknall', () => {
  it('Energie ist bis zum ersten Urknall bei Unendlichkeit gedeckelt', () => {
    const state = createInitialState(0);
    addEnergy(state, D(INF).mul(10));
    expect(state.energy.eq(INF)).toBe(true);
    expect(state.cycleEnergy.eq(INF)).toBe(true);
    expect(state.totalEnergy.gt(INF)).toBe(true);
    state.bigBangs = 1;
    addEnergy(state, D(INF));
    expect(state.energy.gt(INF)).toBe(true);
  });

  it('Urknall erst bei Unendlichkeit, nicht während einer Challenge', () => {
    const state = createInitialState(0);
    expect(canBigBang(state)).toBe(false);
    addEnergy(state, D(INF));
    expect(canBigBang(state)).toBe(true);
    state.challenge.active = 'entropie';
    expect(canBigBang(state)).toBe(false);
  });

  it('ursprungspunkte = 1 + abgeschlossene Challenges', () => {
    const state = createInitialState(0);
    expect(originGain(state).toNumber()).toBe(1);
    state.challenge.completed = ['entropie', 'monokultur'];
    expect(originGain(state).toNumber()).toBe(3);
  });

  it('setzt fast alles zurück und behält Sammlung und Ursprung', () => {
    const state = createInitialState(0, 5);
    addCatch(state, 'art_001');
    state.collection.art_001!.evolution = 1;
    state.stardust = D(500);
    state.research = { klickkraft: 3 };
    state.darkMatter = D(7);
    state.darkMatterTotal = D(9);
    state.dmUpgrades = { autoklicker: 2, teamplaetze: 1 };
    state.originUpgrades = { urkraft: 1 };
    addEnergy(state, D(INF));
    expect(bigBang(state)).toBe(true);
    expect(state.bigBangs).toBe(1);
    expect(state.originPoints.toNumber()).toBe(1);
    expect(state.stardust.eq(0)).toBe(true);
    expect(state.research).toEqual({});
    expect(state.darkMatter.eq(0)).toBe(true);
    expect(state.darkMatterTotal.eq(0)).toBe(true);
    expect(state.dmUpgrades).toEqual({});
    expect(state.energy.eq(BALANCING.world.resetEnergy)).toBe(true);
    expect(state.zone).toBe(1);
    expect(state.collection.art_001).toMatchObject({ evolution: 1, level: 0 });
    expect(state.originUpgrades).toEqual({ urkraft: 1 });
  });

  it('Beständige Maschinen und Urmaterie wirken beim Urknall', () => {
    const state = createInitialState(0);
    state.dmUpgrades = { autoklicker: 2, autolevel: 1, teamplaetze: 2 };
    state.originUpgrades = { automatikBehalten: 1, urmaterie: 2 };
    addEnergy(state, D(INF));
    bigBang(state);
    expect(state.dmUpgrades).toEqual({ autoklicker: 2, autolevel: 1 });
    expect(state.darkMatter.toNumber()).toBe(4);
  });
});

describe('Ursprungsupgrades', () => {
  it('haben Balancingwerte, Namen und Beschreibung', () => {
    for (const id of ORIGIN_IDS) {
      expect(BALANCING.origin.upgrades[id].maxLevel).toBeGreaterThan(0);
      expect(t(`origin.${id}.name`)).not.toBe(`origin.${id}.name`);
      expect(t(`origin.${id}.description`)).not.toBe(`origin.${id}.description`);
    }
  });

  it('kosten basis * 2^stufe Ursprungspunkte', () => {
    const state = createInitialState(0);
    state.originPoints = D(3);
    expect(originCost('urkraft', 1).toNumber()).toBe(2);
    expect(buyOrigin(state, 'urkraft')).toBe(true);
    expect(buyOrigin(state, 'urkraft')).toBe(true);
    expect(state.originPoints.toNumber()).toBe(0);
    expect(canBuyOrigin(state, 'urkraft')).toBe(false);
  });

  it('Urkraft, Urproduktion, Sternenquelle und Frühe Supernova wirken', () => {
    const state = createInitialState(0);
    state.modules = { asteroidenbohrer: 10 };
    state.highestZone = 50;
    state.cycleEnergy = D(1e13);
    const dps = globalDpsMult(state).toNumber();
    const production = totalProduction(state).toNumber();
    const stardust = stardustGain(state).toNumber();
    expect(canSupernova(state)).toBe(false);
    state.originUpgrades = { urkraft: 2, urproduktion: 1, sternenquelle: 2, fruehesupernova: 2 };
    expect(globalDpsMult(state).toNumber()).toBeCloseTo(dps * 3, 8);
    expect(totalProduction(state).toNumber()).toBeCloseTo(production * 2, 8);
    expect(stardustGain(state).toNumber()).toBe(Math.floor(stardust * 2));
    expect(supernovaZone(state)).toBe(BALANCING.supernova.minZone - 10);
    expect(canSupernova(state)).toBe(true);
  });

  it('Autoschwarzloch öffnet beim Zielwert ein Schwarzes Loch', () => {
    const state = createInitialState(0);
    state.originPoints = D(10);
    buyOrigin(state, 'autoschwarzloch');
    expect(state.automation.enabled.autoschwarzloch).toBe(true);
    state.stardustCycle = D(BALANCING.blackHole.minStardust * 1000);
    state.automation.blackHoleTarget = 1;
    runAutomation(state, 1);
    expect(state.blackHoles).toBe(1);
  });
});

describe('Challenges', () => {
  it('jede Challenge hat Werte, Namen und Beschreibung', () => {
    expect(CHALLENGE_IDS).toHaveLength(12);
    for (const id of CHALLENGE_IDS) {
      expect(BALANCING.challenges[id].goalZone).toBeGreaterThan(0);
      expect(t(`challenge.${id}.name`)).not.toBe(`challenge.${id}.name`);
    }
  });

  it('Start erst nach dem ersten Urknall, setzt zurück, Abbrechen beendet', () => {
    const state = createInitialState(0);
    expect(startChallenge(state, 'entropie')).toBe(false);
    state.bigBangs = 1;
    state.stardust = D(100);
    enterZone(state, 30);
    expect(startChallenge(state, 'entropie')).toBe(true);
    expect(state.challenge.active).toBe('entropie');
    expect(state.zone).toBe(1);
    expect(state.stardust.eq(0)).toBe(true);
    expect(startChallenge(state, 'monokultur')).toBe(false);
    expect(abandonChallenge(state)).toBe(true);
    expect(state.challenge.active).toBeNull();
  });

  it('Zielzone schließt ab, gibt Ursprungspunkte nur beim ersten Mal und dauerhaften Bonus', () => {
    const state = afterBigBang();
    startChallenge(state, 'stilleHaende');
    const dps = globalDpsMult(state).toNumber();
    state.highestZone = BALANCING.challenges.stilleHaende.goalZone;
    updateChallenge(state, 1);
    expect(state.challenge.completed).toEqual(['stilleHaende']);
    expect(state.challenge.active).toBeNull();
    expect(state.originPoints.toNumber()).toBe(BALANCING.challenges.stilleHaende.reward);
    expect(globalDpsMult(state).toNumber()).toBeCloseTo(dps * 1.5, 8);
    startChallenge(state, 'stilleHaende');
    state.highestZone = 99;
    updateChallenge(state, 1);
    expect(state.originPoints.toNumber()).toBe(BALANCING.challenges.stilleHaende.reward);
  });

  it('nach dem Reset reicht die Startenergie für ein erstes Level, auch ohne Klicks', () => {
    const state = afterBigBang();
    addCatch(state, 'art_001');
    startChallenge(state, 'stilleHaende');
    expect(state.collection.art_001!.level).toBe(0);
    expect(levelUp(state, 'art_001', 1)).toBe(1);
    advance(state, 60 * 1000);
    expect(state.enemiesDefeated).toBeGreaterThan(0);
  });

  it('Stille Hände: kein Klick', () => {
    const state = afterBigBang();
    startChallenge(state, 'stilleHaende');
    const hp = state.enemy.hp;
    expect(clickEnemy(state)).toBe(false);
    expect(state.enemy.hp.eq(hp)).toBe(true);
  });

  it('Quadratisches Wachstum: Kosten mit r^(n²)', () => {
    const state = afterBigBang();
    addCatch(state, 'art_001');
    startChallenge(state, 'quadratisch');
    state.collection.art_001!.level = 3;
    const r = BALANCING.monster.levelCostGrowth;
    const base = SPECIES[0]!.baseCost;
    expect(levelUpCost(state, 'art_001', 2).cost.toNumber()).toBeCloseTo(base * (r ** 9 + r ** 16), 6);
    state.energy = D(1e3);
    expect(levelUp(state, 'art_001', 'max')).toBeGreaterThan(0);
  });

  it('Einzelgänger: ein Teamplatz', () => {
    const state = afterBigBang();
    startChallenge(state, 'einzelgaenger');
    expect(teamSlots(state)).toBe(1);
  });

  it('Leeres Universum: keine Produktion, keine Module', () => {
    const state = afterBigBang();
    state.modules = { asteroidenbohrer: 5 };
    startChallenge(state, 'leeresUniversum');
    state.modules = { asteroidenbohrer: 5 };
    expect(totalProduction(state).toNumber()).toBe(0);
    state.energy = D(1e6);
    expect(buyModule(state, 'solarpanel', 1)).toBe(0);
  });

  it('Primzahlwelt: ein Zehntel Schaden außerhalb von Primzahlzonen', () => {
    const state = afterBigBang();
    startChallenge(state, 'primzahlwelt');
    enterZone(state, 8);
    expect(isPrime(8)).toBe(false);
    const hp = state.enemy.hp;
    clickEnemy(state);
    expect(hp.sub(state.enemy.hp).toNumber()).toBeCloseTo(0.1, 8);
  });

  it('Gezeitensperre: Produktion halbiert sich, Bosssieg setzt zurück', () => {
    const state = afterBigBang();
    startChallenge(state, 'gezeitensperre');
    expect(tideMult(state)).toBe(1);
    state.playTime += 125;
    expect(tideMult(state)).toBe(0.25);
    enterZone(state, 5);
    dealDamage(state, state.enemy.hp);
    expect(tideMult(state)).toBe(1);
  });

  it('Monokultur: nur ein Typ im Team', () => {
    const state = afterBigBang();
    startChallenge(state, 'monokultur');
    state.team = [];
    addCatch(state, 'art_001');
    addCatch(state, 'art_002');
    addCatch(state, 'art_003');
    expect(state.team).toEqual(['art_001', 'art_003']);
    expect(addToTeam(state, 'art_002')).toBe(false);
  });

  it('Teilbarkeit: Gegnerleben ×1000 außerhalb von Vielfachen von 3', () => {
    const state = afterBigBang();
    startChallenge(state, 'teilbarkeit');
    enterZone(state, 4);
    expect(state.enemy.maxHp.eq(enemyMaxHp(4).mul(1000))).toBe(true);
    enterZone(state, 6);
    expect(state.enemy.maxHp.eq(enemyMaxHp(6))).toBe(true);
  });

  it('Entropie: Level sinken langsam, mindestens Level 1', () => {
    const state = afterBigBang();
    addCatch(state, 'art_001');
    startChallenge(state, 'entropie');
    state.collection.art_001!.level = 3;
    updateChallenge(state, BALANCING.challengeRules.entropySeconds * 5);
    expect(state.collection.art_001!.level).toBe(1);
  });

  it('Ohne Gedächtnis: Forschung wirkt nicht', () => {
    const state = afterBigBang();
    startChallenge(state, 'ohneGedaechtnis');
    state.research = { teamplatz: 3, teamstaerke: 4, klickkraft: 1, fangglueck: 1, sphaerenrabatt: 1 };
    expect(teamSlots(state)).toBe(BALANCING.monster.teamSlots);
  });

  it('Lichtgeschwindigkeit: Zeitlimit beendet die Challenge ohne Abschluss', () => {
    const state = afterBigBang();
    startChallenge(state, 'lichtgeschwindigkeit');
    state.playTime += BALANCING.challengeRules.lightSpeedSeconds + 1;
    updateChallenge(state, 1);
    expect(state.challenge.active).toBeNull();
    expect(state.challenge.completed).toEqual([]);
  });

  it('Der Beweis: Einschränkungen 1 bis 4 gleichzeitig', () => {
    const state = afterBigBang();
    startChallenge(state, 'derBeweis');
    expect(clickEnemy(state)).toBe(false);
    expect(teamSlots(state)).toBe(1);
    state.modules = { solarpanel: 3 };
    expect(totalProduction(state).toNumber()).toBe(0);
  });
});

describe('Konstellationen', () => {
  it('24 Konstellationen mit Namen und Hinweis', () => {
    expect(CONSTELLATIONS).toHaveLength(24);
    expect(CONSTELLATIONS.filter((c) => !c.hidden)).toHaveLength(8);
    for (const c of CONSTELLATIONS) {
      expect(t(`constellation.${c.id}.name`)).not.toBe(`constellation.${c.id}.name`);
      expect(t(`constellation.${c.id}.hint`)).not.toBe(`constellation.${c.id}.hint`);
    }
  });

  it('wirken erst ab dem ersten Urknall', () => {
    const state = createInitialState(0);
    state.team = [firstOf('fibonacci'), firstOf('euler')];
    expect(activeConstellations(state)).toEqual([]);
    state.bigBangs = 1;
    expect(activeConstellations(state)).toContain('goldenerSchnitt');
  });

  it('Eulersche Identität und Primzwillinge', () => {
    const state = afterBigBang();
    state.team = [firstOf('euler'), firstOf('pi'), firstOf('null'), firstOf('unendlich')];
    expect(activeConstellations(state)).toContain('eulerscheIdentitaet');
    state.team = ['art_001', 'art_003'];
    expect(activeConstellations(state)).toEqual(['primzwillinge']);
  });

  it('Bonus stapelt sich, Sternbilder verstärken', () => {
    const state = afterBigBang();
    state.team = ['art_001', 'art_003', 'art_005'];
    expect(activeConstellations(state)).toEqual(['trio_prim']);
    expect(constellationMult(state).toNumber()).toBeCloseTo(BALANCING.constellations.simpleMult, 10);
    state.originUpgrades = { sternbilder: 4 };
    expect(constellationBonus(state, false)).toBeCloseTo(1 + 0.25 * 2, 10);
  });

  it('aktive Konstellationen werden entdeckt und bleiben entdeckt', () => {
    const state = afterBigBang();
    state.team = [firstOf('pi'), firstOf('fibonacci')];
    expect(discoverConstellations(state)).toEqual(['kreisUndSpirale']);
    state.team = [];
    expect(discoverConstellations(state)).toEqual([]);
    expect(state.constellationsFound).toEqual(['kreisUndSpirale']);
  });
});

describe('Story', () => {
  it('der erste Sieg über einen Systemboss schaltet einen Eintrag frei', () => {
    const state = createInitialState(0);
    enterZone(state, 10);
    dealDamage(state, state.enemy.hp);
    expect(state.storySeen).toEqual([1]);
    enterZone(state, 5);
    dealDamage(state, state.enemy.hp);
    expect(state.storySeen).toEqual([1]);
    expect(t('story.s1')).not.toBe('story.s1');
  });
});

describe('Das Theorem', () => {
  it('erscheint nach allen 12 Challenges', () => {
    const state = afterBigBang();
    expect(theoremAvailable(state)).toBe(false);
    expect(startTheorem(state)).toBe(false);
    state.challenge.completed = [...CHALLENGE_IDS];
    expect(startTheorem(state)).toBe(true);
    expect(state.theorem!.maxHp.eq(theoremHp())).toBe(true);
  });

  it('Schaden trifft das Theorem, ein Sieg wird gespeichert', () => {
    const state = afterBigBang();
    state.challenge.completed = [...CHALLENGE_IDS];
    startTheorem(state);
    const enemyHp = state.enemy.hp;
    dealDamage(state, theoremHp().div(2));
    expect(state.enemy.hp.eq(enemyHp)).toBe(true);
    expect(state.theorem!.hp.eq(theoremHp().div(2))).toBe(true);
    dealDamage(state, theoremHp());
    expect(state.theorem).toBeNull();
    expect(state.theoremDefeated).toBe(true);
  });

  it('läuft die Zeit ab, endet der Kampf ohne Sieg', () => {
    const state = afterBigBang();
    state.challenge.completed = [...CHALLENGE_IDS];
    startTheorem(state);
    updateTheorem(state, BALANCING.theorem.timeLimitSeconds + 1);
    expect(state.theorem).toBeNull();
    expect(state.theoremDefeated).toBe(false);
  });

  it('läuft in der Tickschleife', () => {
    const state = afterBigBang();
    state.challenge.completed = [...CHALLENGE_IDS];
    startTheorem(state);
    advance(state, (BALANCING.theorem.timeLimitSeconds + 2) * 1000);
    expect(state.theorem).toBeNull();
  });
});
