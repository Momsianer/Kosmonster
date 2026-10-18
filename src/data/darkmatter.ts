/**
 * Upgrades für Dunkle Materie. Zahlenwerte stehen in balancing.ts unter darkMatter.upgrades,
 * Namen und Beschreibungen in de.ts unter darkMatter.<id>.
 */

export const DM_UPGRADE_IDS = [
  'autoklicker', // Stufe 1: autoclickBase Klicks pro Sekunde, jede weitere Stufe +perLevel
  'autolevel', // levelt jede Sekunde das günstigste Monster im Team
  'automodul', // baut jede Sekunde das günstigste Modul
  'autosphaeren', // hält den Vorrat an Standardsphären auf dem eingestellten Wert
  'autoboss', // fordert Bosse nach einem Fehlschlag erneut heraus
  'autosupernova', // löst eine Supernova aus, sobald der Gewinn den Zielwert erreicht
  'teamplaetze', // +perLevel Teamplätze
  'erinnerung', // perLevel * stufe der Forschungsstufen bleiben beim Schwarzen Loch erhalten
  'brutplatz', // +perLevel Brutplätze
] as const;
export type DmUpgradeId = (typeof DM_UPGRADE_IDS)[number];

/** Automatiken in der Reihenfolge, in der sie freigeschaltet werden (CLAUDE.md Abschnitt 9) */
export const AUTOMATION_ORDER = [
  'autoklicker',
  'autolevel',
  'automodul',
  'autosphaeren',
  'autoboss',
  'autosupernova',
] as const satisfies readonly DmUpgradeId[];
export type AutomationId = (typeof AUTOMATION_ORDER)[number];

export function isDmUpgradeId(id: unknown): id is DmUpgradeId {
  return typeof id === 'string' && (DM_UPGRADE_IDS as readonly string[]).includes(id);
}

export function isAutomationId(id: unknown): id is AutomationId {
  return typeof id === 'string' && (AUTOMATION_ORDER as readonly string[]).includes(id);
}

/** Voraussetzung: Automatiken nur in Reihenfolge, die übrigen Upgrades sind frei */
export function dmPrerequisite(id: DmUpgradeId): DmUpgradeId | null {
  const index = (AUTOMATION_ORDER as readonly string[]).indexOf(id);
  return index > 0 ? (AUTOMATION_ORDER[index - 1] ?? null) : null;
}
