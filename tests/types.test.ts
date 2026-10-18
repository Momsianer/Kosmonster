import { describe, expect, it } from 'vitest';
import {
  copiesForStar,
  enemyMaxHp,
  eulerMult,
  fractalMult,
  infinityMult,
  planetMult,
  starProgress,
  starsFor,
  starsMult,
} from '../src/core/formulas';
import { catchUp } from '../src/core/loop';
import { createInitialState, type GameState } from '../src/core/state';
import { BALANCING } from '../src/data/balancing';
import { getSpecies, MONSTER_TYPES, SPECIES, type SpeciesId } from '../src/data/monsters';
import { planetForSystem, planetForZone } from '../src/data/planets';
import { t } from '../src/i18n';
import {
  addCatch,
  buySpheres,
  chooseSphere,
  currentSphereCost,
  isSphereUnlocked,
  totalSpheres,
  tryCatch,
} from '../src/systems/catching';
import { clickEnemy, dealDamage, enterZone } from '../src/systems/combat';
import { monsterDps, speciesStars, teamDps, typeMult } from '../src/systems/monsters';
import { supernova } from '../src/systems/prestige';
import { shinyChance, spawnEnemy } from '../src/systems/spawning';
import { D } from '../src/util/decimal';

/** Erste Art eines Typs */
function firstOf(type: string): SpeciesId {
  return SPECIES.find((s) => s.type === type && s.rarity !== 'legendary')!.id;
}

function stateWith(...ids: SpeciesId[]): GameState {
  const state = createInitialState(0, 21);
  for (const id of ids) addCatch(state, id);
  return state;
}

describe('Typformeln', () => {
  it('Euler: ×(1 + ln(1 + t/60))', () => {
    expect(eulerMult(0).toNumber()).toBe(1);
    expect(eulerMult(60).toNumber()).toBeCloseTo(1 + Math.log(2), 10);
    expect(eulerMult(3600).toNumber()).toBeCloseTo(1 + Math.log(61), 10);
  });

  it('Fraktal: ×1,25^(n − 1)', () => {
    expect(fractalMult(1).toNumber()).toBe(1);
    expect(fractalMult(3).toNumber()).toBeCloseTo(1.5625, 10);
  });

  it('Unendlich: +1 % je Art', () => {
    expect(infinityMult(0).toNumber()).toBe(1);
    expect(infinityMult(40).toNumber()).toBeCloseTo(1.4, 10);
  });

  it('Planet: ×2 gestärkt, ×0,5 geschwächt', () => {
    expect(planetMult('pi', 'pi', 'null').toNumber()).toBe(2);
    expect(planetMult('null', 'pi', 'null').toNumber()).toBe(0.5);
    expect(planetMult('euler', 'pi', 'null').toNumber()).toBe(1);
  });
});

