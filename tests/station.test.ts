import { describe, expect, it } from 'vitest';
import {
  bulkCost,
  moduleCost,
  moduleMult,
  moduleProduction,
  nextModuleUpgrade,
} from '../src/core/formulas';
import { advance } from '../src/core/loop';
import { createInitialState } from '../src/core/state';
import { BALANCING } from '../src/data/balancing';
import { getModule, MODULE_IDS, MODULES } from '../src/data/modules';
import { t } from '../src/i18n';
import {
  applyProduction,
  buyModule,
  moduleBuyCost,
  productionOf,
  totalProduction,
} from '../src/systems/station';
import { isUnlocked } from '../src/systems/unlocks';
import { D } from '../src/util/decimal';

describe('Moduldaten', () => {
  it('8 Module mit den Werten aus dem Designdokument', () => {
    expect(MODULES.map((m) => m.id)).toEqual([...MODULE_IDS]);
    expect(MODULES.map((m) => m.baseCost)).toEqual([15, 100, 1100, 12000, 130000, 1.4e6, 2e7, 3.3e8]);
    expect(MODULES.map((m) => m.production)).toEqual([0.1, 1, 8, 47, 260, 1400, 7800, 44000]);
  });

  it('jedes Modul hat einen Namen', () => {
    for (const m of MODULES) expect(t(`station.${m.id}.name`)).not.toBe(`station.${m.id}.name`);
    expect(t('station.solarpanel.name')).toBe('Solarpanel');
  });
});

describe('Stationsformeln', () => {
  it('modulKosten(i, n) = basis_i * 1,15^n', () => {
    expect(moduleCost(15, 0).toNumber()).toBe(15);
    expect(moduleCost(15, 1).toNumber()).toBeCloseTo(17.25, 10);
    expect(moduleCost(100, 10).toNumber()).toBeCloseTo(100 * 1.15 ** 10, 6);
  });

  it('modulMult ×2 bei 25, 50, 100, 150, 200 Stück', () => {
    const m = (n: number) => moduleMult(n).toNumber();
    expect(m(0)).toBe(1);
    expect(m(24)).toBe(1);
    expect(m(25)).toBe(2);
    expect(m(50)).toBe(4);
    expect(m(100)).toBe(8);
    expect(m(150)).toBe(16);
    expect(m(200)).toBe(32);
    expect(m(1000)).toBe(32);
  });

  it('nächste Verdopplung', () => {
    expect(nextModuleUpgrade(0)).toBe(25);
    expect(nextModuleUpgrade(25)).toBe(50);
    expect(nextModuleUpgrade(199)).toBe(200);
    expect(nextModuleUpgrade(200)).toBeNull();
  });

  it('produktion_i = prod_i * n * modulMult_i', () => {
    expect(moduleProduction(0.1, 0).toNumber()).toBe(0);
    expect(moduleProduction(0.1, 10).toNumber()).toBeCloseTo(1, 10);
    expect(moduleProduction(8, 30).toNumber()).toBeCloseTo(8 * 30 * 2, 10);
  });

  it('Mehrfachkauf nutzt die Modulkosten', () => {
    let sum = D(0);
    for (let i = 0; i < 10; i++) sum = sum.add(moduleCost(15, 5 + i));
    expect(bulkCost(15, BALANCING.station.costGrowth, 5, 10).toNumber()).toBeCloseTo(sum.toNumber(), 6);
  });
});

describe('Module kaufen', () => {
  it('×1 kostet den Einzelpreis', () => {
    const state = createInitialState(0);
    state.energy = D(20);
    expect(buyModule(state, 'solarpanel', 1)).toBe(1);
    expect(state.modules.solarpanel).toBe(1);
    expect(state.energy.toNumber()).toBeCloseTo(5, 10);
  });

  it('×10 baut zehn Module zum Gesamtpreis', () => {
    const state = createInitialState(0);
    const cost = moduleBuyCost(state, 'asteroidenbohrer', 10).cost;
    state.energy = cost;
    expect(buyModule(state, 'asteroidenbohrer', 10)).toBe(10);
    expect(state.modules.asteroidenbohrer).toBe(10);
    expect(state.energy.toNumber()).toBeCloseTo(0, 6);
  });

  it('Max baut alles Bezahlbare', () => {
    const state = createInitialState(0);
    state.energy = D(1000);
    const preview = moduleBuyCost(state, 'solarpanel', 'max');
    expect(buyModule(state, 'solarpanel', 'max')).toBe(preview.count);
    expect(moduleBuyCost(state, 'solarpanel', 1).cost.gt(state.energy)).toBe(true);
  });

  it('ohne Energie wird nichts gebaut', () => {
    const state = createInitialState(0);
    expect(buyModule(state, 'solarpanel', 1)).toBe(0);
    expect(state.modules.solarpanel).toBeUndefined();
  });
});

describe('Produktion', () => {
  it('summiert alle Module', () => {
    const state = createInitialState(0);
    state.modules = { solarpanel: 10, fusionsreaktor: 30 };
    expect(productionOf(state, 'solarpanel').toNumber()).toBeCloseTo(1, 10);
    expect(totalProduction(state).toNumber()).toBeCloseTo(1 + 8 * 30 * 2, 10);
  });

  it('erzeugt Energie über die Zeit', () => {
    const state = createInitialState(0);
    state.modules = { asteroidenbohrer: 5 };
    applyProduction(state, 2);
    expect(state.energy.toNumber()).toBeCloseTo(10, 10);
    expect(state.totalEnergy.toNumber()).toBeCloseTo(10, 10);
  });

  it('läuft auch während nachgeholter Offlinezeit', () => {
    const state = createInitialState(0);
    state.modules = { asteroidenbohrer: 3 };
    advance(state, 3600 * 1000);
    expect(state.energy.toNumber()).toBeCloseTo(3 * getModule('asteroidenbohrer')!.production * 3600, 4);
  });
});

describe('Freischaltung', () => {
  it('nach 5 Minuten Spielzeit', () => {
    const state = createInitialState(0);
    expect(isUnlocked(state, 'station')).toBe(false);
    state.playTime = BALANCING.station.unlockSeconds;
    expect(isUnlocked(state, 'station')).toBe(true);
  });

  it('bleibt mit gebauten Modulen frei', () => {
    const state = createInitialState(0);
    state.modules = { solarpanel: 1 };
    expect(isUnlocked(state, 'station')).toBe(true);
  });
});
