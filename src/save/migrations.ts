import { STATE_VERSION } from '../core/state';
import { BALANCING } from '../data/balancing';

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
  // 3 → 4: Monster, Sammlung, Team, Fangsphären, Zufall, Hinweise und Fangeinstellung.
  // Der Gegner bekommt beim Laden eine Art (siehe hydrate).
  3: (save) => ({
    ...save,
    version: 4,
    spheres: BALANCING.catching.startSpheres,
    collection: {},
    team: [],
    rngState: typeof save.lastTick === 'number' ? save.lastTick | 0 : 1,
    lastCatch: null,
    hintsSeen: [],
    settings: { ...(typeof save.settings === 'object' ? save.settings : {}), catchOnlyNew: true },
  }),
  // 4 → 5: Module der Raumstation
  4: (save) => ({
    ...save,
    version: 5,
    modules: {},
  }),
  // 5 → 6: Supernova, Sternenstaub, Forschung und Evolution
  5: (save) => ({
    ...save,
    version: 6,
    cycleEnergy: typeof save.totalEnergy === 'string' ? save.totalEnergy : '0',
    stardust: '0',
    supernovas: 0,
    research: {},
    collection: Object.fromEntries(
      Object.entries(typeof save.collection === 'object' && save.collection ? save.collection : {}).map(
        ([id, entry]) => [id, { ...(entry as object), evolution: 0 }],
      ),
    ),
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
