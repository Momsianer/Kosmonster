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
  },
  loop: {
    /** Logikticks pro Sekunde */
    ticksPerSecond: 20,
    /** Oberflächenaktualisierungen pro Sekunde */
    uiUpdatesPerSecond: 10,
    /** Größter Zeitschritt pro Tick in Sekunden, längere Pausen übernimmt später der Offlinefortschritt */
    maxTickSeconds: 1,
  },
  world: {
    startZone: 1,
    /** Gegner, die pro normaler Zone besiegt werden müssen */
    enemiesPerZone: 10,
    /** Zonen pro Sternsystem */
    zonesPerSystem: 10,
  },
} as const;
