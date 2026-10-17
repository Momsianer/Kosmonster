import { describe, expect, it } from 'vitest';
import { bulkCost, clickDamage, enemyMaxHp } from '../src/core/formulas';
import { advance } from '../src/core/loop';
import { createInitialState, type GameState } from '../src/core/state';
import { BALANCING } from '../src/data/balancing';
import { getSpecies, type SpeciesId } from '../src/data/monsters';
import { addCatch, buySpheres, tryCatch } from '../src/systems/catching';
import { clickEnemy, dealDamage, enterZone } from '../src/systems/combat';
import {
  addToTeam,
  levelUp,
  levelUpCost,
  monsterDps,
  removeFromTeam,
  teamDps,
} from '../src/systems/monsters';
import { activeHint, dismissHint } from '../src/systems/unlocks';
import { D } from '../src/util/decimal';

function stateWith(...ids: SpeciesId[]): GameState {
  const state = createInitialState(0, 123);
  for (const id of ids) addCatch(state, id);
  return state;
}

describe('Monster DPS', () => {
  it('Prim macht in Primzahlzonen doppelten Schaden', () => {
    const state = stateWith('art_001');
    enterZone(state, 4);
    const normal = monsterDps(state, 'art_001');
    enterZone(state, 5);
    expect(monsterDps(state, 'art_001').eq(normal.mul(BALANCING.types.primeZoneMult))).toBe(true);
  });

  it('Fibonacci bekommt ×1,5 je Fibonacci Level', () => {
    const state = stateWith('art_002');
    // Level 1: basisDPS 1 * 1 * ×1,5 (Fibonacci Zahl 1)
    expect(monsterDps(state, 'art_002').toNumber()).toBeCloseTo(1.5, 10);
  });

  it('Seltenheit fließt ein', () => {
    const state = stateWith('art_003');
    enterZone(state, 4);
    const s = getSpecies('art_003')!;
    expect(monsterDps(state, 'art_003').toNumber()).toBeCloseTo(s.baseDps * 2, 10);
  });

  it('Team DPS ist die Summe des Teams', () => {
    const state = stateWith('art_001', 'art_002');
    enterZone(state, 4);
    const sum = monsterDps(state, 'art_001').add(monsterDps(state, 'art_002'));
    expect(teamDps(state).eq(sum)).toBe(true);
  });

  it('ohne Fang kein Schaden', () => {
    const state = createInitialState(0);
    expect(monsterDps(state, 'art_001').eq(0)).toBe(true);
    expect(teamDps(state).eq(0)).toBe(true);
  });

  it('Klickschaden wächst mit der Team DPS', () => {
    const state = stateWith('art_001');
    state.collection.art_001!.level = 100;
    enterZone(state, 20);
    const expected = clickDamage(teamDps(state));
    expect(expected.toNumber()).toBeGreaterThan(BALANCING.click.baseDamage);
    const before = state.enemy.hp;
    clickEnemy(state);
    expect(before.sub(state.enemy.hp).toNumber()).toBeCloseTo(expected.toNumber(), 6);
  });
});

describe('Team', () => {
  it('neue Arten kommen ins Team, bis es voll ist', () => {
    const state = stateWith('art_001', 'art_002', 'art_003', 'art_004');
    expect(state.team).toEqual(['art_001', 'art_002', 'art_003']);
    expect(Object.keys(state.collection)).toHaveLength(4);
  });

  it('entfernen und hinzufügen', () => {
    const state = stateWith('art_001', 'art_002', 'art_003', 'art_004');
    expect(addToTeam(state, 'art_004')).toBe(false);
    expect(removeFromTeam(state, 'art_002')).toBe(true);
    expect(addToTeam(state, 'art_004')).toBe(true);
    expect(state.team).toEqual(['art_001', 'art_003', 'art_004']);
  });

  it('nur gefangene Arten, keine doppelten', () => {
    const state = stateWith('art_001');
    expect(addToTeam(state, 'art_005')).toBe(false);
    expect(addToTeam(state, 'art_001')).toBe(false);
    expect(removeFromTeam(state, 'art_005')).toBe(false);
  });

  it('das Team macht in der Tickschleife Schaden', () => {
    const state = stateWith('art_001');
    state.collection.art_001!.level = 50;
    const dps = teamDps(state).toNumber();
    expect(dps).toBeGreaterThan(enemyMaxHp(1).toNumber());
    advance(state, 1000);
    expect(state.enemiesDefeated).toBeGreaterThan(0);
  });
});

