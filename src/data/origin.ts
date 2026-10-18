/**
 * Ursprungsupgrades für Ursprungspunkte. Zahlenwerte in balancing.ts unter origin.upgrades,
 * Namen und Beschreibungen in de.ts unter origin.<id>.
 */

export const ORIGIN_IDS = [
  // Universumsregeln
  'automatikBehalten', // gekaufte Automatiken bleiben beim Urknall erhalten
  'autoschwarzloch', // öffnet ein Schwarzes Loch, sobald der Gewinn den Zielwert erreicht
  'urmaterie', // +perLevel Dunkle Materie nach jedem Urknall
  'sternenquelle', // Sternenstaub ×(1 + perLevel * stufe)
  'urkraft', // Team DPS ×(1 + perLevel * stufe)
  'urproduktion', // Produktion ×(1 + perLevel * stufe)
  'fruehesupernova', // Supernova schon perLevel * stufe Zonen früher
  // Konstellationsbaum
  'sternbilder', // Bonus aller Konstellationen +perLevel * stufe (auf den Anteil über 1)
  'sternkarte', // zeigt die Bedingungen versteckter Konstellationen
] as const;
export type OriginId = (typeof ORIGIN_IDS)[number];

export const UNIVERSE_RULES: readonly OriginId[] = [
  'automatikBehalten',
  'autoschwarzloch',
  'urmaterie',
  'sternenquelle',
  'urkraft',
  'urproduktion',
  'fruehesupernova',
];
export const CONSTELLATION_TREE: readonly OriginId[] = ['sternbilder', 'sternkarte'];

export function isOriginId(id: unknown): id is OriginId {
  return typeof id === 'string' && (ORIGIN_IDS as readonly string[]).includes(id);
}
