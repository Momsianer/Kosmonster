/**
 * Alle Balancingwerte des Spiels.
 * Systeme und Formeln lesen ausschließlich von hier, nie feste Zahlen.
 */
export const BALANCING = {
  enemy: {
    /** Gegnerleben in Zone 1 */
    baseHp: 10,
    /** Wachstum der Gegnerleben pro Zone bis zur Knickzone */
    hpGrowth: 1.55,
    /** Ab dieser Zone wächst das Leben langsamer */
    hpBreakZone: 140,
    /** Wachstum der Gegnerleben pro Zone nach der Knickzone */
    hpGrowthLate: 1.145,
  },
  boss: {
    /** Jede n. Zone ist eine Bosszone */
    bossEvery: 5,
    /** Jede n. Zone ist eine Systembosszone (hat Vorrang vor dem normalen Boss) */
    systemBossEvery: 10,
    /** Lebensmultiplikator für Bosse */
    bossHpMult: 10,
    /** Lebensmultiplikator für Systembosse */
    systemBossHpMult: 25,
    /** Zeitlimit für Bosse und Systembosse in Sekunden */
    timeLimitSeconds: 30,
  },
  reward: {
    /** energie(z) = hp(z) / energyDivisor */
    energyDivisor: 15,
    /** Energiemultiplikator für Bosse und Systembosse */
    bossEnergyMult: 3,
  },
  click: {
    /** Grundschaden eines Klicks */
    baseDamage: 1,
    /** klickschaden = baseDamage + teamShare * teamDPS * klickbonus */
    teamShare: 0.01,
    /** Klickbonus ohne Forschung */
    baseClickBonus: 1,
    /** Schadensmultiplikator kritischer Klicks ohne Forschung */
    critMult: 5,
  },
  monster: {
    /** Plätze im Team zu Beginn */
    teamSlots: 3,
    /** Wachstum der Levelkosten: levelKosten(l) = basisKosten * levelCostGrowth^l */
    levelCostGrowth: 1.07,
    /** Feste Meilensteinlevel mit ×milestoneMult */
    milestoneLevels: [10, 25, 50, 100],
    milestoneMult: 2,
    /** Danach alle hundredStep Level ×milestoneMult … */
    hundredStep: 100,
    /** … und alle thousandStep Level ×thousandMult statt ×milestoneMult */
    thousandStep: 1000,
    thousandMult: 10,
  },
  rarity: {
    common: { catchChance: 0.25, dpsMult: 1, spawnWeight: 3 },
    uncommon: { catchChance: 0.12, dpsMult: 2, spawnWeight: 1 },
    rare: { catchChance: 0.05, dpsMult: 5, spawnWeight: 0.4 },
    epic: { catchChance: 0.015, dpsMult: 15, spawnWeight: 0.15 },
    legendary: { catchChance: 0.003, dpsMult: 50, spawnWeight: 0 },
    mythic: { catchChance: 0, dpsMult: 200, spawnWeight: 0 },
  },
  types: {
    /** Prim: ×primeZoneMult in Zonen mit Primzahlnummer */
    primeZoneMult: 2,
    /** Fibonacci: ×fibonacciMult für jedes Fibonacci Level bis zum aktuellen Level */
    fibonacciMult: 1.25,
  },
  catching: {
    /** Fangsphären zu Spielbeginn */
    startSpheres: 5,
    /** Multiplikator der Standardsphäre */
    standardSphereMult: 1,
    /** Fangbonus ohne Forschung */
    baseResearchBonus: 0,
    /** Preis einer Sphäre = sphereCostKills * Energie eines normalen Gegners der aktuellen Zone */
    sphereCostKills: 5,
  },
  loop: {
    /** Logikticks pro Sekunde */
    ticksPerSecond: 20,
    /** Oberflächenaktualisierungen pro Sekunde */
    uiUpdatesPerSecond: 10,
    /** Größter Zeitschritt pro Tick in Sekunden. Längere Pausen werden in Schritten dieser Größe nachgeholt */
    maxTickSeconds: 1,
  },
  station: {
    /** Freischaltung der Raumstation nach so vielen Sekunden Spielzeit */
    unlockSeconds: 5 * 60,
    /** Wachstum der Modulkosten: modulKosten(i, n) = basis_i * costGrowth^n */
    costGrowth: 1.15,
    /** Ab diesen Stückzahlen verdoppelt sich die Produktion eines Moduls */
    upgradeThresholds: [25, 50, 100, 150, 200],
    upgradeMult: 2,
  },
  supernova: {
    /** Supernova möglich ab dieser Zone im aktuellen Zyklus */
    minZone: 60,
    /** sternenstaub = floor( (zyklusEnergie / energyDivisor)^exponent ) */
    energyDivisor: 1e9,
    exponent: 0.5,
    /** passiver Bonus: ×(1 + bonusPerStardust * unausgegebenerSternenstaub) */
    bonusPerStardust: 0.02,
  },
  evolution: {
    /** Evolution: basisDPS × dpsMult je Stufe */
    dpsMult: 5,
    /** Mindestlevel für Stufe 1 und Stufe 2 */
    levelRequirements: [100, 500],
    /** Sternenstaubkosten für Stufe 1 und Stufe 2 bei Art Nummer 1 */
    costs: [5, 200],
    /** Kosten wachsen je Artnummer mit costGrowthPerSpecies^(nummer − 1) */
    costGrowthPerSpecies: 1.6,
  },
  /**
   * Forschungsknoten: maxLevel Stufen, Kosten = baseCost * costGrowth^stufe,
   * perLevel ist die Wirkung je Stufe (Bedeutung siehe src/data/research.ts).
   */
  research: {
    costGrowth: 3,
    nodes: {
      klickkraft: { maxLevel: 10, baseCost: 1, perLevel: 1 },
      teamstaerke: { maxLevel: 20, baseCost: 2, perLevel: 0.25 },
      kritchance: { maxLevel: 10, baseCost: 3, perLevel: 0.02 },
      kritschaden: { maxLevel: 5, baseCost: 5, perLevel: 1 },
      bosszeit: { maxLevel: 10, baseCost: 4, perLevel: 3 },
      bossschaden: { maxLevel: 5, baseCost: 10, perLevel: 0.5 },
      fangglueck: { maxLevel: 10, baseCost: 1, perLevel: 0.1 },
      sphaerenrabatt: { maxLevel: 10, baseCost: 2, perLevel: 0.05 },
      teamplatz: { maxLevel: 3, baseCost: 25, perLevel: 1 },
      startsphaeren: { maxLevel: 5, baseCost: 3, perLevel: 5 },
      produktion: { maxLevel: 20, baseCost: 1, perLevel: 0.25 },
      modulrabatt: { maxLevel: 10, baseCost: 3, perLevel: 0.03 },
      umwandlung: { maxLevel: 10, baseCost: 8, perLevel: 0.01 },
      offlinebonus: { maxLevel: 10, baseCost: 2, perLevel: 0.1 },
      offlinelimit: { maxLevel: 8, baseCost: 5, perLevel: 3600 },
      startzone: { maxLevel: 6, baseCost: 10, perLevel: 5 },
    },
  },
  offline: {
    /** Höchstens so viel verpasste Zeit wird nachgeholt (8 Stunden) */
    maxSeconds: 8 * 60 * 60,
    /** Ab dieser Abwesenheit erscheint der Hinweis „Willkommen zurück“ */
    reportThresholdSeconds: 60,
  },
  save: {
    /** Abstand zwischen zwei automatischen Speicherungen */
    autosaveSeconds: 30,
  },
  world: {
    startZone: 1,
    /** Gegner, die pro normaler Zone besiegt werden müssen */
    enemiesPerZone: 10,
    /** Zonen pro Sternsystem */
    zonesPerSystem: 10,
  },
} as const;
