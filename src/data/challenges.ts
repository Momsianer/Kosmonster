/**
 * Challenges (CLAUDE.md Abschnitt 12). Werte in balancing.ts unter challenges und challengeRules,
 * Namen und Beschreibungen in de.ts unter challenge.<id>.
 */

export const CHALLENGE_IDS = [
  'stilleHaende', // Klicken deaktiviert
  'quadratisch', // Kosten wachsen mit r^(n²) statt r^n
  'einzelgaenger', // nur 1 Teamplatz
  'leeresUniversum', // keine Raumstation
  'primzahlwelt', // Schaden fast nur in Primzahlzonen
  'gezeitensperre', // Produktion halbiert sich alle 60 Sekunden, Reset bei Bosssieg
  'monokultur', // nur ein Typ im Team
  'teilbarkeit', // Gegnerleben ×1000, wenn die Zone nicht durch 3 teilbar ist
  'entropie', // Monsterlevel sinken langsam
  'ohneGedaechtnis', // Forschungsbaum deaktiviert
  'lichtgeschwindigkeit', // Zeitlimit für den ganzen Durchlauf
  'derBeweis', // Einschränkungen 1 bis 4 gleichzeitig
] as const;
export type ChallengeId = (typeof CHALLENGE_IDS)[number];

export type ChallengeRule =
  | 'noClick'
  | 'quadraticCost'
  | 'solo'
  | 'noStation'
  | 'primeWorld'
  | 'tide'
  | 'monoculture'
  | 'divisibility'
  | 'entropy'
  | 'noResearch'
  | 'lightSpeed';

/** Welche Regeln eine Challenge aktiviert */
export const CHALLENGE_RULES: Record<ChallengeId, readonly ChallengeRule[]> = {
  stilleHaende: ['noClick'],
  quadratisch: ['quadraticCost'],
  einzelgaenger: ['solo'],
  leeresUniversum: ['noStation'],
  primzahlwelt: ['primeWorld'],
  gezeitensperre: ['tide'],
  monokultur: ['monoculture'],
  teilbarkeit: ['divisibility'],
  entropie: ['entropy'],
  ohneGedaechtnis: ['noResearch'],
  lichtgeschwindigkeit: ['lightSpeed'],
  derBeweis: ['noClick', 'quadraticCost', 'solo', 'noStation'],
};

export function isChallengeId(id: unknown): id is ChallengeId {
  return typeof id === 'string' && (CHALLENGE_IDS as readonly string[]).includes(id);
}
