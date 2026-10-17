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
  reward: {
    /** energie(z) = hp(z) / energyDivisor */
    energyDivisor: 15,
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
  },
} as const;
