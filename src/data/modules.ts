/**
 * Module der Raumstation. Namen liegen in src/i18n/de.ts unter station.<id>.name.
 */

export const MODULE_IDS = [
  'solarpanel',
  'asteroidenbohrer',
  'fusionsreaktor',
  'dysonring',
  'pulsarsammler',
  'quasarspiegel',
  'wurmlochpumpe',
  'zeitkristall',
] as const;
export type ModuleId = (typeof MODULE_IDS)[number];

export interface ModuleData {
  id: ModuleId;
  /** Kosten des ersten Moduls */
  baseCost: number;
  /** Energie pro Sekunde je Modul ohne Multiplikatoren */
  production: number;
}

export const MODULES: readonly ModuleData[] = [
  { id: 'solarpanel', baseCost: 15, production: 0.1 },
  { id: 'asteroidenbohrer', baseCost: 100, production: 1 },
  { id: 'fusionsreaktor', baseCost: 1_100, production: 8 },
  { id: 'dysonring', baseCost: 12_000, production: 47 },
  { id: 'pulsarsammler', baseCost: 130_000, production: 260 },
  { id: 'quasarspiegel', baseCost: 1.4e6, production: 1_400 },
  { id: 'wurmlochpumpe', baseCost: 2e7, production: 7_800 },
  { id: 'zeitkristall', baseCost: 3.3e8, production: 44_000 },
];

const BY_ID = new Map<string, ModuleData>(MODULES.map((m) => [m.id, m]));

export function getModule(id: string): ModuleData | undefined {
  return BY_ID.get(id);
}

export function isModuleId(id: unknown): id is ModuleId {
  return typeof id === 'string' && BY_ID.has(id);
}
