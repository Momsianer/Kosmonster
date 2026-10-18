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
  // 6 → 7: Sphärentypen, Polarsterne, Euler und Leerlauf
  6: (save) => ({
    ...save,
    version: 7,
    spheres: {
      standard: typeof save.spheres === 'number' ? save.spheres : 0,
      orbit: 0,
      nebel: 0,
      singularitaet: 0,
    },
    collection: Object.fromEntries(
      Object.entries(typeof save.collection === 'object' && save.collection ? save.collection : {}).map(
        ([id, entry]) => [id, { ...(entry as object), shiny: false }],
      ),
    ),
    enemy: typeof save.enemy === 'object' && save.enemy ? { ...save.enemy, shiny: false } : save.enemy,
    cycleStart: 0,
    lastClick: typeof save.playTime === 'number' ? save.playTime : 0,
  }),
  // 7 → 8: Schwarzes Loch, Dunkle Materie, Automatisierung und Brutstation
  7: (save) => ({
    ...save,
    version: 8,
    stardustCycle: typeof save.stardust === 'string' ? save.stardust : '0',
    darkMatter: '0',
    darkMatterTotal: '0',
    blackHoles: 0,
    dmUpgrades: {},
    automation: {
      enabled: {},
      sphereTarget: BALANCING.automation.defaultSphereTarget,
      supernovaTarget: BALANCING.automation.defaultSupernovaTarget,
      clickBudget: 0,
      timer: 0,
      bossWait: 0,
    },
    breeding: [],
    collection: Object.fromEntries(
      Object.entries(typeof save.collection === 'object' && save.collection ? save.collection : {}).map(
        ([id, entry]) => [id, { ...(entry as object), bred: 0 }],
      ),
    ),
  }),
  // 8 → 9: Urknall, Challenges, Konstellationen, Story und Theorem
  8: (save) => ({
    ...save,
    version: 9,
    originPoints: '0',
    originTotal: '0',
    bigBangs: 0,
    originUpgrades: {},
    challenge: { active: null, completed: [], startTime: 0, tideStart: 0, entropyTimer: 0 },
    constellationsFound: [],
    storySeen: [],
    theorem: null,
    theoremDefeated: false,
    automation: {
      ...(typeof save.automation === 'object' && save.automation ? save.automation : {}),
      blackHoleTarget: BALANCING.automation.defaultBlackHoleTarget,
    },
  }),
  // 9 → 10: Sphärenpreise mit Aufschlag je Kauf
  9: (save) => ({
    ...save,
    version: 10,
    spherePressure: { standard: 0, orbit: 0, nebel: 0, singularitaet: 0 },
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
