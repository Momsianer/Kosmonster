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
    /** spawnWeight gilt für die normalen Arten im Pool, der seltene Platz hat eigene Chancen (pools) */
    common: { catchChance: 0.25, dpsMult: 1, spawnWeight: 3 },
    uncommon: { catchChance: 0.12, dpsMult: 2, spawnWeight: 1 },
    rare: { catchChance: 0.05, dpsMult: 5, spawnWeight: 0 },
    epic: { catchChance: 0.015, dpsMult: 15, spawnWeight: 0 },
    legendary: { catchChance: 0.003, dpsMult: 50, spawnWeight: 0 },
    mythic: { catchChance: 0, dpsMult: 200, spawnWeight: 0 },
    /** Bossmonster: Stärke steckt in basisDPS (siehe bosses), deshalb ×1 */
    boss: { catchChance: 0.0025, dpsMult: 1, spawnWeight: 0 },
  },
  /**
   * Gebietspools: Jedes Sternsystem hat drei normale Arten und eine seltene. Nach `areas`
   * Gebieten wiederholen sich die Pools. Die seltene Art erscheint mit
   * rareBaseChance + rareChancePerZone * (Zone im Gebiet − 1), legendär in jedem legendaryEvery. Gebiet,
   * episch ab epicFromArea, sonst selten. Die normalen Arten erscheinen gestaffelt ab der Zone
   * erste Zone + slotStart[Platz] und sind so stark wie diese Zone: basisDPS = hp(Startzone) * dpsPerHp.
   * Die seltene Art erscheint im ganzen Gebiet, basisDPS = hp(erste Zone + rareZoneOffset) * dpsPerHp.
   * basisKosten = basisDPS * costPerDps (im ersten Gebiet firstAreaCostPerDps).
   */
  pools: {
    areas: 30,
    dpsPerHp: 0.125,
    costPerDps: 50,
    /** Im ersten Gebiet sind Level günstiger, damit der Einstieg flott bleibt */
    firstAreaCostPerDps: 26,
    slotStart: [0, 3, 6],
    rareZoneOffset: 0,
    rareBaseChance: 0.01,
    rareChancePerZone: 0.0025,
    legendaryEvery: 5,
    epicFromArea: 11,
  },
  /**
   * Feste Bossmonster: je Sternsystem ein Miniboss (Zone 5) und ein Hauptboss (Zone 10),
   * Typ wie der gestärkte Typ des Planeten. Nach `systems` Sternsystemen wiederholen sie sich.
   * basisDPS = hp(Zone) * dpsFactor (normale gewöhnliche Arten liegen bei etwa 0,125 * hp),
   * basisKosten = basisDPS * costPerDps.
   */
  bosses: {
    systems: 50,
    miniDpsFactor: 0.5,
    mainDpsFactor: 0.8,
    costPerDps: 50,
  },
  types: {
    /** Prim: ×primeZoneMult in Zonen mit Primzahlnummer */
    primeZoneMult: 2,
    /** Fibonacci: ×fibonacciMult für jedes Fibonacci Level bis zum aktuellen Level */
    fibonacciMult: 1.25,
    /** Pi: Klickschaden + piClickShare * teamDPS je Pi Monster im Team (π %) */
    piClickShare: Math.PI / 100,
    /** Euler: ×(1 + ln(1 + t / eulerTimeScale)), t = Sekunden seit dem letzten Reset */
    eulerTimeScale: 60,
    /** Null: ×nullIdleMult, wenn seit nullIdleSeconds nicht geklickt wurde */
    nullIdleSeconds: 60,
    nullIdleMult: 2,
    /** Null: Offlineertrag ×nullOfflineMult, wenn ein Null Monster im Team ist */
    nullOfflineMult: 2,
    /** Unendlich: +infinityPerSpecies je gefangener Art */
    infinityPerSpecies: 0.01,
    /** Fraktal: ×fractalBase^(n − 1), n = Fraktal Monster im Team */
    fractalBase: 1.25,
    /** Vektor: ×vectorBossMult gegen Bosse */
    vectorBossMult: 3,
  },
  planet: {
    /** Gestärkter Typ im Sternsystem */
    boostMult: 2,
    /** Geschwächter Typ im Sternsystem */
    weakenMult: 0.5,
  },
  stars: {
    maxStars: 5,
    /** kopienFürStern(s) = copiesBase * copiesGrowth^(s − 1) */
    copiesBase: 5,
    copiesGrowth: 2,
    /** sterneMult = starMult^sterne */
    starMult: 1.5,
  },
  shiny: {
    /** Chance auf eine Polarstern Variante pro Begegnung */
    chance: 1 / 8192,
    /** Bonus, sobald die Polarstern Variante einer Art gefangen ist */
    mult: 2,
  },
  /** Sphärentypen: Fangmultiplikator und Grundpreis in Energie */
  spheres: {
    standard: { catchMult: 1, basePrice: 5 },
    orbit: { catchMult: 1.5, basePrice: 25 },
    nebel: { catchMult: 2.5, basePrice: 150 },
    singularitaet: { catchMult: 5, basePrice: 1000 },
  },
  catching: {
    /** Fangsphären zu Spielbeginn */
    startSpheres: 5,
    /** Multiplikator der Standardsphäre */
    standardSphereMult: 1,
    /** Fangbonus ohne Forschung */
    baseResearchBonus: 0,
    /** Jeder Kauf macht den Sphärentyp teurer: preis = grundpreis * priceGrowth^aufschlag */
    priceGrowth: 1.2,
    /** Jeder besiegte Gegner baut den Aufschlag ab: priceDecayBase + priceDecayPerZone * zone */
    priceDecayBase: 0.05,
    priceDecayPerZone: 0.01,
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
  blackHole: {
    /** Schwarzes Loch möglich ab so viel Sternenstaub seit dem letzten Schwarzen Loch */
    minStardust: 1.5e4,
    /** dunkleMaterie = floor( (sternenstaubDiesesZyklus / stardustDivisor)^exponent ) */
    stardustDivisor: 1e4,
    exponent: 0.4,
    /** gravitationsMult auf Sternenstaubertrag = (1 + verdienteDunkleMaterie)^gravityExponent */
    gravityExponent: 0.5,
  },
  /**
   * Upgrades für Dunkle Materie: maxLevel Stufen, Kosten = baseCost * costGrowth^stufe,
   * perLevel ist die Wirkung je Stufe (Bedeutung siehe src/data/darkmatter.ts).
   */
  darkMatter: {
    costGrowth: 2,
    upgrades: {
      autoklicker: { maxLevel: 10, baseCost: 1, perLevel: 5 },
      autolevel: { maxLevel: 1, baseCost: 2, perLevel: 1 },
      automodul: { maxLevel: 1, baseCost: 3, perLevel: 1 },
      autosphaeren: { maxLevel: 1, baseCost: 5, perLevel: 1 },
      autoboss: { maxLevel: 1, baseCost: 8, perLevel: 1 },
      autosupernova: { maxLevel: 1, baseCost: 13, perLevel: 1 },
      teamplaetze: { maxLevel: 4, baseCost: 3, perLevel: 1 },
      erinnerung: { maxLevel: 4, baseCost: 5, perLevel: 0.25 },
      brutplatz: { maxLevel: 3, baseCost: 4, perLevel: 1 },
    },
  },
  automation: {
    /** Klicks pro Sekunde des Autoklickers auf Stufe 1, jede weitere Stufe +perLevel */
    autoclickBase: 10,
    /** Abstand der übrigen Automatiken in Sekunden */
    intervalSeconds: 1,
    /** Autoboss versucht den Boss erneut nach so vielen Sekunden Farmmodus */
    bossRetrySeconds: 30,
    /** Startwerte der Einstellungen */
    defaultSphereTarget: 10,
    defaultSupernovaTarget: 100,
    defaultBlackHoleTarget: 5,
  },
  breeding: {
    /** Brutplätze ohne Upgrade */
    baseSlots: 1,
    /** Fänge einer Art, die für ein Ei nötig sind */
    requiredCaught: 2,
    /** Brutzeit = baseSeconds * timeGrowth^bisherigeZuchtenDieserArt */
    baseSeconds: 30 * 60,
    timeGrowth: 1.25,
    /** potenzialMult = 1 + perBreed * zuchten^flattening */
    perBreed: 0.05,
    flattening: 0.75,
  },
  bigBang: {
    /**
     * „Unendlichkeit“: Bis zum ersten Urknall sind Energie und Zyklusenergie hier gedeckelt,
     * erreicht die Zyklusenergie diesen Wert, ist der Urknall möglich.
     */
    infinityEnergy: 1e18,
    /** ursprungspunkte = basePoints + challengeBonus (abgeschlossene Challenges * pointsPerChallenge) */
    basePoints: 1,
    pointsPerChallenge: 1,
  },
  /**
   * Ursprungsupgrades (Universumsregeln und Konstellationsbaum):
   * Kosten = baseCost * costGrowth^stufe, Bedeutung von perLevel siehe src/data/origin.ts.
   */
  origin: {
    costGrowth: 2,
    upgrades: {
      automatikBehalten: { maxLevel: 1, baseCost: 1, perLevel: 1 },
      autoschwarzloch: { maxLevel: 1, baseCost: 2, perLevel: 1 },
      urmaterie: { maxLevel: 5, baseCost: 1, perLevel: 2 },
      sternenquelle: { maxLevel: 10, baseCost: 1, perLevel: 0.5 },
      urkraft: { maxLevel: 10, baseCost: 1, perLevel: 1 },
      urproduktion: { maxLevel: 10, baseCost: 1, perLevel: 1 },
      fruehesupernova: { maxLevel: 4, baseCost: 2, perLevel: 5 },
      sternbilder: { maxLevel: 5, baseCost: 1, perLevel: 0.25 },
      sternkarte: { maxLevel: 1, baseCost: 3, perLevel: 1 },
    },
  },
  /**
   * Challenges: Zielzone, Ursprungspunkte beim ersten Abschluss und dauerhafter Bonus.
   * bonus.kind: dps, production, stardust, moduleCost, levelCost, bossTime, offlineLimit
   */
  challenges: {
    stilleHaende: { goalZone: 65, reward: 2, bonus: { kind: 'dps', value: 1.5 } },
    quadratisch: { goalZone: 65, reward: 2, bonus: { kind: 'moduleCost', value: 0.8 } },
    einzelgaenger: { goalZone: 70, reward: 3, bonus: { kind: 'dps', value: 1.5 } },
    leeresUniversum: { goalZone: 65, reward: 2, bonus: { kind: 'production', value: 2 } },
    primzahlwelt: { goalZone: 60, reward: 3, bonus: { kind: 'dps', value: 1.5 } },
    gezeitensperre: { goalZone: 65, reward: 2, bonus: { kind: 'production', value: 2 } },
    monokultur: { goalZone: 70, reward: 3, bonus: { kind: 'dps', value: 1.5 } },
    teilbarkeit: { goalZone: 60, reward: 3, bonus: { kind: 'bossTime', value: 10 } },
    entropie: { goalZone: 65, reward: 2, bonus: { kind: 'levelCost', value: 0.9 } },
    ohneGedaechtnis: { goalZone: 70, reward: 3, bonus: { kind: 'stardust', value: 1.5 } },
    lichtgeschwindigkeit: { goalZone: 65, reward: 3, bonus: { kind: 'offlineLimit', value: 4 * 3600 } },
    derBeweis: { goalZone: 55, reward: 5, bonus: { kind: 'dps', value: 3 } },
  },
  challengeRules: {
    /** Primzahlwelt: Schaden außerhalb von Primzahlzonen */
    nonPrimeDamage: 0.1,
    /** Gezeitensperre: Produktion halbiert sich alle tideSeconds, Reset bei Bosssieg */
    tideSeconds: 60,
    /** Teilbarkeit: Gegnerleben ×hpMult, wenn die Zone nicht durch divisor teilbar ist */
    divisibilityHpMult: 1000,
    divisor: 3,
    /** Entropie: Monster im Team verlieren alle entropySeconds ein Level (mindestens Level 1) */
    entropySeconds: 30,
    /** Lichtgeschwindigkeit: Zeitlimit für den ganzen Durchlauf (Spielzeit, läuft auch offline) */
    lightSpeedSeconds: 6 * 3600,
    /** Einzelgänger: Teamplätze */
    soloSlots: 1,
  },
  constellations: {
    /** Einfache Konstellationen: drei gleiche Typen */
    simpleMult: 1.25,
    /** Versteckte Konstellationen */
    hiddenMult: 1.5,
  },
  theorem: {
    /** Leben des Theorems: hp(hpZone) * hpMult */
    hpZone: 120,
    hpMult: 100,
    timeLimitSeconds: 60,
  },
  /**
   * Endgame nach dem Theorem: Multiversum und unbewiesene Vermutungen.
   * Leben einer Stufe = hp(hpZone) * hpMult * growth^(stufe − 1), im Collatz Labyrinth
   * zusätzlich ×(1 + log2(n)) für die aktuelle Zahl n. timeLimitSeconds gilt je Gegner.
   */
  endgame: {
    hpZone: 120,
    modes: {
      /** Belohnung: Team DPS ×(1 + reward * tiefsteStufe) */
      multiversum: { hpMult: 3000, growth: 1.25, timeLimitSeconds: 30, reward: 0.02 },
      /** Belohnung: Produktion ×(1 + reward * geschaffteStufen) */
      collatz: { hpMult: 100, growth: 1.4, timeLimitSeconds: 10, reward: 0.1 },
      /** Belohnung: Fangchance +reward je Stufe (wie Fangglück) */
      goldbach: { hpMult: 180, growth: 1.5, timeLimitSeconds: 60, reward: 0.02 },
      /** Belohnung: Sternenstaub ×(1 + reward * erreichteNullstellen) */
      riemann: { hpMult: 2000, growth: 1.2, timeLimitSeconds: 30, reward: 0.25 },
    },
    /** Goldbach Arena: so viele Monster auf Primplätzen zählen */
    goldbachPair: 2,
    /** Riemann Spirale: Schaden an Nullstellen */
    zeroDamageMult: 3,
    /** Challengestufen: Zielzone +tierZoneStep je Stufe, jede Stufe über 1 gibt ×tierDpsMult Team DPS */
    tierZoneStep: 10,
    tierDpsMult: 1.25,
    /** Sterne über maxStars: Kopien je weiterem Stern und Bonus je weiterem Stern */
    extraStarCopies: 100,
    extraStarBonus: 0.2,
    /** Polarstern Jagd: alle Polarsterne eines Typs geben diesem Typ ×setMult */
    polarsternSetMult: 1.5,
  },
  /**
   * Mythische Monster und ihre Sonderbedingungen.
   * kind: record (Bestwert einer Endgamestufe), zeros (Nullstellen der Riemann Spirale),
   * collection (gefangene Hauptarten), challengeTier (alle Challenges mindestens auf Stufe value)
   */
  mythic: {
    art_121: { kind: 'record', mode: 'multiversum', value: 13 },
    art_122: { kind: 'record', mode: 'multiversum', value: 21 },
    art_123: { kind: 'zeros', mode: 'riemann', value: 3 },
    art_124: { kind: 'record', mode: 'collatz', value: 10 },
    art_125: { kind: 'zeros', mode: 'riemann', value: 1 },
    art_126: { kind: 'collection', mode: null, value: 120 },
    art_127: { kind: 'record', mode: 'goldbach', value: 8 },
    art_128: { kind: 'challengeTier', mode: null, value: 2 },
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
      seltenheit: { maxLevel: 10, baseCost: 4, perLevel: 0.25 },
      polarstern: { maxLevel: 10, baseCost: 6, perLevel: 0.5 },
      singularitaet: { maxLevel: 1, baseCost: 20, perLevel: 1 },
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
    /** Energie nach jedem Reset (Supernova, Schwarzes Loch, Urknall, Challenge), genug für ein erstes Level */
    resetEnergy: 50,
    /** Gegner, die pro normaler Zone besiegt werden müssen */
    enemiesPerZone: 10,
    /** Zonen pro Sternsystem */
    zonesPerSystem: 10,
  },
} as const;
