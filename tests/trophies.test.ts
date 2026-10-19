import { describe, expect, it } from 'vitest';
import { enemyReward } from '../src/core/formulas';
import { createInitialState } from '../src/core/state';
import { BALANCING } from '../src/data/balancing';
import { addCatch } from '../src/systems/catching';
import { applyTeamDamage, dealDamage, enterZone } from '../src/systems/combat';
import { trophyBossDamageMult, trophyCounts, trophyEnergyMult } from '../src/systems/trophies';
import { D } from '../src/util/decimal';

describe('Trophäen der Bossmonster', () => {
  it('zählen gefangene Minibosse und Hauptbosse, auch außerhalb des Teams', () => {
    const state = createInitialState(0);
    expect(trophyCounts(state)).toEqual({ mini: 0, main: 0 });
    addCatch(state, 'boss_001');
    addCatch(state, 'boss_003');
    addCatch(state, 'boss_002');
    state.team = [];
    expect(trophyCounts(state)).toEqual({ mini: 2, main: 1 });
    const { miniEnergyBonus, mainBossDamageBonus } = BALANCING.bosses.trophies;
    expect(trophyEnergyMult(state)).toBeCloseTo(1 + 2 * miniEnergyBonus, 10);
    expect(trophyBossDamageMult(state)).toBeCloseTo(1 + mainBossDamageBonus, 10);
  });

  it('Minibosse erhöhen die Energie aus besiegten Gegnern', () => {
    const state = createInitialState(0);
    state.settings.catchOnlyNew = true;
    addCatch(state, 'boss_001');
    enterZone(state, 3);
    const before = state.energy;
    dealDamage(state, state.enemy.hp);
    const gained = state.energy.sub(before).toNumber();
    expect(gained).toBeCloseTo(enemyReward(3).toNumber() * (1 + BALANCING.bosses.trophies.miniEnergyBonus), 6);
  });

  it('Hauptbosse erhöhen den Schaden gegen Bosse', () => {
    const damageDealt = (withTrophy: boolean) => {
      const state = createInitialState(0);
      addCatch(state, 'art_001');
      state.collection.art_001!.level = 50;
      if (withTrophy) state.collection.boss_002 = { caught: 1, level: 0, evolution: 0, shiny: false, bred: 0 };
      enterZone(state, 10);
      state.enemy.hp = D(1e9);
      state.enemy.maxHp = D(1e9);
      applyTeamDamage(state, 1);
      return D(1e9).sub(state.enemy.hp).toNumber();
    };
    const ratio = damageDealt(true) / damageDealt(false);
    expect(ratio).toBeCloseTo(1 + BALANCING.bosses.trophies.mainBossDamageBonus, 6);
  });

  it('Bossmonster sind nur noch etwa so stark wie normale Arten ihres Gebiets', () => {
    const { miniDpsFactor, mainDpsFactor } = BALANCING.bosses;
    expect(miniDpsFactor).toBeLessThanOrEqual(BALANCING.pools.dpsPerHp);
    expect(mainDpsFactor).toBeLessThan(BALANCING.pools.dpsPerHp * 2);
  });
});
