import { BALANCING } from '../data/balancing';
import { D, type Decimal, type DecimalSource } from '../util/decimal';

export type EnemyKind = 'normal' | 'boss' | 'systemBoss';

/**
 * Grundleben eines normalen Gegners in Zone z.
 * hp(z) = baseHp * hpGrowth^(z − 1)                  für z ≤ hpBreakZone
 * hp(z) = hp(hpBreakZone) * hpGrowthLate^(z − hpBreakZone)  für z > hpBreakZone
 */
export function enemyHp(zone: number): Decimal {
  const { baseHp, hpGrowth, hpBreakZone, hpGrowthLate } = BALANCING.enemy;
  if (zone <= hpBreakZone) {
    return D(hpGrowth).pow(zone - 1).mul(baseHp);
  }
  return enemyHp(hpBreakZone).mul(D(hpGrowthLate).pow(zone - hpBreakZone));
}

/** Art des Gegners in Zone z: Systemboss jede systemBossEvery. Zone, Boss jede bossEvery. Zone */
export function enemyKind(zone: number): EnemyKind {
  const { bossEvery, systemBossEvery } = BALANCING.boss;
  if (zone % systemBossEvery === 0) return 'systemBoss';
  if (zone % bossEvery === 0) return 'boss';
  return 'normal';
}

export function isBossZone(zone: number): boolean {
  return enemyKind(zone) !== 'normal';
}

/** Leben des Gegners in Zone z inklusive Bossmultiplikator */
export function enemyMaxHp(zone: number): Decimal {
  const { bossHpMult, systemBossHpMult } = BALANCING.boss;
  switch (enemyKind(zone)) {
    case 'systemBoss':
      return enemyHp(zone).mul(systemBossHpMult);
    case 'boss':
      return enemyHp(zone).mul(bossHpMult);
    default:
      return enemyHp(zone);
  }
}

/** Grundenergie für einen normalen Gegner in Zone z: hp(z) / energyDivisor */
export function enemyEnergy(zone: number): Decimal {
  return enemyHp(zone).div(BALANCING.reward.energyDivisor);
}

/** Energie für den Gegner in Zone z inklusive Bossmultiplikator */
export function enemyReward(zone: number): Decimal {
  const base = enemyEnergy(zone);
  return isBossZone(zone) ? base.mul(BALANCING.reward.bossEnergyMult) : base;
}

/** Nummer des Sternsystems, zu dem Zone z gehört (Zone 1 bis 10 → System 1) */
export function starSystem(zone: number): number {
  return Math.ceil(zone / BALANCING.world.zonesPerSystem);
}

/**
 * Schaden eines Klicks.
 * klickschaden = baseDamage + teamShare * teamDPS * klickbonus
 */
export function clickDamage(
  teamDps: DecimalSource = 0,
  clickBonus: DecimalSource = BALANCING.click.baseClickBonus,
): Decimal {
  const { baseDamage, teamShare } = BALANCING.click;
  return D(teamDps).mul(teamShare).mul(clickBonus).add(baseDamage);
}

// ─── Monster ────────────────────────────────────────────────

/** Kosten für den Aufstieg von Level l auf l + 1: basisKosten * levelCostGrowth^l */
export function levelCost(baseCost: DecimalSource, level: number): Decimal {
  return D(BALANCING.monster.levelCostGrowth).pow(level).mul(baseCost);
}

/**
 * Meilensteinmultiplikator für ein Level:
 * ×2 bei 10, 25, 50, 100, danach alle 100 Level ×2, alle 1000 Level ×10 (statt ×2).
 */
export function milestoneMult(level: number): Decimal {
  const { milestoneLevels, milestoneMult: mult, hundredStep, thousandStep, thousandMult } =
    BALANCING.monster;
  const fixed = milestoneLevels.filter((l) => level >= l).length;
  const lastFixed = milestoneLevels[milestoneLevels.length - 1] ?? 0;
  // Vielfache von hundredStep oberhalb des letzten festen Meilensteins
  const hundreds = Math.max(0, Math.floor(level / hundredStep) - Math.floor(lastFixed / hundredStep));
  const thousands = Math.floor(level / thousandStep);
  return D(mult)
    .pow(fixed + hundreds - thousands)
    .mul(D(thousandMult).pow(thousands));
}