describe('Typfähigkeiten im Spiel', () => {
  it('Euler wächst mit der Zeit seit dem letzten Reset', () => {
    const id = firstOf('euler');
    const state = stateWith(id);
    const start = typeMult(state, id, 1).toNumber();
    state.playTime = 600;
    expect(typeMult(state, id, 1).toNumber()).toBeCloseTo(1 + Math.log(11), 10);
    expect(start).toBe(1);
  });

  it('Null verdoppelt nach einer Minute ohne Klick', () => {
    const id = firstOf('null');
    const state = stateWith(id);
    state.playTime = 30;
    state.lastClick = 0;
    expect(typeMult(state, id, 1).toNumber()).toBe(1);
    state.playTime = BALANCING.types.nullIdleSeconds;
    expect(typeMult(state, id, 1).toNumber()).toBe(BALANCING.types.nullIdleMult);
    clickEnemy(state);
    expect(typeMult(state, id, 1).toNumber()).toBe(1);
  });

  it('Null verdoppelt den Offlineertrag', () => {
    const plain = createInitialState(0);
    const withNull = stateWith(firstOf('null'));
    for (const s of [plain, withNull]) s.modules = { asteroidenbohrer: 10 };
    withNull.team = [firstOf('null')];
    const a = catchUp(plain, 3600 * 1000);
    // Team schadet nicht der Produktion, verglichen wird nur die Energie der Station
    const b = catchUp(withNull, 3600 * 1000);
    expect(b.energy.toNumber()).toBeGreaterThanOrEqual(a.energy.toNumber() * 2 - 1e-6);
  });

  it('Unendlich zählt die Sammlung', () => {
    const id = firstOf('unendlich');
    const state = stateWith(id, 'art_001', 'art_002', 'art_003');
    expect(typeMult(state, id, 1).toNumber()).toBeCloseTo(1.04, 10);
  });

  it('Fraktal wird mit jedem weiteren Fraktal im Team stärker', () => {
    const fractals = SPECIES.filter((s) => s.type === 'fraktal' && s.rarity !== 'legendary').slice(0, 3).map((s) => s.id);
    const state = stateWith(...fractals);
    expect(state.team).toEqual(fractals);
    expect(typeMult(state, fractals[0]!, 1).toNumber()).toBeCloseTo(1.5625, 10);
  });

  it('Vektor ×3 gegen Bosse', () => {
    const id = firstOf('vektor');
    const state = stateWith(id);
    enterZone(state, 4);
    expect(typeMult(state, id, 1).toNumber()).toBe(1);
    enterZone(state, 5);
    expect(typeMult(state, id, 1).toNumber()).toBe(BALANCING.types.vectorBossMult);
  });

  it('Pi erhöht den Klickschaden um π % der Team DPS', () => {
    const pi = firstOf('pi');
    const state = stateWith('art_001', pi);
    state.collection.art_001!.level = 200;
    enterZone(state, 40);
    const dps = teamDps(state);
    const expected = dps.mul(0.01).add(1).add(dps.mul(Math.PI / 100));
    const before = state.enemy.hp;
    clickEnemy(state);
    expect(before.sub(state.enemy.hp).toNumber() / expected.toNumber()).toBeCloseTo(1, 8);
  });
});

describe('Planetentypen', () => {
  it('jedes Sternsystem stärkt einen und schwächt einen anderen Typ', () => {
    for (let s = 1; s <= 50; s++) {
      const planet = planetForSystem(s);
      expect(MONSTER_TYPES).toContain(planet.boosted);
      expect(planet.weakened).not.toBe(planet.boosted);
    }
    expect(planetForZone(1)).toEqual(planetForZone(10));
    expect(planetForZone(11).system).toBe(2);
  });

  it('alle Typen kommen als gestärkter Typ vor und haben Planetennamen', () => {
    const boosted = new Set(Array.from({ length: 8 }, (_, i) => planetForSystem(i + 1).boosted));
    expect(boosted.size).toBe(8);
    for (const type of MONSTER_TYPES) expect(t(`planet.name.${type}`)).not.toBe(`planet.name.${type}`);
  });

  it('wirkt auf die Monster DPS', () => {
    const state = stateWith('art_001');
    enterZone(state, 4);
    const planet = planetForZone(4);
    expect(planet.boosted).toBe('prim');
    const boosted = monsterDps(state, 'art_001').toNumber();
    state.collection.art_001!.level = 1;
    enterZone(state, 14);
    const neutral = planetForZone(14);
    expect(neutral.boosted).not.toBe('prim');
    expect(neutral.weakened).not.toBe('prim');
    expect(monsterDps(state, 'art_001').toNumber()).toBeCloseTo(boosted / 2, 6);
  });
});

