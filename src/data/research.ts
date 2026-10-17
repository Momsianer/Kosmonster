/**
 * Forschungsbaum (Sternenstaub). Zahlenwerte stehen in balancing.ts unter research.nodes,
 * Namen und Beschreibungen in de.ts unter research.<id>.
 * Jeder Knoten setzt den vorigen Knoten seines Asts (mindestens Stufe 1) voraus.
 */

export const RESEARCH_BRANCHES = ['combat', 'collect', 'station', 'time'] as const;
export type ResearchBranch = (typeof RESEARCH_BRANCHES)[number];

export const RESEARCH_IDS = [
  // Kampf
  'klickkraft', // +perLevel Klickbonus
  'teamstaerke', // Team DPS ×(1 + perLevel * stufe)
  'kritchance', // +perLevel Chance auf kritische Klicks
  'kritschaden', // +perLevel auf den Multiplikator kritischer Klicks
  'bosszeit', // +perLevel Sekunden Zeitlimit gegen Bosse
  'bossschaden', // Schaden gegen Bosse ×(1 + perLevel * stufe)
  // Sammeln
  'fangglueck', // +perLevel Forschungsbonus auf die Fangchance
  'sphaerenrabatt', // Sphärenpreis ×(1 − perLevel * stufe)
  'teamplatz', // +perLevel Teamplätze
  'startsphaeren', // +perLevel Fangsphären nach jeder Supernova
  'seltenheit', // Spawngewicht seltener und epischer Arten ×(1 + perLevel * stufe)
  'polarstern', // Polarsternchance ×(1 + perLevel * stufe)
  // Station
  'produktion', // Produktion ×(1 + perLevel * stufe)
  'modulrabatt', // Modulkosten ×(1 − perLevel * stufe)
  'umwandlung', // perLevel * stufe der Produktion zusätzlich als Team DPS
  // Zeit
  'offlinebonus', // +perLevel * stufe zusätzliche Energie aus Offlinezeit
  'offlinelimit', // +perLevel Sekunden Offlinelimit
  'startzone', // Start nach Supernova perLevel * stufe Zonen weiter
] as const;
export type ResearchId = (typeof RESEARCH_IDS)[number];

export const RESEARCH_TREE: Record<ResearchBranch, readonly ResearchId[]> = {
  combat: ['klickkraft', 'teamstaerke', 'kritchance', 'kritschaden', 'bosszeit', 'bossschaden'],
  collect: ['fangglueck', 'sphaerenrabatt', 'teamplatz', 'startsphaeren', 'seltenheit', 'polarstern'],
  station: ['produktion', 'modulrabatt', 'umwandlung'],
  time: ['offlinebonus', 'offlinelimit', 'startzone'],
};

export function isResearchId(id: unknown): id is ResearchId {
  return typeof id === 'string' && (RESEARCH_IDS as readonly string[]).includes(id);
}

/** Der Knoten, der vorher mindestens Stufe 1 haben muss, oder null für den ersten im Ast */
export function researchPrerequisite(id: ResearchId): ResearchId | null {
  for (const nodes of Object.values(RESEARCH_TREE)) {
    const index = nodes.indexOf(id);
    if (index > 0) return nodes[index - 1] ?? null;
    if (index === 0) return null;
  }
  return null;
}
