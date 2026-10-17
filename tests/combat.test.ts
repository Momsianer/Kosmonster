import { describe, expect, it } from 'vitest';
import { enemyEnergy, enemyHp } from '../src/core/formulas';
import { createInitialState, STATE_VERSION } from '../src/core/state';
import { clickEnemy, dealDamage } from '../src/systems/combat';

describe('Kampf', () => {
  it('startet mit vollem Gegner und ohne Energie', () => {
    const state = createInitialState(0);
    expect(state.enemy.hp.eq(enemyHp(1))).toBe(true);
    expect(state.enemy.maxHp.eq(enemyHp(1))).toBe(true);
    expect(state.energy.eq(0)).toBe(true);
  });

  it('ein Klick verursacht Klickschaden und zählt mit', () => {
    const state = createInitialState(0);
    const defeated = clickEnemy(state);
    expect(defeated).toBe(false);
    expect(state.enemy.hp.toNumber()).toBe(9);
    expect(state.clicks).toBe(1);
  });

  it('besiegter Gegner gibt Energie und ein neuer erscheint', () => {
    const state = createInitialState(0);
    let defeated = false;
    for (let i = 0; i < 10; i++) defeated = clickEnemy(state);
    expect(defeated).toBe(true);
    expect(state.energy.eq(enemyEnergy(1))).toBe(true);
    expect(state.totalEnergy.eq(enemyEnergy(1))).toBe(true);
    expect(state.enemiesDefeated).toBe(1);
    expect(state.enemy.hp.eq(state.enemy.maxHp)).toBe(true);
  });

  it('überschüssiger Schaden verfällt', () => {
    const state = createInitialState(0);
    dealDamage(state, 1e6);
    expect(state.enemiesDefeated).toBe(1);
    expect(state.enemy.hp.eq(state.enemy.maxHp)).toBe(true);
  });

  it('Schaden von null oder weniger bewirkt nichts', () => {
    const state = createInitialState(0);
    expect(dealDamage(state, 0)).toBe(false);
    expect(dealDamage(state, -5)).toBe(false);
    expect(state.enemy.hp.eq(state.enemy.maxHp)).toBe(true);
  });

  it('Zustand ist als JSON serialisierbar', () => {
    const state = createInitialState(0);
    clickEnemy(state);
    const json = JSON.parse(JSON.stringify(state));
    expect(json.version).toBe(STATE_VERSION);
    expect(json.enemy.hp).toBe('9');
  });
});