describe('Sterne', () => {
  it('kopienFürStern(s) = 5 * 2^(s − 1)', () => {
    expect([1, 2, 3, 4, 5].map(copiesForStar)).toEqual([5, 10, 20, 40, 80]);
  });

  it('Sterne aus Duplikaten, höchstens 5', () => {
    expect(starsFor(0)).toBe(0);
    expect(starsFor(4)).toBe(0);
    expect(starsFor(5)).toBe(1);
    expect(starsFor(14)).toBe(1);
    expect(starsFor(15)).toBe(2);
    expect(starsFor(155)).toBe(5);
    expect(starsFor(10000)).toBe(5);
    expect(starProgress(7)).toEqual({ have: 2, need: 10 });
    expect(starProgress(155)).toBeNull();
  });

  it('sterneMult = 1,5^sterne wirkt auf die DPS', () => {
    expect(starsMult(2).toNumber()).toBe(2.25);
    const state = stateWith('art_002');
    const base = monsterDps(state, 'art_002').toNumber();
    for (let i = 0; i < 5; i++) addCatch(state, 'art_002');
    expect(speciesStars(state, 'art_002')).toBe(1);
    expect(monsterDps(state, 'art_002').toNumber()).toBeCloseTo(base * 1.5, 8);
  });
});

describe('Polarsterne', () => {
  it('Chance 1/8192 pro Begegnung, Forschung erhöht sie', () => {
    const state = createInitialState(0);
    expect(shinyChance(state)).toBeCloseTo(1 / 8192, 12);
    state.research = { polarstern: 2 };
    expect(shinyChance(state)).toBeCloseTo(2 / 8192, 12);
  });

  it('erscheinen etwa so oft wie erwartet', () => {
    const state = createInitialState(0, 77);
    state.research = { polarstern: 10 };
    let shinies = 0;
    for (let i = 0; i < 60000; i++) if (spawnEnemy(state, 3).shiny) shinies += 1;
    expect(shinies / 60000).toBeCloseTo(6 / 8192, 3);
  });

  it('ein gefangener Polarstern gibt ×2 und zählt als Kopie', () => {
    const state = stateWith('art_002');
    const base = monsterDps(state, 'art_002').toNumber();
    addCatch(state, 'art_002', true);
    expect(state.collection.art_002!.shiny).toBe(true);
    expect(state.collection.art_002!.caught).toBe(2);
    expect(monsterDps(state, 'art_002').toNumber()).toBeCloseTo(base * BALANCING.shiny.mult, 8);
  });

  it('„Nur neue Arten“ fängt neue Polarsterne trotzdem', () => {
    const state = stateWith('art_001');
    state.settings.catchOnlyNew = true;
    state.spheres.standard = 1;
    tryCatch(state, 'art_001', true);
    expect(state.spheres.standard).toBe(0);
  });
});

describe('Sphärentypen', () => {
  it('Preise steigen mit dem Typ', () => {
    const state = createInitialState(0);
    expect(currentSphereCost(state, 'standard').toNumber()).toBe(BALANCING.spheres.standard.basePrice);
    expect(currentSphereCost(state, 'orbit').toNumber()).toBe(BALANCING.spheres.orbit.basePrice);
    expect(currentSphereCost(state, 'nebel').toNumber()).toBeGreaterThan(BALANCING.spheres.orbit.basePrice);
    state.energy = D(1e6);
    expect(buySpheres(state, 2, 'nebel')).toBe(true);
    expect(state.spheres.nebel).toBe(2);
    expect(totalSpheres(state)).toBe(BALANCING.catching.startSpheres + 2);
    expect(state.spherePressure.nebel).toBe(2);
    expect(state.spherePressure.standard).toBe(0);
  });

  it('Singularitätssphären erst nach der Forschung kaufbar', () => {
    const state = createInitialState(0);
    state.energy = D(1e9);
    expect(isSphereUnlocked(state, 'nebel')).toBe(true);
    expect(isSphereUnlocked(state, 'singularitaet')).toBe(false);
    expect(buySpheres(state, 1, 'singularitaet')).toBe(false);
    state.research.singularitaet = 1;
    expect(isSphereUnlocked(state, 'singularitaet')).toBe(true);
    expect(buySpheres(state, 1, 'singularitaet')).toBe(true);
    expect(state.spheres.singularitaet).toBe(1);
  });

  it('seltene Arten bekommen die beste Sphäre, häufige nur Standardsphären', () => {
    const state = createInitialState(0);
    state.spheres = { standard: 3, orbit: 2, nebel: 0, singularitaet: 1 };
    expect(chooseSphere(state, 'common')).toBe('standard');
    expect(chooseSphere(state, 'rare')).toBe('singularitaet');
    state.spheres = { standard: 0, orbit: 2, nebel: 0, singularitaet: 0 };
    expect(chooseSphere(state, 'common')).toBeNull();
    expect(chooseSphere(state, 'uncommon')).toBeNull();
    expect(chooseSphere(state, 'rare')).toBe('orbit');
    state.spheres = { standard: 0, orbit: 0, nebel: 0, singularitaet: 0 };
    expect(chooseSphere(state, 'epic')).toBeNull();
  });

  it('bessere Sphären fangen öfter', () => {
    const rare = SPECIES.find((s) => s.rarity === 'rare')!.id;
    const state = createInitialState(0, 8);
    state.settings.catchOnlyNew = false;
    state.spheres = { standard: 0, orbit: 0, nebel: 0, singularitaet: 4000 };
    let caught = 0;
    for (let i = 0; i < 4000; i++) if (tryCatch(state, rare)) caught += 1;
    expect(caught / 4000).toBeCloseTo(BALANCING.rarity.rare.catchChance * 5, 1);
  });
});

