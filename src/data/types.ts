/** Die 8 mathematischen Monstertypen (eigene Datei, damit Planeten und Monster sich nicht gegenseitig brauchen) */
export const MONSTER_TYPES = ['prim', 'fibonacci', 'pi', 'euler', 'null', 'unendlich', 'fraktal', 'vektor'] as const;
export type MonsterType = (typeof MONSTER_TYPES)[number];
