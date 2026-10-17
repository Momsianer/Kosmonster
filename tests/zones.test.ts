import { describe, expect, it } from 'vitest';
import { enemyMaxHp, enemyReward } from '../src/core/formulas';
import { advance } from '../src/core/loop';
import { createInitialState, type GameState } from '../src/core/state';
import { BALANCING } from '../src/data/balancing';
import { challengeBoss, dealDamage, enterZone, updateBossTimer } from '../src/systems/combat';

const PER_ZONE = BALANCING.world.enemiesPerZone;
const TIME = BALANCING.boss.timeLimitSeconds;

function killEnemy(state: GameState): void {
  dealDamage(state, state.enemy.hp);
}

describe('Zonenfortschritt', () => {
  it('nach enemiesPerZone Kills geht es in die nächste Zone', () => {
    const state = createInitialState(0);
    for (let i = 0; i < PER_ZONE - 1; i++) killEnemy(state);
    expect(state.zone).toBe(1);
    expect(state.killsInZone).toBe(PER_ZONE - 1);
    killEnemy(state);
    expect(state.zone).toBe(2);
    expect(state.killsInZone).toBe(0);
    expect(state.highestZone).toBe(2);
    expect(state.enemy.maxHp.eq(enemyMaxHp(2))).toBe(true);
  });

  it('eine Bosszone startet mit vollem Boss und Zeitlimit', () => {
    const state = createInitialState(0);
    enterZone(state, 4, PER_ZONE - 1);
    killEnemy(state);
    expect(state.zone).toBe(5);
    expect(state.enemy.maxHp.eq(enemyMaxHp(5))).toBe(true);
    expect(state.bossTimeLeft).toBe(TIME);
  });

  it('ein besiegter Boss gibt die Bossbelohnung und führt in die nächste Zone', () => {
    const state = createInitialState(0);
    enterZone(state, 5);
    killEnemy(state);
    expect(state.energy.eq(enemyReward(5))).toBe(true);
    expect(state.zone).toBe(6);
    expect(state.bossTimeLeft).toBe(0);
  });

  it('normale Zonen haben keinen Timer', () => {
    const state = createInitialState(0);
    updateBossTimer(state, 100);
    expect(state.zone).toBe(1);
    expect(state.farming).toBe(false);
  });
});

describe('Bosszeit und Farmmodus', () => {
  it('die Bosszeit läuft mit der Tickschleife ab', () => {
    const state = createInitialState(0);
    enterZone(state, 5);
    advance(state, 1000);
    expect(state.bossTimeLeft).toBeCloseTo(TIME - 1, 10);
  });

  it('abgelaufene Zeit schickt in die Zone davor und startet den Farmmodus', () => {
    const state = createInitialState(0);
    enterZone(state, 10);
    updateBossTimer(state, TIME);
    expect(state.zone).toBe(9);
    expect(state.farming).toBe(true);
    expect(state.killsInZone).toBe(PER_ZONE);
    expect(state.bossTimeLeft).toBe(0);
    expect(state.highestZone).toBe(10);
  });

  it('Boss knapp vor Ablauf besiegt zählt als Sieg', () => {
    const state = createInitialState(0);
    enterZone(state, 5);
    updateBossTimer(state, TIME - 0.01);
    killEnemy(state);
    expect(state.zone).toBe(6);
    expect(state.farming).toBe(false);
  });

  it('im Farmmodus bleibt man in der Zone', () => {
    const state = createInitialState(0);
    enterZone(state, 5);
    updateBossTimer(state, TIME);
    for (let i = 0; i < PER_ZONE * 3; i++) killEnemy(state);
    expect(state.zone).toBe(4);
    expect(state.enemiesDefeated).toBe(PER_ZONE * 3);
  });

  it('Boss herausfordern beendet den Farmmodus und startet den Boss neu', () => {
    const state = createInitialState(0);
    enterZone(state, 5);
    updateBossTimer(state, TIME);
    expect(challengeBoss(state)).toBe(true);
    expect(state.farming).toBe(false);
    expect(state.zone).toBe(5);
    expect(state.bossTimeLeft).toBe(TIME);
    expect(state.enemy.hp.eq(enemyMaxHp(5))).toBe(true);
  });

  it('Boss herausfordern ohne Farmmodus bewirkt nichts', () => {
    const state = createInitialState(0);
    expect(challengeBoss(state)).toBe(false);
    expect(state.zone).toBe(1);
  });
});