describe('Seltenheit und Bossmonster', () => {
  it('Bosszonen haben immer ihr festes Bossmonster mit Bossleben', () => {
    const state = createInitialState(0, 4);
    for (let i = 0; i < 20; i++) {
      const enemy = spawnEnemy(state, 100);
      expect(enemy.speciesId).toBe('boss_020');
      expect(enemy.maxHp.eq(enemyMaxHp(100))).toBe(true);
    }
    expect(spawnEnemy(state, 95).speciesId).toBe('boss_019');
    expect(getSpecies(spawnEnemy(state, 99).speciesId)!.boss).toBeNull();
  });

  it('legendäre Arten erscheinen selten als seltene Art ihres Gebiets', () => {
    const state = createInitialState(0, 4);
    let legendary = 0;
    for (let i = 0; i < 20000; i++) if (getSpecies(spawnEnemy(state, 41).speciesId)!.rarity === 'legendary') legendary += 1;
    expect(legendary / 20000).toBeCloseTo(BALANCING.pools.rareBaseChance, 2);
  });

  it('Bossmonster werden mit der besten Sphäre und sehr kleiner Chance gefangen', () => {
    const state = createInitialState(0, 4);
    state.settings.catchOnlyNew = false;
    state.spheres = { standard: 0, orbit: 0, nebel: 5000, singularitaet: 0 };
    let caught = 0;
    for (let i = 0; i < 5000; i++) if (tryCatch(state, 'boss_020')) caught += 1;
    expect(state.spheres.nebel).toBe(0);
    expect(caught / 5000).toBeLessThan(0.02);
    expect(BALANCING.rarity.boss.catchChance * BALANCING.spheres.nebel.catchMult).toBeCloseTo(0.00625, 8);
  });

  it('Forschung Seltenheitsradar macht seltene Arten häufiger', () => {
    const count = (boost: number) => {
      const state = createInitialState(0, 3);
      state.research = { seltenheit: boost };
      let rare = 0;
      for (let i = 0; i < 20000; i++) if (getSpecies(spawnEnemy(state, 31).speciesId)!.rarity === 'rare') rare += 1;
      return rare;
    };
    expect(count(10)).toBeGreaterThan(count(0) * 2);
  });

  it('Euler beginnt nach einer Supernova von vorn', () => {
    const state = stateWith('art_001');
    state.playTime = 5000;
    state.highestZone = 60;
    state.cycleEnergy = D(1e12);
    supernova(state);
    expect(state.cycleStart).toBe(5000);
  });
});