/** Anzahl verschiedener Fibonacci Zahlen von 1 bis level (1, 2, 3, 5, 8, …) */
export function fibonacciCount(level: number): number {
  let count = 0;
  let a = 1;
  let b = 2;
  while (a <= level) {
    count += 1;
    [a, b] = [b, a + b];
  }
  return count;
}

/** Fibonacci Typ: ×fibonacciMult für jedes Fibonacci Level bis zum aktuellen Level */
export function fibonacciMult(level: number): Decimal {
  return D(BALANCING.types.fibonacciMult).pow(fibonacciCount(level));
}

export function isPrime(n: number): boolean {
  if (!Number.isInteger(n) || n < 2) return false;
  if (n % 2 === 0) return n === 2;
  for (let i = 3; i * i <= n; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

/** Prim Typ: ×primeZoneMult in Zonen mit Primzahlnummer */
export function primeZoneMult(zone: number): Decimal {
  return D(isPrime(zone) ? BALANCING.types.primeZoneMult : 1);
}

/** Grundformel: monsterDPS = basisDPS * level * meilensteinMult * seltenheitMult * typMult */
export function monsterDpsBase(
  baseDps: DecimalSource,
  level: number,
  rarityMult: DecimalSource,
  typeMult: DecimalSource,
): Decimal {
  if (level <= 0) return D(0);
  return D(baseDps).mul(level).mul(milestoneMult(level)).mul(rarityMult).mul(typeMult);
}

/** fangchance = basisChance * sphärenMult * (1 + forschungsBonus), höchstens 1 */
export function catchChance(
  baseChance: number,
  sphereMult: number = BALANCING.catching.standardSphereMult,
  researchBonus: number = BALANCING.catching.baseResearchBonus,
): number {
  return Math.min(1, baseChance * sphereMult * (1 + researchBonus));
}

/** Preis einer Fangsphäre in Zone z */
export function sphereCost(zone: number): Decimal {
  return enemyEnergy(zone).mul(BALANCING.catching.sphereCostKills);
}

// ─── Raumstation ────────────────────────────────────────────

/** Kosten des nächsten Moduls, wenn schon n gebaut sind: basis * costGrowth^n */
export function moduleCost(baseCost: DecimalSource, owned: number): Decimal {
  return D(BALANCING.station.costGrowth).pow(owned).mul(baseCost);
}

/** Modulmultiplikator: ×upgradeMult für jede erreichte Stückzahl aus upgradeThresholds */
export function moduleMult(owned: number): Decimal {
  const { upgradeThresholds, upgradeMult } = BALANCING.station;
  return D(upgradeMult).pow(upgradeThresholds.filter((t) => owned >= t).length);
}

/** Nächste Stückzahl, ab der sich die Produktion verdoppelt, null wenn alle erreicht */
export function nextModuleUpgrade(owned: number): number | null {
  return BALANCING.station.upgradeThresholds.find((t) => owned < t) ?? null;
}

/** produktion_i = prod_i * n * modulMult_i (Energie pro Sekunde) */
export function moduleProduction(production: DecimalSource, owned: number): Decimal {
  if (owned <= 0) return D(0);
  return D(production).mul(owned).mul(moduleMult(owned));
}

// ─── Mehrfachkauf ───────────────────────────────────────────

/**
 * Kosten für n weitere Käufe, wenn schon k gekauft wurden:
 * kosten(n) = basis * r^k * (r^n − 1) / (r − 1)
 */
export function bulkCost(base: DecimalSource, r: number, owned: number, n: number): Decimal {
  if (n <= 0) return D(0);
  const rD = D(r);
  return D(base)
    .mul(rD.pow(owned))
    .mul(rD.pow(n).sub(1))
    .div(r - 1);
}

/**
 * Wie viele Käufe mit money höchstens möglich sind:
 * maxKaufbar = floor( log_r( geld * (r − 1) / (basis * r^k) + 1 ) )
 */
export function maxAffordable(money: DecimalSource, base: DecimalSource, r: number, owned: number): number {
  const m = D(money);
  if (m.lte(0)) return 0;
  const first = D(base).mul(D(r).pow(owned));
  const inner = m.mul(r - 1).div(first).add(1);
  let n = Math.max(0, Math.floor(inner.log(r).toNumber()));
  // Rundungsfehler ausgleichen
  while (n > 0 && bulkCost(base, r, owned, n).gt(m)) n -= 1;
  while (bulkCost(base, r, owned, n + 1).lte(m)) n += 1;
  return n;
}
