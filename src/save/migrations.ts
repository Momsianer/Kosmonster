import { STATE_VERSION } from '../core/state';

/** Roher Speicherstand nach JSON.parse, vor der Umwandlung in Decimal */
export type RawSave = Record<string, unknown> & { version: number };

/**
 * Migrationen in Reihenfolge. Eintrag n hebt einen Speicherstand
 * von Version n auf Version n + 1. Bestehende Einträge nie ändern.
 */
export const MIGRATIONS: Record<number, (save: RawSave) => RawSave> = {
  // 1 → 2: Zonenfortschritt, Farmmodus und Bosszeit
  1: (save) => ({
    ...save,
    version: 2,
    highestZone: typeof save.zone === 'number' ? save.zone : 1,
    killsInZone: 0,
    farming: false,
    bossTimeLeft: 0,
  }),
  // 2 → 3: Einstellungen mit Zahlenformat
  2: (save) => ({
    ...save,
    version: 3,
    settings: { numberFormat: 'standard' },
  }),
};

/** Hebt einen Speicherstand schrittweise auf die aktuelle Version. */
export function migrate(save: RawSave): RawSave {
  let current = save;
  while (current.version < STATE_VERSION) {
    const step = MIGRATIONS[current.version];
    if (!step) throw new Error(`Keine Migration für Version ${current.version}`);
    current = step(current);
  }
  return current;
}