describe('Level', () => {
  it('kostet Energie nach levelKosten und erhöht das Level', () => {
    const state = stateWith('art_001');
    const s = getSpecies('art_001')!;
    const cost = bulkCost(s.baseCost, BALANCING.monster.levelCostGrowth, 1, 10);
    state.energy = cost.add(1);
    expect(levelUp(state, 'art_001', 10)).toBe(10);
    expect(state.collection.art_001!.level).toBe(11);
    expect(state.energy.toNumber()).toBeCloseTo(1, 6);
  });

  it('kauft höchstens so viel wie bezahlbar', () => {
    const state = stateWith('art_001');
    state.energy = D(getSpecies('art_001')!.baseCost * 5);
    const bought = levelUp(state, 'art_001', 100);
    expect(bought).toBeGreaterThan(0);
    expect(bought).toBeLessThan(100);
    expect(state.energy.gte(0)).toBe(true);
  });

  it('Max kauft alles Bezahlbare', () => {
    const state = stateWith('art_001');
    state.energy = D(getSpecies('art_001')!.baseCost * 50);
    const preview = levelUpCost(state, 'art_001', 'max');
    expect(levelUp(state, 'art_001', 'max')).toBe(preview.levels);
    expect(levelUpCost(state, 'art_001', 1).cost.gt(state.energy)).toBe(true);
  });

  it('ohne Energie oder ohne Fang passiert nichts', () => {
    const state = stateWith('art_001');
    expect(levelUp(state, 'art_001', 1)).toBe(0);
    state.energy = D(1000);
    expect(levelUp(state, 'art_009', 1)).toBe(0);
  });
});

describe('Fangen', () => {
  it('ein Versuch verbraucht eine Sphäre', () => {
    const state = createInitialState(0, 5);
    const before = state.spheres;
    tryCatch(state, 'art_001');
    expect(state.spheres).toBe(before - 1);
  });

  it('ohne Sphären kein Fang', () => {
    const state = createInitialState(0, 5);
    state.spheres = 0;
    expect(tryCatch(state, 'art_001')).toBe(false);
    expect(state.spheres).toBe(0);
  });

  it('die Fangquote entspricht der Basischance', () => {
    const state = createInitialState(0, 99);
    state.settings.catchOnlyNew = false;
    let caught = 0;
    const trials = 8000;
    state.spheres = trials;
    for (let i = 0; i < trials; i++) {
      if (tryCatch(state, 'art_001')) caught += 1;
    }
    expect(caught / trials).toBeCloseTo(BALANCING.rarity.common.catchChance, 1);
  });

  it('„Nur neue Arten“ spart Sphären bei bekannten Arten', () => {
    const state = stateWith('art_001');
    state.spheres = 5;
    expect(tryCatch(state, 'art_001')).toBe(false);
    expect(state.spheres).toBe(5);
    state.settings.catchOnlyNew = false;
    tryCatch(state, 'art_001');
    expect(state.spheres).toBe(4);
  });

  it('Duplikate zählen mit', () => {
    const state = stateWith('art_001', 'art_001', 'art_001');
    expect(state.collection.art_001).toEqual({ caught: 3, level: 1 });
    expect(state.team).toEqual(['art_001']);
    expect(state.lastCatch?.speciesId).toBe('art_001');
  });

  it('besiegte normale Gegner werden gefangen, Bosse nicht', () => {
    const state = createInitialState(0, 1);
    state.spheres = 3;
    dealDamage(state, state.enemy.hp);
    expect(state.spheres).toBe(2);
    enterZone(state, 5);
    dealDamage(state, state.enemy.hp);
    expect(state.spheres).toBe(2);
  });

  it('Sphären kaufen kostet den Zonenpreis', () => {
    const state = createInitialState(0);
    const before = state.spheres;
    expect(buySpheres(state, 2)).toBe(false);
    state.energy = D(100);
    expect(buySpheres(state, 2)).toBe(true);
    expect(state.spheres).toBe(before + 2);
    expect(state.energy.toNumber()).toBeCloseTo(100 - 2 * (10 / 15) * BALANCING.catching.sphereCostKills, 6);
  });
});

describe('Hinweise', () => {
  it('erscheinen nach der Freischaltung einmal', () => {
    const state = createInitialState(0);
    expect(activeHint(state)).toBeNull();
    addCatch(state, 'art_001');
    expect(activeHint(state)).toBe('team');
    dismissHint(state, 'team');
    expect(activeHint(state)).toBe('shop');
    dismissHint(state, 'shop');
    expect(activeHint(state)).toBeNull();
  });

  it('der Laden erscheint auch, wenn die Sphären ausgehen', () => {
    const state = createInitialState(0);
    state.spheres = 0;
    expect(activeHint(state)).toBe('shop');
  });
});
